<?php
// class/RefactorCarte.php
require_once 'Connexion.php';

/**
 * Classe RefactorCarte - Gestion du refactor des cartes avec erreurs
 */
class RefactorCarte extends Connexion
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
     * Récupère les données complètes d'un paiement par son ID (DGRK) ou numéro de plaque
     */
    public function recupererDonneesParIdDGRK($identifiant, $siteNom)
    {
        try {
            $provinceId = null;
            $parent = null;
            
            // Alternative: chercher directement par site_code dans la table sites
            $sqlSiteAlt = "SELECT province_id, id FROM sites WHERE code = :site_code AND actif = 1 LIMIT 1";
            $stmtSiteAlt = $this->pdo->prepare($sqlSiteAlt);
            $stmtSiteAlt->bindValue(':site_code', $siteNom, PDO::PARAM_STR);
            $stmtSiteAlt->execute();
            
            $siteDataAlt = $stmtSiteAlt->fetch(PDO::FETCH_ASSOC);
            
            if ($siteDataAlt && isset($siteDataAlt['province_id'])) {
                $provinceId = (int) $siteDataAlt['province_id'];
                $parent = (int) $siteDataAlt['id'];
            } else {
                return ["status" => "error", "message" => "Site non trouvé avec ce code."];
            }

            // D'abord, vérifier si l'identifiant est numérique (ID DGRK) ou alphanumérique (plaque)
            $isNumeric = is_numeric($identifiant);
            
            if ($isNumeric) {
                // Recherche par ID DGRK (pm.id)
                $sql = "SELECT 
                    pm.*,
                    e.*,
                    pm.id AS paiement_id,
                    p.nom, p.prenom, p.telephone, p.email, p.rue as adresse, p.nif,
                    p.reduction_type, p.reduction_valeur,
                    s.nom as site_nom, 'OPS' as caissier,
                    te.libelle as type_engin_libelle,
                    en.nom as energie_nom,
                    co.nom as couleur_nom,
                    us.libelle as usage_libelle,
                    pf.libelle as puissance_libelle
                    FROM paiements_immatriculation pm
                    INNER JOIN engins e ON pm.engin_id = e.id
                    INNER JOIN particuliers p ON pm.particulier_id = p.id
                    INNER JOIN sites s ON pm.site_id = s.id
                    LEFT JOIN type_engins te ON e.type_engin = te.libelle
                    LEFT JOIN energies en ON e.energie = en.nom
                    LEFT JOIN engin_couleurs co ON e.couleur = co.nom
                    LEFT JOIN usages_engins us ON e.usage_engin = us.libelle
                    LEFT JOIN puissances_fiscales pf ON e.puissance_fiscal = pf.libelle
                    WHERE s.province_id = :province_id 
                    AND pm.id = :id_dgrk
                    AND s.id = :site_id
                    ORDER BY s.id ASC, pm.id DESC
                    LIMIT 1";

                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([
                    ':province_id' => $provinceId, 
                    ':id_dgrk' => (int) $identifiant,
                    ':site_id' => $parent
                ]);
            } else {
                // Recherche par numéro de plaque
                $sql = "SELECT 
                    pm.*,
                    e.*,
                    pm.id AS paiement_id,
                    p.nom, p.prenom, p.telephone, p.email, p.rue as adresse, p.nif,
                    p.reduction_type, p.reduction_valeur,
                    s.nom as site_nom, 'OPS' as caissier,
                    te.libelle as type_engin_libelle,
                    en.nom as energie_nom,
                    co.nom as couleur_nom,
                    us.libelle as usage_libelle,
                    pf.libelle as puissance_libelle
                    FROM paiements_immatriculation pm
                    INNER JOIN engins e ON pm.engin_id = e.id
                    INNER JOIN particuliers p ON pm.particulier_id = p.id
                    INNER JOIN sites s ON pm.site_id = s.id
                    LEFT JOIN type_engins te ON e.type_engin = te.libelle
                    LEFT JOIN energies en ON e.energie = en.nom
                    LEFT JOIN engin_couleurs co ON e.couleur = co.nom
                    LEFT JOIN usages_engins us ON e.usage_engin = us.libelle
                    LEFT JOIN puissances_fiscales pf ON e.puissance_fiscal = pf.libelle
                    WHERE s.province_id = :province_id 
                    AND e.numero_plaque = :numero_plaque
                    AND s.id = :site_id
                    ORDER BY s.id ASC, pm.id DESC
                    LIMIT 1";

                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([
                    ':province_id' => $provinceId, 
                    ':numero_plaque' => $identifiant,
                    ':site_id' => $parent
                ]);
            }
            
            $donnees = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$donnees) {
                return ["status" => "error", "message" => "Aucune donnée trouvée pour l'identifiant: " . $identifiant];
            }

            // Formater les données pour le frontend
            $formattedData = [
                "id" => $donnees['paiement_id'],
                "engin_id" => $donnees['engin_id'],
                "particulier_id" => $donnees['particulier_id'],
                "numero_plaque" => $donnees['numero_plaque'],
                "type_engin" => $donnees['type_engin_libelle'] ?? $donnees['type_engin'],
                "marque" => $donnees['marque'],
                "energie" => $donnees['energie_nom'] ?? $donnees['energie'],
                "annee_fabrication" => $donnees['annee_fabrication'],
                "annee_circulation" => $donnees['annee_circulation'],
                "couleur" => $donnees['couleur_nom'] ?? $donnees['couleur'],
                "puissance_fiscal" => $donnees['puissance_libelle'] ?? $donnees['puissance_fiscal'],
                "usage_engin" => $donnees['usage_libelle'] ?? $donnees['usage_engin'],
                "numero_chassis" => $donnees['numero_chassis'],
                "numero_moteur" => $donnees['numero_moteur'],
                "nom" => $donnees['nom'],
                "prenom" => $donnees['prenom'],
                "telephone" => $donnees['telephone'],
                "email" => $donnees['email'],
                "adresse" => $donnees['adresse'],
                "nif" => $donnees['nif'],
                "montant" => $donnees['montant'] ?? 0,
                "mode_paiement" => $donnees['mode_paiement'],
                "date_paiement" => $donnees['date_paiement'],
                "site_nom" => $donnees['site_nom'],
                "caissier" => $donnees['caissier']
            ];

            return [
                "status" => "success",
                "message" => "Données récupérées avec succès",
                "data" => $formattedData
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des données DGRK: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }
    

    /**
     * Met à jour les données d'un engin et d'un particulier pour le refactor
     */
    public function mettreAJourDonneesRefactor($idDGRK, $donneesEngin, $donneesParticulier, $siteCode)
    {
        try {
            $this->beginTransactionSafe();

            /* ================= SITE ================= */
            $sqlSite = "SELECT id, province_id, nom AS site_nom 
                        FROM sites 
                        WHERE code = :site_code AND actif = 1 
                        LIMIT 1";

            $stmtSite = $this->pdo->prepare($sqlSite);
            $stmtSite->execute([':site_code' => $siteCode]);
            $siteData = $stmtSite->fetch(PDO::FETCH_ASSOC);

            if (!$siteData) {
                return ["status" => "error", "message" => "Site non trouvé : " . $siteCode];
            }

            $siteId   = $siteData['id'];
            $provinceId  = $siteData['province_id'];

            // Récupération de l'engin_id, particulier_id, site_id et l'ID du paiement
            $sqlPaiement = "SELECT 
                           pm.id as paiement_id,
                           pm.engin_id, 
                           pm.particulier_id, 
                           pm.site_id,
                           pm.utilisateur_id,
                           e.id as engins_id
                        FROM paiements_immatriculation pm
                        INNER JOIN engins e 
                            ON pm.engin_id = e.id
                        INNER JOIN sites s 
                            ON pm.site_id = s.id
                        WHERE 
                            (pm.id = :id_dgrk OR e.numero_plaque = :id_dgrk)
                            AND s.province_id = :province_id
                        LIMIT 1";

            $stmtPaiement = $this->pdo->prepare($sqlPaiement);
            $stmtPaiement->execute([':id_dgrk' => $idDGRK, ':province_id' => $provinceId]);
            
            $paiement = $stmtPaiement->fetch(PDO::FETCH_ASSOC);

            if (!$paiement) {
                return ["status" => "error", "message" => "Paiement non trouvé avec l'ID DGRK ou numéro de plaque: " . $idDGRK];
            }

            $paiementId = $paiement['paiement_id'];
            $enginId = $paiement['engin_id'];
            $particulierId = $paiement['particulier_id'];
            $siteId = $paiement['site_id'];
            $userId = $paiement['utilisateur_id'];

            // Mise à jour des données du particulier
            $sqlParticulier = "UPDATE particuliers SET 
                              nom = :nom, 
                              prenom = :prenom, 
                              telephone = :telephone, 
                              email = :email, 
                              rue = :adresse, 
                              nif = :nif,
                              site = :site,
                              date_modification = NOW()
                              WHERE id = :particulier_id";

            $stmtParticulier = $this->pdo->prepare($sqlParticulier);
            $resultParticulier = $stmtParticulier->execute([
                ':nom' => $donneesParticulier['nom'] ?? '',
                ':prenom' => $donneesParticulier['prenom'] ?? '',
                ':telephone' => $donneesParticulier['telephone'] ?? '',
                ':email' => $donneesParticulier['email'] ?? '',
                ':adresse' => $donneesParticulier['adresse'] ?? '',
                ':nif' => $donneesParticulier['nif'] ?? '',
                ':site' => $siteId ?? '',
                ':particulier_id' => $particulierId
            ]);

            if (!$resultParticulier) {
                $errorInfo = $stmtParticulier->errorInfo();
                return ["status" => "error", "message" => "Échec de la mise à jour des données du particulier: " . ($errorInfo[2] ?? 'Erreur inconnue')];
            }

            // Récupération des IDs pour les relations
            $typeEnginId = $this->getTypeEnginId($donneesEngin['type_engin'] ?? '');
            $energieId = $this->getEnergieId($donneesEngin['energie'] ?? '');
            $couleurId = $this->getCouleurId($donneesEngin['couleur'] ?? '');
            $usageId = $this->getUsageId($donneesEngin['usage_engin'] ?? '');
            $puissanceId = $this->getPuissanceId($donneesEngin['puissance_fiscal'] ?? '');

            // Récupération des données de l'engin actuel pour le numéro de plaque
            $sqlCurrentEngin = "SELECT numero_plaque FROM engins WHERE id = :engin_id AND site_id IN (SELECT id FROM sites WHERE province_id = :province_id)";
            $stmtCurrentEngin = $this->pdo->prepare($sqlCurrentEngin);
            $stmtCurrentEngin->execute([':engin_id' => $enginId, ':province_id' => $provinceId]);
            $currentEngin = $stmtCurrentEngin->fetch(PDO::FETCH_ASSOC);
            
            $numeroPlaque = $currentEngin ? $currentEngin['numero_plaque'] : '';

            // Mise à jour des données de l'engin
            $sqlEngin = "UPDATE engins SET 
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
                        date_modification = NOW()
                        WHERE id = :engin_id";

            $stmtEngin = $this->pdo->prepare($sqlEngin);
            $resultEngin = $stmtEngin->execute([
                ':type_engin' => $donneesEngin['type_engin'],
                ':marque' => $donneesEngin['marque'] ?? '',
                ':energie' => $donneesEngin['energie'],
                ':annee_fabrication' => $donneesEngin['annee_fabrication'] ?? '',
                ':annee_circulation' => $donneesEngin['annee_circulation'] ?? '',
                ':couleur' => $donneesEngin['couleur'],
                ':puissance_fiscal' => $donneesEngin['puissance_fiscal'],
                ':usage_engin' => $donneesEngin['usage_engin'],
                ':numero_chassis' => $donneesEngin['numero_chassis'] ?? '',
                ':numero_moteur' => $donneesEngin['numero_moteur'] ?? '',
                ':engin_id' => $enginId
            ]);

            if (!$resultEngin) {
                $errorInfo = $stmtEngin->errorInfo();
                return ["status" => "error", "message" => "Échec de la mise à jour des données de l'engin: " . ($errorInfo[2] ?? 'Erreur inconnue')];
            }

            // Vérification si une entrée existe déjà dans carte_reprint pour ce paiement
            $sqlCheckReprint = "SELECT id FROM carte_reprint WHERE id_paiement = :paiement_id";
            $stmtCheckReprint = $this->pdo->prepare($sqlCheckReprint);
            $stmtCheckReprint->execute([':paiement_id' => $paiementId]);
            $existingReprint = $stmtCheckReprint->fetch(PDO::FETCH_ASSOC);

            // Mise à jour ou insertion dans carte_reprint
            if ($existingReprint) {
                // Mise à jour de l'entrée existante
                $sqlUpdateReprint = "UPDATE carte_reprint SET
                                    nom_proprietaire = :nom_proprietaire,
                                    adresse_proprietaire = :adresse_proprietaire,
                                    nif_proprietaire = :nif_proprietaire,
                                    annee_mise_circulation = :annee_mise_circulation,
                                    numero_plaque = :numero_plaque,
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
                                    date_creation = NOW()
                                    WHERE id_paiement = :id_paiement";

                $stmtUpdateReprint = $this->pdo->prepare($sqlUpdateReprint);
                $resultUpdateReprint = $stmtUpdateReprint->execute([
                    ':nom_proprietaire' => ($donneesParticulier['prenom'] ?? '') . ' ' . ($donneesParticulier['nom'] ?? ''),
                    ':adresse_proprietaire' => $donneesParticulier['adresse'] ?? '',
                    ':nif_proprietaire' => $donneesParticulier['nif'] ?? '',
                    ':annee_mise_circulation' => $donneesEngin['annee_circulation'] ?? '',
                    ':numero_plaque' => $numeroPlaque,
                    ':marque_vehicule' => $donneesEngin['marque'] ?? '',
                    ':usage_vehicule' => $donneesEngin['usage_engin'] ?? '',
                    ':numero_chassis' => $donneesEngin['numero_chassis'] ?? '',
                    ':numero_moteur' => $donneesEngin['numero_moteur'] ?? '',
                    ':annee_fabrication' => $donneesEngin['annee_fabrication'] ?? '',
                    ':couleur_vehicule' => $donneesEngin['couleur'] ?? '',
                    ':puissance_vehicule' => $donneesEngin['puissance_fiscal'] ?? '',
                    ':utilisateur_id' => $userId,
                    ':site_id' => $siteId,
                    ':status' => 1, // Status 1 pour indiquer que c'est un refactor
                    ':id_paiement' => $paiementId
                ]);
                
                if (!$resultUpdateReprint) {
                    $errorInfo = $stmtUpdateReprint->errorInfo();
                    return ["status" => "error", "message" => "Échec de la mise à jour dans carte_reprint: " . ($errorInfo[2] ?? 'Erreur inconnue')];
                }
            } else {
                // Insertion d'une nouvelle entrée
                $sqlInsertReprint = "INSERT INTO carte_reprint (
                                    nom_proprietaire,
                                    adresse_proprietaire,
                                    nif_proprietaire,
                                    annee_mise_circulation,
                                    numero_plaque,
                                    marque_vehicule,
                                    usage_vehicule,
                                    numero_chassis,
                                    numero_moteur,
                                    annee_fabrication,
                                    couleur_vehicule,
                                    puissance_vehicule,
                                    utilisateur_id,
                                    site_id,
                                    status,
                                    id_paiement,
                                    date_creation
                                    ) VALUES (
                                    :nom_proprietaire,
                                    :adresse_proprietaire,
                                    :nif_proprietaire,
                                    :annee_mise_circulation,
                                    :numero_plaque,
                                    :marque_vehicule,
                                    :usage_vehicule,
                                    :numero_chassis,
                                    :numero_moteur,
                                    :annee_fabrication,
                                    :couleur_vehicule,
                                    :puissance_vehicule,
                                    :utilisateur_id,
                                    :site_id,
                                    :status,
                                    :id_paiement,
                                    NOW()
                                    )";

                $stmtInsertReprint = $this->pdo->prepare($sqlInsertReprint);
                $resultInsertReprint = $stmtInsertReprint->execute([
                    ':nom_proprietaire' => ($donneesParticulier['prenom'] ?? '') . ' ' . ($donneesParticulier['nom'] ?? ''),
                    ':adresse_proprietaire' => $donneesParticulier['adresse'] ?? '',
                    ':nif_proprietaire' => $donneesParticulier['nif'] ?? '',
                    ':annee_mise_circulation' => $donneesEngin['annee_circulation'] ?? '',
                    ':numero_plaque' => $numeroPlaque,
                    ':marque_vehicule' => $donneesEngin['marque'] ?? '',
                    ':usage_vehicule' => $donneesEngin['usage_engin'] ?? '',
                    ':numero_chassis' => $donneesEngin['numero_chassis'] ?? '',
                    ':numero_moteur' => $donneesEngin['numero_moteur'] ?? '',
                    ':annee_fabrication' => $donneesEngin['annee_fabrication'] ?? '',
                    ':couleur_vehicule' => $donneesEngin['couleur'] ?? '',
                    ':puissance_vehicule' => $donneesEngin['puissance_fiscal'] ?? '',
                    ':utilisateur_id' => $userId,
                    ':site_id' => $siteId,
                    ':status' => 1, // Status 1 pour indiquer que c'est un refactor
                    ':id_paiement' => $paiementId
                ]);
                
                if (!$resultInsertReprint) {
                    $errorInfo = $stmtInsertReprint->errorInfo();
                    return ["status" => "error", "message" => "Échec de l'insertion dans carte_reprint: " . ($errorInfo[2] ?? 'Erreur inconnue')];
                }
            }

            // Journalisation de l'action de refactor
            $logResult = $this->logAuditRefactor($paiementId, $enginId, $particulierId, $userId, $siteId);

            $this->commitSafe();

            // Récupération des données mises à jour pour le retour
            $sqlUpdated = "SELECT 
                          pm.id as paiement_id,
                          e.numero_plaque,
                          p.nom, 
                          p.prenom,
                          p.rue as adresse,
                          p.nif,
                          te.libelle as type_engin_libelle,
                          en.nom as energie_nom,
                          co.nom as couleur_nom,
                          us.libelle as usage_libelle,
                          pf.libelle as puissance_libelle,
                          e.marque,
                          e.numero_chassis,
                          e.numero_moteur,
                          e.annee_fabrication,
                          e.annee_circulation
                          FROM paiements_immatriculation pm
                          INNER JOIN engins e ON pm.engin_id = e.id
                          INNER JOIN particuliers p ON pm.particulier_id = p.id
                          LEFT JOIN type_engins te ON e.type_engin = te.id
                          LEFT JOIN energies en ON e.energie = en.id
                          LEFT JOIN engin_couleurs co ON e.couleur = co.id
                          LEFT JOIN usages_engins us ON e.usage_engin = us.id
                          LEFT JOIN puissances_fiscales pf ON e.puissance_fiscal = pf.id
                          WHERE pm.id = :paiement_id";

            $stmtUpdated = $this->pdo->prepare($sqlUpdated);
            $stmtUpdated->execute([':paiement_id' => $paiementId]);
            $updatedData = $stmtUpdated->fetch(PDO::FETCH_ASSOC);

            // Ajout également des données de carte_reprint
            if ($updatedData) {
                $sqlReprintData = "SELECT * FROM carte_reprint WHERE id_paiement = :paiement_id ORDER BY date_creation DESC LIMIT 1";
                $stmtReprintData = $this->pdo->prepare($sqlReprintData);
                $stmtReprintData->execute([':paiement_id' => $paiementId]);
                $reprintData = $stmtReprintData->fetch(PDO::FETCH_ASSOC);
                
                if ($reprintData) {
                    $updatedData['reprint_data'] = $reprintData;
                }
            }

            return [
                "status" => "success",
                "message" => "Données mises à jour avec succès",
                "data" => $updatedData
            ];

        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("Erreur lors de la mise à jour refactor: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur: " . $e->getMessage()];
        }
    }


    /**
     * Crée un nouvel enregistrement pour les données externes
     */
    public function creerNouveauRefactor($numeroPlaque, $donneesEngin, $donneesParticulier, $siteCode)
    {
        try {
            $this->beginTransactionSafe();

            // ================= SITE =================
            $sqlSite = "SELECT id, province_id, nom AS site_nom 
                        FROM sites 
                        WHERE code = :site_code AND actif = 1 
                        LIMIT 1";

            $stmtSite = $this->pdo->prepare($sqlSite);
            $stmtSite->execute([':site_code' => $siteCode]);
            $siteData = $stmtSite->fetch(PDO::FETCH_ASSOC);

            if (!$siteData) {
                return ["status" => "error", "message" => "Site non trouvé : " . $siteCode];
            }

            $siteId   = $siteData['id'];
            $provinceId   = $siteData['province_id'];
            $siteNom  = $siteData['site_nom'];

            // ================= Utilisateur =================
            $sqlUtilisateur = "SELECT id  
                        FROM utilisateurs 
                        WHERE site_affecte_id = :site_affecte_id AND actif = 1 
                        LIMIT 1";

            $stmtUtilisateur = $this->pdo->prepare($sqlUtilisateur);
            $stmtUtilisateur->execute([':site_affecte_id' => $siteId]);
            $utilisateurData = $stmtUtilisateur->fetch(PDO::FETCH_ASSOC);

            if (!$utilisateurData) {
                return ["status" => "error", "message" => "Utilisateur non trouvé : " . $siteCode];
            }

            $utilisateurId   = $utilisateurData['id'];

            // ================= IDS =================
            $typeEnginId = $this->getTypeEnginId($donneesEngin['type_engin'] ?? '');
            $energieId   = $this->getEnergieId($donneesEngin['energie'] ?? '');
            $couleurId   = $this->getCouleurId($donneesEngin['couleur'] ?? '');
            $usageId     = $this->getUsageId($donneesEngin['usage_engin'] ?? '');
            $puissanceId = $this->getPuissanceId($donneesEngin['puissance_fiscal'] ?? '');

            // ================= PARTICULIER =================
            // Préparation des critères de recherche en ignorant les valeurs vides/tiret
            $searchParams = [];
            $searchConditions = [];

            if (!empty($donneesParticulier['telephone']) && strlen($donneesParticulier['telephone']) > 8 ) {
                $searchParams[':telephone'] = $donneesParticulier['telephone'];
                $searchConditions[] = 'telephone = :telephone';
            }

            if (!empty($donneesParticulier['email']) && strlen($donneesParticulier['email']) > 5) {
                $searchParams[':email'] = $donneesParticulier['email'];
                $searchConditions[] = 'email = :email';
            }

            if (!empty($donneesParticulier['nif']) && strlen($donneesParticulier['nif']) > 5) {
                $searchParams[':nif'] = $donneesParticulier['nif'];
                $searchConditions[] = 'nif = :nif';
            }

            // Vérification si un particulier existe déjà avec l'un de ces identifiants
            $existingParticulier = null;
            $particulierId = null;

            if (!empty($searchConditions)) {
                $sqlCheck = "SELECT id FROM particuliers WHERE " . implode(' OR ', $searchConditions) . " LIMIT 1";
                $stmtCheck = $this->pdo->prepare($sqlCheck);
                $stmtCheck->execute($searchParams);
                $existingParticulier = $stmtCheck->fetch();
            }

            if ($existingParticulier) {
                // Mise à jour si le particulier existe
                $sqlParticulier = "UPDATE particuliers SET 
                                    nom = :nom,
                                    prenom = :prenom,
                                    telephone = :telephone,
                                    email = :email,
                                    rue = :adresse,
                                    nif = :nif,
                                    date_modification = NOW(),
                                    site = :site
                                  WHERE id = :id";
                
                $stmt = $this->pdo->prepare($sqlParticulier);
                $resultParticulier = $stmt->execute([
                    ':id'         => $existingParticulier['id'],
                    ':nom'        => $donneesParticulier['nom'] ?? '',
                    ':prenom'     => $donneesParticulier['prenom'] ?? '',
                    ':telephone'  => !empty($donneesParticulier['telephone']) && $donneesParticulier['telephone'] !== '-' 
                                     ? $donneesParticulier['telephone'] : '',
                    ':email'      => !empty($donneesParticulier['email']) && $donneesParticulier['email'] !== '-' 
                                     ? $donneesParticulier['email'] : '',
                    ':adresse'    => $donneesParticulier['adresse'] ?? '',
                    ':nif'        => !empty($donneesParticulier['nif']) && $donneesParticulier['nif'] !== '-' 
                                     ? $donneesParticulier['nif'] : '',
                    ':site'       => $siteId
                ]);
                
                if (!$resultParticulier) {
                    $errorInfo = $stmt->errorInfo();
                    return ["status" => "error", "message" => "Échec de la mise à jour du particulier: " . ($errorInfo[2] ?? 'Erreur inconnue')];
                }
                
                $particulierId = $existingParticulier['id'];
            } else {
                // Insertion si le particulier n'existe pas
                $sqlParticulier = "INSERT INTO particuliers
                            (nom, prenom, telephone, email, rue, nif, site, date_creation, date_modification)
                            VALUES (:nom, :prenom, :telephone, :email, :adresse, :nif, :site, NOW(), NOW())";

                $stmt = $this->pdo->prepare($sqlParticulier);
                $resultParticulier = $stmt->execute([
                    ':nom'       => $donneesParticulier['nom'] ?? '',
                    ':prenom'    => $donneesParticulier['prenom'] ?? '',
                    ':telephone' => !empty($donneesParticulier['telephone']) && $donneesParticulier['telephone'] !== '-' 
                                    ? $donneesParticulier['telephone'] : '',
                    ':email'     => !empty($donneesParticulier['email']) && $donneesParticulier['email'] !== '-' 
                                    ? $donneesParticulier['email'] : '',
                    ':adresse'   => $donneesParticulier['adresse'] ?? '',
                    ':nif'       => !empty($donneesParticulier['nif']) && $donneesParticulier['nif'] !== '-' 
                                    ? $donneesParticulier['nif'] : '',
                    ':site'      => $siteId
                ]);
                
                if (!$resultParticulier) {
                    $errorInfo = $stmt->errorInfo();
                    return ["status" => "error", "message" => "Échec de l'insertion du particulier: " . ($errorInfo[2] ?? 'Erreur inconnue')];
                }
                
                $particulierId = $this->pdo->lastInsertId();
            }

            // ================= PLAQUE =================
            $numeroPlaque = trim($numeroPlaque);
            $prefixe = substr($numeroPlaque, 0, 2);  // AA
            $numero  = substr($numeroPlaque, 2);     // 001, 587, etc

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
            // Vérification si l'engin existe déjà
            $sqlCheck = "
                SELECT e.id, e.site_id
                FROM engins e
                INNER JOIN sites s ON e.site_id = s.id
                WHERE e.numero_plaque = :numero_plaque AND s.province_id = :province_id
                LIMIT 1
            ";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([':numero_plaque' => $numeroPlaque, ':province_id' => $provinceId]);
            $existingEngin = $stmtCheck->fetch();

            if ($existingEngin) {
                // Mise à jour si l'engin existe
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
                            WHERE numero_plaque = :numero_plaque AND id = :idEngin";
                
                $stmt = $this->pdo->prepare($sqlEngin);
                $resultEngin = $stmt->execute([
                    ':type_engin'        => $donneesEngin['type_engin'],
                    ':impot_id'          => 11,
                    ':marque'            => $donneesEngin['marque'] ?? '',
                    ':energie'           => $energieId,
                    ':annee_fabrication' => $donneesEngin['annee_fabrication'] ?? '',
                    ':annee_circulation' => $donneesEngin['annee_circulation'] ?? '',
                    ':couleur'           => $couleurId,
                    ':puissance_fiscal'  => $puissanceId,
                    ':usage_engin'       => $usageId,
                    ':utilisateur_id'    => $_SESSION['user_id'] ?? 1,
                    ':numero_chassis'    => $donneesEngin['numero_chassis'] ?? '',
                    ':numero_moteur'     => $donneesEngin['numero_moteur'] ?? '',
                    ':numero_plaque'     => $numeroPlaque,
                    ':particulier_id'    => $particulierId,
                    ':serie_id'          => $serieData['id'],
                    ':serie_item_id'     => $serieItemData['id'],
                    ':site_id'           => $siteId,
                    ':idEngin'           => $existingEngin['id']
                ]);
                
                if (!$resultEngin) {
                    $errorInfo = $stmt->errorInfo();
                    return ["status" => "error", "message" => "Échec de la mise à jour de l'engin: " . ($errorInfo[2] ?? 'Erreur inconnue')];
                }
                
                $enginId = $existingEngin['id'];
            } else {
                // Insertion si l'engin n'existe pas
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
                    ':type_engin'        => $donneesEngin['type_engin'],
                    ':impot_id'          => 11,
                    ':marque'            => $donneesEngin['marque'] ?? '',
                    ':energie'           => $donneesEngin['energie'],
                    ':annee_fabrication' => $donneesEngin['annee_fabrication'] ?? '',
                    ':annee_circulation' => $donneesEngin['annee_circulation'] ?? '',
                    ':couleur'           => $donneesEngin['couleur'],
                    ':puissance_fiscal'  => $donneesEngin['puissance_fiscal'],
                    ':usage_engin'       => $donneesEngin['usage_engin'],
                    ':utilisateur_id'    => $_SESSION['user_id'] ?? 1,
                    ':numero_chassis'    => $donneesEngin['numero_chassis'] ?? '',
                    ':numero_moteur'     => $donneesEngin['numero_moteur'] ?? '',
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
            $userId = $utilisateurId;

            $stmt = $this->pdo->prepare(
                "INSERT INTO paiements_immatriculation
                (engin_id, impot_id, particulier_id, site_id, utilisateur_id,
                 montant, mode_paiement, statut, date_paiement)
                VALUES
                (:engin_id, :impot_id, :particulier_id, :site_id, :utilisateur_id,
                 0, 'espece', 'completed', NOW())"
            );

            $resultPaiement = $stmt->execute([
                ':engin_id'        => $enginId,
                ':impot_id'        => 11,
                ':particulier_id'  => $particulierId,
                ':site_id'         => $siteId,
                ':utilisateur_id'  => $userId
            ]);

            if (!$resultPaiement) {
                $errorInfo = $stmt->errorInfo();
                return ["status" => "error", "message" => "Échec de l'insertion du paiement: " . ($errorInfo[2] ?? 'Erreur inconnue')];
            }

            $paiementId = $this->pdo->lastInsertId();
            
            // Vérification et création/mise à jour dans carte_reprint
            $sqlCheck = "
                SELECT cr.id
                FROM carte_reprint cr
                INNER JOIN sites s ON cr.site_id = s.id
                WHERE cr.numero_plaque = :numero_plaque
                AND s.province_id = :province_id
                LIMIT 1
            ";

            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([
                ':numero_plaque' => $numeroPlaque,
                ':province_id'   => $provinceId
            ]);

            $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            // ============================
            // PREPARATION DONNEES COMMUNES
            // ============================

            $params = [
                ':nom_proprietaire'        => trim(($donneesParticulier['prenom'] ?? '') . ' ' . ($donneesParticulier['nom'] ?? '')),
                ':adresse_proprietaire'    => $donneesParticulier['adresse'] ?? '',
                ':nif_proprietaire'        => $donneesParticulier['nif'] ?? '',
                ':annee_mise_circulation'  => $donneesEngin['annee_circulation'] ?? '',
                ':numero_plaque'           => $numeroPlaque,
                ':marque_vehicule'         => $donneesEngin['marque'] ?? '',
                ':usage_vehicule'          => $donneesEngin['usage_engin'],
                ':numero_chassis'          => $donneesEngin['numero_chassis'] ?? '',
                ':numero_moteur'           => $donneesEngin['numero_moteur'] ?? '',
                ':annee_fabrication'       => $donneesEngin['annee_fabrication'] ?? '',
                ':couleur_vehicule'        => $donneesEngin['couleur'],
                ':puissance_vehicule'      => $donneesEngin['puissance_fiscal'],
                ':utilisateur_id'          => $userId,
                ':site_id'                 => $siteId,
                ':status'                  => 1,
                ':id_paiement'             => $paiementId
            ];


            // ============================
            // CAS UPDATE
            // ============================

            if ($existing) {

                $sqlReprint = "
                    UPDATE carte_reprint SET
                        nom_proprietaire       = :nom_proprietaire,
                        adresse_proprietaire   = :adresse_proprietaire,
                        nif_proprietaire       = :nif_proprietaire,
                        annee_mise_circulation = :annee_mise_circulation,
                        marque_vehicule        = :marque_vehicule,
                        usage_vehicule         = :usage_vehicule,
                        numero_chassis         = :numero_chassis,
                        numero_moteur          = :numero_moteur,
                        annee_fabrication      = :annee_fabrication,
                        couleur_vehicule       = :couleur_vehicule,
                        puissance_vehicule     = :puissance_vehicule,
                        utilisateur_id         = :utilisateur_id,
                        site_id                = :site_id,
                        status                 = :status,
                        id_paiement            = :id_paiement
                    WHERE id = :id
                ";

                $params[':id'] = $existing['id'];

            } 
            // ============================
            // CAS INSERT
            // ============================
            else {

                $sqlReprint = "
                    INSERT INTO carte_reprint (
                        nom_proprietaire,
                        adresse_proprietaire,
                        nif_proprietaire,
                        annee_mise_circulation,
                        numero_plaque,
                        marque_vehicule,
                        usage_vehicule,
                        numero_chassis,
                        numero_moteur,
                        annee_fabrication,
                        couleur_vehicule,
                        puissance_vehicule,
                        utilisateur_id,
                        site_id,
                        status,
                        id_paiement,
                        date_creation
                    ) VALUES (
                        :nom_proprietaire,
                        :adresse_proprietaire,
                        :nif_proprietaire,
                        :annee_mise_circulation,
                        :numero_plaque,
                        :marque_vehicule,
                        :usage_vehicule,
                        :numero_chassis,
                        :numero_moteur,
                        :annee_fabrication,
                        :couleur_vehicule,
                        :puissance_vehicule,
                        :utilisateur_id,
                        :site_id,
                        :status,
                        :id_paiement,
                        NOW()
                    )
                ";
            }

            // ============================
            // EXECUTION
            // ============================

            $stmtReprint = $this->pdo->prepare($sqlReprint);
            $resultReprint = $stmtReprint->execute($params);
            
            if (!$resultReprint) {
                $errorInfo = $stmtReprint->errorInfo();
                return ["status" => "error", "message" => "Échec de l'opération dans carte_reprint: " . ($errorInfo[2] ?? 'Erreur inconnue')];
            }
            
            $this->commitSafe();
            
            // Retour des données créées avec le site_nom
            return [
                "status" => "success",
                "message" => "Nouvel enregistrement créé avec succès",
                "data" => [
                    "id" => $paiementId,
                    "numero_plaque" => $numeroPlaque,
                    "montant" => 0,
                    "source" => "externe",
                    "site_nom" => $siteNom
                ]
            ];

        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("Erreur lors de la création du refactor: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur: " . $e->getMessage()];
        }
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
     * Log l'action de refactor
     */
    private function logAuditRefactor($idDGRK, $enginId, $particulierId, $userId, $siteId)
    {
        try {
            $userType = 'OPS';
            $message = "Refactor carte - DGRK: $idDGRK - Engin: $enginId - Particulier: $particulierId";
            
            $sql = "INSERT INTO audit_log (user_id, user_type, action) 
                    VALUES (:user_id, :user_type, :action)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':user_id' => $userId,
                ':user_type' => $userType,
                ':action' => $message
            ]);
        } catch (PDOException $e) {
            error_log("Erreur lors du log d'audit refactor: " . $e->getMessage());
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
            error_log("ATTENTION: Transaction toujours active à la destruction de l'objet RefactorCarte");
            $this->rollbackSafe();
        }
    }
}
?>