<?php
require_once 'Connexion.php';

/**
 * Classe Province - Gestion complète des provinces
 * 
 * Cette classe étend la classe Connexion et fournit toutes les fonctionnalités
 * de gestion des provinces, incluant :
 * - Création, modification, suppression et activation/désactivation des provinces
 * - Vérification de l'unicité des codes et noms
 * - Logs d'audit pour toutes les opérations
 */
class Province extends Connexion
{
    /**
     * Vérifie l'existence d'une province par son code
     *
     * @param string $code Code à vérifier
     * @return array|false Données de la province si trouvée, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function provinceExisteParCode($code)
    {
        try {
            $sql = "SELECT id, nom, code, actif FROM provinces WHERE code = :code";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['code' => $code]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence de la province: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'une province par son nom
     *
     * @param string $nom Nom à vérifier
     * @return array|false Données de la province si trouvée, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function provinceExisteParNom($nom)
    {
        try {
            $sql = "SELECT id, nom, code, actif FROM provinces WHERE nom = :nom";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['nom' => $nom]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence de la province: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'une province par son ID
     *
     * @param int $id ID de la province
     * @return array|false Données complètes de la province si trouvée, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function provinceExisteParId($id)
    {
        try {
            $sql = "SELECT * FROM provinces WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de la province par ID: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Ajoute une nouvelle province au système
     *
     * @param string $nom Nom de la province
     * @param string $code Code de la province
     * @param string $description Description de la province
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function ajouterProvince($nom, $code, $description = '')
    {
        // ============ VALIDATION DES DONNÉES ============
        if (empty($nom) || empty($code)) {
            return ["status" => "error", "message" => "Le nom et le code sont obligatoires."];
        }

        if ($this->provinceExisteParCode($code)) {
            return ["status" => "error", "message" => "Ce code de province est déjà utilisé."];
        }

        if ($this->provinceExisteParNom($nom)) {
            return ["status" => "error", "message" => "Ce nom de province est déjà utilisé."];
        }

        // ============ TRAITEMENT PRINCIPAL ============
        try {
            $this->pdo->beginTransaction();

            // Insertion de la province
            $sql = "INSERT INTO provinces (nom, code, description) 
                    VALUES (:nom, :code, :description)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom' => $nom,
                ':code' => strtoupper($code),
                ':description' => $description
            ]);

            $provinceId = $this->pdo->lastInsertId();

            $this->pdo->commit();

            // Log d'audit
            $this->logAudit("Ajout de la province ID $provinceId: $nom ($code)");

            return ["status" => "success", "message" => "Province ajoutée avec succès."];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'ajout de la province: " . $e->getMessage());
            
            if ($e->getCode() == '23000') {
                return ["status" => "error", "message" => "Cette province existe déjà."];
            }
            
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Modifie les informations d'une province existante
     *
     * @param int $id ID de la province à modifier
     * @param string $nom Nouveau nom
     * @param string $code Nouveau code
     * @param string $description Nouvelle description
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function modifierProvince($id, $nom, $code, $description = '')
    {
        // Validation des champs obligatoires
        if (empty($nom) || empty($code)) {
            return ["status" => "error", "message" => "Le nom et le code sont obligatoires."];
        }

        try {
            // Vérification de l'unicité du nouveau code
            $sqlCheckCode = "SELECT id FROM provinces WHERE code = :code AND id != :id";
            $stmtCheckCode = $this->pdo->prepare($sqlCheckCode);
            $stmtCheckCode->execute([':code' => $code, ':id' => $id]);

            if ($stmtCheckCode->rowCount() > 0) {
                return ["status" => "error", "message" => "Ce code de province est déjà utilisé par une autre province."];
            }

            // Vérification de l'unicité du nouveau nom
            $sqlCheckNom = "SELECT id FROM provinces WHERE nom = :nom AND id != :id";
            $stmtCheckNom = $this->pdo->prepare($sqlCheckNom);
            $stmtCheckNom->execute([':nom' => $nom, ':id' => $id]);

            if ($stmtCheckNom->rowCount() > 0) {
                return ["status" => "error", "message" => "Ce nom de province est déjà utilisé par une autre province."];
            }

            // Mise à jour des informations
            $sql = "UPDATE provinces 
                    SET nom = :nom, 
                        code = :code, 
                        description = :description,
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom' => $nom,
                ':code' => strtoupper($code),
                ':description' => $description,
                ':id' => $id
            ]);

            // Log d'audit
            $this->logAudit("Modification de la province ID $id: $nom ($code)");

            return ["status" => "success", "message" => "Les informations de la province ont été mises à jour."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification de la province: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime une province du système
     *
     * @param int $id ID de la province à supprimer
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function supprimerProvince($id)
    {
        // Vérification de l'existence de la province
        $province = $this->provinceExisteParId($id);
        if (!$province) {
            return ["status" => "error", "message" => "La province spécifiée n'existe pas."];
        }

        try {
            // Suppression de la province
            $sql = "DELETE FROM provinces WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);

            // Log d'audit
            $this->logAudit("Suppression de la province ID $id: " . $province['nom'] . ' (' . $province['code'] . ')');

            return ["status" => "success", "message" => "La province a été supprimée avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de la province: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Change le statut actif/inactif d'une province
     *
     * @param int $id ID de la province
     * @param bool $actif Nouveau statut (true = actif, false = inactif)
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function changerStatutProvince($id, $actif)
    {
        // Vérification de l'existence de la province
        $province = $this->provinceExisteParId($id);
        if (!$province) {
            return ["status" => "error", "message" => "La province spécifiée n'existe pas."];
        }

        try {
            $sql = "UPDATE provinces 
                    SET actif = :actif, 
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);

            // 🔴 IMPORTANT : convertir en entier et binder comme INT
            $actifInt = $actif ? 1 : 0;
            $stmt->bindValue(':actif', $actifInt, PDO::PARAM_INT);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);

            $stmt->execute();

            $statut = $actifInt === 1 ? "activée" : "désactivée";
            $this->logAudit("Changement de statut de la province ID $id: " . $province['nom'] . ' -> ' . $statut);

            return ["status" => "success", "message" => "La province a été $statut avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors du changement de statut de la province: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de toutes les provinces
     *
     * @return array Liste des provinces ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerProvinces()
    {
        try {
            $sql = "SELECT id, nom, code, description, actif, 
                    DATE_FORMAT(date_creation, '%d/%m/%Y') as date_creation 
                    FROM provinces 
                    ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des provinces: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère toutes les provinces actives
     */
    public function getProvincesActives()
    {
        try {
            $sql = "SELECT id, nom, code, description, actif 
                    FROM provinces 
                    WHERE actif = 1 
                    ORDER BY nom ASC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des provinces actives: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Recherche des provinces par terme de recherche
     *
     * @param string $searchTerm Terme de recherche
     * @return array Liste des provinces correspondantes ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function rechercherProvinces($searchTerm)
    {
        try {
            $sql = "SELECT id, nom, code, description, actif, 
                    DATE_FORMAT(date_creation, '%d/%m/%Y') as date_creation 
                    FROM provinces 
                    WHERE nom LIKE :search OR code LIKE :search
                    ORDER BY nom ASC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':search' => '%' . $searchTerm . '%']);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des provinces: " . $e->getMessage());
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