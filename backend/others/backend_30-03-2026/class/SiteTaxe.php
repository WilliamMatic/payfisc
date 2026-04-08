<?php
require_once 'Connexion.php';

/**
 * Classe SiteTaxe - Gestion des taxes liées aux sites
 * 
 * Permet de gérer les associations entre sites et taxes avec:
 * - Prix minimum par taxe
 * - Statut actif/inactif par association
 * - Logs d'audit pour toutes les opérations
 */
class SiteTaxe extends Connexion
{
    /**
     * Récupère toutes les taxes associées à un site
     *
     * @param int $siteId ID du site
     * @return array Liste des taxes avec statut et prix
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerTaxesParSite($siteId)
    {
        try {
            $sql = "SELECT st.id, st.site_id, st.taxe_id, st.prix, st.status, st.date_create,
                    i.nom as taxe_nom, i.description as taxe_description, i.periode, i.penalites,
                    i.actif as taxe_actif
                    FROM site_taxe st
                    INNER JOIN impots i ON st.taxe_id = i.id
                    WHERE st.site_id = :site_id
                    ORDER BY st.status DESC, i.nom ASC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':site_id' => $siteId]);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des taxes par site: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère tous les sites associés à une taxe
     *
     * @param int $taxeId ID de la taxe
     * @return array Liste des sites avec statut et prix
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerSitesParTaxe($taxeId)
    {
        try {
            $sql = "SELECT st.id, st.site_id, st.taxe_id, st.prix, st.status, st.date_create,
                    s.nom as site_nom, s.code as site_code, s.actif as site_actif,
                    p.nom as province_nom
                    FROM site_taxe st
                    INNER JOIN sites s ON st.site_id = s.id
                    LEFT JOIN provinces p ON s.province_id = p.id
                    WHERE st.taxe_id = :taxe_id
                    ORDER BY st.status DESC, s.nom ASC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':taxe_id' => $taxeId]);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des sites par taxe: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Vérifie si une association site-taxe existe déjà
     *
     * @param int $siteId ID du site
     * @param int $taxeId ID de la taxe
     * @return array|false Données de l'association si trouvée, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function associationExiste($siteId, $taxeId)
    {
        try {
            $sql = "SELECT id, site_id, taxe_id, prix, status 
                    FROM site_taxe 
                    WHERE site_id = :site_id AND taxe_id = :taxe_id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':site_id' => $siteId,
                ':taxe_id' => $taxeId
            ]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'association: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie si une association existe par son ID
     *
     * @param int $id ID de l'association
     * @return array|false Données de l'association si trouvée, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function associationExisteParId($id)
    {
        try {
            $sql = "SELECT st.*, s.nom as site_nom, s.code as site_code,
                    i.nom as taxe_nom, i.description as taxe_description
                    FROM site_taxe st
                    INNER JOIN sites s ON st.site_id = s.id
                    INNER JOIN impots i ON st.taxe_id = i.id
                    WHERE st.id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'association par ID: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie si un site existe
     *
     * @param int $siteId ID du site
     * @return array|false Données du site si trouvé, false sinon
     */
    public function siteExiste($siteId)
    {
        try {
            $sql = "SELECT id, nom, code FROM sites WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $siteId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du site: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Vérifie si une taxe existe
     *
     * @param int $taxeId ID de la taxe
     * @return array|false Données de la taxe si trouvée, false sinon
     */
    public function taxeExiste($taxeId)
    {
        try {
            $sql = "SELECT id, nom, description, prix FROM impots WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $taxeId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de la taxe: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Ajoute une taxe à un site
     *
     * @param int $siteId ID du site
     * @param int $taxeId ID de la taxe
     * @param float $prix Prix de la taxe pour ce site
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function ajouterTaxeAuSite($siteId, $taxeId, $prix)
    {
        // ============ VALIDATION DES DONNÉES ============
        if (empty($siteId) || empty($taxeId)) {
            return ["status" => "error", "message" => "Le site et la taxe sont obligatoires."];
        }

        if (!is_numeric($prix) || $prix < 0) {
            return ["status" => "error", "message" => "Le prix doit être un nombre positif."];
        }

        // Vérification de l'existence du site
        $site = $this->siteExiste($siteId);
        if (!$site) {
            return ["status" => "error", "message" => "Le site sélectionné n'existe pas."];
        }

        // Vérification de l'existence de la taxe
        $taxe = $this->taxeExiste($taxeId);
        if (!$taxe) {
            return ["status" => "error", "message" => "La taxe sélectionnée n'existe pas."];
        }

        // Vérification de l'unicité de l'association
        if ($this->associationExiste($siteId, $taxeId)) {
            return ["status" => "error", "message" => "Cette taxe est déjà associée à ce site."];
        }

        // ============ TRAITEMENT PRINCIPAL ============
        try {
            $this->pdo->beginTransaction();

            // Insertion de l'association
            $sql = "INSERT INTO site_taxe (site_id, taxe_id, prix, status) 
                    VALUES (:site_id, :taxe_id, :prix, 1)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':site_id' => $siteId,
                ':taxe_id' => $taxeId,
                ':prix' => $prix
            ]);

            $associationId = $this->pdo->lastInsertId();

            $this->pdo->commit();

            // Log d'audit
            $this->logAudit("Ajout de la taxe '{$taxe['nom']}' au site '{$site['nom']}' (Prix: $prix)");

            return ["status" => "success", "message" => "Taxe ajoutée au site avec succès."];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'ajout de la taxe au site: " . $e->getMessage());
            
            if ($e->getCode() == '23000') {
                return ["status" => "error", "message" => "Cette association existe déjà."];
            }
            
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Modifie le prix et le statut d'une association site-taxe
     *
     * @param int $id ID de l'association
     * @param float $prix Nouveau prix
     * @param int $status Nouveau statut (1=actif, 0=inactif)
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function modifierTaxeSite($id, $prix, $status)
    {
        // Validation des données
        if (!is_numeric($prix) || $prix < 0) {
            return ["status" => "error", "message" => "Le prix doit être un nombre positif."];
        }

        if (!in_array($status, [0, 1])) {
            return ["status" => "error", "message" => "Le statut doit être 0 ou 1."];
        }

        // Vérification de l'existence de l'association
        $association = $this->associationExisteParId($id);
        if (!$association) {
            return ["status" => "error", "message" => "L'association spécifiée n'existe pas."];
        }

        try {
            // Mise à jour de l'association
            $sql = "UPDATE site_taxe 
                    SET prix = :prix, status = :status
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':prix' => $prix,
                ':status' => $status,
                ':id' => $id
            ]);

            $statutTexte = $status == 1 ? "activé" : "désactivé";
            $this->logAudit("Modification de la taxe '{$association['taxe_nom']}' pour le site '{$association['site_nom']}' - Prix: $prix, Statut: $statutTexte");

            return ["status" => "success", "message" => "La taxe a été modifiée avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification de la taxe du site: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime une association site-taxe
     *
     * @param int $id ID de l'association
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function supprimerTaxeSite($id)
    {
        // Vérification de l'existence de l'association
        $association = $this->associationExisteParId($id);
        if (!$association) {
            return ["status" => "error", "message" => "L'association spécifiée n'existe pas."];
        }

        try {
            // Suppression de l'association
            $sql = "DELETE FROM site_taxe WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);

            $this->logAudit("Suppression de la taxe '{$association['taxe_nom']}' du site '{$association['site_nom']}'");

            return ["status" => "success", "message" => "La taxe a été retirée du site avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de la taxe du site: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Change le statut d'une association site-taxe
     *
     * @param int $id ID de l'association
     * @param int $status Nouveau statut (1=actif, 0=inactif)
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function changerStatutTaxeSite($id, $status)
    {
        // Validation
        if (!in_array($status, [0, 1])) {
            return ["status" => "error", "message" => "Le statut doit être 0 ou 1."];
        }

        // Vérification de l'existence de l'association
        $association = $this->associationExisteParId($id);
        if (!$association) {
            return ["status" => "error", "message" => "L'association spécifiée n'existe pas."];
        }

        try {
            $sql = "UPDATE site_taxe SET status = :status WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':status' => $status,
                ':id' => $id
            ]);

            $statutTexte = $status == 1 ? "activée" : "désactivée";
            $this->logAudit("Changement de statut de la taxe '{$association['taxe_nom']}' pour le site '{$association['site_nom']}' -> $statutTexte");

            return ["status" => "success", "message" => "Le statut de la taxe a été modifié avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors du changement de statut de la taxe du site: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère toutes les taxes disponibles (non encore associées à un site)
     *
     * @param int $siteId ID du site
     * @return array Liste des taxes disponibles
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerTaxesDisponibles($siteId)
    {
        try {
            $sql = "SELECT i.* 
                    FROM impots i
                    WHERE i.actif = 1 
                    AND i.id NOT IN (
                        SELECT taxe_id FROM site_taxe WHERE site_id = :site_id
                    )
                    ORDER BY i.nom ASC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':site_id' => $siteId]);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des taxes disponibles: " . $e->getMessage());
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