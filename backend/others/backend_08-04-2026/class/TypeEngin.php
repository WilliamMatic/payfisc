<?php
require_once 'Connexion.php';

/**
 * Classe TypeEngin - Gestion complète des types d'engins
 * 
 * Cette classe étend la classe Connexion et fournit toutes les fonctionnalités
 * de gestion des types d'engins, incluant :
 * - Création, modification, suppression et activation/désactivation des types d'engins
 * - Logs d'audit pour toutes les opérations
 */
class TypeEngin extends Connexion
{
    /**
     * Vérifie l'existence d'un type d'engin par son libellé
     *
     * @param string $libelle Libellé à vérifier
     * @param int $excludeId ID à exclure (pour la modification)
     * @return array|false Données du type d'engin si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function typeEnginExiste($libelle, $excludeId = null)
    {
        try {
            $sql = "SELECT id, libelle, description, actif FROM type_engins WHERE libelle = :libelle";
            $params = ['libelle' => $libelle];
            
            if ($excludeId !== null) {
                $sql .= " AND id != :exclude_id";
                $params['exclude_id'] = $excludeId;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence du type d'engin: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'un type d'engin par son ID
     *
     * @param int $id ID du type d'engin
     * @return array|false Données complètes du type d'engin si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function typeEnginExisteParId($id)
    {
        try {
            $sql = "SELECT * FROM type_engins WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du type d'engin par ID: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Ajoute un nouveau type d'engin au système
     *
     * @param string $libelle Libellé du type d'engin
     * @param string $description Description du type d'engin
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function ajouterTypeEngin($libelle, $description = '')
    {
        // ============ VALIDATION DES DONNÉES ============
        if (empty($libelle)) {
            return ["status" => "error", "message" => "Le libellé est obligatoire."];
        }

        if (strlen($libelle) > 100) {
            return ["status" => "error", "message" => "Le libellé ne doit pas dépasser 100 caractères."];
        }

        if ($this->typeEnginExiste($libelle)) {
            return ["status" => "error", "message" => "Ce libellé est déjà utilisé."];
        }

        // ============ TRAITEMENT PRINCIPAL ============
        try {
            $sql = "INSERT INTO type_engins (libelle, description) 
                    VALUES (:libelle, :description)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':libelle' => $libelle,
                ':description' => $description
            ]);

            $typeEnginId = $this->pdo->lastInsertId();

            // Log d'audit
            $this->logAudit("Ajout du type d'engin ID $typeEnginId: $libelle");

            return ["status" => "success", "message" => "Type d'engin ajouté avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de l'ajout du type d'engin: " . $e->getMessage());
            
            if ($e->getCode() == '23000') {
                return ["status" => "error", "message" => "Ce libellé est déjà utilisé."];
            }
            
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Modifie les informations d'un type d'engin existant
     *
     * @param int $id ID du type d'engin à modifier
     * @param string $libelle Nouveau libellé
     * @param string $description Nouvelle description
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function modifierTypeEngin($id, $libelle, $description = '')
    {
        // Validation des champs obligatoires
        if (empty($libelle)) {
            return ["status" => "error", "message" => "Le libellé est obligatoire."];
        }

        if (strlen($libelle) > 100) {
            return ["status" => "error", "message" => "Le libellé ne doit pas dépasser 100 caractères."];
        }

        try {
            // Vérification de l'unicité du nouveau libellé
            if ($this->typeEnginExiste($libelle, $id)) {
                return ["status" => "error", "message" => "Ce libellé est déjà utilisé par un autre type d'engin."];
            }

            // Mise à jour des informations
            $sql = "UPDATE type_engins 
                    SET libelle = :libelle, 
                        description = :description,
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':libelle' => $libelle,
                ':description' => $description,
                ':id' => $id
            ]);

            // Log d'audit
            $this->logAudit("Modification du type d'engin ID $id: $libelle");

            return ["status" => "success", "message" => "Les informations du type d'engin ont été mises à jour."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification du type d'engin: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime un type d'engin du système
     *
     * @param int $id ID du type d'engin à supprimer
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function supprimerTypeEngin($id)
    {
        // Vérification de l'existence du type d'engin
        $typeEngin = $this->typeEnginExisteParId($id);
        if (!$typeEngin) {
            return ["status" => "error", "message" => "Le type d'engin spécifié n'existe pas."];
        }

        // Vérification si le type d'engin est utilisé dans d'autres tables
        if ($this->estTypeEnginUtilise($id)) {
            return ["status" => "error", "message" => "Impossible de supprimer ce type d'engin car il est utilisé dans le système."];
        }

        try {
            // Suppression du type d'engin
            $sql = "DELETE FROM type_engins WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);

            // Log d'audit
            $this->logAudit("Suppression du type d'engin ID $id: " . $typeEngin['libelle']);

            return ["status" => "success", "message" => "Le type d'engin a été supprimé avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression du type d'engin: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Vérifie si un type d'engin est utilisé dans d'autres tables
     *
     * @param int $typeEnginId ID du type d'engin
     * @return bool True si utilisé, false sinon
     */
    private function estTypeEnginUtilise($typeEnginId)
    {
        // Liste des tables qui pourraient référencer les types d'engins
        $tables = ['engins', 'vehicules', 'motos']; // À adapter selon votre schéma

        foreach ($tables as $table) {
            try {
                $sql = "SELECT COUNT(*) as count FROM $table WHERE type_engin_id = :type_engin_id";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([':type_engin_id' => $typeEnginId]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($result && $result['count'] > 0) {
                    return true;
                }
            } catch (PDOException $e) {
                // La table n'existe peut-être pas, on continue
                continue;
            }
        }

        return false;
    }

    /**
     * Change le statut actif/inactif d'un type d'engin
     *
     * @param int $id ID du type d'engin
     * @param bool $actif Nouveau statut (true = actif, false = inactif)
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function changerStatutTypeEngin($id, $actif)
    {
        // Vérification de l'existence du type d'engin
        $typeEngin = $this->typeEnginExisteParId($id);
        if (!$typeEngin) {
            return ["status" => "error", "message" => "Le type d'engin spécifié n'existe pas."];
        }

        try {
            $sql = "UPDATE type_engins 
                    SET actif = :actif, 
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);

            // Convertir en entier et binder comme INT
            $actifInt = $actif ? 1 : 0;
            $stmt->bindValue(':actif', $actifInt, PDO::PARAM_INT);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);

            $stmt->execute();

            $statut = $actifInt === 1 ? "activé" : "désactivé";
            $this->logAudit("Changement de statut du type d'engin ID $id: " . $typeEngin['libelle'] . ' -> ' . $statut);

            return ["status" => "success", "message" => "Le type d'engin a été $statut avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors du changement de statut du type d'engin: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de tous les types d'engins
     *
     * @return array Liste des types d'engins ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerTypeEngins()
    {
        try {
            $sql = "SELECT id, libelle, description, actif, 
                    DATE_FORMAT(date_creation, '%d/%m/%Y') as date_creation 
                    FROM type_engins 
                    ORDER BY libelle ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des types d'engins: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère les types d'engins actifs (pour les dropdowns)
     *
     * @return array Liste des types d'engins actifs
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerTypeEnginsActifs()
    {
        try {
            $sql = "SELECT id, libelle, description 
                    FROM type_engins 
                    WHERE actif = 1 
                    ORDER BY libelle ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des types d'engins actifs: " . $e->getMessage());
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