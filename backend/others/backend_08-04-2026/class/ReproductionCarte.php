<?php
require_once 'Connexion.php';

/**
 * Classe ReproductionCarte - Gestion complète de la reproduction de cartes
 * Avec recherche dans base locale ET externe
 */
class ReproductionCarte extends Connexion
{
    private $transactionActive = false;

    /**
     * Démarre une transaction sécurisée
     */
    private function beginTransactionSafe()
    {
        try {
            if (!$this->transactionActive) {
                $this->pdo->beginTransaction();
                $this->transactionActive = true;
            }
        } catch (PDOException $e) {
            error_log("Erreur lors du début de transaction: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Commit sécurisé
     */
    private function commitSafe()
    {
        try {
            if ($this->transactionActive) {
                $this->pdo->commit();
                $this->transactionActive = false;
            }
        } catch (PDOException $e) {
            error_log("Erreur lors du commit: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Rollback sécurisé
     */
    private function rollbackSafe()
    {
        try {
            if ($this->transactionActive) {
                $this->pdo->rollBack();
                $this->transactionActive = false;
            }
        } catch (PDOException $e) {
            error_log("Erreur lors du rollback: " . $e->getMessage());
            $this->transactionActive = false;
        }
    }

    /**
     * Vérifie si une plaque existe et récupère les données complètes (locale)
     */
    public function verifierPlaqueLocale($numeroPlaque, $siteCode, $extension = null)
    {
        try {
            $siteId = null;
            $provinceId = null;
            
            // Récupérer l'id du site via site_code
            $sqlSite = "SELECT id, province_id FROM sites WHERE code = :code AND actif = 1 LIMIT 1";
            $stmtSite = $this->pdo->prepare($sqlSite);
            $stmtSite->bindValue(':code', $siteCode, PDO::PARAM_STR);
            $stmtSite->execute();
            
            $siteData = $stmtSite->fetch(PDO::FETCH_ASSOC);
            
            if ($siteData && isset($siteData['id'])) {
                $siteId = (int) $siteData['id'];
                $provinceId = (int) $siteData['province_id'];
            } else {
                return ["status" => "error", "message" => "Site non trouvé avec ce code."];
            }

            $sql = "SELECT 
                    e.*,
                    p.nom, p.prenom, p.telephone, p.email, p.rue as adresse, p.nif,
                    p.reduction_type, p.reduction_valeur, p.reduction_montant_max,
                    p.id as particulier_id
                    FROM engins e
                    JOIN particuliers p ON e.particulier_id = p.id
                    WHERE e.numero_plaque = :numero_plaque AND e.impot_id = 11 AND e.site_id IN ( SELECT id FROM sites WHERE province_id = :province_id)";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':numero_plaque' => $numeroPlaque, ':province_id' => $provinceId]);
            $donnees = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$donnees) {
                return ["status" => "error", "message" => "Plaque non trouvée dans la base locale."];
            }

            return [
                "status" => "success",
                "data" => $donnees
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification locale de la plaque: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Traite une demande de reproduction de carte (locale OU création externe)
     */
    public function traiterReproductionCarte($data)
    {
        // Validation des données obligatoires
        $requiredFields = ['impot_id', 'utilisateur_id', 'site_id', 'numero_plaque', 'source', 'site_code'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                return ["status" => "error", "message" => "Le champ $field est obligatoire."];
            }
        }

        try {
            $source = $data['source'];
            
            if ($source === 'externe') {
                // Créer un nouvel enregistrement depuis données externes
                return $this->creerNouvelleReproduction($data);
            } else {
                // Traiter une reproduction existante (locale)
                return $this->traiterReproductionLocale($data);
            }

        } catch (Exception $e) {
            error_log("Erreur lors du traitement de la reproduction: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Crée une nouvelle reproduction depuis données externes
     */
    private function creerNouvelleReproduction($data)
    {
        try {
            $this->beginTransactionSafe();

            // ================= SITE =================
            $sqlSite = "SELECT id, province_id, nom AS site_nom 
                        FROM sites 
                        WHERE code = :site_code AND actif = 1 
                        LIMIT 1";

            $stmtSite = $this->pdo->prepare($sqlSite);
            $stmtSite->execute([':site_code' => $data['site_code']]);
            $siteData = $stmtSite->fetch(PDO::FETCH_ASSOC);

            if (!$siteData) {
                return ["status" => "error", "message" => "Site non trouvé : " . $data['site_code']];
            }

            $provinceId   = $siteData['province_id'];
            $siteId       = $siteData['id'];
            $siteNom      = $siteData['site_nom'];

            // ================= DONNÉES EXTERNES =================
            // Récupération des données externes via la classe RecherchePlaque
            if (empty($data['extension']) || $data['extension'] === '0' || $data['extension'] === null || $data['extension'] === 0) {
                require_once 'RecherchePlaqueTsc.php';
            } else {
                // HAOJUE
                if ($data['extension'] == 439727) {
                    require_once 'RecherchePlaque.php';
                }

                // TVS
                if ($data['extension'] == 440071) {
                    require_once 'RecherchePlaqueTvs.php';
                }
            }
            
            $recherchePlaque = new RecherchePlaque();
            $resultatExterne = $recherchePlaque->rechercherParPlaque($data['numero_plaque']);

            if ($resultatExterne['status'] !== 'success') {
                return ["status" => "error", "message" => "Données externes non trouvées pour la plaque: " . $data['numero_plaque']];
            }

            $donneesExternes = $resultatExterne['data'];

            // ================= IDS =================
            $typeEnginId = $this->getTypeEnginId($donneesExternes['vehicule']['type_auto'] ?? '');
            $energieId   = $this->getEnergieId($donneesExternes['vehicule']['energie'] ?? '');
            $couleurId   = $this->getCouleurId($donneesExternes['vehicule']['couleur'] ?? '');
            $usageId     = $this->getUsageId($donneesExternes['vehicule']['usage'] ?? '');
            $puissanceId = $this->getPuissanceId($donneesExternes['vehicule']['puissance'] ?? '');

            // ================= PARTICULIER =================
            $nomComplet = $donneesExternes['client']['nom_complet'] ?? '';
            $parts = explode(' ', $nomComplet);
            $nom = $parts[0] ?? '';
            $prenom = isset($parts[1]) ? implode(' ', array_slice($parts, 1)) : '';

            // Vérification si un particulier existe déjà par téléphone (s'il n'est pas vide ou tiret)
            $telephone = $donneesExternes['client']['telephone'] ?? '';
            $existingParticulier = null;
            $particulierId = null;

            // Vérification uniquement si le téléphone n'est pas vide ou tiret
            if (!empty($telephone) && strlen($telephone) > 8) {
                $sqlCheck = "SELECT id FROM particuliers WHERE telephone = :telephone LIMIT 1";
                $stmtCheck = $this->pdo->prepare($sqlCheck);
                $stmtCheck->execute([':telephone' => $telephone]);
                $existingParticulier = $stmtCheck->fetch();
            }

            if ($existingParticulier) {
                // Mise à jour si existe
                $sqlParticulier = "UPDATE particuliers SET 
                                    nom = :nom,
                                    prenom = :prenom,
                                    email = :email,
                                    rue = :adresse,
                                    nif = :nif,
                                    site = :site,
                                    date_modification = NOW()
                                  WHERE telephone = :telephone";
                
                $stmt = $this->pdo->prepare($sqlParticulier);
                $resultParticulier = $stmt->execute([
                    ':nom'       => $nom,
                    ':prenom'    => $prenom,
                    ':email'     => '',
                    ':adresse'   => $donneesExternes['client']['adresse'] ?? '',
                    ':nif'       => '',
                    ':site'      => $siteId,
                    ':telephone' => $telephone
                ]);
                
                if (!$resultParticulier) {
                    $errorInfo = $stmt->errorInfo();
                    return ["status" => "error", "message" => "Échec de la mise à jour du particulier: " . ($errorInfo[2] ?? 'Erreur inconnue')];
                }
                
                $particulierId = $existingParticulier['id'];
            } else {
                // Insertion si n'existe pas ou téléphone vide/tiret
                $sqlParticulier = "INSERT INTO particuliers
                            (nom, prenom, telephone, email, rue, nif, site, date_creation, date_modification)
                            VALUES (:nom, :prenom, :telephone, :email, :adresse, :nif, :site, NOW(), NOW())";
                
                $stmt = $this->pdo->prepare($sqlParticulier);
                $resultParticulier = $stmt->execute([
                    ':nom'       => $nom,
                    ':prenom'    => $prenom,
                    ':telephone' => $telephone,
                    ':email'     => '',
                    ':adresse'   => $donneesExternes['client']['adresse'] ?? '',
                    ':nif'       => '',
                    ':site'      => $siteId
                ]);
                
                if (!$resultParticulier) {
                    $errorInfo = $stmt->errorInfo();
                    return ["status" => "error", "message" => "Échec de l'insertion du particulier: " . ($errorInfo[2] ?? 'Erreur inconnue')];
                }
                
                $particulierId = $this->pdo->lastInsertId();
            }

            // ================= PLAQUE =================
            $numeroPlaque = trim($data['numero_plaque']);
            $prefixe = substr($numeroPlaque, 0, 2);
            $numero  = substr($numeroPlaque, 2);

            if (!$prefixe || !$numero) {
                return ["status" => "error", "message" => "Format de plaque invalide : " . $numeroPlaque];
            }

            // ================= SERIE =================
            $stmtSerie = $this->pdo->prepare(
                "SELECT id FROM series WHERE nom_serie = :serie AND province_id = :province_id LIMIT 1"
            );
            $stmtSerie->execute([':serie' => $prefixe, ':province_id' => $provinceId]);
            $serieData = $stmtSerie->fetch(PDO::FETCH_ASSOC);

            if (!$serieData) {
                return ["status" => "error", "message" => "Série inexistante : " . $prefixe];
            }

            // ================= SERIE ITEM =================
            $stmtSerieItem = $this->pdo->prepare(
                "SELECT id FROM serie_items 
                 WHERE serie_id = :id_serie AND value = :value 
                 LIMIT 1"
            );

            $stmtSerieItem->execute([
                ':id_serie' => $serieData['id'],
                ':value'    => $numero
            ]);

            $serieItemData = $stmtSerieItem->fetch(PDO::FETCH_ASSOC);

            if (!$serieItemData) {
                return ["status" => "error", "message" => "Numéro de série invalide : " . $prefixe . $numero];
            }

            $enginId = null;

            // ================= ENGIN =================
            // Vérification si le numéro de plaque existe déjà
            $checkPlaqueSql = "SELECT id FROM engins WHERE numero_plaque = :numero_plaque AND site_id IN (SELECT id FROM sites WHERE province_id = :province_id) LIMIT 1";
            $checkStmt = $this->pdo->prepare($checkPlaqueSql);
            $checkStmt->execute([':numero_plaque' => $numeroPlaque, ':province_id' => $provinceId]);
            $existingEngin = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($existingEngin) {
                // Mise à jour si le numéro de plaque existe
                $sqlEngin = "UPDATE engins SET
                    type_engin = :type_engin,
                    impot_id = :impot_id,
                    marque = :marque,
                    energie = :energie,
                    annee_fabrication = :annee_fabrication,
                    annee_circulation = :annee_circulation,
                    couleur = :couleur,
                    puissance_fiscal = :puissance_fiscal,
                    usage_engin = :usage_engin,
                    utilisateur_id = :utilisateur_id,
                    numero_chassis = :numero_chassis,
                    numero_moteur = :numero_moteur,
                    particulier_id = :particulier_id,
                    serie_id = :serie_id,
                    serie_item_id = :serie_item_id,
                    site_id = :site_id,
                    date_modification = NOW()
                WHERE id = :id";

                $stmt = $this->pdo->prepare($sqlEngin);
                $resultEngin = $stmt->execute([
                    ':id'                  => $existingEngin['id'],
                    ':type_engin'          => $donneesExternes['vehicule']['type_auto'],
                    ':impot_id'            => $data['impot_id'],
                    ':marque'              => $donneesExternes['vehicule']['marque'] ?? '',
                    ':energie'             => $donneesExternes['vehicule']['energie'],
                    ':annee_fabrication'   => $donneesExternes['vehicule']['annee_fabrication'] ?? '',
                    ':annee_circulation'   => $donneesExternes['vehicule']['annee_circulation'] ?? '',
                    ':couleur'             => $donneesExternes['vehicule']['couleur'],
                    ':puissance_fiscal'    => $donneesExternes['vehicule']['puissance'],
                    ':usage_engin'         => $donneesExternes['vehicule']['usage'],
                    ':utilisateur_id'      => $data['utilisateur_id'],
                    ':numero_chassis'      => $donneesExternes['vehicule']['chassis'] ?? '',
                    ':numero_moteur'       => $donneesExternes['vehicule']['moteur'] ?? '',
                    ':particulier_id'      => $particulierId,
                    ':serie_id'            => $serieData['id'],
                    ':serie_item_id'       => $serieItemData['id'],
                    ':site_id'             => $siteId
                ]);
                
                if (!$resultEngin) {
                    $errorInfo = $stmt->errorInfo();
                    return ["status" => "error", "message" => "Échec de la mise à jour de l'engin: " . ($errorInfo[2] ?? 'Erreur inconnue')];
                }
                
                $enginId = $existingEngin['id'];
            } else {
                // Insertion si le numéro de plaque n'existe pas
                $sqlEngin = "INSERT INTO engins (
                    type_engin, impot_id, marque, energie, annee_fabrication, annee_circulation,
                    couleur, puissance_fiscal, usage_engin, utilisateur_id,
                    numero_chassis, numero_moteur, numero_plaque,
                    particulier_id, serie_id, serie_item_id, site_id,
                    date_creation, date_modification
                ) VALUES (
                    :type_engin, :impot_id, :marque, :energie, :annee_fabrication, :annee_circulation,
                    :couleur, :puissance_fiscal, :usage_engin, :utilisateur_id,
                    :numero_chassis, :numero_moteur, :numero_plaque,
                    :particulier_id, :serie_id, :serie_item_id, :site_id,
                    NOW(), NOW()
                )";

                $stmt = $this->pdo->prepare($sqlEngin);
                $resultEngin = $stmt->execute([
                    ':type_engin'        => $donneesExternes['vehicule']['type_auto'],
                    ':impot_id'          => $data['impot_id'],
                    ':marque'            => $donneesExternes['vehicule']['marque'] ?? '',
                    ':energie'           => $donneesExternes['vehicule']['energie'],
                    ':annee_fabrication' => $donneesExternes['vehicule']['annee_fabrication'] ?? '',
                    ':annee_circulation' => $donneesExternes['vehicule']['annee_circulation'] ?? '',
                    ':couleur'           => $donneesExternes['vehicule']['couleur'],
                    ':puissance_fiscal'  => $donneesExternes['vehicule']['puissance'],
                    ':usage_engin'       => $donneesExternes['vehicule']['usage'],
                    ':utilisateur_id'    => $data['utilisateur_id'],
                    ':numero_chassis'    => $donneesExternes['vehicule']['chassis'] ?? '',
                    ':numero_moteur'     => $donneesExternes['vehicule']['moteur'] ?? '',
                    ':numero_plaque'     => $numeroPlaque,
                    ':particulier_id'    => $particulierId,
                    ':serie_id'          => $serieData['id'],
                    ':serie_item_id'     => $serieItemData['id'],
                    ':site_id'           => $siteId
                ]);

                if (!$resultEngin) {
                    $errorInfo = $stmt->errorInfo();
                    return ["status" => "error", "message" => "Échec de l'insertion de l'engin: " . ($errorInfo[2] ?? 'Erreur inconnue')];
                }

                $enginId = $this->pdo->lastInsertId();
            }

            // ================= PAIEMENT =================
            $montantReproduction = 10; // Montant fixe pour reproduction

            $sqlPaiement = "INSERT INTO paiements_immatriculation 
                (engin_id, particulier_id, montant, montant_initial, impot_id, mode_paiement, operateur, 
                 numero_transaction, numero_cheque, banque, utilisateur_id, site_id) 
                VALUES 
                (:engin_id, :particulier_id, :montant, :montant_initial, :impot_id, :mode_paiement, :operateur,
                 :numero_transaction, :numero_cheque, :banque, :utilisateur_id, :site_id)";

            $stmtPaiement = $this->pdo->prepare($sqlPaiement);
            $resultPaiement = $stmtPaiement->execute([
                ':engin_id' => $enginId,
                ':particulier_id' => $particulierId,
                ':montant' => $montantReproduction,
                ':montant_initial' => $montantReproduction,
                ':impot_id' => $data['impot_id'],
                ':mode_paiement' => $data['mode_paiement'],
                ':operateur' => $data['operateur'] ?? '',
                ':numero_transaction' => $data['numero_transaction'] ?? '',
                ':numero_cheque' => $data['numero_cheque'] ?? '',
                ':banque' => $data['banque'] ?? '',
                ':utilisateur_id' => $data['utilisateur_id'],
                ':site_id' => $siteId
            ]);

            if (!$resultPaiement) {
                $errorInfo = $stmtPaiement->errorInfo();
                return ["status" => "error", "message" => "Échec de l'insertion du paiement: " . ($errorInfo[2] ?? 'Erreur inconnue')];
            }

            $paiementId = $this->pdo->lastInsertId();

            // ================= TRAITEMENT CODE PROMO =================
            if (!empty($data['code_promo'])) {
                $resultCodePromo = $this->traiterCodePromo($data['code_promo'], $paiementId);
                if (!$resultCodePromo) {
                    return ["status" => "error", "message" => "Échec du traitement du code promo"];
                }
            }

            // ================= REPARTITION =================
            $resultRepartition = $this->calculerRepartitionBeneficiaires($paiementId, $montantReproduction, $data['impot_id']);
            if (!$resultRepartition) {
                return ["status" => "error", "message" => "Échec du calcul de la répartition des bénéficiaires"];
            }

            // ================= CARTE REPRINT =================
            // Vérification si le numéro de plaque existe déjà
            $checkPlaqueSql = "SELECT id FROM carte_reprint WHERE numero_plaque = :numero_plaque AND site_id IN (SELECT id FROM sites WHERE province_id = :province_id) LIMIT 1";
            $checkStmt = $this->pdo->prepare($checkPlaqueSql);
            $checkStmt->execute([':numero_plaque' => $numeroPlaque, ':province_id' => $provinceId]);
            $existingReprint = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($existingReprint) {
                // Mise à jour si le numéro de plaque existe
                $sqlReprint = "UPDATE carte_reprint SET
                    nom_proprietaire = :nom_proprietaire,
                    adresse_proprietaire = :adresse_proprietaire,
                    nif_proprietaire = :nif_proprietaire,
                    annee_mise_circulation = :annee_mise_circulation,
                    marque_vehicule = :marque_vehicule,
                    usage_vehicule = :usage_vehicule,
                    numero_chassis = :numero_chassis,
                    numero_moteur = :numero_moteur,
                    annee_fabrication = :annee_fabrication,
                    couleur_vehicule = :couleur_vehicule,
                    puissance_vehicule = :puissance_vehicule,
                    utilisateur_id = :utilisateur_id,
                    site_id = :site_id,
                    status = :status,
                    id_paiement = :id_paiement,
                    date_modification = NOW()
                WHERE id = :id";

                $stmtReprint = $this->pdo->prepare($sqlReprint);
                $resultReprint = $stmtReprint->execute([
                    ':id' => $existingReprint['id'],
                    ':nom_proprietaire' => $nom . ' ' . $prenom,
                    ':adresse_proprietaire' => $donneesExternes['client']['adresse'] ?? '',
                    ':nif_proprietaire' => '',
                    ':annee_mise_circulation' => $donneesExternes['vehicule']['annee_circulation'] ?? '',
                    ':marque_vehicule' => $donneesExternes['vehicule']['marque'] ?? '',
                    ':usage_vehicule' => $donneesExternes['vehicule']['usage'],
                    ':numero_chassis' => $donneesExternes['vehicule']['chassis'] ?? '',
                    ':numero_moteur' => $donneesExternes['vehicule']['moteur'] ?? '',
                    ':annee_fabrication' => $donneesExternes['vehicule']['annee_fabrication'] ?? '',
                    ':couleur_vehicule' => $donneesExternes['vehicule']['couleur'],
                    ':puissance_vehicule' => $donneesExternes['vehicule']['puissance'],
                    ':utilisateur_id' => $data['utilisateur_id'],
                    ':site_id' => $siteId,
                    ':status' => 1,
                    ':id_paiement' => $paiementId
                ]);
                
                if (!$resultReprint) {
                    $errorInfo = $stmtReprint->errorInfo();
                    return ["status" => "error", "message" => "Échec de la mise à jour dans carte_reprint: " . ($errorInfo[2] ?? 'Erreur inconnue')];
                }
            } else {
                // Insertion si le numéro de plaque n'existe pas
                $sqlReprint = "INSERT INTO carte_reprint (
                    nom_proprietaire, adresse_proprietaire, nif_proprietaire,
                    annee_mise_circulation, numero_plaque, marque_vehicule,
                    usage_vehicule, numero_chassis, numero_moteur,
                    annee_fabrication, couleur_vehicule, puissance_vehicule,
                    utilisateur_id, site_id, status, id_paiement,
                    date_creation
                ) VALUES (
                    :nom_proprietaire, :adresse_proprietaire, :nif_proprietaire,
                    :annee_mise_circulation, :numero_plaque, :marque_vehicule,
                    :usage_vehicule, :numero_chassis, :numero_moteur,
                    :annee_fabrication, :couleur_vehicule, :puissance_vehicule,
                    :utilisateur_id, :site_id, :status, :id_paiement,
                    NOW()
                )";
                
                $stmtReprint = $this->pdo->prepare($sqlReprint);
                $resultReprint = $stmtReprint->execute([
                    ':nom_proprietaire' => $nom . ' ' . $prenom,
                    ':adresse_proprietaire' => $donneesExternes['client']['adresse'] ?? '',
                    ':nif_proprietaire' => '',
                    ':annee_mise_circulation' => $donneesExternes['vehicule']['annee_circulation'] ?? '',
                    ':numero_plaque' => $numeroPlaque,
                    ':marque_vehicule' => $donneesExternes['vehicule']['marque'] ?? '',
                    ':usage_vehicule' => $donneesExternes['vehicule']['usage'],
                    ':numero_chassis' => $donneesExternes['vehicule']['chassis'] ?? '',
                    ':numero_moteur' => $donneesExternes['vehicule']['moteur'] ?? '',
                    ':annee_fabrication' => $donneesExternes['vehicule']['annee_fabrication'] ?? '',
                    ':couleur_vehicule' => $donneesExternes['vehicule']['couleur'],
                    ':puissance_vehicule' => $donneesExternes['vehicule']['puissance'],
                    ':utilisateur_id' => $data['utilisateur_id'],
                    ':site_id' => $siteId,
                    ':status' => 1,
                    ':id_paiement' => $paiementId
                ]);
                
                if (!$resultReprint) {
                    $errorInfo = $stmtReprint->errorInfo();
                    return ["status" => "error", "message" => "Échec de l'insertion dans carte_reprint: " . ($errorInfo[2] ?? 'Erreur inconnue')];
                }
            }
            
            $this->commitSafe();
            
            // Journalisation et notification
            $this->logAudit("Nouvelle reproduction externe - Plaque: $numeroPlaque - Montant: $montantReproduction");
            $this->enregistrerNotification(
                'reproduction_carte',
                'Nouvelle reproduction (externe)',
                "Nouvelle reproduction créée depuis base externe - Plaque: $numeroPlaque - Montant: $montantReproduction - OPS : " . $data['utilisateur_id'],
                null,
                null,
                $paiementId
            );
            
            return [
                "status" => "success",
                "message" => "Nouvelle reproduction créée avec succès depuis données externes",
                "data" => [
                    "paiement_id" => $paiementId,
                    "numero_plaque" => $numeroPlaque,
                    "montant" => $montantReproduction,
                    "source" => "externe",
                    "site_nom" => $siteNom
                ]
            ];

        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("Erreur création reproduction externe: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur: " . $e->getMessage()];
        }
    }

    /**
     * Traite une reproduction existante (locale)
     */
    private function traiterReproductionLocale($data)
    {
        try {
            $this->beginTransactionSafe();

            // 1. Vérifier que la plaque existe localement
            $verificationPlaque = $this->verifierPlaqueLocale($data['numero_plaque'], $data['site_code']);
            if ($verificationPlaque['status'] === 'error') {
                throw new Exception($verificationPlaque['message']);
            }

            $donneesPlaque = $verificationPlaque['data'];
            $particulierId = $donneesPlaque['particulier_id'];
            $enginId = $donneesPlaque['id'];
            $reductionType = $donneesPlaque['reduction_type'];
            $reductionValeur = $donneesPlaque['reduction_valeur'];

            // 2. Calculer le montant avec réduction
            $montantInitial = 10; // Frais fixes de reproduction
            $montantAvecReduction = $this->appliquerReduction($montantInitial, $reductionType, $reductionValeur);

            // 3. Récupérer le site_id
            $siteId = $this->getSiteIdByEngin($enginId);

            // 4. Enregistrer le paiement
            $sqlPaiement = "INSERT INTO paiements_immatriculation 
                (engin_id, particulier_id, montant, montant_initial, impot_id, mode_paiement, operateur, 
                 numero_transaction, numero_cheque, banque, utilisateur_id, site_id) 
                VALUES 
                (:engin_id, :particulier_id, :montant, :montant_initial, :impot_id, :mode_paiement, :operateur,
                 :numero_transaction, :numero_cheque, :banque, :utilisateur_id, :site_id)";

            $stmtPaiement = $this->pdo->prepare($sqlPaiement);
            $stmtPaiement->execute([
                ':engin_id' => $enginId,
                ':particulier_id' => $particulierId,
                ':montant' => $montantAvecReduction,
                ':montant_initial' => $montantInitial,
                ':impot_id' => $data['impot_id'],
                ':mode_paiement' => $data['mode_paiement'],
                ':operateur' => $data['operateur'] ?? '',
                ':numero_transaction' => $data['numero_transaction'] ?? '',
                ':numero_cheque' => $data['numero_cheque'] ?? '',
                ':banque' => $data['banque'] ?? '',
                ':utilisateur_id' => $data['utilisateur_id'],
                ':site_id' => $siteId
            ]);

            $paiementId = $this->pdo->lastInsertId();

            // 5. Traiter le code promo si fourni
            if (!empty($data['code_promo'])) {
                $this->traiterCodePromo($data['code_promo'], $paiementId);
            }

            // 6. Calculer la répartition des bénéficiaires
            $resultRepartition = $this->calculerRepartitionBeneficiaires($paiementId, $montantAvecReduction, $data['impot_id']);

            // 7. Créer une entrée dans carte_reprint
            $sqlReprint = "INSERT INTO carte_reprint (
                nom_proprietaire, adresse_proprietaire, nif_proprietaire,
                annee_mise_circulation, numero_plaque, marque_vehicule,
                usage_vehicule, numero_chassis, numero_moteur,
                annee_fabrication, couleur_vehicule, puissance_vehicule,
                utilisateur_id, site_id, status, id_paiement,
                date_creation
            ) VALUES (
                :nom_proprietaire, :adresse_proprietaire, :nif_proprietaire,
                :annee_mise_circulation, :numero_plaque, :marque_vehicule,
                :usage_vehicule, :numero_chassis, :numero_moteur,
                :annee_fabrication, :couleur_vehicule, :puissance_vehicule,
                :utilisateur_id, :site_id, :status, :id_paiement,
                NOW()
            )";
            
            $stmtReprint = $this->pdo->prepare($sqlReprint);
            $stmtReprint->execute([
                ':nom_proprietaire' => $donneesPlaque['prenom'] . ' ' . $donneesPlaque['nom'],
                ':adresse_proprietaire' => $donneesPlaque['adresse'] ?? '',
                ':nif_proprietaire' => $donneesPlaque['nif'] ?? '',
                ':annee_mise_circulation' => $donneesPlaque['annee_circulation'] ?? '',
                ':numero_plaque' => $data['numero_plaque'],
                ':marque_vehicule' => $donneesPlaque['marque'] ?? '',
                ':usage_vehicule' => $donneesPlaque['usage_engin'] ?? '',
                ':numero_chassis' => $donneesPlaque['numero_chassis'] ?? '',
                ':numero_moteur' => $donneesPlaque['numero_moteur'] ?? '',
                ':annee_fabrication' => $donneesPlaque['annee_fabrication'] ?? '',
                ':couleur_vehicule' => $donneesPlaque['couleur'] ?? '',
                ':puissance_vehicule' => $donneesPlaque['puissance_fiscal'] ?? '',
                ':utilisateur_id' => $data['utilisateur_id'],
                ':site_id' => $siteId,
                ':status' => 1,
                ':id_paiement' => $paiementId
            ]);

            $this->commitSafe();

            // Log et notification
            $this->logAudit("Reproduction carte locale - Plaque: " . $data['numero_plaque'] . " - Montant: $montantAvecReduction");
            $this->enregistrerNotification(
                'reproduction_carte',
                'Reproduction de carte (locale)',
                "Reproduction de carte traitée - Plaque: " . $data['numero_plaque'] . " - Montant: $montantAvecReduction",
                $donneesPlaque['nif'] ?? null,
                null,
                $paiementId
            );

            // Récupérer les données pour retour
            $donneesImpression = $this->genererDonneesImpression($enginId, $particulierId, $paiementId);

            return [
                "status" => "success",
                "message" => "Reproduction de carte traitée avec succès",
                "data" => array_merge($donneesImpression, [
                    'reduction_appliquee' => [
                        'type' => $reductionType,
                        'valeur' => $reductionValeur,
                        'montant_initial' => $montantInitial,
                        'montant_final' => $montantAvecReduction
                    ],
                    'repartition' => $resultRepartition['status'] === 'success' ? $resultRepartition['data'] : null,
                    'paiement_id' => $paiementId,
                    'source' => 'locale'
                ])
            ];

        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("Erreur traitement reproduction locale: " . $e->getMessage());
            return ["status" => "error", "message" => $e->getMessage()];
        }
    }

    /**
     * Traite un code promo
     */
    private function traiterCodePromo($codePromo, $paiementId)
    {
        try {
            $sql = "SELECT id FROM promotion WHERE codepromo = :codepromo";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':codepromo' => $codePromo]);
            $promo = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($promo) {
                $sqlInsert = "INSERT INTO promotion_vente (idpromo, idpaiement) VALUES (:idpromo, :idpaiement)";
                $stmtInsert = $this->pdo->prepare($sqlInsert);
                $stmtInsert->execute([
                    ':idpromo' => $promo['id'],
                    ':idpaiement' => $paiementId
                ]);

                $this->logAudit("Code promo appliqué: $codePromo pour paiement: $paiementId");
                return true;
            }

            return false;

        } catch (PDOException $e) {
            error_log("Erreur lors du traitement du code promo: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Applique la réduction au montant
     */
    private function appliquerReduction($montantInitial, $reductionType, $reductionValeur)
    {
        if (!$reductionType || !$reductionValeur) {
            return $montantInitial;
        }

        if ($reductionType === 'pourcentage') {
            $reduction = ($montantInitial * $reductionValeur) / 100;
            return $montantInitial - $reduction;
        } elseif ($reductionType === 'montant_fixe') {
            return max(0, $montantInitial - $reductionValeur);
        }

        return $montantInitial;
    }

    /**
     * Récupère le site_id d'un engin
     */
    private function getSiteIdByEngin(int $enginId): int
    {
        try {
            $sql = "SELECT site_id FROM engins WHERE id = :engin_id LIMIT 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['engin_id' => $enginId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if (empty($result['site_id'])) {
                throw new Exception("Site affecté introuvable pour cet engin");
            }

            return (int) $result['site_id'];

        } catch (PDOException $e) {
            error_log("Erreur récupération site engin : " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Calcule et enregistre la répartition pour les bénéficiaires
     */
    private function calculerRepartitionBeneficiaires($idPaiement, $montantTotal, $idImpot)
    {
        try {
            $sqlBeneficiaires = "SELECT ib.beneficiaire_id, ib.type_part, ib.valeur_part, b.nom
                            FROM impot_beneficiaires ib
                            INNER JOIN beneficiaires b ON ib.beneficiaire_id = b.id
                            WHERE ib.impot_id = :impot_id";
            $stmtBeneficiaires = $this->pdo->prepare($sqlBeneficiaires);
            $stmtBeneficiaires->execute([':impot_id' => $idImpot]);
            $beneficiaires = $stmtBeneficiaires->fetchAll(PDO::FETCH_ASSOC);

            if (empty($beneficiaires)) {
                return ["status" => "error", "message" => "Aucun bénéficiaire trouvé pour cet impôt"];
            }

            $repartitions = [];
            $totalPourcentages = 0;

            foreach ($beneficiaires as $beneficiaire) {
                $nouvellePart = $beneficiaire;

                if ($beneficiaire['type_part'] === 'pourcentage') {
                    $nouveauPourcentage = $beneficiaire['valeur_part'];
                    $nouvellePart['valeur_part_calculee'] = $nouveauPourcentage;
                    $nouvellePart['montant'] = ($montantTotal * $nouveauPourcentage) / 100;
                    $totalPourcentages += $nouveauPourcentage;
                } else {
                    $nouveauMontant = $beneficiaire['valeur_part'];
                    $nouvellePart['valeur_part_calculee'] = $nouveauMontant;
                    $nouvellePart['montant'] = $nouveauMontant;
                }

                $repartitions[] = $nouvellePart;
            }

            if ($totalPourcentages > 100) {
                foreach ($repartitions as &$repartition) {
                    if ($repartition['type_part'] === 'pourcentage') {
                        $repartition['valeur_part_calculee'] = ($repartition['valeur_part_calculee'] * 100) / $totalPourcentages;
                        $repartition['montant'] = ($montantTotal * $repartition['valeur_part_calculee']) / 100;
                    }
                }
            }

            foreach ($repartitions as $repartition) {
                $sqlInsert = "INSERT INTO repartition_paiements_immatriculation 
                         (id_paiement_immatriculation, beneficiaire_id, type_part, valeur_part_originale, 
                          valeur_part_calculee, montant, date_creation) 
                         VALUES 
                         (:id_paiement, :beneficiaire_id, :type_part, :valeur_part_originale, 
                          :valeur_part_calculee, :montant, NOW())";

                $stmtInsert = $this->pdo->prepare($sqlInsert);
                $stmtInsert->execute([
                    ':id_paiement' => $idPaiement,
                    ':beneficiaire_id' => $repartition['beneficiaire_id'],
                    ':type_part' => $repartition['type_part'],
                    ':valeur_part_originale' => $repartition['valeur_part'],
                    ':valeur_part_calculee' => $repartition['valeur_part_calculee'],
                    ':montant' => $repartition['montant']
                ]);
            }

            return [
                "status" => "success",
                "message" => "Répartition calculée avec succès",
                "data" => [
                    "repartitions" => $repartitions,
                    "montant_total" => $montantTotal
                ]
            ];

        } catch (Exception $e) {
            error_log("Erreur lors du calcul de la répartition: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur lors du calcul de la répartition: " . $e->getMessage()
            ];
        }
    }

    /**
     * Génère les données pour l'impression de la carte
     */
    private function genererDonneesImpression($enginId, $particulierId, $paiementId)
    {
        $sql = "SELECT 
                e.numero_plaque, e.type_engin, e.marque, e.energie, e.couleur, e.usage_engin as `usage`,
                e.annee_fabrication, e.annee_circulation, e.puissance_fiscal, e.numero_chassis, e.numero_moteur,
                p.nom, p.prenom, p.telephone, p.email, p.rue as adresse, p.nif,
                p.reduction_type, p.reduction_valeur,
                pm.montant, pm.montant_initial, pm.mode_paiement, pm.operateur, pm.numero_transaction,
                pm.date_paiement, s.nom as site_nom, u.nom_complet as caissier
                FROM engins e
                JOIN particuliers p ON e.particulier_id = p.id
                JOIN paiements_immatriculation pm ON e.id = pm.engin_id
                JOIN sites s ON e.site_id = s.id
                JOIN utilisateurs u ON e.utilisateur_id = u.id
                WHERE e.id = :engin_id AND p.id = :particulier_id AND pm.id = :paiement_id";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':engin_id' => $enginId,
            ':particulier_id' => $particulierId,
            ':paiement_id' => $paiementId
        ]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ?: [];
    }

    /**
     * Récupère l'ID d'un type d'engin par son libellé
     */
    private function getTypeEnginId($libelle)
    {
        if (empty($libelle)) return null;
        
        $sql = "SELECT id FROM type_engins WHERE libelle = :libelle LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':libelle' => $libelle]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ? $result['id'] : null;
    }

    /**
     * Récupère l'ID d'une énergie par son nom
     */
    private function getEnergieId($nom)
    {
        if (empty($nom)) return null;
        
        $sql = "SELECT id FROM energies WHERE nom = :nom LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':nom' => $nom]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ? $result['id'] : null;
    }

    /**
     * Récupère l'ID d'une couleur par son nom
     */
    private function getCouleurId($nom)
    {
        if (empty($nom)) return null;
        
        $sql = "SELECT id FROM engin_couleurs WHERE nom = :nom LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':nom' => $nom]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ? $result['id'] : null;
    }

    /**
     * Récupère l'ID d'un usage par son libellé
     */
    private function getUsageId($libelle)
    {
        if (empty($libelle)) return null;
        
        $sql = "SELECT id FROM usages_engins WHERE libelle = :libelle LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':libelle' => $libelle]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ? $result['id'] : null;
    }

    /**
     * Récupère l'ID d'une puissance fiscale par son libellé
     */
    private function getPuissanceId($libelle)
    {
        if (empty($libelle)) return null;
        
        $sql = "SELECT id FROM puissances_fiscales WHERE libelle = :libelle LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':libelle' => $libelle]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ? $result['id'] : null;
    }

    /**
     * Log une action dans le journal d'audit
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

    /**
     * Enregistre une notification
     */
    private function enregistrerNotification($type, $titre, $message, $nif = null, $idDeclaration = null, $idPaiement = null)
    {
        try {
            $sql = "INSERT INTO notifications 
                    (type_notification, nif_contribuable, id_declaration, id_paiement, titre, message, date_creation) 
                    VALUES 
                    (:type, :nif, :id_declaration, :id_paiement, :titre, :message, NOW())";

            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([
                ':type' => $type,
                ':nif' => $nif,
                ':id_declaration' => $idDeclaration,
                ':id_paiement' => $idPaiement,
                ':titre' => $titre,
                ':message' => $message,
            ]);
        } catch (PDOException $e) {
            error_log("Erreur lors de l'enregistrement de la notification: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Vérifie si une transaction est active
     */
    public function isTransactionActive()
    {
        return $this->transactionActive;
    }

    /**
     * Destructeur pour s'assurer que les transactions sont fermées
     */
    public function __destruct()
    {
        if ($this->transactionActive) {
            error_log("ATTENTION: Transaction toujours active à la destruction de l'objet ReproductionCarte");
            $this->rollbackSafe();
        }
    }
}
?>