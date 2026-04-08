<?php
require_once 'Connexion.php';

/**
 * Classe Agent - Gestion complète des agents et de leurs privilèges
 * 
 * Cette classe étend la classe Connexion et fournit toutes les fonctionnalités
 * de gestion des agents, incluant :
 * - Création, modification, suppression et activation/désactivation des agents
 * - Gestion des privilèges par module et action
 * - Génération automatique de mots de passe
 * - Logs d'audit pour toutes les opérations
 */
class Agent extends Connexion
{
    /**
     * Vérifie l'existence d'un agent par son email
     *
     * @param string $email Email à vérifier
     * @return array|false Données de l'agent si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function agentExiste($email)
    {
        try {
            $sql = "SELECT id, nom, prenom, email, actif FROM agents WHERE email = :email";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['email' => $email]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence de l'agent: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'un agent par son ID
     *
     * @param int $id ID de l'agent
     * @return array|false Données complètes de l'agent si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function agentExisteParId($id)
    {
        try {
            $sql = "SELECT * FROM agents WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'agent par ID: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Ajoute un nouvel agent au système
     *
     * @param string $nom Nom de famille de l'agent
     * @param string $prenom Prénom de l'agent
     * @param string $email Adresse email valide et unique pour l'agent
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function ajouterAgent($nom, $prenom, $email)
    {
        // ============ VALIDATION DES DONNÉES ============
        if (empty($nom) || empty($prenom) || empty($email)) {
            return ["status" => "error", "message" => "Tous les champs sont obligatoires."];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ["status" => "error", "message" => "L'adresse email n'est pas valide."];
        }

        if ($this->agentExiste($email)) {
            return ["status" => "error", "message" => "Cette adresse email est déjà utilisée."];
        }

        // ============ TRAITEMENT PRINCIPAL ============
        try {
            $this->pdo->beginTransaction();

            // Génération d'un mot de passe temporaire à 4 chiffres
            $motDePasseTemp = $this->genererMotDePasseTemporaire();
            $motDePasseHash = password_hash($motDePasseTemp, PASSWORD_BCRYPT);

            // Insertion de l'agent
            $sql = "INSERT INTO agents (nom, prenom, email, password) 
                    VALUES (:nom, :prenom, :email, :password)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom' => $nom,
                ':prenom' => $prenom,
                ':email' => $email,
                ':password' => $motDePasseHash
            ]);

            $agentId = $this->pdo->lastInsertId();

            // Initialisation des privilèges par défaut (aucun)
            $this->initialiserPrivileges($agentId);

            $this->pdo->commit();

            // Envoi d'email avec les informations de connexion
            $this->envoyerEmailAgent($email, $prenom . ' ' . $nom, $motDePasseTemp);

            // Log d'audit
            $this->logAudit("Ajout de l'agent ID $agentId: $prenom $nom ($email)");

            return ["status" => "success", "message" => "Agent ajouté avec succès. Les informations de connexion ont été envoyées par email."];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'ajout de l'agent: " . $e->getMessage());
            
            if ($e->getCode() == '23000') {
                return ["status" => "error", "message" => "Cette adresse email est déjà utilisée."];
            }
            
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Modifie les informations d'un agent existant
     *
     * @param int $id ID de l'agent à modifier
     * @param string $nom Nouveau nom
     * @param string $prenom Nouveau prénom
     * @param string $email Nouvel email
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function modifierAgent($id, $nom, $prenom, $email)
    {
        // Validation des champs obligatoires
        if (empty($nom) || empty($prenom) || empty($email)) {
            return ["status" => "error", "message" => "Tous les champs sont obligatoires."];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ["status" => "error", "message" => "L'adresse email n'est pas valide."];
        }

        try {
            // Vérification de l'unicité du nouvel email
            $sqlCheck = "SELECT id FROM agents WHERE email = :email AND id != :id";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([':email' => $email, ':id' => $id]);

            if ($stmtCheck->rowCount() > 0) {
                return ["status" => "error", "message" => "Cette adresse email est déjà utilisée par un autre agent."];
            }

            // Mise à jour des informations
            $sql = "UPDATE agents 
                    SET nom = :nom, 
                        prenom = :prenom, 
                        email = :email,
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom' => $nom,
                ':prenom' => $prenom,
                ':email' => $email,
                ':id' => $id
            ]);

            // Log d'audit
            $this->logAudit("Modification de l'agent ID $id: $prenom $nom ($email)");

            return ["status" => "success", "message" => "Les informations de l'agent ont été mises à jour."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification de l'agent: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime un agent du système
     *
     * @param int $id ID de l'agent à supprimer
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function supprimerAgent($id)
    {
        // Vérification de l'existence de l'agent
        $agent = $this->agentExisteParId($id);
        if (!$agent) {
            return ["status" => "error", "message" => "L'agent spécifié n'existe pas."];
        }

        try {
            // Suppression de l'agent (les privilèges seront supprimés via CASCADE)
            $sql = "DELETE FROM agents WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);

            // Log d'audit
            $this->logAudit("Suppression de l'agent ID $id: " . $agent['prenom'] . ' ' . $agent['nom'] . ' (' . $agent['email'] . ')');

            return ["status" => "success", "message" => "L'agent a été supprimé avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de l'agent: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Change le statut actif/inactif d'un agent
     *
     * @param int $id ID de l'agent
     * @param bool $actif Nouveau statut (true = actif, false = inactif)
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function changerStatutAgent($id, $actif)
    {
        // Vérification de l'existence de l'agent
        $agent = $this->agentExisteParId($id);
        if (!$agent) {
            return ["status" => "error", "message" => "L'agent spécifié n'existe pas."];
        }

        try {
            $sql = "UPDATE agents 
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
            $this->logAudit("Changement de statut de l'agent ID $id: " . $agent['prenom'] . ' ' . $agent['nom'] . ' -> ' . $statut);

            return ["status" => "success", "message" => "L'agent a été $statut avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors du changement de statut de l'agent: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de tous les agents
     *
     * @return array Liste des agents ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerAgents()
    {
        try {
            $sql = "SELECT id, nom, prenom, email, actif, 
                    DATE_FORMAT(date_creation, '%d/%m/%Y') as date_creation 
                    FROM agents 
                    ORDER BY nom, prenom ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des agents: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère les privilèges d'un agent spécifique
     *
     * @param int $agentId ID de l'agent
     * @return array Liste des privilèges ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function getPrivilegesAgent($agentId)
    {
        try {
            $sql = "SELECT id, module, action, description, selected 
                    FROM agent_privileges 
                    WHERE agent_id = :agent_id 
                    ORDER BY module, action";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':agent_id' => $agentId]);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des privilèges: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Met à jour les privilèges d'un agent
     *
     * @param int $agentId ID de l'agent
     * @param array $privileges Tableau des privilèges à mettre à jour
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function mettreAJourPrivileges($agentId, $privileges)
    {
        // Vérification de l'existence de l'agent
        $agent = $this->agentExisteParId($agentId);
        if (!$agent) {
            return ["status" => "error", "message" => "L'agent spécifié n'existe pas."];
        }

        try {
            $this->pdo->beginTransaction();

            // Suppression des anciens privilèges
            $sqlDelete = "DELETE FROM agent_privileges WHERE agent_id = :agent_id";
            $stmtDelete = $this->pdo->prepare($sqlDelete);
            $stmtDelete->execute([':agent_id' => $agentId]);

            // Insertion des nouveaux privilèges
            $sqlInsert = "INSERT INTO agent_privileges (agent_id, module, action, description, selected) 
                          VALUES (:agent_id, :module, :action, :description, :selected)";
            $stmtInsert = $this->pdo->prepare($sqlInsert);

            foreach ($privileges as $privilege) {
                $stmtInsert->execute([
                    ':agent_id' => $agentId,
                    ':module' => $privilege['module'],
                    ':action' => $privilege['action'],
                    ':description' => $privilege['description'],
                    ':selected' => $privilege['selected'] ? 1 : 0
                ]);
            }

            $this->pdo->commit();

            // Log d'audit
            $this->logAudit("Mise à jour des privilèges de l'agent ID $agentId: " . $agent['prenom'] . ' ' . $agent['nom']);

            return ["status" => "success", "message" => "Les privilèges ont été mis à jour avec succès."];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de la mise à jour des privilèges: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Authentifie un agent par email et mot de passe
     *
     * @param string $email Email de l'agent
     * @param string $password Mot de passe en clair
     * @return array Tableau avec statut, message et données de l'agent + privilèges
     */
    public function authentifierAgent($email, $password)
    {
        // Vérification de l'existence
        $agent = $this->agentExiste($email);
        if (!$agent) {
            return ["status" => "error", "message" => "Identifiants incorrects."];
        }

        // Vérification du statut actif
        if (!$agent['actif']) {
            return ["status" => "error", "message" => "Votre compte est désactivé. Contactez l'administrateur."];
        }

        // Récupération du mot de passe hashé
        $sql = "SELECT id, nom, prenom, email, password, actif FROM agents WHERE email = :email AND actif = 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['email' => $email]);
        $agentData = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$agentData || !password_verify($password, $agentData['password'])) {
            return ["status" => "error", "message" => "Identifiants incorrects."];
        }

        // Récupération des privilèges
        $privilegesResult = $this->getPrivilegesAgent($agentData['id']);
        if ($privilegesResult['status'] === 'error') {
            return ["status" => "error", "message" => "Erreur lors de la récupération des privilèges."];
        }

        // Création de la session
        $_SESSION['agent_id'] = $agentData['id'];
        $_SESSION['agent_nom'] = $agentData['nom'];
        $_SESSION['agent_prenom'] = $agentData['prenom'];
        $_SESSION['agent_email'] = $agentData['email'];
        $_SESSION['agent_privileges'] = $privilegesResult['data'];
        $_SESSION['user_type'] = 'agent';

        // Journalisation
        $this->logAudit("Connexion de l'agent ID " . $agentData['id'] . ": " . $agentData['prenom'] . ' ' . $agentData['nom']);

        return [
            "status" => "success",
            "message" => "Connexion réussie.",
            "data" => [
                "agent" => [
                    "id" => $agentData['id'],
                    "nom" => $agentData['nom'],
                    "prenom" => $agentData['prenom'],
                    "email" => $agentData['email']
                ],
                "privileges" => $privilegesResult['data']
            ]
        ];
    }

    /**
     * Initialise les privilèges par défaut pour un nouvel agent (aucun privilège)
     *
     * @param int $agentId ID de l'agent
     * @return bool Succès ou échec de l'opération
     * @throws PDOException En cas d'erreur de base de données
     */
    private function initialiserPrivileges($agentId)
    {
        $privilegesParDefaut = [
            // Dashboard
            ['module' => 'Dashboard', 'action' => 'Visualiser', 'description' => 'Accéder au tableau de bord', 'selected' => false],
            
            // Particuliers
            ['module' => 'Particuliers', 'action' => 'Visualiser', 'description' => 'Voir la liste des particuliers', 'selected' => false],
            ['module' => 'Particuliers', 'action' => 'Créer', 'description' => 'Ajouter un nouveau particulier', 'selected' => false],
            ['module' => 'Particuliers', 'action' => 'Modifier', 'description' => 'Modifier un particulier existant', 'selected' => false],
            ['module' => 'Particuliers', 'action' => 'Supprimer', 'description' => 'Supprimer un particulier', 'selected' => false],
            ['module' => 'Particuliers', 'action' => 'Rechercher', 'description' => 'Rechercher des particuliers', 'selected' => false],
            
            // Entreprises
            ['module' => 'Entreprises', 'action' => 'Visualiser', 'description' => 'Voir la liste des entreprises', 'selected' => false],
            ['module' => 'Entreprises', 'action' => 'Créer', 'description' => 'Ajouter une nouvelle entreprise', 'selected' => false],
            ['module' => 'Entreprises', 'action' => 'Modifier', 'description' => 'Modifier une entreprise existante', 'selected' => false],
            ['module' => 'Entreprises', 'action' => 'Supprimer', 'description' => 'Supprimer une entreprise', 'selected' => false],
            ['module' => 'Entreprises', 'action' => 'Rechercher', 'description' => 'Rechercher des entreprises', 'selected' => false],
            
            // Provinces
            ['module' => 'Provinces', 'action' => 'Visualiser', 'description' => 'Voir la liste des provinces', 'selected' => false],
            ['module' => 'Provinces', 'action' => 'Créer', 'description' => 'Ajouter une nouvelle province', 'selected' => false],
            ['module' => 'Provinces', 'action' => 'Modifier', 'description' => 'Modifier une province existante', 'selected' => false],
            ['module' => 'Provinces', 'action' => 'Supprimer', 'description' => 'Supprimer une province', 'selected' => false],
            
            // Sites
            ['module' => 'Sites', 'action' => 'Visualiser', 'description' => 'Voir la liste des sites', 'selected' => false],
            ['module' => 'Sites', 'action' => 'Créer', 'description' => 'Ajouter un nouveau site', 'selected' => false],
            ['module' => 'Sites', 'action' => 'Modifier', 'description' => 'Modifier un site existant', 'selected' => false],
            ['module' => 'Sites', 'action' => 'Supprimer', 'description' => 'Supprimer un site', 'selected' => false],
            
            // Agents
            ['module' => 'Agents', 'action' => 'Visualiser', 'description' => 'Voir la liste des agents', 'selected' => false],
            ['module' => 'Agents', 'action' => 'Créer', 'description' => 'Ajouter un nouvel agent', 'selected' => false],
            ['module' => 'Agents', 'action' => 'Modifier', 'description' => 'Modifier un agent existant', 'selected' => false],
            ['module' => 'Agents', 'action' => 'Supprimer', 'description' => 'Supprimer un agent', 'selected' => false],
            ['module' => 'Agents', 'action' => 'Gérer les privilèges', 'description' => 'Attribuer des droits d\'accès', 'selected' => false],
            
            // Taux
            ['module' => 'Taux', 'action' => 'Visualiser', 'description' => 'Voir les taux appliqués', 'selected' => false],
            ['module' => 'Taux', 'action' => 'Créer', 'description' => 'Ajouter un nouveau taux', 'selected' => false],
            ['module' => 'Taux', 'action' => 'Modifier', 'description' => 'Modifier un taux existant', 'selected' => false],
            ['module' => 'Taux', 'action' => 'Supprimer', 'description' => 'Supprimer un taux', 'selected' => false],
            ['module' => 'Taux', 'action' => 'Rechercher', 'description' => 'Rechercher des taux', 'selected' => false],
            
            // Impôts
            ['module' => 'Impôts', 'action' => 'Visualiser', 'description' => 'Voir la liste des impôts', 'selected' => false],
            ['module' => 'Impôts', 'action' => 'Créer', 'description' => 'Ajouter un nouvel impôt', 'selected' => false],
            ['module' => 'Impôts', 'action' => 'Modifier', 'description' => 'Modifier un impôt existant', 'selected' => false],
            ['module' => 'Impôts', 'action' => 'Supprimer', 'description' => 'Supprimer un impôt', 'selected' => false],
            ['module' => 'Impôts', 'action' => 'Rechercher', 'description' => 'Rechercher des impôts', 'selected' => false],
            
            // Rôles
            ['module' => 'Rôles', 'action' => 'Visualiser', 'description' => 'Voir la liste des rôles', 'selected' => false],
            ['module' => 'Rôles', 'action' => 'Créer', 'description' => 'Créer un nouveau rôle', 'selected' => false],
            ['module' => 'Rôles', 'action' => 'Modifier', 'description' => 'Modifier un rôle existant', 'selected' => false],
            ['module' => 'Rôles', 'action' => 'Supprimer', 'description' => 'Supprimer un rôle', 'selected' => false],
            ['module' => 'Rôles', 'action' => 'Gérer les permissions', 'description' => 'Attribuer des permissions aux rôles', 'selected' => false],
        ];

        try {
            $sql = "INSERT INTO agent_privileges (agent_id, module, action, description, selected) 
                    VALUES (:agent_id, :module, :action, :description, :selected)";
            $stmt = $this->pdo->prepare($sql);

            foreach ($privilegesParDefaut as $privilege) {
                $stmt->execute([
                    ':agent_id' => $agentId,
                    ':module' => $privilege['module'],
                    ':action' => $privilege['action'],
                    ':description' => $privilege['description'],
                    ':selected' => $privilege['selected'] ? 1 : 0
                ]);
            }

            return true;
        } catch (PDOException $e) {
            error_log("Erreur lors de l'initialisation des privilèges: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Génère un mot de passe temporaire à 4 chiffres
     *
     * @return string Mot de passe de 4 chiffres
     */
    private function genererMotDePasseTemporaire()
    {
        return sprintf('%04d', rand(0, 9999));
    }

    /**
     * Envoie un email avec les informations de connexion à l'agent
     *
     * @param string $email Email du destinataire
     * @param string $nomComplet Nom complet de l'agent
     * @param string $motDePasseTemp Mot de passe temporaire
     * @return bool Résultat de l'envoi
     */
    private function envoyerEmailAgent($email, $nomComplet, $motDePasseTemp)
    {
        $sujet = "Vos accès à la plateforme";
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: no-reply@ecadastre.com" . "\r\n";

        $message = $this->genererContenuEmail($nomComplet, $email, $motDePasseTemp);

        return mail($email, $sujet, $message, $headers);
    }

    /**
     * Génère le contenu HTML de l'email de bienvenue
     *
     * @param string $nomComplet Nom complet de l'agent
     * @param string $email Email de l'agent
     * @param string $motDePasseTemp Mot de passe temporaire
     * @return string Contenu HTML de l'email
     */
    private function genererContenuEmail($nomComplet, $email, $motDePasseTemp)
    {
        return <<<HTML
        <html>
        <head>
            <title>Bienvenue sur la plateforme MPAKO</title>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; color: #333; }
                .container { max-width: 600px; margin: auto; padding: 20px; background: #fff; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                h1 { color: #2C3E50; }
                p { font-size: 16px; line-height: 1.6; }
                .info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .footer { margin-top: 20px; font-size: 14px; color: #7F8C8D; }
            </style>
        </head>
        <body>
            <div class='container'>
                <h1>Bienvenue, $nomComplet !</h1>
                <p>Vous avez été ajouté en tant qu'agent sur notre plateforme.</p>
                <p><strong>Vos informations de connexion :</strong></p>
                <div class='info'>
                    <p><strong>Email :</strong> $email</p>
                    <p><strong>Mot de passe temporaire :</strong> $motDePasseTemp</p>
                </div>
                <p>Veuillez vous connecter et changer votre mot de passe dès que possible.</p>
                <p class='footer'>Si vous avez des questions, contactez-nous à support@mpako.net</p>
            </div>
        </body>
        </html>
HTML;
    }

    /**
     * Vérifie si un code de réinitialisation est valide pour un email
     *
     * @param string $email Email de l'agent
     * @param string $code Code de vérification
     * @return array Tableau avec statut et message
     */
    public function verifierCodeReset($email, $code)
    {
        try {
            // Vérification de l'existence de l'agent
            $agent = $this->agentExiste($email);
            if (!$agent) {
                return ["status" => "error", "message" => "Aucun compte associé à cet email."];
            }

            // Vérification du statut actif
            if (!$agent['actif']) {
                return ["status" => "error", "message" => "Votre compte est désactivé. Contactez l'administrateur."];
            }

            // Vérification du code (dans une table de codes temporaires)
            $sql = "SELECT id, code, expires_at FROM password_reset_codes 
                    WHERE user_id = :user_id AND user_type = 'agent' AND code = :code AND used = 0 AND expires_at > NOW()";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                'user_id' => $agent['id'],  // Correction : 'user_id' au lieu de ':agent_id'
                'code' => $code
            ]);
            
            $codeData = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$codeData) {
                return ["status" => "error", "message" => "Code invalide ou expiré."];
            }

            return ["status" => "success", "message" => "Code valide.", "agent_id" => $agent['id']];

        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du code: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Réinitialise le mot de passe d'un agent
     *
     * @param int $agentId ID de l'agent
     * @param string $newPassword Nouveau mot de passe
     * @param string $code Code de vérification utilisé
     * @return array Tableau avec statut et message
     */
    public function reinitialiserMotDePasse($agentId, $newPassword, $code)
    {
        try {
            $this->pdo->beginTransaction();

            // Hash du nouveau mot de passe
            $motDePasseHash = password_hash($newPassword, PASSWORD_BCRYPT);

            // Mise à jour du mot de passe
            $sql = "UPDATE agents 
                    SET password = :password, 
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':password' => $motDePasseHash,
                ':id' => $agentId
            ]);

            // Marquer le code comme utilisé
            $sqlUpdateCode = "UPDATE password_reset_codes SET used = 1 WHERE user_id = :user_id AND user_type = 'agent' AND code = :code";
            $stmtUpdateCode = $this->pdo->prepare($sqlUpdateCode);
            $stmtUpdateCode->execute([
                'user_id' => $agentId,  // Correction : 'user_id' au lieu de ':agent_id'
                'code' => $code
            ]);

            $this->pdo->commit();

            // Récupération des infos de l'agent pour le log
            $agentInfo = $this->agentExisteParId($agentId);
            $this->logAudit("Réinitialisation du mot de passe de l'agent ID $agentId: " . $agentInfo['prenom'] . ' ' . $agentInfo['nom']);

            return ["status" => "success", "message" => "Mot de passe réinitialisé avec succès."];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de la réinitialisation du mot de passe: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Génère et envoie un code de réinitialisation
     *
     * @param string $email Email de l'agent
     * @return array Tableau avec statut et message
     */
    public function envoyerCodeReinitialisation($email)
    {
        try {
            // Vérification de l'existence de l'agent
            $agent = $this->agentExiste($email);
            if (!$agent) {
                return ["status" => "error", "message" => "Aucun compte associé à cet email."];
            }

            // Vérification du statut actif
            if (!$agent['actif']) {
                return ["status" => "error", "message" => "Votre compte est désactivé. Contactez l'administrateur."];
            }

            $this->pdo->beginTransaction();

            // Génération d'un code à 6 chiffres
            $code = sprintf('%06d', rand(0, 999999));
            $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

            // Suppression des anciens codes non utilisés
            $sqlDelete = "DELETE FROM password_reset_codes WHERE agent_id = :agent_id AND used = 0";
            $stmtDelete = $this->pdo->prepare($sqlDelete);
            $stmtDelete->execute([':agent_id' => $agent['id']]);

            // Insertion du nouveau code
            $sqlInsert = "INSERT INTO password_reset_codes (user_id, user_type, code, expires_at) 
                          VALUES (:user_id, :user_type, :code, :expires_at)";
            $stmtInsert = $this->pdo->prepare($sqlInsert);
            $stmtInsert->execute([
                ':user_id' => $agent['id'],
                ':user_type' => 'agent',
                ':code' => $code,
                ':expires_at' => $expiresAt
            ]);

            $this->pdo->commit();

            // Envoi de l'email avec le code
            $this->envoyerEmailCodeReset($agent['email'], $agent['prenom'] . ' ' . $agent['nom'], $code);

            $this->logAudit("Envoi de code de réinitialisation à l'agent ID " . $agent['id'] . ": " . $agent['prenom'] . ' ' . $agent['nom']);

            return ["status" => "success", "message" => "Un code de réinitialisation a été envoyé à votre adresse email."];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'envoi du code de réinitialisation: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Envoie un email avec le code de réinitialisation
     *
     * @param string $email Email du destinataire
     * @param string $nomComplet Nom complet de l'agent
     * @param string $code Code de réinitialisation
     * @return bool Résultat de l'envoi
     */
    private function envoyerEmailCodeReset($email, $nomComplet, $code)
    {
        $sujet = "Code de réinitialisation de mot de passe";
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: no-reply@ecadastre.com" . "\r\n";

        $message = $this->genererContenuEmailCodeReset($nomComplet, $code);

        return mail($email, $sujet, $message, $headers);
    }

    /**
     * Génère le contenu HTML de l'email de réinitialisation
     *
     * @param string $nomComplet Nom complet de l'agent
     * @param string $code Code de réinitialisation
     * @return string Contenu HTML de l'email
     */
    private function genererContenuEmailCodeReset($nomComplet, $code)
    {
        return <<<HTML
        <html>
        <head>
            <title>Réinitialisation de mot de passe</title>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; color: #333; }
                .container { max-width: 600px; margin: auto; padding: 20px; background: #fff; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                h1 { color: #2C3E50; }
                p { font-size: 16px; line-height: 1.6; }
                .code { font-size: 24px; font-weight: bold; color: #E74C3C; background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; margin: 15px 0; }
                .footer { margin-top: 20px; font-size: 14px; color: #7F8C8D; }
            </style>
        </head>
        <body>
            <div class='container'>
                <h1>Réinitialisation de mot de passe</h1>
                <p>Bonjour $nomComplet,</p>
                <p>Vous avez demandé à réinitialiser votre mot de passe. Voici votre code de vérification :</p>
                <div class='code'>$code</div>
                <p>Ce code est valable pendant 15 minutes. Si vous n'avez pas fait cette demande, veuillez ignorer cet email.</p>
                <p class='footer'>Si vous avez des questions, contactez-nous à support@ecadastre.com</p>
            </div>
        </body>
        </html>
    HTML;
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