<?php
require_once 'Connexion.php';

/**
 * Classe Entreprise - Gestion complète des entreprises
 * 
 * Cette classe étend la classe Connexion et fournit toutes les fonctionnalités
 * de gestion des entreprises, incluant :
 * - Création, modification, suppression et activation/désactivation des entreprises
 * - Génération automatique de mots de passe pour les entreprises
 * - Envoi des informations de connexion par email
 * - Validation des données et vérification des doublons
 * - Logs d'audit pour toutes les opérations
 */
class Entreprise extends Connexion
{
    /**
     * Vérifie l'existence d'une entreprise par son NIF
     *
     * @param string $nif NIF à vérifier
     * @return array|false Données de l'entreprise si trouvée, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function entrepriseExisteParNif($nif)
    {
        try {
            $sql = "SELECT id, raison_sociale, nif, registre_commerce, actif, reduction_type, reduction_valeur FROM entreprises WHERE nif = :nif";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['nif' => $nif]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence de l'entreprise par NIF: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'une entreprise par son registre de commerce
     *
     * @param string $rc Registre de commerce à vérifier
     * @return array|false Données de l'entreprise si trouvée, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function entrepriseExisteParRc($rc)
    {
        try {
            $sql = "SELECT id, raison_sociale, nif, registre_commerce, actif, reduction_type, reduction_valeur FROM entreprises WHERE registre_commerce = :rc";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['rc' => $rc]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence de l'entreprise par RC: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'une entreprise par son ID
     *
     * @param int $id ID de l'entreprise
     * @return array|false Données complètes de l'entreprise si trouvée, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function entrepriseExisteParId($id)
    {
        try {
            $sql = "SELECT * FROM entreprises WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'entreprise par ID: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'une entreprise par son email
     *
     * @param string $email Email à vérifier
     * @return array|false Données de l'entreprise si trouvée, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function entrepriseExisteParEmail($email)
    {
        try {
            $sql = "SELECT id, raison_sociale, nif, email, actif, reduction_type, reduction_valeur FROM entreprises WHERE email = :email";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['email' => $email]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence de l'entreprise par email: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'une entreprise par son téléphone
     *
     * @param string $telephone Téléphone à vérifier
     * @return array|false Données de l'entreprise si trouvée, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function entrepriseExisteParTelephone($telephone)
    {
        try {
            $sql = "SELECT id, raison_sociale, nif, telephone, actif, reduction_type, reduction_valeur FROM entreprises WHERE telephone = :telephone";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['telephone' => $telephone]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence de l'entreprise par téléphone: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Ajoute une nouvelle entreprise au système
     *
     * @param array $data Données de l'entreprise
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function ajouterEntreprise($data)
    {
        // ============ VALIDATION DES DONNÉES ============
        if (empty($data['raison_sociale']) || empty($data['nif']) || empty($data['registre_commerce']) || 
            empty($data['email']) || empty($data['telephone'])) {
            return ["status" => "error", "message" => "Les champs raison sociale, NIF, registre de commerce, email et téléphone sont obligatoires."];
        }

        if ($this->entrepriseExisteParNif($data['nif'])) {
            return ["status" => "error", "message" => "Ce NIF est déjà utilisé par une autre entreprise."];
        }

        if ($this->entrepriseExisteParRc($data['registre_commerce'])) {
            return ["status" => "error", "message" => "Ce registre de commerce est déjà utilisé par une autre entreprise."];
        }

        if ($this->entrepriseExisteParEmail($data['email'])) {
            return ["status" => "error", "message" => "Cette adresse email est déjà utilisée par une autre entreprise."];
        }

        if ($this->entrepriseExisteParTelephone($data['telephone'])) {
            return ["status" => "error", "message" => "Ce numéro de téléphone est déjà utilisé par une autre entreprise."];
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return ["status" => "error", "message" => "L'adresse email n'est pas valide."];
        }

        // Validation de la réduction
        if (!empty($data['reduction_type'])) {
            if (!in_array($data['reduction_type'], ['pourcentage', 'fixe'])) {
                return ["status" => "error", "message" => "Type de réduction invalide."];
            }
            
            if ($data['reduction_valeur'] <= 0) {
                return ["status" => "error", "message" => "La valeur de réduction doit être supérieure à 0."];
            }
            
            if ($data['reduction_type'] === 'pourcentage' && $data['reduction_valeur'] > 100) {
                return ["status" => "error", "message" => "Le pourcentage de réduction ne peut pas dépasser 100%."];
            }
        }

        // ============ TRAITEMENT PRINCIPAL ============
        try {
            $this->pdo->beginTransaction();

            // Génération d'un mot de passe temporaire à 4 chiffres
            $motDePasseTemp = $this->genererMotDePasseTemporaire();
            $motDePasseHash = password_hash($motDePasseTemp, PASSWORD_BCRYPT);

            // Récupérer les infos du site si site_code est fourni
            $siteId = null;
            $provinceId = null;

            if (!empty($data['site_code'])) {
                $sqlSite = "SELECT id, province_id FROM sites WHERE code = :code AND actif = 1";
                $stmtSite = $this->pdo->prepare($sqlSite);
                $stmtSite->execute([':code' => $data['site_code']]);
                $site = $stmtSite->fetch(PDO::FETCH_ASSOC);

                if ($site) {
                    $siteId = $site['id'];
                    $provinceId = $site['province_id'];
                }
            }

            // Insertion de l'entreprise
            $sql = "INSERT INTO entreprises (raison_sociale, forme_juridique, nif, registre_commerce, 
                    date_creation, adresse_siege, telephone, email, representant_legal, password, actif, utilisateur, site, province, reduction_type, reduction_valeur) 
                    VALUES (:raison_sociale, :forme_juridique, :nif, :registre_commerce, 
                    :date_creation, :adresse_siege, :telephone, :email, :representant_legal, :password, :actif, :utilisateur, :site, :province, :reduction_type, :reduction_valeur)";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':raison_sociale' => $data['raison_sociale'],
                ':forme_juridique' => $data['forme_juridique'] ?? '',
                ':nif' => $data['nif'],
                ':registre_commerce' => $data['registre_commerce'],
                ':date_creation' => $data['date_creation'] ?? null,
                ':adresse_siege' => $data['adresse_siege'] ?? '',
                ':telephone' => $data['telephone'],
                ':email' => $data['email'],
                ':representant_legal' => $data['representant_legal'] ?? '',
                ':password' => $motDePasseHash,
                ':actif' => true,
                ':utilisateur' => $data['utilisateur_id'],
                ':site' => $siteId,
                ':province' => $provinceId,
                ':reduction_type' => $data['reduction_type'] ?? null,
                ':reduction_valeur' => $data['reduction_valeur'] ?? 0
            ]);

            $entrepriseId = $this->pdo->lastInsertId();

            $this->pdo->commit();

            // Envoi d'email avec les informations de connexion
            $this->envoyerEmailEntreprise($data['email'], $data['raison_sociale'], $motDePasseTemp);

            // Log d'audit
            $this->logAudit("Ajout de l'entreprise ID $entrepriseId: " . $data['raison_sociale'] . " (NIF: " . $data['nif'] . ")");

            return ["status" => "success", "message" => "Entreprise ajoutée avec succès. Les informations de connexion ont été envoyées par email."];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'ajout de l'entreprise: " . $e->getMessage());
            
            if ($e->getCode() == '23000') {
                if (strpos($e->getMessage(), 'nif') !== false) {
                    return ["status" => "error", "message" => "Ce NIF est déjà utilisé par une autre entreprise."];
                } elseif (strpos($e->getMessage(), 'registre_commerce') !== false) {
                    return ["status" => "error", "message" => "Ce registre de commerce est déjà utilisé par une autre entreprise."];
                } elseif (strpos($e->getMessage(), 'email') !== false) {
                    return ["status" => "error", "message" => "Cette adresse email est déjà utilisée par une autre entreprise."];
                } elseif (strpos($e->getMessage(), 'telephone') !== false) {
                    return ["status" => "error", "message" => "Ce numéro de téléphone est déjà utilisé par une autre entreprise."];
                }
            }
            
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Modifie les informations d'une entreprise existante
     *
     * @param int $id ID de l'entreprise à modifier
     * @param array $data Nouvelles données
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function modifierEntreprise($id, $data)
    {
        // Validation des champs obligatoires
        if (empty($data['raison_sociale']) || empty($data['nif']) || empty($data['registre_commerce']) || 
            empty($data['email']) || empty($data['telephone'])) {
            return ["status" => "error", "message" => "Les champs raison sociale, NIF, registre de commerce, email et téléphone sont obligatoires."];
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return ["status" => "error", "message" => "L'adresse email n'est pas valide."];
        }

        // Validation de la réduction
        if (!empty($data['reduction_type'])) {
            if (!in_array($data['reduction_type'], ['pourcentage', 'fixe'])) {
                return ["status" => "error", "message" => "Type de réduction invalide."];
            }
            
            if ($data['reduction_valeur'] <= 0) {
                return ["status" => "error", "message" => "La valeur de réduction doit être supérieure à 0."];
            }
            
            if ($data['reduction_type'] === 'pourcentage' && $data['reduction_valeur'] > 100) {
                return ["status" => "error", "message" => "Le pourcentage de réduction ne peut pas dépasser 100%."];
            }
        }

        try {
            // Vérification de l'unicité des champs
            $sqlCheckNif = "SELECT id FROM entreprises WHERE nif = :nif AND id != :id";
            $stmtCheckNif = $this->pdo->prepare($sqlCheckNif);
            $stmtCheckNif->execute([':nif' => $data['nif'], ':id' => $id]);

            if ($stmtCheckNif->rowCount() > 0) {
                return ["status" => "error", "message" => "Ce NIF est déjà utilisé par une autre entreprise."];
            }

            $sqlCheckRc = "SELECT id FROM entreprises WHERE registre_commerce = :rc AND id != :id";
            $stmtCheckRc = $this->pdo->prepare($sqlCheckRc);
            $stmtCheckRc->execute([':rc' => $data['registre_commerce'], ':id' => $id]);

            if ($stmtCheckRc->rowCount() > 0) {
                return ["status" => "error", "message" => "Ce registre de commerce est déjà utilisé par une autre entreprise."];
            }

            $sqlCheckEmail = "SELECT id FROM entreprises WHERE email = :email AND id != :id";
            $stmtCheckEmail = $this->pdo->prepare($sqlCheckEmail);
            $stmtCheckEmail->execute([':email' => $data['email'], ':id' => $id]);

            if ($stmtCheckEmail->rowCount() > 0) {
                return ["status" => "error", "message" => "Cette adresse email est déjà utilisée par une autre entreprise."];
            }

            $sqlCheckTelephone = "SELECT id FROM entreprises WHERE telephone = :telephone AND id != :id";
            $stmtCheckTelephone = $this->pdo->prepare($sqlCheckTelephone);
            $stmtCheckTelephone->execute([':telephone' => $data['telephone'], ':id' => $id]);

            if ($stmtCheckTelephone->rowCount() > 0) {
                return ["status" => "error", "message" => "Ce numéro de téléphone est déjà utilisé par une autre entreprise."];
            }

            // Mise à jour des informations
            $sql = "UPDATE entreprises 
                    SET raison_sociale = :raison_sociale, 
                        forme_juridique = :forme_juridique,
                        nif = :nif,
                        registre_commerce = :registre_commerce,
                        date_creation = :date_creation,
                        adresse_siege = :adresse_siege,
                        telephone = :telephone,
                        email = :email,
                        representant_legal = :representant_legal,
                        reduction_type = :reduction_type,
                        reduction_valeur = :reduction_valeur,
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':raison_sociale' => $data['raison_sociale'],
                ':forme_juridique' => $data['forme_juridique'] ?? '',
                ':nif' => $data['nif'],
                ':registre_commerce' => $data['registre_commerce'],
                ':date_creation' => $data['date_creation'] ?? null,
                ':adresse_siege' => $data['adresse_siege'] ?? '',
                ':telephone' => $data['telephone'],
                ':email' => $data['email'],
                ':representant_legal' => $data['representant_legal'] ?? '',
                ':reduction_type' => $data['reduction_type'] ?? null,
                ':reduction_valeur' => $data['reduction_valeur'] ?? 0,
                ':id' => $id
            ]);

            // Log d'audit
            $this->logAudit("Modification de l'entreprise ID $id: " . $data['raison_sociale'] . " (NIF: " . $data['nif'] . ")");

            return ["status" => "success", "message" => "Les informations de l'entreprise ont été mises à jour."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification de l'entreprise: " . $e->getMessage());
            
            if ($e->getCode() == '23000') {
                if (strpos($e->getMessage(), 'nif') !== false) {
                    return ["status" => "error", "message" => "Ce NIF est déjà utilisé par une autre entreprise."];
                } elseif (strpos($e->getMessage(), 'registre_commerce') !== false) {
                    return ["status" => "error", "message" => "Ce registre de commerce est déjà utilisé par une autre entreprise."];
                } elseif (strpos($e->getMessage(), 'email') !== false) {
                    return ["status" => "error", "message" => "Cette adresse email est déjà utilisée par une autre entreprise."];
                } elseif (strpos($e->getMessage(), 'telephone') !== false) {
                    return ["status" => "error", "message" => "Ce numéro de téléphone est déjà utilisé par une autre entreprise."];
                }
            }
            
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime une entreprise du système
     *
     * @param int $id ID de l'entreprise à supprimer
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function supprimerEntreprise($id)
    {
        // Vérification de l'existence de l'entreprise
        $entreprise = $this->entrepriseExisteParId($id);
        if (!$entreprise) {
            return ["status" => "error", "message" => "L'entreprise spécifiée n'existe pas."];
        }

        try {
            // Suppression de l'entreprise
            $sql = "DELETE FROM entreprises WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);

            // Log d'audit
            $this->logAudit("Suppression de l'entreprise ID $id: " . $entreprise['raison_sociale'] . ' (' . $entreprise['nif'] . ')');

            return ["status" => "success", "message" => "L'entreprise a été supprimée avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de l'entreprise: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Change le statut actif/inactif d'une entreprise
     *
     * @param int $id ID de l'entreprise
     * @param bool $actif Nouveau statut (true = actif, false = inactif)
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function changerStatutEntreprise($id, $actif)
    {
        // Vérification de l'existence de l'entreprise
        $entreprise = $this->entrepriseExisteParId($id);
        if (!$entreprise) {
            return ["status" => "error", "message" => "L'entreprise spécifiée n'existe pas."];
        }

        try {
            $sql = "UPDATE entreprises 
                    SET actif = :actif, 
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);

            // Convertir en entier et binder comme INT
            $actifInt = $actif ? 1 : 0;
            $stmt->bindValue(':actif', $actifInt, PDO::PARAM_INT);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);

            $stmt->execute();

            $statut = $actifInt === 1 ? "activée" : "désactivée";
            $this->logAudit("Changement de statut de l'entreprise ID $id: " . $entreprise['raison_sociale'] . ' -> ' . $statut);

            return ["status" => "success", "message" => "L'entreprise a été $statut avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors du changement de statut de l'entreprise: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de toutes les entreprises
     *
     * @return array Liste des entreprises ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerEntreprises()
    {
        try {
            $sql = "SELECT id, raison_sociale, forme_juridique, nif, registre_commerce, 
                    date_creation, adresse_siege, telephone, email, representant_legal, actif, reduction_type, reduction_valeur,
                    DATE_FORMAT(date_creation_enregistrement, '%d/%m/%Y') as date_creation_enregistrement 
                    FROM entreprises 
                    ORDER BY raison_sociale ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des entreprises: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Recherche des entreprises selon un terme
     *
     * @param string $searchTerm Terme de recherche
     * @return array Liste des entreprises correspondantes ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function rechercherEntreprises($searchTerm)
    {
        try {
            $sql = "SELECT id, raison_sociale, forme_juridique, nif, registre_commerce, 
                    date_creation, adresse_siege, telephone, email, representant_legal, actif, reduction_type, reduction_valeur,
                    DATE_FORMAT(date_creation_enregistrement, '%d/%m/%Y') as date_creation_enregistrement 
                    FROM entreprises 
                    WHERE raison_sociale LIKE :search 
                    OR nif LIKE :search 
                    OR registre_commerce LIKE :search
                    OR email LIKE :search
                    OR telephone LIKE :search
                    ORDER BY raison_sociale ASC";
            
            $stmt = $this->pdo->prepare($sql);
            $searchPattern = '%' . $searchTerm . '%';
            $stmt->execute([':search' => $searchPattern]);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des entreprises: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Authentifie une entreprise par email et mot de passe
     *
     * @param string $email Email de l'entreprise
     * @param string $password Mot de passe en clair
     * @return array Tableau avec statut, message et données de l'entreprise
     */
    public function authentifierEntreprise($email, $password)
    {
        // Vérification de l'existence
        $entreprise = $this->entrepriseExisteParEmail($email);
        if (!$entreprise) {
            return ["status" => "error", "message" => "Identifiants incorrects."];
        }

        // Vérification du statut actif
        if (!$entreprise['actif']) {
            return ["status" => "error", "message" => "Votre compte est désactivé. Contactez l'administrateur."];
        }

        // Récupération du mot de passe hashé
        $sql = "SELECT id, raison_sociale, nif, email, password, actif FROM entreprises WHERE email = :email AND actif = 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['email' => $email]);
        $entrepriseData = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$entrepriseData || !password_verify($password, $entrepriseData['password'])) {
            return ["status" => "error", "message" => "Identifiants incorrects."];
        }

        // Création de la session
        $_SESSION['entreprise_id'] = $entrepriseData['id'];
        $_SESSION['entreprise_raison_sociale'] = $entrepriseData['raison_sociale'];
        $_SESSION['entreprise_nif'] = $entrepriseData['nif'];
        $_SESSION['entreprise_email'] = $entrepriseData['email'];
        $_SESSION['user_type'] = 'entreprise';

        // Journalisation
        $this->logAudit("Connexion de l'entreprise ID " . $entrepriseData['id'] . ": " . $entrepriseData['raison_sociale']);

        return [
            "status" => "success",
            "message" => "Connexion réussie.",
            "data" => [
                "id" => $entrepriseData['id'],
                "raison_sociale" => $entrepriseData['raison_sociale'],
                "nif" => $entrepriseData['nif'],
                "email" => $entrepriseData['email']
            ]
        ];
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
     * Envoie un email avec les informations de connexion à l'entreprise
     *
     * @param string $email Email du destinataire
     * @param string $raisonSociale Raison sociale de l'entreprise
     * @param string $motDePasseTemp Mot de passe temporaire
     * @return bool Résultat de l'envoi
     */
    private function envoyerEmailEntreprise($email, $raisonSociale, $motDePasseTemp)
    {
        $sujet = "Vos accès à la plateforme PayFisc";
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: no-reply@ecadastre.com" . "\r\n";

        $message = $this->genererContenuEmail($raisonSociale, $email, $motDePasseTemp);

        return mail($email, $sujet, $message, $headers);
    }

    /**
     * Génère le contenu HTML de l'email de bienvenue pour l'entreprise
     *
     * @param string $raisonSociale Raison sociale de l'entreprise
     * @param string $email Email de l'entreprise
     * @param string $motDePasseTemp Mot de passe temporaire
     * @return string Contenu HTML de l'email
     */
    private function genererContenuEmail($raisonSociale, $email, $motDePasseTemp)
    {
        return <<<HTML
        <html>
        <head>
            <title>Bienvenue sur la plateforme PayFisc</title>
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
                <h1>Bienvenue, $raisonSociale !</h1>
                <p>Votre entreprise a été enregistrée sur notre plateforme PayFisc.</p>
                <p><strong>Vos informations de connexion :</strong></p>
                <div class='info'>
                    <p><strong>Email :</strong> $email</p>
                    <p><strong>Mot de passe temporaire :</strong> $motDePasseTemp</p>
                </div>
                <p>Veuillez vous connecter et changer votre mot de passe dès que possible.</p>
                <p class='footer'>Si vous avez des questions, contactez-nous à support@ecadastre.com</p>
            </div>
        </body>
        </html>
HTML;
    }

    /**
     * Vérifie si un code de réinitialisation est valide pour un email d'entreprise
     *
     * @param string $email Email de l'entreprise
     * @param string $code Code de vérification
     * @return array Tableau avec statut et message
     */
    public function verifierCodeReset($email, $code)
    {
        try {
            // Vérification de l'existence de l'entreprise
            $entreprise = $this->entrepriseExisteParEmail($email);
            if (!$entreprise) {
                return ["status" => "error", "message" => "Aucun compte associé à cet email."];
            }

            // Vérification du statut actif
            if (!$entreprise['actif']) {
                return ["status" => "error", "message" => "Votre compte est désactivé. Contactez l'administrateur."];
            }

            // Vérification du code (dans une table de codes temporaires)
            $sql = "SELECT id, code, expires_at FROM password_reset_codes 
                    WHERE entreprise_id = :entreprise_id AND code = :code AND used = 0 AND expires_at > NOW()";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':entreprise_id' => $entreprise['id'],
                ':code' => $code
            ]);
            
            $codeData = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$codeData) {
                return ["status" => "error", "message" => "Code invalide ou expiré."];
            }

            return ["status" => "success", "message" => "Code valide.", "entreprise_id" => $entreprise['id']];

        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du code: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Réinitialise le mot de passe d'une entreprise
     *
     * @param int $entrepriseId ID de l'entreprise
     * @param string $newPassword Nouveau mot de passe
     * @param string $code Code de vérification utilisé
     * @return array Tableau avec statut et message
     */
    public function reinitialiserMotDePasse($entrepriseId, $newPassword, $code)
    {
        try {
            $this->pdo->beginTransaction();

            // Hash du nouveau mot de passe
            $motDePasseHash = password_hash($newPassword, PASSWORD_BCRYPT);

            // Mise à jour du mot de passe
            $sql = "UPDATE entreprises 
                    SET password = :password, 
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':password' => $motDePasseHash,
                ':id' => $entrepriseId
            ]);

            // Marquer le code comme utilisé
            $sqlUpdateCode = "UPDATE password_reset_codes SET used = 1 WHERE entreprise_id = :entreprise_id AND code = :code";
            $stmtUpdateCode = $this->pdo->prepare($sqlUpdateCode);
            $stmtUpdateCode->execute([
                ':entreprise_id' => $entrepriseId,
                ':code' => $code
            ]);

            $this->pdo->commit();

            // Récupération des infos de l'entreprise pour le log
            $entrepriseInfo = $this->entrepriseExisteParId($entrepriseId);
            $this->logAudit("Réinitialisation du mot de passe de l'entreprise ID $entrepriseId: " . $entrepriseInfo['raison_sociale']);

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
     * @param string $email Email de l'entreprise
     * @return array Tableau avec statut et message
     */
    public function envoyerCodeReinitialisation($email)
    {
        try {
            // Vérification de l'existence de l'entreprise
            $entreprise = $this->entrepriseExisteParEmail($email);
            if (!$entreprise) {
                return ["status" => "error", "message" => "Aucun compte associé à cet email."];
            }

            // Vérification du statut actif
            if (!$entreprise['actif']) {
                return ["status" => "error", "message" => "Votre compte est désactivé. Contactez l'administrateur."];
            }

            $this->pdo->beginTransaction();

            // Génération d'un code à 6 chiffres
            $code = sprintf('%06d', rand(0, 999999));
            $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

            // Suppression des anciens codes non utilisés
            $sqlDelete = "DELETE FROM password_reset_codes WHERE entreprise_id = :entreprise_id AND used = 0";
            $stmtDelete = $this->pdo->prepare($sqlDelete);
            $stmtDelete->execute([':entreprise_id' => $entreprise['id']]);

            // Insertion du nouveau code
            $sqlInsert = "INSERT INTO password_reset_codes (entreprise_id, code, expires_at) 
                          VALUES (:entreprise_id, :code, :expires_at)";
            $stmtInsert = $this->pdo->prepare($sqlInsert);
            $stmtInsert->execute([
                ':entreprise_id' => $entreprise['id'],
                ':code' => $code,
                ':expires_at' => $expiresAt
            ]);

            $this->pdo->commit();

            // Envoi de l'email avec le code
            $this->envoyerEmailCodeReset($entreprise['email'], $entreprise['raison_sociale'], $code);

            $this->logAudit("Envoi de code de réinitialisation à l'entreprise ID " . $entreprise['id'] . ": " . $entreprise['raison_sociale']);

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
     * @param string $raisonSociale Raison sociale de l'entreprise
     * @param string $code Code de réinitialisation
     * @return bool Résultat de l'envoi
     */
    private function envoyerEmailCodeReset($email, $raisonSociale, $code)
    {
        $sujet = "Code de réinitialisation de mot de passe";
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: no-reply@ecadastre.com" . "\r\n";

        $message = $this->genererContenuEmailCodeReset($raisonSociale, $code);

        return mail($email, $sujet, $message, $headers);
    }

    /**
     * Génère le contenu HTML de l'email de réinitialisation
     *
     * @param string $raisonSociale Raison sociale de l'entreprise
     * @param string $code Code de réinitialisation
     * @return string Contenu HTML de l'email
     */
    private function genererContenuEmailCodeReset($raisonSociale, $code)
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
                <p>Bonjour $raisonSociale,</p>
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