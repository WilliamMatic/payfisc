<?php
// class/GrossisteAchat.php

require_once 'Connexion.php';

/**
 * Classe GrossisteAchat - Gestion des achats des grossistes
 */
class GrossisteAchat extends Connexion
{
    /**
     * Liste les achats des grossistes avec filtres
     *
     * @param string|null $dateDebut Date de début de filtrage
     * @param string|null $dateFin Date de fin de filtrage
     * @param string|null $recherche Recherche par nom/prénom
     * @param string|null $telephone Recherche par téléphone
     * @param string|null $plaque Recherche par numéro de plaque
     * @param int $page Numéro de page pour la pagination
     * @param int $limit Nombre d'éléments par page
     * @return array Résultats avec pagination
     */
    public function listerAchats(
        $dateDebut = null,
        $dateFin = null,
        $recherche = null,
        $telephone = null,
        $plaque = null,
        $page = 1,
        $limit = 50
    ) {
        try {
            // Construire la clause WHERE
            $whereConditions = ["p.engin_id IS NULL AND par.telephone != 0850000001 "];
            $params = [];
            
            // Filtre par date
            if ($dateDebut && $dateFin) {
                $whereConditions[] = "DATE(p.date_paiement) BETWEEN :date_debut AND :date_fin";
                $params[':date_debut'] = $dateDebut;
                $params[':date_fin'] = $dateFin;
            } elseif ($dateDebut) {
                $whereConditions[] = "DATE(p.date_paiement) >= :date_debut";
                $params[':date_debut'] = $dateDebut;
            } elseif ($dateFin) {
                $whereConditions[] = "DATE(p.date_paiement) <= :date_fin";
                $params[':date_fin'] = $dateFin;
            }
            
            // Filtre par recherche (nom/prénom)
            if ($recherche) {
                $whereConditions[] = "(par.nom LIKE :recherche OR par.prenom LIKE :recherche OR CONCAT(par.prenom, ' ', par.nom) LIKE :recherche)";
                $params[':recherche'] = '%' . $recherche . '%';
            }
            
            // Filtre par téléphone
            if ($telephone) {
                $whereConditions[] = "par.telephone LIKE :telephone";
                $params[':telephone'] = '%' . $telephone . '%';
            }
            
            // Filtre par numéro de plaque
            if ($plaque) {
                $whereConditions[] = "pa.numero_plaque LIKE :plaque";
                $params[':plaque'] = '%' . $plaque . '%';
            }
            
            $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
            
            // Calculer l'offset pour la pagination
            $offset = ($page - 1) * $limit;
            
            // Requête principale avec INNER JOIN
            $sql = "SELECT DISTINCT
                        p.id as paiement_id,
                        p.particulier_id,
                        p.montant,
                        p.impot_id,
                        p.mode_paiement,
                        p.statut as statut_paiement,
                        p.date_paiement,
                        p.nombre_plaques,
                        p.utilisateur_id,
                        p.site_id,
                        
                        par.id as particulier_id,
                        par.nom,
                        par.prenom,
                        par.telephone,
                        CONCAT(par.rue, ', ', par.ville, ', ', par.province) as adresse,
                        par.nif,
                        par.email,
                        par.ville,
                        par.province,
                        
                        GROUP_CONCAT(DISTINCT pa.numero_plaque ORDER BY pa.numero_plaque SEPARATOR ',') as plaques,
                        GROUP_CONCAT(DISTINCT pa.statut ORDER BY pa.numero_plaque SEPARATOR ',') as plaques_statuts,
                        COUNT(DISTINCT pa.id) as total_plaques,
                        
                        MIN(pa.numero_plaque) as serie_debut,
                        MAX(pa.numero_plaque) as serie_fin,
                        
                        MAX(s.nom_serie) as nom_serie,
                        MAX(si.value) as serie_item_value
                    
                    FROM paiements_immatriculation p
                    
                    INNER JOIN particuliers par ON p.particulier_id = par.id
                    INNER JOIN plaques_attribuees pa ON p.id = pa.paiement_id
                    INNER JOIN serie_items si ON pa.serie_item_id = si.id
                    INNER JOIN series s ON pa.serie_id = s.id
                    
                    $whereClause
                    
                    GROUP BY p.id, par.id, p.date_paiement
                    ORDER BY p.date_paiement DESC, p.id DESC
                    LIMIT :limit OFFSET :offset";
            
            $stmt = $this->pdo->prepare($sql);
            
            // Bind des paramètres
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
            
            $stmt->execute();
            $achats = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Formater les résultats
            $formattedAchats = [];
            foreach ($achats as $achat) {
                // Détecter le type de plaque basé sur le nom de série ou le format
                $typePlaque = $this->detecterTypePlaque($achat['nom_serie']);
                
                // Récupérer toutes les plaques avec leurs statuts
                $plaques = explode(',', $achat['plaques']);
                $statuts = explode(',', $achat['plaques_statuts']);
                $plaquesDetail = [];
                
                for ($i = 0; $i < count($plaques); $i++) {
                    $plaquesDetail[] = [
                        'numero' => $plaques[$i],
                        'statut' => $statuts[$i] ?? '0',
                        'estDelivree' => ($statuts[$i] ?? '0') == '1'
                    ];
                }
                
                // Déterminer le statut de l'achat
                $statutAchat = $this->determinerStatutAchat($achat['statut_paiement'], $plaquesDetail);
                
                $formattedAchats[] = [
                    'id' => (int)$achat['paiement_id'],
                    'particulier_id' => (int)$achat['particulier_id'],
                    'grossiste' => [
                        'id' => (int)$achat['particulier_id'],
                        'nom' => $achat['nom'],
                        'prenom' => $achat['prenom'],
                        'telephone' => $achat['telephone'],
                        'adresse' => $achat['adresse'] ?: 'Adresse non spécifiée',
                        'nif' => $achat['nif'] ?: 'NIF non spécifié',
                        'email' => $achat['email'],
                        'ville' => $achat['ville'],
                        'province' => $achat['province']
                    ],
                    'date_achat' => date('Y-m-d', strtotime($achat['date_paiement'])),
                    'date_paiement_complete' => $achat['date_paiement'],
                    'nombre_plaques' => (int)$achat['total_plaques'],
                    'type_plaque' => $typePlaque,
                    'serie_debut' => $achat['serie_debut'],
                    'serie_fin' => $achat['serie_fin'],
                    'montant_total' => (float)$achat['montant'],
                    'statut' => $statutAchat,
                    'plaques' => $plaques,
                    'plaques_detail' => $plaquesDetail,
                    'impot_id' => $achat['impot_id'],
                    'mode_paiement' => $achat['mode_paiement']
                ];
            }
            
            // Compter le nombre total d'achats pour la pagination
            $countSql = "SELECT COUNT(DISTINCT p.id) as total
                        FROM paiements_immatriculation p
                        INNER JOIN particuliers par ON p.particulier_id = par.id
                        INNER JOIN plaques_attribuees pa ON p.id = pa.paiement_id
                        $whereClause";
            
            $countStmt = $this->pdo->prepare($countSql);
            foreach ($params as $key => $value) {
                if ($key !== ':limit' && $key !== ':offset') {
                    $countStmt->bindValue($key, $value);
                }
            }
            $countStmt->execute();
            $totalResult = $countStmt->fetch(PDO::FETCH_ASSOC);
            $total = (int)$totalResult['total'];
            
            return [
                "status" => "success",
                "data" => $formattedAchats,
                "total" => $total,
                "page" => $page,
                "totalPages" => ceil($total / $limit),
                "limit" => $limit
            ];
            
        } catch (PDOException $e) {
            error_log("Erreur lors du listing des achats : " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des achats " . $e
            ];
        }
    }
    
    /**
     * Détecte le type de plaque basé sur le nom de série
     *
     * @param string $nomSerie Nom de la série
     * @return string Type de plaque (moto, voiture, camion)
     */
    private function detecterTypePlaque($nomSerie)
    {
        $nomSerie = strtoupper(trim($nomSerie));
        
        // Logique de détection basée sur les conventions de séries
        if (strlen($nomSerie) <= 2) {
            // Séries courtes généralement pour les motos
            return "moto";
        } elseif (preg_match('/^[A-Z]{2,3}[0-9]{1,4}$/', $nomSerie)) {
            // Format typique pour les voitures
            return "voiture";
        } elseif (preg_match('/^[A-Z]{2,4}[0-9]{2,5}$/', $nomSerie)) {
            // Format pour les camions (séries plus longues)
            return "camion";
        }
        
        // Par défaut
        return "voiture";
    }
    
    /**
     * Détermine le statut de l'achat
     *
     * @param string $statutPaiement Statut du paiement
     * @param array $plaquesDetail Détails des plaques
     * @return string Statut de l'achat
     */
    private function determinerStatutAchat($statutPaiement, $plaquesDetail)
    {
        if ($statutPaiement === 'failed' || $statutPaiement === 'cancelled') {
            return "annulé";
        }
        
        if ($statutPaiement === 'pending') {
            return "en_cours";
        }
        
        // Vérifier si toutes les plaques sont délivrées
        $toutesDelivrees = true;
        foreach ($plaquesDetail as $plaque) {
            if (!$plaque['estDelivree']) {
                $toutesDelivrees = false;
                break;
            }
        }
        
        return $toutesDelivrees ? "completé" : "en_cours";
    }
    
    /**
     * Récupère les statistiques des achats
     *
     * @param string|null $dateDebut Date de début
     * @param string|null $dateFin Date de fin
     * @return array Statistiques détaillées
     */
    public function getStatistiques($dateDebut = null, $dateFin = null)
    {
        try {
            // Construire la clause WHERE pour les dates
            $whereConditions = [];
            $params = [];
            
            if ($dateDebut && $dateFin) {
                $whereConditions[] = "DATE(p.date_paiement) BETWEEN :date_debut AND :date_fin";
                $params[':date_debut'] = $dateDebut;
                $params[':date_fin'] = $dateFin;
            } elseif ($dateDebut) {
                $whereConditions[] = "DATE(p.date_paiement) >= :date_debut";
                $params[':date_debut'] = $dateDebut;
            } elseif ($dateFin) {
                $whereConditions[] = "DATE(p.date_paiement) <= :date_fin";
                $params[':date_fin'] = $dateFin;
            }
            
            $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
            
            // Statistiques générales
            $sql = "SELECT 
                        COUNT(DISTINCT p.id) as total_achats,
                        COUNT(DISTINCT p.particulier_id) as total_grossistes,
                        SUM(p.nombre_plaques) as total_plaques_vendues,
                        SUM(p.montant) as montant_total,
                        AVG(p.montant) as montant_moyen,
                        MIN(p.date_paiement) as date_premier_achat,
                        MAX(p.date_paiement) as date_dernier_achat
                    FROM paiements_immatriculation p
                    $whereClause";
            
            $stmt = $this->pdo->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            $statsGenerales = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Statistiques par type de plaque
            $sqlTypes = "SELECT 
                            COUNT(DISTINCT p.id) as nombre_achats,
                            SUM(p.nombre_plaques) as nombre_plaques,
                            SUM(p.montant) as montant_total,
                            CASE 
                                WHEN LENGTH(s.nom_serie) <= 2 THEN 'moto'
                                WHEN LENGTH(s.nom_serie) <= 3 THEN 'voiture'
                                ELSE 'camion'
                            END as type_plaque
                        FROM paiements_immatriculation p
                        INNER JOIN plaques_attribuees pa ON p.id = pa.paiement_id
                        INNER JOIN series s ON pa.serie_id = s.id
                        $whereClause
                        GROUP BY type_plaque";
            
            $stmtTypes = $this->pdo->prepare($sqlTypes);
            foreach ($params as $key => $value) {
                $stmtTypes->bindValue($key, $value);
            }
            $stmtTypes->execute();
            $statsTypes = $stmtTypes->fetchAll(PDO::FETCH_ASSOC);
            
            // Top 10 des grossistes
            $sqlTopGrossistes = "SELECT 
                                    par.id,
                                    par.nom,
                                    par.prenom,
                                    par.telephone,
                                    COUNT(DISTINCT p.id) as nombre_achats,
                                    SUM(p.nombre_plaques) as total_plaques,
                                    SUM(p.montant) as montant_total
                                FROM paiements_immatriculation p
                                INNER JOIN particuliers par ON p.particulier_id = par.id
                                $whereClause
                                GROUP BY par.id, par.nom, par.prenom, par.telephone
                                ORDER BY montant_total DESC
                                LIMIT 10";
            
            $stmtTop = $this->pdo->prepare($sqlTopGrossistes);
            foreach ($params as $key => $value) {
                $stmtTop->bindValue($key, $value);
            }
            $stmtTop->execute();
            $topGrossistes = $stmtTop->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                "status" => "success",
                "data" => [
                    "generales" => $statsGenerales,
                    "par_type" => $statsTypes,
                    "top_grossistes" => $topGrossistes
                ]
            ];
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des statistiques : " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des statistiques"
            ];
        }
    }
    
    /**
     * Exporte les achats au format CSV
     *
     * @param array $filtres Filtres d'exportation
     * @return array Résultat avec données CSV
     */
    public function exporterCSV($filtres = [])
    {
        try {
            $achats = $this->listerAchats(
                $filtres['date_debut'] ?? null,
                $filtres['date_fin'] ?? null,
                $filtres['recherche'] ?? null,
                $filtres['telephone'] ?? null,
                $filtres['plaque'] ?? null,
                1,
                10000 // Limite élevée pour l'export
            );
            
            if ($achats['status'] === 'error') {
                return $achats;
            }
            
            // Générer le contenu CSV
            $csvContent = "ID;Date d'achat;Nom du grossiste;Prénom;Téléphone;NIF;Nombre de plaques;Type;Série début;Série fin;Montant total;Statut;Plaques\n";
            
            foreach ($achats['data'] as $achat) {
                $row = [
                    $achat['id'],
                    $achat['date_achat'],
                    $achat['grossiste']['nom'],
                    $achat['grossiste']['prenom'],
                    $achat['grossiste']['telephone'],
                    $achat['grossiste']['nif'],
                    $achat['nombre_plaques'],
                    $achat['type_plaque'],
                    $achat['serie_debut'],
                    $achat['serie_fin'],
                    number_format($achat['montant_total'], 2, ',', ' '),
                    $achat['statut'],
                    implode(', ', $achat['plaques'])
                ];
                
                // Échapper les caractères spéciaux
                $row = array_map(function($value) {
                    return '"' . str_replace('"', '""', $value) . '"';
                }, $row);
                
                $csvContent .= implode(';', $row) . "\n";
            }
            
            return [
                "status" => "success",
                "data" => $csvContent,
                "filename" => "achats_grossistes_" . date('Y-m-d_H-i-s') . ".csv"
            ];
            
        } catch (Exception $e) {
            error_log("Erreur lors de l'export CSV : " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de l'exportation"
            ];
        }
    }
}
?>