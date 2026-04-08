<?php
require_once 'Connexion.php';

/**
 * Classe ClientSimple - Gestion des commandes de plaques pour clients spéciaux
 * Version corrigée : Atomicité garantie, sécurité renforcée
 */
class ClientSimple extends Connexion
{
    private $transactionActive = false;

    /**
     * Démarre une transaction sécurisée avec vérification
     */
    private function beginTransactionSafe()
    {
        if (!$this->transactionActive) {
            $this->pdo->beginTransaction();
            $this->transactionActive = true;
        }
    }

    /**
     * Commit sécurisé avec vérification
     */
    private function commitSafe()
    {
        if ($this->transactionActive) {
            $this->pdo->commit();
            $this->transactionActive = false;
        }
    }

    /**
     * Rollback sécurisé avec vérification
     */
    private function rollbackSafe()
    {
        if ($this->transactionActive) {
            try {
                $this->pdo->rollBack();
            } catch (PDOException $e) {
                error_log("Rollback déjà effectué ou non supporté: " . $e->getMessage());
            }
            $this->transactionActive = false;
        }
    }

    /**
     * Récupère la province_id d'un utilisateur via son site
     */
    private function getProvinceIdByUtilisateur($utilisateurId)
    {
        $sql = "SELECT s.province_id 
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
    }

    /**
     * Recherche un assujetti par numéro de téléphone (hors transaction)
     */
    public function rechercherAssujettiParTelephone($telephone, $utilisateurId)
    {
        try {
            $sql = "SELECT 
                    nom, 
                    prenom, 
                    telephone, 
                    email, 
                    rue, 
                    nif,
                    reduction_type,
                    reduction_valeur
                    FROM particuliers 
                    WHERE telephone = :telephone
                    AND actif = 1
                    LIMIT 1";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':telephone' => $telephone]);
            $assujetti = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($assujetti) {
                return [
                    "status" => "success",
                    "data" => [
                        "assujetti" => [
                            "nom" => $assujetti['nom'],
                            "prenom" => $assujetti['prenom'],
                            "telephone" => $assujetti['telephone'],
                            "email" => $assujetti['email'],
                            "rue" => $assujetti['rue'],
                            "nif" => $assujetti['nif'],
                            "reduction_type" => $assujetti['reduction_type'],
                            "reduction_valeur" => (float)$assujetti['reduction_valeur']
                        ]
                    ]
                ];
            } else {
                return [
                    "status" => "success",
                    "data" => [
                        "assujetti" => null
                    ],
                    "message" => "Aucun assujetti trouvé avec ce numéro de téléphone"
                ];
            }

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche de l'assujetti: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Recherche des plaques disponibles avec autocomplétion (hors transaction)
     */
    public function rechercherPlaquesDisponibles($recherche, $utilisateurId)
    {
        try {
            $provinceId = $this->getProvinceIdByUtilisateur($utilisateurId);

            $sql = "SELECT DISTINCT CONCAT(s.nom_serie, si.value) as numero_plaque, 
                           si.statut as disponible
                    FROM serie_items si 
                    JOIN series s ON si.serie_id = s.id 
                    WHERE s.province_id = :province_id
                    AND CONCAT(s.nom_serie, si.value) LIKE :recherche
                    ORDER BY numero_plaque ASC 
                    LIMIT 10";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':province_id' => $provinceId,
                ':recherche' => $recherche . '%'
            ]);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $suggestions = [];
            foreach ($resultats as $resultat) {
                $suggestions[] = [
                    'numero_plaque' => $resultat['numero_plaque'],
                    'disponible' => $resultat['disponible'] == '0'
                ];
            }

            return [
                "status" => "success",
                "data" => [
                    "suggestions" => $suggestions,
                    "nombre_resultats" => count($suggestions)
                ]
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des plaques: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        } catch (Exception $e) {
            return ["status" => "error", "message" => $e->getMessage()];
        }
    }

    /**
     * Vérifie si une séquence de plaques est disponible (hors transaction)
     */
    public function verifierSequencePlaques($plaqueDebut, $quantite, $utilisateurId)
    {
        try {
            $provinceId = $this->getProvinceIdByUtilisateur($utilisateurId);

            if (!preg_match('/^([A-Z]+)(\d+)$/', $plaqueDebut, $matches)) {
                return ["status" => "error", "message" => "Format de plaque invalide. Format attendu: ABC123"];
            }

            $serie = $matches[1];
            $numeroDebut = intval($matches[2]);

            // Vérifier que la série existe pour cette province
            $sqlSerie = "SELECT DISTINCT id FROM series WHERE nom_serie = :serie AND province_id = :province_id LIMIT 1 FOR UPDATE";
            $stmtSerie = $this->pdo->prepare($sqlSerie);
            $stmtSerie->execute([':serie' => $serie, ':province_id' => $provinceId]);
            $serieData = $stmtSerie->fetch(PDO::FETCH_ASSOC);

            if (!$serieData) {
                return ["status" => "error", "message" => "Série de plaques non disponible pour cette province"];
            }

            $serieId = $serieData['id'];
            $sequencePlaques = [];
            $numeroCourant = $numeroDebut;
            $plaquesTrouvees = 0;

            // Rechercher la séquence de plaques disponibles
            while ($plaquesTrouvees < $quantite) {
                $numeroPlaque = $serie . str_pad($numeroCourant, strlen($matches[2]), '0', STR_PAD_LEFT);
                
                // Vérifier si cette plaque est disponible
                $sqlCheck = "SELECT DISTINCT si.id, si.statut 
                            FROM serie_items si 
                            WHERE si.serie_id = :serie_id 
                            AND si.value = :value
                            LIMIT 1 FOR UPDATE";

                $stmtCheck = $this->pdo->prepare($sqlCheck);
                $stmtCheck->execute([
                    ':serie_id' => $serieId,
                    ':value' => str_pad($numeroCourant, strlen($matches[2]), '0', STR_PAD_LEFT)
                ]);
                $plaqueData = $stmtCheck->fetch(PDO::FETCH_ASSOC);

                if ($plaqueData && $plaqueData['statut'] == '0') {
                    $sequencePlaques[] = $numeroPlaque;
                    $plaquesTrouvees++;
                }

                $numeroCourant++;

                // Limite de sécurité pour éviter les boucles infinies
                if ($numeroCourant - $numeroDebut > 1000) {
                    break;
                }
            }

            if (count($sequencePlaques) === $quantite) {
                return [
                    "status" => "success",
                    "data" => [
                        "sequence_valide" => true,
                        "sequence_plaques" => $sequencePlaques,
                        "plaque_debut" => $plaqueDebut,
                        "quantite" => $quantite
                    ]
                ];
            } else {
                return [
                    "status" => "error",
                    "message" => "Séquence incomplète. Disponible: " . count($sequencePlaques) . " sur " . $quantite,
                    "data" => [
                        "sequence_valide" => false,
                        "sequence_plaques" => $sequencePlaques,
                        "plaques_trouvees" => count($sequencePlaques)
                    ]
                ];
            }

        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de la séquence: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        } catch (Exception $e) {
            return ["status" => "error", "message" => $e->getMessage()];
        }
    }

    /**
     * Vérifie le stock disponible selon la province de l'utilisateur (hors transaction)
     */
    public function verifierStockDisponible($nombrePlaques, $utilisateurId)
    {
        try {
            $provinceId = $this->getProvinceIdByUtilisateur($utilisateurId);

            $sql = "SELECT COUNT(*) as stock_disponible
                    FROM serie_items si 
                    JOIN series s ON si.serie_id = s.id 
                    WHERE si.statut = '0' 
                    AND s.province_id = :province_id";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':province_id' => $provinceId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            $stockDisponible = $result ? intval($result['stock_disponible']) : 0;
            $suffisant = $stockDisponible >= $nombrePlaques;

            return [
                "status" => "success",
                "data" => [
                    "suffisant" => $suffisant,
                    "stock_disponible" => $stockDisponible,
                    "nombre_demande" => $nombrePlaques
                ]
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du stock: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        } catch (Exception $e) {
            return ["status" => "error", "message" => $e->getMessage()];
        }
    }

    /**
     * TRAITEMENT COMPLET EN TRANSACTION ATOMIQUE
     * Version corrigée : tout dans une seule transaction
     */
    public function traiterCommande($data)
    {
        // Validation des données obligatoires
        $requiredFields = ['impot_id', 'utilisateur_id', 'site_id', 'nom', 'prenom', 'telephone', 'adresse', 'nombre_plaques'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                return ["status" => "error", "message" => "Le champ $field est obligatoire."];
            }
        }

        try {
            // ============================================================
            // DÉBUT DE LA TRANSACTION UNIQUE ET ATOMIQUE
            // ============================================================
            $this->beginTransactionSafe();

            $nombrePlaques = (int)$data['nombre_plaques'];
            $utilisateurId = (int)$data['utilisateur_id'];
            $numeroPlaqueDebut = $data['numero_plaque_debut'] ?? null;

            // ============================================================
            // ÉTAPE 1: VÉRIFICATIONS INITIALES (dans la transaction)
            // ============================================================
            
            // Récupérer la province de l'utilisateur (avec verrou si nécessaire)
            $provinceId = $this->getProvinceIdByUtilisateur($utilisateurId);

            // Vérifier le stock disponible AVANT toute opération
            $sqlStock = "SELECT COUNT(*) as stock_disponible
                        FROM serie_items si 
                        JOIN series s ON si.serie_id = s.id 
                        WHERE si.statut = '0' 
                        AND s.province_id = :province_id";
            
            $stmtStock = $this->pdo->prepare($sqlStock);
            $stmtStock->execute([':province_id' => $provinceId]);
            $stock = $stmtStock->fetch(PDO::FETCH_ASSOC);
            
            if (!$stock || (int)$stock['stock_disponible'] < $nombrePlaques) {
                $this->rollbackSafe();
                return ["status" => "error", "message" => "Stock insuffisant pour cette province"];
            }

            // ============================================================
            // ÉTAPE 2: CRÉATION/MISE À JOUR DU PARTICULIER (dans la transaction)
            // ============================================================
            $particulierData = $this->creerOuMajParticulierTransaction($data, $utilisateurId);
            if (!$particulierData['id']) {
                $this->rollbackSafe();
                return ["status" => "error", "message" => "Erreur lors de la mise à jour du particulier."];
            }

            $particulierId = $particulierData['id'];
            $reductionType = $particulierData['reduction_type'];
            $reductionValeur = $particulierData['reduction_valeur'];

            // ============================================================
            // ÉTAPE 3: RÉCUPÉRATION DES PLAQUES AVEC VERROUS
            // ============================================================
            $numerosPlaques = [];
            $numerosPlaquesArray = [];
            
            if ($numeroPlaqueDebut) {
                // Mode séquence spécifique
                $resultSequence = $this->getSequencePlaquesTransaction($numeroPlaqueDebut, $nombrePlaques, $provinceId);
                if ($resultSequence['status'] === 'error') {
                    $this->rollbackSafe();
                    return $resultSequence;
                }
                $numerosPlaques = $resultSequence['data']['numeros_plaques'];
                $numerosPlaquesArray = array_column($numerosPlaques, 'numero_plaque');
            } else {
                // Mode automatique
                $resultAuto = $this->getNumerosPlaquesDisponiblesTransaction($nombrePlaques, $provinceId);
                if ($resultAuto['status'] === 'error') {
                    $this->rollbackSafe();
                    return $resultAuto;
                }
                $numerosPlaques = $resultAuto['data']['numeros_plaques'];
                $numerosPlaquesArray = array_column($numerosPlaques, 'numero_plaque');
            }

            // ============================================================
            // ÉTAPE 4: CALCUL DU MONTANT
            // ============================================================
            $montantUnitaire = $data['montant_unitaire'] ?? 32;
            $montantInitial = $montantUnitaire * $nombrePlaques;
            $montantAvecReduction = $this->appliquerReduction($montantInitial, $reductionType, $reductionValeur, $nombrePlaques);

            // ============================================================
            // ÉTAPE 5: ENREGISTREMENT DU PAIEMENT
            // ============================================================
            $paiementData = $this->enregistrerPaiementTransaction($data, $particulierId, $montantAvecReduction, $montantInitial, $nombrePlaques);
            if (!$paiementData['id']) {
                $this->rollbackSafe();
                return ["status" => "error", "message" => "Erreur lors de l'enregistrement du paiement."];
            }

            $paiementId = $paiementData['id'];
            $montantFinal = $paiementData['montant_final'];

            // ============================================================
            // ÉTAPE 6: ENREGISTREMENT DES PLAQUES
            // ============================================================
            $this->enregistrerNumerosPlaquesTransaction($paiementId, $numerosPlaques, $particulierId, $data, $utilisateurId);

            // ============================================================
            // ÉTAPE 7: RÉPARTITION DES BÉNÉFICIAIRES
            // ============================================================
            $resultRepartition = $this->calculerRepartitionBeneficiairesTransaction($paiementId, $montantFinal, $data['impot_id'], $provinceId);
            if ($resultRepartition['status'] === 'error') {
                error_log("Erreur répartition bénéficiaires: " . $resultRepartition['message']);
                // On continue quand même, ce n'est pas critique
            }

            // ============================================================
            // ÉTAPE 8: NOTIFICATION ET AUDIT (toujours dans la transaction)
            // ============================================================
            $this->enregistrerNotificationTransaction(
                'commande_plaques',
                'Commande de plaques',
                "Commande de $nombrePlaques plaque(s) traitée - Montant: $montantFinal",
                $this->getNIFByParticulierIdTransaction($particulierId),
                null,
                $paiementId
            );

            $this->logAuditTransaction(
                $utilisateurId,
                $_SESSION['user_type'] ?? 'system',
                "Commande plaques créée - Quantité: $nombrePlaques - Particulier: {$data['nom']} {$data['prenom']} - Montant: $montantFinal"
            );

            // ============================================================
            // COMMIT DE LA TRANSACTION COMPLÈTE
            // ============================================================
            $this->commitSafe();

            // ============================================================
            // POST-TRANSACTION : RÉCUPÉRATION DES DONNÉES POUR LA RÉPONSE
            // ============================================================
            $factureData = $this->genererFacture($paiementId, $particulierId, $numerosPlaquesArray);

            return [
                "status" => "success",
                "message" => "Commande traitée avec succès",
                "data" => array_merge($factureData, [
                    'reduction_appliquee' => [
                        'type' => $reductionType,
                        'valeur' => $reductionValeur,
                        'montant_initial' => $montantInitial,
                        'montant_final' => $montantFinal
                    ],
                    'numeroPlaques' => $numerosPlaquesArray,
                    'repartition' => $resultRepartition['status'] === 'success' ? $resultRepartition['data'] : null,
                    'date_mouvement' => $data['date_mouvement'] ?? null
                ])
            ];

        } catch (PDOException $e) {
            $this->rollbackSafe();
            error_log("Erreur lors du traitement de la commande: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("Erreur inattendue lors du traitement de la commande: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur inattendue: " . $e->getMessage()];
        }
    }

    // ============================================================
    // MÉTHODES DE TRANSACTION UNIFIÉES
    // Toutes ces méthodes sont conçues pour fonctionner DANS une transaction
    // ============================================================

    /**
     * Crée ou met à jour un particulier DANS la transaction
     */
    private function creerOuMajParticulierTransaction($data, $utilisateurId)
    {
        // Vérifier si le particulier existe déjà
        $sqlCheck = "SELECT id, reduction_type, reduction_valeur FROM particuliers WHERE telephone = :telephone FOR UPDATE";
        $stmtCheck = $this->pdo->prepare($sqlCheck);
        $stmtCheck->execute([':telephone' => $data['telephone']]);
        $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        $siteId = $this->getSiteIdByUtilisateur($utilisateurId);
        if (!$siteId && isset($data['site_id'])) {
            $siteId = (int)$data['site_id'];
        }

        if ($existing) {
            // Mise à jour
            $sqlUpdate = "UPDATE particuliers SET 
                        nom = :nom,
                        prenom = :prenom,
                        email = :email,
                        rue = :adresse,
                        nif = :nif,
                        reduction_type = :reduction_type,
                        reduction_valeur = :reduction_valeur,
                        date_modification = NOW(),
                        utilisateur = :utilisateur_id,
                        site = :site_id
                        WHERE id = :id";
            
            $stmtUpdate = $this->pdo->prepare($sqlUpdate);
            $stmtUpdate->execute([
                ':id' => $existing['id'],
                ':nom' => $data['nom'],
                ':prenom' => $data['prenom'],
                ':email' => $data['email'] ?? '',
                ':adresse' => $data['adresse'],
                ':nif' => $data['nif'] ?? null,
                ':reduction_type' => $data['reduction_type'] ?? null,
                ':reduction_valeur' => isset($data['reduction_valeur']) ? (float)$data['reduction_valeur'] : null,
                ':utilisateur_id' => $utilisateurId,
                ':site_id' => $siteId
            ]);
            
            return [
                'id' => $existing['id'],
                'reduction_type' => $data['reduction_type'] ?? $existing['reduction_type'],
                'reduction_valeur' => isset($data['reduction_valeur']) ? (float)$data['reduction_valeur'] : $existing['reduction_valeur']
            ];
        } else {
            // Création
            $sqlInsert = "INSERT INTO particuliers 
                         (nom, prenom, telephone, email, rue, nif, reduction_type, reduction_valeur, utilisateur, site) 
                         VALUES (:nom, :prenom, :telephone, :email, :adresse, :nif, :reduction_type, :reduction_valeur, :utilisateur_id, :site_id)";
            
            $stmtInsert = $this->pdo->prepare($sqlInsert);
            $stmtInsert->execute([
                ':nom' => $data['nom'],
                ':prenom' => $data['prenom'],
                ':telephone' => $data['telephone'],
                ':email' => $data['email'] ?? '',
                ':adresse' => $data['adresse'],
                ':nif' => $data['nif'] ?? '-',
                ':reduction_type' => $data['reduction_type'] ?? null,
                ':reduction_valeur' => isset($data['reduction_valeur']) ? (float)$data['reduction_valeur'] : null,
                ':utilisateur_id' => $utilisateurId,
                ':site_id' => $siteId
            ]);

            $particulierId = $this->pdo->lastInsertId();

            return [
                'id' => $particulierId,
                'reduction_type' => $data['reduction_type'] ?? null,
                'reduction_valeur' => isset($data['reduction_valeur']) ? (float)$data['reduction_valeur'] : 0
            ];
        }
    }

    /**
     * Récupère une séquence de plaques DANS la transaction
     */
    private function getSequencePlaquesTransaction($plaqueDebut, $quantite, $provinceId)
    {
        if (!preg_match('/^([A-Z]+)(\d+)$/', $plaqueDebut, $matches)) {
            throw new Exception("Format de plaque invalide");
        }

        $serie = $matches[1];
        $numeroDebut = intval($matches[2]);
        $longueurNumero = strlen($matches[2]);

        // Vérifier la série avec verrou
        $sqlSerie = "SELECT id FROM series WHERE nom_serie = :serie AND province_id = :province_id FOR UPDATE";
        $stmtSerie = $this->pdo->prepare($sqlSerie);
        $stmtSerie->execute([':serie' => $serie, ':province_id' => $provinceId]);
        $serieData = $stmtSerie->fetch(PDO::FETCH_ASSOC);

        if (!$serieData) {
            throw new Exception("Série de plaques non disponible");
        }

        $serieId = $serieData['id'];
        $numerosPlaques = [];
        $numeroCourant = $numeroDebut;
        $plaquesTrouvees = 0;

        // Récupérer la séquence avec verrous
        while ($plaquesTrouvees < $quantite) {
            $valeurPlaque = str_pad($numeroCourant, $longueurNumero, '0', STR_PAD_LEFT);
            $numeroPlaqueComplet = $serie . $valeurPlaque;
            
            $sql = "SELECT si.id, si.serie_id, si.value, s.nom_serie 
                    FROM serie_items si 
                    JOIN series s ON si.serie_id = s.id 
                    WHERE si.serie_id = :serie_id 
                    AND si.value = :value 
                    AND si.statut = '0'
                    FOR UPDATE";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':serie_id' => $serieId,
                ':value' => $valeurPlaque
            ]);
            $plaqueData = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($plaqueData) {
                // Marquer comme pris
                $sqlUpdate = "UPDATE serie_items SET statut = '1' WHERE id = :id";
                $stmtUpdate = $this->pdo->prepare($sqlUpdate);
                $stmtUpdate->execute([':id' => $plaqueData['id']]);

                $numerosPlaques[] = [
                    "numero_plaque" => $numeroPlaqueComplet,
                    "serie_id" => $plaqueData['serie_id'],
                    "serie_item_id" => $plaqueData['id']
                ];
                $plaquesTrouvees++;
            }

            $numeroCourant++;

            if ($numeroCourant - $numeroDebut > 1000) {
                throw new Exception("Impossible de trouver une séquence complète");
            }
        }

        return [
            "status" => "success", 
            "data" => [
                "numeros_plaques" => $numerosPlaques,
                "quantite" => $quantite,
                "plaque_debut" => $plaqueDebut
            ]
        ];
    }

    /**
     * Récupère des plaques automatiquement DANS la transaction
     */
    private function getNumerosPlaquesDisponiblesTransaction($quantite, $provinceId)
    {
        $sql = "SELECT si.id, si.serie_id, si.value, s.nom_serie 
                FROM serie_items si 
                JOIN series s ON si.serie_id = s.id 
                WHERE si.statut = '0' 
                AND s.province_id = :province_id
                ORDER BY si.id ASC 
                LIMIT :quantite FOR UPDATE";

        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':province_id', $provinceId, PDO::PARAM_INT);
        $stmt->bindValue(':quantite', (int)$quantite, PDO::PARAM_INT);
        $stmt->execute();
        $serieItems = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($serieItems) < $quantite) {
            throw new Exception("Stock insuffisant pour cette province. Disponible: " . count($serieItems) . ", Demandé: " . $quantite);
        }

        $numerosPlaques = [];
        foreach ($serieItems as $item) {
            // Marquer comme pris
            $sqlUpdate = "UPDATE serie_items SET statut = '1' WHERE id = :id";
            $stmtUpdate = $this->pdo->prepare($sqlUpdate);
            $stmtUpdate->execute([':id' => $item['id']]);

            $numeroPlaque = $item['nom_serie'] . $item['value'];
            $numerosPlaques[] = [
                "numero_plaque" => $numeroPlaque,
                "serie_id" => $item['serie_id'],
                "serie_item_id" => $item['id']
            ];
        }

        return [
            "status" => "success", 
            "data" => [
                "numeros_plaques" => $numerosPlaques,
                "quantite" => $quantite
            ]
        ];
    }

    /**
     * Enregistre un paiement DANS la transaction
     */
    private function enregistrerPaiementTransaction($data, $particulierId, $montantFinal, $montantInitial, $nombrePlaques)
    {
        $siteId = $this->getSiteIdByUtilisateur($data['utilisateur_id']);
        if (!$siteId && isset($data['site_id'])) {
            $siteId = (int)$data['site_id'];
        }

        $datePaiement = isset($data['date_mouvement']) && !empty($data['date_mouvement']) 
            ? $data['date_mouvement'] . ' ' . date('H:i:s')
            : date('Y-m-d H:i:s');

        $sql = "INSERT INTO paiements_immatriculation 
                (particulier_id, montant, montant_initial, impot_id, mode_paiement, operateur, 
                 numero_transaction, numero_cheque, banque, utilisateur_id, site_id, nombre_plaques,
                 date_paiement) 
                VALUES 
                (:particulier_id, :montant, :montant_initial, :impot_id, :mode_paiement, :operateur,
                 :numero_transaction, :numero_cheque, :banque, :utilisateur_id, :site_id, :nombre_plaques,
                 :date_paiement)";

        $stmt = $this->pdo->prepare($sql);
        
        $stmt->execute([
            ':particulier_id' => $particulierId,
            ':montant' => $montantFinal,
            ':montant_initial' => $montantInitial,
            ':impot_id' => $data['impot_id'],
            ':mode_paiement' => $data['mode_paiement'],
            ':operateur' => $data['operateur'] ?? '',
            ':numero_transaction' => $data['numero_transaction'] ?? '',
            ':numero_cheque' => $data['numero_cheque'] ?? '',
            ':banque' => $data['banque'] ?? '',
            ':utilisateur_id' => $data['utilisateur_id'],
            ':site_id' => $siteId,
            ':nombre_plaques' => $nombrePlaques,
            ':date_paiement' => $datePaiement
        ]);

        $paiementId = $this->pdo->lastInsertId();

        return [
            'id' => $paiementId,
            'montant_final' => $montantFinal,
            'date_paiement' => $datePaiement
        ];
    }

    /**
     * Enregistre les plaques DANS la transaction
     */
    private function enregistrerNumerosPlaquesTransaction($paiementId, $numerosPlaques, $particulierId, $data, $utilisateurId)
    {

        $provinceId = $this->getProvinceIdByUtilisateur($utilisateurId);

        $siteId = $this->getSiteIdByUtilisateur($utilisateurId);
        if (!$siteId && isset($data['site_id'])) {
            $siteId = (int)$data['site_id'];
        }

        $sql = "INSERT INTO plaques_attribuees 
                (paiement_id, particulier_id, numero_plaque, serie_id, serie_item_id, 
                 utilisateur_id, site_id, province_id, date_attribution) 
                VALUES 
                (:paiement_id, :particulier_id, :numero_plaque, :serie_id, :serie_item_id,
                 :utilisateur_id, :site_id, :province_id, NOW())";

        $stmt = $this->pdo->prepare($sql);

        foreach ($numerosPlaques as $plaque) {
            $stmt->execute([
                ':paiement_id' => $paiementId,
                ':particulier_id' => $particulierId,
                ':numero_plaque' => $plaque['numero_plaque'],
                ':serie_id' => $plaque['serie_id'],
                ':serie_item_id' => $plaque['serie_item_id'],
                ':utilisateur_id' => $utilisateurId,
                ':site_id' => $siteId,
                ':province_id' => $provinceId
            ]);
        }
    }

    /**
     * Calcule la répartition DANS la transaction
     */
    private function calculerRepartitionBeneficiairesTransaction($idPaiement, $montantTotal, $idImpot, $provinceId)
    {
        $sqlBeneficiaires = "SELECT ib.beneficiaire_id, ib.type_part, ib.valeur_part, b.nom
                        FROM impot_beneficiaires ib
                        INNER JOIN beneficiaires b ON ib.beneficiaire_id = b.id
                        WHERE ib.impot_id = :impot_id AND ib.province_id = :province_id";
        $stmtBeneficiaires = $this->pdo->prepare($sqlBeneficiaires);
        $stmtBeneficiaires->execute([':impot_id' => $idImpot, ':province_id' => $provinceId]);
        $beneficiaires = $stmtBeneficiaires->fetchAll(PDO::FETCH_ASSOC);

        if (empty($beneficiaires)) {
            return [
                "status" => "error",
                "message" => "Aucun bénéficiaire trouvé pour cet impôt"
            ];
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
    }

    /**
     * Enregistre une notification DANS la transaction
     */
    private function enregistrerNotificationTransaction($type, $titre, $message, $nif = null, $idDeclaration = null, $idPaiement = null)
    {
        $sql = "INSERT INTO notifications 
                (type_notification, nif_contribuable, id_declaration, id_paiement, titre, message, date_creation) 
                VALUES 
                (:type, :nif, :id_declaration, :id_paiement, :titre, :message, NOW())";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':type' => $type,
            ':nif' => $nif,
            ':id_declaration' => $idDeclaration,
            ':id_paiement' => $idPaiement,
            ':titre' => $titre,
            ':message' => $message,
        ]);
    }

    /**
     * Log d'audit DANS la transaction
     */
    private function logAuditTransaction($userId, $userType, $message)
    {
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
     * Récupère le NIF DANS la transaction
     */
    private function getNIFByParticulierIdTransaction($particulierId)
    {
        $sql = "SELECT nif FROM particuliers WHERE id = :id FOR UPDATE";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':id' => $particulierId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ? $result['nif'] : null;
    }

    /**
     * Récupère le site_id d'un utilisateur
     */
    private function getSiteIdByUtilisateur($utilisateurId)
    {
        $sql = "SELECT site_affecte_id FROM utilisateurs WHERE id = :utilisateur_id LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':utilisateur_id' => $utilisateurId]);
        $siteAff = $stmt->fetch(PDO::FETCH_ASSOC);

        return $siteAff && isset($siteAff['site_affecte_id']) ? (int)$siteAff['site_affecte_id'] : null;
    }

    /**
     * Applique la réduction au montant
     */
    private function appliquerReduction($montantInitial, $reductionType, $reductionValeur, $nombrePlaques)
    {
        if (!$reductionType || !$reductionValeur) {
            return $montantInitial;
        }

        if ($reductionType === 'pourcentage') {
            $reduction = ($montantInitial * $reductionValeur) / 100;
            return $montantInitial - $reduction;
        } elseif ($reductionType === 'montant_fixe') {
            $reductionTotal = $reductionValeur * $nombrePlaques;
            return max(0, $montantInitial - $reductionTotal);
        }

        return $montantInitial;
    }

    /**
     * Génère les données de facture (hors transaction)
     */
    private function genererFacture($paiementId, $particulierId, $numerosPlaquesArray)
    {
        try {
            $sql = "SELECT 
                    p.id, p.nom, p.prenom, p.telephone, p.email, p.rue as adresse, p.nif,
                    p.reduction_type, p.reduction_valeur,
                    pm.montant, pm.montant_initial, pm.mode_paiement, pm.operateur, pm.numero_transaction,
                    pm.date_paiement, pm.nombre_plaques,
                    s.nom as site_nom, u.nom_complet as caissier
                    FROM paiements_immatriculation pm
                    JOIN particuliers p ON pm.particulier_id = p.id
                    JOIN sites s ON pm.site_id = s.id
                    JOIN utilisateurs u ON pm.utilisateur_id = u.id
                    WHERE pm.id = :paiement_id AND p.id = :particulier_id";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':paiement_id' => $paiementId,
                ':particulier_id' => $particulierId
            ]);

            $facture = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$facture) {
                throw new Exception("Facture non trouvée");
            }
            
            $facture['numeros_plaques'] = $numerosPlaquesArray;

            return $facture;
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la génération de la facture: " . $e->getMessage());
            return [
                'id' => $paiementId,
                'nom' => 'Inconnu',
                'prenom' => '',
                'telephone' => '',
                'email' => '',
                'adresse' => '',
                'nif' => '',
                'reduction_type' => null,
                'reduction_valeur' => 0,
                'montant' => 0,
                'montant_initial' => 0,
                'mode_paiement' => '',
                'operateur' => '',
                'numero_transaction' => '',
                'date_paiement' => date('Y-m-d H:i:s'),
                'nombre_plaques' => count($numerosPlaquesArray),
                'site_nom' => 'Inconnu',
                'caissier' => 'Inconnu',
                'numeros_plaques' => $numerosPlaquesArray
            ];
        }
    }

    /**
     * Supprime complètement une commande DANS UNE SEULE TRANSACTION
     */
    /**
     * Supprime complètement une commande DANS UNE SEULE TRANSACTION
     */
    public function supprimerCommande($paiementId, $utilisateurId, $raisonSuppression = '')
    {
        try {
            // ============================================================
            // DÉBUT DE LA TRANSACTION UNIQUE
            // ============================================================
            $this->beginTransactionSafe();

            // 1. Vérifier et verrouiller la commande
            $sqlCheck = "SELECT 
                        pm.id, pm.particulier_id, pm.montant, pm.nombre_plaques,
                        p.nom, p.prenom, p.telephone, p.nif
                        FROM paiements_immatriculation pm
                        JOIN particuliers p ON pm.particulier_id = p.id
                        WHERE pm.id = :paiement_id
                        FOR UPDATE";
            
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([':paiement_id' => $paiementId]);
            $commande = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if (!$commande) {
                $this->rollbackSafe();
                return [
                    "status" => "error",
                    "message" => "Commande non trouvée"
                ];
            }

            // 2. Récupérer les plaques avec verrous
            $sqlPlaques = "SELECT 
                          pa.id, pa.numero_plaque, pa.serie_item_id, si.serie_id
                          FROM plaques_attribuees pa
                          LEFT JOIN serie_items si ON pa.serie_item_id = si.id
                          WHERE pa.paiement_id = :paiement_id
                          FOR UPDATE";
            
            $stmtPlaques = $this->pdo->prepare($sqlPlaques);
            $stmtPlaques->execute([':paiement_id' => $paiementId]);
            $plaques = $stmtPlaques->fetchAll(PDO::FETCH_ASSOC);

            if (empty($plaques)) {
                $this->rollbackSafe();
                return [
                    "status" => "error",
                    "message" => "Aucune plaque trouvée pour cette commande"
                ];
            }

            // 3. Restaurer les plaques
            foreach ($plaques as $plaque) {
                if ($plaque['serie_item_id']) {
                    $sqlUpdateSerie = "UPDATE serie_items 
                                      SET statut = '0' 
                                      WHERE id = :serie_item_id";
                    
                    $stmtUpdateSerie = $this->pdo->prepare($sqlUpdateSerie);
                    $stmtUpdateSerie->execute([
                        ':serie_item_id' => $plaque['serie_item_id']
                    ]);
                }
            }

            $this->enregistrerNotificationTransaction(
                'suppression_commande',
                'Commande supprimée',
                "Commande #$paiementId supprimée pour {$commande['nom']} {$commande['prenom']}",
                $commande['nif'],
                null,
                $paiementId
            );

            // 4. Supprimer les notifications liées à ce paiement (AJOUTÉ)
            $sqlDeleteNotifications = "DELETE FROM notifications 
                                     WHERE id_paiement = :paiement_id";
            $stmtDeleteNotifications = $this->pdo->prepare($sqlDeleteNotifications);
            $stmtDeleteNotifications->execute([':paiement_id' => $paiementId]);

            // 5. Supprimer les répartitions
            $sqlDeleteRepartition = "DELETE FROM repartition_paiements_immatriculation 
                                    WHERE id_paiement_immatriculation = :paiement_id";
            $stmtDeleteRepartition = $this->pdo->prepare($sqlDeleteRepartition);
            $stmtDeleteRepartition->execute([':paiement_id' => $paiementId]);

            // 6. Supprimer les plaques attribuées
            $sqlDeletePlaques = "DELETE FROM plaques_attribuees 
                                WHERE paiement_id = :paiement_id";
            $stmtDeletePlaques = $this->pdo->prepare($sqlDeletePlaques);
            $stmtDeletePlaques->execute([':paiement_id' => $paiementId]);

            // 7. Supprimer le paiement
            $sqlDeletePaiement = "DELETE FROM paiements_immatriculation 
                                 WHERE id = :paiement_id";
            $stmtDeletePaiement = $this->pdo->prepare($sqlDeletePaiement);
            $stmtDeletePaiement->execute([':paiement_id' => $paiementId]);

            // 8. Log d'audit et notification DANS la transaction
            $this->logAuditTransaction(
                $utilisateurId,
                $_SESSION['user_type'] ?? 'system',
                "Suppression commande #$paiementId - Client: {$commande['nom']} {$commande['prenom']}"
            );

            // ============================================================
            // COMMIT DE LA TRANSACTION
            // ============================================================
            $this->commitSafe();

            return [
                "status" => "success",
                "message" => "Commande supprimée avec succès",
                "data" => [
                    "paiement_id" => $paiementId,
                    "particulier" => [
                        "nom" => $commande['nom'],
                        "prenom" => $commande['prenom'],
                        "telephone" => $commande['telephone']
                    ],
                    "montant_supprime" => $commande['montant'],
                    "plaques_restaurees" => count($plaques),
                    "raison_suppression" => $raisonSuppression
                ]
            ];

        } catch (PDOException $e) {
            $this->rollbackSafe();
            error_log("Erreur lors de la suppression de la commande: " . $e->getMessage());
            return [
                "status" => "error", 
                "message" => "Erreur système lors de la suppression: " . $e->getMessage()
            ];
        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("Erreur lors de la suppression de la commande: " . $e->getMessage());
            return [
                "status" => "error", 
                "message" => $e->getMessage()
            ];
        }
    }

    public function __destruct()
    {
        if ($this->transactionActive) {
            error_log("ATTENTION: Transaction toujours active à la destruction de l'objet ClientSimple");
            $this->rollbackSafe();
        }
    }
}
?>