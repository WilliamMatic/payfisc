<?php
require_once 'Connexion.php';

/**
 * Classe EnginCouleur - Gestion complète des couleurs d'engins
 * 
 * Cette classe étend la classe Connexion et fournit toutes les fonctionnalités
 * de gestion des couleurs d'engins, incluant :
 * - Création, modification, suppression et activation/désactivation des couleurs
 * - Validation des codes hexadécimaux
 * - Logs d'audit pour toutes les opérations
 */
class EnginCouleur extends Connexion
{
    /**
     * Vérifie l'existence d'une couleur par son nom
     *
     * @param string $nom Nom à vérifier
     * @return array|false Données de la couleur si trouvée, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function couleurExiste($nom)
    {
        try {
            $sql = "SELECT id, nom, code_hex, actif FROM engin_couleurs WHERE nom = :nom";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['nom' => $nom]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence de la couleur: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'une couleur par son code hexadécimal
     *
     * @param string $codeHex Code hexadécimal à vérifier
     * @return array|false Données de la couleur si trouvée, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function couleurExisteParCodeHex($codeHex)
    {
        try {
            $sql = "SELECT id, nom, code_hex, actif FROM engin_couleurs WHERE code_hex = :code_hex";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['code_hex' => $codeHex]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de la couleur par code hex: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'une couleur par son ID
     *
     * @param int $id ID de la couleur
     * @return array|false Données complètes de la couleur si trouvée, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function couleurExisteParId($id)
    {
        try {
            $sql = "SELECT * FROM engin_couleurs WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de la couleur par ID: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Valide un code hexadécimal de couleur
     *
     * @param string $codeHex Code hexadécimal à valider
     * @return bool True si valide, false sinon
     */
    private function validerCodeHex($codeHex)
    {
        return preg_match('/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/', $codeHex) === 1;
    }

    /**
     * Ajoute une nouvelle couleur d'engin
     *
     * @param string $nom Nom de la couleur
     * @param string $codeHex Code hexadécimal (#FFFFFF)
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function ajouterCouleur($nom, $codeHex)
    {
        // ============ VALIDATION DES DONNÉES ============
        if (empty($nom) || empty($codeHex)) {
            return ["status" => "error", "message" => "Tous les champs sont obligatoires."];
        }

        // Validation du code hexadécimal
        if (!$this->validerCodeHex($codeHex)) {
            return ["status" => "error", "message" => "Le code couleur n'est pas valide. Format attendu: #FFFFFF ou #FFF"];
        }

        // Vérification de l'unicité du nom
        if ($this->couleurExiste($nom)) {
            return ["status" => "error", "message" => "Cette couleur existe déjà."];
        }

        // Vérification de l'unicité du code hexadécimal
        if ($this->couleurExisteParCodeHex($codeHex)) {
            return ["status" => "error", "message" => "Ce code couleur est déjà utilisé."];
        }

        // ============ TRAITEMENT PRINCIPAL ============
        try {
            $sql = "INSERT INTO engin_couleurs (nom, code_hex) 
                    VALUES (:nom, :code_hex)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom' => $nom,
                ':code_hex' => strtoupper($codeHex)
            ]);

            $couleurId = $this->pdo->lastInsertId();

            // Log d'audit
            $this->logAudit("Ajout de la couleur ID $couleurId: $nom ($codeHex)");

            return ["status" => "success", "message" => "Couleur ajoutée avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de l'ajout de la couleur: " . $e->getMessage());
            
            if ($e->getCode() == '23000') {
                return ["status" => "error", "message" => "Cette couleur ou ce code existe déjà."];
            }
            
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Modifie les informations d'une couleur existante
     *
     * @param int $id ID de la couleur à modifier
     * @param string $nom Nouveau nom
     * @param string $codeHex Nouveau code hexadécimal
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function modifierCouleur($id, $nom, $codeHex)
    {
        // Validation des champs obligatoires
        if (empty($nom) || empty($codeHex)) {
            return ["status" => "error", "message" => "Tous les champs sont obligatoires."];
        }

        // Validation du code hexadécimal
        if (!$this->validerCodeHex($codeHex)) {
            return ["status" => "error", "message" => "Le code couleur n'est pas valide. Format attendu: #FFFFFF ou #FFF"];
        }

        try {
            // Vérification de l'unicité du nouveau nom
            $sqlCheckNom = "SELECT id FROM engin_couleurs WHERE nom = :nom AND id != :id";
            $stmtCheckNom = $this->pdo->prepare($sqlCheckNom);
            $stmtCheckNom->execute([':nom' => $nom, ':id' => $id]);

            if ($stmtCheckNom->rowCount() > 0) {
                return ["status" => "error", "message" => "Ce nom de couleur est déjà utilisé."];
            }

            // Vérification de l'unicité du nouveau code hexadécimal
            $sqlCheckCode = "SELECT id FROM engin_couleurs WHERE code_hex = :code_hex AND id != :id";
            $stmtCheckCode = $this->pdo->prepare($sqlCheckCode);
            $stmtCheckCode->execute([':code_hex' => strtoupper($codeHex), ':id' => $id]);

            if ($stmtCheckCode->rowCount() > 0) {
                return ["status" => "error", "message" => "Ce code couleur est déjà utilisé."];
            }

            // Mise à jour des informations
            $sql = "UPDATE engin_couleurs 
                    SET nom = :nom, 
                        code_hex = :code_hex,
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom' => $nom,
                ':code_hex' => strtoupper($codeHex),
                ':id' => $id
            ]);

            // Log d'audit
            $this->logAudit("Modification de la couleur ID $id: $nom ($codeHex)");

            return ["status" => "success", "message" => "Les informations de la couleur ont été mises à jour."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification de la couleur: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime une couleur d'engin
     *
     * @param int $id ID de la couleur à supprimer
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function supprimerCouleur($id)
    {
        // Vérification de l'existence de la couleur
        $couleur = $this->couleurExisteParId($id);
        if (!$couleur) {
            return ["status" => "error", "message" => "La couleur spécifiée n'existe pas."];
        }

        try {
            // Vérification si la couleur est utilisée par des engins
            $sqlCheckUsage = "SELECT COUNT(*) as count FROM engins WHERE couleur = :nom_couleur";
            $stmtCheck = $this->pdo->prepare($sqlCheckUsage);
            $stmtCheck->execute(['nom_couleur' => $couleur['nom']]);
            $usage = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if ($usage['count'] > 0) {
                return ["status" => "error", "message" => "Impossible de supprimer cette couleur car elle est utilisée par des engins."];
            }

            // Suppression de la couleur
            $sql = "DELETE FROM engin_couleurs WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);

            // Log d'audit
            $this->logAudit("Suppression de la couleur ID $id: " . $couleur['nom'] . ' (' . $couleur['code_hex'] . ')');

            return ["status" => "success", "message" => "La couleur a été supprimée avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de la couleur: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Change le statut actif/inactif d'une couleur
     *
     * @param int $id ID de la couleur
     * @param bool $actif Nouveau statut (true = actif, false = inactif)
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function changerStatutCouleur($id, $actif)
    {
        // Vérification de l'existence de la couleur
        $couleur = $this->couleurExisteParId($id);
        if (!$couleur) {
            return ["status" => "error", "message" => "La couleur spécifiée n'existe pas."];
        }

        try {
            $sql = "UPDATE engin_couleurs 
                    SET actif = :actif, 
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);

            // Convertir en entier et binder comme INT
            $actifInt = $actif ? 1 : 0;
            $stmt->bindValue(':actif', $actifInt, PDO::PARAM_INT);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);

            $stmt->execute();

            $statut = $actifInt === 1 ? "activée" : "désactivée";
            $this->logAudit("Changement de statut de la couleur ID $id: " . $couleur['nom'] . ' -> ' . $statut);

            return ["status" => "success", "message" => "La couleur a été $statut avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors du changement de statut de la couleur: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de toutes les couleurs
     *
     * @return array Liste des couleurs ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerCouleurs()
    {
        try {
            $sql = "SELECT id, nom, code_hex, actif, 
                    DATE_FORMAT(date_creation, '%d/%m/%Y') as date_creation 
                    FROM engin_couleurs 
                    ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des couleurs: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste des couleurs actives
     *
     * @return array Liste des couleurs actives ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerCouleursActives()
    {
        try {
            $sql = "SELECT id, nom, code_hex 
                    FROM engin_couleurs 
                    WHERE actif = 1 
                    ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des couleurs actives: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Log une action dans le journal d'audit
     *
     * @param string $message Message à logger
     * @return void
     */
    public function logAudit($message)
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