<?php
require_once 'Connexion.php';

/**
 * Classe Impot - Gestion complète des impôts
 * 
 * Cette classe étend la classe Connexion et fournit toutes les fonctionnalités
 * de gestion des impôts, incluant :
 * - Création, modification, suppression et activation/désactivation des impôts
 * - Vérification de l'unicité des noms
 * - Logs d'audit pour toutes les opérations
 */
class Impot extends Connexion
{
    /**
     * Vérifie l'existence d'un impôt par son nom
     *
     * @param string $nom Nom à vérifier
     * @return array|false Données de l'impôt si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function impotExisteParNom($nom)
    {
        try {
            $sql = "SELECT id, nom, description, actif FROM impots WHERE nom = :nom";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['nom' => $nom]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence de l'impôt: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'un impôt par son ID
     *
     * @param int $id ID de l'impôt
     * @return array|false Données complètes de l'impôt si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function impotExisteParId($id)
    {
        try {
            $sql = "SELECT * FROM impots WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'impôt par ID: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Ajoute un nouvel impôt au système
     *
     * @param string $nom Nom de l'impôt
     * @param string $description Description de l'impôt
     * @param string $jsonData Données JSON du formulaire
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function ajouterImpot($nom, $description, $jsonData)
    {
        // ============ VALIDATION DES DONNÉES ============
        if (empty($nom)) {
            return ["status" => "error", "message" => "Le nom est obligatoire."];
        }

        if ($this->impotExisteParNom($nom)) {
            return ["status" => "error", "message" => "Ce nom d'impôt est déjà utilisé."];
        }

        // Décoder les données JSON pour extraire les nouvelles informations
        $data = json_decode($jsonData, true);
        if (!$data) {
            return ["status" => "error", "message" => "Données JSON invalides."];
        }

        // Extraire les nouvelles informations
        $periode = isset($data['periode']) ? $data['periode'] : 'annuel';
        $delaiAccord = isset($data['delaiAccord']) ? (int)$data['delaiAccord'] : 0;
        $prix = isset($data['prix']) ? (float)$data['prix'] : 0.00;
        $penalites = isset($data['penalites']) ? json_encode($data['penalites']) : json_encode(['type' => 'aucune', 'valeur' => 0]);

        // ============ TRAITEMENT PRINCIPAL ============
        try {
            $this->pdo->beginTransaction();

            // Insertion de l'impôt avec les nouveaux champs
            $sql = "INSERT INTO impots (nom, description, formulaire_json, periode, delai_accord, prix, penalites) 
                    VALUES (:nom, :description, :formulaire_json, :periode, :delai_accord, :prix, :penalites)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom' => $nom,
                ':description' => $description,
                ':formulaire_json' => $jsonData,
                ':periode' => $periode,
                ':delai_accord' => $delaiAccord,
                ':prix' => $prix,
                ':penalites' => $penalites
            ]);

            $impotId = $this->pdo->lastInsertId();

            $this->pdo->commit();

            // Log d'audit
            $this->logAudit("Ajout de l'impôt ID $impotId: $nom");

            return ["status" => "success", "message" => "Impôt ajouté avec succès.", "id" => $impotId];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'ajout de l'impôt: " . $e->getMessage());
            
            if ($e->getCode() == '23000') {
                return ["status" => "error", "message" => "Cet impôt existe déjà."];
            }
            
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Modifie les informations d'un impôt existant
     *
     * @param int $id ID de l'impôt à modifier
     * @param string $nom Nouveau nom
     * @param string $description Nouvelle description
     * @param string $jsonData Nouvelles données JSON
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function modifierImpot($id, $nom, $description, $jsonData)
    {
        // Validation des champs obligatoires
        if (empty($nom)) {
            return ["status" => "error", "message" => "Le nom est obligatoire."];
        }

        try {
            // Vérification de l'unicité du nouveau nom
            $sqlCheckNom = "SELECT id FROM impots WHERE nom = :nom AND id != :id";
            $stmtCheckNom = $this->pdo->prepare($sqlCheckNom);
            $stmtCheckNom->execute([':nom' => $nom, ':id' => $id]);

            if ($stmtCheckNom->rowCount() > 0) {
                return ["status" => "error", "message" => "Ce nom d'impôt est déjà utilisé par un autre impôt."];
            }

            // Décoder les données JSON pour extraire les nouvelles informations
            $data = json_decode($jsonData, true);
            if (!$data) {
                return ["status" => "error", "message" => "Données JSON invalides."];
            }

            // Extraire les nouvelles informations
            $periode = isset($data['periode']) ? $data['periode'] : 'annuel';
            $delaiAccord = isset($data['delaiAccord']) ? (int)$data['delaiAccord'] : 0;
            $prix = isset($data['prix']) ? (float)$data['prix'] : 0.00;
            $penalites = isset($data['penalites']) ? json_encode($data['penalites']) : json_encode(['type' => 'aucune', 'valeur' => 0]);

            // Mise à jour des informations avec les nouveaux champs
            $sql = "UPDATE impots 
                    SET nom = :nom, 
                        description = :description,
                        formulaire_json = :formulaire_json,
                        periode = :periode,
                        delai_accord = :delai_accord,
                        prix = :prix,
                        penalites = :penalites,
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom' => $nom,
                ':description' => $description,
                ':formulaire_json' => $jsonData,
                ':periode' => $periode,
                ':delai_accord' => $delaiAccord,
                ':prix' => $prix,
                ':penalites' => $penalites,
                ':id' => $id
            ]);

            // Log d'audit
            $this->logAudit("Modification de l'impôt ID $id: $nom");

            return ["status" => "success", "message" => "Les informations de l'impôt ont été mises à jour."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification de l'impôt: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime un impôt du système
     *
     * @param int $id ID de l'impôt à supprimer
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function supprimerImpot($id)
    {
        // Vérification de l'existence de l'impôt
        $impot = $this->impotExisteParId($id);
        if (!$impot) {
            return ["status" => "error", "message" => "L'impôt spécifié n'existe pas."];
        }

        try {
            // Suppression de l'impôt
            $sql = "DELETE FROM impots WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);

            // Log d'audit
            $this->logAudit("Suppression de l'impôt ID $id: " . $impot['nom']);

            return ["status" => "success", "message" => "L'impôt a été supprimé avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de l'impôt: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Change le statut actif/inactif d'un impôt
     *
     * @param int $id ID de l'impôt
     * @param bool $actif Nouveau statut (true = actif, false = inactif)
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function changerStatutImpot($id, $actif)
    {
        // Vérification de l'existence de l'impôt
        $impot = $this->impotExisteParId($id);
        if (!$impot) {
            return ["status" => "error", "message" => "L'impôt spécifié n'existe pas."];
        }

        try {
            $sql = "UPDATE impots 
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
            $this->logAudit("Changement de statut de l'impôt ID $id: " . $impot['nom'] . ' -> ' . $statut);

            return ["status" => "success", "message" => "L'impôt a été $statut avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors du changement de statut de l'impôt: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de tous les impôts
     *
     * @return array Liste des impôts ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerImpot()
    {
        try {
            $sql = "SELECT id, nom, description, periode, delai_accord, prix, penalites, actif, 
                    DATE_FORMAT(date_creation, '%d/%m/%Y') as date_creation 
                    FROM impots 
                    ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Décoder les données JSON des pénalités
            foreach ($resultats as &$resultat) {
                $resultat['penalites'] = json_decode($resultat['penalites'], true);
            }

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des impôts: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de tous les impôts actifs avec leurs associations aux sites
     *
     * @return array Liste des impôts avec leurs associations
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerImpotActifs($siteCode = '')
    {
        try {


            // 1️⃣ Récupérer l'id du site via son code
            $sql = "SELECT id FROM sites WHERE code = :code LIMIT 1";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':code' => $siteCode
            ]);

            $site = $stmt->fetch(PDO::FETCH_ASSOC);

            // Vérifier si le site existe
            if (!$site) {
                return [];
            }

            $siteId = $site['id'];


            // 2️⃣ Récupérer les taxes liées au site
            $sql = "SELECT 
                        i.id, 
                        i.nom, 
                        i.description, 
                        i.periode, 
                        i.delai_accord, 
                        i.prix, 
                        i.penalites, 
                        i.actif,
                        DATE_FORMAT(i.date_creation, '%d/%m/%Y') as date_creation,
                        st.id as site_taxe_id,
                        st.site_id,
                        st.prix as prix_site,
                        st.status as site_taxe_status,
                        st.date_create as site_taxe_date,
                        s.nom as site_nom,
                        s.code as site_code
                    FROM impots i
                    INNER JOIN site_taxe st ON i.id = st.taxe_id
                    INNER JOIN sites s ON st.site_id = s.id
                    WHERE i.actif = 1 
                    AND st.status = 1
                    AND st.site_id = :site_id
                    ORDER BY i.nom ASC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':site_id' => $siteId
            ]);

            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Décoder les pénalités JSON
            foreach ($resultats as &$resultat) {
                $resultat['penalites'] = json_decode($resultat['penalites'], true);
            }

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des impôts: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Recherche des impôts par terme de recherche
     *
     * @param string $searchTerm Terme de recherche
     * @return array Liste des impôts correspondants ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function rechercherImpot($searchTerm)
    {
        try {
            $sql = "SELECT id, nom, description, periode, delai_accord, prix, penalites, actif, 
                    DATE_FORMAT(date_creation, '%d/%m/%Y') as date_creation 
                    FROM impots 
                    WHERE nom LIKE :search OR description LIKE :search
                    ORDER BY nom ASC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':search' => '%' . $searchTerm . '%']);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Décoder les données JSON des pénalités
            foreach ($resultats as &$resultat) {
                $resultat['penalites'] = json_decode($resultat['penalites'], true);
            }

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des impôts: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère un impôt par son ID avec ses données JSON
     *
     * @param int $id ID de l'impôt
     * @return array Données de l'impôt ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function getImpotAvecJson($id)
    {
        try {
            $sql = "SELECT * FROM impots WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            $resultat = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($resultat) {
                // Décoder les données JSON des pénalités
                $resultat['penalites'] = json_decode($resultat['penalites'], true);
                return ["status" => "success", "data" => $resultat];
            } else {
                return ["status" => "error", "message" => "Impôt non trouvé."];
            }

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération de l'impôt: " . $e->getMessage());
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

    /**
     * Récupère tous les bénéficiaires liés à un impôt par province
     */
    public function getBeneficiairesImpot($impotId)
    {
        try {
            $sql = "SELECT ib.*, b.nom, b.telephone, b.numero_compte, p.nom as province_nom, p.code as province_code
                    FROM impot_beneficiaires ib
                    INNER JOIN beneficiaires b ON ib.beneficiaire_id = b.id
                    LEFT JOIN provinces p ON ib.province_id = p.id
                    WHERE ib.impot_id = :impot_id
                    ORDER BY p.nom ASC, b.nom ASC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':impot_id' => $impotId]);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Grouper par province
            $groupedByProvince = [];
            foreach ($resultats as $beneficiaire) {
                $provinceId = $beneficiaire['province_id'] ?? 0;
                $provinceName = $beneficiaire['province_nom'] ?? 'Toutes provinces';
                
                if (!isset($groupedByProvince[$provinceId])) {
                    $groupedByProvince[$provinceId] = [
                        'province_id' => $provinceId,
                        'province_nom' => $provinceName,
                        'province_code' => $beneficiaire['province_code'] ?? null,
                        'beneficiaires' => []
                    ];
                }
                
                $groupedByProvince[$provinceId]['beneficiaires'][] = $beneficiaire;
            }

            return ["status" => "success", "data" => array_values($groupedByProvince)];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des bénéficiaires de l'impôt: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère toutes les provinces disponibles
     */
    public function getProvinces()
    {
        try {
            $sql = "SELECT id, nom, code FROM provinces WHERE actif = 1 ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            $provinces = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $provinces];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des provinces: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Ajoute un bénéficiaire à un impôt pour une province spécifique
     */
    public function ajouterBeneficiaireImpot($impotId, $beneficiaireId, $typePart, $valeurPart, $provinceId = null)
    {
        // Validation des données
        if (empty($impotId) || empty($beneficiaireId) || empty($typePart) || empty($valeurPart)) {
            return ["status" => "error", "message" => "Tous les champs sont obligatoires."];
        }

        // Validation de la valeur selon le type
        if ($typePart === 'pourcentage') {
            if ($valeurPart < 0 || $valeurPart > 100) {
                return ["status" => "error", "message" => "Le pourcentage doit être entre 0 et 100."];
            }
            
            // Vérifier que le total des pourcentages ne dépasse pas 100% pour cette province
            $totalPourcentages = $this->getTotalPourcentagesImpotProvince($impotId, $provinceId);
            if (($totalPourcentages + $valeurPart) > 100) {
                return ["status" => "error", "message" => "Le total des pourcentages pour cette province dépasse 100% (actuellement: {$totalPourcentages}%)."];
            }
        }

        if ($typePart === 'montant_fixe' && $valeurPart < 0) {
            return ["status" => "error", "message" => "Le montant ne peut pas être négatif."];
        }

        try {
            // Vérifier si la combinaison existe déjà pour cette province
            $sqlCheck = "SELECT id FROM impot_beneficiaires 
                         WHERE impot_id = :impot_id 
                         AND beneficiaire_id = :beneficiaire_id 
                         AND (province_id IS NULL AND :province_id IS NULL OR province_id = :province_id)";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([
                ':impot_id' => $impotId,
                ':beneficiaire_id' => $beneficiaireId,
                ':province_id' => $provinceId
            ]);

            if ($stmtCheck->rowCount() > 0) {
                $provinceText = $provinceId ? "pour cette province" : "pour toutes provinces";
                return ["status" => "error", "message" => "Ce bénéficiaire est déjà lié à cet impôt $provinceText."];
            }

            // Insertion
            $sql = "INSERT INTO impot_beneficiaires (impot_id, province_id, beneficiaire_id, type_part, valeur_part) 
                    VALUES (:impot_id, :province_id, :beneficiaire_id, :type_part, :valeur_part)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':impot_id' => $impotId,
                ':province_id' => $provinceId,
                ':beneficiaire_id' => $beneficiaireId,
                ':type_part' => $typePart,
                ':valeur_part' => $valeurPart
            ]);

            $provinceText = $provinceId ? " pour la province ID $provinceId" : " pour toutes provinces";
            $this->logAudit("Ajout du bénéficiaire ID $beneficiaireId à l'impôt ID $impotId$provinceText");

            return ["status" => "success", "message" => "Bénéficiaire ajouté à l'impôt avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de l'ajout du bénéficiaire à l'impôt: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime un bénéficiaire d'un impôt pour une province spécifique
     */
    public function supprimerBeneficiaireImpot($impotId, $beneficiaireId, $provinceId = null)
    {
        try {
            $sql = "DELETE FROM impot_beneficiaires 
                    WHERE impot_id = :impot_id 
                    AND beneficiaire_id = :beneficiaire_id 
                    AND (province_id IS NULL AND :province_id IS NULL OR province_id = :province_id)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':impot_id' => $impotId,
                ':beneficiaire_id' => $beneficiaireId,
                ':province_id' => $provinceId
            ]);

            $provinceText = $provinceId ? " pour la province ID $provinceId" : " pour toutes provinces";
            $this->logAudit("Suppression du bénéficiaire ID $beneficiaireId de l'impôt ID $impotId$provinceText");

            return ["status" => "success", "message" => "Bénéficiaire retiré de l'impôt avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression du bénéficiaire de l'impôt: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère le total des pourcentages pour un impôt et une province spécifique
     */
    public function getTotalPourcentagesImpotProvince($impotId, $provinceId = null)
    {
        try {
            if ($provinceId === null) {
                $sql = "SELECT SUM(valeur_part) as total 
                        FROM impot_beneficiaires 
                        WHERE impot_id = :impot_id 
                        AND type_part = 'pourcentage'
                        AND province_id IS NULL";
                $params = [':impot_id' => $impotId];
            } else {
                $sql = "SELECT SUM(valeur_part) as total 
                        FROM impot_beneficiaires 
                        WHERE impot_id = :impot_id 
                        AND type_part = 'pourcentage'
                        AND province_id = :province_id";
                $params = [':impot_id' => $impotId, ':province_id' => $provinceId];
            }

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return $result['total'] ?? 0;

        } catch (PDOException $e) {
            error_log("Erreur lors du calcul du total des pourcentages: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Récupère les bénéficiaires disponibles pour un impôt et une province
     */
    public function getBeneficiairesDisponibles($impotId, $provinceId = null)
    {
        try {
            // Bénéficiaires déjà associés à cette combinaison impôt/province
            $sqlExclus = "SELECT beneficiaire_id FROM impot_beneficiaires 
                         WHERE impot_id = :impot_id 
                         AND (province_id IS NULL AND :province_id IS NULL OR province_id = :province_id)";
            $stmtExclus = $this->pdo->prepare($sqlExclus);
            $stmtExclus->execute([':impot_id' => $impotId, ':province_id' => $provinceId]);
            $exclus = $stmtExclus->fetchAll(PDO::FETCH_COLUMN);

            // Tous les bénéficiaires actifs
            $sqlBenef = "SELECT id, nom, telephone, numero_compte 
                        FROM beneficiaires 
                        WHERE actif = 1 
                        ORDER BY nom ASC";
            $stmtBenef = $this->pdo->query($sqlBenef);
            $allBeneficiaires = $stmtBenef->fetchAll(PDO::FETCH_ASSOC);

            // Filtrer ceux qui ne sont pas déjà associés
            $disponibles = array_filter($allBeneficiaires, function($benef) use ($exclus) {
                return !in_array($benef['id'], $exclus);
            });

            return ["status" => "success", "data" => array_values($disponibles)];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des bénéficiaires disponibles: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Modifie la part d'un bénéficiaire dans un impôt
     */
    public function modifierPartBeneficiaire($impotId, $beneficiaireId, $typePart, $valeurPart)
    {
        // Validation des données
        if ($typePart === 'pourcentage' && ($valeurPart < 0 || $valeurPart > 100)) {
            return ["status" => "error", "message" => "Le pourcentage doit être entre 0 et 100."];
        }

        if ($typePart === 'montant_fixe' && $valeurPart < 0) {
            return ["status" => "error", "message" => "Le montant ne peut pas être négatif."];
        }

        try {
            $sql = "UPDATE impot_beneficiaires 
                    SET type_part = :type_part, 
                        valeur_part = :valeur_part,
                        date_modification = CURRENT_TIMESTAMP
                    WHERE impot_id = :impot_id AND beneficiaire_id = :beneficiaire_id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':type_part' => $typePart,
                ':valeur_part' => $valeurPart,
                ':impot_id' => $impotId,
                ':beneficiaire_id' => $beneficiaireId
            ]);

            $this->logAudit("Modification de la part du bénéficiaire ID $beneficiaireId dans l'impôt ID $impotId");

            return ["status" => "success", "message" => "Part du bénéficiaire modifiée avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification de la part du bénéficiaire: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère un impôt par son ID
     */
    public function getImpotById($id)
    {
        try {
            $sql = "SELECT * FROM impots WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);
            $impot = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$impot) {
                return ["status" => "error", "message" => "Impôt non trouvé"];
            }

            return [
                "status" => "success",
                "data" => $impot
            ];

        } catch (PDOException $e) {
            error_log("Erreur récupération impôt par ID: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère le total des pourcentages pour un impôt
     */
    public function getTotalPourcentagesImpot($impotId)
    {
        try {
            $sql = "SELECT SUM(valeur_part) as total 
                    FROM impot_beneficiaires 
                    WHERE impot_id = :impot_id AND type_part = 'pourcentage'";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':impot_id' => $impotId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return $result['total'] ?? 0;

        } catch (PDOException $e) {
            error_log("Erreur lors du calcul du total des pourcentages: " . $e->getMessage());
            return 0;
        }
    }
}