<?php
require_once 'Connexion.php';

/**
 * Classe Contribuable - Gestion complète des contribuables (particuliers et entreprises)
 * 
 * Cette classe étend la classe Connexion et fournit toutes les fonctionnalités
 * d'authentification des contribuables
 */
class Contribuable extends Connexion
{
    /**
     * Authentifie un contribuable par NIF et mot de passe
     *
     * @param string $nif Numéro Fiscal (NIF)
     * @param string $password Mot de passe en clair
     * @return array Tableau avec statut, message et données du contribuable
     */
    public function authentifierContribuable($nif, $password)
    {
        // ============ VALIDATION DES DONNÉES ============
        if (empty($nif) || empty($password)) {
            return ["status" => "error", "message" => "Le NIF et le mot de passe sont obligatoires."];
        }

        // Validation du format du NIF (chiffres uniquement)
        if (!preg_match('/^[0-9]+$/', $nif)) {
            return ["status" => "error", "message" => "Le format du NIF est invalide."];
        }

        try {
            
            // ============ RECHERCHE DANS LES PARTICULIERS ============
            $sqlParticulier = "SELECT id, nom, prenom, nif, email, password, actif 
                              FROM particuliers 
                              WHERE nif = :nif AND actif = 1 AND password = :password";
            $stmtParticulier = $this->pdo->prepare($sqlParticulier);
            $stmtParticulier->execute(['nif' => $nif, 'password' => $password]);
            $particulier = $stmtParticulier->fetch(PDO::FETCH_ASSOC);

            if ($particulier) {
                return $this->preparerReponseSucces($particulier, 'particulier');
            }

            // ============ RECHERCHE DANS LES ENTREPRISES ============
            $sqlEntreprise = "SELECT id, raison_sociale, nif, email, password, actif, representant_legal
                             FROM entreprises 
                             WHERE nif = :nif AND actif = 1 AND password = :password";
            $stmtEntreprise = $this->pdo->prepare($sqlEntreprise);
            $stmtEntreprise->execute(['nif' => $nif, 'password' => $password]);
            $entreprise = $stmtEntreprise->fetch(PDO::FETCH_ASSOC);

            if ($entreprise) {
                return $this->preparerReponseSucces($entreprise, 'entreprise');
            }

            // ============ ÉCHEC D'AUTHENTIFICATION ============
            return ["status" => "error", "message" => "NIF ou mot de passe incorrect."];

        } catch (PDOException $e) {
            error_log("Erreur lors de l'authentification du contribuable: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: L'authentification a échoué."];
        }
    }

    /**
     * Prépare la réponse de succès d'authentification
     *
     * @param array $data Données du contribuable
     * @param string $type Type de contribuable (particulier/entreprise)
     * @return array Réponse formatée
     */
    private function preparerReponseSucces($data, $type)
    {
        $userData = [
            "id" => (int)$data['id'],
            "nif" => $data['nif'],
            "type" => $type,
            "email" => $data['email'] ?? null
        ];

        // Ajout des champs spécifiques selon le type
        if ($type === 'particulier') {
            $userData["nom"] = $data['nom'];
            $userData["prenom"] = $data['prenom'];
        } else {
            $userData["raison_sociale"] = $data['raison_sociale'];
            $userData["representant_legal"] = $data['representant_legal'] ?? null;
        }

        // Log d'audit
        $this->logAudit("Connexion du contribuable " . $type . " ID " . $data['id'] . ": " . ($type === 'particulier' ? $data['prenom'] . ' ' . $data['nom'] : $data['raison_sociale']));

        return [
            "status" => "success",
            "message" => "Authentification réussie.",
            "user" => $userData
        ];
    }

    /**
     * Vérifie l'existence d'un contribuable par son NIF
     *
     * @param string $nif Numéro Fiscal à vérifier
     * @return array|false Données du contribuable si trouvé, false sinon
     */
    public function contribuableExisteParNif($nif)
    {
        try {
            // Recherche dans les particuliers
            $sqlParticulier = "SELECT id, nom, prenom, nif, email, 'particulier' as type 
                              FROM particuliers 
                              WHERE nif = :nif AND actif = 1";
            $stmtParticulier = $this->pdo->prepare($sqlParticulier);
            $stmtParticulier->execute(['nif' => $nif]);
            $particulier = $stmtParticulier->fetch(PDO::FETCH_ASSOC);

            if ($particulier) {
                return $particulier;
            }

            // Recherche dans les entreprises
            $sqlEntreprise = "SELECT id, raison_sociale, nif, email, 'entreprise' as type 
                             FROM entreprises 
                             WHERE nif = :nif AND actif = 1";
            $stmtEntreprise = $this->pdo->prepare($sqlEntreprise);
            $stmtEntreprise->execute(['nif' => $nif]);
            $entreprise = $stmtEntreprise->fetch(PDO::FETCH_ASSOC);

            return $entreprise ?: false;

        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du contribuable: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Vérifie l'unicité des champs critiques avant l'inscription
     *
     * @param array $data Données du formulaire d'inscription
     * @return array Tableau avec statut et message d'erreur si doublon trouvé
     */
    private function verifierUniciteChamps($data)
    {
        try {
            $userType = $data['userType'];
            
            // Vérification du NIF (commun aux deux types)
            if ($this->contribuableExisteParNif($data['nif'])) {
                return ["status" => "error", "message" => "Ce NIF est déjà utilisé."];
            }

            // Vérification de l'email (commun aux deux types)
            if ($this->champExisteDeja('email', $data['email'], $userType)) {
                return ["status" => "error", "message" => "Cette adresse email est déjà utilisée."];
            }

            // Vérification du téléphone (commun aux deux types)
            if ($this->champExisteDeja('telephone', $data['telephone'], $userType)) {
                return ["status" => "error", "message" => "Ce numéro de téléphone est déjà utilisé."];
            }

            // Vérifications spécifiques aux particuliers
            if ($userType === 'particulier') {
                if (!empty($data['id_national']) && $this->champExisteDeja('id_national', $data['id_national'], 'particulier')) {
                    return ["status" => "error", "message" => "Cet identifiant national est déjà utilisé."];
                }
            }

            // Vérifications spécifiques aux entreprises
            if ($userType === 'entreprise') {
                if (!empty($data['registre_commerce']) && $this->champExisteDeja('registre_commerce', $data['registre_commerce'], 'entreprise')) {
                    return ["status" => "error", "message" => "Ce numéro de registre de commerce est déjà utilisé."];
                }
            }

            return ["status" => "success", "message" => "Tous les champs sont uniques."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification d'unicité: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système lors de la vérification des données."];
        }
    }

    /**
     * Vérifie si un champ existe déjà dans la base de données
     *
     * @param string $champ Nom du champ à vérifier
     * @param string $valeur Valeur du champ
     * @param string $type Type de contribuable (particulier/entreprise)
     * @return bool True si le champ existe déjà, false sinon
     */
    private function champExisteDeja($champ, $valeur, $type)
    {
        if (empty($valeur)) {
            return false;
        }

        try {
            $table = ($type === 'particulier') ? 'particuliers' : 'entreprises';
            $sql = "SELECT COUNT(*) as count FROM $table WHERE $champ = :valeur AND actif = 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':valeur' => $valeur]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return $result['count'] > 0;

        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du champ $champ: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Inscrit un nouveau contribuable (particulier ou entreprise)
     *
     * @param array $data Données du formulaire d'inscription
     * @return array Tableau avec statut et message
     */
    public function inscrireContribuable($data)
    {
        // ============ VALIDATION DES DONNÉES OBLIGATOIRES ============
        if (empty($data['nif']) || empty($data['email']) || empty($data['telephone'])) {
            return ["status" => "error", "message" => "Les champs NIF, email et téléphone sont obligatoires."];
        }

        // Validation du format du NIF
        if (!preg_match('/^[0-9]+$/', $data['nif'])) {
            return ["status" => "error", "message" => "Le format du NIF est invalide (chiffres uniquement)."];
        }

        // Validation de l'email
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return ["status" => "error", "message" => "L'adresse email est invalide."];
        }

        try {
            // ============ VÉRIFICATION D'UNICITÉ DES CHAMPS CRITIQUES ============
            $verificationUnicite = $this->verifierUniciteChamps($data);
            if ($verificationUnicite['status'] === 'error') {
                return $verificationUnicite;
            }

            // ============ INSCRIPTION SELON LE TYPE ============
            if ($data['userType'] === 'particulier') {
                return $this->inscrireParticulier($data);
            } else {
                return $this->inscrireEntreprise($data);
            }

        } catch (PDOException $e) {
            error_log("Erreur lors de l'inscription du contribuable: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: L'inscription a échoué."];
        }
    }

    /**
     * Inscrit un particulier
     *
     * @param array $data Données du particulier
     * @return array Résultat de l'inscription
     */
    private function inscrireParticulier($data)
    {
        // Validation des champs obligatoires pour les particuliers
        if (empty($data['nom']) || empty($data['prenom']) || empty($data['date_naissance']) || empty($data['sexe'])) {
            return ["status" => "error", "message" => "Tous les champs obligatoires pour les particuliers doivent être remplis."];
        }

        $sql = "INSERT INTO particuliers (
                    nom, prenom, date_naissance, lieu_naissance, sexe, 
                    rue, ville, code_postal, province, id_national, 
                    telephone, email, nif, situation_familiale, dependants,
                    password
                ) VALUES (
                    :nom, :prenom, :date_naissance, :lieu_naissance, :sexe,
                    :rue, :ville, :code_postal, :province, :id_national,
                    :telephone, :email, :nif, :situation_familiale, :dependants,
                    :password
                )";

        $stmt = $this->pdo->prepare($sql);
        
        // Conversion de la date de naissance
        $date_naissance = $this->convertirDate($data['date_naissance']);
        
        $result = $stmt->execute([
            ':nom' => $data['nom'] ?? null,
            ':prenom' => $data['prenom'] ?? null,
            ':date_naissance' => $date_naissance,
            ':lieu_naissance' => $data['lieu_naissance'] ?? null,
            ':sexe' => $data['sexe'] ?? null,
            ':rue' => $data['rue'] ?? null,
            ':ville' => $data['ville'] ?? null,
            ':code_postal' => $data['code_postal'] ?? null,
            ':province' => $data['province'] ?? null,
            ':id_national' => $data['id_national'] ?? null,
            ':telephone' => $data['telephone'] ?? null,
            ':email' => $data['email'] ?? null,
            ':nif' => $data['nif'],
            ':situation_familiale' => $data['situation_familiale'] ?? null,
            ':dependants' => $data['dependants'] ?? 0,
            ':password' => $data['nif'] // Mot de passe par défaut = NIF
        ]);

        if ($result) {
            $idParticulier = $this->pdo->lastInsertId();
            $this->logAudit("Inscription du particulier: " . $data['prenom'] . ' ' . $data['nom'] . " (NIF: " . $data['nif'] . ")");
            
            // Créer une notification de bienvenue
            $this->creerNotificationInscription($data['nif'], $idParticulier, 'particulier', $data['prenom'] . ' ' . $data['nom']);
            
            return ["status" => "success", "message" => "Inscription réussie. Votre mot de passe est votre NIF."];
        } else {
            return ["status" => "error", "message" => "Erreur lors de l'inscription."];
        }
    }

    /**
     * Inscrit une entreprise
     *
     * @param array $data Données de l'entreprise
     * @return array Résultat de l'inscription
     */
    private function inscrireEntreprise($data)
    {
        // Validation des champs obligatoires pour les entreprises
        if (empty($data['raison_sociale']) || empty($data['forme_juridique']) || empty($data['registre_commerce']) || empty($data['representant_legal'])) {
            return ["status" => "error", "message" => "Tous les champs obligatoires pour les entreprises doivent être remplis."];
        }

        $sql = "INSERT INTO entreprises (
                    raison_sociale, forme_juridique, nif, registre_commerce,
                    date_creation, adresse_siege, telephone, email, representant_legal,
                    password
                ) VALUES (
                    :raison_sociale, :forme_juridique, :nif, :registre_commerce,
                    :date_creation, :adresse_siege, :telephone, :email, :representant_legal,
                    :password
                )";

        $stmt = $this->pdo->prepare($sql);
        
        // Conversion de la date de création
        $date_creation = !empty($data['date_creation']) ? $this->convertirDate($data['date_creation']) : null;

        $result = $stmt->execute([
            ':raison_sociale' => $data['raison_sociale'] ?? null,
            ':forme_juridique' => $data['forme_juridique'] ?? null,
            ':nif' => $data['nif'],
            ':registre_commerce' => $data['registre_commerce'] ?? null,
            ':date_creation' => $date_creation,
            ':adresse_siege' => $data['adresse_siege'] ?? null,
            ':telephone' => $data['telephone'] ?? null,
            ':email' => $data['email'] ?? null,
            ':representant_legal' => $data['representant_legal'] ?? null,
            ':password' => $data['nif'] // Mot de passe par défaut = NIF
        ]);

        if ($result) {
            $idEntreprise = $this->pdo->lastInsertId();
            $this->logAudit("Inscription de l'entreprise: " . $data['raison_sociale'] . " (NIF: " . $data['nif'] . ")");
            
            // Créer une notification de bienvenue
            $this->creerNotificationInscription($data['nif'], $idEntreprise, 'entreprise', $data['raison_sociale']);
            
            return ["status" => "success", "message" => "Inscription réussie. Votre mot de passe est votre NIF."];
        } else {
            return ["status" => "error", "message" => "Erreur lors de l'inscription."];
        }
    }

    /**
     * Crée une notification pour l'inscription d'un nouveau contribuable
     *
     * @param string $nif NIF du contribuable
     * @param int $idUtilisateur ID de l'utilisateur
     * @param string $type Type de contribuable (particulier/entreprise)
     * @param string $nom Nom ou raison sociale du contribuable
     * @return bool Succès de l'insertion
     */
    private function creerNotificationInscription($nif, $idUtilisateur, $type, $nom)
    {
        try {
            $sql = "INSERT INTO notifications (
                        type_notification, 
                        id_utilisateur, 
                        nif_contribuable, 
                        titre, 
                        message, 
                        lu, 
                        date_creation
                    ) VALUES (
                        :type_notification,
                        :id_utilisateur,
                        :nif_contribuable,
                        :titre,
                        :message,
                        :lu,
                        NOW()
                    )";

            $stmt = $this->pdo->prepare($sql);
            
            $typeLibelle = ($type === 'particulier') ? 'particulier' : 'entreprise';
            
            return $stmt->execute([
                ':type_notification' => 'inscription_reussie',
                ':id_utilisateur' => $idUtilisateur,
                ':nif_contribuable' => $nif,
                ':titre' => "Nouvel inscrit via l'app",
                ':message' => "Yo! Un nouveau compte ($typeLibelle) vient d'être créé via l'application mobile. NIF : $nif. Bienvenue à bord !",
                ':lu' => 0
            ]);
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la création de la notification d'inscription: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Convertit une date du format JJ/MM/AAAA vers AAAA-MM-JJ
     *
     * @param string $date Date au format JJ/MM/AAAA
     * @return string|null Date au format AAAA-MM-JJ ou null si invalide
     */
    private function convertirDate($date)
    {
        if (empty($date)) {
            return null;
        }

        $parts = explode('/', $date);
        if (count($parts) === 3) {
            return $parts[2] . '-' . $parts[1] . '-' . $parts[0];
        }

        return null;
    }

    /**
     * Log une action dans le journal d'audit
     *
     * @param string $message Message à logger
     * @return void
     */
    public function logAudit($message)
    {
        try {
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
        } catch (PDOException $e) {
            error_log("Erreur lors du log d'audit: " . $e->getMessage());
        }
    }
}
?>