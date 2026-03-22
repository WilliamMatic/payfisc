<?php
require_once 'Connexion.php';

/**
 * Classe Site - Gestion complète des sites
 * 
 * Cette classe étend la classe Connexion et fournit toutes les fonctionnalités
 * de gestion des sites, incluant :
 * - Création, modification, suppression et activation/désactivation des sites
 * - Vérification de l'unicité des codes et noms
 * - Logs d'audit pour toutes les opérations
 */
class Site extends Connexion
{
    /**
     * Vérifie l'existence d'un site par son code
     *
     * @param string $code Code à vérifier
     * @return array|false Données du site si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function siteExisteParCode($code)
    {
        try {
            $sql = "SELECT id, nom, code, actif, province_id FROM sites WHERE code = :code";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['code' => $code]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence du site: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'un site par son nom
     *
     * @param string $nom Nom à vérifier
     * @return array|false Données du site si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function siteExisteParNom($nom)
    {
        try {
            $sql = "SELECT id, nom, code, actif, province_id FROM sites WHERE nom = :nom";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['nom' => $nom]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence du site: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'un site par son ID
     *
     * @param int $id ID du site
     * @return array|false Données complètes du site si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function siteExisteParId($id)
    {
        try {
            $sql = "SELECT s.*, p.nom as province_nom 
                    FROM sites s 
                    LEFT JOIN provinces p ON s.province_id = p.id 
                    WHERE s.id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du site par ID: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'une province par son ID
     *
     * @param int $id ID de la province
     * @return array|false Données de la province si trouvée, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function provinceExisteParId($id)
    {
        try {
            $sql = "SELECT id, nom, code FROM provinces WHERE id = :id AND actif = 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de la province: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Ajoute un nouveau site au système
     *
     * @param string $nom Nom du site
     * @param string $code Code du site
     * @param string $description Description du site
     * @param string $formule Formule du site
     * @param int $provinceId ID de la province
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function ajouterSite($nom, $code, $description, $formule, $provinceId)
    {
        // ============ VALIDATION DES DONNÉES ============
        if (empty($nom) || empty($code) || empty($provinceId)) {
            return ["status" => "error", "message" => "Le nom, le code et la province sont obligatoires."];
        }

        if ($this->siteExisteParCode($code)) {
            return ["status" => "error", "message" => "Ce code de site est déjà utilisé."];
        }

        if ($this->siteExisteParNom($nom)) {
            return ["status" => "error", "message" => "Ce nom de site est déjà utilisé."];
        }

        // Vérification de l'existence de la province
        if (!$this->provinceExisteParId($provinceId)) {
            return ["status" => "error", "message" => "La province sélectionnée n'existe pas ou est inactive."];
        }

        // ============ TRAITEMENT PRINCIPAL ============
        try {
            $this->pdo->beginTransaction();

            // Insertion du site
            $sql = "INSERT INTO sites (nom, code, description, formule, province_id) 
                    VALUES (:nom, :code, :description, :formule, :province_id)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom' => $nom,
                ':code' => strtoupper($code),
                ':description' => $description,
                ':formule' => $formule,
                ':province_id' => $provinceId
            ]);

            $siteId = $this->pdo->lastInsertId();

            $this->pdo->commit();

            // Log d'audit
            $this->logAudit("Ajout du site ID $siteId: $nom ($code)");

            return ["status" => "success", "message" => "Site ajouté avec succès."];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'ajout du site: " . $e->getMessage());
            
            if ($e->getCode() == '23000') {
                return ["status" => "error", "message" => "Ce site existe déjà."];
            }
            
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Modifie les informations d'un site existant
     *
     * @param int $id ID du site à modifier
     * @param string $nom Nouveau nom
     * @param string $code Nouveau code
     * @param string $description Nouvelle description
     * @param string $formule Nouvelle formule
     * @param int $provinceId Nouvelle province ID
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function modifierSite($id, $nom, $code, $description, $formule, $provinceId)
    {
        // Validation des champs obligatoires
        if (empty($nom) || empty($code) || empty($provinceId)) {
            return ["status" => "error", "message" => "Le nom, le code et la province sont obligatoires."];
        }

        // Vérification de l'existence de la province
        if (!$this->provinceExisteParId($provinceId)) {
            return ["status" => "error", "message" => "La province sélectionnée n'existe pas ou est inactive."];
        }

        try {
            // Vérification de l'unicité du nouveau code
            $sqlCheckCode = "SELECT id FROM sites WHERE code = :code AND id != :id";
            $stmtCheckCode = $this->pdo->prepare($sqlCheckCode);
            $stmtCheckCode->execute([':code' => $code, ':id' => $id]);

            if ($stmtCheckCode->rowCount() > 0) {
                return ["status" => "error", "message" => "Ce code de site est déjà utilisé par un autre site."];
            }

            // Vérification de l'unicité du nouveau nom
            $sqlCheckNom = "SELECT id FROM sites WHERE nom = :nom AND id != :id";
            $stmtCheckNom = $this->pdo->prepare($sqlCheckNom);
            $stmtCheckNom->execute([':nom' => $nom, ':id' => $id]);

            if ($stmtCheckNom->rowCount() > 0) {
                return ["status" => "error", "message" => "Ce nom de site est déjà utilisé par un autre site."];
            }

            // Mise à jour des informations
            $sql = "UPDATE sites 
                    SET nom = :nom, 
                        code = :code, 
                        description = :description,
                        formule = :formule,
                        province_id = :province_id,
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom' => $nom,
                ':code' => strtoupper($code),
                ':description' => $description,
                ':formule' => $formule,
                ':province_id' => $provinceId,
                ':id' => $id
            ]);

            // Log d'audit
            $this->logAudit("Modification du site ID $id: $nom ($code)");

            return ["status" => "success", "message" => "Les informations du site ont été mises à jour."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification du site: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime un site du système
     *
     * @param int $id ID du site à supprimer
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function supprimerSite($id)
    {
        // Vérification de l'existence du site
        $site = $this->siteExisteParId($id);
        if (!$site) {
            return ["status" => "error", "message" => "Le site spécifié n'existe pas."];
        }

        try {
            // Suppression du site
            $sql = "DELETE FROM sites WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);

            // Log d'audit
            $this->logAudit("Suppression du site ID $id: " . $site['nom'] . ' (' . $site['code'] . ')');

            return ["status" => "success", "message" => "Le site a été supprimé avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression du site: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Change le statut actif/inactif d'un site
     *
     * @param int $id ID du site
     * @param bool $actif Nouveau statut (true = actif, false = inactif)
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function changerStatutSite($id, $actif)
    {
        // Vérification de l'existence du site
        $site = $this->siteExisteParId($id);
        if (!$site) {
            return ["status" => "error", "message" => "Le site spécifié n'existe pas."];
        }

        try {
            $sql = "UPDATE sites 
                    SET actif = :actif, 
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);

            // 🔴 IMPORTANT : convertir en entier et binder comme INT
            $actifInt = $actif ? 1 : 0;
            $stmt->bindValue(':actif', $actifInt, PDO::PARAM_INT);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);

            $stmt->execute();

            $statut = $actifInt === 1 ? "activé" : "désactivé";
            $this->logAudit("Changement de statut du site ID $id: " . $site['nom'] . ' -> ' . $statut);

            return ["status" => "success", "message" => "Le site a été $statut avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors du changement de statut du site: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de tous les sites
     *
     * @return array Liste des sites ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerSites()
    {
        try {
            $sql = "SELECT s.id, s.nom, s.code, s.description, s.formule, s.actif, 
                    p.nom as province_nom, p.id as province_id,
                    DATE_FORMAT(s.date_creation, '%d/%m/%Y') as date_creation 
                    FROM sites s 
                    LEFT JOIN provinces p ON s.province_id = p.id 
                    ORDER BY s.nom ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des sites: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Recherche des sites par terme de recherche
     *
     * @param string $searchTerm Terme de recherche
     * @return array Liste des sites correspondants ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function rechercherSites($searchTerm)
    {
        try {
            $sql = "SELECT s.id, s.nom, s.code, s.description, s.formule, s.actif, 
                    p.nom as province_nom, p.id as province_id,
                    DATE_FORMAT(s.date_creation, '%d/%m/%Y') as date_creation 
                    FROM sites s 
                    LEFT JOIN provinces p ON s.province_id = p.id 
                    WHERE s.nom LIKE :search OR s.code LIKE :search OR p.nom LIKE :search OR s.formule LIKE :search
                    ORDER BY s.nom ASC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':search' => '%' . $searchTerm . '%']);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des sites: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de toutes les provinces actives
     *
     * @return array Liste des provinces ou message d'error
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerProvincesActives()
    {
        try {
            $sql = "SELECT id, nom, code FROM provinces WHERE actif = 1 ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des provinces: " . $e->getMessage());
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