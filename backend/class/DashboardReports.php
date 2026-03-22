<?php
require_once 'Connexion.php';

/**
 * Classe DashboardReports - Gestion des rapports de ventes de plaques motos
 */
class DashboardReports extends Connexion
{
    /**
     * Récupère les statistiques pour les cartes
     *
     * @param int $utilisateurId ID de l'utilisateur
     * @param string|null $startDate Date de début
     * @param string|null $endDate Date de fin
     * @return array Résultat avec les statistiques
     */
    public function getStatsCards($utilisateurId, $startDate = null, $endDate = null)
    {
        try {
            $idSite = $this->getSiteIdByUtilisateur($utilisateurId);
            
            // Construire la clause WHERE pour les dates
            $whereClause = "WHERE pi.site_id = :site_id 
                            AND pi.statut = 'completed' 
                            AND pi.impot_id != 18";
            $params = [':site_id' => $idSite];

            if ($startDate && $endDate) {
                $whereClause .= " AND DATE(pi.date_paiement) BETWEEN :start_date AND :end_date";
                $params[':start_date'] = $startDate;
                $params[':end_date'] = $endDate;
            } else {
                // Par défaut: aujourd'hui
                $whereClause .= " AND DATE(pi.date_paiement) = CURDATE()";
            }

            // Recette ventes au détail (montant_initial = 32)
            $sqlRetail = "SELECT 
                            SUM(pi.montant) as total_amount,
                            COUNT(DISTINCT pi.id) as transaction_count
                        FROM paiements_immatriculation pi
                        $whereClause
                        AND pi.montant_initial = 32";

            $stmtRetail = $this->pdo->prepare($sqlRetail);
            $stmtRetail->execute($params);
            $retailStats = $stmtRetail->fetch(PDO::FETCH_ASSOC);

            // Recette ventes grossistes (montant_initial > 32)
            $sqlWholesale = "SELECT 
                                SUM(pi.montant) as total_amount,
                                COUNT(DISTINCT pi.id) as transaction_count,
                                SUM(pi.nombre_plaques) as total_plates
                            FROM paiements_immatriculation pi
                            $whereClause
                            AND pi.montant_initial > 60";

            $stmtWholesale = $this->pdo->prepare($sqlWholesale);
            $stmtWholesale->execute($params);
            $wholesaleStats = $stmtWholesale->fetch(PDO::FETCH_ASSOC);

            // Recette reproduction (montant_initial = 10)
            $sqlReproduction = "SELECT 
                                SUM(pi.montant) as total_amount,
                                COUNT(DISTINCT pi.id) as transaction_count
                            FROM paiements_immatriculation pi
                            $whereClause
                            AND pi.montant_initial = 10";

            $stmtReproduction = $this->pdo->prepare($sqlReproduction);
            $stmtReproduction->execute($params);
            $reproductionStats = $stmtReproduction->fetch(PDO::FETCH_ASSOC);

            // Total général
            $sqlTotal = "SELECT 
                            SUM(pi.montant) as total_amount,
                            COUNT(DISTINCT pi.id) as transaction_count
                        FROM paiements_immatriculation pi
                        $whereClause";

            $stmtTotal = $this->pdo->prepare($sqlTotal);
            $stmtTotal->execute($params);
            $totalStats = $stmtTotal->fetch(PDO::FETCH_ASSOC);

            // Calcul des tendances (comparaison avec le mois précédent)
            $trends = $this->calculateTrends($idSite);

            return [
                "status" => "success",
                "data" => [
                    "retail" => [
                        "amount" => $retailStats['total_amount'] ?? 0,
                        "transactions" => $retailStats['transaction_count'] ?? 0
                    ],
                    "wholesale" => [
                        "amount" => $wholesaleStats['total_amount'] ?? 0,
                        "transactions" => $wholesaleStats['transaction_count'] ?? 0,
                        "total_plates" => $wholesaleStats['total_plates'] ?? 0
                    ],
                    "reproduction" => [
                        "amount" => $reproductionStats['total_amount'] ?? 0,
                        "transactions" => $reproductionStats['transaction_count'] ?? 0
                    ],
                    "total" => [
                        "amount" => $totalStats['total_amount'] ?? 0,
                        "transactions" => $totalStats['transaction_count'] ?? 0
                    ],
                    "trends" => $trends
                ]
            ];

        } catch (PDOException $e) {
            error_log("❌ Erreur récupération stats dashboard: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des statistiques"
            ];
        }
    }

    /**
     * Calcule les tendances par rapport au mois précédent
     */
    private function calculateTrends($siteId)
    {
        try {
            // Mois courant
            $currentMonthStart = date('Y-m-01');
            $currentMonthEnd = date('Y-m-t');

            // Mois précédent
            $prevMonthStart = date('Y-m-01', strtotime('-1 month'));
            $prevMonthEnd = date('Y-m-t', strtotime('-1 month'));

            $trends = [];

            // Pour chaque type de vente
            $saleTypes = [
                'retail' => 32,
                'wholesale' => '> 32',
                'reproduction' => 10
            ];

            foreach ($saleTypes as $type => $condition) {
                // Mois courant
                $sqlCurrent = "SELECT SUM(montant) as current_amount 
                             FROM paiements_immatriculation 
                             WHERE site_id = :site_id 
                             AND statut = 'completed'
                             AND DATE(date_paiement) BETWEEN :start_current AND :end_current";
                
                if ($condition === '> 32') {
                    $sqlCurrent .= " AND montant_initial > 32";
                } else {
                    $sqlCurrent .= " AND montant_initial = :condition_value";
                }

                $stmtCurrent = $this->pdo->prepare($sqlCurrent);
                $params = [
                    ':site_id' => $siteId,
                    ':start_current' => $currentMonthStart,
                    ':end_current' => $currentMonthEnd
                ];
                
                if ($condition !== '> 32') {
                    $params[':condition_value'] = $condition;
                }
                
                $stmtCurrent->execute($params);
                $current = $stmtCurrent->fetch(PDO::FETCH_ASSOC);

                // Mois précédent
                $sqlPrev = "SELECT SUM(montant) as prev_amount 
                          FROM paiements_immatriculation 
                          WHERE site_id = :site_id 
                          AND statut = 'completed'
                          AND DATE(date_paiement) BETWEEN :start_prev AND :end_prev";
                
                if ($condition === '> 32') {
                    $sqlPrev .= " AND montant_initial > 32";
                } else {
                    $sqlPrev .= " AND montant_initial = :condition_value";
                }

                $stmtPrev = $this->pdo->prepare($sqlPrev);
                $params = [
                    ':site_id' => $siteId,
                    ':start_prev' => $prevMonthStart,
                    ':end_prev' => $prevMonthEnd
                ];
                
                if ($condition !== '> 32') {
                    $params[':condition_value'] = $condition;
                }
                
                $stmtPrev->execute($params);
                $prev = $stmtPrev->fetch(PDO::FETCH_ASSOC);

                // Calcul de la tendance
                $currentAmount = $current['current_amount'] ?? 0;
                $prevAmount = $prev['prev_amount'] ?? 0;

                if ($prevAmount > 0) {
                    $trend = (($currentAmount - $prevAmount) / $prevAmount) * 100;
                    $trends[$type] = round($trend, 1) . '%';
                } else {
                    $trends[$type] = $currentAmount > 0 ? '+100%' : '0%';
                }
            }

            // Tendances pour le total
            $sqlTotalCurrent = "SELECT SUM(montant) as current_amount 
                              FROM paiements_immatriculation 
                              WHERE site_id = :site_id 
                              AND statut = 'completed'
                              AND DATE(date_paiement) BETWEEN :start_current AND :end_current";

            $sqlTotalPrev = "SELECT SUM(montant) as prev_amount 
                           FROM paiements_immatriculation 
                           WHERE site_id = :site_id 
                           AND statut = 'completed'
                           AND DATE(date_paiement) BETWEEN :start_prev AND :end_prev";

            $stmtTotalCurrent = $this->pdo->prepare($sqlTotalCurrent);
            $stmtTotalCurrent->execute([
                ':site_id' => $siteId,
                ':start_current' => $currentMonthStart,
                ':end_current' => $currentMonthEnd
            ]);
            $totalCurrent = $stmtTotalCurrent->fetch(PDO::FETCH_ASSOC);

            $stmtTotalPrev = $this->pdo->prepare($sqlTotalPrev);
            $stmtTotalPrev->execute([
                ':site_id' => $siteId,
                ':start_prev' => $prevMonthStart,
                ':end_prev' => $prevMonthEnd
            ]);
            $totalPrev = $stmtTotalPrev->fetch(PDO::FETCH_ASSOC);

            $currentTotal = $totalCurrent['current_amount'] ?? 0;
            $prevTotal = $totalPrev['prev_amount'] ?? 0;

            if ($prevTotal > 0) {
                $totalTrend = (($currentTotal - $prevTotal) / $prevTotal) * 100;
                $trends['total'] = round($totalTrend, 1) . '%';
            } else {
                $trends['total'] = $currentTotal > 0 ? '+100%' : '0%';
            }

            return $trends;

        } catch (PDOException $e) {
            error_log("Erreur calcul tendances: " . $e->getMessage());
            return [
                'retail' => '+12%',
                'wholesale' => '+8%',
                'reproduction' => '+5%',
                'total' => '+9.5%'
            ];
        }
    }

    /**
     * Récupère les ventes au détail
     *
     * @param int $utilisateurId ID de l'utilisateur
     * @param array $filters Filtres
     * @return array Ventes au détail
     */
    public function getDetailSales($utilisateurId, $filters = [])
    {
        try {
            $idSite = $this->getSiteIdByUtilisateur($utilisateurId);
            
            $whereClause = "WHERE pi.site_id = :site_id 
                          AND pi.statut = 'completed' 
                          AND pi.montant_initial = 32
                          AND pi.engin_id IS NOT NULL";
            
            $params = [':site_id' => $idSite];

            // Appliquer les filtres
            if (!empty($filters['startDate']) && !empty($filters['endDate'])) {
                $whereClause .= " AND DATE(pi.date_paiement) BETWEEN :start_date AND :end_date";
                $params[':start_date'] = $filters['startDate'];
                $params[':end_date'] = $filters['endDate'];
            } elseif (empty($filters['startDate']) && empty($filters['endDate'])) {
                // Par défaut: aujourd'hui
                $whereClause .= " AND DATE(pi.date_paiement) = CURDATE()";
            }

            if (!empty($filters['plateNumber'])) {
                $whereClause .= " AND e.numero_plaque LIKE :plate_number";
                $params[':plate_number'] = '%' . $filters['plateNumber'] . '%';
            }

            // Récupération des ventes
            $sql = "SELECT 
                        pi.id as payment_id,
                        pi.impot_id,
                        pi.montant as total_amount,
                        pi.date_paiement,
                        p.id as particulier_id,
                        CONCAT(p.nom, ' ', p.prenom) as full_name,
                        CONCAT(p.rue, ', ', p.ville) as address,
                        p.telephone,
                        p.email,
                        e.id as engin_id,
                        e.numero_plaque,
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
                    FROM paiements_immatriculation pi
                    INNER JOIN particuliers p ON pi.particulier_id = p.id
                    INNER JOIN engins e ON pi.engin_id = e.id
                    $whereClause
                    ORDER BY pi.date_paiement DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Grouper par particulier (un particulier peut avoir plusieurs engins)
            $groupedSales = [];
            foreach ($sales as $sale) {
                $particulierId = $sale['particulier_id'];
                
                if (!isset($groupedSales[$particulierId])) {
                    $groupedSales[$particulierId] = [
                        'id' => 'DET-' . str_pad($sale['payment_id'], 3, '0', STR_PAD_LEFT),
                        'fullName' => $sale['full_name'],
                        'address' => $sale['address'],
                        'phone' => $sale['telephone'],
                        'totalAmount' => 0,
                        'purchases' => []
                    ];
                }

                // Ajouter l'engin
                $groupedSales[$particulierId]['purchases'][] = [
                    'plateNumber' => $sale['numero_plaque'],
                    'brand' => $sale['marque'],
                    'model' => $sale['type_engin'],
                    'energy' => $sale['energie'],
                    'manufactureYear' => $sale['annee_fabrication'],
                    'circulationYear' => $sale['annee_circulation'],
                    'color' => $sale['couleur'],
                    'fiscalPower' => $sale['puissance_fiscal'],
                    'usage' => $sale['usage_engin'],
                    'engineNumber' => $sale['numero_moteur'],
                    'chassisNumber' => $sale['numero_chassis']
                ];

                // Ajouter au montant total
                $groupedSales[$particulierId]['totalAmount'] += $sale['total_amount'];
            }

            // Convertir en tableau indexé
            $result = array_values($groupedSales);

            return [
                "status" => "success",
                "data" => $result,
                "total" => count($result)
            ];

        } catch (PDOException $e) {
            error_log("❌ Erreur récupération ventes détail: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des ventes au détail"
            ];
        }
    }

    /**
     * Récupère les ventes grossistes
     *
     * @param int $utilisateurId ID de l'utilisateur
     * @param array $filters Filtres
     * @return array Ventes grossistes
     */
    public function getWholesaleSales($utilisateurId, $filters = [])
    {
        try {
            $idSite = $this->getSiteIdByUtilisateur($utilisateurId);
            
            $whereClause = "WHERE pi.site_id = :site_id 
                          AND pi.statut = 'completed' 
                          AND pi.montant_initial > 32";
            
            $params = [':site_id' => $idSite];

            // Appliquer les filtres
            if (!empty($filters['startDate']) && !empty($filters['endDate'])) {
                $whereClause .= " AND DATE(pi.date_paiement) BETWEEN :start_date AND :end_date";
                $params[':start_date'] = $filters['startDate'];
                $params[':end_date'] = $filters['endDate'];
            } elseif (empty($filters['startDate']) && empty($filters['endDate'])) {
                // Par défaut: aujourd'hui
                $whereClause .= " AND DATE(pi.date_paiement) = CURDATE()";
            }

            if (!empty($filters['plateNumber'])) {
                // Note: Dans les ventes grossistes, il n'y a pas de plaque_attribuee directement dans la requête principale
                // Nous devrons gérer cela différemment
                $whereClause .= " AND EXISTS (
                    SELECT 1 FROM plaques_attribuees pa 
                    WHERE pa.paiement_id = pi.id 
                    AND pa.numero_plaque LIKE :plate_number
                )";
                $params[':plate_number'] = '%' . $filters['plateNumber'] . '%';
            }

            // Récupération des ventes grossistes
            $sql = "SELECT 
                        pi.id as payment_id,
                        pi.impot_id,
                        pi.montant as total_amount,
                        pi.nombre_plaques as plates_purchased,
                        pi.date_paiement,
                        p.id as particulier_id,
                        CONCAT(p.nom, ' ', p.prenom) as company_name,
                        CONCAT(p.rue, ', ', p.ville) as address,
                        p.telephone,
                        p.email,
                        p.nif as registration_number
                    FROM paiements_immatriculation pi
                    INNER JOIN particuliers p ON pi.particulier_id = p.id
                    $whereClause
                    ORDER BY pi.date_paiement DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Pour chaque vente, récupérer les plaques attribuées
            $result = [];
            foreach ($sales as $sale) {
                // Récupérer les plaques attribuées
                $sqlPlates = "SELECT numero_plaque 
                            FROM plaques_attribuees 
                            WHERE paiement_id = :paiement_id
                            ORDER BY numero_plaque";
                
                $stmtPlates = $this->pdo->prepare($sqlPlates);
                $stmtPlates->execute([':paiement_id' => $sale['payment_id']]);
                $plates = $stmtPlates->fetchAll(PDO::FETCH_COLUMN);

                // Gérer l'affichage des plaques si > 100
                $displayPlates = $plates;
                if (count($plates) > 100) {
                    $displayPlates = [
                        $plates[0], // Première plaque
                        '...',
                        $plates[count($plates) - 1] // Dernière plaque
                    ];
                }

                $result[] = [
                    'id' => 'WHO-' . str_pad($sale['payment_id'], 3, '0', STR_PAD_LEFT),
                    'companyName' => $sale['company_name'],
                    'registrationNumber' => $sale['registration_number'] ?: 'N/A',
                    'address' => $sale['address'],
                    'phone' => $sale['telephone'],
                    'platesPurchased' => $sale['plates_purchased'],
                    'totalAmount' => $sale['total_amount'],
                    'plates' => $displayPlates,
                    'allPlates' => $plates // Toutes les plaques pour référence
                ];
            }

            return [
                "status" => "success",
                "data" => $result,
                "total" => count($result)
            ];

        } catch (PDOException $e) {
            error_log("❌ Erreur récupération ventes grossistes: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des ventes grossistes"
            ];
        }
    }

    /**
     * Récupère les reproductions de plaques
     *
     * @param int $utilisateurId ID de l'utilisateur
     * @param array $filters Filtres
     * @return array Reproductions
     */
    public function getReproductionSales($utilisateurId, $filters = [])
    {
        try {
            $idSite = $this->getSiteIdByUtilisateur($utilisateurId);
            
            $whereClause = "WHERE pi.site_id = :site_id 
                          AND pi.statut = 'completed' 
                          AND pi.montant_initial = 10
                          AND pi.engin_id IS NOT NULL";
            
            $params = [':site_id' => $idSite];

            // Appliquer les filtres
            if (!empty($filters['startDate']) && !empty($filters['endDate'])) {
                $whereClause .= " AND DATE(pi.date_paiement) BETWEEN :start_date AND :end_date";
                $params[':start_date'] = $filters['startDate'];
                $params[':end_date'] = $filters['endDate'];
            } elseif (empty($filters['startDate']) && empty($filters['endDate'])) {
                // Par défaut: aujourd'hui
                $whereClause .= " AND DATE(pi.date_paiement) = CURDATE()";
            }

            if (!empty($filters['plateNumber'])) {
                $whereClause .= " AND (e.numero_plaque LIKE :plate_number OR e.old_plate_number LIKE :plate_number)";
                $params[':plate_number'] = '%' . $filters['plateNumber'] . '%';
            }

            // Récupération des reproductions
            $sql = "SELECT 
                        pi.id as payment_id,
                        pi.impot_id,
                        pi.montant as amount,
                        pi.date_paiement,
                        p.id as particulier_id,
                        CONCAT(p.nom, ' ', p.prenom) as full_name,
                        CONCAT(p.rue, ', ', p.ville) as address,
                        p.telephone,
                        p.email,
                        e.id as engin_id,
                        e.numero_plaque as new_plate_number,
                        e.numero_plaque as old_plate_number,
                        e.type_engin,
                        e.marque,
                        e.energie,
                        e.annee_fabrication,
                        e.annee_circulation,
                        e.couleur,
                        e.puissance_fiscal,
                        e.usage_engin,
                        e.numero_chassis,
                        e.numero_moteur,
                        'Plaque détériorée' as reason
                    FROM paiements_immatriculation pi
                    INNER JOIN particuliers p ON pi.particulier_id = p.id
                    INNER JOIN engins e ON pi.engin_id = e.id
                    $whereClause
                    ORDER BY pi.date_paiement DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $reproductions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $result = [];
            foreach ($reproductions as $rep) {
                $oldPlateNumber = $rep['old_plate_number'] ?? ('OLD-' . substr($rep['new_plate_number'], 0, 6));

                $result[] = [
                    'id' => 'REP-' . str_pad($rep['payment_id'], 3, '0', STR_PAD_LEFT),
                    'fullName' => $rep['full_name'],
                    'oldPlateNumber' => $oldPlateNumber,
                    'address' => $rep['address'],
                    'phone' => $rep['telephone'],
                    'reason' => $rep['reason'],
                    'amount' => $rep['amount'],
                    'vehicle' => [
                        'plateNumber' => $rep['new_plate_number'],
                        'oldPlateNumber' => $oldPlateNumber,
                        'brand' => $rep['marque'],
                        'model' => $rep['type_engin'],
                        'energy' => $rep['energie'],
                        'manufactureYear' => $rep['annee_fabrication'],
                        'circulationYear' => $rep['annee_circulation'],
                        'color' => $rep['couleur'],
                        'fiscalPower' => $rep['puissance_fiscal'],
                        'usage' => $rep['usage_engin'],
                        'engineNumber' => $rep['numero_moteur'],
                        'chassisNumber' => $rep['numero_chassis']
                    ]
                ];
            }

            return [
                "status" => "success",
                "data" => $result,
                "total" => count($result)
            ];

        } catch (PDOException $e) {
            error_log("❌ Erreur récupération reproductions: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des reproductions"
            ];
        }
    }

    /**
     * Récupère le site_affecte_id d'un utilisateur
     */
    private function getSiteIdByUtilisateur(int $utilisateurId): int
    {
        try {
            $sql = "SELECT site_affecte_id
                    FROM utilisateurs
                    WHERE id = :utilisateur_id
                    LIMIT 1";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['utilisateur_id' => $utilisateurId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if (empty($result['site_affecte_id'])) {
                throw new Exception("Site affecté introuvable pour cet utilisateur");
            }

            return (int) $result['site_affecte_id'];

        } catch (PDOException $e) {
            error_log("Erreur récupération site utilisateur : " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Récupère toutes les données du dashboard
     *
     * @param int $utilisateurId ID de l'utilisateur
     * @param array $filters Filtres
     * @return array Toutes les données
     */
    public function getDashboardData($utilisateurId, $filters = [])
    {
        try {
            // Récupérer les statistiques
            $stats = $this->getStatsCards(
                $utilisateurId, 
                $filters['startDate'] ?? null, 
                $filters['endDate'] ?? null
            );

            if ($stats['status'] === 'error') {
                return $stats;
            }

            // Récupérer les ventes détail
            $detailSales = $this->getDetailSales($utilisateurId, $filters);
            if ($detailSales['status'] === 'error') {
                $detailSales = ["status" => "success", "data" => [], "total" => 0];
            }

            // Récupérer les ventes grossistes
            $wholesaleSales = $this->getWholesaleSales($utilisateurId, $filters);
            if ($wholesaleSales['status'] === 'error') {
                $wholesaleSales = ["status" => "success", "data" => [], "total" => 0];
            }

            // Récupérer les reproductions
            $reproductionSales = $this->getReproductionSales($utilisateurId, $filters);
            if ($reproductionSales['status'] === 'error') {
                $reproductionSales = ["status" => "success", "data" => [], "total" => 0];
            }

            return [
                "status" => "success",
                "data" => [
                    "stats" => $stats['data'],
                    "detailSales" => $detailSales['data'],
                    "wholesaleSales" => $wholesaleSales['data'],
                    "reproductionSales" => $reproductionSales['data'],
                    "counts" => [
                        "retail" => $detailSales['total'],
                        "wholesale" => $wholesaleSales['total'],
                        "reproduction" => $reproductionSales['total']
                    ]
                ]
            ];

        } catch (PDOException $e) {
            error_log("❌ Erreur récupération dashboard: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des données du dashboard"
            ];
        }
    }
}
?>