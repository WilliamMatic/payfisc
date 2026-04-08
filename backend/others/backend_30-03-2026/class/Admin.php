<?php
require_once 'Connexion.php';

/**
 * Classe Admin - Gestion complète des administrateurs
 */
class Admin extends Connexion
{
    /**
     * Vérifie l'existence d'un admin par son email
     */
    public function adminExisteParEmail($email)
    {
        try {
            $sql = "SELECT id, nom_complet, email, role, actif FROM administrateurs WHERE email = :email";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['email' => $email]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence de l'admin: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'un admin par son ID
     */
    public function adminExisteParId($id)
    {
        try {
            $sql = "SELECT a.*, p.nom as province_nom 
                    FROM administrateurs a 
                    LEFT JOIN provinces p ON a.province_id = p.id 
                    WHERE a.id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'admin par ID: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Génère un mot de passe aléatoire de 4 chiffres
     */
    public function genererMotDePasse()
    {
        return str_pad(mt_rand(0, 9999), 4, '0', STR_PAD_LEFT);
    }

    /**
     * Hash un mot de passe
     */
    public function hasherMotDePasse($password)
    {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    /**
     * Ajoute un nouvel administrateur
     */
    public function ajouterAdmin($nomComplet, $email, $telephone, $role, $provinceId = null)
    {
        // Validation des données
        if (empty($nomComplet) || empty($email) || empty($role)) {
            return ["status" => "error", "message" => "Le nom complet, l'email et le rôle sont obligatoires."];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ["status" => "error", "message" => "L'adresse email n'est pas valide."];
        }

        // Vérification de l'unicité de l'email
        if ($this->adminExisteParEmail($email)) {
            return ["status" => "error", "message" => "Cet email est déjà utilisé."];
        }

        // Validation du rôle et de la province
        if ($role === 'partenaire' && empty($provinceId)) {
            return ["status" => "error", "message" => "La province est obligatoire pour un administrateur partenaire."];
        }

        if ($role === 'super' && !empty($provinceId)) {
            return ["status" => "error", "message" => "Un administrateur super ne peut pas être lié à une province."];
        }

        // Vérification de l'existence de la province si fournie
        if (!empty($provinceId)) {
            $provinceExiste = $this->pdo->prepare("SELECT id FROM provinces WHERE id = ? AND actif = 1");
            $provinceExiste->execute([$provinceId]);
            if (!$provinceExiste->fetch()) {
                return ["status" => "error", "message" => "La province sélectionnée n'existe pas ou est inactive."];
            }
        }

        try {
            $this->pdo->beginTransaction();

            // Génération du mot de passe
            $passwordPlain = $this->genererMotDePasse();
            $passwordHash = $this->hasherMotDePasse($passwordPlain);

            // Insertion de l'administrateur
            $sql = "INSERT INTO administrateurs (nom_complet, email, telephone, password, role, province_id) 
                    VALUES (:nom_complet, :email, :telephone, :password, :role, :province_id)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom_complet' => $nomComplet,
                ':email' => $email,
                ':telephone' => $telephone,
                ':password' => $passwordHash,
                ':role' => $role,
                ':province_id' => $provinceId
            ]);

            $adminId = $this->pdo->lastInsertId();

            $this->pdo->commit();

            // Log d'audit
            $this->logAudit("Ajout de l'administrateur ID $adminId: $nomComplet ($email) - Rôle: $role");

            return [
                "status" => "success", 
                "message" => "Administrateur ajouté avec succès. Mot de passe: $passwordPlain",
                "password" => $passwordPlain // Retourné uniquement pour l'affichage initial
            ];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'ajout de l'administrateur: " . $e->getMessage());
            
            if ($e->getCode() == '23000') {
                return ["status" => "error", "message" => "Cet administrateur existe déjà."];
            }
            
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Modifie un administrateur existant
     */
    public function modifierAdmin($id, $nomComplet, $email, $telephone, $role, $provinceId = null)
    {
        // Validation des données
        if (empty($nomComplet) || empty($email) || empty($role)) {
            return ["status" => "error", "message" => "Le nom complet, l'email et le rôle sont obligatoires."];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ["status" => "error", "message" => "L'adresse email n'est pas valide."];
        }

        // Vérification de l'existence de l'admin
        $admin = $this->adminExisteParId($id);
        if (!$admin) {
            return ["status" => "error", "message" => "L'administrateur spécifié n'existe pas."];
        }

        // Vérification de l'unicité du nouvel email
        $sqlCheckEmail = "SELECT id FROM administrateurs WHERE email = :email AND id != :id";
        $stmtCheckEmail = $this->pdo->prepare($sqlCheckEmail);
        $stmtCheckEmail->execute([':email' => $email, ':id' => $id]);

        if ($stmtCheckEmail->rowCount() > 0) {
            return ["status" => "error", "message" => "Cet email est déjà utilisé par un autre administrateur."];
        }

        // Validation du rôle et de la province
        if ($role === 'partenaire' && empty($provinceId)) {
            return ["status" => "error", "message" => "La province est obligatoire pour un administrateur partenaire."];
        }

        if ($role === 'super' && !empty($provinceId)) {
            return ["status" => "error", "message" => "Un administrateur super ne peut pas être lié à une province."];
        }

        // Vérification de l'existence de la province si fournie
        if (!empty($provinceId)) {
            $provinceExiste = $this->pdo->prepare("SELECT id FROM provinces WHERE id = ? AND actif = 1");
            $provinceExiste->execute([$provinceId]);
            if (!$provinceExiste->fetch()) {
                return ["status" => "error", "message" => "La province sélectionnée n'existe pas ou est inactive."];
            }
        }

        try {
            // Mise à jour des informations
            $sql = "UPDATE administrateurs 
                    SET nom_complet = :nom_complet, 
                        email = :email, 
                        telephone = :telephone,
                        role = :role,
                        province_id = :province_id,
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom_complet' => $nomComplet,
                ':email' => $email,
                ':telephone' => $telephone,
                ':role' => $role,
                ':province_id' => $provinceId,
                ':id' => $id
            ]);

            // Log d'audit
            $this->logAudit("Modification de l'administrateur ID $id: $nomComplet ($email)");

            return ["status" => "success", "message" => "Les informations de l'administrateur ont été mises à jour."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification de l'administrateur: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Réinitialise le mot de passe d'un administrateur
     */
    public function reinitialiserMotDePasse($id)
    {
        // Vérification de l'existence de l'admin
        $admin = $this->adminExisteParId($id);
        if (!$admin) {
            return ["status" => "error", "message" => "L'administrateur spécifié n'existe pas."];
        }

        try {
            // Génération du nouveau mot de passe
            $passwordPlain = $this->genererMotDePasse();
            $passwordHash = $this->hasherMotDePasse($passwordPlain);

            // Mise à jour du mot de passe
            $sql = "UPDATE administrateurs 
                    SET password = :password,
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':password' => $passwordHash,
                ':id' => $id
            ]);

            // Log d'audit
            $this->logAudit("Réinitialisation du mot de passe de l'administrateur ID $id");

            return [
                "status" => "success", 
                "message" => "Mot de passe réinitialisé avec succès. Nouveau mot de passe: $passwordPlain",
                "password" => $passwordPlain
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la réinitialisation du mot de passe: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime un administrateur
     */
    public function supprimerAdmin($id)
    {
        // Vérification de l'existence de l'admin
        $admin = $this->adminExisteParId($id);
        if (!$admin) {
            return ["status" => "error", "message" => "L'administrateur spécifié n'existe pas."];
        }

        // Empêcher la suppression du dernier admin super
        if ($admin['role'] === 'super') {
            $sqlCountSuper = "SELECT COUNT(*) as count FROM administrateurs WHERE role = 'super' AND actif = 1";
            $stmtCountSuper = $this->pdo->query($sqlCountSuper);
            $countSuper = $stmtCountSuper->fetch(PDO::FETCH_ASSOC)['count'];
            
            if ($countSuper <= 1) {
                return ["status" => "error", "message" => "Impossible de supprimer le dernier administrateur super."];
            }
        }

        try {
            // Suppression de l'administrateur
            $sql = "DELETE FROM administrateurs WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);

            // Log d'audit
            $this->logAudit("Suppression de l'administrateur ID $id: " . $admin['nom_complet'] . ' (' . $admin['email'] . ')');

            return ["status" => "success", "message" => "L'administrateur a été supprimé avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de l'administrateur: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Change le statut actif/inactif d'un administrateur
     */
    public function changerStatutAdmin($id, $actif)
    {
        // Vérification de l'existence de l'admin
        $admin = $this->adminExisteParId($id);
        if (!$admin) {
            return ["status" => "error", "message" => "L'administrateur spécifié n'existe pas."];
        }

        // Empêcher la désactivation du dernier admin super
        if ($admin['role'] === 'super' && !$actif) {
            $sqlCountSuper = "SELECT COUNT(*) as count FROM administrateurs WHERE role = 'super' AND actif = 1";
            $stmtCountSuper = $this->pdo->query($sqlCountSuper);
            $countSuper = $stmtCountSuper->fetch(PDO::FETCH_ASSOC)['count'];
            
            if ($countSuper <= 1) {
                return ["status" => "error", "message" => "Impossible de désactiver le dernier administrateur super."];
            }
        }

        try {
            $sql = "UPDATE administrateurs 
                    SET actif = :actif, 
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);

            $actifInt = $actif ? 1 : 0;
            $stmt->bindValue(':actif', $actifInt, PDO::PARAM_INT);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);

            $stmt->execute();

            $statut = $actifInt === 1 ? "activé" : "désactivé";
            $this->logAudit("Changement de statut de l'administrateur ID $id: " . $admin['nom_complet'] . ' -> ' . $statut);

            return ["status" => "success", "message" => "L'administrateur a été $statut avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors du changement de statut de l'administrateur: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de tous les administrateurs
     */
    public function listerAdmins()
    {
        try {
            $sql = "SELECT a.id, a.nom_complet, a.email, a.telephone, a.role, a.actif,
                    p.nom as province_nom, p.id as province_id,
                    DATE_FORMAT(a.date_creation, '%d/%m/%Y') as date_creation 
                    FROM administrateurs a 
                    LEFT JOIN provinces p ON a.province_id = p.id 
                    ORDER BY a.nom_complet ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des administrateurs: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Recherche des administrateurs par terme
     */
    public function rechercherAdmins($searchTerm)
    {
        try {
            $sql = "SELECT a.id, a.nom_complet, a.email, a.telephone, a.role, a.actif,
                    p.nom as province_nom, p.id as province_id,
                    DATE_FORMAT(a.date_creation, '%d/%m/%Y') as date_creation 
                    FROM administrateurs a 
                    LEFT JOIN provinces p ON a.province_id = p.id 
                    WHERE a.nom_complet LIKE :search OR a.email LIKE :search OR a.telephone LIKE :search OR p.nom LIKE :search
                    ORDER BY a.nom_complet ASC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':search' => '%' . $searchTerm . '%']);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des administrateurs: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de toutes les provinces actives
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