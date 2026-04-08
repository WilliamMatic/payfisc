<?php
// class/AssuranceMoto.php
require_once 'Connexion.php';

/**
 * Classe AssuranceMoto - Gestion indépendante des assurances moto
 * Table: assurances_moto (séparée de vignettes_delivrees)
 */
class AssuranceMoto extends Connexion
{
    private $transactionActive = false;

    private function beginTransactionSafe()
    {
        try {
            if (!$this->transactionActive) {
                $this->pdo->beginTransaction();
                $this->transactionActive = true;
            }
        } catch (PDOException $e) {
            error_log("AssuranceMoto - Erreur début transaction: " . $e->getMessage());
            throw $e;
        }
    }

    private function commitSafe()
    {
        try {
            if ($this->transactionActive) {
                $this->pdo->commit();
                $this->transactionActive = false;
            }
        } catch (PDOException $e) {
            error_log("AssuranceMoto - Erreur commit: " . $e->getMessage());
            throw $e;
        }
    }

    private function rollbackSafe()
    {
        try {
            if ($this->transactionActive) {
                $this->pdo->rollBack();
                $this->transactionActive = false;
            }
        } catch (PDOException $e) {
            error_log("AssuranceMoto - Erreur rollback: " . $e->getMessage());
        }
    }

    // ──────────────────────────────────────────────
    // BÉNÉFICIAIRES & RÉPARTITION
    // ──────────────────────────────────────────────

    private function getBeneficiairesForImpot($impot_id)
    {
        $sql = "SELECT ib.id as impot_beneficiaire_id, ib.type_part, ib.valeur_part,
                       b.id as beneficiaire_id, b.nom, b.numero_compte
                FROM impot_beneficiaires ib
                INNER JOIN beneficiaires b ON ib.beneficiaire_id = b.id
                WHERE ib.impot_id = :impot_id AND b.actif = 1
                ORDER BY ib.id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':impot_id', $impot_id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function calculerMontantBeneficiaire($montantTotal, $typePart, $valeurPart)
    {
        if ($typePart === 'montant_fixe') {
            return min($valeurPart, $montantTotal);
        } elseif ($typePart === 'pourcentage') {
            return ($montantTotal * $valeurPart) / 100;
        }
        return 0;
    }

    private function repartirMontant($paiementId, $impot_id, $montantTotal)
    {
        try {
            $beneficiaires = $this->getBeneficiairesForImpot($impot_id);
            if (empty($beneficiaires)) return true;

            $repartitions = [];
            $totalReparti = 0;

            foreach ($beneficiaires as $beneficiaire) {
                $montant = $this->calculerMontantBeneficiaire(
                    $montantTotal, $beneficiaire['type_part'], (float)$beneficiaire['valeur_part']
                );
                $repartitions[] = ['beneficiaire' => $beneficiaire, 'montant' => round($montant, 2)];
                $totalReparti += $montant;
            }

            if ($totalReparti > $montantTotal) {
                $difference = $totalReparti - $montantTotal;
                $lastIndex = count($repartitions) - 1;
                $repartitions[$lastIndex]['montant'] = max(0, round($repartitions[$lastIndex]['montant'] - $difference, 2));
            }

            $sqlInsert = "INSERT INTO repartition_paiements_immatriculation (
                id_paiement_immatriculation, beneficiaire_id, type_part,
                valeur_part_originale, valeur_part_calculee, montant, date_creation
            ) VALUES (:paiement_id, :beneficiaire_id, :type_part,
                :valeur_part_originale, :valeur_part_calculee, :montant, NOW())";
            $stmtInsert = $this->pdo->prepare($sqlInsert);

            foreach ($repartitions as $repartition) {
                $ben = $repartition['beneficiaire'];
                $montant = $repartition['montant'];
                if ($montant <= 0) continue;

                $valeurPartCalculee = $ben['type_part'] === 'pourcentage'
                    ? round(($montant / $montantTotal) * 100, 2) : $montant;

                $stmtInsert->bindValue(':paiement_id', $paiementId, PDO::PARAM_INT);
                $stmtInsert->bindValue(':beneficiaire_id', $ben['beneficiaire_id'], PDO::PARAM_INT);
                $stmtInsert->bindValue(':type_part', $ben['type_part'], PDO::PARAM_STR);
                $stmtInsert->bindValue(':valeur_part_originale', $ben['valeur_part'], PDO::PARAM_STR);
                $stmtInsert->bindValue(':valeur_part_calculee', $valeurPartCalculee, PDO::PARAM_STR);
                $stmtInsert->bindValue(':montant', $montant, PDO::PARAM_STR);

                if (!$stmtInsert->execute()) {
                    throw new Exception("Erreur insertion répartition assurance");
                }
            }
            return true;
        } catch (Exception $e) {
            error_log("AssuranceMoto - Erreur répartition: " . $e->getMessage());
            throw $e;
        }
    }

    // ──────────────────────────────────────────────
    // INSCRIPTION ASSUJETTI + ENGIN
    // ──────────────────────────────────────────────

    public function inscrireAssujettiEtEngin($data)
    {
        try {
            $this->beginTransactionSafe();

            $utilisateurId = (int)($data['utilisateur_id'] ?? 0);
            $siteId = null;

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

            $nomComplet = trim($data['nom_complet'] ?? '');
            $parts = explode(' ', $nomComplet, 2);
            $nom = $parts[0] ?? '';
            $prenom = $parts[1] ?? '';

            // Chercher ou créer le particulier
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
                    $sqlUpdate = "UPDATE particuliers SET nom = :nom, prenom = :prenom,
                                  email = :email, rue = :adresse, nif = :nif,
                                  utilisateur = :utilisateur, site = :site WHERE id = :id";
                    $stmtUpdate = $this->pdo->prepare($sqlUpdate);
                    $stmtUpdate->execute([
                        ':id' => $particulierId, ':nom' => $nom, ':prenom' => $prenom,
                        ':email' => $data['email'] ?? '', ':adresse' => $data['adresse'] ?? '',
                        ':nif' => $data['nif'] ?? '', ':utilisateur' => $utilisateurId, ':site' => $siteId
                    ]);
                }
            }

            if (!$particulierId) {
                $sqlInsert = "INSERT INTO particuliers (nom, prenom, telephone, email, rue, nif, utilisateur, site)
                              VALUES (:nom, :prenom, :telephone, :email, :adresse, :nif, :utilisateur, :site)";
                $stmtInsert = $this->pdo->prepare($sqlInsert);
                $stmtInsert->execute([
                    ':nom' => $nom, ':prenom' => $prenom, ':telephone' => $telephone,
                    ':email' => $data['email'] ?? '', ':adresse' => $data['adresse'] ?? '',
                    ':nif' => $data['nif'] ?? '', ':utilisateur' => $utilisateurId, ':site' => $siteId
                ]);
                $particulierId = (int)$this->pdo->lastInsertId();
            }

            // Chercher ou créer l'engin
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
                    $sqlUpdateEngin = "UPDATE engins SET
                        marque = :marque, couleur = :couleur, energie = :energie,
                        usage_engin = :usage_engin, puissance_fiscal = :puissance_fiscal,
                        annee_fabrication = :annee_fabrication, annee_circulation = :annee_circulation,
                        numero_chassis = :numero_chassis, numero_moteur = :numero_moteur,
                        type_engin = :type_engin WHERE id = :id";
                    $stmtUpdateEngin = $this->pdo->prepare($sqlUpdateEngin);
                    $stmtUpdateEngin->execute([
                        ':id' => $enginId, ':marque' => $data['marque'] ?? '',
                        ':couleur' => $data['couleur'] ?? '', ':energie' => $data['energie'] ?? '',
                        ':usage_engin' => $data['usage_engin'] ?? '', ':puissance_fiscal' => $data['puissance_fiscal'] ?? '',
                        ':annee_fabrication' => $data['annee_fabrication'] ?? '', ':annee_circulation' => $data['annee_circulation'] ?? '',
                        ':numero_chassis' => $data['numero_chassis'] ?? '', ':numero_moteur' => $data['numero_moteur'] ?? '',
                        ':type_engin' => $data['type_engin'] ?? ''
                    ]);
                }
            }

            if (!$enginId) {
                $serieId = 0;
                $serieItemId = 0;
                if (!empty($plaque)) {
                    $plaqueNettoyee = preg_replace('/[\s\-]+/', '', $plaque);
                    if (preg_match('/^([A-Za-z]+)(\d+)$/', $plaqueNettoyee, $matches)) {
                        $prefixe = strtoupper($matches[1]);
                        $numero = (int)$matches[2];
                        $sqlSerie = "SELECT si.id as serie_item_id, si.serie_id
                                     FROM serie_items si
                                     INNER JOIN series s ON si.serie_id = s.id
                                     WHERE s.nom_serie = :prefixe AND si.value = :numero LIMIT 1";
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

                $impotId = $data['impot_id'] ?? '19';

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
                    ':numero_plaque' => $plaque, ':marque' => $data['marque'] ?? '',
                    ':couleur' => $data['couleur'] ?? '', ':energie' => $data['energie'] ?? '',
                    ':usage_engin' => $data['usage_engin'] ?? '', ':puissance_fiscal' => $data['puissance_fiscal'] ?? '',
                    ':annee_fabrication' => $data['annee_fabrication'] ?? '', ':annee_circulation' => $data['annee_circulation'] ?? '',
                    ':numero_chassis' => $data['numero_chassis'] ?? '', ':numero_moteur' => $data['numero_moteur'] ?? '',
                    ':type_engin' => $data['type_engin'] ?? '', ':particulier_id' => $particulierId,
                    ':serie_id' => $serieId, ':serie_item_id' => $serieItemId,
                    ':impot_id' => $impotId, ':utilisateur_id' => $utilisateurId, ':site_id' => $siteId ?? 0
                ]);
                $enginId = (int)$this->pdo->lastInsertId();

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
                        "id" => $particulierId, "nom_complet" => $nomComplet,
                        "telephone" => $telephone, "adresse" => $data['adresse'] ?? '',
                        "nif" => $data['nif'] ?? '', "email" => $data['email'] ?? ''
                    ],
                    "engin" => [
                        "id" => $enginId, "numero_plaque" => $plaque,
                        "marque" => $data['marque'] ?? '', "modele" => $data['modele'] ?? '',
                        "couleur" => $data['couleur'] ?? '', "energie" => $data['energie'] ?? '',
                        "usage_engin" => $data['usage_engin'] ?? '', "puissance_fiscal" => $data['puissance_fiscal'] ?? '',
                        "annee_fabrication" => $data['annee_fabrication'] ?? '', "annee_circulation" => $data['annee_circulation'] ?? '',
                        "numero_chassis" => $data['numero_chassis'] ?? '', "numero_moteur" => $data['numero_moteur'] ?? '',
                        "type_engin" => $data['type_engin'] ?? ''
                    ]
                ]
            ];
        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("AssuranceMoto - Erreur inscription: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    // ──────────────────────────────────────────────
    // ENREGISTRER PAIEMENT + ASSURANCE
    // ──────────────────────────────────────────────

    public function enregistrerPaiement($paiementData)
    {
        try {
            $this->beginTransactionSafe();

            $required = ['engin_id', 'particulier_id', 'montant', 'montant_initial',
                         'impot_id', 'mode_paiement', 'utilisateur_id', 'site_id', 'taux_cdf'];
            foreach ($required as $field) {
                if (!isset($paiementData[$field])) {
                    throw new Exception("Champ requis manquant: $field");
                }
            }

            $impot_id = filter_var($paiementData['impot_id'], FILTER_VALIDATE_INT);
            if ($impot_id === false || $impot_id <= 0) {
                throw new Exception("ID d'impôt invalide");
            }

            // Récupérer le site_id réel
            $sqlSite = "SELECT s.id AS id FROM sites s
                        INNER JOIN utilisateurs u ON s.id = u.site_affecte_id
                        WHERE u.id = :utilisateur AND s.actif = 1 LIMIT 1";
            $stmtSite = $this->pdo->prepare($sqlSite);
            $stmtSite->bindValue(':utilisateur', $paiementData['utilisateur_id'], PDO::PARAM_STR);
            $stmtSite->execute();
            $siteData = $stmtSite->fetch(PDO::FETCH_ASSOC);

            // 1. INSERT PAIEMENT
            $sql = "INSERT INTO paiements_immatriculation (
                engin_id, particulier_id, montant, montant_initial, impot_id,
                mode_paiement, operateur, numero_transaction, numero_cheque, banque,
                statut, date_paiement, utilisateur_id, site_id, nombre_plaques, etat
            ) VALUES (
                :engin_id, :particulier_id, :montant, :montant_initial, :impot_id,
                :mode_paiement, :operateur, :numero_transaction, :numero_cheque, :banque,
                :statut, NOW(), :utilisateur_id, :site_id, :nombre_plaques, :etat
            )";
            $stmt = $this->pdo->prepare($sql);

            $engin_id = isset($paiementData['engin_id']) ? (int)$paiementData['engin_id'] : null;
            $stmt->bindValue(':engin_id', $engin_id, $engin_id ? PDO::PARAM_INT : PDO::PARAM_NULL);
            $stmt->bindValue(':particulier_id', (int)$paiementData['particulier_id'], PDO::PARAM_INT);
            $stmt->bindValue(':montant', (float)$paiementData['montant'], PDO::PARAM_STR);
            $montant_initial = isset($paiementData['montant_initial']) ? (float)$paiementData['montant_initial'] : null;
            $stmt->bindValue(':montant_initial', $montant_initial, $montant_initial ? PDO::PARAM_STR : PDO::PARAM_NULL);
            $stmt->bindValue(':impot_id', $impot_id, PDO::PARAM_INT);
            $stmt->bindValue(':mode_paiement', $paiementData['mode_paiement'], PDO::PARAM_STR);
            $stmt->bindValue(':operateur', $paiementData['operateur'] ?? null, PDO::PARAM_STR);
            $stmt->bindValue(':numero_transaction', $paiementData['numero_transaction'] ?? null, PDO::PARAM_STR);
            $stmt->bindValue(':numero_cheque', $paiementData['numero_cheque'] ?? null, PDO::PARAM_STR);
            $stmt->bindValue(':banque', $paiementData['banque'] ?? null, PDO::PARAM_STR);

            $statutAutorise = ['pending', 'completed', 'failed'];
            $statut = isset($paiementData['statut']) && in_array($paiementData['statut'], $statutAutorise, true)
                ? $paiementData['statut'] : 'completed';
            $stmt->bindValue(':statut', $statut, PDO::PARAM_STR);
            $stmt->bindValue(':utilisateur_id', (int)$paiementData['utilisateur_id'], PDO::PARAM_INT);
            $stmt->bindValue(':site_id', (int)$siteData['id'], PDO::PARAM_INT);
            $stmt->bindValue(':nombre_plaques', $paiementData['nombre_plaques'] ?? 1, PDO::PARAM_INT);
            $stmt->bindValue(':etat', 1, PDO::PARAM_INT);

            if (!$stmt->execute()) {
                throw new Exception("Erreur insertion paiement assurance");
            }

            $paiementId = $this->pdo->lastInsertId();

            // 2. RÉPARTIR + CRÉER ASSURANCE
            if ($statut === 'completed') {
                $this->repartirMontant($paiementId, $impot_id, (float)$paiementData['montant']);

                // Code assurance unique : ASS-{ANNÉE}-{random}-{id}
                $codeAssurance = "ASS-" . date('Y') . "-" .
                    strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8)) . "-" .
                    str_pad($paiementId, 6, '0', STR_PAD_LEFT);
                $dateValidite = date('Y-m-d', strtotime('+12 months'));

                $numeroAssurance = $paiementData['numero_assurance'] ?? null;

                // Vérifier unicité du numéro d'assurance
                if (!empty($numeroAssurance)) {
                    $sqlCheck = "SELECT id FROM assurances_moto WHERE numero_assurance = :numero AND etat = 1 LIMIT 1";
                    $stmtCheck = $this->pdo->prepare($sqlCheck);
                    $stmtCheck->bindValue(':numero', $numeroAssurance, PDO::PARAM_STR);
                    $stmtCheck->execute();
                    if ($stmtCheck->fetch(PDO::FETCH_ASSOC)) {
                        throw new Exception("Le numéro d'assurance '$numeroAssurance' est déjà utilisé");
                    }
                }

                // INSERT dans assurances_moto (PAS dans vignettes_delivrees)
                $sqlAssurance = "INSERT INTO assurances_moto (
                    id_paiement, impot_id, type_mouvement, duree_mois,
                    engin_id, particulier_id, code_assurance,
                    date_souscription, date_validite,
                    utilisateur_id, utilisateur_nom,
                    site_id, etat, date_creation, numero_assurance
                ) VALUES (
                    :id_paiement, :impot_id, 'souscription', 12,
                    :engin_id, :particulier_id, :code_assurance,
                    NOW(), :date_validite,
                    :utilisateur_id, :utilisateur_nom,
                    :site_id, 1, NOW(), :numero_assurance
                )";
                $stmtAssurance = $this->pdo->prepare($sqlAssurance);
                $stmtAssurance->bindValue(':id_paiement', $paiementId, PDO::PARAM_INT);
                $stmtAssurance->bindValue(':impot_id', $impot_id, PDO::PARAM_INT);
                $stmtAssurance->bindValue(':engin_id', $engin_id, PDO::PARAM_INT);
                $stmtAssurance->bindValue(':particulier_id', (int)$paiementData['particulier_id'], PDO::PARAM_INT);
                $stmtAssurance->bindValue(':code_assurance', $codeAssurance, PDO::PARAM_STR);
                $stmtAssurance->bindValue(':date_validite', $dateValidite, PDO::PARAM_STR);
                $stmtAssurance->bindValue(':utilisateur_id', (int)$paiementData['utilisateur_id'], PDO::PARAM_INT);
                $stmtAssurance->bindValue(':utilisateur_nom', $paiementData['utilisateur_name'] ?? 'Caissier', PDO::PARAM_STR);
                $stmtAssurance->bindValue(':site_id', (int)$siteData['id'], PDO::PARAM_INT);
                $stmtAssurance->bindValue(':numero_assurance', $numeroAssurance, $numeroAssurance ? PDO::PARAM_STR : PDO::PARAM_NULL);
                $stmtAssurance->execute();
            }

            // Référence bancaire
            $referenceBancaire = trim($paiementData['reference_bancaire'] ?? '');
            if (!empty($referenceBancaire)) {
                $sqlPB = "SELECT id, donnees_initiation, donnees_confirmation
                          FROM paiements_bancaires
                          WHERE reference_bancaire = :reference AND statut IN ('complete', 'livre')
                          LIMIT 1 FOR UPDATE";
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
                    $nouveauStatut = ($livres >= $nombreDeclarations) ? 'livre' : 'complete';

                    $sqlUpdatePB = "UPDATE paiements_bancaires SET donnees_confirmation = :dc, statut = :statut WHERE id = :id";
                    $stmtUpdatePB = $this->pdo->prepare($sqlUpdatePB);
                    $stmtUpdatePB->bindValue(':dc', json_encode($donneesConfirmation), PDO::PARAM_STR);
                    $stmtUpdatePB->bindValue(':statut', $nouveauStatut, PDO::PARAM_STR);
                    $stmtUpdatePB->bindValue(':id', $pb['id'], PDO::PARAM_INT);
                    $stmtUpdatePB->execute();
                }
            }

            $response = $this->getPaiementDetails($paiementId, $paiementData, $impot_id);

            $this->commitSafe();

            return [
                "status" => "success",
                "message" => "Paiement assurance enregistré avec succès",
                "data" => $response
            ];
        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("AssuranceMoto - Erreur paiement: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    // ──────────────────────────────────────────────
    // VÉRIFIER ASSURANCE EXISTANTE
    // ──────────────────────────────────────────────

    public function verifierAssuranceExistante($plaque)
    {
        try {
            $sql = "SELECT a.id, a.code_assurance, a.numero_assurance,
                           a.date_souscription, a.date_validite, a.etat, a.type_mouvement
                    FROM assurances_moto a
                    INNER JOIN engins e ON a.engin_id = e.id
                    WHERE e.numero_plaque = :plaque AND a.etat = 1
                    ORDER BY a.date_souscription DESC LIMIT 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':plaque', $plaque, PDO::PARAM_STR);
            $stmt->execute();
            $assurance = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$assurance) {
                return [
                    "status" => "success", "existe" => false, "assurance_active" => false,
                    "message" => "Aucune assurance trouvée pour cette plaque."
                ];
            }

            $dateValidite = $assurance['date_validite'];
            $estActive = (strtotime($dateValidite) >= strtotime(date('Y-m-d')));

            if ($estActive) {
                return [
                    "status" => "success", "existe" => true, "assurance_active" => true,
                    "date_validite" => $dateValidite,
                    "code_assurance" => $assurance['code_assurance'],
                    "numero_assurance" => $assurance['numero_assurance'],
                    "message" => "Une assurance valide existe déjà pour cette plaque (valide jusqu'au " . date('d/m/Y', strtotime($dateValidite)) . ")."
                ];
            } else {
                return [
                    "status" => "success", "existe" => true, "assurance_active" => false,
                    "date_validite" => $dateValidite,
                    "code_assurance" => $assurance['code_assurance'],
                    "message" => "L'assurance de cette plaque a expiré le " . date('d/m/Y', strtotime($dateValidite)) . ". Veuillez procéder au renouvellement."
                ];
            }
        } catch (Exception $e) {
            error_log("AssuranceMoto - Erreur vérification: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    // ──────────────────────────────────────────────
    // DÉLIVRANCE ASSURANCE (groupée par ref bancaire)
    // ──────────────────────────────────────────────

    public function delivrerAssuranceGroupee($data)
    {
        try {
            $this->beginTransactionSafe();

            $referenceBancaire = trim($data['reference_bancaire'] ?? '');
            $numeroAssurance = trim($data['numero_assurance'] ?? '');
            $enginId = (int)($data['engin_id'] ?? 0);
            $particulierId = (int)($data['particulier_id'] ?? 0);
            $utilisateurId = (int)($data['utilisateur_id'] ?? 0);
            $utilisateurName = $data['utilisateur_name'] ?? 'Caissier';
            $impotId = $data['impot_id'] ?? null;

            if (empty($referenceBancaire) || empty($numeroAssurance) || !$enginId || !$particulierId) {
                throw new Exception("Données incomplètes pour la délivrance");
            }

            // Vérifier unicité du numéro d'assurance
            $sqlCheckNum = "SELECT id FROM assurances_moto WHERE numero_assurance = :numero AND etat = 1 LIMIT 1";
            $stmtCheckNum = $this->pdo->prepare($sqlCheckNum);
            $stmtCheckNum->bindValue(':numero', $numeroAssurance, PDO::PARAM_STR);
            $stmtCheckNum->execute();
            if ($stmtCheckNum->fetch(PDO::FETCH_ASSOC)) {
                throw new Exception("Le numéro d'assurance '$numeroAssurance' est déjà utilisé");
            }

            // Récupérer le paiement bancaire
            $sqlPB = "SELECT pb.id, pb.reference_bancaire, pb.statut, pb.id_paiement,
                             pb.donnees_initiation, pb.donnees_confirmation, pb.date_creation,
                             pi.impot_id AS impot_id_paiement
                      FROM paiements_bancaires pb
                      INNER JOIN paiements_immatriculation pi ON pi.id = pb.id_paiement
                      WHERE pb.reference_bancaire = :reference AND pb.statut IN ('complete', 'livre')
                      LIMIT 1 FOR UPDATE";
            $stmtPB = $this->pdo->prepare($sqlPB);
            $stmtPB->bindValue(':reference', $referenceBancaire, PDO::PARAM_STR);
            $stmtPB->execute();
            $pb = $stmtPB->fetch(PDO::FETCH_ASSOC);

            if (!$pb) {
                throw new Exception("Référence bancaire non trouvée ou déjà entièrement livrée");
            }

            $donneesInitiation = json_decode($pb['donnees_initiation'] ?? '{}', true);
            $donneesConfirmation = json_decode($pb['donnees_confirmation'] ?? '{}', true);
            $nombreDeclarations = (int)($donneesInitiation['nombre_declarations'] ?? 1);
            $livres = (int)($donneesConfirmation['livres'] ?? 0);

            if ($livres >= $nombreDeclarations) {
                throw new Exception("Toutes les assurances de cette référence ont déjà été délivrées");
            }

            // Résoudre site
            $sqlSite = "SELECT s.id FROM sites s INNER JOIN utilisateurs u ON s.id = u.site_affecte_id
                        WHERE u.id = :utilisateur AND s.actif = 1 LIMIT 1";
            $stmtSite = $this->pdo->prepare($sqlSite);
            $stmtSite->bindValue(':utilisateur', $utilisateurId, PDO::PARAM_INT);
            $stmtSite->execute();
            $siteData = $stmtSite->fetch(PDO::FETCH_ASSOC);
            $siteId = $siteData ? (int)$siteData['id'] : 0;

            $useImpotId = $impotId ?? $pb['impot_id_paiement'] ?? 19;

            // Créer l'assurance
            $codeAssurance = "ASS-" . date('Y') . "-" .
                strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8)) . "-" .
                str_pad($pb['id_paiement'], 6, '0', STR_PAD_LEFT);
            $dateValidite = date('Y-m-d', strtotime('+12 months'));

            $sqlAssurance = "INSERT INTO assurances_moto (
                id_paiement, impot_id, type_mouvement, duree_mois,
                engin_id, particulier_id, code_assurance, numero_assurance,
                date_souscription, date_validite, utilisateur_id, utilisateur_nom,
                site_id, etat, date_creation
            ) VALUES (
                :id_paiement, :impot_id, 'delivrance', 12,
                :engin_id, :particulier_id, :code_assurance, :numero_assurance,
                NOW(), :date_validite, :utilisateur_id, :utilisateur_nom,
                :site_id, 1, NOW()
            )";
            $stmtAssurance = $this->pdo->prepare($sqlAssurance);
            $stmtAssurance->bindValue(':id_paiement', $pb['id_paiement'], PDO::PARAM_INT);
            $stmtAssurance->bindValue(':impot_id', $useImpotId, PDO::PARAM_INT);
            $stmtAssurance->bindValue(':engin_id', $enginId, PDO::PARAM_INT);
            $stmtAssurance->bindValue(':particulier_id', $particulierId, PDO::PARAM_INT);
            $stmtAssurance->bindValue(':code_assurance', $codeAssurance, PDO::PARAM_STR);
            $stmtAssurance->bindValue(':numero_assurance', $numeroAssurance, PDO::PARAM_STR);
            $stmtAssurance->bindValue(':date_validite', $dateValidite, PDO::PARAM_STR);
            $stmtAssurance->bindValue(':utilisateur_id', $utilisateurId, PDO::PARAM_INT);
            $stmtAssurance->bindValue(':utilisateur_nom', $utilisateurName, PDO::PARAM_STR);
            $stmtAssurance->bindValue(':site_id', $siteId, PDO::PARAM_INT);
            $stmtAssurance->execute();

            // Mettre à jour le compteur
            $livres++;
            $donneesConfirmation['livres'] = $livres;
            $restant = $nombreDeclarations - $livres;
            $nouveauStatut = ($livres >= $nombreDeclarations) ? 'livre' : 'complete';

            $sqlUpdatePB = "UPDATE paiements_bancaires SET donnees_confirmation = :dc, statut = :statut WHERE id = :id";
            $stmtUpdatePB = $this->pdo->prepare($sqlUpdatePB);
            $stmtUpdatePB->bindValue(':dc', json_encode($donneesConfirmation), PDO::PARAM_STR);
            $stmtUpdatePB->bindValue(':statut', $nouveauStatut, PDO::PARAM_STR);
            $stmtUpdatePB->bindValue(':id', $pb['id'], PDO::PARAM_INT);
            $stmtUpdatePB->execute();

            $this->commitSafe();

            return [
                "status" => "success",
                "message" => "Assurance délivrée avec succès",
                "data" => [
                    "code_assurance" => $codeAssurance,
                    "numero_assurance" => $numeroAssurance,
                    "date_validite" => $dateValidite,
                    "duree_mois" => 12,
                    "compteur" => [
                        "total" => $nombreDeclarations,
                        "livres" => $livres,
                        "restant" => $restant
                    ],
                    "tout_livre" => ($restant <= 0)
                ]
            ];
        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("AssuranceMoto - Erreur délivrance: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    // ──────────────────────────────────────────────
    // RENOUVELLEMENT ASSURANCE
    // ──────────────────────────────────────────────

    public function renouvelerAssurance($data)
    {
        try {
            $this->beginTransactionSafe();

            $assuranceId = (int)($data['assurance_id'] ?? 0);

            $sqlCheck = "SELECT * FROM assurances_moto WHERE id = :id AND etat = 1";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->bindValue(':id', $assuranceId, PDO::PARAM_INT);
            $stmtCheck->execute();
            $ancienneAssurance = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if (!$ancienneAssurance) {
                $this->rollbackSafe();
                return ["status" => "error", "message" => "Assurance non trouvée"];
            }

            // Résoudre site
            $sqlSite = "SELECT s.id FROM sites s INNER JOIN utilisateurs u ON s.id = u.site_affecte_id
                        WHERE u.id = :utilisateur AND s.actif = 1 LIMIT 1";
            $stmtSite = $this->pdo->prepare($sqlSite);
            $stmtSite->bindValue(':utilisateur', $data['utilisateur_id'], PDO::PARAM_INT);
            $stmtSite->execute();
            $siteData = $stmtSite->fetch(PDO::FETCH_ASSOC);
            $siteId = $siteData ? (int)$siteData['id'] : (int)$ancienneAssurance['site_id'];

            $montant = isset($data['montant']) ? (float)$data['montant'] : 15.00;
            $impotId = $data['impot_id'] ?? $ancienneAssurance['impot_id'] ?? 19;
            $dureeMois = 12;

            // 1. Nouveau paiement
            $sqlPaiement = "INSERT INTO paiements_immatriculation (
                engin_id, particulier_id, montant, montant_initial, impot_id,
                mode_paiement, statut, date_paiement, utilisateur_id, site_id, nombre_plaques, etat
            ) VALUES (
                :engin_id, :particulier_id, :montant, :montant_initial, :impot_id,
                'espece', 'completed', NOW(), :utilisateur_id, :site_id, 1, 1
            )";
            $stmtPaiement = $this->pdo->prepare($sqlPaiement);
            $stmtPaiement->bindValue(':engin_id', (int)$ancienneAssurance['engin_id'], PDO::PARAM_INT);
            $stmtPaiement->bindValue(':particulier_id', (int)$ancienneAssurance['particulier_id'], PDO::PARAM_INT);
            $stmtPaiement->bindValue(':montant', $montant, PDO::PARAM_STR);
            $stmtPaiement->bindValue(':montant_initial', $montant, PDO::PARAM_STR);
            $stmtPaiement->bindValue(':impot_id', $impotId, PDO::PARAM_INT);
            $stmtPaiement->bindValue(':utilisateur_id', (int)$data['utilisateur_id'], PDO::PARAM_INT);
            $stmtPaiement->bindValue(':site_id', $siteId, PDO::PARAM_INT);
            if (!$stmtPaiement->execute()) throw new Exception("Erreur création paiement renouvellement");
            $paiementId = $this->pdo->lastInsertId();

            // 2. Répartir
            $this->repartirMontant($paiementId, $impotId, $montant);

            // 3. Désactiver l'ancienne
            $sqlDesactiver = "UPDATE assurances_moto SET etat = 0 WHERE id = :id";
            $stmtDesactiver = $this->pdo->prepare($sqlDesactiver);
            $stmtDesactiver->bindValue(':id', $assuranceId, PDO::PARAM_INT);
            $stmtDesactiver->execute();

            // 4. Nouvelle assurance
            $codeAssurance = "ASS-REN-" . date('Y') . "-" .
                strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8)) . "-" .
                str_pad($paiementId, 6, '0', STR_PAD_LEFT);
            $dateValidite = date('Y-m-d', strtotime("+{$dureeMois} months"));
            $numeroAssurance = $data['numero_assurance'] ?? null;

            $sqlInsert = "INSERT INTO assurances_moto (
                id_paiement, impot_id, type_mouvement, duree_mois,
                engin_id, particulier_id, code_assurance, numero_assurance,
                date_souscription, date_validite, utilisateur_id, utilisateur_nom,
                site_id, etat, date_creation
            ) VALUES (
                :id_paiement, :impot_id, 'renouvellement', :duree_mois,
                :engin_id, :particulier_id, :code_assurance, :numero_assurance,
                NOW(), :date_validite, :utilisateur_id, :utilisateur_nom,
                :site_id, 1, NOW()
            )";
            $stmtInsert = $this->pdo->prepare($sqlInsert);
            $stmtInsert->bindValue(':id_paiement', $paiementId, PDO::PARAM_INT);
            $stmtInsert->bindValue(':impot_id', $impotId, PDO::PARAM_INT);
            $stmtInsert->bindValue(':duree_mois', $dureeMois, PDO::PARAM_INT);
            $stmtInsert->bindValue(':engin_id', (int)$ancienneAssurance['engin_id'], PDO::PARAM_INT);
            $stmtInsert->bindValue(':particulier_id', (int)$ancienneAssurance['particulier_id'], PDO::PARAM_INT);
            $stmtInsert->bindValue(':code_assurance', $codeAssurance, PDO::PARAM_STR);
            $stmtInsert->bindValue(':numero_assurance', $numeroAssurance, $numeroAssurance ? PDO::PARAM_STR : PDO::PARAM_NULL);
            $stmtInsert->bindValue(':date_validite', $dateValidite, PDO::PARAM_STR);
            $stmtInsert->bindValue(':utilisateur_id', (int)$data['utilisateur_id'], PDO::PARAM_INT);
            $stmtInsert->bindValue(':utilisateur_nom', $data['utilisateur_name'] ?? 'Caissier', PDO::PARAM_STR);
            $stmtInsert->bindValue(':site_id', $siteId, PDO::PARAM_INT);
            if (!$stmtInsert->execute()) throw new Exception("Erreur insertion renouvellement assurance");

            $newId = $this->pdo->lastInsertId();
            $this->commitSafe();

            return [
                "status" => "success",
                "message" => "Assurance renouvelée avec succès",
                "data" => [
                    "id" => $newId, "paiement_id" => $paiementId,
                    "code_assurance" => $codeAssurance, "date_validite" => $dateValidite,
                    "duree_mois" => $dureeMois, "montant" => $montant,
                    "ancienne_assurance_id" => $assuranceId
                ]
            ];
        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("AssuranceMoto - Erreur renouvellement: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    // ──────────────────────────────────────────────
    // LISTER ASSURANCES À RENOUVELER
    // ──────────────────────────────────────────────

    public function getAssurancesARenouveler($params = [])
    {
        try {
            $seuilJours = isset($params['seuil_jours']) ? (int)$params['seuil_jours'] : 30;
            $statutExpiration = $params['statut_expiration'] ?? 'tous';
            $recherche = trim($params['recherche'] ?? '');
            $siteId = isset($params['site_id']) ? (int)$params['site_id'] : null;

            $conditions = ["a.etat = 1"];
            $bindings = [];

            if ($statutExpiration === 'expirees') {
                $conditions[] = "a.date_validite < CURDATE()";
            } elseif ($statutExpiration === 'proche') {
                $conditions[] = "a.date_validite >= CURDATE()";
                $conditions[] = "a.date_validite <= DATE_ADD(CURDATE(), INTERVAL :seuil DAY)";
                $bindings[':seuil'] = $seuilJours;
            } elseif ($statutExpiration === 'valides') {
                $conditions[] = "a.date_validite > DATE_ADD(CURDATE(), INTERVAL :seuil DAY)";
                $bindings[':seuil'] = $seuilJours;
            }

            if (!empty($recherche)) {
                $conditions[] = "(e.numero_plaque LIKE :recherche OR CONCAT(p.nom, ' ', p.prenom) LIKE :recherche OR p.telephone LIKE :recherche)";
                $bindings[':recherche'] = "%{$recherche}%";
            }

            if ($siteId) {
                $conditions[] = "a.site_id = :site_id";
                $bindings[':site_id'] = $siteId;
            }

            $where = implode(' AND ', $conditions);

            $sql = "SELECT a.*, e.numero_plaque, e.marque, e.couleur, e.type_engin,
                           CONCAT(p.nom, ' ', p.prenom) AS nom_complet, p.telephone
                    FROM assurances_moto a
                    INNER JOIN engins e ON a.engin_id = e.id
                    INNER JOIN particuliers p ON a.particulier_id = p.id
                    WHERE {$where}
                    ORDER BY a.date_validite ASC";

            $stmt = $this->pdo->prepare($sql);
            foreach ($bindings as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();

            $assurances = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $assurances];
        } catch (Exception $e) {
            error_log("AssuranceMoto - Erreur liste renouvellement: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    // ──────────────────────────────────────────────
    // VÉRIFIER RÉFÉRENCE BANCAIRE (pour délivrance)
    // ──────────────────────────────────────────────

    public function verifierReferenceBancaire($reference, $impotIdAttendu = null)
    {
        try {
            $sql = "SELECT pb.id, pb.reference_bancaire, pb.statut, pb.id_paiement,
                           pb.donnees_initiation, pb.donnees_confirmation, pb.date_creation,
                           pi.impot_id AS impot_id_paiement
                    FROM paiements_bancaires pb
                    INNER JOIN paiements_immatriculation pi ON pi.id = pb.id_paiement
                    WHERE pb.reference_bancaire = :reference AND pb.statut IN ('complete', 'livre')
                    LIMIT 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':reference', $reference, PDO::PARAM_STR);
            $stmt->execute();
            $pb = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$pb) {
                return ["status" => "error", "message" => "Aucun paiement bancaire trouvé avec cette référence"];
            }

            $impotIdReel = (int)$pb['impot_id_paiement'];
            if ($impotIdAttendu !== null && $impotIdReel !== (int)$impotIdAttendu) {
                return ["status" => "error", "message" => "Cette référence correspond à une autre taxe (n°$impotIdReel)."];
            }

            $donneesInitiation = json_decode($pb['donnees_initiation'] ?? '{}', true);
            $donneesConfirmation = json_decode($pb['donnees_confirmation'] ?? '{}', true);
            $nombreDeclarations = (int)($donneesInitiation['nombre_declarations'] ?? 1);
            $livres = (int)($donneesConfirmation['livres'] ?? 0);
            $restant = $nombreDeclarations - $livres;

            if ($restant <= 0) {
                return ["status" => "error", "message" => "Toutes les assurances de cette référence ont déjà été délivrées ($livres/$nombreDeclarations)"];
            }

            return [
                "status" => "success",
                "message" => "$restant assurance(s) restante(s) à délivrer.",
                "data" => [
                    "paiement_bancaire_id" => $pb['id'],
                    "reference_bancaire" => $pb['reference_bancaire'],
                    "id_paiement" => $pb['id_paiement'],
                    "nombre_declarations" => $nombreDeclarations,
                    "livres" => $livres,
                    "restant" => $restant,
                    "impot_id" => $impotIdReel,
                    "montant_total" => $donneesInitiation['montant'] ?? 0,
                    "date_creation" => $pb['date_creation']
                ]
            ];
        } catch (Exception $e) {
            error_log("AssuranceMoto - Erreur vérification ref: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    // ──────────────────────────────────────────────
    // VERIFIER PAIEMENT BANCAIRE
    // ──────────────────────────────────────────────

    public function verifierPaiementBancaire($plaque, $reference)
    {
        try {
            $this->beginTransactionSafe();

            // 1. Vérifier le paiement bancaire
            $sqlPB = "SELECT pb.id, pb.reference_bancaire, pb.statut, pb.id_paiement, pb.date_creation
                      FROM paiements_bancaires pb
                      WHERE pb.reference_bancaire = :reference AND pb.statut = 'complete'
                      LIMIT 1";
            $stmtPB = $this->pdo->prepare($sqlPB);
            $stmtPB->bindValue(':reference', $reference, PDO::PARAM_STR);
            $stmtPB->execute();
            $pb = $stmtPB->fetch(PDO::FETCH_ASSOC);

            if (!$pb) {
                $this->rollbackSafe();
                return ["status" => "error", "message" => "Aucun paiement bancaire trouvé avec cette référence ou paiement non complété"];
            }

            // 2. Récupérer le paiement immatriculation
            $sqlP = "SELECT pi.*, e.numero_plaque, e.marque, '' as modele, e.couleur, e.energie,
                            e.usage_engin, e.puissance_fiscal, e.annee_fabrication, e.annee_circulation,
                            e.numero_chassis, e.numero_moteur, e.type_engin,
                            CONCAT(pt.nom, ' ', pt.prenom) AS nom_complet,
                            pt.telephone, pt.rue AS adresse, pt.nif, pt.email,
                            s.nom as site_nom, s.code as site_code,
                            i.nom as impot_nom, i.prix as impot_prix
                     FROM paiements_immatriculation pi
                     LEFT JOIN engins e ON pi.engin_id = e.id
                     LEFT JOIN particuliers pt ON pi.particulier_id = pt.id
                     LEFT JOIN sites s ON pi.site_id = s.id
                     LEFT JOIN impots i ON pi.impot_id = i.id
                     WHERE pi.id = :id_paiement AND pi.statut = 'completed'
                     LIMIT 1";
            $stmtP = $this->pdo->prepare($sqlP);
            $stmtP->bindValue(':id_paiement', $pb['id_paiement'], PDO::PARAM_INT);
            $stmtP->execute();
            $paiement = $stmtP->fetch(PDO::FETCH_ASSOC);

            if (!$paiement) {
                $this->rollbackSafe();
                return ["status" => "error", "message" => "Paiement non trouvé ou non complété"];
            }

            $plaqueCorrespond = ($paiement['numero_plaque'] && strtoupper(trim($paiement['numero_plaque'])) === strtoupper(trim($plaque)));

            if (!$plaqueCorrespond) {
                $this->commitSafe();
                return [
                    "status" => "inscription_required",
                    "message" => "Paiement trouvé mais le véhicule n'est pas enregistré. Veuillez compléter l'inscription.",
                    "data" => [
                        "paiement_bancaire" => $pb,
                        "paiement" => [
                            "id" => $paiement['id'], "montant" => $paiement['montant'],
                            "mode_paiement" => $paiement['mode_paiement'], "statut" => $paiement['statut'],
                            "date_paiement" => $paiement['date_paiement'], "utilisateur_id" => $paiement['utilisateur_id'],
                            "site_id" => $paiement['site_id'], "impot_id" => $paiement['impot_id']
                        ]
                    ]
                ];
            }

            // 3. Vérifier si déjà délivré dans assurances_moto
            $sqlDeja = "SELECT COUNT(*) as count FROM assurances_moto WHERE id_paiement = :id_paiement AND etat = 1";
            $stmtDeja = $this->pdo->prepare($sqlDeja);
            $stmtDeja->bindValue(':id_paiement', $pb['id_paiement'], PDO::PARAM_INT);
            $stmtDeja->execute();
            $deja = $stmtDeja->fetch(PDO::FETCH_ASSOC);

            if ($deja['count'] > 0) {
                $this->rollbackSafe();
                return ["status" => "error", "message" => "Cette assurance a déjà été délivrée"];
            }

            // 4. Récupérer le taux actif
            $sqlTaux = "SELECT valeur as taux_actif, date_application FROM taux WHERE actif = 1 ORDER BY date_application DESC LIMIT 1";
            $stmtTaux = $this->pdo->prepare($sqlTaux);
            $stmtTaux->execute();
            $taux = $stmtTaux->fetch(PDO::FETCH_ASSOC);

            $this->commitSafe();

            return [
                "status" => "success",
                "message" => "Paiement vérifié avec succès. Prêt pour la délivrance.",
                "data" => [
                    "paiement_bancaire" => $pb,
                    "paiement" => [
                        "id" => $paiement['id'], "engin_id" => $paiement['engin_id'],
                        "particulier_id" => $paiement['particulier_id'], "montant" => $paiement['montant'],
                        "mode_paiement" => $paiement['mode_paiement'], "statut" => $paiement['statut'],
                        "date_paiement" => $paiement['date_paiement'], "utilisateur_id" => $paiement['utilisateur_id'],
                        "site_id" => $paiement['site_id'], "impot_id" => $paiement['impot_id']
                    ],
                    "assujetti" => [
                        "id" => $paiement['particulier_id'], "nom_complet" => $paiement['nom_complet'],
                        "telephone" => $paiement['telephone'], "adresse" => $paiement['adresse'],
                        "nif" => $paiement['nif'], "email" => $paiement['email']
                    ],
                    "engin" => [
                        "id" => $paiement['engin_id'], "numero_plaque" => $paiement['numero_plaque'],
                        "marque" => $paiement['marque'], "modele" => $paiement['modele'],
                        "couleur" => $paiement['couleur'], "energie" => $paiement['energie'],
                        "usage_engin" => $paiement['usage_engin'], "puissance_fiscal" => $paiement['puissance_fiscal'],
                        "annee_fabrication" => $paiement['annee_fabrication'], "annee_circulation" => $paiement['annee_circulation'],
                        "numero_chassis" => $paiement['numero_chassis'], "numero_moteur" => $paiement['numero_moteur'],
                        "type_engin" => $paiement['type_engin']
                    ],
                    "taux" => $taux ?: ["taux_actif" => 2200, "date_application" => date('Y-m-d')],
                    "impot" => ["id" => $paiement['impot_id'], "nom" => $paiement['impot_nom'], "prix" => $paiement['impot_prix']],
                    "site" => ["nom_site" => $paiement['site_nom'], "code_site" => $paiement['site_code']]
                ]
            ];
        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("AssuranceMoto - Erreur vérification paiement bancaire: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    // ──────────────────────────────────────────────
    // LISTER ASSURANCES
    // ──────────────────────────────────────────────

    public function listerAssurances($filtres = [])
    {
        try {
            $conditions = ["am.etat = 1"];
            $params = [];

            if (!empty($filtres['site_id'])) {
                $conditions[] = "am.site_id = :site_id";
                $params[':site_id'] = (int)$filtres['site_id'];
            }
            if (!empty($filtres['type_mouvement'])) {
                $conditions[] = "am.type_mouvement = :type_mouvement";
                $params[':type_mouvement'] = $filtres['type_mouvement'];
            }
            if (!empty($filtres['date_debut'])) {
                $conditions[] = "am.date_souscription >= :date_debut";
                $params[':date_debut'] = $filtres['date_debut'];
            }
            if (!empty($filtres['date_fin'])) {
                $conditions[] = "am.date_souscription <= :date_fin";
                $params[':date_fin'] = $filtres['date_fin'] . ' 23:59:59';
            }
            if (!empty($filtres['recherche'])) {
                $conditions[] = "(e.numero_plaque LIKE :rech OR CONCAT(pt.nom, ' ', pt.prenom) LIKE :rech2 OR pt.telephone LIKE :rech3 OR am.code_assurance LIKE :rech4)";
                $params[':rech'] = '%' . $filtres['recherche'] . '%';
                $params[':rech2'] = '%' . $filtres['recherche'] . '%';
                $params[':rech3'] = '%' . $filtres['recherche'] . '%';
                $params[':rech4'] = '%' . $filtres['recherche'] . '%';
            }

            $where = implode(' AND ', $conditions);

            $sql = "SELECT am.id, am.id_paiement, am.impot_id, am.type_mouvement, am.duree_mois,
                           am.code_assurance, am.numero_assurance, am.date_souscription, am.date_validite, am.date_creation,
                           e.id as engin_id, e.numero_plaque, e.marque, '' as modele, e.couleur, e.energie,
                           e.usage_engin, e.puissance_fiscal, e.annee_fabrication, e.numero_chassis, e.numero_moteur, e.type_engin,
                           pt.id as particulier_id, CONCAT(pt.nom, ' ', pt.prenom) AS nom_complet,
                           pt.telephone, pt.rue AS adresse, pt.nif, pt.email,
                           pi.montant, pi.mode_paiement, pi.date_paiement,
                           s.nom as site_nom, s.code as site_code, am.utilisateur_nom
                    FROM assurances_moto am
                    INNER JOIN engins e ON am.engin_id = e.id
                    INNER JOIN particuliers pt ON am.particulier_id = pt.id
                    INNER JOIN paiements_immatriculation pi ON am.id_paiement = pi.id
                    INNER JOIN sites s ON am.site_id = s.id
                    WHERE {$where}
                    ORDER BY am.date_souscription DESC";

            $stmt = $this->pdo->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            $assurances = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $sqlSites = "SELECT id, nom, code FROM sites WHERE actif = 1 ORDER BY nom";
            $stmtSites = $this->pdo->prepare($sqlSites);
            $stmtSites->execute();
            $sites = $stmtSites->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => ["assurances" => $assurances, "sites" => $sites]];
        } catch (Exception $e) {
            error_log("AssuranceMoto - Erreur listerAssurances: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    // ──────────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────────

    private function getPaiementDetails($paiementId, $paiementData, $impot_id)
    {
        $sqlDetails = "SELECT p.*, s.nom as site_nom, u.nom_complet as caissier_nom,
                              e.numero_plaque as engin_plaque, e.marque as engin_marque,
                              e.couleur, e.energie, e.usage_engin, e.puissance_fiscal,
                              e.annee_fabrication, e.annee_circulation, e.numero_chassis,
                              e.numero_moteur, '' as engin_modele, e.type_engin as engin_type,
                              pt.nom as assujetti_nom, pt.prenom as assujetti_prenom,
                              pt.telephone as assujetti_telephone, pt.rue as assujetti_adresse,
                              pt.nif as assujetti_nif, pt.email as assujetti_email
                       FROM paiements_immatriculation p
                       LEFT JOIN sites s ON p.site_id = s.id
                       LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id
                       LEFT JOIN engins e ON p.engin_id = e.id
                       LEFT JOIN particuliers pt ON p.particulier_id = pt.id
                       WHERE p.id = :paiement_id";
        $stmtDetails = $this->pdo->prepare($sqlDetails);
        $stmtDetails->bindValue(':paiement_id', $paiementId, PDO::PARAM_INT);
        $stmtDetails->execute();
        $d = $stmtDetails->fetch(PDO::FETCH_ASSOC);

        if (!$d) return ["paiement_id" => $paiementId, "message" => "Paiement créé mais détails non récupérables"];

        $sqlRep = "SELECT r.*, b.nom as beneficiaire_nom, b.numero_compte
                   FROM repartition_paiements_immatriculation r
                   INNER JOIN beneficiaires b ON r.beneficiaire_id = b.id
                   WHERE r.id_paiement_immatriculation = :paiement_id ORDER BY r.id";
        $stmtRep = $this->pdo->prepare($sqlRep);
        $stmtRep->bindValue(':paiement_id', $paiementId, PDO::PARAM_INT);
        $stmtRep->execute();
        $repartitions = $stmtRep->fetchAll(PDO::FETCH_ASSOC);

        $repFormatted = [];
        $totalReparti = 0;
        foreach ($repartitions as $r) {
            $montant = (float)$r['montant'];
            $totalReparti += $montant;
            $repFormatted[] = [
                "beneficiaire_id" => $r['beneficiaire_id'], "beneficiaire_nom" => $r['beneficiaire_nom'],
                "numero_compte" => $r['numero_compte'], "type_part" => $r['type_part'],
                "valeur_part_originale" => (float)$r['valeur_part_originale'],
                "valeur_part_calculee" => (float)$r['valeur_part_calculee'], "montant" => $montant
            ];
        }

        return [
            "site" => ["nom_site" => $d['site_nom'] ?? "Central TSC-NPS", "fournisseur" => "TSC-NPS"],
            "assujetti" => [
                "id" => $paiementData['particulier_id'],
                "nom_complet" => trim(($d['assujetti_nom'] ?? '') . ' ' . ($d['assujetti_prenom'] ?? '')),
                "telephone" => $d['assujetti_telephone'] ?? '', "adresse" => $d['assujetti_adresse'] ?? '',
                "nif" => $d['assujetti_nif'] ?? '', "email" => $d['assujetti_email'] ?? ''
            ],
            "engin" => [
                "id" => $paiementData['engin_id'] ?? null, "numero_plaque" => $d['engin_plaque'] ?? '',
                "marque" => $d['engin_marque'] ?? '', "modele" => $d['engin_modele'] ?? '',
                "couleur" => $d['couleur'] ?? '', "energie" => $d['energie'] ?? '',
                "usage_engin" => $d['usage_engin'] ?? '', "puissance_fiscal" => $d['puissance_fiscal'] ?? '',
                "annee_fabrication" => $d['annee_fabrication'] ?? '', "numero_chassis" => $d['numero_chassis'] ?? '',
                "numero_moteur" => $d['numero_moteur'] ?? '', "type_engin" => $d['engin_type'] ?? ''
            ],
            "paiement" => [
                "id" => $paiementId, "montant" => $paiementData['montant'],
                "montant_initial" => $paiementData['montant_initial'],
                "mode_paiement" => $paiementData['mode_paiement'],
                "operateur" => $paiementData['operateur'] ?? null,
                "numero_transaction" => $paiementData['numero_transaction'] ?? null,
                "date_paiement" => $d['date_paiement'] ?? date('Y-m-d H:i:s'),
                "statut" => $paiementData['statut'] ?? 'completed'
            ],
            "repartition" => [
                "total_montant" => (float)$paiementData['montant'], "total_reparti" => round($totalReparti, 2),
                "reste" => round((float)$paiementData['montant'] - $totalReparti, 2),
                "details" => $repFormatted, "nombre_beneficiaires" => count($repFormatted)
            ],
            "taux" => ["taux_actif" => $paiementData['taux_cdf'] ?? 2200, "date_application" => date('Y-m-d')],
            "utilisateur" => [
                "id" => $paiementData['utilisateur_id'],
                "nom" => $d['caissier_nom'] ?? $paiementData['utilisateur_name'] ?? 'Caissier'
            ]
        ];
    }
}
?>
