<?php
require_once 'Connexion.php';

/**
 * Classe Energie - Gestion complète des types d'énergie
 * 
 * Cette classe étend la classe Connexion et fournit toutes les fonctionnalités
 * de gestion des énergies (essence, diesel, électrique, etc.)
 */
class Energie extends Connexion
{
    /**
     * Vérifie l'existence d'une énergie par son nom
     *
     * @param string $nom Nom à vérifier
     * @param int $excludeId ID à exclure (pour la modification)
     * @return array|false Données de l'énergie si trouvée, false sinon
     */
    public function energieExiste($nom, $excludeId = null)
    {
        try {
            $sql = "SELECT id, nom, description, couleur, actif FROM energies WHERE nom = :nom";
            $params = ['nom' => $nom];
            
            if ($excludeId !== null) {
                $sql .= " AND id != :exclude_id";
                $params['exclude_id'] = $excludeId;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence de l'énergie: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'une énergie par son ID
     *
     * @param int $id ID de l'énergie
     * @return array|false Données complètes de l'énergie si trouvée, false sinon
     */
    public function energieExisteParId($id)
    {
        try {
            $sql = "SELECT * FROM energies WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'énergie par ID: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Ajoute une nouvelle énergie
     *
     * @param string $nom Nom de l'énergie
     * @param string $description Description de l'énergie
     * @param string $couleur Code couleur hexadécimal
     * @return array Tableau avec statut et message
     */
    public function ajouterEnergie($nom, $description = '', $couleur = '#6B7280')
    {
        // Validation des données
        if (empty($nom)) {
            return ["status" => "error", "message" => "Le nom est obligatoire."];
        }

        if (!preg_match('/^#[0-9A-F]{6}$/i', $couleur)) {
            return ["status" => "error", "message" => "Le format de couleur est invalide."];
        }

        if ($this->energieExiste($nom)) {
            return ["status" => "error", "message" => "Cette énergie existe déjà."];
        }

        try {
            $sql = "INSERT INTO energies (nom, description, couleur) 
                    VALUES (:nom, :description, :couleur)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom' => $nom,
                ':description' => $description,
                ':couleur' => $couleur
            ]);

            $energieId = $this->pdo->lastInsertId();

            // Log d'audit
            $this->logAudit("Ajout de l'énergie ID $energieId: $nom");

            return ["status" => "success", "message" => "Énergie ajoutée avec succès.", "id" => $energieId];

        } catch (PDOException $e) {
            error_log("Erreur lors de l'ajout de l'énergie: " . $e->getMessage());
            
            if ($e->getCode() == '23000') {
                return ["status" => "error", "message" => "Cette énergie existe déjà."];
            }
            
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Modifie une énergie existante
     *
     * @param int $id ID de l'énergie à modifier
     * @param string $nom Nouveau nom
     * @param string $description Nouvelle description
     * @param string $couleur Nouvelle couleur
     * @return array Tableau avec statut et message
     */
    public function modifierEnergie($id, $nom, $description = '', $couleur = '#6B7280')
    {
        if (empty($nom)) {
            return ["status" => "error", "message" => "Le nom est obligatoire."];
        }

        if (!preg_match('/^#[0-9A-F]{6}$/i', $couleur)) {
            return ["status" => "error", "message" => "Le format de couleur est invalide."];
        }

        try {
            // Vérification de l'unicité du nom
            if ($this->energieExiste($nom, $id)) {
                return ["status" => "error", "message" => "Cette énergie existe déjà."];
            }

            $sql = "UPDATE energies 
                    SET nom = :nom, 
                        description = :description,
                        couleur = :couleur,
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom' => $nom,
                ':description' => $description,
                ':couleur' => $couleur,
                ':id' => $id
            ]);

            $this->logAudit("Modification de l'énergie ID $id: $nom");

            return ["status" => "success", "message" => "Énergie modifiée avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification de l'énergie: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime une énergie
     *
     * @param int $id ID de l'énergie à supprimer
     * @return array Tableau avec statut et message
     */
    public function supprimerEnergie($id)
    {
        $energie = $this->energieExisteParId($id);
        if (!$energie) {
            return ["status" => "error", "message" => "L'énergie spécifiée n'existe pas."];
        }

        try {
            // Vérifier si l'énergie est utilisée par des engins
            $sqlCheck = "SELECT COUNT(*) as count FROM engins WHERE energie = :libelle";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([':libelle' => $energie['nom']]);
            $result = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if ($result['count'] > 0) {
                return ["status" => "error", "message" => "Impossible de supprimer cette énergie car elle est utilisée par des engins."];
            }

            $sql = "DELETE FROM energies WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);

            $this->logAudit("Suppression de l'énergie ID $id: " . $energie['nom']);

            return ["status" => "success", "message" => "Énergie supprimée avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de l'énergie: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Change le statut actif/inactif d'une énergie
     *
     * @param int $id ID de l'énergie
     * @param bool $actif Nouveau statut
     * @return array Tableau avec statut et message
     */
    public function changerStatutEnergie($id, $actif)
    {
        $energie = $this->energieExisteParId($id);
        if (!$energie) {
            return ["status" => "error", "message" => "L'énergie spécifiée n'existe pas."];
        }

        try {
            $sql = "UPDATE energies 
                    SET actif = :actif, 
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);

            $actifInt = $actif ? 1 : 0;
            $stmt->bindValue(':actif', $actifInt, PDO::PARAM_INT);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);

            $stmt->execute();

            $statut = $actifInt === 1 ? "activée" : "désactivée";
            $this->logAudit("Changement de statut de l'énergie ID $id: " . $energie['nom'] . ' -> ' . $statut);

            return ["status" => "success", "message" => "L'énergie a été $statut avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors du changement de statut de l'énergie: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de toutes les énergies
     *
     * @return array Liste des énergies ou message d'erreur
     */
    public function listerEnergies()
    {
        try {
            $sql = "SELECT id, nom, description, couleur, actif, 
                    DATE_FORMAT(date_creation, '%d/%m/%Y') as date_creation 
                    FROM energies 
                    ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des énergies: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de toutes les énergies actifs
     *
     * @return array Liste des énergies actifs ou message d'erreur
     */
    public function listerEnergiesActifs()
    {
        try {
            $sql = "SELECT id, nom, description, couleur, actif, 
                    DATE_FORMAT(date_creation, '%d/%m/%Y') as date_creation 
                    FROM energies 
                    WHERE actif = 1
                    ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des énergies: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère les énergies actives seulement
     *
     * @return array Liste des énergies actives
     */
    public function listerEnergiesActives()
    {
        try {
            $sql = "SELECT id, nom, description, couleur 
                    FROM energies 
                    WHERE actif = 1 
                    ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des énergies actives: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Log une action dans le journal d'audit
     *
     * @param string $message Message à logger
     * @return void
     */
    private function logAudit($message)
    {
        $userId = $_SESSION['user_id'] ?? 'system';
        $userType = $_SESSION['user_type'] ?? 'system';
        
        $sql = "INSERT INTO audit_log (user_id, user_type, action, timestamp) 
                VALUES (:user_id, :user_type, :action, NOW())";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':user_type' => $userType,
            ':action' => $message
        ]);
    }
}