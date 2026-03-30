<?php
// class/VenteVignette.php
require_once 'Connexion.php';

/**
 * Classe VenteVignette - Gestion des ventes de vignettes
 */
class VenteVignette extends Connexion
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
     * Récupère les bénéficiaires pour un impôt donné
     */
    private function getBeneficiairesForImpot($impot_id)
    {
        $sql = "
            SELECT 
                ib.id as impot_beneficiaire_id,
                ib.type_part,
                ib.valeur_part,
                b.id as beneficiaire_id,
                b.nom,
                b.numero_compte
            FROM impot_beneficiaires ib
            INNER JOIN beneficiaires b ON ib.beneficiaire_id = b.id
            WHERE ib.impot_id = :impot_id
              AND b.actif = 1
            ORDER BY ib.id
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':impot_id', $impot_id, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Calcule la répartition pour un bénéficiaire
     */
    private function calculerMontantBeneficiaire($montantTotal, $typePart, $valeurPart)
    {
        if ($typePart === 'montant_fixe') {
            return min($valeurPart, $montantTotal);
        } elseif ($typePart === 'pourcentage') {
            return ($montantTotal * $valeurPart) / 100;
        }
        return 0;
    }

    /**
     * Répartit le montant entre les bénéficiaires
     */
    private function repartirMontant($paiementId, $impot_id, $montantTotal)
    {
        try {
            // Récupérer les bénéficiaires pour cet impôt
            $beneficiaires = $this->getBeneficiairesForImpot($impot_id);
            
            if (empty($beneficiaires)) {
                error_log("Aucun bénéficiaire trouvé pour l'impôt ID: $impot_id");
                return true; // Pas d'erreur, juste pas de répartition
            }

            // Calculer les montants pour chaque bénéficiaire
            $repartitions = [];
            $totalReparti = 0;
            
            foreach ($beneficiaires as $beneficiaire) {
                $montant = $this->calculerMontantBeneficiaire(
                    $montantTotal,
                    $beneficiaire['type_part'],
                    (float)$beneficiaire['valeur_part']
                );
                
                $repartitions[] = [
                    'beneficiaire' => $beneficiaire,
                    'montant' => round($montant, 2)
                ];
                
                $totalReparti += $montant;
            }

            // Vérifier que le total réparti ne dépasse pas le montant total
            // (ajuster le dernier bénéficiaire si nécessaire pour cause d'arrondis)
            if ($totalReparti > $montantTotal) {
                $difference = $totalReparti - $montantTotal;
                $lastIndex = count($repartitions) - 1;
                $repartitions[$lastIndex]['montant'] -= $difference;
                $repartitions[$lastIndex]['montant'] = max(0, round($repartitions[$lastIndex]['montant'], 2));
            }

            // Insérer les répartitions dans la table
            $sqlInsert = "
                INSERT INTO repartition_paiements_immatriculation (
                    id_paiement_immatriculation,
                    beneficiaire_id,
                    type_part,
                    valeur_part_originale,
                    valeur_part_calculee,
                    montant,
                    date_creation
                ) VALUES (
                    :paiement_id,
                    :beneficiaire_id,
                    :type_part,
                    :valeur_part_originale,
                    :valeur_part_calculee,
                    :montant,
                    NOW()
                )
            ";
            
            $stmtInsert = $this->pdo->prepare($sqlInsert);
            
            foreach ($repartitions as $repartition) {
                $beneficiaire = $repartition['beneficiaire'];
                $montant = $repartition['montant'];
                
                if ($montant <= 0) {
                    continue; // Ne pas insérer les montants nuls ou négatifs
                }
                
                $valeurPartCalculee = $beneficiaire['type_part'] === 'pourcentage' 
                    ? round(($montant / $montantTotal) * 100, 2)
                    : $montant;
                
                $stmtInsert->bindValue(':paiement_id', $paiementId, PDO::PARAM_INT);
                $stmtInsert->bindValue(':beneficiaire_id', $beneficiaire['beneficiaire_id'], PDO::PARAM_INT);
                $stmtInsert->bindValue(':type_part', $beneficiaire['type_part'], PDO::PARAM_STR);
                $stmtInsert->bindValue(':valeur_part_originale', $beneficiaire['valeur_part'], PDO::PARAM_STR);
                $stmtInsert->bindValue(':valeur_part_calculee', $valeurPartCalculee, PDO::PARAM_STR);
                $stmtInsert->bindValue(':montant', $montant, PDO::PARAM_STR);
                
                if (!$stmtInsert->execute()) {
                    $errorInfo = $stmtInsert->errorInfo();
                    throw new Exception("Erreur insertion répartition: " . ($errorInfo[2] ?? 'Erreur inconnue'));
                }
            }
            
            return true;
            
        } catch (Exception $e) {
            error_log("Erreur répartition montant: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Enregistre un paiement de vignette
     */
    public function enregistrerPaiement($paiementData)
    {
        try {
            $this->beginTransactionSafe();

            // VALIDATION DES DONNÉES OBLIGATOIRES
            $required = [
                'engin_id', 'particulier_id', 'montant', 'montant_initial',
                'impot_id', 'mode_paiement', 'utilisateur_id', 'site_id', 'taux_cdf'
            ];
            
            foreach ($required as $field) {
                if (!isset($paiementData[$field])) {
                    throw new Exception("Champ requis manquant: $field");
                }
            }

            // CORRECTION: Vérifier que impot_id est bien numérique
            $impot_id = filter_var($paiementData['impot_id'], FILTER_VALIDATE_INT);
            if ($impot_id === false || $impot_id <= 0) {
                throw new Exception("ID d'impôt invalide");
            }

            // Récupérer le site_id du site via utilisateur_id
            $sqlSite = "SELECT s.id AS id
                        FROM sites s 
                        INNER JOIN utilisateurs u ON s.id = u.site_affecte_id 
                        WHERE u.id = :utilisateur 
                        AND s.actif = 1 
                        LIMIT 1";
            $stmtSite = $this->pdo->prepare($sqlSite);
            $stmtSite->bindValue(':utilisateur', $paiementData['utilisateur_id'], PDO::PARAM_STR);
            $stmtSite->execute();
            
            $siteData = $stmtSite->fetch(PDO::FETCH_ASSOC);

            $sql = "
            INSERT INTO paiements_immatriculation (
                engin_id,
                particulier_id,
                montant,
                montant_initial,
                impot_id,
                mode_paiement,
                operateur,
                numero_transaction,
                numero_cheque,
                banque,
                statut,
                date_paiement,
                utilisateur_id,
                site_id,
                nombre_plaques,
                etat
            ) VALUES (
                :engin_id,
                :particulier_id,
                :montant,
                :montant_initial,
                :impot_id,
                :mode_paiement,
                :operateur,
                :numero_transaction,
                :numero_cheque,
                :banque,
                :statut,
                NOW(),
                :utilisateur_id,
                :site_id,
                :nombre_plaques,
                :etat
            )";

            $stmt = $this->pdo->prepare($sql);

            // LIAISON DES PARAMÈTRES (avec corrections)
            
            // engin_id (nullable)
            $engin_id = isset($paiementData['engin_id']) ? (int)$paiementData['engin_id'] : null;
            $stmt->bindValue(':engin_id', $engin_id, $engin_id ? PDO::PARAM_INT : PDO::PARAM_NULL);

            // particulier_id
            $stmt->bindValue(':particulier_id', (int)$paiementData['particulier_id'], PDO::PARAM_INT);

            // montant et montant_initial
            $stmt->bindValue(':montant', (float)$paiementData['montant'], PDO::PARAM_STR);
            
            $montant_initial = isset($paiementData['montant_initial']) ? (float)$paiementData['montant_initial'] : null;
            $stmt->bindValue(':montant_initial', $montant_initial, $montant_initial ? PDO::PARAM_STR : PDO::PARAM_NULL);

            // impot_id (maintenant validé)
            $stmt->bindValue(':impot_id', $impot_id, PDO::PARAM_INT);

            // mode_paiement
            $stmt->bindValue(':mode_paiement', $paiementData['mode_paiement'], PDO::PARAM_STR);

            // Champs optionnels
            $stmt->bindValue(':operateur', $paiementData['operateur'] ?? null, PDO::PARAM_STR);
            $stmt->bindValue(':numero_transaction', $paiementData['numero_transaction'] ?? null, PDO::PARAM_STR);
            $stmt->bindValue(':numero_cheque', $paiementData['numero_cheque'] ?? null, PDO::PARAM_STR);
            $stmt->bindValue(':banque', $paiementData['banque'] ?? null, PDO::PARAM_STR);

            // statut
            $statutAutorise = ['pending', 'completed', 'failed'];
            $statut = isset($paiementData['statut']) && in_array($paiementData['statut'], $statutAutorise, true)
                ? $paiementData['statut']
                : 'completed';
            $stmt->bindValue(':statut', $statut, PDO::PARAM_STR);

            // utilisateur_id et utilisateur_name
            $stmt->bindValue(':utilisateur_id', (int)$paiementData['utilisateur_id'], PDO::PARAM_INT);

            // site_id
            $stmt->bindValue(':site_id', (int)$siteData['id'], PDO::PARAM_INT);

            // nombre_plaques et taux_cdf
            $stmt->bindValue(':nombre_plaques', $paiementData['nombre_plaques'] ?? 1, PDO::PARAM_INT);

            // etat = 1 pour actif
            $stmt->bindValue(':etat', 1, PDO::PARAM_INT);

            // Exécution
            if (!$stmt->execute()) {
                $errorInfo = $stmt->errorInfo();
                throw new Exception("Erreur PDO: " . ($errorInfo[2] ?? 'Erreur inconnue'));
            }

            $paiementId = $this->pdo->lastInsertId();

            // 2. RÉPARTIR LE MONTANT ENTRE LES BÉNÉFICIAIRES
            if ($statut === 'completed') {
                $this->repartirMontant(
                    $paiementId, 
                    $impot_id, 
                    (float)$paiementData['montant']
                );

                // 3. INSÉRER dans vignettes_delivrees (type: achat, durée: 6 mois)
                $codeVignette = "VGN-" . date('Y') . "-" . 
                    strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8)) . "-" . 
                    str_pad($paiementId, 6, '0', STR_PAD_LEFT);
                $dateValidite = date('Y-m-d', strtotime('+6 months'));

                $numeroVignettePhysique = $paiementData['numero_vignette'] ?? null;

                // Vérifier unicité du numéro de vignette
                if (!empty($numeroVignettePhysique)) {
                    $sqlCheckVignette = "SELECT id FROM vignettes_delivrees WHERE numero_vignette = :numero_vignette AND etat = 1 LIMIT 1";
                    $stmtCheckVignette = $this->pdo->prepare($sqlCheckVignette);
                    $stmtCheckVignette->bindValue(':numero_vignette', $numeroVignettePhysique, PDO::PARAM_STR);
                    $stmtCheckVignette->execute();
                    if ($stmtCheckVignette->fetch(PDO::FETCH_ASSOC)) {
                        throw new Exception("Le numéro de vignette '$numeroVignettePhysique' est déjà utilisé");
                    }
                }

                $sqlVignette = "
                    INSERT INTO vignettes_delivrees (
                        id_paiement, impot_id, type_mouvement, duree_mois,
                        engin_id, particulier_id, code_vignette,
                        date_delivrance, date_validite,
                        utilisateur_delivrance_id, utilisateur_delivrance_nom,
                        site_id, etat, date_creation, numero_vignette
                    ) VALUES (
                        :id_paiement, :impot_id, 'achat', 6,
                        :engin_id, :particulier_id, :code_vignette,
                        NOW(), :date_validite,
                        :utilisateur_id, :utilisateur_name,
                        :site_id, 1, NOW(), :numero_vignette
                    )
                ";
                $stmtVignette = $this->pdo->prepare($sqlVignette);
                $stmtVignette->bindValue(':id_paiement', $paiementId, PDO::PARAM_INT);
                $stmtVignette->bindValue(':impot_id', $impot_id, PDO::PARAM_INT);
                $stmtVignette->bindValue(':engin_id', $engin_id, PDO::PARAM_INT);
                $stmtVignette->bindValue(':particulier_id', (int)$paiementData['particulier_id'], PDO::PARAM_INT);
                $stmtVignette->bindValue(':code_vignette', $codeVignette, PDO::PARAM_STR);
                $stmtVignette->bindValue(':date_validite', $dateValidite, PDO::PARAM_STR);
                $stmtVignette->bindValue(':utilisateur_id', (int)$paiementData['utilisateur_id'], PDO::PARAM_INT);
                $stmtVignette->bindValue(':utilisateur_name', $paiementData['utilisateur_name'] ?? 'Caissier', PDO::PARAM_STR);
                $stmtVignette->bindValue(':site_id', (int)$siteData['id'], PDO::PARAM_INT);
                $stmtVignette->bindValue(':numero_vignette', $numeroVignettePhysique, $numeroVignettePhysique ? PDO::PARAM_STR : PDO::PARAM_NULL);
                $stmtVignette->execute();
            }

            // Si une référence bancaire est fournie, incrémenter livres dans donnees_confirmation
            $referenceBancaire = trim($paiementData['reference_bancaire'] ?? '');
            if (!empty($referenceBancaire)) {
                $sqlPB = "
                    SELECT id, donnees_initiation, donnees_confirmation
                    FROM paiements_bancaires
                    WHERE reference_bancaire = :reference
                      AND statut IN ('complete', 'livre')
                    LIMIT 1
                    FOR UPDATE
                ";
                $stmtPB = $this->pdo->prepare($sqlPB);
                $stmtPB->bindValue(':reference', $referenceBancaire, PDO::PARAM_STR);
                $stmtPB->execute();
                $pb = $stmtPB->fetch(PDO::FETCH_ASSOC);

                if ($pb) {
                    $donneesInitiation = json_decode($pb['donnees_initiation'] ?? '{}', true);
                    $donneesConfirmation = json_decode($pb['donnees_confirmation'] ?? '{}', true);
                    $nombreDeclarations = (int)($donneesInitiation['nombre_declarations'] ?? 1);
                    $livres = (int)($donneesConfirmation['livres'] ?? 0);

                    $livres++;
                    $donneesConfirmation['livres'] = $livres;
                    $donneesConfirmationJson = json_encode($donneesConfirmation);

                    $nouveauStatut = ($livres >= $nombreDeclarations) ? 'livre' : 'complete';

                    $sqlUpdatePB = "
                        UPDATE paiements_bancaires
                        SET donnees_confirmation = :donnees_confirmation,
                            statut = :statut
                        WHERE id = :id
                    ";
                    $stmtUpdatePB = $this->pdo->prepare($sqlUpdatePB);
                    $stmtUpdatePB->bindValue(':donnees_confirmation', $donneesConfirmationJson, PDO::PARAM_STR);
                    $stmtUpdatePB->bindValue(':statut', $nouveauStatut, PDO::PARAM_STR);
                    $stmtUpdatePB->bindValue(':id', $pb['id'], PDO::PARAM_INT);
                    $stmtUpdatePB->execute();
                }
            }

            // Récupérer les détails
            $response = $this->getPaiementDetails($paiementId, $paiementData, $impot_id);

            $this->commitSafe();

            return [
                "status" => "success",
                "message" => "Paiement enregistré avec succès",
                "data" => $response
            ];

        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("Erreur enregistrement paiement: " . $e->getMessage());
            return [
                "status" => "error", 
                "message" => "Erreur système: " . $e->getMessage()
            ];
        }
    }

    /**
     * Vérifie si une vignette existe déjà pour une plaque
     */
    public function verifierVignetteExistante($plaque)
    {
        try {
            $this->beginTransactionSafe();

            // Chercher la dernière vignette délivrée pour cette plaque
            $sql = "
                SELECT vd.id, vd.code_vignette, vd.numero_vignette,
                       vd.date_delivrance, vd.date_validite, vd.etat,
                       vd.type_mouvement
                FROM vignettes_delivrees vd
                INNER JOIN engins e ON vd.engin_id = e.id
                WHERE e.numero_plaque = :plaque
                  AND vd.etat = 1
                ORDER BY vd.date_delivrance DESC
                LIMIT 1
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':plaque', $plaque, PDO::PARAM_STR);
            $stmt->execute();
            
            $vignette = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $this->commitSafe();

            if (!$vignette) {
                // Aucune vignette délivrée → autoriser la vente
                return [
                    "status" => "success",
                    "existe" => false,
                    "vignette_active" => false,
                    "message" => "Aucune vignette trouvée pour cette plaque."
                ];
            }

            // Comparer la date de validité avec aujourd'hui
            $dateValidite = $vignette['date_validite'];
            $estActive = (strtotime($dateValidite) >= strtotime(date('Y-m-d')));

            if ($estActive) {
                return [
                    "status" => "success",
                    "existe" => true,
                    "vignette_active" => true,
                    "date_validite" => $dateValidite,
                    "code_vignette" => $vignette['code_vignette'],
                    "numero_vignette" => $vignette['numero_vignette'],
                    "message" => "Une vignette valide existe déjà pour cette plaque (valide jusqu'au " . date('d/m/Y', strtotime($dateValidite)) . ")."
                ];
            } else {
                return [
                    "status" => "success",
                    "existe" => true,
                    "vignette_active" => false,
                    "date_validite" => $dateValidite,
                    "code_vignette" => $vignette['code_vignette'],
                    "message" => "La vignette de cette plaque a expiré le " . date('d/m/Y', strtotime($dateValidite)) . ". Veuillez procéder au renouvellement."
                ];
            }

        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("Erreur vérification vignette: " . $e->getMessage());
            return [
                "status" => "error", 
                "message" => "Erreur système: " . $e->getMessage()
            ];
        }
    }

    /**
     * Récupère les détails d'un paiement (avec répartition)
     */
    private function getPaiementDetails($paiementId, $paiementData, $impot_id)
    {
        // Détails de base
        $sqlDetails = "
            SELECT 
                p.*,
                s.nom as site_nom,
                u.nom_complet as caissier_nom,
                e.numero_plaque as engin_plaque,
                e.marque as engin_marque,
                e.couleur as couleur,
                e.energie as energie,
                e.usage_engin as usage_engin,
                e.puissance_fiscal as puissance_fiscal,
                e.annee_fabrication as annee_fabrication,
                e.annee_circulation as annee_circulation,
                e.numero_chassis as numero_chassis,
                e.numero_moteur as numero_moteur,
                '' as engin_modele,
                e.type_engin as engin_type,
                pt.nom as assujetti_nom,
                pt.prenom as assujetti_prenom,
                pt.telephone as assujetti_telephone,
                pt.rue as assujetti_adresse,
                pt.nif as assujetti_nif,
                pt.email as assujetti_email
            FROM paiements_immatriculation p
            LEFT JOIN sites s ON p.site_id = s.id
            LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id
            LEFT JOIN engins e ON p.engin_id = e.id
            LEFT JOIN particuliers pt ON p.particulier_id = pt.id
            WHERE p.id = :paiement_id
        ";

        $stmtDetails = $this->pdo->prepare($sqlDetails);
        $stmtDetails->bindValue(':paiement_id', $paiementId, PDO::PARAM_INT);
        $stmtDetails->execute();
        $paiementDetails = $stmtDetails->fetch(PDO::FETCH_ASSOC);

        if (!$paiementDetails) {
            return [
                "paiement_id" => $paiementId,
                "message" => "Paiement créé mais détails non récupérables"
            ];
        }

        // Récupérer la répartition
        $sqlRepartition = "
            SELECT 
                r.*,
                b.nom as beneficiaire_nom,
                b.numero_compte
            FROM repartition_paiements_immatriculation r
            INNER JOIN beneficiaires b ON r.beneficiaire_id = b.id
            WHERE r.id_paiement_immatriculation = :paiement_id
            ORDER BY r.id
        ";
        
        $stmtRepartition = $this->pdo->prepare($sqlRepartition);
        $stmtRepartition->bindValue(':paiement_id', $paiementId, PDO::PARAM_INT);
        $stmtRepartition->execute();
        $repartitions = $stmtRepartition->fetchAll(PDO::FETCH_ASSOC);
        
        // Formater la répartition pour la réponse
        $repartitionFormatted = [];
        $totalReparti = 0;
        
        foreach ($repartitions as $repartition) {
            $montant = (float)$repartition['montant'];
            $totalReparti += $montant;
            
            $repartitionFormatted[] = [
                "beneficiaire_id" => $repartition['beneficiaire_id'],
                "beneficiaire_nom" => $repartition['beneficiaire_nom'],
                "numero_compte" => $repartition['numero_compte'],
                "type_part" => $repartition['type_part'],
                "valeur_part_originale" => (float)$repartition['valeur_part_originale'],
                "valeur_part_calculee" => (float)$repartition['valeur_part_calculee'],
                "montant" => $montant
            ];
        }

        // Retourner les détails complets
        return [
            "site" => [
                "nom_site" => $paiementDetails['site_nom'] ?? "Central TSC-NPS",
                "fournisseur" => "TSC-NPS"
            ],
            "assujetti" => [
                "id" => $paiementData['particulier_id'],
                "nom_complet" => trim(($paiementDetails['assujetti_nom'] ?? '') . ' ' . ($paiementDetails['assujetti_prenom'] ?? '')),
                "telephone" => $paiementDetails['assujetti_telephone'] ?? '',
                "adresse" => $paiementDetails['assujetti_adresse'] ?? '',
                "nif" => $paiementDetails['assujetti_nif'] ?? '',
                "email" => $paiementDetails['assujetti_email'] ?? ''
            ],
            "engin" => [
                "id" => $paiementData['engin_id'] ?? null,
                "numero_plaque" => $paiementDetails['engin_plaque'] ?? '',
                "marque" => $paiementDetails['engin_marque'] ?? '',
                "modele" => $paiementDetails['engin_modele'] ?? '',
                "couleur" => $paiementDetails['couleur'] ?? '',
                "energie" => $paiementDetails['energie'] ?? '',
                "usage_engin" => $paiementDetails['usage_engin'] ?? '',
                "puissance_fiscal" => $paiementDetails['puissance_fiscal'] ?? '',
                "annee_fabrication" => $paiementDetails['annee_fabrication'] ?? '',
                "numero_chassis" => $paiementDetails['annee_circulation'] ?? '',
                "numero_chassis" => $paiementDetails['numero_chassis'] ?? '',
                "numero_moteur" => $paiementDetails['numero_moteur'] ?? '',
                "type_engin" => $paiementDetails['engin_type'] ?? 'Véhicule'
            ],
            "paiement" => [
                "id" => $paiementId,
                "montant" => $paiementData['montant'],
                "montant_initial" => $paiementData['montant_initial'],
                "mode_paiement" => $paiementData['mode_paiement'],
                "operateur" => $paiementData['operateur'] ?? null,
                "numero_transaction" => $paiementData['numero_transaction'] ?? null,
                "date_paiement" => $paiementDetails['date_paiement'] ?? date('Y-m-d H:i:s'),
                "statut" => $paiementData['statut'] ?? 'completed'
            ],
            "repartition" => [
                "total_montant" => (float)$paiementData['montant'],
                "total_reparti" => round($totalReparti, 2),
                "reste" => round((float)$paiementData['montant'] - $totalReparti, 2),
                "details" => $repartitionFormatted,
                "nombre_beneficiaires" => count($repartitionFormatted)
            ],
            "taux" => [
                "taux_actif" => $paiementData['taux_cdf'] ?? 2200,
                "date_application" => date('Y-m-d')
            ],
            "utilisateur" => [
                "id" => $paiementData['utilisateur_id'],
                "nom" => $paiementDetails['caissier_nom'] ?? $paiementData['utilisateur_name'] ?? 'Caissier'
            ]
        ];
    }

    
    /**
     * Vérifie un paiement bancaire pour la délivrance
     */
    public function verifierPaiementBancaire($plaque, $reference)
    {
        try {
            $this->beginTransactionSafe();

            // 1. Vérifier le paiement bancaire
            $sqlPaiementBancaire = "
                SELECT 
                    pb.id,
                    pb.reference_bancaire,
                    pb.statut,
                    pb.id_paiement,
                    pb.date_creation
                FROM paiements_bancaires pb
                WHERE pb.reference_bancaire = :reference
                  AND pb.statut = 'complete'
                LIMIT 1
            ";
            
            $stmtPaiementBancaire = $this->pdo->prepare($sqlPaiementBancaire);
            $stmtPaiementBancaire->bindValue(':reference', $reference, PDO::PARAM_STR);
            $stmtPaiementBancaire->execute();
            
            $paiementBancaire = $stmtPaiementBancaire->fetch(PDO::FETCH_ASSOC);
            
            if (!$paiementBancaire) {
                $this->rollbackSafe();
                return [
                    "status" => "error",
                    "message" => "Aucun paiement bancaire trouvé avec cette référence ou paiement non complété"
                ];
            }

            // 2. Récupérer le paiement immatriculation
            $sqlPaiement = "
                SELECT 
                    pi.*,
                    e.numero_plaque,
                    e.marque,
                    '' as modele,
                    e.couleur,
                    e.energie,
                    e.usage_engin,
                    e.puissance_fiscal,
                    e.annee_fabrication,
                    e.annee_circulation,
                    e.numero_chassis,
                    e.numero_moteur,
                    e.type_engin,
                    CONCAT(pt.nom, ' ', pt.prenom) AS nom_complet,
                    pt.telephone,
                    pt.rue AS adresse,
                    pt.nif,
                    pt.email,
                    s.nom as site_nom,
                    s.code as site_code,
                    i.nom as impot_nom,
                    i.prix as impot_prix
                FROM paiements_immatriculation pi
                LEFT JOIN engins e ON pi.engin_id = e.id
                LEFT JOIN particuliers pt ON pi.particulier_id = pt.id
                LEFT JOIN sites s ON pi.site_id = s.id
                LEFT JOIN impots i ON pi.impot_id = i.id
                WHERE pi.id = :id_paiement
                  AND pi.statut = 'completed'
                LIMIT 1
            ";
            
            $stmtPaiement = $this->pdo->prepare($sqlPaiement);
            $stmtPaiement->bindValue(':id_paiement', $paiementBancaire['id_paiement'], PDO::PARAM_INT);
            $stmtPaiement->execute();
            
            $paiement = $stmtPaiement->fetch(PDO::FETCH_ASSOC);
            
            if (!$paiement) {
                $this->rollbackSafe();
                return [
                    "status" => "error",
                    "message" => "Paiement non trouvé ou non complété"
                ];
            }

            // Vérifier si la plaque correspond
            $plaqueCorrespond = ($paiement['numero_plaque'] && strtoupper(trim($paiement['numero_plaque'])) === strtoupper(trim($plaque)));
            
            if (!$plaqueCorrespond) {
                // Référence trouvée mais plaque ne correspond pas → inscription requise
                $this->commitSafe();
                return [
                    "status" => "inscription_required",
                    "message" => "Paiement trouvé mais le véhicule n'est pas enregistré. Veuillez compléter l'inscription.",
                    "data" => [
                        "paiement_bancaire" => $paiementBancaire,
                        "paiement" => [
                            "id" => $paiement['id'],
                            "montant" => $paiement['montant'],
                            "mode_paiement" => $paiement['mode_paiement'],
                            "statut" => $paiement['statut'],
                            "date_paiement" => $paiement['date_paiement'],
                            "utilisateur_id" => $paiement['utilisateur_id'],
                            "site_id" => $paiement['site_id'],
                            "impot_id" => $paiement['impot_id']
                        ]
                    ]
                ];
            }

            // 3. Vérifier si déjà délivré (vérifier dans une table de délivrance si elle existe)
            $sqlDejaDelivre = "
                SELECT COUNT(*) as count 
                FROM vignettes_delivrees 
                WHERE id_paiement = :id_paiement
                  AND etat = 1
            ";
            
            $stmtDejaDelivre = $this->pdo->prepare($sqlDejaDelivre);
            $stmtDejaDelivre->bindValue(':id_paiement', $paiementBancaire['id_paiement'], PDO::PARAM_INT);
            $stmtDejaDelivre->execute();
            $dejaDelivre = $stmtDejaDelivre->fetch(PDO::FETCH_ASSOC);
            
            if ($dejaDelivre['count'] > 0) {
                $this->rollbackSafe();
                return [
                    "status" => "error",
                    "message" => "Cette vignette a déjà été délivrée"
                ];
            }

            // 4. Récupérer le taux actif
            $sqlTaux = "
                SELECT valeur as taux_actif, date_application
                FROM taux 
                WHERE actif = 1 
                ORDER BY date_application DESC 
                LIMIT 1
            ";
            
            $stmtTaux = $this->pdo->prepare($sqlTaux);
            $stmtTaux->execute();
            $taux = $stmtTaux->fetch(PDO::FETCH_ASSOC);

            $this->commitSafe();

            // Formater la réponse
            $response = [
                "paiement_bancaire" => $paiementBancaire,
                "paiement" => [
                    "id" => $paiement['id'],
                    "engin_id" => $paiement['engin_id'],
                    "particulier_id" => $paiement['particulier_id'],
                    "montant" => $paiement['montant'],
                    "mode_paiement" => $paiement['mode_paiement'],
                    "statut" => $paiement['statut'],
                    "date_paiement" => $paiement['date_paiement'],
                    "utilisateur_id" => $paiement['utilisateur_id'],
                    "site_id" => $paiement['site_id'],
                    "impot_id" => $paiement['impot_id']
                ],
                "assujetti" => [
                    "id" => $paiement['particulier_id'],
                    "nom_complet" => $paiement['nom_complet'],
                    "telephone" => $paiement['telephone'],
                    "adresse" => $paiement['adresse'],
                    "nif" => $paiement['nif'],
                    "email" => $paiement['email']
                ],
                "engin" => [
                    "id" => $paiement['engin_id'],
                    "numero_plaque" => $paiement['numero_plaque'],
                    "marque" => $paiement['marque'],
                    "modele" => $paiement['modele'],
                    "couleur" => $paiement['couleur'],
                    "energie" => $paiement['energie'],
                    "usage_engin" => $paiement['usage_engin'],
                    "puissance_fiscal" => $paiement['puissance_fiscal'],
                    "annee_fabrication" => $paiement['annee_fabrication'],
                    "annee_circulation" => $paiement['annee_circulation'],
                    "numero_chassis" => $paiement['numero_chassis'],
                    "numero_moteur" => $paiement['numero_moteur'],
                    "type_engin" => $paiement['type_engin'],
                    "status_vignette" => "pending"
                ],
                "taux" => $taux ?: ["taux_actif" => 2200, "date_application" => date('Y-m-d')],
                "impot" => [
                    "id" => $paiement['impot_id'],
                    "nom" => $paiement['impot_nom'],
                    "prix" => $paiement['impot_prix']
                ],
                "site" => [
                    "nom_site" => $paiement['site_nom'],
                    "code_site" => $paiement['site_code']
                ]
            ];

            return [
                "status" => "success",
                "message" => "Paiement vérifié avec succès. Prêt pour la délivrance.",
                "data" => $response
            ];

        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("Erreur vérification paiement bancaire: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système: " . $e->getMessage()
            ];
        }
    }

    /**
     * Inscrit un nouveau assujetti et engin pour la vente de vignette
     */
    public function inscrireAssujettiEtEngin($data)
    {
        try {
            $this->beginTransactionSafe();

            $utilisateurId = (int)($data['utilisateur_id'] ?? 0);
            $siteId = null;

            // Récupérer le site de l'utilisateur
            if ($utilisateurId > 0) {
                $sqlSite = "SELECT s.id FROM sites s 
                            INNER JOIN utilisateurs u ON s.id = u.site_affecte_id 
                            WHERE u.id = :utilisateur AND s.actif = 1 LIMIT 1";
                $stmtSite = $this->pdo->prepare($sqlSite);
                $stmtSite->bindValue(':utilisateur', $utilisateurId, PDO::PARAM_INT);
                $stmtSite->execute();
                $siteData = $stmtSite->fetch(PDO::FETCH_ASSOC);
                $siteId = $siteData ? (int)$siteData['id'] : null;
            }

            // Séparer nom/prénom du nom_complet
            $nomComplet = trim($data['nom_complet'] ?? '');
            $parts = explode(' ', $nomComplet, 2);
            $nom = $parts[0] ?? '';
            $prenom = $parts[1] ?? '';

            // Chercher ou créer le particulier (par téléphone)
            $particulierId = null;
            $telephone = trim($data['telephone'] ?? '');

            if (!empty($telephone)) {
                $sqlCheck = "SELECT id FROM particuliers WHERE telephone = :telephone LIMIT 1";
                $stmtCheck = $this->pdo->prepare($sqlCheck);
                $stmtCheck->bindValue(':telephone', $telephone, PDO::PARAM_STR);
                $stmtCheck->execute();
                $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

                if ($existing) {
                    $particulierId = (int)$existing['id'];
                    // Mettre à jour les données
                    $sqlUpdate = "UPDATE particuliers SET nom = :nom, prenom = :prenom, 
                                  email = :email, rue = :adresse, nif = :nif,
                                  utilisateur = :utilisateur, site = :site
                                  WHERE id = :id";
                    $stmtUpdate = $this->pdo->prepare($sqlUpdate);
                    $stmtUpdate->execute([
                        ':id' => $particulierId,
                        ':nom' => $nom,
                        ':prenom' => $prenom,
                        ':email' => $data['email'] ?? '',
                        ':adresse' => $data['adresse'] ?? '',
                        ':nif' => $data['nif'] ?? '',
                        ':utilisateur' => $utilisateurId,
                        ':site' => $siteId
                    ]);
                }
            }

            if (!$particulierId) {
                $sqlInsert = "INSERT INTO particuliers (nom, prenom, telephone, email, rue, nif, utilisateur, site) 
                              VALUES (:nom, :prenom, :telephone, :email, :adresse, :nif, :utilisateur, :site)";
                $stmtInsert = $this->pdo->prepare($sqlInsert);
                $stmtInsert->execute([
                    ':nom' => $nom,
                    ':prenom' => $prenom,
                    ':telephone' => $telephone,
                    ':email' => $data['email'] ?? '',
                    ':adresse' => $data['adresse'] ?? '',
                    ':nif' => $data['nif'] ?? '',
                    ':utilisateur' => $utilisateurId,
                    ':site' => $siteId
                ]);
                $particulierId = (int)$this->pdo->lastInsertId();
            }

            // Chercher ou créer l'engin (par numéro de plaque)
            $enginId = null;
            $plaque = trim($data['numero_plaque'] ?? '');

            if (!empty($plaque)) {
                $sqlCheckEngin = "SELECT id FROM engins WHERE numero_plaque = :plaque LIMIT 1";
                $stmtCheckEngin = $this->pdo->prepare($sqlCheckEngin);
                $stmtCheckEngin->bindValue(':plaque', $plaque, PDO::PARAM_STR);
                $stmtCheckEngin->execute();
                $existingEngin = $stmtCheckEngin->fetch(PDO::FETCH_ASSOC);

                if ($existingEngin) {
                    $enginId = (int)$existingEngin['id'];
                    // Mettre à jour
                    $sqlUpdateEngin = "UPDATE engins SET 
                        marque = :marque, couleur = :couleur,
                        energie = :energie, usage_engin = :usage_engin,
                        puissance_fiscal = :puissance_fiscal,
                        annee_fabrication = :annee_fabrication,
                        annee_circulation = :annee_circulation,
                        numero_chassis = :numero_chassis,
                        numero_moteur = :numero_moteur,
                        type_engin = :type_engin
                        WHERE id = :id";
                    $stmtUpdateEngin = $this->pdo->prepare($sqlUpdateEngin);
                    $stmtUpdateEngin->execute([
                        ':id' => $enginId,
                        ':marque' => $data['marque'] ?? '',
                        ':couleur' => $data['couleur'] ?? '',
                        ':energie' => $data['energie'] ?? '',
                        ':usage_engin' => $data['usage_engin'] ?? '',
                        ':puissance_fiscal' => $data['puissance_fiscal'] ?? '',
                        ':annee_fabrication' => $data['annee_fabrication'] ?? '',
                        ':annee_circulation' => $data['annee_circulation'] ?? '',
                        ':numero_chassis' => $data['numero_chassis'] ?? '',
                        ':numero_moteur' => $data['numero_moteur'] ?? '',
                        ':type_engin' => $data['type_engin'] ?? ''
                    ]);
                }
            }

            if (!$enginId) {
                // Résoudre serie_id et serie_item_id à partir du numéro de plaque
                $serieId = 0;
                $serieItemId = 0;
                if (!empty($plaque)) {
                    // Retirer tous les espaces et tirets pour extraire préfixe/numéro
                    $plaqueNettoyee = preg_replace('/[\s\-]+/', '', $plaque);
                    if (preg_match('/^([A-Za-z]+)(\d+)$/', $plaqueNettoyee, $matches)) {
                        $prefixe = strtoupper($matches[1]);
                        $numero = (int)$matches[2];
                        $sqlSerie = "SELECT si.id as serie_item_id, si.serie_id 
                                     FROM serie_items si 
                                     INNER JOIN series s ON si.serie_id = s.id 
                                     WHERE s.nom_serie = :prefixe AND si.value = :numero 
                                     LIMIT 1";
                        $stmtSerie = $this->pdo->prepare($sqlSerie);
                        $stmtSerie->bindValue(':prefixe', $prefixe, PDO::PARAM_STR);
                        $stmtSerie->bindValue(':numero', $numero, PDO::PARAM_INT);
                        $stmtSerie->execute();
                        $serieData = $stmtSerie->fetch(PDO::FETCH_ASSOC);
                        if ($serieData) {
                            $serieId = (int)$serieData['serie_id'];
                            $serieItemId = (int)$serieData['serie_item_id'];
                        }
                    }
                }

                $impotId = $data['impot_id'] ?? '14';

                $sqlInsertEngin = "INSERT INTO engins (
                    numero_plaque, marque, couleur, energie, usage_engin,
                    puissance_fiscal, annee_fabrication, annee_circulation,
                    numero_chassis, numero_moteur, type_engin, particulier_id,
                    serie_id, serie_item_id, impot_id, utilisateur_id, site_id
                ) VALUES (
                    :numero_plaque, :marque, :couleur, :energie, :usage_engin,
                    :puissance_fiscal, :annee_fabrication, :annee_circulation,
                    :numero_chassis, :numero_moteur, :type_engin, :particulier_id,
                    :serie_id, :serie_item_id, :impot_id, :utilisateur_id, :site_id
                )";
                $stmtInsertEngin = $this->pdo->prepare($sqlInsertEngin);
                $stmtInsertEngin->execute([
                    ':numero_plaque' => $plaque,
                    ':marque' => $data['marque'] ?? '',
                    ':couleur' => $data['couleur'] ?? '',
                    ':energie' => $data['energie'] ?? '',
                    ':usage_engin' => $data['usage_engin'] ?? '',
                    ':puissance_fiscal' => $data['puissance_fiscal'] ?? '',
                    ':annee_fabrication' => $data['annee_fabrication'] ?? '',
                    ':annee_circulation' => $data['annee_circulation'] ?? '',
                    ':numero_chassis' => $data['numero_chassis'] ?? '',
                    ':numero_moteur' => $data['numero_moteur'] ?? '',
                    ':type_engin' => $data['type_engin'] ?? '',
                    ':particulier_id' => $particulierId,
                    ':serie_id' => $serieId,
                    ':serie_item_id' => $serieItemId,
                    ':impot_id' => $impotId,
                    ':utilisateur_id' => $utilisateurId,
                    ':site_id' => $siteId ?? 0
                ]);
                $enginId = (int)$this->pdo->lastInsertId();

                // Marquer le serie_item comme délivré (statut = 1)
                if ($serieItemId > 0) {
                    $sqlUpdateSerieItem = "UPDATE serie_items SET statut = '1' WHERE id = :id AND statut = '0'";
                    $stmtUpdateSerieItem = $this->pdo->prepare($sqlUpdateSerieItem);
                    $stmtUpdateSerieItem->execute([':id' => $serieItemId]);
                }
            }

            $this->commitSafe();

            return [
                "status" => "success",
                "message" => "Assujetti et engin enregistrés avec succès",
                "data" => [
                    "assujetti" => [
                        "id" => $particulierId,
                        "nom_complet" => $nomComplet,
                        "telephone" => $telephone,
                        "adresse" => $data['adresse'] ?? '',
                        "nif" => $data['nif'] ?? '',
                        "email" => $data['email'] ?? ''
                    ],
                    "engin" => [
                        "id" => $enginId,
                        "numero_plaque" => $plaque,
                        "marque" => $data['marque'] ?? '',
                        "modele" => $data['modele'] ?? '',
                        "couleur" => $data['couleur'] ?? '',
                        "energie" => $data['energie'] ?? '',
                        "usage_engin" => $data['usage_engin'] ?? '',
                        "puissance_fiscal" => $data['puissance_fiscal'] ?? '',
                        "annee_fabrication" => $data['annee_fabrication'] ?? '',
                        "annee_circulation" => $data['annee_circulation'] ?? '',
                        "numero_chassis" => $data['numero_chassis'] ?? '',
                        "numero_moteur" => $data['numero_moteur'] ?? '',
                        "type_engin" => $data['type_engin'] ?? ''
                    ]
                ]
            ];

        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("Erreur inscription assujetti/engin: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système: " . $e->getMessage()
            ];
        }
    }

    /**
     * Délivre une vignette
     */
    public function delivrerVignette($delivranceData)
    {
        try {
            $this->beginTransactionSafe();

            // Vérifier que le paiement existe et est complet
            $sqlVerifPaiement = "
                SELECT pi.*, e.numero_plaque, CONCAT(pt.nom, ' ', pt.prenom) AS nom_complet
                FROM paiements_immatriculation pi
                LEFT JOIN engins e ON pi.engin_id = e.id
                LEFT JOIN particuliers pt ON pi.particulier_id = pt.id
                WHERE pi.id = :id_paiement
                  AND pi.statut = 'completed'
                LIMIT 1
            ";
            
            $stmtVerif = $this->pdo->prepare($sqlVerifPaiement);
            $stmtVerif->bindValue(':id_paiement', $delivranceData['id_paiement'], PDO::PARAM_INT);
            $stmtVerif->execute();
            
            $paiement = $stmtVerif->fetch(PDO::FETCH_ASSOC);
            
            if (!$paiement) {
                throw new Exception("Paiement non trouvé ou non complet");
            }

            // Vérifier si déjà délivré
            // $sqlCheckDelivre = "
            //     SELECT COUNT(*) as count 
            //     FROM vignettes_delivrees 
            //     WHERE id_paiement = :id_paiement
            //       AND etat = 1
            // ";
            
            // $stmtCheck = $this->pdo->prepare($sqlCheckDelivre);
            // $stmtCheck->bindValue(':id_paiement', $delivranceData['id_paiement'], PDO::PARAM_INT);
            // $stmtCheck->execute();
            // $dejaDelivre = $stmtCheck->fetch(PDO::FETCH_ASSOC);
            
            // if ($dejaDelivre['count'] > 0) {
            //     throw new Exception("Cette vignette a déjà été délivrée");
            // }

            // Générer un code de vignette unique
            $codeVignette = "VGN-" . date('Y') . "-" . 
                           strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8)) . "-" . 
                           str_pad($delivranceData['id_paiement'], 6, '0', STR_PAD_LEFT);
            
            // Calculer la date de validité (6 mois à partir d'aujourd'hui)
            $dureeMois = isset($delivranceData['duree_mois']) ? (int)$delivranceData['duree_mois'] : 6;
            $dateValidite = date('Y-m-d', strtotime("+{$dureeMois} months"));
            $typeMouvement = $delivranceData['type_mouvement'] ?? 'delivrance';
            $impotId = $delivranceData['impot_id'] ?? $paiement['impot_id'] ?? null;
            
            // Insérer dans la table des vignettes délivrées
            $numeroVignettePhysique = $delivranceData['numero_vignette'] ?? null;

            $sqlInsert = "
                INSERT INTO vignettes_delivrees (
                    id_paiement,
                    impot_id,
                    type_mouvement,
                    duree_mois,
                    engin_id,
                    particulier_id,
                    code_vignette,
                    date_delivrance,
                    date_validite,
                    utilisateur_delivrance_id,
                    utilisateur_delivrance_nom,
                    site_id,
                    etat,
                    date_creation,
                    numero_vignette
                ) VALUES (
                    :id_paiement,
                    :impot_id,
                    :type_mouvement,
                    :duree_mois,
                    :engin_id,
                    :particulier_id,
                    :code_vignette,
                    NOW(),
                    :date_validite,
                    :utilisateur_id,
                    :utilisateur_name,
                    :site_id,
                    1,
                    NOW(),
                    :numero_vignette
                )
            ";
            
            $stmtInsert = $this->pdo->prepare($sqlInsert);
            $stmtInsert->bindValue(':id_paiement', $delivranceData['id_paiement'], PDO::PARAM_INT);
            $stmtInsert->bindValue(':impot_id', $impotId, $impotId ? PDO::PARAM_INT : PDO::PARAM_NULL);
            $stmtInsert->bindValue(':type_mouvement', $typeMouvement, PDO::PARAM_STR);
            $stmtInsert->bindValue(':duree_mois', $dureeMois, PDO::PARAM_INT);
            $stmtInsert->bindValue(':engin_id', $delivranceData['engin_id'], PDO::PARAM_INT);
            $stmtInsert->bindValue(':particulier_id', $delivranceData['particulier_id'], PDO::PARAM_INT);
            $stmtInsert->bindValue(':code_vignette', $codeVignette, PDO::PARAM_STR);
            $stmtInsert->bindValue(':date_validite', $dateValidite, PDO::PARAM_STR);
            $stmtInsert->bindValue(':utilisateur_id', $delivranceData['utilisateur_id'], PDO::PARAM_INT);
            $stmtInsert->bindValue(':utilisateur_name', $delivranceData['utilisateur_name'], PDO::PARAM_STR);
            $stmtInsert->bindValue(':site_id', $delivranceData['site_id'], PDO::PARAM_INT);
            $stmtInsert->bindValue(':numero_vignette', $numeroVignettePhysique, $numeroVignettePhysique ? PDO::PARAM_STR : PDO::PARAM_NULL);
            
            if (!$stmtInsert->execute()) {
                $errorInfo = $stmtInsert->errorInfo();
                throw new Exception("Erreur insertion délivrance: " . ($errorInfo[2] ?? 'Erreur inconnue'));
            }
            
            $idDelivrance = $this->pdo->lastInsertId();

            // Mettre à jour le statut du paiement bancaire à 'livre'
            $sqlUpdateStatut = "UPDATE paiements_bancaires SET statut = 'livre' WHERE id_paiement = :id_paiement AND statut = 'complete'";
            $stmtUpdate = $this->pdo->prepare($sqlUpdateStatut);
            $stmtUpdate->bindValue(':id_paiement', $delivranceData['id_paiement'], PDO::PARAM_INT);
            $stmtUpdate->execute();

            $this->commitSafe();

            // Retourner les données de confirmation
            return [
                "status" => "success",
                "message" => "Vignette délivrée avec succès",
                "data" => [
                    "delivrance" => [
                        "id" => $idDelivrance,
                        "id_paiement" => $delivranceData['id_paiement'],
                        "date_delivrance" => date('Y-m-d H:i:s'),
                        "utilisateur_delivrance" => $delivranceData['utilisateur_name'],
                        "code_vignette" => $codeVignette,
                        "date_validite" => $dateValidite
                    ],
                    "paiement" => [
                        "id" => $paiement['id'],
                        "reference" => "P" . str_pad($paiement['id'], 8, '0', STR_PAD_LEFT),
                        "montant" => $paiement['montant']
                    ],
                    "engin" => [
                        "numero_plaque" => $paiement['numero_plaque'],
                        "marque" => $paiement['marque'] ?? '',
                        "modele" => $paiement['modele'] ?? ''
                    ],
                    "assujetti" => [
                        "nom_complet" => $paiement['nom_complet'],
                        "telephone" => $paiement['telephone'] ?? ''
                    ],
                    "site" => [
                        "nom_site" => "Site de délivrance", // À récupérer de la table sites
                        "code_site" => "DLV-" . date('Y')
                    ]
                ]
            ];

        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("Erreur délivrance vignette: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système: " . $e->getMessage()
            ];
        }
    }

    /**
     * Liste les vignettes avec filtres (pour la page de suppression)
     */
    public function listerVignettes($filtres = [])
    {
        try {
            $conditions = ["vd.etat = 1"];
            $params = [];

            if (!empty($filtres['site_id'])) {
                $conditions[] = "vd.site_id = :site_id";
                $params[':site_id'] = (int)$filtres['site_id'];
            }

            if (!empty($filtres['type_mouvement'])) {
                $conditions[] = "vd.type_mouvement = :type_mouvement";
                $params[':type_mouvement'] = $filtres['type_mouvement'];
            }

            if (!empty($filtres['date_debut'])) {
                $conditions[] = "vd.date_delivrance >= :date_debut";
                $params[':date_debut'] = $filtres['date_debut'];
            }

            if (!empty($filtres['date_fin'])) {
                $conditions[] = "vd.date_delivrance <= :date_fin";
                $params[':date_fin'] = $filtres['date_fin'] . ' 23:59:59';
            }

            if (!empty($filtres['recherche'])) {
                $conditions[] = "(e.numero_plaque LIKE :recherche OR CONCAT(pt.nom, ' ', pt.prenom) LIKE :recherche2 OR pt.telephone LIKE :recherche3 OR vd.code_vignette LIKE :recherche4)";
                $params[':recherche'] = '%' . $filtres['recherche'] . '%';
                $params[':recherche2'] = '%' . $filtres['recherche'] . '%';
                $params[':recherche3'] = '%' . $filtres['recherche'] . '%';
                $params[':recherche4'] = '%' . $filtres['recherche'] . '%';
            }

            $whereClause = implode(' AND ', $conditions);

            $sql = "
                SELECT 
                    vd.id,
                    vd.id_paiement,
                    vd.impot_id,
                    vd.type_mouvement,
                    vd.duree_mois,
                    vd.code_vignette,
                    vd.date_delivrance,
                    vd.date_validite,
                    vd.date_creation,
                    e.id as engin_id,
                    e.numero_plaque,
                    e.marque,
                    '' as modele,
                    e.couleur,
                    e.energie,
                    e.usage_engin,
                    e.puissance_fiscal,
                    e.annee_fabrication,
                    e.numero_chassis,
                    e.numero_moteur,
                    e.type_engin,
                    pt.id as particulier_id,
                    CONCAT(pt.nom, ' ', pt.prenom) AS nom_complet,
                    pt.telephone,
                    pt.rue AS adresse,
                    pt.nif,
                    pt.email,
                    pi.montant,
                    pi.mode_paiement,
                    pi.date_paiement,
                    s.nom as site_nom,
                    s.code as site_code,
                    vd.utilisateur_delivrance_nom
                FROM vignettes_delivrees vd
                INNER JOIN engins e ON vd.engin_id = e.id
                INNER JOIN particuliers pt ON vd.particulier_id = pt.id
                INNER JOIN paiements_immatriculation pi ON vd.id_paiement = pi.id
                INNER JOIN sites s ON vd.site_id = s.id
                WHERE {$whereClause}
                ORDER BY vd.date_delivrance DESC
            ";

            $stmt = $this->pdo->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();

            $vignettes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Récupérer la liste des sites pour le filtre
            $sqlSites = "SELECT id, nom, code FROM sites WHERE actif = 1 ORDER BY nom";
            $stmtSites = $this->pdo->prepare($sqlSites);
            $stmtSites->execute();
            $sites = $stmtSites->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "data" => [
                    "vignettes" => $vignettes,
                    "sites" => $sites
                ]
            ];

        } catch (Exception $e) {
            error_log("Erreur listerVignettes: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système: " . $e->getMessage()
            ];
        }
    }

    /**
     * Supprime une vignette et les données liées
     * Cascade : repartition → paiements_bancaires → vignettes_delivrees → paiements_immatriculation → engin
     * Le particulier n'est PAS supprimé
     */
    public function supprimerVignette($id, $data)
    {
        try {
            $this->beginTransactionSafe();

            // Vérifier que la vignette existe et récupérer les infos liées
            $sqlCheck = "SELECT id, code_vignette, engin_id, particulier_id, id_paiement, impot_id FROM vignettes_delivrees WHERE id = :id AND etat = 1";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->bindValue(':id', $id, PDO::PARAM_INT);
            $stmtCheck->execute();
            $vignette = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if (!$vignette) {
                $this->rollbackSafe();
                return [
                    "status" => "error",
                    "message" => "Vignette non trouvée ou déjà supprimée"
                ];
            }

            $paiementId = (int)$vignette['id_paiement'];
            $enginId = (int)$vignette['engin_id'];
            $impotId = (int)$vignette['impot_id'];

            // 1. Supprimer la répartition liée au paiement
            $sqlDelRepartition = "DELETE FROM repartition_paiements_immatriculation WHERE id_paiement_immatriculation = :paiement_id";
            $stmtDelRepartition = $this->pdo->prepare($sqlDelRepartition);
            $stmtDelRepartition->bindValue(':paiement_id', $paiementId, PDO::PARAM_INT);
            $stmtDelRepartition->execute();

            // 2. Gérer les paiements bancaires liés (décrémenter ou supprimer)
            $sqlFindBancaire = "
                SELECT id, donnees_initiation, donnees_confirmation, statut
                FROM paiements_bancaires
                WHERE id_paiement = :paiement_id
                LIMIT 1
                FOR UPDATE
            ";
            $stmtFindBancaire = $this->pdo->prepare($sqlFindBancaire);
            $stmtFindBancaire->bindValue(':paiement_id', $paiementId, PDO::PARAM_INT);
            $stmtFindBancaire->execute();
            $paiementBancaire = $stmtFindBancaire->fetch(PDO::FETCH_ASSOC);

            if ($paiementBancaire) {
                $donneesInitiation = json_decode($paiementBancaire['donnees_initiation'] ?? '{}', true);
                $donneesConfirmation = json_decode($paiementBancaire['donnees_confirmation'] ?? '{}', true);
                $nombreDeclarations = (int)($donneesInitiation['nombre_declarations'] ?? 1);
                $livres = (int)($donneesConfirmation['livres'] ?? 0);

                if ($nombreDeclarations > 1 && $livres > 0) {
                    // Paiement groupé → décrémenter le compteur
                    $livres--;
                    $donneesConfirmation['livres'] = $livres;
                    $nouveauStatut = ($livres >= $nombreDeclarations) ? 'livre' : 'complete';

                    $sqlUpdateBancaire = "
                        UPDATE paiements_bancaires
                        SET donnees_confirmation = :donnees_confirmation,
                            statut = :statut
                        WHERE id = :id
                    ";
                    $stmtUpdateBancaire = $this->pdo->prepare($sqlUpdateBancaire);
                    $stmtUpdateBancaire->bindValue(':donnees_confirmation', json_encode($donneesConfirmation), PDO::PARAM_STR);
                    $stmtUpdateBancaire->bindValue(':statut', $nouveauStatut, PDO::PARAM_STR);
                    $stmtUpdateBancaire->bindValue(':id', $paiementBancaire['id'], PDO::PARAM_INT);
                    $stmtUpdateBancaire->execute();
                } else {
                    // Paiement simple → supprimer
                    $sqlDelBancaire = "DELETE FROM paiements_bancaires WHERE id = :id";
                    $stmtDelBancaire = $this->pdo->prepare($sqlDelBancaire);
                    $stmtDelBancaire->bindValue(':id', $paiementBancaire['id'], PDO::PARAM_INT);
                    $stmtDelBancaire->execute();
                }
            }

            // 3. Supprimer la vignette délivrée
            $sqlDelVignette = "DELETE FROM vignettes_delivrees WHERE id = :id";
            $stmtDelVignette = $this->pdo->prepare($sqlDelVignette);
            $stmtDelVignette->bindValue(':id', $id, PDO::PARAM_INT);
            $stmtDelVignette->execute();

            // 4. Supprimer le paiement immatriculation
            $sqlDelPaiement = "DELETE FROM paiements_immatriculation WHERE id = :paiement_id";
            $stmtDelPaiement = $this->pdo->prepare($sqlDelPaiement);
            $stmtDelPaiement->bindValue(':paiement_id', $paiementId, PDO::PARAM_INT);
            $stmtDelPaiement->execute();

            // 5. Supprimer l'engin par son id et l'impot_id lié à la vignette
            $sqlDelEngin = "DELETE FROM engins WHERE id = :engin_id AND impot_id = :impot_id";
            $stmtDelEngin = $this->pdo->prepare($sqlDelEngin);
            $stmtDelEngin->bindValue(':engin_id', $enginId, PDO::PARAM_INT);
            $stmtDelEngin->bindValue(':impot_id', $impotId, PDO::PARAM_STR);
            $stmtDelEngin->execute();

            // Le particulier n'est PAS supprimé

            $this->commitSafe();

            return [
                "status" => "success",
                "message" => "Vignette et données liées supprimées avec succès",
                "data" => [
                    "id" => $id,
                    "code_vignette" => $vignette['code_vignette'],
                    "date_suppression" => date('Y-m-d H:i:s'),
                    "motif" => $data['motif'] ?? 'Non spécifié'
                ]
            ];

        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("Erreur supprimerVignette: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système: " . $e->getMessage()
            ];
        }
    }

    /**
     * Récupère les vignettes à renouveler (proches de l'expiration ou expirées)
     */
    public function getVignettesARenouveler($filtres = [])
    {
        try {
            $seuilJours = isset($filtres['seuil_jours']) ? (int)$filtres['seuil_jours'] : 30;
            
            $conditions = ["vd.etat = 1"];
            $params = [];

            // Filtrer par statut d'expiration
            if (!empty($filtres['statut_expiration'])) {
                if ($filtres['statut_expiration'] === 'expire') {
                    $conditions[] = "vd.date_validite < CURDATE()";
                } elseif ($filtres['statut_expiration'] === 'proche') {
                    $conditions[] = "vd.date_validite >= CURDATE() AND vd.date_validite <= DATE_ADD(CURDATE(), INTERVAL :seuil DAY)";
                    $params[':seuil'] = $seuilJours;
                }
                // Si 'tous' ou autre valeur: pas de filtre sur date_validite
            }
            // Par défaut (pas de filtre): afficher toutes les vignettes actives

            if (!empty($filtres['site_id'])) {
                $conditions[] = "vd.site_id = :site_id";
                $params[':site_id'] = (int)$filtres['site_id'];
            }

            if (!empty($filtres['recherche'])) {
                $conditions[] = "(e.numero_plaque LIKE :recherche OR CONCAT(pt.nom, ' ', pt.prenom) LIKE :recherche2)";
                $params[':recherche'] = '%' . $filtres['recherche'] . '%';
                $params[':recherche2'] = '%' . $filtres['recherche'] . '%';
            }

            $whereClause = implode(' AND ', $conditions);

            $sql = "
                SELECT 
                    vd.id,
                    vd.id_paiement,
                    vd.impot_id,
                    vd.type_mouvement,
                    vd.duree_mois,
                    vd.code_vignette,
                    vd.date_delivrance,
                    vd.date_validite,
                    DATEDIFF(vd.date_validite, CURDATE()) as jours_restants,
                    e.id as engin_id,
                    e.numero_plaque,
                    e.marque,
                    '' as modele,
                    pt.id as particulier_id,
                    CONCAT(pt.nom, ' ', pt.prenom) AS nom_complet,
                    pt.rue AS adresse,
                    pt.telephone,
                    pi.montant,
                    s.nom as site_nom
                FROM vignettes_delivrees vd
                INNER JOIN engins e ON vd.engin_id = e.id
                INNER JOIN particuliers pt ON vd.particulier_id = pt.id
                INNER JOIN paiements_immatriculation pi ON vd.id_paiement = pi.id
                INNER JOIN sites s ON vd.site_id = s.id
                WHERE {$whereClause}
                ORDER BY vd.date_validite ASC
            ";

            $stmt = $this->pdo->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();

            return [
                "status" => "success",
                "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ];

        } catch (Exception $e) {
            error_log("Erreur getVignettesARenouveler: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système: " . $e->getMessage()
            ];
        }
    }

    /**
     * Renouvelle une vignette existante
     */
    public function renouvelerVignette($data)
    {
        try {
            $this->beginTransactionSafe();

            $vignetteId = (int)($data['vignette_id'] ?? 0);

            // Vérifier la vignette existante
            $sqlCheck = "SELECT * FROM vignettes_delivrees WHERE id = :id AND etat = 1";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->bindValue(':id', $vignetteId, PDO::PARAM_INT);
            $stmtCheck->execute();
            $ancienneVignette = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if (!$ancienneVignette) {
                $this->rollbackSafe();
                return [
                    "status" => "error",
                    "message" => "Vignette non trouvée"
                ];
            }

            // Récupérer le site_id réel via utilisateur
            $sqlSite = "SELECT s.id AS id
                        FROM sites s 
                        INNER JOIN utilisateurs u ON s.id = u.site_affecte_id 
                        WHERE u.id = :utilisateur 
                        AND s.actif = 1 
                        LIMIT 1";
            $stmtSite = $this->pdo->prepare($sqlSite);
            $stmtSite->bindValue(':utilisateur', $data['utilisateur_id'], PDO::PARAM_INT);
            $stmtSite->execute();
            $siteData = $stmtSite->fetch(PDO::FETCH_ASSOC);
            $siteId = $siteData ? (int)$siteData['id'] : (int)$ancienneVignette['site_id'];

            $montant = isset($data['montant']) ? (float)$data['montant'] : 15.00;
            $impotId = $data['impot_id'] ?? $ancienneVignette['impot_id'] ?? null;
            $dureeMois = isset($data['duree_mois']) ? (int)$data['duree_mois'] : 6;
            $taux_cdf = isset($data['taux_cdf']) ? (float)$data['taux_cdf'] : 0;

            // 1. CRÉER UN NOUVEAU PAIEMENT
            $sqlPaiement = "
                INSERT INTO paiements_immatriculation (
                    engin_id, particulier_id, montant, montant_initial,
                    impot_id, mode_paiement, statut, date_paiement,
                    utilisateur_id, site_id, nombre_plaques, etat
                ) VALUES (
                    :engin_id, :particulier_id, :montant, :montant_initial,
                    :impot_id, 'espece', 'completed', NOW(),
                    :utilisateur_id, :site_id, 1, 1
                )
            ";
            $stmtPaiement = $this->pdo->prepare($sqlPaiement);
            $stmtPaiement->bindValue(':engin_id', (int)$ancienneVignette['engin_id'], PDO::PARAM_INT);
            $stmtPaiement->bindValue(':particulier_id', (int)$ancienneVignette['particulier_id'], PDO::PARAM_INT);
            $stmtPaiement->bindValue(':montant', $montant, PDO::PARAM_STR);
            $stmtPaiement->bindValue(':montant_initial', $montant, PDO::PARAM_STR);
            $stmtPaiement->bindValue(':impot_id', $impotId, PDO::PARAM_INT);
            $stmtPaiement->bindValue(':utilisateur_id', (int)$data['utilisateur_id'], PDO::PARAM_INT);
            $stmtPaiement->bindValue(':site_id', $siteId, PDO::PARAM_INT);

            if (!$stmtPaiement->execute()) {
                throw new Exception("Erreur création paiement renouvellement");
            }

            $paiementId = $this->pdo->lastInsertId();

            // 2. RÉPARTIR LE MONTANT ENTRE LES BÉNÉFICIAIRES
            $this->repartirMontant($paiementId, $impotId, $montant);

            // 3. DÉSACTIVER L'ANCIENNE VIGNETTE
            $sqlDesactiver = "UPDATE vignettes_delivrees SET etat = 0 WHERE id = :id";
            $stmtDesactiver = $this->pdo->prepare($sqlDesactiver);
            $stmtDesactiver->bindValue(':id', $vignetteId, PDO::PARAM_INT);
            $stmtDesactiver->execute();

            // 4. CRÉER LA NOUVELLE VIGNETTE
            $codeVignette = "VGN-REN-" . date('Y') . "-" . 
                strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8)) . "-" . 
                str_pad($paiementId, 6, '0', STR_PAD_LEFT);
            $dateValidite = date('Y-m-d', strtotime("+{$dureeMois} months"));

            $numeroVignettePhysique = $data['numero_vignette'] ?? null;

            $sqlInsert = "
                INSERT INTO vignettes_delivrees (
                    id_paiement, impot_id, type_mouvement, duree_mois,
                    engin_id, particulier_id, code_vignette,
                    date_delivrance, date_validite,
                    utilisateur_delivrance_id, utilisateur_delivrance_nom,
                    site_id, etat, date_creation, numero_vignette
                ) VALUES (
                    :id_paiement, :impot_id, 'renouvellement', :duree_mois,
                    :engin_id, :particulier_id, :code_vignette,
                    NOW(), :date_validite,
                    :utilisateur_id, :utilisateur_name,
                    :site_id, 1, NOW(), :numero_vignette
                )
            ";

            $stmtInsert = $this->pdo->prepare($sqlInsert);
            $stmtInsert->bindValue(':id_paiement', $paiementId, PDO::PARAM_INT);
            $stmtInsert->bindValue(':impot_id', $impotId, PDO::PARAM_INT);
            $stmtInsert->bindValue(':duree_mois', $dureeMois, PDO::PARAM_INT);
            $stmtInsert->bindValue(':engin_id', (int)$ancienneVignette['engin_id'], PDO::PARAM_INT);
            $stmtInsert->bindValue(':particulier_id', (int)$ancienneVignette['particulier_id'], PDO::PARAM_INT);
            $stmtInsert->bindValue(':code_vignette', $codeVignette, PDO::PARAM_STR);
            $stmtInsert->bindValue(':date_validite', $dateValidite, PDO::PARAM_STR);
            $stmtInsert->bindValue(':utilisateur_id', (int)$data['utilisateur_id'], PDO::PARAM_INT);
            $stmtInsert->bindValue(':utilisateur_name', $data['utilisateur_name'] ?? 'Caissier', PDO::PARAM_STR);
            $stmtInsert->bindValue(':site_id', $siteId, PDO::PARAM_INT);
            $stmtInsert->bindValue(':numero_vignette', $numeroVignettePhysique, $numeroVignettePhysique ? PDO::PARAM_STR : PDO::PARAM_NULL);

            if (!$stmtInsert->execute()) {
                throw new Exception("Erreur insertion renouvellement");
            }

            $newId = $this->pdo->lastInsertId();

            $this->commitSafe();

            return [
                "status" => "success",
                "message" => "Vignette renouvelée avec succès",
                "data" => [
                    "id" => $newId,
                    "paiement_id" => $paiementId,
                    "code_vignette" => $codeVignette,
                    "date_validite" => $dateValidite,
                    "duree_mois" => $dureeMois,
                    "montant" => $montant,
                    "ancienne_vignette_id" => $vignetteId
                ]
            ];

        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("Erreur renouvelerVignette: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système: " . $e->getMessage()
            ];
        }
    }

    /**
     * Vérifie une référence bancaire pour la délivrance groupée
     * Retourne le nombre total de déclarations, le nombre déjà livré, et le restant
     */
    public function verifierReferenceBancaire($reference, $impotIdAttendu = null)
    {
        try {
            $sql = "
                SELECT 
                    pb.id,
                    pb.reference_bancaire,
                    pb.statut,
                    pb.id_paiement,
                    pb.donnees_initiation,
                    pb.donnees_confirmation,
                    pb.date_creation,
                    pi.impot_id AS impot_id_paiement
                FROM paiements_bancaires pb
                INNER JOIN paiements_immatriculation pi ON pi.id = pb.id_paiement
                WHERE pb.reference_bancaire = :reference
                  AND pb.statut IN ('complete', 'livre')
                LIMIT 1
            ";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':reference', $reference, PDO::PARAM_STR);
            $stmt->execute();
            
            $paiementBancaire = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$paiementBancaire) {
                return [
                    "status" => "error",
                    "message" => "Aucun paiement bancaire trouvé avec cette référence"
                ];
            }

            // Vérification de la taxe : l'impot_id du paiement doit correspondre à celui attendu
            $impotIdReel = (int)$paiementBancaire['impot_id_paiement'];
            if ($impotIdAttendu !== null && $impotIdReel !== (int)$impotIdAttendu) {
                return [
                    "status" => "error",
                    "message" => "Cette référence correspond à une autre taxe (taxe n°$impotIdReel). Elle ne peut pas être utilisée pour cette opération."
                ];
            }

            // Décoder les données d'initiation pour récupérer nombre_declarations
            $donneesInitiation = json_decode($paiementBancaire['donnees_initiation'] ?? '{}', true);
            $nombreDeclarations = (int)($donneesInitiation['nombre_declarations'] ?? 1);
            $impotId = $impotIdReel;
            $montant = $donneesInitiation['montant'] ?? 0;

            // Décoder les données de confirmation pour récupérer le nombre livré
            $donneesConfirmation = json_decode($paiementBancaire['donnees_confirmation'] ?? '{}', true);
            $livres = (int)($donneesConfirmation['livres'] ?? 0);

            $restant = $nombreDeclarations - $livres;

            if ($restant <= 0) {
                return [
                    "status" => "error",
                    "message" => "Toutes les vignettes de cette référence ont déjà été délivrées ($livres/$nombreDeclarations)"
                ];
            }

            return [
                "status" => "success",
                "message" => "Référence vérifiée. $restant vignette(s) restante(s) à délivrer.",
                "data" => [
                    "paiement_bancaire_id" => $paiementBancaire['id'],
                    "reference_bancaire" => $paiementBancaire['reference_bancaire'],
                    "id_paiement" => $paiementBancaire['id_paiement'],
                    "statut" => $paiementBancaire['statut'],
                    "nombre_declarations" => $nombreDeclarations,
                    "livres" => $livres,
                    "restant" => $restant,
                    "impot_id" => $impotId,
                    "montant_total" => $montant,
                    "date_creation" => $paiementBancaire['date_creation']
                ]
            ];

        } catch (Exception $e) {
            error_log("Erreur vérification référence bancaire: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système: " . $e->getMessage()
            ];
        }
    }

    /**
     * Délivre une vignette dans le cadre d'une délivrance groupée (paiement bancaire)
     * Incrémente le compteur livres dans donnees_confirmation
     * Marque comme 'livre' quand toutes les vignettes sont délivrées
     */
    public function delivrerVignetteGroupee($data)
    {
        try {
            $this->beginTransactionSafe();

            $referenceBancaire = trim($data['reference_bancaire'] ?? '');
            $numeroVignette = trim($data['numero_vignette'] ?? '');
            $enginId = (int)($data['engin_id'] ?? 0);
            $particulierId = (int)($data['particulier_id'] ?? 0);
            $utilisateurId = (int)($data['utilisateur_id'] ?? 0);
            $utilisateurName = $data['utilisateur_name'] ?? '';
            $impotId = $data['impot_id'] ?? null;

            if (empty($referenceBancaire)) {
                throw new Exception("Référence bancaire requise");
            }
            if (empty($numeroVignette)) {
                throw new Exception("Numéro de vignette requis");
            }
            if ($enginId <= 0 || $particulierId <= 0) {
                throw new Exception("Engin et particulier requis");
            }

            // Vérifier unicité du numéro de vignette
            $sqlCheckVignette = "SELECT id FROM vignettes_delivrees WHERE numero_vignette = :numero_vignette AND etat = 1 LIMIT 1";
            $stmtCheckVignette = $this->pdo->prepare($sqlCheckVignette);
            $stmtCheckVignette->bindValue(':numero_vignette', $numeroVignette, PDO::PARAM_STR);
            $stmtCheckVignette->execute();
            if ($stmtCheckVignette->fetch(PDO::FETCH_ASSOC)) {
                throw new Exception("Le numéro de vignette '$numeroVignette' est déjà utilisé");
            }

            // 1. Récupérer le paiement bancaire avec verrouillage
            $sqlPB = "
                SELECT id, reference_bancaire, statut, id_paiement, donnees_initiation, donnees_confirmation
                FROM paiements_bancaires
                WHERE reference_bancaire = :reference
                  AND statut IN ('complete', 'livre')
                LIMIT 1
                FOR UPDATE
            ";
            $stmtPB = $this->pdo->prepare($sqlPB);
            $stmtPB->bindValue(':reference', $referenceBancaire, PDO::PARAM_STR);
            $stmtPB->execute();
            $pb = $stmtPB->fetch(PDO::FETCH_ASSOC);

            if (!$pb) {
                throw new Exception("Paiement bancaire non trouvé ou déjà terminé");
            }

            $donneesInitiation = json_decode($pb['donnees_initiation'] ?? '{}', true);
            $donneesConfirmation = json_decode($pb['donnees_confirmation'] ?? '{}', true);
            $nombreDeclarations = (int)($donneesInitiation['nombre_declarations'] ?? 1);
            $livres = (int)($donneesConfirmation['livres'] ?? 0);

            if ($livres >= $nombreDeclarations) {
                throw new Exception("Toutes les vignettes ont déjà été délivrées ($livres/$nombreDeclarations)");
            }

            // 2. Récupérer le site de l'utilisateur
            $siteId = 0;
            if ($utilisateurId > 0) {
                $sqlSite = "SELECT s.id FROM sites s INNER JOIN utilisateurs u ON s.id = u.site_affecte_id WHERE u.id = :uid AND s.actif = 1 LIMIT 1";
                $stmtSite = $this->pdo->prepare($sqlSite);
                $stmtSite->bindValue(':uid', $utilisateurId, PDO::PARAM_INT);
                $stmtSite->execute();
                $siteData = $stmtSite->fetch(PDO::FETCH_ASSOC);
                $siteId = $siteData ? (int)$siteData['id'] : 0;
            }

            // 3. Générer le code vignette et calculer la date de validité
            $codeVignette = "VGN-" . date('Y') . "-" . 
                           strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8)) . "-" . 
                           str_pad($pb['id_paiement'], 6, '0', STR_PAD_LEFT);
            $dureeMois = 6;
            $dateValidite = date('Y-m-d', strtotime("+{$dureeMois} months"));

            // 4. Insérer dans vignettes_delivrees
            $sqlInsert = "
                INSERT INTO vignettes_delivrees (
                    id_paiement, impot_id, type_mouvement, duree_mois,
                    engin_id, particulier_id, code_vignette,
                    date_delivrance, date_validite,
                    utilisateur_delivrance_id, utilisateur_delivrance_nom,
                    site_id, etat, date_creation, numero_vignette
                ) VALUES (
                    :id_paiement, :impot_id, 'delivrance', :duree_mois,
                    :engin_id, :particulier_id, :code_vignette,
                    NOW(), :date_validite,
                    :utilisateur_id, :utilisateur_name,
                    :site_id, 1, NOW(), :numero_vignette
                )
            ";
            $stmtInsert = $this->pdo->prepare($sqlInsert);
            $stmtInsert->bindValue(':id_paiement', $pb['id_paiement'], PDO::PARAM_INT);
            $stmtInsert->bindValue(':impot_id', $impotId, $impotId ? PDO::PARAM_INT : PDO::PARAM_NULL);
            $stmtInsert->bindValue(':duree_mois', $dureeMois, PDO::PARAM_INT);
            $stmtInsert->bindValue(':engin_id', $enginId, PDO::PARAM_INT);
            $stmtInsert->bindValue(':particulier_id', $particulierId, PDO::PARAM_INT);
            $stmtInsert->bindValue(':code_vignette', $codeVignette, PDO::PARAM_STR);
            $stmtInsert->bindValue(':date_validite', $dateValidite, PDO::PARAM_STR);
            $stmtInsert->bindValue(':utilisateur_id', $utilisateurId, PDO::PARAM_INT);
            $stmtInsert->bindValue(':utilisateur_name', $utilisateurName, PDO::PARAM_STR);
            $stmtInsert->bindValue(':site_id', $siteId, PDO::PARAM_INT);
            $stmtInsert->bindValue(':numero_vignette', $numeroVignette, PDO::PARAM_STR);

            if (!$stmtInsert->execute()) {
                throw new Exception("Erreur insertion vignette délivrée");
            }

            $idDelivrance = $this->pdo->lastInsertId();

            // 5. Incrémenter livres dans donnees_confirmation
            $livres++;
            $donneesConfirmation['livres'] = $livres;
            $donneesConfirmationJson = json_encode($donneesConfirmation);

            // Déterminer le nouveau statut
            $nouveauStatut = ($livres >= $nombreDeclarations) ? 'livre' : 'complete';

            $sqlUpdate = "
                UPDATE paiements_bancaires
                SET donnees_confirmation = :donnees_confirmation,
                    statut = :statut
                WHERE id = :id
            ";
            $stmtUpdate = $this->pdo->prepare($sqlUpdate);
            $stmtUpdate->bindValue(':donnees_confirmation', $donneesConfirmationJson, PDO::PARAM_STR);
            $stmtUpdate->bindValue(':statut', $nouveauStatut, PDO::PARAM_STR);
            $stmtUpdate->bindValue(':id', $pb['id'], PDO::PARAM_INT);
            $stmtUpdate->execute();

            // 6. Récupérer les infos pour la réponse
            $sqlEngin = "SELECT numero_plaque, marque FROM engins WHERE id = :id LIMIT 1";
            $stmtE = $this->pdo->prepare($sqlEngin);
            $stmtE->bindValue(':id', $enginId, PDO::PARAM_INT);
            $stmtE->execute();
            $enginInfo = $stmtE->fetch(PDO::FETCH_ASSOC) ?: ['numero_plaque' => '', 'marque' => ''];

            $sqlPart = "SELECT CONCAT(nom, ' ', prenom) AS nom_complet, telephone FROM particuliers WHERE id = :id LIMIT 1";
            $stmtP = $this->pdo->prepare($sqlPart);
            $stmtP->bindValue(':id', $particulierId, PDO::PARAM_INT);
            $stmtP->execute();
            $partInfo = $stmtP->fetch(PDO::FETCH_ASSOC) ?: ['nom_complet' => '', 'telephone' => ''];

            $this->commitSafe();

            return [
                "status" => "success",
                "message" => "Vignette délivrée avec succès ($livres/$nombreDeclarations)",
                "data" => [
                    "delivrance" => [
                        "id" => $idDelivrance,
                        "code_vignette" => $codeVignette,
                        "numero_vignette" => $numeroVignette,
                        "date_delivrance" => date('Y-m-d H:i:s'),
                        "date_validite" => $dateValidite,
                        "utilisateur_delivrance" => $utilisateurName
                    ],
                    "compteur" => [
                        "total" => $nombreDeclarations,
                        "livres" => $livres,
                        "restant" => $nombreDeclarations - $livres
                    ],
                    "engin" => [
                        "numero_plaque" => $enginInfo['numero_plaque'],
                        "marque" => $enginInfo['marque']
                    ],
                    "assujetti" => [
                        "nom_complet" => $partInfo['nom_complet'],
                        "telephone" => $partInfo['telephone']
                    ],
                    "reference_bancaire" => $referenceBancaire,
                    "tout_livre" => ($livres >= $nombreDeclarations)
                ]
            ];

        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("Erreur délivrance vignette groupée: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur: " . $e->getMessage()
            ];
        }
    }
}
?>