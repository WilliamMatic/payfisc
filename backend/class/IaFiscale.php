<?php
require_once 'Connexion.php';

/**
 * Classe IAFiscale - Gestion complète des données pour l'IA fiscale
 * Version étendue avec sites, localités, audits et données temporelles
 */
class IAFiscale extends Connexion
{
    /**
     * Récupère toutes les données fiscales structurées pour l'IA
     */
    public function getDonneesFiscalesCompletes()
    {
        try {
            $this->pdo->beginTransaction();

            // Récupération des séries et plaques avec provinces
            $seriesData = $this->getSeriesEtPlaquesAvecProvinces();
            
            // Récupération des particuliers avec leurs engins et sites
            $particuliersData = $this->getParticuliersAvecEnginsEtSites();
            
            // Récupération des paiements et répartitions avec localisation
            $paiementsData = $this->getPaiementsEtRepartitionsAvecLocalisation();
            
            // Récupération des bénéficiaires
            $beneficiairesData = $this->getBeneficiaires();
            
            // Récupération des impôts
            $impotsData = $this->getImpots();
            
            // Récupération des sites et provinces
            $sitesData = $this->getSitesEtProvinces();
            
            // Récupération des audits récents
            $auditsData = $this->getAuditsRecents();

            $this->pdo->commit();

            return [
                "status" => "success",
                "data" => [
                    "series" => $seriesData,
                    "particuliers" => $particuliersData,
                    "paiements" => $paiementsData,
                    "beneficiaires" => $beneficiairesData,
                    "impots" => $impotsData,
                    "sites" => $sitesData,
                    "audits" => $auditsData,
                    "metadata" => [
                        "timestamp" => date('Y-m-d H:i:s'),
                        "total_particuliers" => count($particuliersData),
                        "total_engins" => $this->compterTotalEngins($particuliersData),
                        "total_paiements" => count($paiementsData),
                        "total_sites" => count($sitesData['sites']),
                        "total_provinces" => count($sitesData['provinces'])
                    ]
                ]
            ];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de la récupération des données fiscales: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère les séries et les plaques avec informations des provinces
     */
    private function getSeriesEtPlaquesAvecProvinces()
    {
        $sql = "SELECT 
                    s.id, 
                    s.nom_serie, 
                    s.description,
                    s.actif,
                    s.province_id,
                    p.nom as province_nom,
                    p.code as province_code,
                    COUNT(si.id) as total_items,
                    SUM(CASE WHEN si.statut = '0' THEN 1 ELSE 0 END) as plaques_disponibles,
                    SUM(CASE WHEN si.statut = '1' THEN 1 ELSE 0 END) as plaques_utilisees,
                    DATE_FORMAT(s.date_creation, '%d/%m/%Y %H:%i') as date_creation,
                    DATE_FORMAT(s.date_modification, '%d/%m/%Y %H:%i') as date_modification
                FROM series s
                LEFT JOIN provinces p ON s.province_id = p.id
                LEFT JOIN serie_items si ON s.id = si.serie_id
                GROUP BY s.id, s.nom_serie, s.description, s.actif, s.province_id, p.nom, p.code
                ORDER BY s.nom_serie";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Récupère les particuliers avec leurs engins détaillés et informations de site
     */
    private function getParticuliersAvecEnginsEtSites()
    {
        $sql = "SELECT 
                    p.id,
                    p.nom,
                    p.prenom,
                    p.date_naissance,
                    p.lieu_naissance,
                    p.sexe,
                    CONCAT(p.rue, ', ', p.ville, ', ', p.code_postal) as adresse_complete,
                    p.ville,
                    p.code_postal,
                    p.province,
                    p.id_national,
                    p.telephone,
                    p.email,
                    p.nif,
                    p.situation_familiale,
                    p.dependants,
                    p.actif,
                    p.reduction_type,
                    p.reduction_valeur,
                    p.reduction_montant_max,
                    p.site as site_id,
                    s.nom as site_nom,
                    s.code as site_code,
                    DATE_FORMAT(p.date_creation, '%d/%m/%Y %H:%i') as date_inscription,
                    DATE_FORMAT(p.date_modification, '%d/%m/%Y %H:%i') as date_derniere_modification,
                    
                    -- Engins du particulier avec informations de site
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'engin_id', e.id,
                            'numero_plaque', e.numero_plaque,
                            'type_engin', e.type_engin,
                            'marque', e.marque,
                            'energie', e.energie,
                            'annee_fabrication', e.annee_fabrication,
                            'annee_circulation', e.annee_circulation,
                            'couleur', e.couleur,
                            'puissance_fiscal', e.puissance_fiscal,
                            'usage_engin', e.usage_engin,
                            'numero_chassis', e.numero_chassis,
                            'numero_moteur', e.numero_moteur,
                            'impot_id', e.impot_id,
                            'site_id', e.site_id,
                            'site_nom', es.nom,
                            'site_code', es.code,
                            'date_immatriculation', DATE_FORMAT(e.date_creation, '%d/%m/%Y %H:%i'),
                            'date_derniere_modification', DATE_FORMAT(e.date_modification, '%d/%m/%Y %H:%i')
                        )
                    ) as engins

                FROM particuliers p
                LEFT JOIN engins e ON p.id = e.particulier_id
                LEFT JOIN sites s ON p.site = s.id
                LEFT JOIN sites es ON e.site_id = es.id
                WHERE p.actif = 1
                GROUP BY p.id, p.nom, p.prenom, p.nif, p.site, s.nom, s.code
                ORDER BY p.nom, p.prenom";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Décoder le JSON des engins
        foreach ($resultats as &$particulier) {
            $particulier['engins'] = $particulier['engins'] ? json_decode($particulier['engins'], true) : [];
            // Nettoyer les valeurs null du tableau
            $particulier['engins'] = array_filter($particulier['engins'], function($engin) {
                return $engin['engin_id'] !== null;
            });
        }

        return $resultats;
    }

    /**
     * Récupère les paiements avec leurs répartitions et informations de localisation
     */
    private function getPaiementsEtRepartitionsAvecLocalisation()
    {
        $sql = "SELECT 
                    pi.id,
                    pi.engin_id,
                    pi.particulier_id,
                    pi.montant,
                    pi.montant_initial,
                    pi.impot_id,
                    pi.mode_paiement,
                    pi.operateur,
                    pi.numero_transaction,
                    pi.numero_cheque,
                    pi.banque,
                    pi.statut,
                    pi.nombre_plaques,
                    pi.etat,
                    pi.site_id,
                    s.nom as site_nom,
                    s.code as site_code,
                    DATE_FORMAT(pi.date_paiement, '%d/%m/%Y %H:%i') as date_paiement,
                    DATE_FORMAT(pi.date_modification, '%d/%m/%Y %H:%i') as date_modification,
                    
                    -- Informations du particulier avec localité
                    p.nom as particulier_nom,
                    p.prenom as particulier_prenom,
                    p.nif as particulier_nif,
                    p.ville as particulier_ville,
                    p.province as particulier_province,
                    
                    -- Informations de l'engin avec site
                    e.numero_plaque,
                    e.type_engin,
                    e.site_id as engin_site_id,
                    es.nom as engin_site_nom,
                    
                    -- Répartitions
                    (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'beneficiaire_id', rpi.beneficiaire_id,
                            'beneficiaire_nom', b.nom,
                            'type_part', rpi.type_part,
                            'valeur_part_originale', rpi.valeur_part_originale,
                            'valeur_part_calculee', rpi.valeur_part_calculee,
                            'montant', rpi.montant
                        )
                    ) FROM repartition_paiements_immatriculation rpi
                    LEFT JOIN beneficiaires b ON rpi.beneficiaire_id = b.id
                    WHERE rpi.id_paiement_immatriculation = pi.id) as repartitions,

                    -- Plaques attribuées
                    (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'numero_plaque', pa.numero_plaque,
                            'date_attribution', DATE_FORMAT(pa.date_attribution, '%d/%m/%Y %H:%i'),
                            'statut', CASE WHEN pa.statut = 1 THEN 'Carte rose délivrée' ELSE 'En attente' END
                        )
                    ) FROM plaques_attribuees pa
                    WHERE pa.paiement_id = pi.id) as plaques_attribuees

                FROM paiements_immatriculation pi
                LEFT JOIN particuliers p ON pi.particulier_id = p.id
                LEFT JOIN engins e ON pi.engin_id = e.id
                LEFT JOIN sites s ON pi.site_id = s.id
                LEFT JOIN sites es ON e.site_id = es.id
                ORDER BY pi.date_paiement DESC";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Décoder les JSON
        foreach ($resultats as &$paiement) {
            $paiement['repartitions'] = $paiement['repartitions'] ? json_decode($paiement['repartitions'], true) : [];
            $paiement['plaques_attribuees'] = $paiement['plaques_attribuees'] ? json_decode($paiement['plaques_attribuees'], true) : [];
        }

        return $resultats;
    }

    /**
     * Récupère la liste des bénéficiaires
     */
    private function getBeneficiaires()
    {
        $sql = "SELECT 
                    id,
                    nom,
                    telephone,
                    numero_compte,
                    actif,
                    DATE_FORMAT(date_creation, '%d/%m/%Y %H:%i') as date_creation,
                    DATE_FORMAT(date_modification, '%d/%m/%Y %H:%i') as date_modification
                FROM beneficiaires 
                WHERE actif = 1
                ORDER BY nom";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Récupère la liste des impôts
     */
    private function getImpots()
    {
        $sql = "SELECT 
                    id,
                    nom,
                    description,
                    actif,
                    periode,
                    delai_accord,
                    penalites,
                    DATE_FORMAT(date_creation, '%d/%m/%Y %H:%i') as date_creation,
                    DATE_FORMAT(date_modification, '%d/%m/%Y %H:%i') as date_modification
                FROM impots 
                WHERE actif = 1
                ORDER BY nom";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Récupère les sites et provinces
     */
    private function getSitesEtProvinces()
    {
        $sites_sql = "SELECT 
                        id, 
                        nom, 
                        code, 
                        province_id,
                        actif,
                        DATE_FORMAT(date_creation, '%d/%m/%Y %H:%i') as date_creation,
                        DATE_FORMAT(date_modification, '%d/%m/%Y %H:%i') as date_modification
                    FROM sites 
                    WHERE actif = 1
                    ORDER BY nom";
        
        $provinces_sql = "SELECT 
                            id, 
                            nom, 
                            code, 
                            actif,
                            DATE_FORMAT(date_creation, '%d/%m/%Y %H:%i') as date_creation,
                            DATE_FORMAT(date_modification, '%d/%m/%Y %H:%i') as date_modification
                        FROM provinces 
                        WHERE actif = 1
                        ORDER BY nom";

        $sites_stmt = $this->pdo->prepare($sites_sql);
        $sites_stmt->execute();
        $sites = $sites_stmt->fetchAll(PDO::FETCH_ASSOC);

        $provinces_stmt = $this->pdo->prepare($provinces_sql);
        $provinces_stmt->execute();
        $provinces = $provinces_stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'sites' => $sites,
            'provinces' => $provinces
        ];
    }

    /**
     * Récupère les audits récents (100 derniers)
     */
    private function getAuditsRecents()
    {
        $sql = "SELECT 
                    id,
                    user_id,
                    user_type,
                    action,
                    DATE_FORMAT(timestamp, '%d/%m/%Y %H:%i') as timestamp
                FROM audit_log 
                ORDER BY timestamp DESC 
                LIMIT 100";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Compte le total des engins
     */
    private function compterTotalEngins($particuliersData)
    {
        $total = 0;
        foreach ($particuliersData as $particulier) {
            $total += count($particulier['engins']);
        }
        return $total;
    }

    /**
     * Recherche des données spécifiques pour une question de l'IA
     */
    public function rechercherDonneesPourQuestion($termesRecherche)
    {
        try {
            $donnees = [];

            // Recherche par NIF
            if (preg_match('/\b\d{3}[- ]?\d{3}[- ]?\d{3}\b/', $termesRecherche, $matches)) {
                $nif = preg_replace('/[^0-9]/', '', $matches[0]);
                $donnees['par_nif'] = $this->rechercherParNIF($nif);
            }

            // Recherche par plaque
            if (preg_match('/[A-Z]{1,3}[- ]?[0-9]{1,4}[A-Z]?/', $termesRecherche, $matches)) {
                $plaque = $matches[0];
                $donnees['par_plaque'] = $this->rechercherParPlaque($plaque);
            }

            // Recherche par nom
            if (preg_match('/\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/', $termesRecherche, $matches)) {
                $nom = $matches[1];
                $prenom = $matches[2];
                $donnees['par_nom'] = $this->rechercherParNom($nom, $prenom);
            }

            // Recherche par site/localité
            if (preg_match('/(site|localité|ville|province)\s+([A-Za-z0-9]+)/i', $termesRecherche, $matches)) {
                $localite = $matches[2];
                $donnees['par_localite'] = $this->rechercherParLocalite($localite);
            }

            // Recherche par type d'engin
            if (preg_match('/(moto|voiture|camion|engin)\s+([A-Za-z0-9]+)/i', $termesRecherche, $matches)) {
                $type_engin = $matches[2];
                $donnees['par_type_engin'] = $this->rechercherParTypeEngin($type_engin);
            }

            return [
                "status" => "success",
                "data" => $donnees,
                "termes_recherche" => $termesRecherche
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur lors de la recherche: " . $e->getMessage()];
        }
    }

    /**
     * Recherche par NIF avec informations complètes
     */
    private function rechercherParNIF($nif)
    {
        $sql = "SELECT 
                    p.*,
                    s.nom as site_nom,
                    s.code as site_code,
                    COUNT(e.id) as nombre_engins,
                    SUM(pi.montant) as total_paiements,
                    GROUP_CONCAT(DISTINCT e.type_engin) as types_engins,
                    GROUP_CONCAT(DISTINCT e.site_id) as sites_engins
                FROM particuliers p
                LEFT JOIN sites s ON p.site = s.id
                LEFT JOIN engins e ON p.id = e.particulier_id
                LEFT JOIN paiements_immatriculation pi ON p.id = pi.particulier_id
                WHERE p.nif = :nif
                GROUP BY p.id, p.nom, p.prenom, p.nif, s.nom, s.code";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':nif' => $nif]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Recherche par plaque avec informations de site
     */
    private function rechercherParPlaque($plaque)
    {
        $sql = "SELECT 
                    e.*,
                    p.nom,
                    p.prenom,
                    p.nif,
                    p.telephone,
                    p.ville,
                    p.province,
                    pi.montant,
                    pi.date_paiement,
                    pi.site_id as paiement_site_id,
                    ps.nom as paiement_site_nom,
                    pa.statut as statut_plaque,
                    es.nom as engin_site_nom,
                    es.code as engin_site_code
                FROM engins e
                LEFT JOIN particuliers p ON e.particulier_id = p.id
                LEFT JOIN paiements_immatriculation pi ON e.id = pi.engin_id
                LEFT JOIN plaques_attribuees pa ON e.numero_plaque = pa.numero_plaque
                LEFT JOIN sites ps ON pi.site_id = ps.id
                LEFT JOIN sites es ON e.site_id = es.id
                WHERE e.numero_plaque LIKE :plaque
                OR pa.numero_plaque LIKE :plaque";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':plaque' => '%' . $plaque . '%']);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Recherche par nom avec localisation
     */
    private function rechercherParNom($nom, $prenom)
    {
        $sql = "SELECT 
                    p.*,
                    s.nom as site_nom,
                    s.code as site_code,
                    COUNT(e.id) as nombre_engins,
                    GROUP_CONCAT(e.numero_plaque) as plaques,
                    GROUP_CONCAT(DISTINCT e.type_engin) as types_engins,
                    GROUP_CONCAT(DISTINCT e.site_id) as sites_engins
                FROM particuliers p
                LEFT JOIN sites s ON p.site = s.id
                LEFT JOIN engins e ON p.id = e.particulier_id
                WHERE p.nom LIKE :nom AND p.prenom LIKE :prenom
                GROUP BY p.id, p.nom, p.prenom, p.ville, p.province, s.nom, s.code";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':nom' => '%' . $nom . '%',
            ':prenom' => '%' . $prenom . '%'
        ]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Recherche par localité (ville, province, site)
     */
    private function rechercherParLocalite($localite)
    {
        $sql = "SELECT 
                    p.id,
                    p.nom,
                    p.prenom,
                    p.nif,
                    p.ville,
                    p.province,
                    p.site as site_id,
                    s.nom as site_nom,
                    COUNT(e.id) as nombre_engins,
                    GROUP_CONCAT(e.numero_plaque) as plaques
                FROM particuliers p
                LEFT JOIN sites s ON p.site = s.id
                LEFT JOIN engins e ON p.id = e.particulier_id
                WHERE p.ville LIKE :localite 
                   OR p.province LIKE :localite
                   OR s.nom LIKE :localite
                   OR s.code LIKE :localite
                GROUP BY p.id, p.nom, p.prenom, p.ville, p.province, p.site, s.nom
                ORDER BY p.ville, p.nom";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':localite' => '%' . $localite . '%']);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Recherche par type d'engin
     */
    private function rechercherParTypeEngin($type_engin)
    {
        $sql = "SELECT 
                    e.*,
                    p.nom as particulier_nom,
                    p.prenom as particulier_prenom,
                    p.nif,
                    p.ville,
                    p.province,
                    s.nom as site_nom,
                    s.code as site_code
                FROM engins e
                LEFT JOIN particuliers p ON e.particulier_id = p.id
                LEFT JOIN sites s ON e.site_id = s.id
                WHERE e.type_engin LIKE :type_engin
                ORDER BY p.nom, e.numero_plaque";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':type_engin' => '%' . $type_engin . '%']);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Log une action dans le journal d'audit
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
?>