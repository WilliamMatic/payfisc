<?php
require_once 'Connexion.php';

/**
 * Classe Immatriculation - Gestion complète de l'immatriculation des plaques
 */
class Immatriculation extends Connexion
{
    private $transactionActive = false;

    /**
     * Vérifie si un particulier existe par téléphone
     */
    public function verifierParticulierParTelephone($telephone)
    {
        try {
            if (empty($telephone) || strlen($telephone) < 8) {
                return [
                    "status" => "success",
                    "message" => "Téléphone non renseigné ou invalide, vérification ignorée",
                    "data" => null
                ];
            }

            $sql = "SELECT 
                    p.id, p.nom, p.prenom, p.telephone, p.email, p.rue as adresse, p.nif,
                    p.reduction_type, p.reduction_valeur, p.reduction_montant_max,
                    DATE_FORMAT(p.date_creation, '%d/%m/%Y') as date_creation
                    FROM particuliers p
                    WHERE p.telephone = :telephone
                    AND p.actif = 1
                    ORDER BY p.date_modification DESC
                    LIMIT 1";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':telephone' => $telephone]);
            $particulier = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($particulier) {
                return [
                    "status" => "success",
                    "data" => $particulier
                ];
            } else {
                return [
                    "status" => "success",
                    "data" => null,
                    "message" => "Aucun particulier trouvé avec ce numéro de téléphone"
                ];
            }

        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du particulier: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

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
     * Récupère la province_id d'un utilisateur via son site
     */
    private function getProvinceIdByUtilisateur($utilisateurId)
    {
        try {
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
        } catch (PDOException $e) {
            error_log("Erreur récupération province: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Récupère un numéro de plaque disponible SANS réserver (pour l'affichage seulement)
     * avec filtrage par province de l'utilisateur
     */
    public function getNumeroPlaqueDisponibleSansReservation($utilisateurId)
    {
        try {
            $provinceId = $this->getProvinceIdByUtilisateur($utilisateurId);

            $sqlSerieItem = "SELECT si.id, si.serie_id, si.value, s.nom_serie 
                            FROM serie_items si 
                            JOIN series s ON si.serie_id = s.id 
                            WHERE si.statut = '0' 
                            AND s.province_id = :province_id
                            ORDER BY si.id ASC 
                            LIMIT 1";

            $stmtSerieItem = $this->pdo->prepare($sqlSerieItem);
            $stmtSerieItem->execute([':province_id' => $provinceId]);
            $serieItem = $stmtSerieItem->fetch(PDO::FETCH_ASSOC);

            if (!$serieItem) {
                return ["status" => "error", "message" => "Aucun numéro de plaque disponible pour votre province."];
            }

            $numeroPlaque = $serieItem['nom_serie'] . str_pad($serieItem['value'], 3, '0', STR_PAD_LEFT);

            return [
                "status" => "success", 
                "data" => [
                    "numeroPlaque" => $numeroPlaque,
                    "serie_id" => $serieItem['serie_id'],
                    "serie_item_id" => $serieItem['id']
                ]
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération du numéro de plaque: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        } catch (Exception $e) {
            error_log("Erreur lors de la récupération du numéro de plaque: " . $e->getMessage());
            return ["status" => "error", "message" => $e->getMessage()];
        }
    }

    /**
     * Marque un numéro de plaque comme utilisé (appelé lors du paiement confirmé)
     */
    private function marquerPlaqueUtilisee($serieItemId)
    {
        try {
            $sqlUpdate = "UPDATE serie_items SET statut = '1' WHERE id = :id AND statut = '0'";
            $stmtUpdate = $this->pdo->prepare($sqlUpdate);
            $stmtUpdate->execute([':id' => $serieItemId]);

            if ($stmtUpdate->rowCount() === 0) {
                throw new Exception("La plaque n'est plus disponible ou a déjà été utilisée");
            }

            return true;
        } catch (PDOException $e) {
            error_log("Erreur lors du marquage de la plaque comme utilisée: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Traite une demande d'immatriculation complète
     */
    public function traiterImmatriculation($data)
    {
        $requiredFields = ['impot_id', 'utilisateur_id', 'site_id', 'nom', 'prenom', 'adresse', 'type_engin', 'marque'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                return ["status" => "error", "message" => "Le champ $field est obligatoire."];
            }
        }

        try {
            $this->beginTransactionSafe();

            // Étape 0 : Mettre à jour les informations du particulier (y compris réduction)
            if (!empty($data['telephone']) && strlen($data['telephone']) > 8) {
                $this->mettreAJourParticulierAvecReduction($data);
            }

            // Étape 1 : Gérer la plaque
            $serieItemId = isset($data['serie_item_id']) ? intval($data['serie_item_id']) : null;
            $numeroPlaque = null;
            $serieId = null;

            if ($serieItemId) {
                $plaqueData = $this->getAndReservePlaque($serieItemId);
                if (!is_array($plaqueData) || ($plaqueData['status'] ?? '') === 'error') {
                    $this->rollbackSafe();
                    return is_array($plaqueData) ? $plaqueData : ["status" => "error", "message" => "Impossible de récupérer/réserver la plaque."];
                }
                $numeroPlaque = $plaqueData['data']['numero_plaque'] ?? null;
                $serieId = $plaqueData['data']['serie_id'] ?? null;
            } else {
                $numeroPlaqueData = $this->getNumeroPlaqueDisponibleAvecReservation($data['utilisateur_id']);
                if (!is_array($numeroPlaqueData) || ($numeroPlaqueData['status'] ?? '') === 'error') {
                    $this->rollbackSafe();
                    return is_array($numeroPlaqueData) ? $numeroPlaqueData : ["status" => "error", "message" => "Aucune plaque disponible."];
                }
                $numeroPlaque = $numeroPlaqueData['data']['numero_plaque'] ?? null;
                $serieId = $numeroPlaqueData['data']['serie_id'] ?? null;
                $serieItemId = $numeroPlaqueData['data']['serie_item_id'] ?? $serieItemId;
            }

            if (empty($numeroPlaque) || empty($serieId) || empty($serieItemId)) {
                $this->rollbackSafe();
                return ["status" => "error", "message" => "Erreur: numéro de plaque ou série manquante après réservation."];
            }

            // Étape 2 : Gérer le particulier
            $particulierData = $this->creerOuRecupererParticulier($data);
            if (!is_array($particulierData) || empty($particulierData['id'])) {
                $this->rollbackSafe();
                return ["status" => "error", "message" => "Erreur lors de la création/lecture du particulier."];
            }

            $particulierId = (int)$particulierData['id'];
            $reductionType = $particulierData['reduction_type'] ?? null;
            $reductionValeur = $particulierData['reduction_valeur'] ?? null;

            // Étape 3 : Créer le modèle si nécessaire
            if (!empty($data['modele']) && !empty($data['marque'])) {
                $modeleData = $this->verifierEtCreerModele($data['marque'], $data['modele']);
                if (($modeleData['status'] ?? '') === 'error') {
                    error_log("Erreur lors de la création du modèle: " . ($modeleData['message'] ?? ''));
                }
            }

            // Étape 4 : Créer la puissance si nécessaire
            if (!empty($data['puissance_fiscal']) && !empty($data['type_engin'])) {
                $puissanceData = $this->verifierEtCreerPuissance($data['type_engin'], $data['puissance_fiscal']);
                if (($puissanceData['status'] ?? '') === 'error') {
                    error_log("Erreur lors de la création de la puissance: " . ($puissanceData['message'] ?? ''));
                }
            }

            // Étape 5 : Créer l'engin
            $enginId = $this->creerEngin($data, $particulierId, $serieId, $serieItemId, $numeroPlaque);
            if (empty($enginId)) {
                $this->rollbackSafe();
                return ["status" => "error", "message" => "Erreur lors de la création de l'engin."];
            }
            $enginId = (int)$enginId;

            // Étape 6 : Calculer le montant avec réduction
            $montantInitial = isset($data['montant']) ? (float)$data['montant'] : 32.0;
            $montantAvecReduction = $this->appliquerReduction($montantInitial, $reductionType, $reductionValeur);
            if (!is_numeric($montantAvecReduction)) {
                $montantAvecReduction = $montantInitial;
            }
            $montantAvecReduction = (float)$montantInitial;

            // Étape 7 : Enregistrer le paiement
            $paiementData = $this->enregistrerPaiement($data, $enginId, $particulierId, $montantAvecReduction);
            if (!is_array($paiementData) || empty($paiementData['id'])) {
                $this->rollbackSafe();
                return ["status" => "error", "message" => "Erreur lors de l'enregistrement du paiement."];
            }
            $paiementId = (int)$paiementData['id'];
            $montantFinal = isset($paiementData['montant_final']) ? (float)$paiementData['montant_final'] : $montantAvecReduction;

            // Étape 8 : Enregistrer dans carte_reprint
            $this->enregistrerDansCarteReprint($data, $particulierId, $enginId, $paiementId, $numeroPlaque);

            // Étape 9 : Calculer la répartition
            $resultRepartition = $this->calculerRepartitionBeneficiaires($paiementId, $montantFinal, $data['impot_id']);
            if (!is_array($resultRepartition)) {
                $resultRepartition = ['status' => 'error', 'message' => 'Répartition non disponible', 'data' => null];
            }

            // Étape 10 : Commit de la transaction
            $this->commitSafe();

            // Étape 11 : Générer la facture
            $factureData = $this->genererFacture($enginId, $particulierId, $paiementId);
            if (!is_array($factureData)) {
                $factureData = [];
            }

            // Étape 12 : Logs et notifications
            try {
                $this->logAudit("Immatriculation créée - Plaque: $numeroPlaque - Particulier: {$data['nom']} {$data['prenom']} - Montant: $montantFinal");

                $this->enregistrerNotification(
                    'immatriculation_nouvelle',
                    'Nouvelle immatriculation',
                    "Nouvelle immatriculation - Plaque: $numeroPlaque - Montant: $montantFinal",
                    $this->getNIFByParticulierId($particulierId),
                    null,
                    $paiementId
                );
            } catch (Exception $e) {
                error_log("Erreur lors du logging/notification: " . $e->getMessage());
            }

            // Étape 13 : Préparer la réponse
            $responseData = array_merge((array)$factureData, [
                'reduction_appliquee' => [
                    'type' => $reductionType,
                    'valeur' => $reductionValeur,
                    'montant_initial' => $montantInitial,
                    'montant_final' => $montantFinal
                ],
                'repartition' => ($resultRepartition['status'] ?? '') === 'success' ? ($resultRepartition['data'] ?? null) : null,
                'paiement_id' => $paiementId,
                'serie_id' => $serieId,
                'serie_item_id' => $serieItemId,
                'numero_plaque' => $numeroPlaque,
                'particulier_id' => $particulierId,
                'engin_id' => $enginId
            ]);

            return [
                "status" => "success",
                "message" => "Immatriculation traitée avec succès",
                "data" => $responseData
            ];
        } catch (PDOException $e) {
            try {
                $this->rollbackSafe();
            } catch (Exception $ex) {
                error_log("Rollback failed: " . $ex->getMessage());
            }
            error_log("Erreur lors du traitement de l'immatriculation (PDO): " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système (base de données): " . $e->getMessage()];
        } catch (Exception $e) {
            try {
                $this->rollbackSafe();
            } catch (Exception $ex) {
                error_log("Rollback failed: " . $ex->getMessage());
            }
            error_log("Erreur inattendue lors du traitement de l'immatriculation: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur inattendue: " . $e->getMessage()];
        }
    }

    /**
     * Enregistre les données dans la table carte_reprint
     */
    private function enregistrerDansCarteReprint($data, $particulierId, $enginId, $paiementId, $numeroPlaque)
    {
        try {
            // Récupérer les informations du particulier
            $sqlParticulier = "SELECT nom, prenom, rue, nif FROM particuliers WHERE id = :id";
            $stmtParticulier = $this->pdo->prepare($sqlParticulier);
            $stmtParticulier->execute([':id' => $particulierId]);
            $particulier = $stmtParticulier->fetch(PDO::FETCH_ASSOC);

            if (!$particulier) {
                throw new Exception("Particulier non trouvé pour l'enregistrement dans carte_reprint");
            }

            // Récupérer les informations de l'engin
            $sqlEngin = "SELECT marque, usage_engin, numero_chassis, numero_moteur, 
                        annee_fabrication, annee_circulation, couleur, puissance_fiscal 
                        FROM engins WHERE id = :id";
            $stmtEngin = $this->pdo->prepare($sqlEngin);
            $stmtEngin->execute([':id' => $enginId]);
            $engin = $stmtEngin->fetch(PDO::FETCH_ASSOC);

            if (!$engin) {
                throw new Exception("Engin non trouvé pour l'enregistrement dans carte_reprint");
            }

            // --- Récupérer site_affecte_id depuis la table utilisateurs à partir de utilisateur_id ---
            $siteId = null;
            if (!empty($data['utilisateur_id'])) {
                $sqlUser = "SELECT site_affecte_id FROM utilisateurs WHERE id = :utilisateur_id LIMIT 1";
                $stmtUser = $this->pdo->prepare($sqlUser);
                $stmtUser->execute([':utilisateur_id' => $data['utilisateur_id']]);
                $siteAff = $stmtUser->fetch(PDO::FETCH_ASSOC);

                if ($siteAff && isset($siteAff['site_affecte_id'])) {
                    // s'assurer que la valeur est bien un int ou null
                    $siteId = (int) $siteAff['site_affecte_id'];
                } else {
                    // fallback si pas trouvé : utiliser site_id passé dans $data (si fourni) ou null
                    $siteId = isset($data['site_id']) ? (int) $data['site_id'] : null;
                }
            } else {
                // pas d'utilisateur_id fourni : fallback sur site_id dans $data ou null
                $siteId = isset($data['site_id']) ? (int) $data['site_id'] : null;
            }

            // Insérer dans carte_reprint
            $sql = "INSERT INTO carte_reprint 
                   (nom_proprietaire, adresse_proprietaire, nif_proprietaire, 
                    annee_mise_circulation, numero_plaque, marque_vehicule, 
                    usage_vehicule, numero_chassis, numero_moteur, 
                    annee_fabrication, couleur_vehicule, puissance_vehicule,
                    utilisateur_id, site_id, id_paiement, status) 
                   VALUES 
                   (:nom_proprietaire, :adresse_proprietaire, :nif_proprietaire,
                    :annee_mise_circulation, :numero_plaque, :marque_vehicule,
                    :usage_vehicule, :numero_chassis, :numero_moteur,
                    :annee_fabrication, :couleur_vehicule, :puissance_vehicule,
                    :utilisateur_id, :site_id, :id_paiement, 1)";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom_proprietaire' => $particulier['nom'] . ' ' . $particulier['prenom'],
                ':adresse_proprietaire' => $particulier['rue'] ?? '',
                ':nif_proprietaire' => $particulier['nif'] ?? '',
                ':annee_mise_circulation' => $engin['annee_circulation'] ?? '',
                ':numero_plaque' => $numeroPlaque,
                ':marque_vehicule' => $engin['marque'] ?? '',
                ':usage_vehicule' => $engin['usage_engin'] ?? '',
                ':numero_chassis' => $engin['numero_chassis'] ?? '',
                ':numero_moteur' => $engin['numero_moteur'] ?? '',
                ':annee_fabrication' => $engin['annee_fabrication'] ?? '',
                ':couleur_vehicule' => $engin['couleur'] ?? '',
                ':puissance_vehicule' => $engin['puissance_fiscal'] ?? '',
                ':utilisateur_id' => $data['utilisateur_id'],
                ':site_id' => $siteId,
                ':id_paiement' => $paiementId
            ]);

            $this->logAudit("Enregistrement dans carte_reprint - Plaque: $numeroPlaque - Paiement ID: $paiementId");

            return true;
        } catch (PDOException $e) {
            error_log("Erreur lors de l'enregistrement dans carte_reprint: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Met à jour les informations d'un particulier existant
     */
    private function mettreAJourParticulierAvecReduction($data)
    {
        try {

            $sqlCheck = "SELECT id FROM particuliers WHERE telephone = :telephone";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([':telephone' => $data['telephone']]);
            $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                $sqlUpdate = "UPDATE particuliers SET 
                            nom = :nom,
                            prenom = :prenom,
                            email = :email,
                            rue = :adresse,
                            nif = :nif,
                            reduction_type = :reduction_type,
                            reduction_valeur = :reduction_valeur,
                            date_modification = NOW()
                            WHERE id = :id";

                $stmtUpdate = $this->pdo->prepare($sqlUpdate);
                $stmtUpdate->execute([
                    ':id' => $existing['id'],
                    ':nom' => $data['nom'] ?? '',
                    ':prenom' => $data['prenom'] ?? '',
                    ':email' => $data['email'] ?? '',
                    ':adresse' => $data['adresse'] ?? '',
                    ':nif' => $data['nif'] ?? '-',
                    ':reduction_type' => $data['reduction_type'] ?? null,
                    ':reduction_valeur' => $data['reduction_valeur'] ?? 0
                ]);

                $this->logAudit("Mise à jour du particulier ID {$existing['id']} avec réduction: " . ($data['reduction_type'] ?? 'aucune'));
            }
        } catch (PDOException $e) {
            error_log("Erreur lors de la mise à jour du particulier: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie et crée un modèle s'il n'existe pas
     */
    private function verifierEtCreerModele($marqueLibelle, $modeleLibelle)
    {
        try {
            $sqlMarque = "SELECT id FROM marques_engins WHERE libelle = :libelle AND actif = 1";
            $stmtMarque = $this->pdo->prepare($sqlMarque);
            $stmtMarque->execute([':libelle' => $marqueLibelle]);
            $marque = $stmtMarque->fetch(PDO::FETCH_ASSOC);

            if (!$marque) {
                return ["status" => "error", "message" => "Marque non trouvée"];
            }

            $marqueId = $marque['id'];

            $sqlCheck = "SELECT id FROM modeles_engins WHERE libelle = :libelle AND marque_engin_id = :marque_id";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([
                ':libelle' => $modeleLibelle,
                ':marque_id' => $marqueId
            ]);

            if ($stmtCheck->fetch()) {
                return ["status" => "success", "message" => "Modèle existe déjà"];
            }

            $sqlInsert = "INSERT INTO modeles_engins (libelle, marque_engin_id) VALUES (:libelle, :marque_id)";
            $stmtInsert = $this->pdo->prepare($sqlInsert);
            $stmtInsert->execute([
                ':libelle' => $modeleLibelle,
                ':marque_id' => $marqueId
            ]);

            $this->logAudit("Création automatique du modèle: $modeleLibelle pour marque: $marqueLibelle");

            return ["status" => "success", "message" => "Modèle créé avec succès"];

        } catch (PDOException $e) {
            error_log("Erreur lors de la création du modèle: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Vérifie et crée une puissance fiscale si elle n'existe pas
     */
    private function verifierEtCreerPuissance($typeEnginLibelle, $puissanceLibelle)
    {
        try {
            $sqlType = "SELECT id FROM type_engins WHERE libelle = :libelle AND actif = 1";
            $stmtType = $this->pdo->prepare($sqlType);
            $stmtType->execute([':libelle' => $typeEnginLibelle]);
            $typeEngin = $stmtType->fetch(PDO::FETCH_ASSOC);

            if (!$typeEngin) {
                return ["status" => "error", "message" => "Type d'engin non trouvé"];
            }

            $typeId = $typeEngin['id'];

            preg_match('/(\d+)/', $puissanceLibelle, $matches);
            $valeur = isset($matches[1]) ? (float)$matches[1] : 0;

            if ($valeur <= 0) {
                return ["status" => "error", "message" => "Valeur de puissance invalide"];
            }

            $sqlCheck = "SELECT id FROM puissances_fiscales WHERE libelle = :libelle AND type_engin_id = :type_id";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([
                ':libelle' => $puissanceLibelle,
                ':type_id' => $typeId
            ]);

            if ($stmtCheck->fetch()) {
                return ["status" => "success", "message" => "Puissance existe déjà"];
            }

            $sqlInsert = "INSERT INTO puissances_fiscales (libelle, valeur, type_engin_id) VALUES (:libelle, :valeur, :type_id)";
            $stmtInsert = $this->pdo->prepare($sqlInsert);
            $stmtInsert->execute([
                ':libelle' => $puissanceLibelle,
                ':valeur' => $valeur,
                ':type_id' => $typeId
            ]);

            $this->logAudit("Création automatique de la puissance: $puissanceLibelle pour type: $typeEnginLibelle");

            return ["status" => "success", "message" => "Puissance créée avec succès"];

        } catch (PDOException $e) {
            error_log("Erreur lors de la création de la puissance: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère et réserve une plaque spécifique par son ID
     */
    private function getAndReservePlaque($serieItemId)
    {
        try {
            $sqlSerieItem = "SELECT si.id, si.serie_id, si.value, s.nom_serie 
                            FROM serie_items si 
                            JOIN series s ON si.serie_id = s.id 
                            WHERE si.id = :id AND si.statut = '0'";

            $stmtSerieItem = $this->pdo->prepare($sqlSerieItem);
            $stmtSerieItem->execute([':id' => $serieItemId]);
            $serieItem = $stmtSerieItem->fetch(PDO::FETCH_ASSOC);

            if (!$serieItem) {
                return ["status" => "error", "message" => "La plaque n'est plus disponible."];
            }

            $this->marquerPlaqueUtilisee($serieItemId);

            $numeroPlaque = $serieItem['nom_serie'] . str_pad($serieItem['value'], 3, '0', STR_PAD_LEFT);

            return [
                "status" => "success", 
                "data" => [
                    "numero_plaque" => $numeroPlaque,
                    "serie_id" => $serieItem['serie_id'],
                    "serie_item_id" => $serieItem['id']
                ]
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la réservation de la plaque: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère un numéro de plaque disponible avec reservation immédiate
     */
    private function getNumeroPlaqueDisponibleAvecReservation($utilisateurId)
    {
        try {
            // Ne pas ouvrir de nouvelle transaction si déjà dans une (appelé depuis traiterImmatriculation)
            $provinceId = $this->getProvinceIdByUtilisateur($utilisateurId);

            $sqlSerieItem = "SELECT si.id, si.serie_id, si.value, s.nom_serie 
                            FROM serie_items si 
                            JOIN series s ON si.serie_id = s.id 
                            WHERE si.statut = '0' 
                            AND s.province_id = :province_id
                            ORDER BY si.id ASC 
                            LIMIT 1 
                            FOR UPDATE";

            $stmtSerieItem = $this->pdo->prepare($sqlSerieItem);
            $stmtSerieItem->execute([':province_id' => $provinceId]);
            $serieItem = $stmtSerieItem->fetch(PDO::FETCH_ASSOC);

            if (!$serieItem) {
                return ["status" => "error", "message" => "Aucun numéro de plaque disponible pour votre province."];
            }

            $sqlUpdate = "UPDATE serie_items SET statut = '1' WHERE id = :id";
            $stmtUpdate = $this->pdo->prepare($sqlUpdate);
            $stmtUpdate->execute([':id' => $serieItem['id']]);

            $numeroPlaque = $serieItem['nom_serie'] . str_pad($serieItem['value'], 3, '0', STR_PAD_LEFT);

            return [
                "status" => "success", 
                "data" => [
                    "numero_plaque" => $numeroPlaque,
                    "serie_id" => $serieItem['serie_id'],
                    "serie_item_id" => $serieItem['id']
                ]
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération du numéro de plaque: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        } catch (Exception $e) {
            error_log("Erreur lors de la récupération du numéro de plaque: " . $e->getMessage());
            return ["status" => "error", "message" => $e->getMessage()];
        }
    }

    /**
     * Crée ou récupère un particulier avec ses réductions
     */
    private function creerOuRecupererParticulier($data)
    {
        try {

            // --- Récupérer site_affecte_id depuis la table utilisateurs à partir de utilisateur_id ---
            $siteId = null;
            if (!empty($data['utilisateur_id'])) {
                $sqlUser = "SELECT site_affecte_id FROM utilisateurs WHERE id = :utilisateur_id LIMIT 1";
                $stmtUser = $this->pdo->prepare($sqlUser);
                $stmtUser->execute([':utilisateur_id' => $data['utilisateur_id']]);
                $siteAff = $stmtUser->fetch(PDO::FETCH_ASSOC);

                if ($siteAff && isset($siteAff['site_affecte_id'])) {
                    // s'assurer que la valeur est bien un int ou null
                    $siteId = (int) $siteAff['site_affecte_id'];
                } else {
                    // fallback si pas trouvé : utiliser site_id passé dans $data (si fourni) ou null
                    $siteId = isset($data['site_id']) ? (int) $data['site_id'] : null;
                }
            } else {
                // pas d'utilisateur_id fourni : fallback sur site_id dans $data ou null
                $siteId = isset($data['site_id']) ? (int) $data['site_id'] : null;
            }

            // --- Vérifier si un particulier existe déjà par téléphone (si téléphone valable) ---
            if (!empty($data['telephone']) && strlen($data['telephone']) > 8) {
                $sqlCheck = "SELECT id, reduction_type, reduction_valeur FROM particuliers WHERE telephone = :telephone";
                $stmtCheck = $this->pdo->prepare($sqlCheck);
                $stmtCheck->execute([':telephone' => $data['telephone']]);
                $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

                if ($existing) {
                    $sqlUpdate = "UPDATE particuliers 
                                  SET nom = :nom,
                                      prenom = :prenom,
                                      telephone = :telephone,
                                      rue = :adresse,
                                      site = :site,
                                      date_modification = NOW()
                                  WHERE id = :id";

                    $stmtUpdate = $this->pdo->prepare($sqlUpdate);
                    $stmtUpdate->execute([
                        ':nom' => $data['nom'],
                        ':prenom' => $data['prenom'],
                        ':telephone' => $data['telephone'],
                        ':adresse' => $data['adresse'] ?? '',
                        ':site' => $siteId ?? 7,
                        ':id' => $existing['id']
                    ]);

                    return [
                        'id' => $existing['id'],
                        'reduction_type' => $existing['reduction_type'],
                        'reduction_valeur' => $existing['reduction_valeur']
                    ];
                }
            }

            // --- Préparer les valeurs pour l'insertion ---
            $telephone = !empty($data['telephone']) && strlen($data['telephone']) > 8 
                ? $data['telephone'] 
                : '-';

            $sqlInsert = "INSERT INTO particuliers 
                         (nom, prenom, telephone, email, rue, utilisateur, site, nif) 
                         VALUES (:nom, :prenom, :telephone, :email, :adresse, :utilisateur_id, :site_id, :nif)";

            $stmtInsert = $this->pdo->prepare($sqlInsert);
            $nif = null;

            $stmtInsert->execute([
                ':nom' => $data['nom'],
                ':prenom' => $data['prenom'],
                ':telephone' => $telephone,
                ':email' => $data['email'] ?? '',
                ':adresse' => $data['adresse'] ?? '',
                ':utilisateur_id' => $data['utilisateur_id'] ?? null,
                ':site_id' => $siteId,
                ':nif' => $nif
            ]);

            $particulierId = $this->pdo->lastInsertId();

            return [
                'id' => $particulierId,
                'reduction_type' => null,
                'reduction_valeur' => 0
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la création du particulier: " . $e->getMessage());
            throw $e;
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
     * Crée un nouvel engin
     */
    private function creerEngin($data, $particulierId, $serieId, $serieItemId, $numeroPlaque)
    {
        try {

            // --- Récupérer site_affecte_id depuis la table utilisateurs à partir de utilisateur_id ---
            $siteId = null;
            if (!empty($data['utilisateur_id'])) {
                $sqlUser = "SELECT site_affecte_id FROM utilisateurs WHERE id = :utilisateur_id LIMIT 1";
                $stmtUser = $this->pdo->prepare($sqlUser);
                $stmtUser->execute([':utilisateur_id' => $data['utilisateur_id']]);
                $siteAff = $stmtUser->fetch(PDO::FETCH_ASSOC);

                if ($siteAff && isset($siteAff['site_affecte_id'])) {
                    // s'assurer que la valeur est bien un int ou null
                    $siteId = (int) $siteAff['site_affecte_id'];
                } else {
                    // fallback si pas trouvé : utiliser site_id passé dans $data (si fourni) ou null
                    $siteId = isset($data['site_id']) ? (int) $data['site_id'] : null;
                }
            } else {
                // pas d'utilisateur_id fourni : fallback sur site_id dans $data ou null
                $siteId = isset($data['site_id']) ? (int) $data['site_id'] : null;
            }

            if (!empty($data['numero_chassis'])) {
                $sqlCheck = "SELECT id FROM engins WHERE numero_chassis = :numero_chassis";
                $stmtCheck = $this->pdo->prepare($sqlCheck);
                $stmtCheck->execute([':numero_chassis' => $data['numero_chassis']]);
                $existingEngin = $stmtCheck->fetch(PDO::FETCH_ASSOC);

                if ($existingEngin) {
                    $sqlUpdate = "UPDATE engins SET
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
                        numero_chassis = :numero_chassis,
                        numero_moteur = :numero_moteur,
                        impot_id = :impot_id,
                        utilisateur_id = :utilisateur_id,
                        site_id = :site_id,
                        date_modification = NOW()
                    WHERE id = :id";

                    $stmtUpdate = $this->pdo->prepare($sqlUpdate);
                    $stmtUpdate->execute([
                        ':particulier_id' => $particulierId,
                        ':serie_id' => $serieId,
                        ':serie_item_id' => $serieItemId,
                        ':numero_plaque' => $numeroPlaque,
                        ':type_engin' => $data['type_engin'],
                        ':marque' => $data['marque'] . ' ' . $data['modele'],
                        ':energie' => $data['energie'] ?? '',
                        ':annee_fabrication' => $data['annee_fabrication'] ?? null,
                        ':annee_circulation' => $data['annee_circulation'] ?? null,
                        ':couleur' => $data['couleur'] ?? '',
                        ':puissance_fiscal' => $data['puissance_fiscal'] ?? '',
                        ':usage_engin' => $data['usage'] ?? '',
                        ':numero_chassis' => $data['numero_chassis'] ?? '',
                        ':numero_moteur' => $data['numero_moteur'] ?? '',
                        ':impot_id' => $data['impot_id'],
                        ':utilisateur_id' => $data['utilisateur_id'],
                        ':site_id' => $siteId,
                        ':id' => $existingEngin['id']
                    ]);

                    return $existingEngin['id'];
                }
            }

            $sql = "INSERT INTO engins 
                    (particulier_id, serie_id, serie_item_id, numero_plaque, type_engin, marque, energie, 
                     annee_fabrication, annee_circulation, couleur, puissance_fiscal, usage_engin, 
                     numero_chassis, numero_moteur, impot_id, utilisateur_id, site_id) 
                    VALUES 
                    (:particulier_id, :serie_id, :serie_item_id, :numero_plaque, :type_engin, :marque, :energie,
                     :annee_fabrication, :annee_circulation, :couleur, :puissance_fiscal, :usage_engin,
                     :numero_chassis, :numero_moteur, :impot_id, :utilisateur_id, :site_id)";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':particulier_id' => $particulierId,
                ':serie_id' => $serieId,
                ':serie_item_id' => $serieItemId,
                ':numero_plaque' => $numeroPlaque,
                ':type_engin' => $data['type_engin'],
                ':marque' => $data['marque'] . ' ' . $data['modele'],
                ':energie' => $data['energie'] ?? '',
                ':annee_fabrication' => $data['annee_fabrication'] ?? null,
                ':annee_circulation' => $data['annee_circulation'] ?? null,
                ':couleur' => $data['couleur'] ?? '',
                ':puissance_fiscal' => $data['puissance_fiscal'] ?? '',
                ':usage_engin' => $data['usage'] ?? '',
                ':numero_chassis' => $data['numero_chassis'] ?? '',
                ':numero_moteur' => $data['numero_moteur'] ?? '',
                ':impot_id' => $data['impot_id'],
                ':utilisateur_id' => $data['utilisateur_id'],
                ':site_id' => $siteId
            ]);

            return $this->pdo->lastInsertId();
        } catch (PDOException $e) {
            error_log("Erreur lors de la création de l'engin: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Enregistre un paiement avec gestion de la réduction
     */
    private function enregistrerPaiement($data, $enginId, $particulierId, $montantFinal)
    {
        try {

            // --- Récupérer site_affecte_id depuis la table utilisateurs à partir de utilisateur_id ---
            $siteId = null;
            if (!empty($data['utilisateur_id'])) {
                $sqlUser = "SELECT site_affecte_id FROM utilisateurs WHERE id = :utilisateur_id LIMIT 1";
                $stmtUser = $this->pdo->prepare($sqlUser);
                $stmtUser->execute([':utilisateur_id' => $data['utilisateur_id']]);
                $siteAff = $stmtUser->fetch(PDO::FETCH_ASSOC);

                if ($siteAff && isset($siteAff['site_affecte_id'])) {
                    // s'assurer que la valeur est bien un int ou null
                    $siteId = (int) $siteAff['site_affecte_id'];
                } else {
                    // fallback si pas trouvé : utiliser site_id passé dans $data (si fourni) ou null
                    $siteId = isset($data['site_id']) ? (int) $data['site_id'] : null;
                }
            } else {
                // pas d'utilisateur_id fourni : fallback sur site_id dans $data ou null
                $siteId = isset($data['site_id']) ? (int) $data['site_id'] : null;
            }

            $sql = "INSERT INTO paiements_immatriculation 
                    (engin_id, particulier_id, montant, montant_initial, impot_id, mode_paiement, operateur, 
                     numero_transaction, numero_cheque, banque, utilisateur_id, site_id) 
                    VALUES 
                    (:engin_id, :particulier_id, :montant, :montant_initial, :impot_id, :mode_paiement, :operateur,
                     :numero_transaction, :numero_cheque, :banque, :utilisateur_id, :site_id)";

            $stmt = $this->pdo->prepare($sql);
            $montantInitial = $data['montant'] ?? 32;
            
            $stmt->execute([
                ':engin_id' => $enginId,
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
                ':site_id' => $siteId
            ]);

            $paiementId = $this->pdo->lastInsertId();

            return [
                'id' => $paiementId,
                'montant_final' => $montantFinal
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de l'enregistrement du paiement: " . $e->getMessage());
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
                throw new Exception("Aucun bénéficiaire trouvé pour cet impôt");
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
     * Génère les données de facture
     */
    private function genererFacture($enginId, $particulierId, $paiementId)
    {
        $sql = "SELECT 
                e.numero_plaque, e.type_engin, e.marque, e.energie, e.couleur, e.usage_engin as `usage`,
                p.nom, p.prenom, p.telephone, p.email, p.rue as adresse, p.reduction_type, p.reduction_valeur,
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

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Vérifie si un numéro de chassis existe déjà
     */
    public function verifierNumeroChassis($numeroChassis)
    {
        try {
            if (empty($numeroChassis)) {
                return ["status" => "success", "disponible" => true];
            }

            $sql = "SELECT id FROM engins WHERE numero_chassis = :numero_chassis";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':numero_chassis' => $numeroChassis]);

            if ($stmt->rowCount() > 0) {
                return ["status" => "success", "disponible" => false];
            }

            return ["status" => "success", "disponible" => true];

        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du numéro de chassis: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
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
     * Recherche des plaques par terme avec filtrage par province
     */
    public function rechercherPlaquesParTerme($searchTerm, $utilisateurId)
    {
        try {
            $provinceId = $this->getProvinceIdByUtilisateur($utilisateurId);

            $sql = "SELECT 
                    si.id as serie_item_id,
                    CONCAT(s.nom_serie, LPAD(si.value, 3, '0')) as numero_plaque,
                    si.statut,
                    s.nom_serie,
                    si.value
                    FROM serie_items si 
                    JOIN series s ON si.serie_id = s.id 
                    WHERE s.province_id = :province_id
                    AND (CONCAT(s.nom_serie, LPAD(si.value, 3, '0')) LIKE :search_term 
                         OR LPAD(si.value, 3, '0') LIKE :search_term)
                    ORDER BY 
                        CASE 
                            WHEN CONCAT(s.nom_serie, LPAD(si.value, 3, '0')) = :exact_term THEN 1
                            WHEN CONCAT(s.nom_serie, LPAD(si.value, 3, '0')) LIKE :start_term THEN 2
                            ELSE 3
                        END,
                    si.statut ASC,
                    si.id ASC
                    LIMIT 20";

            $stmt = $this->pdo->prepare($sql);
            $searchTermLike = '%' . $searchTerm . '%';
            $exactTerm = $searchTerm;
            $startTerm = $searchTerm . '%';
            
            $stmt->execute([
                ':province_id' => $provinceId,
                ':search_term' => $searchTermLike,
                ':exact_term' => $exactTerm,
                ':start_term' => $startTerm
            ]);

            $plaques = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success", 
                "data" => $plaques
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des plaques: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        } catch (Exception $e) {
            error_log("Erreur lors de la recherche des plaques: " . $e->getMessage());
            return ["status" => "error", "message" => $e->getMessage()];
        }
    }

    /**
     * Récupère le NIF d'un particulier par son ID
     */
    private function getNIFByParticulierId($particulierId)
    {
        try {
            $sql = "SELECT nif FROM particuliers WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $particulierId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return $result ? $result['nif'] : null;
        } catch (PDOException $e) {
            error_log("Erreur récupération NIF: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Annule complètement une immatriculation et restaure tous les états
     */
    public function annulerImmatriculation($paiementId, $utilisateurId, $raison = "Annulation par l'utilisateur")
    {
        try {
            $this->beginTransactionSafe();
            
            // 1. Récupérer toutes les informations nécessaires
            $sqlInfos = "SELECT 
                        pi.id as paiement_id,
                        pi.engin_id,
                        pi.particulier_id,
                        pi.montant,
                        pi.impot_id,
                        e.serie_item_id,
                        e.serie_id,
                        e.numero_plaque,
                        e.utilisateur_id as createur_engin,
                        e.site_id,
                        p.telephone,
                        p.nom,
                        p.prenom,
                        (SELECT COUNT(*) FROM engins WHERE particulier_id = p.id) as nb_engins_particulier
                        FROM paiements_immatriculation pi
                        JOIN engins e ON pi.engin_id = e.id
                        JOIN particuliers p ON pi.particulier_id = p.id
                        WHERE pi.id = :paiement_id AND pi.montant > 0
                        FOR UPDATE";
            
            $stmtInfos = $this->pdo->prepare($sqlInfos);
            $stmtInfos->execute([':paiement_id' => $paiementId]);
            $infos = $stmtInfos->fetch(PDO::FETCH_ASSOC);
            
            if (!$infos) {
                $this->rollbackSafe();
                return ["status" => "error", "message" => "Paiement d'immatriculation non trouvé"];
            }
            
            // Vérifier la date (max 24h pour annulation)
            // $sqlDate = "SELECT TIMESTAMPDIFF(HOUR, date_paiement, NOW()) as heures_ecoulees 
            //            FROM paiements_immatriculation 
            //            WHERE id = :paiement_id";
            // $stmtDate = $this->pdo->prepare($sqlDate);
            // $stmtDate->execute([':paiement_id' => $paiementId]);
            // $dateInfo = $stmtDate->fetch(PDO::FETCH_ASSOC);
            
            // if ($dateInfo && $dateInfo['heures_ecoulees'] > 24) {
            //     $this->rollbackSafe();
            //     return ["status" => "error", "message" => "L'annulation n'est possible que dans les 24 heures suivant l'immatriculation"];
            // }
            
            $serieItemId = $infos['serie_item_id'];
            $impotItemId = $infos['impot_id'];
            $enginId = $infos['engin_id'];
            $particulierId = $infos['particulier_id'];
            $numeroPlaque = $infos['numero_plaque'];
            
            // 2. Supprimer les répartitions de paiement
            $sqlDeleteRepartitions = "DELETE FROM repartition_paiements_immatriculation 
                                     WHERE id_paiement_immatriculation = :paiement_id";
            $stmtRepartitions = $this->pdo->prepare($sqlDeleteRepartitions);
            $stmtRepartitions->execute([':paiement_id' => $paiementId]);
            
            // 3. Supprimer le paiement
            $sqlDeletePaiement = "DELETE FROM paiements_immatriculation WHERE id = :paiement_id";
            $stmtPaiement = $this->pdo->prepare($sqlDeletePaiement);
            $stmtPaiement->execute([':paiement_id' => $paiementId]);
            
            if ($stmtPaiement->rowCount() === 0) {
                $this->rollbackSafe();
                return ["status" => "error", "message" => "Erreur lors de la suppression du paiement"];
            }
            
            // 4. Supprimer l'engin
            $sqlDeleteEngin = "DELETE FROM engins WHERE id = :engin_id";
            $stmtEngin = $this->pdo->prepare($sqlDeleteEngin);
            $stmtEngin->execute([':engin_id' => $enginId]);
            
            if ($stmtEngin->rowCount() === 0) {
                $this->rollbackSafe();
                return ["status" => "error", "message" => "Erreur lors de la suppression de l'engin"];
            }
            
            // 5. Supprimer de la table carte_reprint
            $sqlDeleteCarteReprint = "DELETE FROM carte_reprint WHERE id_paiement = :paiement_id";
            $stmtCarteReprint = $this->pdo->prepare($sqlDeleteCarteReprint);
            $stmtCarteReprint->execute([':paiement_id' => $paiementId]);
            
            // 6. Restaurer le statut de la plaque
            if ($serieItemId && $impotItemId != 12) {
                $sqlRestorePlaque = "UPDATE serie_items SET statut = '0' WHERE id = :serie_item_id AND statut = '1'";
                $stmtPlaque = $this->pdo->prepare($sqlRestorePlaque);
                $stmtPlaque->execute([':serie_item_id' => $serieItemId]);
                
                if ($stmtPlaque->rowCount() === 0) {
                    error_log("Attention: Impossible de restaurer le statut de la plaque ID: $serieItemId");
                }
            }
            
            // 7. Supprimer le particulier SI c'était son seul engin
            if ($infos['nb_engins_particulier'] <= 1) {
                $sqlCheckAutresPaiements = "SELECT COUNT(*) as nb_paiements 
                                           FROM paiements_immatriculation 
                                           WHERE particulier_id = :particulier_id";
                $stmtCheck = $this->pdo->prepare($sqlCheckAutresPaiements);
                $stmtCheck->execute([':particulier_id' => $particulierId]);
                $resultCheck = $stmtCheck->fetch(PDO::FETCH_ASSOC);
                
                if ($resultCheck && $resultCheck['nb_paiements'] == 0) {
                    $sqlDeleteParticulier = "DELETE FROM particuliers WHERE id = :particulier_id";
                    $stmtParticulier = $this->pdo->prepare($sqlDeleteParticulier);
                    $stmtParticulier->execute([':particulier_id' => $particulierId]);
                }
            }
            
            // 8. Valider la transaction
            $this->commitSafe();
            
            // 9. Loguer l'audit
            $this->logAudit("Immatriculation annulée - Paiement ID: $paiementId - Plaque: $numeroPlaque - Raison: $raison - Par utilisateur ID: $utilisateurId");
            
            // 10. Enregistrer une notification
            $this->enregistrerNotification(
                'immatriculation_annulee',
                'Immatriculation annulée',
                "Immatriculation annulée - Plaque: $numeroPlaque - Raison: $raison",
                $infos['telephone'],
                null,
                $paiementId
            );
            
            return [
                "status" => "success",
                "message" => "Immatriculation annulée avec succès",
                "data" => [
                    "paiement_id" => $paiementId,
                    "numero_plaque" => $numeroPlaque,
                    "montant_rembourse" => $infos['montant'],
                    "serie_item_id" => $serieItemId,
                    "raison" => $raison
                ]
            ];
            
        } catch (PDOException $e) {
            $this->rollbackSafe();
            error_log("Erreur lors de l'annulation de l'immatriculation: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système (base de données): " . $e->getMessage()];
        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("Erreur inattendue lors de l'annulation: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur inattendue: " . $e->getMessage()];
        }
    }

    /**
     * Recherche des couleurs par terme
     */
    public function rechercherCouleursParTerme($searchTerm)
    {
        try {
            $sql = "SELECT id, nom, code_hex 
                    FROM engin_couleurs 
                    WHERE actif = 1 
                    AND (nom LIKE :search_term OR code_hex LIKE :search_term)
                    ORDER BY 
                        CASE 
                            WHEN nom = :exact_term THEN 1
                            WHEN nom LIKE :start_term THEN 2
                            ELSE 3
                        END,
                    nom ASC
                    LIMIT 10";

            $stmt = $this->pdo->prepare($sql);
            $searchTermLike = '%' . $searchTerm . '%';
            $exactTerm = $searchTerm;
            $startTerm = $searchTerm . '%';
            
            $stmt->execute([
                ':search_term' => $searchTermLike,
                ':exact_term' => $exactTerm,
                ':start_term' => $startTerm
            ]);

            $couleurs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success", 
                "data" => $couleurs
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des couleurs: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Destructeur pour s'assurer que les transactions sont fermées
     */
    public function __destruct()
    {
        if ($this->transactionActive) {
            error_log("ATTENTION: Transaction toujours active à la destruction de l'objet Immatriculation");
            $this->rollbackSafe();
        }
    }
}
?>