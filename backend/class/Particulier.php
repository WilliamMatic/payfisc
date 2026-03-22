<?php
require_once 'Connexion.php';

/**
 * Classe Particulier - Gestion complète des contribuables particuliers
 * 
 * Cette classe étend la classe Connexion et fournit toutes les fonctionnalités
 * de gestion des particuliers, incluant :
 * - Création, modification, suppression et activation/désactivation des particuliers
 * - Génération automatique de mots de passe
 * - Validation des données et envoi d'email avec les informations
 * - Logs d'audit pour toutes les opérations
 */
class Particulier extends Connexion
{

    /**
     * Récupère la province_id d'un utilisateur via son site
     */
    private function getProvinceIdByUtilisateur($utilisateurId)
    {
        try {
            $sql = "SELECT s.id AS province_id 
                    FROM utilisateurs u 
                    JOIN sites s ON u.site_affecte_id = s.id 
                    WHERE u.id = :utilisateur_id";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':utilisateur_id' => $utilisateurId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$result || !$result['province_id']) {
                throw new Exception("Province non trouvée pour cet utilisateur");
            }

            return $result['province_id'];
        } catch (PDOException $e) {
            error_log("Erreur récupération province: " . $e->getMessage());
            throw $e;
        }
    }


    /**
     * Vérifie l'existence d'un particulier par son NIF
     *
     * @param string $nif NIF à vérifier
     * @return array|false Données du particulier si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function particulierExiste($nif)
    {
        try {
            $sql = "SELECT id, nom, prenom, nif, actif FROM particuliers WHERE nif = :nif";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['nif' => $nif]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence du particulier: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'un particulier par son ID
     *
     * @param int $id ID du particulier
     * @return array|false Données complètes du particulier si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
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
     * Vérifie l'existence d'un particulier par son email
     *
     * @param string $email Email à vérifier
     * @return array|false Données du particulier si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function particulierExisteParEmail($email)
    {
        try {
            $sql = "SELECT id, nom, prenom, nif, email, actif FROM particuliers WHERE email = :email";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['email' => $email]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence du particulier par email: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'un particulier par son ID national
     *
     * @param string $idNational ID national à vérifier
     * @return array|false Données du particulier si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function particulierExisteParIdNational($idNational)
    {
        try {
            $sql = "SELECT id, nom, prenom, nif, id_national, actif FROM particuliers WHERE id_national = :id_national";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id_national' => $idNational]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence du particulier par ID national: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'un particulier par son téléphone
     *
     * @param string $telephone Téléphone à vérifier
     * @return array|false Données du particulier si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function particulierExisteParTelephone($telephone)
    {
        try {
            $sql = "SELECT id, nom, prenom, nif, telephone, actif FROM particuliers WHERE telephone = :telephone";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['telephone' => $telephone]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence du particulier par téléphone: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Ajoute un nouveau particulier au système
     *
     * @param array $data Données du particulier
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function ajouterParticulier($data)
    {
        // ============ VALIDATION DES DONNÉES - CORRIGÉ ============
        // CORRECTION : Seulement nom, prénom, téléphone, rue obligatoires
        if (empty($data['nom']) || empty($data['prenom']) || 
            empty($data['telephone']) || empty($data['rue'])) {
            return ["status" => "error", "message" => "Les champs nom, prénom, téléphone et rue sont obligatoires."];
        }

        // Vérification de l'unicité du NIF seulement s'il est fourni
        if (!empty($data['nif']) && $this->particulierExiste($data['nif'])) {
            return ["status" => "error", "message" => "Ce NIF est déjà utilisé."];
        }

        if (!empty($data['email']) && $this->particulierExisteParEmail($data['email'])) {
            return ["status" => "error", "message" => "Cette adresse email est déjà utilisée."];
        }

        if ($this->particulierExisteParTelephone($data['telephone'])) {
            return ["status" => "error", "message" => "Ce numéro de téléphone est déjà utilisé."];
        }

        if (!empty($data['id_national']) && $this->particulierExisteParIdNational($data['id_national'])) {
            return ["status" => "error", "message" => "Cet ID national est déjà utilisé."];
        }

        if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return ["status" => "error", "message" => "L'adresse email n'est pas valide."];
        }

        // Validation de la réduction
        if (!empty($data['reduction_type'])) {
            if (!in_array($data['reduction_type'], ['pourcentage', 'montant_fixe'])) {
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

            // Insertion du particulier
            $sql = "INSERT INTO particuliers (nom, prenom, date_naissance, lieu_naissance, sexe, rue, ville, code_postal, province, id_national, telephone, email, nif, situation_familiale, dependants, password, site, utilisateur, reduction_type, reduction_valeur) 
                    VALUES (:nom, :prenom, :date_naissance, :lieu_naissance, :sexe, :rue, :ville, :code_postal, :province, :id_national, :telephone, :email, :nif, :situation_familiale, :dependants, :password, :site, :utilisateur, :reduction_type, :reduction_valeur)";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom' => $data['nom'],
                ':prenom' => $data['prenom'],
                ':date_naissance' => !empty($data['date_naissance']) ? $data['date_naissance'] : null,
                ':lieu_naissance' => !empty($data['lieu_naissance']) ? $data['lieu_naissance'] : null,
                ':sexe' => !empty($data['sexe']) ? $data['sexe'] : null,
                ':rue' => $data['rue'], // obligatoire
                ':ville' => !empty($data['ville']) ? $data['ville'] : null,
                ':code_postal' => !empty($data['code_postal']) ? $data['code_postal'] : null,
                ':province' => !empty($data['province']) ? $data['province'] : $provinceId,
                ':id_national' => !empty($data['id_national']) ? $data['id_national'] : null,
                ':telephone' => $data['telephone'], // obligatoire
                ':email' => !empty($data['email']) ? $data['email'] : null,
                ':nif' => !empty($data['nif']) ? $data['nif'] : null, // OPTIONNEL MAINTENANT
                ':situation_familiale' => !empty($data['situation_familiale']) ? $data['situation_familiale'] : null,
                ':dependants' => isset($data['dependants']) ? $data['dependants'] : 0,
                ':password' => $motDePasseHash,
                ':site' => $siteId,
                ':utilisateur' => $data['utilisateur'],
                ':reduction_type' => $data['reduction_type'] ?? null,
                ':reduction_valeur' => $data['reduction_valeur'] ?? 0
            ]);

            $particulierId = $this->pdo->lastInsertId();

            $this->pdo->commit();

            // Envoi d'email avec les informations (si email fourni)
            if (!empty($data['email'])) {
                $this->envoyerEmailParticulier($data['email'], $data['prenom'] . ' ' . $data['nom'], $data['nif'] ?? 'Non fourni', $motDePasseTemp);
            }

            // Log d'audit
            $this->logAudit("Ajout du particulier ID $particulierId: " . $data['prenom'] . ' ' . $data['nom'] . ' (Téléphone: ' . $data['telephone'] . ')');

            return ["status" => "success", "message" => "Particulier ajouté avec succès."];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'ajout du particulier: " . $e->getMessage());

            if ($e->getCode() == '23000') {
                if (strpos($e->getMessage(), 'nif') !== false) {
                    return ["status" => "error", "message" => "Ce NIF est déjà utilisé."];
                } elseif (strpos($e->getMessage(), 'email') !== false) {
                    return ["status" => "error", "message" => "Cette adresse email est déjà utilisée."];
                } elseif (strpos($e->getMessage(), 'telephone') !== false) {
                    return ["status" => "error", "message" => "Ce numéro de téléphone est déjà utilisé."];
                } elseif (strpos($e->getMessage(), 'id_national') !== false) {
                    return ["status" => "error", "message" => "Cet ID national est déjà utilisé."];
                }
            }

            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Modifie les informations d'un particulier existant
     *
     * @param int $id ID du particulier à modifier
     * @param array $data Nouvelles données
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function modifierParticulier($id, $data)
    {
        // CORRECTION : Normalisation minimale des entrées pour les vérifications
        $getVal = function($k) use ($data) {
            if (!array_key_exists($k, $data)) return null;
            if (is_string($data[$k])) return trim($data[$k]);
            return $data[$k];
        };

        // CORRECTION : Seulement nom, prénom, téléphone, rue obligatoires
        // Utiliser isset + trim check pour ne pas considérer "0" comme vide
        if (!isset($data['nom']) || trim($data['nom']) === '' ||
            !isset($data['prenom']) || trim($data['prenom']) === '' ||
            !isset($data['telephone']) || trim($data['telephone']) === '' ||
            !isset($data['rue']) || trim($data['rue']) === '') {
            return ["status" => "error", "message" => "Les champs nom, prénom, téléphone et rue sont obligatoires."];
        }

        // CORRECTION : Validation de l'email seulement si fourni (non vide)
        $email = $getVal('email');
        if ($email !== null && $email !== '') {
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return ["status" => "error", "message" => "L'adresse email n'est pas valide."];
            }
        }

        // CORRECTION : Validation de la réduction seulement si fournie (type non vide)
        $reduction_type = $getVal('reduction_type');
        $reduction_valeur = $getVal('reduction_valeur');

        if ($reduction_type !== null && $reduction_type !== '') {
            if (!in_array($reduction_type, ['pourcentage', 'montant_fixe'], true)) {
                return ["status" => "error", "message" => "Type de réduction invalide."];
            }

            // s'assurer que reduction_valeur est fourni et numérique
            if ($reduction_valeur === null || $reduction_valeur === '' || !is_numeric($reduction_valeur) || (float)$reduction_valeur <= 0) {
                return ["status" => "error", "message" => "La valeur de réduction doit être un nombre supérieur à 0."];
            }

            if ($reduction_type === 'pourcentage' && (float)$reduction_valeur > 100) {
                return ["status" => "error", "message" => "Le pourcentage de réduction ne peut pas dépasser 100%."];
            }
        }

        try {
            // CORRECTION : Vérification de l'unicité du NIF seulement s'il est fourni (non vide)
            $nif = $getVal('nif');
            if ($nif !== null && $nif !== '') {
                $sqlCheckNif = "SELECT id FROM particuliers WHERE nif = :nif AND id != :id LIMIT 1";
                $stmtCheckNif = $this->pdo->prepare($sqlCheckNif);
                $stmtCheckNif->execute([':nif' => $nif, ':id' => $id]);

                if ($stmtCheckNif->fetch()) {
                    return ["status" => "error", "message" => "Ce NIF est déjà utilisé par un autre particulier."];
                }
            }

            // CORRECTION : Vérification du téléphone (toujours obligatoire) - utiliser LIMIT 1 + fetch()
            $telephone = $getVal('telephone');
            $sqlCheckTelephone = "SELECT id FROM particuliers WHERE telephone = :telephone AND id != :id LIMIT 1";
            $stmtCheckTelephone = $this->pdo->prepare($sqlCheckTelephone);
            $stmtCheckTelephone->execute([':telephone' => $telephone, ':id' => $id]);

            if ($stmtCheckTelephone->fetch()) {
                return ["status" => "error", "message" => "Ce numéro de téléphone est déjà utilisé par un autre particulier."];
            }

            // CORRECTION : Vérification de l'email seulement s'il est fourni (non vide)
            if ($email !== null && $email !== '') {
                $sqlCheckEmail = "SELECT id FROM particuliers WHERE email = :email AND id != :id LIMIT 1";
                $stmtCheckEmail = $this->pdo->prepare($sqlCheckEmail);
                $stmtCheckEmail->execute([':email' => $email, ':id' => $id]);

                if ($stmtCheckEmail->fetch()) {
                    return ["status" => "error", "message" => "Cette adresse email est déjà utilisée par un autre particulier."];
                }
            }

            // CORRECTION : Vérification de l'ID national seulement s'il est fourni et non vide
            $id_national = $getVal('id_national');
            if ($id_national !== null && $id_national !== '') {
                $sqlCheckIdNational = "SELECT id FROM particuliers WHERE id_national = :id_national AND id != :id LIMIT 1";
                $stmtCheckIdNational = $this->pdo->prepare($sqlCheckIdNational);
                $stmtCheckIdNational->execute([':id_national' => $id_national, ':id' => $id]);

                if ($stmtCheckIdNational->fetch()) {
                    return ["status" => "error", "message" => "Cet ID national est déjà utilisé par un autre particulier."];
                }
            }

            // --- la suite de ta logique (construction UPDATE, exécution, audit, catch) reste inchangée ---
            // CORRECTION : Construction dynamique de la requête UPDATE
            $updateFields = [];
            $params = [':id' => $id];

            // Champs obligatoires
            $updateFields[] = "nom = :nom";
            $params[':nom'] = $data['nom'];
            
            $updateFields[] = "prenom = :prenom";
            $params[':prenom'] = $data['prenom'];
            
            $updateFields[] = "telephone = :telephone";
            $params[':telephone'] = $data['telephone'];
            
            $updateFields[] = "rue = :rue";
            $params[':rue'] = $data['rue'];

            // Champs optionnels — meilleure gestion : NULL pour les absents, validation pour date/enum
            $optionalFields = [
                'date_naissance' => !empty($data['date_naissance']) ? $data['date_naissance'] : null, // expect 'YYYY-MM-DD' or null
                'lieu_naissance' => $data['lieu_naissance'] ?? null,
                'sexe' => in_array($data['sexe'] ?? null, ['Masculin','Féminin'], true) ? $data['sexe'] : null,
                'ville' => $data['ville'] ?? null,
                'code_postal' => $data['code_postal'] ?? null,
                'province' => $data['province'] ?? null,
                'id_national' => $data['id_national'] ?? null, // IMPORTANT: mettre NULL et pas ''
                'email' => $data['email'] ?? null,
                'nif' => $data['nif'] ?? null, // NIF est NOT NULL => valider avant d'insérer
                'situation_familiale' => in_array($data['situation_familiale'] ?? null, ['Célibataire','Marié(e)','Divorcé(e)','Veuf/Veuve'], true) ? $data['situation_familiale'] : null,
                'dependants' => isset($data['dependants']) ? (int)$data['dependants'] : 0,
                'reduction_type' => in_array($data['reduction_type'] ?? null, ['pourcentage','montant_fixe'], true) ? $data['reduction_type'] : null,
                'reduction_valeur' => isset($data['reduction_valeur']) ? (float)$data['reduction_valeur'] : 0.00
            ];

            foreach ($optionalFields as $field => $value) {
                $updateFields[] = "$field = :$field";
                $params[":$field"] = $value;
            }

            $updateFields[] = "date_modification = CURRENT_TIMESTAMP";

            $sql = "UPDATE particuliers SET " . implode(', ', $updateFields) . " WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);

            // Log d'audit
            $this->logAudit("Modification du particulier ID $id: " . $data['prenom'] . ' ' . $data['nom'] . ' (Téléphone: ' . $data['telephone'] . ')');

            return ["status" => "success", "message" => "Les informations du particulier ont été mises à jour."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification du particulier: " . $e->getMessage());

            if ($e->getCode() == '23000') {
                if (strpos($e->getMessage(), 'nif') !== false) {
                    return ["status" => "error", "message" => "Ce NIF est déjà utilisé par un autre particulier."];
                } elseif (strpos($e->getMessage(), 'email') !== false) {
                    return ["status" => "error", "message" => "Cette adresse email est déjà utilisée par un autre particulier."];
                } elseif (strpos($e->getMessage(), 'telephone') !== false) {
                    return ["status" => "error", "message" => "Ce numéro de téléphone est déjà utilisé par un autre particulier."];
                } elseif (strpos($e->getMessage(), 'id_national') !== false) {
                    return ["status" => "error", "message" => "Cet ID national est déjà utilisé par un autre particulier."];
                }
            }

            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime un particulier du système
     *
     * @param int $id ID du particulier à supprimer
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function supprimerParticulier($id)
    {
        // Vérification de l'existence du particulier
        $particulier = $this->particulierExisteParId($id);
        if (!$particulier) {
            return ["status" => "error", "message" => "Le particulier spécifié n'existe pas."];
        }

        try {
            // Suppression du particulier
            $sql = "
                DELETE FROM particuliers
                WHERE id = :id
                  AND telephone <> '0850000001';
            ";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);

            // Log d'audit
            $this->logAudit("Suppression du particulier ID $id: " . $particulier['prenom'] . ' ' . $particulier['nom'] . ' (NIF: ' . $particulier['nif'] . ')');

            return ["status" => "success", "message" => "Le particulier a été supprimé avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression du particulier: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Change le statut actif/inactif d'un particulier
     *
     * @param int $id ID du particulier
     * @param bool $actif Nouveau statut (true = actif, false = inactif)
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function changerStatutParticulier($id, $actif)
    {
        // Vérification de l'existence du particulier
        $particulier = $this->particulierExisteParId($id);
        if (!$particulier) {
            return ["status" => "error", "message" => "Le particulier spécifié n'existe pas."];
        }

        try {
            $sql = "UPDATE particuliers 
                    SET actif = :actif, 
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);

            // Convertir en entier et binder comme INT
            $actifInt = $actif ? 1 : 0;
            $stmt->bindValue(':actif', $actifInt, PDO::PARAM_INT);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);

            $stmt->execute();

            $statut = $actifInt === 1 ? "activé" : "désactivé";
            $this->logAudit("Changement de statut du particulier ID $id: " . $particulier['prenom'] . ' ' . $particulier['nom'] . ' -> ' . $statut);

            return ["status" => "success", "message" => "Le particulier a été $statut avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors du changement de statut du particulier: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de tous les particuliers (sans pagination, pour compatibilité)
     *
     * @return array Liste des particuliers ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerParticuliers()
    {
        try {
            $sql = "SELECT id, nom, prenom, nif, telephone, email, actif, reduction_type, reduction_valeur,
                    DATE_FORMAT(date_creation, '%d/%m/%Y') as date_creation 
                    FROM particuliers 
                    ORDER BY date_creation DESC, nom, prenom ASC
                    LIMIT 10"; // Par défaut, on limite à 10 pour compatibilité
                    
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des particuliers: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère les détails complets d'un particulier
     *
     * @param int $id ID du particulier
     * @return array Détails du particulier ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function getDetailsParticulier($id)
    {
        try {
            $sql = "SELECT *, 
                    DATE_FORMAT(date_naissance, '%Y-%m-%d') as date_naissance,
                    DATE_FORMAT(date_creation, '%d/%m/%Y à %H:%i') as date_creation_format
                    FROM particuliers WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);
            $resultat = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$resultat) {
                return ["status" => "error", "message" => "Particulier non trouvé"];
            }

            return ["status" => "success", "data" => $resultat];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des détails du particulier: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Recherche des particuliers selon différents critères
     *
     * @param string $searchTerm Terme de recherche
     * @return array Résultats de recherche ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function rechercherParticuliers($searchTerm)
    {
        try {
            $sql = "SELECT id, nom, prenom, nif, telephone, email, actif, reduction_type, reduction_valeur,
                    DATE_FORMAT(date_creation, '%d/%m/%Y') as date_creation 
                    FROM particuliers 
                    WHERE nom LIKE :search OR prenom LIKE :search OR nif LIKE :search OR email LIKE :search OR telephone LIKE :search
                    ORDER BY nom, prenom ASC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':search' => '%' . $searchTerm . '%']);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des particuliers: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Authentifie un particulier par NIF et mot de passe
     *
     * @param string $nif NIF du particulier
     * @param string $password Mot de passe en clair
     * @return array Tableau avec statut, message et données du particulier
     */
    public function authentifierParticulier($nif, $password)
    {
        // Vérification de l'existence
        $particulier = $this->particulierExiste($nif);
        if (!$particulier) {
            return ["status" => "error", "message" => "Identifiants incorrects."];
        }

        // Vérification du statut actif
        if (!$particulier['actif']) {
            return ["status" => "error", "message" => "Votre compte est désactivé. Contactez l'administration."];
        }

        // Récupération du mot de passe hashé
        $sql = "SELECT id, nom, prenom, nif, password, actif FROM particuliers WHERE nif = :nif AND actif = 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['nif' => $nif]);
        $particulierData = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$particulierData || !password_verify($password, $particulierData['password'])) {
            return ["status" => "error", "message" => "Identifiants incorrects."];
        }

        // Création de la session
        $_SESSION['particulier_id'] = $particulierData['id'];
        $_SESSION['particulier_nom'] = $particulierData['nom'];
        $_SESSION['particulier_prenom'] = $particulierData['prenom'];
        $_SESSION['particulier_nif'] = $particulierData['nif'];
        $_SESSION['user_type'] = 'particulier';

        // Journalisation
        $this->logAudit("Connexion du particulier ID " . $particulierData['id'] . ": " . $particulierData['prenom'] . ' ' . $particulierData['nom']);

        return [
            "status" => "success",
            "message" => "Connexion réussie.",
            "data" => [
                "id" => $particulierData['id'],
                "nom" => $particulierData['nom'],
                "prenom" => $particulierData['prenom'],
                "nif" => $particulierData['nif']
            ]
        ];
    }

    /**
     * Vérifie si un code de réinitialisation est valide pour un NIF
     *
     * @param string $nif NIF du particulier
     * @param string $code Code de vérification
     * @return array Tableau avec statut et message
     */
    public function verifierCodeReset($nif, $code)
    {
        try {
            // Vérification de l'existence du particulier
            $particulier = $this->particulierExiste($nif);
            if (!$particulier) {
                return ["status" => "error", "message" => "Aucun compte associé à ce NIF."];
            }

            // Vérification du statut actif
            if (!$particulier['actif']) {
                return ["status" => "error", "message" => "Votre compte est désactivé. Contactez l'administration."];
            }

            // Vérification du code (dans une table de codes temporaires)
            $sql = "SELECT id, code, expires_at FROM password_reset_codes 
                    WHERE particulier_id = :particulier_id AND code = :code AND used = 0 AND expires_at > NOW()";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':particulier_id' => $particulier['id'],
                ':code' => $code
            ]);
            
            $codeData = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$codeData) {
                return ["status" => "error", "message" => "Code invalide ou expiré."];
            }

            return ["status" => "success", "message" => "Code valide.", "particulier_id" => $particulier['id']];

        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du code: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Réinitialise le mot de passe d'un particulier
     *
     * @param int $particulierId ID du particulier
     * @param string $newPassword Nouveau mot de passe
     * @param string $code Code de vérification utilisé
     * @return array Tableau avec statut et message
     */
    public function reinitialiserMotDePasse($particulierId, $newPassword, $code)
    {
        try {
            $this->pdo->beginTransaction();

            // Hash du nouveau mot de passe
            $motDePasseHash = password_hash($newPassword, PASSWORD_BCRYPT);

            // Mise à jour du mot de passe
            $sql = "UPDATE particuliers 
                    SET password = :password, 
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':password' => $motDePasseHash,
                ':id' => $particulierId
            ]);

            // Marquer le code comme utilisé
            $sqlUpdateCode = "UPDATE password_reset_codes SET used = 1 WHERE particulier_id = :particulier_id AND code = :code";
            $stmtUpdateCode = $this->pdo->prepare($sqlUpdateCode);
            $stmtUpdateCode->execute([
                ':particulier_id' => $particulierId,
                ':code' => $code
            ]);

            $this->pdo->commit();

            // Récupération des infos du particulier pour le log
            $particulierInfo = $this->particulierExisteParId($particulierId);
            $this->logAudit("Réinitialisation du mot de passe du particulier ID $particulierId: " . $particulierInfo['prenom'] . ' ' . $particulierInfo['nom']);

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
     * @param string $nif NIF du particulier
     * @return array Tableau avec statut et message
     */
    public function envoyerCodeReinitialisation($nif)
    {
        try {
            // Vérification de l'existence du particulier
            $particulier = $this->particulierExiste($nif);
            if (!$particulier) {
                return ["status" => "error", "message" => "Aucun compte associé à ce NIF."];
            }

            // Vérification du statut actif
            if (!$particulier['actif']) {
                return ["status" => "error", "message" => "Votre compte est désactivé. Contactez l'administration."];
            }

            // Vérification que le particulier a un email
            $sqlEmail = "SELECT email FROM particuliers WHERE id = :id";
            $stmtEmail = $this->pdo->prepare($sqlEmail);
            $stmtEmail->execute([':id' => $particulier['id']]);
            $particulierData = $stmtEmail->fetch(PDO::FETCH_ASSOC);

            if (empty($particulierData['email'])) {
                return ["status" => "error", "message" => "Aucun email associé à ce compte. Contactez l'administration."];
            }

            $this->pdo->beginTransaction();

            // Génération d'un code à 6 chiffres
            $code = sprintf('%06d', rand(0, 999999));
            $expiresAt = date('Y-m-d H:i:s', strtotime('+15 minutes'));

            // Suppression des anciens codes non utilisés
            $sqlDelete = "DELETE FROM password_reset_codes WHERE particulier_id = :particulier_id AND used = 0";
            $stmtDelete = $this->pdo->prepare($sqlDelete);
            $stmtDelete->execute([':particulier_id' => $particulier['id']]);

            // Insertion du nouveau code
            $sqlInsert = "INSERT INTO password_reset_codes (particulier_id, code, expires_at) 
                          VALUES (:particulier_id, :code, :expires_at)";
            $stmtInsert = $this->pdo->prepare($sqlInsert);
            $stmtInsert->execute([
                ':particulier_id' => $particulier['id'],
                ':code' => $code,
                ':expires_at' => $expiresAt
            ]);

            $this->pdo->commit();

            // Envoi de l'email avec le code
            $this->envoyerEmailCodeReset($particulierData['email'], $particulier['prenom'] . ' ' . $particulier['nom'], $code);

            $this->logAudit("Envoi de code de réinitialisation au particulier ID " . $particulier['id'] . ": " . $particulier['prenom'] . ' ' . $particulier['nom']);

            return ["status" => "success", "message" => "Un code de réinitialisation a été envoyé à votre adresse email."];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'envoi du code de réinitialisation: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de tous les particuliers avec pagination
     *
     * @param int $page Numéro de page (commence à 1)
     * @param int $limit Nombre d'éléments par page
     * @param int|null $utilisateurId ID de l'utilisateur pour filtrer par province
     * @return array Liste des particuliers avec pagination ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerParticuliersPagination($page = 1, $limit = 10, $utilisateurId = null)
    {
        try {
            $conditions = [];
            $params = [];
            $joinRequired = false;
            
            // Gestion du filtrage par province si un utilisateur est fourni
            if ($utilisateurId !== null) {
                try {
                    $provinceId = $this->getProvinceIdByUtilisateur($utilisateurId);
                    if ($provinceId) {
                        // On doit filtrer par province
                        $conditions[] = "s.id = :province_id";
                        $params[':province_id'] = $provinceId;
                        $joinRequired = true; // On a besoin de la jointure
                    }
                } catch (Exception $e) {
                    // Si on ne peut pas récupérer la province, on ignore le filtre
                    error_log("Impossible de récupérer la province pour l'utilisateur $utilisateurId: " . $e->getMessage());
                }
            }
            
            // Calcul de l'offset
            $offset = ($page - 1) * $limit;
            
            // Construction des clauses SQL
            $baseFrom = "FROM particuliers p";
            $joinClause = "";
            $whereClause = "";
            
            if ($joinRequired) {
                // Si on a besoin de filtrer par province, on doit joindre sites
                $joinClause = "INNER JOIN sites s ON p.site = s.id";
            } else {
                // Sinon, LEFT JOIN pour récupérer les infos de site si disponibles
                $joinClause = "LEFT JOIN sites s ON p.site = s.id";
            }
            
            // Toujours LEFT JOIN provinces pour récupérer le nom de la province
            $joinClause .= " LEFT JOIN provinces pr ON s.province_id = pr.id";
            
            // Clause WHERE si on a des conditions
            if (!empty($conditions)) {
                $whereClause = " WHERE " . implode(' AND ', $conditions);
            }
            
            // ============ REQUÊTE DE COMPTAGE ============
            $sqlCount = "SELECT COUNT(p.id) as total " . $baseFrom . " " . $joinClause . $whereClause;
            
            $stmtCount = $this->pdo->prepare($sqlCount);
            
            // Liaison des paramètres pour le COUNT
            foreach ($params as $key => $value) {
                $stmtCount->bindValue($key, $value);
            }
            
            $stmtCount->execute();
            $totalResult = $stmtCount->fetch(PDO::FETCH_ASSOC);
            $total = (int)$totalResult['total'];
            
            // Calcul du nombre total de pages
            $totalPages = $total > 0 ? ceil($total / $limit) : 0;
            
            // ============ REQUÊTE PRINCIPALE ============
            $sql = "SELECT p.id, p.nom, p.prenom, p.nif, p.telephone, p.email, p.actif, 
                           p.reduction_type, p.reduction_valeur,
                           DATE_FORMAT(p.date_creation, '%d/%m/%Y') as date_creation,
                           s.nom as site_nom, s.code as site_code,
                           pr.nom as province_nom, pr.code as province_code
                    FROM particuliers p
                    LEFT JOIN sites s ON p.site = s.id
                    LEFT JOIN provinces pr ON s.province_id = pr.id" . 
                    $whereClause . 
                    " ORDER BY p.date_creation DESC, p.nom ASC, p.prenom ASC
                     LIMIT :limit OFFSET :offset";
            
            $stmt = $this->pdo->prepare($sql);
            
            // Liaison des paramètres de filtre (si présents)
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            
            // Liaison des paramètres de pagination
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success", 
                "data" => [
                    "particuliers" => $resultats,
                    "pagination" => [
                        "total" => $total,
                        "page" => (int)$page,
                        "limit" => (int)$limit,
                        "totalPages" => $totalPages
                    ]
                ]
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des particuliers avec pagination: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        } catch (Exception $e) {
            error_log("Erreur lors du listing des particuliers avec pagination: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur: " . $e->getMessage()];
        }
    }

    /**
     * Recherche des particuliers selon différents critères avec pagination
     *
     * @param string $searchTerm Terme de recherche
     * @param int $page Numéro de page (commence à 1)
     * @param int $limit Nombre d'éléments par page
     * @return array Résultats de recherche avec pagination ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function rechercherParticuliersPagination($searchTerm, $page = 1, $limit = 10)
    {
        try {
            // Calcul de l'offset
            $offset = ($page - 1) * $limit;
            
            // Requête pour compter le total des résultats de recherche
            $sqlCount = "SELECT COUNT(*) as total 
                        FROM particuliers 
                        WHERE nom LIKE :search 
                           OR prenom LIKE :search 
                           OR nif LIKE :search 
                           OR email LIKE :search 
                           OR telephone LIKE :search";
            
            $stmtCount = $this->pdo->prepare($sqlCount);
            $stmtCount->execute([':search' => '%' . $searchTerm . '%']);
            $totalResult = $stmtCount->fetch(PDO::FETCH_ASSOC);
            $total = $totalResult['total'];
            
            // Calcul du nombre total de pages
            $totalPages = ceil($total / $limit);
            
            // Requête principale avec pagination
            $sql = "SELECT id, nom, prenom, nif, telephone, email, actif, reduction_type, reduction_valeur,
                    DATE_FORMAT(date_creation, '%d/%m/%Y') as date_creation 
                    FROM particuliers 
                    WHERE nom LIKE :search 
                       OR prenom LIKE :search 
                       OR nif LIKE :search 
                       OR email LIKE :search 
                       OR telephone LIKE :search
                    ORDER BY 
                        CASE 
                            WHEN nom LIKE :search_exact THEN 1
                            WHEN prenom LIKE :search_exact THEN 2
                            WHEN nif LIKE :search_exact THEN 3
                            ELSE 4
                        END,
                        nom, prenom ASC
                    LIMIT :limit OFFSET :offset";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':search', '%' . $searchTerm . '%');
            $stmt->bindValue(':search_exact', $searchTerm . '%'); // Pour les correspondances exactes au début
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success", 
                "data" => [
                    "particuliers" => $resultats,
                    "pagination" => [
                        "total" => (int)$total,
                        "page" => (int)$page,
                        "limit" => (int)$limit,
                        "totalPages" => (int)$totalPages
                    ]
                ]
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des particuliers avec pagination: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Envoie un email avec les informations au particulier
     *
     * @param string $email Email du destinataire
     * @param string $nomComplet Nom complet du particulier
     * @param string $nif NIF du particulier
     * @param string $motDePasseTemp Mot de passe temporaire
     * @return bool Résultat de l'envoi
     */
    private function envoyerEmailParticulier($email, $nomComplet, $nif, $motDePasseTemp)
    {
        $sujet = "Enregistrement en tant que contribuable particulier";
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: no-reply@ecadastre.com" . "\r\n";

        $message = $this->genererContenuEmail($nomComplet, $nif, $motDePasseTemp);

        return mail($email, $sujet, $message, $headers);
    }

    /**
     * Envoie un email avec le code de réinitialisation
     *
     * @param string $email Email du destinataire
     * @param string $nomComplet Nom complet du particulier
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
     * Génère le contenu HTML de l'email d'enregistrement
     *
     * @param string $nomComplet Nom complet du particulier
     * @param string $nif NIF du particulier
     * @param string $motDePasseTemp Mot de passe temporaire
     * @return string Contenu HTML de l'email
     */
    private function genererContenuEmail($nomComplet, $nif, $motDePasseTemp)
    {
        return <<<HTML
        <html>
        <head>
            <title>Enregistrement en tant que contribuable</title>
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
                <p>Vous avez été enregistré en tant que contribuable particulier sur notre plateforme.</p>
                <p><strong>Vos informations d'identification :</strong></p>
                <div class='info'>
                    <p><strong>NIF :</strong> $nif</p>
                    <p><strong>Mot de passe temporaire :</strong> $motDePasseTemp</p>
                </div>
                <p>Votre NIF est votre identifiant unique pour toutes vos démarches fiscales.</p>
                <p>Veuillez vous connecter et changer votre mot de passe dès que possible.</p>
                <p class='footer'>Si vous avez des questions, contactez-nous à support@ecadastre.com</p>
            </div>
        </body>
        </html>
HTML;
    }

    /**
     * Génère le contenu HTML de l'email de réinitialisation
     *
     * @param string $nomComplet Nom complet du particulier
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
     * Génère un mot de passe temporaire à 4 chiffres
     *
     * @return string Mot de passe de 4 chiffres
     */
    private function genererMotDePasseTemporaire()
    {
        return sprintf('%04d', rand(0, 9999));
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