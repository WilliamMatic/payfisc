<?php
require_once 'Connexion.php';

/**
 * Classe CarteRose - Gestion complète de la délivrance des cartes roses
 */
class CarteRose extends Connexion
{
    public function formatCodeAvecZero(string $code): string
    {
        if (!preg_match('/^([A-Z]+)(\d+)$/i', $code, $matches)) {
            return $code;
        }

        $prefixe = $matches[1];
        $numero  = $matches[2];
        $numeroFormate = str_pad($numero, 3, '0', STR_PAD_LEFT);

        return $prefixe . $numeroFormate;
    }

    /**
     * Vérifie l'existence d'un particulier par téléphone (facultatif) et plaque avec statut 0
     * AVEC VERROU POUR ÉVITER LES DOUBLES TRAITEMENTS
     */
    public function verifierParticulierPlaque($telephone, $numeroPlaque, $utilisateurId)
    {
        try {
            $idSite = null;
            $provinceId = null;
            $parent = null;

            if (!empty($utilisateurId)) {
                try {
                    $sqlUser = "SELECT site_affecte_id FROM utilisateurs WHERE id = :utilisateur_id LIMIT 1";
                    $stmtUser = $this->pdo->prepare($sqlUser);
                    $stmtUser->bindValue(':utilisateur_id', (int) $utilisateurId, PDO::PARAM_INT);
                    $stmtUser->execute();
                    
                    $siteAff = $stmtUser->fetch(PDO::FETCH_ASSOC);
                    
                    if ($siteAff && !empty($siteAff['site_affecte_id'])) {
                        $idSite = (int) $siteAff['site_affecte_id'];
                    }
                } catch (PDOException $e) {
                    error_log("Erreur PDO lors de la récupération de site_affecte_id : " . $e->getMessage());
                    return [
                        'status'  => 'error',
                        'message' => 'Erreur PDO lors de la récupération de site_affecte_id : ' . $e->getMessage(),
                        'type'    => 'plaque_non_delivrée'
                    ];
                }
            }

            if ($idSite !== null) {
                try {
                    $sqlSite = "SELECT province_id, parent FROM sites WHERE id = :id AND actif = 1 LIMIT 1";
                    $stmtSite = $this->pdo->prepare($sqlSite);
                    $stmtSite->bindValue(':id', $idSite, PDO::PARAM_INT);
                    $stmtSite->execute();
                    
                    $siteData = $stmtSite->fetch(PDO::FETCH_ASSOC);
                    
                    if ($siteData && isset($siteData['province_id'])) {
                        $provinceId = (int) $siteData['province_id'];
                        $parent = isset($siteData['parent']) ? (int) $siteData['parent'] : null;
                    }
                } catch (PDOException $e) {
                    error_log("Erreur PDO lors de la récupération de province_id : " . $e->getMessage());
                    return [
                        'status'  => 'error',
                        'message' => 'Erreur PDO lors de la récupération de province_id : ' . $e->getMessage(),
                        'type'    => 'plaque_non_delivrée'
                    ];
                }
            }

            // Construction de la requête avec VERROU POUR MISE À JOUR
            if (!empty($telephone) && strlen($telephone) > 8) {
                $sql = "SELECT p.*, pa.id as plaque_attribuee_id, pa.statut as plaque_statut, 
                               pa.serie_id, pa.serie_item_id, pa.numero_plaque,
                               pa.particulier_id, pa.date_attribution
                        FROM particuliers p
                        INNER JOIN plaques_attribuees pa ON p.id = pa.particulier_id
                        WHERE p.telephone = :telephone 
                        AND pa.numero_plaque = :numero_plaque
                        AND pa.statut = 0
                        FOR UPDATE";
                
                $params = [
                    'telephone' => $telephone,
                    'numero_plaque' => $numeroPlaque
                ];

            } else {
                $sql = "SELECT p.*, pa.id as plaque_attribuee_id, pa.statut as plaque_statut, 
                               pa.serie_id, pa.serie_item_id, pa.numero_plaque,
                               pa.particulier_id, pa.date_attribution
                        FROM particuliers p
                        INNER JOIN plaques_attribuees pa ON p.id = pa.particulier_id
                        WHERE pa.numero_plaque = :numero_plaque AND pa.province_id = :province_id
                        AND pa.statut = 0
                        FOR UPDATE";
                
                $params = [
                    'numero_plaque' => $numeroPlaque,
                    'province_id' => $provinceId
                ];
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification particulier/plaque: " . $e->getMessage());
            return [
                'status'  => 'error',
                'message' => 'Erreur lors de la vérification particulier/plaque: ' . $e->getMessage(),
                'type'    => 'plaque_non_delivrée'
            ];
        }
    }

    /**
     * Vérifie si un numéro de téléphone existe déjà dans la table particuliers
     */
    public function verifierTelephoneExistant($telephone)
    {
        try {
            if (empty($telephone) || strlen($telephone) < 8 ) {
                return false;
            }
            
            $sql = "SELECT id, nom, prenom, telephone, email, rue as adresse, ville, code_postal, province, nif
                    FROM particuliers 
                    WHERE telephone = :telephone";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':telephone', $telephone, PDO::PARAM_STR);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification téléphone existant: " . $e->getMessage());
            return [
                'status'  => 'error',
                'message' => 'Erreur lors de la vérification téléphone existant: ' . $e->getMessage(),
                'type'    => 'plaque_non_delivrée'
            ];
        }
    }

    /**
     * Vérifie si un engin existe déjà par numéro de chassis
     */
    public function verifierEnginExistant($numeroChassis)
    {
        try {
            $sql = "SELECT id, particulier_id, numero_plaque, numero_chassis, date_modification
                    FROM engins 
                    WHERE numero_chassis = :numero_chassis";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':numero_chassis', $numeroChassis, PDO::PARAM_STR);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification engin existant: " . $e->getMessage());
            return [
                'status'  => 'error',
                'message' => 'Erreur lors de la vérification engin existant: ' . $e->getMessage(),
                'type'    => 'plaque_non_delivrée'
            ];
        }
    }

    /**
     * Vérifie si une carte rose active existe pour une plaque donnée
     * AVEC VERROU SQL pour éviter la double délivrance.
     */
    public function verifierCarteRoseExistante($numeroPlaque, $utilisateurId)
    {
        try {

            /* =========================================================
             * 1️⃣ VALIDATIONS DE BASE
             * ========================================================= */
            if (empty($numeroPlaque)) {
                return [
                    'status' => 'error',
                    'message' => 'Le numéro de plaque est requis.',
                    'type' => 'plaque_manquante'
                ];
            }

            if (empty($utilisateurId)) {
                return [
                    'status' => 'error',
                    'message' => 'L\'identifiant de l\'utilisateur est requis.',
                    'type' => 'utilisateur_manquant'
                ];
            }

            /* =========================================================
             * 2️⃣ RÉCUPÉRER LE SITE DE L'UTILISATEUR
             * ========================================================= */
            $sqlUser = "SELECT site_affecte_id 
                        FROM utilisateurs 
                        WHERE id = :utilisateur_id 
                        LIMIT 1";

            $stmtUser = $this->pdo->prepare($sqlUser);
            $stmtUser->bindValue(':utilisateur_id', (int)$utilisateurId, PDO::PARAM_INT);
            $stmtUser->execute();

            $userData = $stmtUser->fetch(PDO::FETCH_ASSOC);

            if (!$userData) {
                return [
                    'status' => 'error',
                    'message' => 'Utilisateur non trouvé.',
                    'type' => 'utilisateur_inexistant'
                ];
            }

            if (empty($userData['site_affecte_id'])) {
                return [
                    'status' => 'error',
                    'message' => 'L\'utilisateur n\'est affecté à aucun site.',
                    'type' => 'site_non_affecte'
                ];
            }

            $siteId = (int)$userData['site_affecte_id'];

            /* =========================================================
             * 3️⃣ RÉCUPÉRER LA PROVINCE DU SITE
             * ========================================================= */
            $sqlSite = "SELECT province_id 
                        FROM sites 
                        WHERE id = :id 
                        AND actif = 1 
                        LIMIT 1";

            $stmtSite = $this->pdo->prepare($sqlSite);
            $stmtSite->bindValue(':id', $siteId, PDO::PARAM_INT);
            $stmtSite->execute();

            $siteData = $stmtSite->fetch(PDO::FETCH_ASSOC);

            if (!$siteData) {
                return [
                    'status' => 'error',
                    'message' => 'Site non trouvé ou inactif.',
                    'type' => 'site_inexistant'
                ];
            }

            if (!isset($siteData['province_id'])) {
                return [
                    'status' => 'error',
                    'message' => 'Le site n\'est pas associé à une province.',
                    'type' => 'province_manquante'
                ];
            }

            $provinceId = (int)$siteData['province_id'];

            /* =========================================================
             * 4️⃣ VÉRIFIER SI LA SÉRIE EST LOGISTIQUE
             * ========================================================= */
            $prefixe = (string) mb_substr($numeroPlaque, 0, 2);

            $sqlSerie = "SELECT id 
                         FROM series 
                         WHERE nom_serie = :nom_serie 
                         AND province_id = :province_id
                         ORDER BY id ASC
                         LIMIT 1";

            $stmtSerie = $this->pdo->prepare($sqlSerie);
            $stmtSerie->bindValue(':nom_serie', $prefixe, PDO::PARAM_STR);
            $stmtSerie->bindValue(':province_id', $provinceId, PDO::PARAM_INT);
            $stmtSerie->execute();

            $serie = $stmtSerie->fetch(PDO::FETCH_ASSOC);

            // Si série logistique → vérifier qu'elle existe dans plaques_attribuees
            if ($serie && $serie['id'] > 1041 && $serie['id'] < 3897) {

                $sqlCheckPlaque = "SELECT id 
                                   FROM plaques_attribuees 
                                   WHERE numero_plaque = :numero_plaque
                                   AND province_id = :province_id
                                   LIMIT 1";

                $stmtCheckPlaque = $this->pdo->prepare($sqlCheckPlaque);
                $stmtCheckPlaque->bindValue(':numero_plaque', $numeroPlaque, PDO::PARAM_STR);
                $stmtCheckPlaque->bindValue(':province_id', $provinceId, PDO::PARAM_INT);
                $stmtCheckPlaque->execute();

                if (!$stmtCheckPlaque->fetch(PDO::FETCH_ASSOC)) {
                    return [
                        'status'  => 'error',
                        'message' => 'Cette plaque doit être délivrée par le service logistique de la TSC-NPS.',
                        'type'    => 'plaque_non_delivrée'
                    ];
                }
            }

            /* =========================================================
             * 5️⃣ CORRECTION AUTOMATIQUE DES PLAQUES ORPHELINES
             * ========================================================= */
            $sqlUpdate = "UPDATE plaques_attribuees pa
                          SET pa.statut = 0
                          WHERE pa.statut = 1 
                          AND pa.numero_plaque = :plaque
                          AND pa.province_id = :province_id
                          AND NOT EXISTS (
                              SELECT 1
                              FROM engins e
                              WHERE e.numero_plaque = pa.numero_plaque
                          )";

            $stmtUpdate = $this->pdo->prepare($sqlUpdate);
            $stmtUpdate->execute([
                ':plaque' => $numeroPlaque,
                ':province_id' => $provinceId
            ]);

            /* =========================================================
             * 6️⃣ VÉRIFICATION AVEC VERROU (ANTI DOUBLE DÉLIVRANCE)
             * ========================================================= */
            $sql = "SELECT pa.*, 
                           p.nom AS particulier_nom,
                           p.prenom,
                           p.telephone,
                           p.rue AS adresse,
                           p.nif,
                           s.nom AS site_nom,
                           s.province_id,
                           pr.nom AS province_nom
                    FROM plaques_attribuees pa
                    INNER JOIN particuliers p ON pa.particulier_id = p.id
                    INNER JOIN sites s ON pa.site_id = s.id
                    INNER JOIN provinces pr ON s.province_id = pr.id
                    WHERE pa.numero_plaque = :numero_plaque
                    AND pa.statut = 1
                    AND s.province_id = :province_id
                    FOR UPDATE";

            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':numero_plaque', $numeroPlaque, PDO::PARAM_STR);
            $stmt->bindValue(':province_id', $provinceId, PDO::PARAM_INT);
            $stmt->execute();

            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            /* =========================================================
             * 7️⃣ SI PAS TROUVÉ → MESSAGE PROPRE
             * ========================================================= */
            if (!$result) {

                $sqlProvince = "SELECT nom FROM provinces WHERE id = :province_id LIMIT 1";
                $stmtProvince = $this->pdo->prepare($sqlProvince);
                $stmtProvince->bindValue(':province_id', $provinceId, PDO::PARAM_INT);
                $stmtProvince->execute();

                $province = $stmtProvince->fetch(PDO::FETCH_ASSOC);
                $nomProvince = $province ? $province['nom'] : 'cette province';

                return [
                    'status' => 'error',
                    'message' => "Aucune carte rose active n'a été trouvée pour la plaque '$numeroPlaque' dans la province de '$nomProvince'.",
                    'type' => 'carte_rose_non_trouvee',
                    'details' => [
                        'numero_plaque' => $numeroPlaque,
                        'province_id' => $provinceId,
                        'province_nom' => $nomProvince
                    ]
                ];
            }

            return $result;

        } catch (PDOException $e) {

            error_log("Erreur PDO verifierCarteRoseExistante: " . $e->getMessage());

            return [
                'status' => 'error',
                'message' => 'Erreur système lors de la vérification de la carte rose.',
                'type' => 'erreur_systeme',
                'details' => [
                    'numero_plaque' => $numeroPlaque,
                    'utilisateur_id' => $utilisateurId
                ]
            ];

        } catch (Exception $e) {

            error_log("Exception verifierCarteRoseExistante: " . $e->getMessage());

            return [
                'status' => 'error',
                'message' => 'Une erreur inattendue s\'est produite lors de la vérification.',
                'type' => 'erreur_inattendue',
                'details' => [
                    'numero_plaque' => $numeroPlaque,
                    'utilisateur_id' => $utilisateurId
                ]
            ];
        }
    }

    /**
     * Processus complet de création de carte rose
     * Gère toute la transaction en une seule fois avec attribution automatique si série_id = 0
     * 
     * @param array $data Données nécessaires à la création de la carte rose
     * @return array Résultat de l'opération avec status et données/message d'erreur
     */
    public function creerCarteRoseComplete($data)
    {
        try {
            // DÉBUT DE LA TRANSACTION GLOBALE
            $this->pdo->beginTransaction();

            // RÉCUPÉRATION DU SITE DE L'UTILISATEUR
            $sqlUser = "SELECT site_affecte_id FROM utilisateurs WHERE id = :utilisateur_id LIMIT 1";
            $stmtUser = $this->pdo->prepare($sqlUser);
            $stmtUser->bindValue(':utilisateur_id', (int) $data['utilisateur_id'], PDO::PARAM_INT);
            $stmtUser->execute();
            
            $siteAff = $stmtUser->fetch(PDO::FETCH_ASSOC);
            
            if (!$siteAff) {
                $this->pdo->rollBack();
                return [
                    'status' => 'error',
                    'message' => 'Utilisateur non trouvé.',
                    'type' => 'utilisateur_inexistant'
                ];
            }
            
            if (empty($siteAff['site_affecte_id'])) {
                $this->pdo->rollBack();
                return [
                    'status' => 'error',
                    'message' => 'L\'utilisateur n\'est affecté à aucun site.',
                    'type' => 'site_non_affecte'
                ];
            }
            
            $idSite = (int) $siteAff['site_affecte_id'];

            /* =========================================================
             * RÉCUPÉRATION DE LA PROVINCE DU SITE
             * ========================================================= */
            $sqlSite = "SELECT province_id 
                        FROM sites 
                        WHERE id = :id 
                        AND actif = 1 
                        LIMIT 1";

            $stmtSite = $this->pdo->prepare($sqlSite);
            $stmtSite->bindValue(':id', $idSite, PDO::PARAM_INT);
            $stmtSite->execute();

            $siteData = $stmtSite->fetch(PDO::FETCH_ASSOC);

            if (!$siteData) {
                $this->pdo->rollBack();
                return [
                    'status' => 'error',
                    'message' => 'Site non trouvé ou inactif.',
                    'type' => 'site_inexistant'
                ];
            }

            if (!isset($siteData['province_id'])) {
                $this->pdo->rollBack();
                return [
                    'status' => 'error',
                    'message' => 'Le site n\'est pas associé à une province.',
                    'type' => 'province_manquante'
                ];
            }

            $provinceId = (int)$siteData['province_id'];

            // VÉRIFICATION SI LE SITE A UN PARENT
            $sqlParent = "SELECT parent FROM sites WHERE id = ? LIMIT 1";
            $stmtParent = $this->pdo->prepare($sqlParent);
            $stmtParent->execute([(int) $idSite]);

            $result = $stmtParent->fetchColumn();
            $parent = ($result !== false) ? 1 : 0;

            // VÉRIFICATION ET ATTRIBUTION AUTOMATIQUE SI SÉRIE EST À 0
            $serieId = $data['serie_id'] ?? 0;
            $serieItemId = $data['serie_item_id'] ?? 0;
            $numeroPlaque = strtoupper(trim($data['numero_plaque']));
            
            // Si série_id ou serie_item_id est à 0, on cherche automatiquement
            if ($serieId == 0 || $serieItemId == 0) {
                // 1. Vérifier d'abord si la plaque existe déjà dans engins
                $sqlEngin = "SELECT numero_plaque FROM engins WHERE numero_plaque = :numero_plaque AND site_id IN (SELECT id FROM sites WHERE province_id = :province_id) LIMIT 1";
                $stmtEngin = $this->pdo->prepare($sqlEngin);
                $stmtEngin->bindValue(':numero_plaque', $numeroPlaque, PDO::PARAM_STR);
                $stmtEngin->bindValue(':province_id', $provinceId, PDO::PARAM_STR);
                $stmtEngin->execute();
                $engineAff = $stmtEngin->fetch(PDO::FETCH_ASSOC);

                if (!$engineAff) {
                    // 2. Vérifier dans plaques_attribuees
                    $sqlAttribution = "SELECT numero_plaque FROM plaques_attribuees WHERE numero_plaque = :numero_plaque AND province_id = :province_id LIMIT 1";
                    $stmtAttribution = $this->pdo->prepare($sqlAttribution);
                    $stmtAttribution->bindValue(':numero_plaque', $numeroPlaque, PDO::PARAM_STR);
                    $stmtAttribution->bindValue(':province_id', $provinceId, PDO::PARAM_INT);
                    $stmtAttribution->execute();
                    $attributionAff = $stmtAttribution->fetch(PDO::FETCH_ASSOC);

                    if (!$attributionAff) {
                        // 3. La plaque n'existe pas, on l'attribue automatiquement
                        
                        // Récupérer l'ID du particulier par défaut (téléphone 0850000001)
                        $sqlParticulier = "SELECT id FROM particuliers WHERE telephone = :telephone LIMIT 1";
                        $stmtParticulier = $this->pdo->prepare($sqlParticulier);
                        $stmtParticulier->bindValue(':telephone', '0850000001', PDO::PARAM_STR);
                        $stmtParticulier->execute();
                        $particulier = $stmtParticulier->fetch(PDO::FETCH_ASSOC);
                        
                        if (!$particulier) {
                            $this->pdo->rollBack();
                            return [
                                'status' => 'error',
                                'message' => 'Particulier par défaut (0850000001) non trouvé.',
                                'type' => 'particulier_defaut_manquant'
                            ];
                        }
                        
                        $particulierId = (int) $particulier['id'];
                        
                        // Insérer le paiement dans paiements_immatriculation
                        $sqlPaiement = "INSERT INTO paiements_immatriculation 
                            (engin_id, particulier_id, montant, montant_initial, impot_id, 
                            mode_paiement, operateur, numero_transaction, numero_cheque, banque, 
                            statut, date_paiement, utilisateur_id, site_id, nombre_plaques, etat) 
                            VALUES 
                            (:engin_id, :particulier_id, :montant, :montant_initial, :impot_id,
                            :mode_paiement, :operateur, :numero_transaction, :numero_cheque, :banque,
                            :statut, NOW(), :utilisateur_id, :site_id, :nombre_plaques, :etat)";
                        
                        $stmtPaiement = $this->pdo->prepare($sqlPaiement);
                        $stmtPaiement->execute([
                            'engin_id' => null,
                            'particulier_id' => $particulierId,
                            'montant' => 0,
                            'montant_initial' => 0,
                            'impot_id' => $data['impot_id'],
                            'mode_paiement' => 'espece',
                            'operateur' => null,
                            'numero_transaction' => null,
                            'numero_cheque' => null,
                            'banque' => null,
                            'statut' => 'completed',
                            'utilisateur_id' => $data['utilisateur_id'],
                            'site_id' => $idSite,
                            'nombre_plaques' => 1,
                            'etat' => 0
                        ]);
                        
                        $paiementId = $this->pdo->lastInsertId();
                        
                        // Extraire les 2 premiers caractères pour la série
                        $nomSerie = substr($numeroPlaque, 0, 2);
                        
                        // Récupérer l'ID de la série
                        $sqlSerie = "SELECT id FROM series WHERE nom_serie = :nom_serie AND province_id = :province_id LIMIT 1";
                        $stmtSerie = $this->pdo->prepare($sqlSerie);
                        $stmtSerie->bindValue(':nom_serie', $nomSerie, PDO::PARAM_STR);
                        $stmtSerie->bindValue(':province_id', $provinceId, PDO::PARAM_INT);
                        $stmtSerie->execute();
                        $serie = $stmtSerie->fetch(PDO::FETCH_ASSOC);
                        
                        if (!$serie) {
                            $this->pdo->rollBack();
                            return [
                                'status' => 'error',
                                'message' => "Série non trouvée: $nomSerie",
                                'type' => 'serie_inexistante'
                            ];
                        }
                        
                        $serieId = (int) $serie['id'];
                        
                        // Extraire les caractères restants pour la valeur
                        $valeur = (int) substr($numeroPlaque, 2);
                        
                        // Récupérer l'ID de l'item de série
                        $sqlSerieItem = "SELECT id FROM serie_items 
                                        WHERE serie_id = :serie_id AND value = :value 
                                        AND statut IN ('0', '1') LIMIT 1";
                        $stmtSerieItem = $this->pdo->prepare($sqlSerieItem);
                        $stmtSerieItem->bindValue(':serie_id', $serieId, PDO::PARAM_INT);
                        $stmtSerieItem->bindValue(':value', $valeur, PDO::PARAM_INT);
                        $stmtSerieItem->execute();
                        $serieItem = $stmtSerieItem->fetch(PDO::FETCH_ASSOC);
                        
                        if (!$serieItem) {
                            $this->pdo->rollBack();
                            return [
                                'status' => 'error',
                                'message' => "Item de série non trouvé pour la valeur: $valeur",
                                'type' => 'serie_item_inexistant'
                            ];
                        }
                        
                        $serieItemId = (int) $serieItem['id'];
                        
                        // Insérer dans plaques_attribuees
                        $sqlInsertPlaque = "INSERT INTO plaques_attribuees 
                            (paiement_id, particulier_id, numero_plaque, 
                            serie_id, serie_item_id, utilisateur_id, site_id, 
                            date_attribution, statut, province_id) 
                            VALUES 
                            (:paiement_id, :particulier_id, :numero_plaque,
                            :serie_id, :serie_item_id, :utilisateur_id, :site_id,
                            NOW(), :statut, :province_id)";
                        
                        $stmtInsertPlaque = $this->pdo->prepare($sqlInsertPlaque);
                        $stmtInsertPlaque->execute([
                            'paiement_id' => $paiementId,
                            'particulier_id' => $particulierId,
                            'numero_plaque' => $numeroPlaque,
                            'serie_id' => $serieId,
                            'serie_item_id' => $serieItemId,
                            'utilisateur_id' => $data['utilisateur_id'],
                            'site_id' => $idSite,
                            'statut' => 1,
                            'province_id' => $provinceId
                        ]);
                        
                        // Mettre à jour le statut de l'item de série
                        $sqlUpdateItem = "UPDATE serie_items SET statut = '1' 
                                        WHERE id = :id";
                        $stmtUpdateItem = $this->pdo->prepare($sqlUpdateItem);
                        $stmtUpdateItem->bindValue(':id', $serieItemId, PDO::PARAM_INT);
                        $stmtUpdateItem->execute();
                        
                        // Mettre à jour les données pour la suite du traitement
                        $data['serie_id'] = $serieId;
                        $data['serie_item_id'] = $serieItemId;
                        $data['plaque_attribuee_id'] = $this->pdo->lastInsertId();
                        
                        error_log("Plaque attribuée automatiquement: $numeroPlaque, serie_id: $serieId, serie_item_id: $serieItemId");
                        
                    } else {
                        // La plaque existe déjà dans plaques_attribuees
                        $data['plaque_attribuee_id'] = null;
                    }
                } else {
                    // La plaque existe déjà dans engins
                    $data['plaque_attribuee_id'] = null;
                }
            }
            
            // VÉRIFICATION DE LA DISPONIBILITÉ DE LA PLAQUE
            $plaqueInfo = null;
            if (!empty($data['telephone']) && strlen($data['telephone']) > 8) {
                $plaqueInfo = $this->verifierParticulierPlaque(
                    $data['telephone'], 
                    $data['numero_plaque'], 
                    $data['utilisateur_id']
                );
            } else {
                $plaqueInfo = $this->verifierParticulierPlaque(
                    '', 
                    $data['numero_plaque'], 
                    $data['utilisateur_id']
                );
            }
            
            // Si plaque trouvée mais déjà traitée (statut != 0)
            if ($plaqueInfo && $plaqueInfo['plaque_statut'] != 0) {
                $this->pdo->rollBack();
                return [
                    'status' => 'error',
                    'message' => 'Cette plaque a déjà été traitée (statut: ' . $plaqueInfo['plaque_statut'] . ')',
                    'type' => 'plaque_deja_traitee'
                ];
            }
            
            // GESTION DU PARTICULIER
            $particulierId = null;
            $particulierExistant = false;
            
            if (!empty($data['telephone']) && strlen($data['telephone']) > 8) {
                $particulierExistant = $this->verifierTelephoneExistant($data['telephone']);
            }

            if ($particulierExistant) {

                $particulierId = $particulierExistant['id'];

                // ✅ Mettre à jour TOUTES les infos du particulier existant
                $sqlUpdate = "UPDATE particuliers 
                              SET nom = :nom,
                                  prenom = :prenom,
                                  telephone = :telephone,
                                  email = :email,
                                  rue = :adresse,
                                  ville = :ville,
                                  code_postal = :code_postal,
                                  province = :province,
                                  nif = :nif,
                                  utilisateur = :utilisateur,
                                  site = :site,
                                  date_modification = NOW()
                              WHERE id = :id";

                $stmtUpdate = $this->pdo->prepare($sqlUpdate);
                $stmtUpdate->execute([
                    ':id' => $particulierId,
                    ':nom' => $data['nom'],
                    ':prenom' => $data['prenom'],
                    ':telephone' => !empty($data['telephone']) ? $data['telephone'] : '',
                    ':email' => $data['email'] ?? '',
                    ':adresse' => $data['adresse'],
                    ':ville' => $data['ville'] ?? '',
                    ':code_postal' => $data['code_postal'] ?? '',
                    ':province' => $data['province'] ?? '',
                    ':nif' => $data['nif'] ?? '-',
                    ':utilisateur' => $data['utilisateur_id'],
                    ':site' => $idSite
                ]);

            } else {

                // ✅ Création inchangée
                $sqlInsert = "INSERT INTO particuliers (
                    nom, prenom, telephone, email, rue, ville, code_postal, province,
                    nif, utilisateur, site, date_creation, date_modification
                ) VALUES (
                    :nom, :prenom, :telephone, :email, :adresse, :ville, :code_postal, :province,
                    :nif, :utilisateur, :site, NOW(), NOW()
                )";

                $stmtInsert = $this->pdo->prepare($sqlInsert);
                $stmtInsert->execute([
                    ':nom' => $data['nom'],
                    ':prenom' => $data['prenom'],
                    ':telephone' => !empty($data['telephone']) ? $data['telephone'] : '',
                    ':email' => $data['email'] ?? '',
                    ':adresse' => $data['adresse'],
                    ':ville' => $data['ville'] ?? '',
                    ':code_postal' => $data['code_postal'] ?? '',
                    ':province' => $data['province'] ?? '',
                    ':nif' => $data['nif'] ?? '-',
                    ':utilisateur' => $data['utilisateur_id'],
                    ':site' => $idSite
                ]);

                $particulierId = $this->pdo->lastInsertId();
            }
            
            // GESTION DE L'ENGIN
            $enginId = null;
            
            // Vérifier si l'engin existe déjà par numéro de chassis
            $enginExistant = null;
            if (!empty($data['numero_chassis'])) {
                $sqlEngin = "SELECT id FROM engins WHERE numero_chassis = :numero_chassis FOR UPDATE";
                $stmtEngin = $this->pdo->prepare($sqlEngin);
                $stmtEngin->bindValue(':numero_chassis', $data['numero_chassis'], PDO::PARAM_STR);
                $stmtEngin->execute();
                $enginExistant = $stmtEngin->fetch(PDO::FETCH_ASSOC);
            }

            if ($enginExistant) {
                // Mettre à jour l'engin existant
                $enginId = $enginExistant['id'];
                $marqueComplete = trim($data['marque']) . ' ' . trim($data['modele']);
                
                $sqlUpdateEngin = "UPDATE engins 
                                  SET date_modification = NOW(),
                                      utilisateur_id = :utilisateur_id,
                                      site_id = :site_id,
                                      particulier_id = :particulier_id,
                                      serie_id = :serie_id,
                                      serie_item_id = :serie_item_id,
                                      numero_plaque = :numero_plaque,
                                      type_engin = :type_engin,
                                      marque = :marque,
                                      energie = :energie,
                                      annee_fabrication = :annee_fabrication,
                                      annee_circulation = :annee_circulation,
                                      couleur = :couleur,
                                      puissance_fiscal = :puissance_fiscal,
                                      usage_engin = :usage_engin,
                                      numero_moteur = :numero_moteur,
                                      impot_id = :impot_id
                                  WHERE id = :id";
                
                $stmtUpdateEngin = $this->pdo->prepare($sqlUpdateEngin);
                $stmtUpdateEngin->execute([
                    ':id' => $enginId,
                    ':utilisateur_id' => $data['utilisateur_id'],
                    ':site_id' => $idSite,
                    ':particulier_id' => $particulierId,
                    ':serie_id' => $data['serie_id'],
                    ':serie_item_id' => $data['serie_item_id'],
                    ':numero_plaque' => $numeroPlaque,
                    ':type_engin' => $data['type_engin'],
                    ':marque' => $marqueComplete,
                    ':energie' => $data['energie'] ?? '',
                    ':annee_fabrication' => !empty($data['annee_fabrication']) ? $data['annee_fabrication'] : null,
                    ':annee_circulation' => !empty($data['annee_circulation']) ? $data['annee_circulation'] : null,
                    ':couleur' => $data['couleur'] ?? '',
                    ':puissance_fiscal' => $data['puissance_fiscal'] ?? '',
                    ':usage_engin' => $data['usage_engin'] ?? '',
                    ':numero_moteur' => $data['numero_moteur'] ?? '',
                    ':impot_id' => $data['impot_id']
                ]);
            } else {
                // Créer un nouvel engin
                $marqueComplete = trim($data['marque']) . ' ' . trim($data['modele']);
                
                $sqlInsertEngin = "INSERT INTO engins (
                    particulier_id, serie_id, serie_item_id, numero_plaque,
                    type_engin, marque, energie, annee_fabrication, annee_circulation,
                    couleur, puissance_fiscal, usage_engin, numero_chassis, numero_moteur,
                    impot_id, utilisateur_id, site_id, date_creation, date_modification
                ) VALUES (
                    :particulier_id, :serie_id, :serie_item_id, :numero_plaque,
                    :type_engin, :marque, :energie, :annee_fabrication, :annee_circulation,
                    :couleur, :puissance_fiscal, :usage_engin, :numero_chassis, :numero_moteur,
                    :impot_id, :utilisateur_id, :site_id, NOW(), NOW()
                )";
                
                $stmtInsertEngin = $this->pdo->prepare($sqlInsertEngin);
                $stmtInsertEngin->execute([
                    ':particulier_id' => $particulierId,
                    ':serie_id' => $data['serie_id'],
                    ':serie_item_id' => $data['serie_item_id'],
                    ':numero_plaque' => $numeroPlaque,
                    ':type_engin' => $data['type_engin'],
                    ':marque' => $marqueComplete,
                    ':energie' => $data['energie'] ?? '',
                    ':annee_fabrication' => !empty($data['annee_fabrication']) ? $data['annee_fabrication'] : null,
                    ':annee_circulation' => !empty($data['annee_circulation']) ? $data['annee_circulation'] : null,
                    ':couleur' => $data['couleur'] ?? '',
                    ':puissance_fiscal' => $data['puissance_fiscal'] ?? '',
                    ':usage_engin' => $data['usage_engin'] ?? '',
                    ':numero_chassis' => $data['numero_chassis'] ?? '',
                    ':numero_moteur' => $data['numero_moteur'] ?? '',
                    ':impot_id' => $data['impot_id'],
                    ':utilisateur_id' => $data['utilisateur_id'],
                    ':site_id' => $idSite
                ]);
                
                $enginId = $this->pdo->lastInsertId();
            }
            
            // MISE À JOUR DU STATUT DE LA PLAQUE
            if ($plaqueInfo && $plaqueInfo['plaque_attribuee_id']) {
                $sqlUpdatePlaque = "UPDATE plaques_attribuees 
                                   SET statut = 1, date_attribution = NOW()
                                   WHERE id = :id AND province_id = :province_id";
                
                $stmtUpdatePlaque = $this->pdo->prepare($sqlUpdatePlaque);
                $stmtUpdatePlaque->execute([
                    ':id' => $plaqueInfo['plaque_attribuee_id'], 
                    ':province_id' => $provinceId
                ]);
                
            } elseif (isset($data['plaque_attribuee_id']) && $data['plaque_attribuee_id']) {
                // Si la plaque a été créée automatiquement, mettre à jour son statut
                $sqlUpdatePlaque = "UPDATE plaques_attribuees 
                                   SET statut = 1, date_attribution = NOW()
                                   WHERE id = :id AND province_id = :province_id";
                
                $stmtUpdatePlaque = $this->pdo->prepare($sqlUpdatePlaque);
                $stmtUpdatePlaque->execute([
                    ':id' => $data['plaque_attribuee_id'], 
                    ':province_id' => $provinceId
                ]);
            }
            
            // AJOUT DU PAIEMENT ZÉRO
            $sqlPaiement = "INSERT INTO paiements_immatriculation (
                engin_id, particulier_id, montant, montant_initial, impot_id,
                mode_paiement, operateur, numero_transaction, statut,
                date_paiement, utilisateur_id, site_id, nombre_plaques, etat
            ) VALUES (
                :engin_id, :particulier_id, 0, 0, :impot_id,
                'espece', 'system', :numero_transaction, 'completed',
                NOW(), :utilisateur_id, :site_id, 1, 0
            )";
            
            $numeroTransaction = 'ZERO_' . time() . '_' . mt_rand(1000, 9999);
            
            $stmtPaiement = $this->pdo->prepare($sqlPaiement);
            $stmtPaiement->execute([
                ':engin_id' => $enginId,
                ':particulier_id' => $particulierId,
                ':impot_id' => $data['impot_id'],
                ':numero_transaction' => $numeroTransaction,
                ':utilisateur_id' => $data['utilisateur_id'],
                ':site_id' => $idSite
            ]);
            
            $paiementId = $this->pdo->lastInsertId();
            
            // INSERTION DANS CARTE_REPRINT
            $sqlReprint = "INSERT INTO carte_reprint (
                nom_proprietaire, adresse_proprietaire, nif_proprietaire,
                annee_mise_circulation, numero_plaque, marque_vehicule, 
                usage_vehicule, numero_chassis, numero_moteur, annee_fabrication,
                couleur_vehicule, puissance_vehicule, utilisateur_id, site_id, id_paiement, status
            ) VALUES (
                :nom_proprietaire, :adresse_proprietaire, :nif_proprietaire,
                :annee_mise_circulation, :numero_plaque, :marque_vehicule, 
                :usage_vehicule, :numero_chassis, :numero_moteur, :annee_fabrication,
                :couleur_vehicule, :puissance_vehicule, :utilisateur_id, :site_id, :id_paiement, :status
            )";
            
            $stmtReprint = $this->pdo->prepare($sqlReprint);
            $stmtReprint->execute([
                ':nom_proprietaire' => $data['nom'] . ' ' . $data['prenom'],
                ':adresse_proprietaire' => $data['adresse'] . ' ' . ($data['ville'] ?? ''),
                ':nif_proprietaire' => '-',
                ':annee_mise_circulation' => !empty($data['annee_circulation']) ? $data['annee_circulation'] : null,
                ':numero_plaque' => $numeroPlaque,
                ':marque_vehicule' => trim($data['marque']) . ' ' . trim($data['modele']),
                ':usage_vehicule' => $data['usage_engin'] ?? '',
                ':numero_chassis' => $data['numero_chassis'] ?? '',
                ':numero_moteur' => $data['numero_moteur'] ?? '',
                ':annee_fabrication' => !empty($data['annee_fabrication']) ? $data['annee_fabrication'] : null,
                ':couleur_vehicule' => $data['couleur'] ?? '',
                ':puissance_vehicule' => $data['puissance_fiscal'] ?? '',
                ':utilisateur_id' => $data['utilisateur_id'],
                ':site_id' => $idSite,
                ':id_paiement' => $paiementId,
                ':status' => $parent
            ]);
            
            $reprintId = $this->pdo->lastInsertId();
            
            // VALIDATION DE LA TRANSACTION
            $this->pdo->commit();
            
            // Récupération des données complètes
            $donneesCompletes = $this->getDonneesCarteRose($enginId, $particulierId);
            
            return [
                'status' => 'success',
                'data' => array_merge($donneesCompletes, [
                    'particulier_id' => $particulierId,
                    'engin_id' => $enginId,
                    'paiement_id' => $paiementId,
                    'reprint_id' => $reprintId,
                    'particulier_existant' => $particulierExistant,
                    'plaque_attribuee_id' => $data['plaque_attribuee_id'] ?? ($plaqueInfo ? $plaqueInfo['plaque_attribuee_id'] : null),
                    'serie_id_auto' => ($data['serie_id'] ?? 0) != ($serieId ?? 0),
                    'serie_item_id_auto' => ($data['serie_item_id'] ?? 0) != ($serieItemId ?? 0)
                ])
            ];
            
        } catch (PDOException $e) {
            // ANNULATION EN CAS D'ERREUR PDO
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            
            error_log("Erreur PDO création carte rose: " . $e->getMessage());
            
            return [
                'status' => 'error',
                'message' => 'Erreur technique lors de l\'enregistrement. Veuillez réessayer.',
                'type' => 'pdo_error',
                'debug' => $e->getMessage()
            ];
            
        } catch (Exception $e) {
            // ANNULATION EN CAS D'AUTRE ERREUR
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            
            error_log("Exception création carte rose: " . $e->getMessage());
            
            return [
                'status' => 'error',
                'message' => 'Erreur inattendue lors du traitement.',
                'type' => 'unexpected_error',
                'debug' => $e->getMessage()
            ];
        }
    }

    /**
     * Récupère les données complètes de la carte rose pour l'impression
     */
    public function getDonneesCarteRose($enginId, $particulierId) {
        try {
            $sql = "SELECT 
                        p.nom,
                        p.prenom,
                        p.telephone,
                        p.rue AS adresse,
                        p.ville,
                        p.province,
                        p.nif,
                        p.site,
                        e.numero_plaque,
                        e.date_creation AS date_attribution,
                        e.type_engin,
                        e.marque,
                        e.energie,
                        e.annee_fabrication,
                        e.annee_circulation,
                        e.couleur,
                        e.puissance_fiscal,
                        e.usage_engin,
                        e.numero_chassis,
                        e.numero_moteur
                    FROM engins e
                    JOIN particuliers p ON e.particulier_id = p.id
                    WHERE e.id = :engin_id AND p.id = :particulier_id";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':engin_id', $enginId, PDO::PARAM_INT);
            $stmt->bindValue(':particulier_id', $particulierId, PDO::PARAM_INT);
            $stmt->execute();
            
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$data) {
                throw new Exception("Données non trouvées pour engin $enginId et particulier $particulierId");
            }
            
            return $data;
            
        } catch (Exception $e) {
            error_log("Erreur getDonneesCarteRose: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Génère un NIF unique
     */
    private function genererNIF()
    {
        $prefixe = 'NIF';
        $timestamp = time();
        $random = mt_rand(1000, 9999);
        return $prefixe . $timestamp . $random;
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
}
?>