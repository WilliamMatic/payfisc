<?php
require_once 'Connexion.php';

/**
 * Classe Utilisateur - Gestion complète des utilisateurs
 * 
 * Cette classe étend la classe Connexion et fournit toutes les fonctionnalités
 * de gestion des utilisateurs, incluant :
 * - Création, modification, suppression et activation/désactivation des utilisateurs
 * - Vérification de l'unicité des téléphones
 * - Gestion des mots de passe avec génération automatique
 * - Logs d'audit pour toutes les opérations
 * - Gestion des privilèges (simple, special, delivrance, plaque, reproduction)
 */
class Utilisateur extends Connexion
{
    /**
     * Vérifie l'existence d'un utilisateur par son téléphone
     *
     * @param string $telephone Téléphone à vérifier
     * @return array|false Données de l'utilisateur si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function utilisateurExisteParTelephone($telephone)
    {
        try {
            $sql = "SELECT id, nom_complet, telephone, actif, site_affecte_id, privilege_json FROM utilisateurs WHERE telephone = :telephone";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['telephone' => $telephone]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence de l'utilisateur: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'un utilisateur par son ID
     *
     * @param int $id ID de l'utilisateur
     * @return array|false Données complètes de l'utilisateur si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function utilisateurExisteParId($id)
    {
        try {
            $sql = "SELECT u.*, s.nom as site_nom, s.code as site_code, s.formule as site_formule, s.template_carte_actuel, p.id as province_id, p.code as province_code, s.parent AS extension_site
                    FROM utilisateurs u 
                    LEFT JOIN sites s ON u.site_affecte_id = s.id 
                    INNER JOIN provinces p ON p.id = s.province_id
                    WHERE u.id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'utilisateur par ID: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'un site par son ID
     *
     * @param int $id ID du site
     * @return array|false Données du site si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function siteExisteParId($id)
    {
        try {
            $sql = "SELECT id, nom, code, actif FROM sites WHERE id = :id AND actif = 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du site: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Ajoute un nouvel utilisateur au système
     *
     * @param string $nomComplet Nom complet de l'utilisateur
     * @param string $telephone Numéro de téléphone
     * @param string $adresse Adresse de l'utilisateur
     * @param int $siteAffecteId ID du site d'affectation
     * @param array $privileges Tableau des privilèges
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function ajouterUtilisateur($nomComplet, $telephone, $adresse, $siteAffecteId, $privileges = [])
    {
        // ============ VALIDATION DES DONNÉES ============
        if (empty($nomComplet) || empty($telephone) || empty($siteAffecteId)) {
            return ["status" => "error", "message" => "Le nom complet, le téléphone et le site sont obligatoires."];
        }

        // Validation du format du téléphone
        if (!preg_match('/^\+?[0-9\s\-\(\)]{8,20}$/', $telephone)) {
            return ["status" => "error", "message" => "Le format du téléphone est invalide."];
        }

        if ($this->utilisateurExisteParTelephone($telephone)) {
            return ["status" => "error", "message" => "Ce numéro de téléphone est déjà utilisé."];
        }

        // Vérification de l'existence du site
        if (!$this->siteExisteParId($siteAffecteId)) {
            return ["status" => "error", "message" => "Le site sélectionné n'existe pas ou est inactif."];
        }

        // Validation et formatage des privilèges
        $privilegesJson = $this->validerEtFormaterPrivileges($privileges);

        // ============ TRAITEMENT PRINCIPAL ============
        try {
            $this->pdo->beginTransaction();

            // Génération d'un mot de passe temporaire à 4 chiffres
            $motDePasseTemp = $this->genererMotDePasseTemporaire();
            $motDePasseHash = password_hash($motDePasseTemp, PASSWORD_BCRYPT);

            // Insertion de l'utilisateur
            $sql = "INSERT INTO utilisateurs (nom_complet, telephone, adresse, site_affecte_id, password, privilege_json) 
                    VALUES (:nom_complet, :telephone, :adresse, :site_affecte_id, :password, :privilege_json)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom_complet' => $nomComplet,
                ':telephone' => $telephone,
                ':adresse' => $adresse,
                ':site_affecte_id' => $siteAffecteId,
                ':password' => $motDePasseHash,
                ':privilege_json' => $privilegesJson
            ]);

            $utilisateurId = $this->pdo->lastInsertId();

            $this->pdo->commit();

            // Envoi d'SMS avec les informations de connexion (à adapter selon votre système SMS)
            $this->envoyerSMSUtilisateur($telephone, $nomComplet, $motDePasseTemp);

            // Log d'audit
            $this->logAudit("Ajout de l'utilisateur ID $utilisateurId: $nomComplet ($telephone)");

            return ["status" => "success", "message" => "Utilisateur ajouté avec succès. Les informations de connexion ont été envoyées par SMS."];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'ajout de l'utilisateur: " . $e->getMessage());
            
            if ($e->getCode() == '23000') {
                return ["status" => "error", "message" => "Cet utilisateur existe déjà."];
            }
            
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Modifie les informations d'un utilisateur existant
     *
     * @param int $id ID de l'utilisateur à modifier
     * @param string $nomComplet Nouveau nom complet
     * @param string $telephone Nouveau téléphone
     * @param string $adresse Nouvelle adresse
     * @param int $siteAffecteId Nouveau site ID
     * @param array $privileges Nouveaux privilèges
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function modifierUtilisateur($id, $nomComplet, $telephone, $adresse, $siteAffecteId, $privileges = [])
    {
        // Validation des champs obligatoires
        if (empty($nomComplet) || empty($telephone) || empty($siteAffecteId)) {
            return ["status" => "error", "message" => "Le nom complet, le téléphone et le site sont obligatoires."];
        }

        // Validation du format du téléphone
        if (!preg_match('/^\+?[0-9\s\-\(\)]{8,20}$/', $telephone)) {
            return ["status" => "error", "message" => "Le format du téléphone est invalide."];
        }

        // Vérification de l'existence du site
        if (!$this->siteExisteParId($siteAffecteId)) {
            return ["status" => "error", "message" => "Le site sélectionné n'existe pas ou est inactif."];
        }

        // Validation et formatage des privilèges
        $privilegesJson = $this->validerEtFormaterPrivileges($privileges);

        try {
            // Vérification de l'unicité du nouveau téléphone
            $sqlCheck = "SELECT id FROM utilisateurs WHERE telephone = :telephone AND id != :id";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([':telephone' => $telephone, ':id' => $id]);

            if ($stmtCheck->rowCount() > 0) {
                return ["status" => "error", "message" => "Ce numéro de téléphone est déjà utilisé par un autre utilisateur."];
            }

            // Mise à jour des informations
            $sql = "UPDATE utilisateurs 
                    SET nom_complet = :nom_complet, 
                        telephone = :telephone, 
                        adresse = :adresse,
                        site_affecte_id = :site_affecte_id,
                        privilege_json = :privilege_json,
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom_complet' => $nomComplet,
                ':telephone' => $telephone,
                ':adresse' => $adresse,
                ':site_affecte_id' => $siteAffecteId,
                ':privilege_json' => $privilegesJson,
                ':id' => $id
            ]);

            // Log d'audit
            $this->logAudit("Modification de l'utilisateur ID $id: $nomComplet ($telephone)");

            return ["status" => "success", "message" => "Les informations de l'utilisateur ont été mises à jour."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification de l'utilisateur: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime un utilisateur du système
     *
     * @param int $id ID de l'utilisateur à supprimer
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function supprimerUtilisateur($id)
    {
        // Vérification de l'existence de l'utilisateur
        $utilisateur = $this->utilisateurExisteParId($id);
        if (!$utilisateur) {
            return ["status" => "error", "message" => "L'utilisateur spécifié n'existe pas."];
        }

        try {
            // Suppression de l'utilisateur
            $sql = "DELETE FROM utilisateurs WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);

            // Log d'audit
            $this->logAudit("Suppression de l'utilisateur ID $id: " . $utilisateur['nom_complet'] . ' (' . $utilisateur['telephone'] . ')');

            return ["status" => "success", "message" => "L'utilisateur a été supprimé avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de l'utilisateur: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Change le statut actif/inactif d'un utilisateur
     *
     * @param int $id ID de l'utilisateur
     * @param bool $actif Nouveau statut (true = actif, false = inactif)
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function changerStatutUtilisateur($id, $actif)
    {
        // Vérification de l'existence de l'utilisateur
        $utilisateur = $this->utilisateurExisteParId($id);
        if (!$utilisateur) {
            return ["status" => "error", "message" => "L'utilisateur spécifié n'existe pas."];
        }

        try {
            $sql = "UPDATE utilisateurs 
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
            $this->logAudit("Changement de statut de l'utilisateur ID $id: " . $utilisateur['nom_complet'] . ' -> ' . $statut);

            return ["status" => "success", "message" => "L'utilisateur a été $statut avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors du changement de statut de l'utilisateur: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Authentifie un utilisateur par téléphone et mot de passe
     *
     * @param string $telephone Téléphone de l'utilisateur
     * @param string $password Mot de passe en clair
     * @return array Tableau avec statut, message et données de l'utilisateur
     */
    public function authentifierUtilisateur($telephone, $password)
    {
        // Vérification de l'existence
        $utilisateur = $this->utilisateurExisteParTelephone($telephone);
        if (!$utilisateur) {
            return ["status" => "error", "message" => "Identifiants incorrects."];
        }

        // Vérification du statut actif
        if (!$utilisateur['actif']) {
            return ["status" => "error", "message" => "Votre compte est désactivé. Contactez l'administrateur."];
        }

        // Récupération du mot de passe hashé
        $sql = "SELECT u.*, s.nom as site_nom, s.code as site_code, s.id as site_id, s.formule as site_formule, 
                s.template_carte_actuel,
                p.id as province_id, p.code as province_code, s.parent as extension_site
                FROM utilisateurs u 
                INNER JOIN sites s ON u.site_affecte_id = s.id 
                INNER JOIN provinces p ON p.id = s.province_id 
                WHERE u.telephone = :telephone AND u.actif = 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['telephone' => $telephone]);
        $utilisateurData = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$utilisateurData || !password_verify($password, $utilisateurData['password'])) {
            return ["status" => "error", "message" => "Identifiants incorrects."];
        }

        // Décodage des privilèges
        $privileges = json_decode($utilisateurData['privilege_json'], true) ?? [];

        // Création de la session
        $_SESSION['user_id'] = $utilisateurData['id'];
        $_SESSION['user_nom'] = $utilisateurData['nom_complet'];
        $_SESSION['user_telephone'] = $utilisateurData['telephone'];
        $_SESSION['user_type'] = 'utilisateur';
        $_SESSION['site_affecte_id'] = $utilisateurData['site_affecte_id'];
        $_SESSION['site_nom'] = $utilisateurData['site_nom'];
        $_SESSION['site_formule'] = $utilisateurData['site_formule'];
        $_SESSION['privileges'] = $privileges;

        // Journalisation
        $this->logAudit("Connexion de l'utilisateur ID " . $utilisateurData['id'] . ": " . $utilisateurData['nom_complet']);

        return [
            "status" => "success",
            "message" => "Connexion réussie.",
            "data" => [
                "utilisateur" => [
                    "id" => $utilisateurData['id'],
                    "nom_complet" => $utilisateurData['nom_complet'],
                    "telephone" => $utilisateurData['telephone'],
                    "adresse" => $utilisateurData['adresse'],
                    "site_nom" => $utilisateurData['site_nom'],
                    "site_code" => $utilisateurData['site_code'],
                    "formule" => $utilisateurData['site_formule'],
                    "privileges" => $privileges,
                    "privileges_include" => $utilisateurData['privilege_json'],
                    "province_id" => $utilisateurData['province_id'],
                    "province_code" => $utilisateurData['province_code'],
                    "extension_site" => $utilisateurData['extension_site'],
                    "template_carte_actuel" => (int)$utilisateurData['template_carte_actuel']
                ]
            ]
        ];
    }

    /**
     * Récupère la liste de tous les utilisateurs
     *
     * @return array Liste des utilisateurs ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerUtilisateurs()
    {
        try {
            $sql = "SELECT u.id, u.nom_complet, u.telephone, u.adresse, u.actif, u.privilege_json,
                    s.nom as site_nom, s.code as site_code,
                    DATE_FORMAT(u.date_creation, '%d/%m/%Y') as date_creation 
                    FROM utilisateurs u 
                    LEFT JOIN sites s ON u.site_affecte_id = s.id 
                    ORDER BY u.nom_complet ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Décodage des privilèges JSON pour chaque utilisateur
            foreach ($resultats as &$utilisateur) {
                $utilisateur['privileges'] = json_decode($utilisateur['privilege_json'], true) ?? [
                    'ventePlaque' => ['simple' => false, 'special' => false, 'delivrance' => false, 'correctionErreur' => false, 'plaque' => false, 'reproduction' => false, 'series' => false, 'autresTaxes' => false],
                    'vignette' => ['venteDirecte' => false, 'delivrance' => false, 'renouvellement' => false],
                    'assurance' => ['venteDirecte' => false, 'delivrance' => false, 'renouvellement' => false],
                ];
                unset($utilisateur['privilege_json']);
            }

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des utilisateurs: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Recherche des utilisateurs par terme de recherche
     *
     * @param string $searchTerm Terme de recherche
     * @return array Liste des utilisateurs correspondants ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function rechercherUtilisateurs($searchTerm)
    {
        try {
            $sql = "SELECT u.id, u.nom_complet, u.telephone, u.adresse, u.actif, u.privilege_json,
                    s.nom as site_nom, s.code as site_code,
                    DATE_FORMAT(u.date_creation, '%d/%m/%Y') as date_creation 
                    FROM utilisateurs u 
                    LEFT JOIN sites s ON u.site_affecte_id = s.id 
                    WHERE u.nom_complet LIKE :search 
                    OR u.telephone LIKE :search 
                    OR u.adresse LIKE :search 
                    OR s.nom LIKE :search
                    ORDER BY u.nom_complet ASC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':search' => '%' . $searchTerm . '%']);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Décodage des privilèges JSON pour chaque utilisateur
            foreach ($resultats as &$utilisateur) {
                $utilisateur['privileges'] = json_decode($utilisateur['privilege_json'], true) ?? [
                    'ventePlaque' => ['simple' => false, 'special' => false, 'delivrance' => false, 'correctionErreur' => false, 'plaque' => false, 'reproduction' => false, 'series' => false, 'autresTaxes' => false],
                    'vignette' => ['venteDirecte' => false, 'delivrance' => false, 'renouvellement' => false],
                    'assurance' => ['venteDirecte' => false, 'delivrance' => false, 'renouvellement' => false],
                ];
                unset($utilisateur['privilege_json']);
            }

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des utilisateurs: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de tous les sites actifs
     *
     * @return array Liste des sites ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerSitesActifs()
    {
        try {
            $sql = "SELECT id, nom, code FROM sites WHERE actif = 1 ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des sites: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Valide et formate les privilèges
     *
     * @param array $privileges Tableau des privilèges
     * @return string JSON des privilèges validés
     */
    private function validerEtFormaterPrivileges($privileges)
    {
        $privilegesParDefaut = [
            'ventePlaque' => [
                'simple' => false,
                'special' => false,
                'delivrance' => false,
                'correctionErreur' => false,
                'plaque' => false,
                'reproduction' => false,
                'series' => false,
                'autresTaxes' => false,
            ],
            'vignette' => [
                'venteDirecte' => false,
                'delivrance' => false,
                'renouvellement' => false,
            ],
            'assurance' => [
                'venteDirecte' => false,
                'delivrance' => false,
                'renouvellement' => false,
            ],
        ];

        // Fusion profonde avec les valeurs par défaut
        $privilegesValides = [];
        foreach ($privilegesParDefaut as $category => $defaults) {
            $categoryData = isset($privileges[$category]) && is_array($privileges[$category]) ? $privileges[$category] : [];
            $privilegesValides[$category] = [];
            foreach ($defaults as $key => $defaultValue) {
                $privilegesValides[$category][$key] = isset($categoryData[$key]) ? (bool)$categoryData[$key] : $defaultValue;
            }
        }

        return json_encode($privilegesValides);
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
     * Envoie un SMS avec les informations de connexion à l'utilisateur
     *
     * @param string $telephone Numéro de téléphone
     * @param string $nomComplet Nom complet de l'utilisateur
     * @param string $motDePasseTemp Mot de passe temporaire
     * @return bool Résultat de l'envoi
     */
    private function envoyerSMSUtilisateur($telephone, $nomComplet, $motDePasseTemp)
    {
        // À ADAPTER selon votre système d'envoi SMS
        // Exemple avec une API SMS fictive
        $message = "Bonjour $nomComplet, vos accès plateforme MPAKO. Téléphone: $telephone, Mot de passe: $motDePasseTemp. Changez votre mot de passe après connexion.";
        
        // Ici vous intégrerez votre service SMS (Orange, Twilio, etc.)
        // return $this->envoyerSMS($telephone, $message);
        
        // Pour l'instant, on log juste le message
        error_log("SMS à envoyer à $telephone: $message");
        return true;
    }

    /**
     * Vérifie si un code de réinitialisation est valide pour un téléphone
     *
     * @param string $telephone Téléphone de l'utilisateur
     * @param string $code Code de vérification
     * @return array Tableau avec statut et message
     */
    public function verifierCodeReset($telephone, $code)
    {
        try {
            // Vérification de l'existence de l'utilisateur
            $utilisateur = $this->utilisateurExisteParTelephone($telephone);
            if (!$utilisateur) {
                return ["status" => "error", "message" => "Aucun compte associé à ce numéro de téléphone."];
            }

            // Vérification du statut actif
            if (!$utilisateur['actif']) {
                return ["status" => "error", "message" => "Votre compte est désactivé. Contactez l'administrateur."];
            }

            // Vérification du code (dans une table de codes temporaires)
            $sql = "SELECT id, code, expires_at FROM password_reset_codes 
                    WHERE user_id = :user_id AND user_type = 'utilisateur' AND code = :code AND used = 0 AND expires_at > NOW()";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':user_id' => $utilisateur['id'],  // Supprimer l'apostrophe autour de la clé
                ':code' => $code
            ]);
            
            $codeData = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$codeData) {
                return ["status" => "error", "message" => "Code invalide ou expiré."];
            }

            return ["status" => "success", "message" => "Code valide.", "utilisateur_id" => $utilisateur['id']];

        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du code: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Réinitialise le mot de passe d'un utilisateur
     *
     * @param int $utilisateurId ID de l'utilisateur
     * @param string $newPassword Nouveau mot de passe
     * @param string $code Code de vérification utilisé
     * @return array Tableau avec statut et message
     */
    public function reinitialiserMotDePasse($utilisateurId, $newPassword, $code)
    {
        try {
            $this->pdo->beginTransaction();

            // Hash du nouveau mot de passe
            $motDePasseHash = password_hash($newPassword, PASSWORD_BCRYPT);

            // Mise à jour du mot de passe
            $sql = "UPDATE utilisateurs 
                    SET password = :password, 
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':password' => $motDePasseHash,
                ':id' => $utilisateurId
            ]);

            // Marquer le code comme utilisé
            $sqlUpdateCode = "UPDATE password_reset_codes SET used = 1 WHERE user_id = :user_id AND user_type = 'utilisateur' AND code = :code";
            $stmtUpdateCode = $this->pdo->prepare($sqlUpdateCode);
            $stmtUpdateCode->execute([
                ':user_id' => $utilisateurId,
                ':code' => $code
            ]);

            $this->pdo->commit();

            // Récupération des infos de l'utilisateur pour le log
            $utilisateurInfo = $this->utilisateurExisteParId($utilisateurId);
            $this->logAudit("Réinitialisation du mot de passe de l'utilisateur ID $utilisateurId: " . $utilisateurInfo['nom_complet']);

            return ["status" => "success", "message" => "Mot de passe réinitialisé avec succès."];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de la réinitialisation du mot de passe: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Génère et envoie un code de réinitialisation pour les utilisateurs
     *
     * @param string $telephone Téléphone de l'utilisateur
     * @return array Tableau avec statut et message
     */
    public function envoyerCodeReinitialisation($telephone)
    {
        try {
            // Vérification de l'existence de l'utilisateur
            $utilisateur = $this->utilisateurExisteParTelephone($telephone);
            if (!$utilisateur) {
                return ["status" => "error", "message" => "Aucun compte associé à ce numéro de téléphone."];
            }

            // Vérification du statut actif
            if (!$utilisateur['actif']) {
                return ["status" => "error", "message" => "Votre compte est désactivé. Contactez l'administrateur."];
            }

            $this->pdo->beginTransaction();

            // Vérification s'il existe déjà un code non utilisé pour cet utilisateur
            $sqlCheck = "SELECT id FROM password_reset_codes 
                         WHERE user_id = :user_id 
                         AND user_type = 'utilisateur'
                         AND used = 0";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([':user_id' => $utilisateur['id']]);
            $oldCode = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            // Suppression uniquement si un code existe
            if ($oldCode) {
                $sqlDelete = "DELETE FROM password_reset_codes 
                              WHERE user_id = :user_id 
                              AND user_type = 'utilisateur' 
                              AND used = 0";
                $stmtDelete = $this->pdo->prepare($sqlDelete);
                $stmtDelete->execute([':user_id' => $utilisateur['id']]);
            }

            // Génération d'un nouveau code
            $code = sprintf('%06d', rand(0, 999999));
            $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

            // Insertion du nouveau code
            $sqlInsert = "INSERT INTO password_reset_codes (user_id, user_type, code, expires_at) 
                          VALUES (:user_id, :user_type, :code, :expires_at)";
            $stmtInsert = $this->pdo->prepare($sqlInsert);
            $stmtInsert->execute([
                ':user_id' => $utilisateur['id'],
                ':user_type' => 'utilisateur',
                ':code' => $code,
                ':expires_at' => $expiresAt
            ]);

            $this->pdo->commit();

            // Envoi du SMS
            $this->envoyerSMSCodeReset($utilisateur['telephone'], $utilisateur['nom_complet'], $code);

            $this->logAudit("Envoi de code de réinitialisation à l'utilisateur ID " . $utilisateur['id']);

            return ["status" => "success", "message" => "Un code de réinitialisation a été envoyé à votre numéro de téléphone."];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'envoi du code de réinitialisation: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Envoie un SMS avec le code de réinitialisation
     *
     * @param string $telephone Numéro de téléphone
     * @param string $nomComplet Nom complet de l'utilisateur
     * @param string $code Code de réinitialisation
     * @return bool Résultat de l'envoi
     */
    private function envoyerSMSCodeReset($telephone, $nomComplet, $code)
    {
        $message = "Bonjour $nomComplet, votre code de réinitialisation MPAKO est: $code. Valable 15 min.";
        
        // Ici vous intégrerez votre service SMS (Orange, Twilio, etc.)
        // return $this->envoyerSMS($telephone, $message);
        
        // Pour l'instant, on log juste le message
        error_log("SMS de réinitialisation à envoyer à $telephone: $message");
        return true;
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