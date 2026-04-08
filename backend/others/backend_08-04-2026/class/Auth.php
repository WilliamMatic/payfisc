<?php
require_once 'Connexion.php';

/**
 * Classe Particulier - Gestion complète des particuliers
 */
class Particulier extends Connexion
{
    /**
     * Vérifie l'existence d'un particulier par son téléphone
     */
    public function particulierExisteParTelephone($telephone)
    {
        try {
            $sql = "SELECT id, nom, prenom, telephone, email, actif FROM particuliers WHERE telephone = :telephone";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['telephone' => $telephone]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence du particulier par téléphone: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'un particulier par son email
     */
    public function particulierExisteParEmail($email)
    {
        try {
            $sql = "SELECT id, nom, prenom, telephone, email, actif FROM particuliers WHERE email = :email";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['email' => $email]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence du particulier par email: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'un particulier par son ID
     */
    public function particulierExisteParId($id)
    {
        try {
            $sql = "SELECT * FROM particuliers WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du particulier par ID: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Hash un mot de passe
     */
    public function hasherMotDePasse($password)
    {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    /**
     * Génère un NIF unique pour un particulier
     */
    public function genererNIF()
    {
        $prefix = "P";
        $timestamp = time();
        $random = mt_rand(1000, 9999);
        return $prefix . $timestamp . $random;
    }

    /**
     * Ajoute un nouveau particulier
     */
    public function ajouterParticulier($nom, $prenom, $telephone, $password, $email = null, $autresInfos = [])
    {
        // Validation des données obligatoires
        if (empty($nom) || empty($prenom) || empty($telephone) || empty($password)) {
            return ["status" => "error", "message" => "Le nom, prénom, téléphone et mot de passe sont obligatoires."];
        }

        // Validation du format du téléphone
        if (!preg_match('/^[0-9+\-\s\(\)]{8,20}$/', $telephone)) {
            return ["status" => "error", "message" => "Le format du téléphone n'est pas valide."];
        }

        // Validation de l'email si fourni
        if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ["status" => "error", "message" => "L'adresse email n'est pas valide."];
        }

        // Vérification de l'unicité du téléphone
        if ($this->particulierExisteParTelephone($telephone)) {
            return ["status" => "error", "message" => "Ce numéro de téléphone est déjà utilisé."];
        }

        // Vérification de l'unicité de l'email si fourni
        if (!empty($email) && $this->particulierExisteParEmail($email)) {
            return ["status" => "error", "message" => "Cet email est déjà utilisé."];
        }

        try {
            $this->pdo->beginTransaction();

            // Génération du NIF unique
            $nif = $this->genererNIF();
            
            // Hash du mot de passe
            $passwordHash = $this->hasherMotDePasse($password);

            // Préparation des données pour l'insertion
            $donneesInsertion = [
                ':nom' => $nom,
                ':prenom' => $prenom,
                ':telephone' => $telephone,
                ':email' => $email,
                ':nif' => $nif,
                ':password' => $passwordHash,
                ':reduction_type' => 'pourcentage',
                ':reduction_valeur' => '0.00',
                ':reduction_montant_max' => '0.00',
                ':actif' => 1
            ];

            // Ajout des champs optionnels s'ils sont fournis
            $champsOptionnels = [
                'date_naissance', 'lieu_naissance', 'sexe', 'rue', 'ville', 
                'code_postal', 'province', 'id_national', 'situation_familiale', 'dependants'
            ];

            $colonnesSQL = ['nom', 'prenom', 'telephone', 'email', 'nif', 'password', 'reduction_type', 'reduction_valeur', 'reduction_montant_max', 'actif'];
            $valeursSQL = [':nom', ':prenom', ':telephone', ':email', ':nif', ':password', ':reduction_type', ':reduction_valeur', ':reduction_montant_max', ':actif'];

            foreach ($champsOptionnels as $champ) {
                if (isset($autresInfos[$champ]) && !empty(trim($autresInfos[$champ]))) {
                    $colonnesSQL[] = $champ;
                    $valeursSQL[] = ":{$champ}";
                    $donneesInsertion[":{$champ}"] = trim($autresInfos[$champ]);
                }
            }

            // Construction et exécution de la requête d'insertion
            $sql = "INSERT INTO particuliers (" . implode(', ', $colonnesSQL) . ") 
                    VALUES (" . implode(', ', $valeursSQL) . ")";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($donneesInsertion);

            $particulierId = $this->pdo->lastInsertId();

            $this->pdo->commit();

            // Log d'audit
            $this->logAudit("Inscription du particulier ID $particulierId: $nom $prenom ($telephone)");

            return [
                "status" => "success", 
                "message" => "Inscription réussie",
                "data" => [
                    "id" => $particulierId,
                    "nif" => $nif,
                    "nom" => $nom,
                    "prenom" => $prenom,
                    "telephone" => $telephone,
                    "email" => $email
                ]
            ];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'inscription du particulier: " . $e->getMessage());
            
            if ($e->getCode() == '23000') {
                return ["status" => "error", "message" => "Erreur de contrainte d'unicité. Le NIF ou l'ID national existe déjà."];
            }
            
            return ["status" => "error", "message" => "Erreur système lors de l'inscription: " . $e->getMessage()];
        }
    }

    /**
     * Authentifie un particulier par téléphone et mot de passe
     */
    public function authentifierParticulier($telephone, $password)
    {
        try {
            $sql = "SELECT id, nom, prenom, telephone, email, password, nif, actif, province 
                    FROM particuliers 
                    WHERE telephone = :telephone AND actif = 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['telephone' => $telephone]);
            $particulier = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$particulier) {
                return ["status" => "error", "message" => "Téléphone ou mot de passe incorrect."];
            }

            if (!password_verify($password, $particulier['password'])) {
                return ["status" => "error", "message" => "Téléphone ou mot de passe incorrect."];
            }

            // Retourne les données sans le mot de passe
            unset($particulier['password']);
            return [
                "status" => "success", 
                "message" => "Authentification réussie",
                "data" => $particulier
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de l'authentification du particulier: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système lors de l'authentification."];
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