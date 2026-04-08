<?php
require_once 'Connexion.php';

/**
 * Classe Transaction - Gestion complète des transactions d'immatriculation
 */
class Transaction extends Connexion
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
     * Vérifie la disponibilité d'une plaque
     */
    public function verifierPlaqueDisponible()
    {
        try {
            $sql = "SELECT si.id, si.serie_id, si.value, s.nom_serie 
                    FROM serie_items si 
                    INNER JOIN series s ON si.serie_id = s.id 
                    WHERE si.statut = '0' 
                    AND s.actif = 1 
                    ORDER BY si.id ASC 
                    LIMIT 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de la plaque: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Met à jour le statut d'une série item
     */
    public function mettreAJourStatutSerieItem($id, $statut)
    {
        try {
            $sql = "UPDATE serie_items SET statut = :statut WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':statut' => $statut, ':id' => $id]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Erreur lors de la mise à jour du statut: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie si un particulier existe
     */
    public function particulierExiste($telephone)
    {
        try {
            $sql = "SELECT id, nom, prenom, telephone, email, rue as adresse,
                    reduction_type, reduction_valeur, reduction_montant_max
                    FROM particuliers 
                    WHERE telephone = :telephone";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':telephone' => $telephone]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du particulier: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Crée un nouveau particulier
     */
    public function creerParticulier($data)
    {
        try {
            $sql = "INSERT INTO particuliers (nom, prenom, telephone, email, rue, nif, utilisateur, site) 
                    VALUES (:nom, :prenom, :telephone, :email, :adresse, :nif, :utilisateur_id, :site_id)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom' => $data['nom'],
                ':prenom' => $data['prenom'],
                ':telephone' => $data['telephone'],
                ':email' => $data['email'] ?? null,
                ':adresse' => $data['adresse'] ?? null,
                ':nif' => $this->genererNIF(),
                ':utilisateur_id' => $data['utilisateur_id'],
                ':site_id' => $data['site_id']
            ]);
            return $this->pdo->lastInsertId();
        } catch (PDOException $e) {
            error_log("Erreur lors de la création du particulier: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Génère un NIF unique
     */
    private function genererNIF()
    {
        return 'NIF' . date('YmdHis') . rand(100, 999);
    }

    /**
     * Vérifie les réductions pour un particulier
     */
    public function verifierReduction($particulierId)
    {
        try {
            $sql = "SELECT reduction_type, reduction_valeur, reduction_montant_max
                    FROM particuliers 
                    WHERE id = :particulier_id 
                    AND reduction_valeur > 0 
                    AND actif = 1 
                    LIMIT 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':particulier_id' => $particulierId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification des réductions: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Calcule le montant avec réduction
     */
    public function calculerMontant($montantInitial, $reduction)
    {
        if (!$reduction || $reduction['reduction_valeur'] <= 0) {
            return $montantInitial;
        }

        $reductionMontant = 0;

        if ($reduction['reduction_type'] === 'pourcentage') {
            // Calcul de la réduction en pourcentage
            $reductionMontant = $montantInitial * ($reduction['reduction_valeur'] / 100);
            
            // Application du montant maximum si défini
            if ($reduction['reduction_montant_max'] > 0) {
                $reductionMontant = min($reductionMontant, $reduction['reduction_montant_max']);
            }
        } else {
            // Réduction en montant fixe
            $reductionMontant = $reduction['reduction_valeur'];
            
            // Ne pas dépasser le montant initial
            $reductionMontant = min($reductionMontant, $montantInitial);
        }

        return max(0, $montantInitial - $reductionMontant);
    }

    /**
     * Crée un nouvel engin
     */
    public function creerEngin($data, $particulierId, $serieId, $serieItemId, $numeroPlaque, $utilisateurId, $siteId)
    {
        try {
            $impotId = $this->genererImpotId();

            $sql = "INSERT INTO engins (
                particulier_id, serie_id, serie_item_id, numero_plaque, type_engin, marque, 
                energie, annee_fabrication, annee_circulation, couleur, puissance_fiscal, 
                usage_engin, numero_chassis, numero_moteur, impot_id, utilisateur_id, site_id
            ) VALUES (
                :particulier_id, :serie_id, :serie_item_id, :numero_plaque, :type_engin, :marque,
                :energie, :annee_fabrication, :annee_circulation, :couleur, :puissance_fiscal,
                :usage_engin, :numero_chassis, :numero_moteur, :impot_id, :utilisateur_id, :site_id
            )";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':particulier_id' => $particulierId,
                ':serie_id' => $serieId,
                ':serie_item_id' => $serieItemId,
                ':numero_plaque' => $numeroPlaque,
                ':type_engin' => $data['typeEngin'],
                ':marque' => $data['marque'],
                ':energie' => $data['energie'],
                ':annee_fabrication' => $data['anneeFabrication'],
                ':annee_circulation' => $data['anneeCirculation'],
                ':couleur' => $data['couleur'],
                ':puissance_fiscal' => $data['puissanceFiscale'],
                ':usage_engin' => $data['usage'],
                ':numero_chassis' => $data['numeroChassis'],
                ':numero_moteur' => $data['numeroMoteur'],
                ':impot_id' => $impotId,
                ':utilisateur_id' => $utilisateurId,
                ':site_id' => $siteId
            ]);

            return [
                'enginId' => $this->pdo->lastInsertId(),
                'impotId' => $impotId
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la création de l'engin: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Génère un ID d'impôt unique
     */
    private function genererImpotId()
    {
        return 11; // À adapter selon votre logique métier
    }

    /**
     * Enregistre le paiement
     */
    public function enregistrerPaiement($data)
    {
        try {
            $sql = "INSERT INTO paiements_immatriculation (
                engin_id, particulier_id, montant, montant_initial, impot_id, mode_paiement,
                operateur, numero_transaction, numero_cheque, banque, statut,
                utilisateur_id, site_id, nombre_plaques, etat
            ) VALUES (
                :engin_id, :particulier_id, :montant, :montant_initial, :impot_id, :mode_paiement,
                :operateur, :numero_transaction, :numero_cheque, :banque, :statut,
                :utilisateur_id, :site_id, :nombre_plaques, :etat
            )";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':engin_id' => $data['engin_id'],
                ':particulier_id' => $data['particulier_id'],
                ':montant' => $data['montant'],
                ':montant_initial' => $data['montant_initial'],
                ':impot_id' => $data['impot_id'],
                ':mode_paiement' => $data['mode_paiement'],
                ':operateur' => $data['operateur'] ?? null,
                ':numero_transaction' => $data['numero_transaction'] ?? null,
                ':numero_cheque' => $data['numero_cheque'] ?? null,
                ':banque' => $data['banque'] ?? null,
                ':statut' => $data['statut'],
                ':utilisateur_id' => $data['utilisateur_id'],
                ':site_id' => $data['site_id'],
                ':nombre_plaques' => $data['nombre_plaques'],
                ':etat' => 1
            ]);

            return $this->pdo->lastInsertId();
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
            // 1. Récupérer les bénéficiaires de cet impôt
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

            // 2. Calculer les nouvelles parts
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

            // 3. Vérifier que le total ne dépasse pas 100% (pour les pourcentages)
            if ($totalPourcentages > 100) {
                foreach ($repartitions as &$repartition) {
                    if ($repartition['type_part'] === 'pourcentage') {
                        $repartition['valeur_part_calculee'] = ($repartition['valeur_part_calculee'] * 100) / $totalPourcentages;
                        $repartition['montant'] = ($montantTotal * $repartition['valeur_part_calculee']) / 100;
                    }
                }
            }

            // 4. Enregistrer les répartitions
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
     * Traite une transaction complète
     */
    public function traiterTransaction($vehicleData, $paymentData, $utilisateurId, $provinceNom = null)
    {
        try {
            $this->beginTransactionSafe();

            // 1. Vérifier la disponibilité d'une plaque selon la province
            if (!$provinceNom) {
                throw new Exception("Province non spécifiée pour la vérification de la plaque.");
            }

            $plaqueDisponible = $this->verifierPlaqueDisponibleParProvinceFinal($provinceNom);
            if ($plaqueDisponible['status'] !== 'success') {
                throw new Exception($plaqueDisponible['message']);
            }
            
            if (!$plaqueDisponible['data']['disponible']) {
                throw new Exception("Aucune plaque n'est disponible actuellement pour la province de " . $provinceNom);
            }

            // 2. Récupérer le prix selon la province
            $prixResult = $this->getPrixPlaqueParProvince($provinceNom);
            if ($prixResult['status'] !== 'success') {
                throw new Exception($prixResult['message'] || "Erreur lors de la récupération du prix");
            }

            $montantInitial = $prixResult['data']['prix'];
            $siteId = $prixResult['data']['site_id']; // Utiliser le site_id de la province

            // 3. Vérifier ou créer le particulier
            $particulier = $this->particulierExiste($vehicleData['telephone']);
            if (!$particulier) {
                $vehicleData['utilisateur_id'] = $utilisateurId;
                $vehicleData['site_id'] = $siteId; // Utiliser le site_id de la province
                $particulierId = $this->creerParticulier($vehicleData);
                $particulier = [
                    'id' => $particulierId,
                    'reduction_type' => null,
                    'reduction_valeur' => 0,
                    'reduction_montant_max' => null
                ];
            } else {
                $particulierId = $particulier['id'];
            }

            // 4. Vérifier les réductions
            $reduction = null;
            if ($particulier['reduction_valeur'] > 0) {
                $reduction = [
                    'reduction_type' => $particulier['reduction_type'],
                    'reduction_valeur' => $particulier['reduction_valeur'],
                    'reduction_montant_max' => $particulier['reduction_montant_max']
                ];
            }

            $montantFinal = $this->calculerMontant($montantInitial, $reduction);
            $montantReduction = $montantInitial - $montantFinal;

            // 5. Créer l'engin avec la plaque de la province
            $plaqueData = $plaqueDisponible['data'];
            $numeroPlaque = $plaqueData['numero_plaque'];
            
            $enginData = $this->creerEngin(
                $vehicleData,
                $particulierId,
                $plaqueData['serie_id'],
                $plaqueData['item_id'],
                $numeroPlaque,
                $utilisateurId,
                $siteId // Utiliser le site_id de la province
            );

            // 6. Mettre à jour le statut de la série item
            $this->mettreAJourStatutSerieItem($plaqueData['item_id'], '1');

            // 7. Enregistrer le paiement
            $paiementId = $this->enregistrerPaiement([
                'engin_id' => $enginData['enginId'],
                'particulier_id' => $particulierId,
                'montant' => $montantFinal,
                'montant_initial' => $montantInitial,
                'impot_id' => $enginData['impotId'],
                'mode_paiement' => $paymentData['modePaiement'],
                'operateur' => $paymentData['operateur'] ?? null,
                'numero_transaction' => $paymentData['numeroTransaction'] ?? null,
                'numero_cheque' => $paymentData['numeroCheque'] ?? null,
                'banque' => $paymentData['banque'] ?? null,
                'statut' => 'completed',
                'utilisateur_id' => $utilisateurId,
                'site_id' => $siteId,
                'nombre_plaques' => 1
            ]);

            // 8. Calculer la répartition des bénéficiaires
            $resultRepartition = $this->calculerRepartitionBeneficiaires($paiementId, $montantFinal, $enginData['impotId']);
            if ($resultRepartition['status'] === 'error') {
                error_log("Erreur répartition bénéficiaires: " . $resultRepartition['message']);
                // On ne rollback pas pour une erreur de répartition, on log seulement
            }

            // 9. Enregistrer la notification
            $this->enregistrerNotification(
                'immatriculation_complete',
                'Immatriculation complète',
                "Nouvelle immatriculation - Plaque: $numeroPlaque - Montant: $montantFinal",
                $this->getNIFByParticulierId($particulierId),
                null,
                $paiementId
            );

            $this->commitSafe();

            // 10. Générer les données de facture
            $factureData = $this->genererFacture($enginData['enginId'], $particulierId, $paiementId);

            return [
                'status' => 'success',
                'message' => 'Transaction traitée avec succès',
                'data' => array_merge($factureData, [
                    'numero_plaque' => $numeroPlaque,
                    'montant_paye' => $montantFinal,
                    'montant_initial' => $montantInitial,
                    'montant_reduction' => $montantReduction,
                    'reduction_appliquee' => $reduction ? true : false,
                    'reduction_type' => $reduction ? $reduction['reduction_type'] : null,
                    'reduction_valeur' => $reduction ? $reduction['reduction_valeur'] : 0,
                    'engin_id' => $enginData['enginId'],
                    'paiement_id' => $paiementId,
                    'particulier_id' => $particulierId,
                    'repartition' => $resultRepartition['status'] === 'success' ? $resultRepartition['data'] : null
                ])
            ];

        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("Erreur lors du traitement de la transaction: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Génère les données de facture
     */
    private function genererFacture($enginId, $particulierId, $paiementId)
    {
        try {
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

            return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
        } catch (PDOException $e) {
            error_log("Erreur lors de la génération de la facture: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Met à jour les informations de réduction d'un particulier
     */
    public function mettreAJourReductionParticulier($particulierId, $reductionType, $reductionValeur, $reductionMontantMax = null)
    {
        try {
            $sql = "UPDATE particuliers 
                    SET reduction_type = :reduction_type, 
                        reduction_valeur = :reduction_valeur, 
                        reduction_montant_max = :reduction_montant_max,
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :particulier_id";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':reduction_type' => $reductionType,
                ':reduction_valeur' => $reductionValeur,
                ':reduction_montant_max' => $reductionMontantMax,
                ':particulier_id' => $particulierId
            ]);

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Erreur lors de la mise à jour de la réduction: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Récupère les détails de réduction d'un particulier
     */
    public function getDetailsReduction($particulierId)
    {
        try {
            $sql = "SELECT reduction_type, reduction_valeur, reduction_montant_max
                    FROM particuliers 
                    WHERE id = :particulier_id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':particulier_id' => $particulierId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des détails de réduction: " . $e->getMessage());
            return null;
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
     * Destructeur pour s'assurer que les transactions sont fermées
     */
    public function __destruct()
    {
        if ($this->transactionActive) {
            error_log("ATTENTION: Transaction toujours active à la destruction de l'objet Transaction");
            $this->rollbackSafe();
        }
    }

    /**
     * Récupère l'historique des transactions d'un particulier
     */
    public function getHistoriqueTransactions($particulierId)
    {
        try {
            $sql = "SELECT 
                    pi.id,
                    p.nom,
                    p.prenom, 
                    p.telephone,
                    e.type_engin as typeEngin,
                    e.marque,
                    e.numero_plaque,
                    e.energie,
                    e.couleur,
                    e.usage_engin,
                    e.numero_chassis as numeroChassis,
                    e.annee_fabrication,
                    e.annee_circulation,
                    e.puissance_fiscal,
                    pi.montant,
                    pi.mode_paiement as modePaiement,
                    pi.operateur,
                    pi.numero_transaction as numeroTransaction,
                    pi.numero_cheque,
                    pi.banque,
                    pi.date_paiement as date,
                    pi.etat as statut,
                    p.id as particulier_id
                    FROM paiements_immatriculation pi
                    JOIN engins e ON pi.engin_id = e.id
                    JOIN particuliers p ON pi.particulier_id = p.id
                    WHERE pi.particulier_id = :particulier_id
                    ORDER BY pi.date_paiement DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':particulier_id' => $particulierId]);
            $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Formater les données pour l'interface
            $formattedTransactions = [];
            foreach ($transactions as $transaction) {
                // CORRECTION: Logique des statuts inversée
                $statut = 'en_cours'; // Par défaut
                if ($transaction['statut'] == 0) {
                    $statut = 'livré'; // 0 = livré
                } elseif ($transaction['statut'] == 1) {
                    $statut = 'en_cours'; // 1 = en cours (pas encore livré)
                } elseif ($transaction['statut'] == 2) {
                    $statut = 'annulé'; // 2 = annulé
                }

                $formattedTransactions[] = [
                    'id' => (string)$transaction['id'],
                    'nom' => $transaction['nom'],
                    'prenom' => $transaction['prenom'],
                    'telephone' => $transaction['telephone'],
                    'typeEngin' => $transaction['typeEngin'],
                    'marque' => $transaction['marque'],
                    'numero_plaque' => $transaction['numero_plaque'],
                    'energie' => $transaction['energie'],
                    'couleur' => $transaction['couleur'],
                    'usage_engin' => $transaction['usage_engin'],
                    'numeroChassis' => $transaction['numeroChassis'],
                    'annee_fabrication' => $transaction['annee_fabrication'],
                    'annee_circulation' => $transaction['annee_circulation'],
                    'puissance_fiscal' => $transaction['puissance_fiscal'],
                    'montant' => (float)$transaction['montant'],
                    'modePaiement' => $transaction['modePaiement'],
                    'operateur' => $transaction['operateur'],
                    'numeroTransaction' => $transaction['numeroTransaction'] ?? $transaction['numero_cheque'] ?? 'N/A',
                    'date' => $transaction['date'],
                    'statut' => $statut,
                    'particulier_id' => $transaction['particulier_id']
                ];
            }

            return $formattedTransactions;

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération de l'historique: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Enregistre une notification dans la base de données
     *
     * @param string $type Type de notification
     * @param string $titre Titre de la notification
     * @param string $message Message de la notification
     * @param string|null $nif NIF du contribuable
     * @param int|null $idDeclaration ID de la déclaration
     * @param int|null $idPaiement ID du paiement
     * @return bool Succès de l'opération
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
     * Vérifie la disponibilité d'une plaque selon la province
     */
    public function verifierPlaqueDisponibleParProvince($provinceNom)
    {
        try {
            // 1. Récupérer l'ID de la province
            $sqlProvince = "SELECT id FROM provinces WHERE nom = :province_nom AND actif = 1 LIMIT 1";
            $stmtProvince = $this->pdo->prepare($sqlProvince);
            $stmtProvince->execute([':province_nom' => $provinceNom]);
            $province = $stmtProvince->fetch(PDO::FETCH_ASSOC);
            
            if (!$province) {
                return false;
            }
            
            $provinceId = $province['id'];
            
            // 2. Récupérer les séries disponibles pour cette province
            $sql = "SELECT si.id, si.serie_id, si.value, s.nom_serie 
                    FROM serie_items si 
                    INNER JOIN series s ON si.serie_id = s.id 
                    WHERE si.statut = '0' 
                    AND s.actif = 1 
                    AND s.province_id = :province_id
                    ORDER BY si.id ASC 
                    LIMIT 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':province_id' => $provinceId]);
            $plaque = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($plaque) {
                $numeroPlaque = $plaque['nom_serie'] . $plaque['value'];
                return [
                    'disponible' => true,
                    'numero_plaque' => $numeroPlaque,
                    'serie_id' => $plaque['serie_id'],
                    'item_id' => $plaque['id']
                ];
            }
            
            return ['disponible' => false];
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de la plaque par province: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Récupère le prix de la plaque selon la province
     */
    public function getPrixPlaqueParProvince($provinceNom)
    {
        try {
            // 1. Récupérer l'ID de la province
            $sqlProvince = "SELECT id FROM provinces WHERE nom = :province_nom AND actif = 1 LIMIT 1";
            $stmtProvince = $this->pdo->prepare($sqlProvince);
            $stmtProvince->execute([':province_nom' => $provinceNom]);
            $province = $stmtProvince->fetch(PDO::FETCH_ASSOC);
            
            if (!$province) {
                return [
                    "status" => "error",
                    "message" => "Province non trouvée ou inactive."
                ];
            }
            
            $provinceId = $province['id'];
            
            // 2. Récupérer le prix depuis la table sites
            $sqlPrix = "SELECT id, formule as prix FROM sites WHERE province_id = :province_id AND actif = 1 LIMIT 1";
            $stmtPrix = $this->pdo->prepare($sqlPrix);
            $stmtPrix->execute([':province_id' => $provinceId]);
            $site = $stmtPrix->fetch(PDO::FETCH_ASSOC);
            
            if (!$site) {
                return [
                    "status" => "error",
                    "message" => "Aucun site trouvé pour cette province."
                ];
            }
            
            $prix = intval($site['prix']);
            
            if ($prix <= 0) {
                // Prix par défaut si non défini
                $prix = 32;
            }
            
            return [
                "status" => "success",
                "message" => "Prix récupéré avec succès",
                "data" => [
                    "prix" => $prix,
                    "province_id" => $provinceId,
                    "site_id" => $site['id']
                ]
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération du prix: " . $e->getMessage());
            return [
                "status" => "error", 
                "message" => "Erreur système: Impossible de récupérer le prix."
            ];
        }
    }

    /**
     * Vérifie la disponibilité d'une plaque selon la province
     */
    public function verifierPlaqueDisponibleParProvinceFinal($provinceNom)
    {
        try {
            // 1. Récupérer l'ID de la province
            $sqlProvince = "SELECT id FROM provinces WHERE nom = :province_nom AND actif = 1 LIMIT 1";
            $stmtProvince = $this->pdo->prepare($sqlProvince);
            $stmtProvince->execute([':province_nom' => $provinceNom]);
            $province = $stmtProvince->fetch(PDO::FETCH_ASSOC);
            
            if (!$province) {
                return [
                    "status" => "error",
                    "message" => "Province non trouvée"
                ];
            }
            
            $provinceId = $province['id'];
            
            // 2. Récupérer les séries disponibles pour cette province
            $sql = "SELECT si.id, si.serie_id, si.value, s.nom_serie 
                    FROM serie_items si 
                    INNER JOIN series s ON si.serie_id = s.id 
                    WHERE si.statut = '0' 
                    AND s.actif = 1 
                    AND s.province_id = :province_id
                    ORDER BY si.id ASC 
                    LIMIT 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':province_id' => $provinceId]);
            $plaque = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($plaque) {
                $numeroPlaque = $plaque['nom_serie'] . $plaque['value'];
                return [
                    "status" => "success",
                    "data" => [
                        'disponible' => true,
                        'numero_plaque' => $numeroPlaque,
                        'serie_id' => $plaque['serie_id'],
                        'item_id' => $plaque['id']
                    ]
                ];
            }
            
            return [
                "status" => "success",
                "data" => [
                    'disponible' => false
                ]
            ];
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de la plaque par province: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la vérification de la plaque"
            ];
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
}
?>