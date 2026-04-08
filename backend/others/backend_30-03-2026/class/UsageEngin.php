<?php
require_once 'Connexion.php';

/**
 * Classe UsageEngin - Gestion complète des usages d'engins
 * 
 * Cette classe étend la classe Connexion et fournit toutes les fonctionnalités
 * de gestion des usages d'engins (taxi, personnel, etc.)
 */
class UsageEngin extends Connexion
{
    /**
     * Vérifie l'existence d'un usage par son code
     *
     * @param string $code Code à vérifier
     * @return array|false Données de l'usage si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function usageExiste($code)
    {
        try {
            $sql = "SELECT id, code, libelle, description, actif FROM usages_engins WHERE code = :code";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['code' => $code]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence de l'usage: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'un usage par son ID
     *
     * @param int $id ID de l'usage
     * @return array|false Données complètes de l'usage si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function usageExisteParId($id)
    {
        try {
            $sql = "SELECT * FROM usages_engins WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'usage par ID: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Ajoute un nouvel usage d'engin
     *
     * @param string $code Code unique de l'usage
     * @param string $libelle Libellé de l'usage
     * @param string $description Description de l'usage
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function ajouterUsage($code, $libelle, $description = '')
    {
        // ============ VALIDATION DES DONNÉES ============
        if (empty($code) || empty($libelle)) {
            return ["status" => "error", "message" => "Le code et le libellé sont obligatoires."];
        }

        if (strlen($code) > 20) {
            return ["status" => "error", "message" => "Le code ne doit pas dépasser 20 caractères."];
        }

        if (strlen($libelle) > 100) {
            return ["status" => "error", "message" => "Le libellé ne doit pas dépasser 100 caractères."];
        }

        if ($this->usageExiste($code)) {
            return ["status" => "error", "message" => "Ce code d'usage est déjà utilisé."];
        }

        // ============ TRAITEMENT PRINCIPAL ============
        try {
            $sql = "INSERT INTO usages_engins (code, libelle, description) 
                    VALUES (:code, :libelle, :description)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':code' => $code,
                ':libelle' => $libelle,
                ':description' => $description
            ]);

            $usageId = $this->pdo->lastInsertId();

            // Log d'audit
            $this->logAudit("Ajout de l'usage d'engin ID $usageId: $code - $libelle");

            return ["status" => "success", "message" => "Usage d'engin ajouté avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de l'ajout de l'usage d'engin: " . $e->getMessage());
            
            if ($e->getCode() == '23000') {
                return ["status" => "error", "message" => "Ce code d'usage est déjà utilisé."];
            }
            
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Modifie les informations d'un usage existant
     *
     * @param int $id ID de l'usage à modifier
     * @param string $code Nouveau code
     * @param string $libelle Nouveau libellé
     * @param string $description Nouvelle description
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function modifierUsage($id, $code, $libelle, $description = '')
    {
        // Validation des champs obligatoires
        if (empty($code) || empty($libelle)) {
            return ["status" => "error", "message" => "Le code et le libellé sont obligatoires."];
        }

        if (strlen($code) > 20) {
            return ["status" => "error", "message" => "Le code ne doit pas dépasser 20 caractères."];
        }

        if (strlen($libelle) > 100) {
            return ["status" => "error", "message" => "Le libellé ne doit pas dépasser 100 caractères."];
        }

        try {
            // Vérification de l'unicité du nouveau code
            $sqlCheck = "SELECT id FROM usages_engins WHERE code = :code AND id != :id";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([':code' => $code, ':id' => $id]);

            if ($stmtCheck->rowCount() > 0) {
                return ["status" => "error", "message" => "Ce code d'usage est déjà utilisé par un autre usage."];
            }

            // Mise à jour des informations
            $sql = "UPDATE usages_engins 
                    SET code = :code, 
                        libelle = :libelle, 
                        description = :description,
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':code' => $code,
                ':libelle' => $libelle,
                ':description' => $description,
                ':id' => $id
            ]);

            // Log d'audit
            $this->logAudit("Modification de l'usage d'engin ID $id: $code - $libelle");

            return ["status" => "success", "message" => "Les informations de l'usage ont été mises à jour."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification de l'usage d'engin: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime un usage d'engin
     *
     * @param int $id ID de l'usage à supprimer
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function supprimerUsage($id)
    {
        // Vérification de l'existence de l'usage
        $usage = $this->usageExisteParId($id);
        if (!$usage) {
            return ["status" => "error", "message" => "L'usage spécifié n'existe pas."];
        }

        // Vérification si l'usage est utilisé dans d'autres tables
        if ($this->estUsageUtilise($id)) {
            return ["status" => "error", "message" => "Cet usage est utilisé dans le système et ne peut pas être supprimé."];
        }

        try {
            // Suppression de l'usage
            $sql = "DELETE FROM usages_engins WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);

            // Log d'audit
            $this->logAudit("Suppression de l'usage d'engin ID $id: " . $usage['code'] . ' - ' . $usage['libelle']);

            return ["status" => "success", "message" => "L'usage a été supprimé avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de l'usage d'engin: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Vérifie si un usage est utilisé dans d'autres tables
     *
     * @param int $usageId ID de l'usage
     * @return bool True si l'usage est utilisé, false sinon
     */
    private function estUsageUtilise($usageId)
    {
        // À adapter selon vos tables qui référencent les usages d'engins
        $tables = [
            // 'engins' => 'usage_id', // Exemple si vous avez une table engins
        ];

        foreach ($tables as $table => $column) {
            try {
                $sql = "SELECT COUNT(*) as count FROM $table WHERE $column = :usage_id";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([':usage_id' => $usageId]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($result['count'] > 0) {
                    return true;
                }
            } catch (PDOException $e) {
                // Si la table n'existe pas, continuer
                continue;
            }
        }

        return false;
    }

    /**
     * Change le statut actif/inactif d'un usage
     *
     * @param int $id ID de l'usage
     * @param bool $actif Nouveau statut (true = actif, false = inactif)
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function changerStatutUsage($id, $actif)
    {
        // Vérification de l'existence de l'usage
        $usage = $this->usageExisteParId($id);
        if (!$usage) {
            return ["status" => "error", "message" => "L'usage spécifié n'existe pas."];
        }

        try {
            $sql = "UPDATE usages_engins 
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
            $this->logAudit("Changement de statut de l'usage ID $id: " . $usage['code'] . ' - ' . $usage['libelle'] . ' -> ' . $statut);

            return ["status" => "success", "message" => "L'usage a été $statut avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors du changement de statut de l'usage: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de tous les usages
     *
     * @return array Liste des usages ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerUsages()
    {
        try {
            $sql = "SELECT id, code, libelle, description, actif, 
                    DATE_FORMAT(date_creation, '%d/%m/%Y') as date_creation 
                    FROM usages_engins 
                    ORDER BY code, libelle ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des usages: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère les usages actifs
     *
     * @return array Liste des usages actifs ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerUsagesActifs()
    {
        try {
            $sql = "SELECT id, code, libelle, description 
                    FROM usages_engins 
                    WHERE actif = 1 
                    ORDER BY libelle ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des usages actifs: " . $e->getMessage());
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
?>