<?php
require_once 'Connexion.php';

/**
 * Classe Beneficiaire - Gestion complète des bénéficiaires
 */
class Beneficiaire extends Connexion
{
    /**
     * Vérifie l'existence d'un bénéficiaire par son téléphone
     */
    public function beneficiaireExisteParTelephone($telephone)
    {
        try {
            $sql = "SELECT id, nom, telephone, numero_compte, actif FROM beneficiaires WHERE telephone = :telephone";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['telephone' => $telephone]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence du bénéficiaire: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'un bénéficiaire par son numéro de compte
     */
    public function beneficiaireExisteParNumeroCompte($numero_compte)
    {
        try {
            $sql = "SELECT id, nom, telephone, numero_compte, actif FROM beneficiaires WHERE numero_compte = :numero_compte";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['numero_compte' => $numero_compte]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du numéro de compte: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'un bénéficiaire par son ID
     */
    public function beneficiaireExisteParId($id)
    {
        try {
            $sql = "SELECT * FROM beneficiaires WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du bénéficiaire par ID: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Ajoute un nouveau bénéficiaire
     */
    public function ajouterBeneficiaire($nom, $telephone, $numero_compte)
    {
        // Validation des données
        if (empty($nom) || empty($telephone) || empty($numero_compte)) {
            return ["status" => "error", "message" => "Le nom, le téléphone et le numéro de compte sont obligatoires."];
        }

        // Validation du format du téléphone
        if (!preg_match('/^\+?[0-9\s\-\(\)]{8,20}$/', $telephone)) {
            return ["status" => "error", "message" => "Le format du téléphone est invalide."];
        }

        // Vérification de l'unicité du téléphone
        if ($this->beneficiaireExisteParTelephone($telephone)) {
            return ["status" => "error", "message" => "Ce numéro de téléphone est déjà utilisé."];
        }

        // Vérification de l'unicité du numéro de compte
        if ($this->beneficiaireExisteParNumeroCompte($numero_compte)) {
            return ["status" => "error", "message" => "Ce numéro de compte est déjà utilisé."];
        }

        try {
            $this->pdo->beginTransaction();

            // Insertion du bénéficiaire
            $sql = "INSERT INTO beneficiaires (nom, telephone, numero_compte) 
                    VALUES (:nom, :telephone, :numero_compte)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom' => $nom,
                ':telephone' => $telephone,
                ':numero_compte' => $numero_compte
            ]);

            $beneficiaireId = $this->pdo->lastInsertId();

            $this->pdo->commit();

            // Log d'audit
            $this->logAudit("Ajout du bénéficiaire ID $beneficiaireId: $nom ($telephone) - Compte: $numero_compte");

            return ["status" => "success", "message" => "Bénéficiaire ajouté avec succès."];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'ajout du bénéficiaire: " . $e->getMessage());

            if ($e->getCode() == '23000') {
                return ["status" => "error", "message" => "Ce bénéficiaire existe déjà."];
            }

            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Modifie les informations d'un bénéficiaire existant
     */
    public function modifierBeneficiaire($id, $nom, $telephone, $numero_compte)
    {
        // Validation des champs obligatoires
        if (empty($nom) || empty($telephone) || empty($numero_compte)) {
            return ["status" => "error", "message" => "Le nom, le téléphone et le numéro de compte sont obligatoires."];
        }

        // Validation du format du téléphone
        if (!preg_match('/^\+?[0-9\s\-\(\)]{8,20}$/', $telephone)) {
            return ["status" => "error", "message" => "Le format du téléphone est invalide."];
        }

        try {
            // Vérification de l'unicité du nouveau téléphone
            $sqlCheckTel = "SELECT id FROM beneficiaires WHERE telephone = :telephone AND id != :id";
            $stmtCheckTel = $this->pdo->prepare($sqlCheckTel);
            $stmtCheckTel->execute([':telephone' => $telephone, ':id' => $id]);

            if ($stmtCheckTel->rowCount() > 0) {
                return ["status" => "error", "message" => "Ce numéro de téléphone est déjà utilisé par un autre bénéficiaire."];
            }

            // Vérification de l'unicité du nouveau numéro de compte
            $sqlCheckCompte = "SELECT id FROM beneficiaires WHERE numero_compte = :numero_compte AND id != :id";
            $stmtCheckCompte = $this->pdo->prepare($sqlCheckCompte);
            $stmtCheckCompte->execute([':numero_compte' => $numero_compte, ':id' => $id]);

            if ($stmtCheckCompte->rowCount() > 0) {
                return ["status" => "error", "message" => "Ce numéro de compte est déjà utilisé par un autre bénéficiaire."];
            }

            // Mise à jour des informations
            $sql = "UPDATE beneficiaires 
                    SET nom = :nom, 
                        telephone = :telephone, 
                        numero_compte = :numero_compte,
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom' => $nom,
                ':telephone' => $telephone,
                ':numero_compte' => $numero_compte,
                ':id' => $id
            ]);

            // Log d'audit
            $this->logAudit("Modification du bénéficiaire ID $id: $nom ($telephone) - Compte: $numero_compte");

            return ["status" => "success", "message" => "Les informations du bénéficiaire ont été mises à jour."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification du bénéficiaire: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime un bénéficiaire
     */
    public function supprimerBeneficiaire($id)
    {
        // Vérification de l'existence du bénéficiaire
        $beneficiaire = $this->beneficiaireExisteParId($id);
        if (!$beneficiaire) {
            return ["status" => "error", "message" => "Le bénéficiaire spécifié n'existe pas."];
        }

        try {
            // Suppression du bénéficiaire
            $sql = "DELETE FROM beneficiaires WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);

            // Log d'audit
            $this->logAudit("Suppression du bénéficiaire ID $id: " . $beneficiaire['nom'] . ' (' . $beneficiaire['telephone'] . ')');

            return ["status" => "success", "message" => "Le bénéficiaire a été supprimé avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression du bénéficiaire: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Change le statut actif/inactif d'un bénéficiaire
     */
    public function changerStatutBeneficiaire($id, $actif)
    {
        // Vérification de l'existence du bénéficiaire
        $beneficiaire = $this->beneficiaireExisteParId($id);
        if (!$beneficiaire) {
            return ["status" => "error", "message" => "Le bénéficiaire spécifié n'existe pas."];
        }

        try {
            $sql = "UPDATE beneficiaires 
                    SET actif = :actif, 
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);

            // Conversion en entier
            $actifInt = $actif ? 1 : 0;
            $stmt->bindValue(':actif', $actifInt, PDO::PARAM_INT);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);

            $stmt->execute();

            $statut = $actifInt === 1 ? "activé" : "désactivé";
            $this->logAudit("Changement de statut du bénéficiaire ID $id: " . $beneficiaire['nom'] . ' -> ' . $statut);

            return ["status" => "success", "message" => "Le bénéficiaire a été $statut avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors du changement de statut du bénéficiaire: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de tous les bénéficiaires
     */
    public function listerBeneficiaires()
    {
        try {
            $sql = "SELECT id, nom, telephone, numero_compte, actif,
                    DATE_FORMAT(date_creation, '%d/%m/%Y') as date_creation 
                    FROM beneficiaires 
                    ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des bénéficiaires: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Recherche des bénéficiaires par terme de recherche
     */
    public function rechercherBeneficiaires($searchTerm)
    {
        try {
            $sql = "SELECT id, nom, telephone, numero_compte, actif,
                    DATE_FORMAT(date_creation, '%d/%m/%Y') as date_creation 
                    FROM beneficiaires 
                    WHERE nom LIKE :search 
                    OR telephone LIKE :search 
                    OR numero_compte LIKE :search
                    ORDER BY nom ASC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':search' => '%' . $searchTerm . '%']);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des bénéficiaires: " . $e->getMessage());
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