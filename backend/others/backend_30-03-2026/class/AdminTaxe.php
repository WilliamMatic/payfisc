<?php
require_once 'Connexion.php';

/**
 * Classe AdminTaxe - Gestion des liens entre administrateurs et taxes
 */
class AdminTaxe extends Connexion
{
    /**
     * Vérifie l'existence d'un lien entre un admin et une taxe
     */
    public function lienExiste($adminId, $taxeId)
    {
        try {
            $sql = "SELECT id FROM admin_taxe WHERE admin_id = :admin_id AND taxe_id = :taxe_id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':admin_id' => $adminId,
                ':taxe_id' => $taxeId
            ]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du lien admin-taxe: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie si l'administrateur existe
     */
    public function adminExiste($adminId)
    {
        try {
            $sql = "SELECT id FROM administrateurs WHERE id = :id AND actif = 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $adminId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'admin: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie si la taxe existe
     */
    public function taxeExiste($taxeId)
    {
        try {
            $sql = "SELECT id FROM impots  WHERE id = :id AND actif = 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $taxeId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de la taxe: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Ajoute un lien entre un administrateur et une taxe
     */
    public function ajouterLien($adminId, $taxeId)
    {
        // Validation des données
        if (empty($adminId) || empty($taxeId)) {
            return ["status" => "error", "message" => "L'ID de l'administrateur et l'ID de la taxe sont requis."];
        }

        // Vérification de l'existence de l'admin
        if (!$this->adminExiste($adminId)) {
            return ["status" => "error", "message" => "L'administrateur spécifié n'existe pas ou est inactif."];
        }

        // Vérification de l'existence de la taxe
        if (!$this->taxeExiste($taxeId)) {
            return ["status" => "error", "message" => "La taxe spécifiée n'existe pas ou est inactive."];
        }

        // Vérification de l'unicité du lien
        if ($this->lienExiste($adminId, $taxeId)) {
            return ["status" => "error", "message" => "Ce lien existe déjà."];
        }

        try {
            // Insertion du lien
            $sql = "INSERT INTO admin_taxe (admin_id, taxe_id) VALUES (:admin_id, :taxe_id)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':admin_id' => $adminId,
                ':taxe_id' => $taxeId
            ]);

            $lienId = $this->pdo->lastInsertId();

            // Log d'audit
            $this->logAudit("Ajout du lien entre l'administrateur ID $adminId et la taxe ID $taxeId");

            return ["status" => "success", "message" => "Lien ajouté avec succès.", "data" => ["id" => $lienId]];

        } catch (PDOException $e) {
            error_log("Erreur lors de l'ajout du lien admin-taxe: " . $e->getMessage());
            
            if ($e->getCode() == '23000') {
                return ["status" => "error", "message" => "Ce lien existe déjà."];
            }
            
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime un lien entre un administrateur et une taxe
     */
    public function supprimerLien($adminId, $taxeId)
    {
        // Validation des données
        if (empty($adminId) || empty($taxeId)) {
            return ["status" => "error", "message" => "L'ID de l'administrateur et l'ID de la taxe sont requis."];
        }

        // Vérification de l'existence du lien
        if (!$this->lienExiste($adminId, $taxeId)) {
            return ["status" => "error", "message" => "Le lien spécifié n'existe pas."];
        }

        try {
            // Suppression du lien
            $sql = "DELETE FROM admin_taxe WHERE admin_id = :admin_id AND taxe_id = :taxe_id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':admin_id' => $adminId,
                ':taxe_id' => $taxeId
            ]);

            // Log d'audit
            $this->logAudit("Suppression du lien entre l'administrateur ID $adminId et la taxe ID $taxeId");

            return ["status" => "success", "message" => "Lien supprimé avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression du lien admin-taxe: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime tous les liens d'un administrateur
     */
    public function supprimerTousLiens($adminId)
    {
        // Validation des données
        if (empty($adminId)) {
            return ["status" => "error", "message" => "L'ID de l'administrateur est requis."];
        }

        try {
            // Suppression de tous les liens
            $sql = "DELETE FROM admin_taxe WHERE admin_id = :admin_id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':admin_id' => $adminId]);

            $count = $stmt->rowCount();

            // Log d'audit
            $this->logAudit("Suppression de tous les liens de l'administrateur ID $adminId ($count liens supprimés)");

            return ["status" => "success", "message" => "$count lien(s) supprimé(s) avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression des liens admin-taxe: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste des taxes liées à un administrateur
     */
    public function listerTaxesParAdmin($adminId)
    {
        // Validation des données
        if (empty($adminId)) {
            return ["status" => "error", "message" => "L'ID de l'administrateur est requis."];
        }

        try {
            $sql = "SELECT at.id, at.admin_id, at.taxe_id, at.date_creation,
                    t.nom as taxe_nom, t.prix as taxe_taux
                    FROM admin_taxe at
                    INNER JOIN impots t ON at.taxe_id = t.id
                    WHERE at.admin_id = :admin_id
                    ORDER BY t.nom ASC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':admin_id' => $adminId]);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Formatage de la date
            foreach ($resultats as &$row) {
                $row['date_creation'] = date('d/m/Y', strtotime($row['date_creation']));
            }

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des taxes par admin: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste des administrateurs liés à une taxe
     */
    public function listerAdminsParTaxe($taxeId)
    {
        // Validation des données
        if (empty($taxeId)) {
            return ["status" => "error", "message" => "L'ID de la taxe est requis."];
        }

        try {
            $sql = "SELECT at.id, at.admin_id, at.taxe_id, at.date_creation,
                    a.nom_complet as admin_nom, a.email as admin_email
                    FROM admin_taxe at
                    INNER JOIN administrateurs a ON at.admin_id = a.id
                    WHERE at.taxe_id = :taxe_id
                    ORDER BY a.nom_complet ASC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':taxe_id' => $taxeId]);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Formatage de la date
            foreach ($resultats as &$row) {
                $row['date_creation'] = date('d/m/Y', strtotime($row['date_creation']));
            }

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des admins par taxe: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Vérifie si un administrateur est lié à une taxe spécifique
     */
    public function verifierLien($adminId, $taxeId)
    {
        try {
            $sql = "SELECT COUNT(*) as count FROM admin_taxe WHERE admin_id = :admin_id AND taxe_id = :taxe_id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':admin_id' => $adminId,
                ':taxe_id' => $taxeId
            ]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => ["existe" => $result['count'] > 0]];

        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du lien: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère les IDs des taxes liées à un administrateur
     */
    public function getTaxeIdsByAdmin($adminId)
    {
        try {
            $sql = "SELECT taxe_id FROM admin_taxe WHERE admin_id = :admin_id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':admin_id' => $adminId]);
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des IDs de taxes: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Log une action dans le journal d'audit
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