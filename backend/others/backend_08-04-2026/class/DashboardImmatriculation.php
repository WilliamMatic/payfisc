<?php
// class/DashboardImmatriculation.php
require_once 'Connexion.php';

/**
 * Classe DashboardImmatriculation - Gestion des statistiques pour le tableau de bord d'immatriculation
 */
class DashboardImmatriculation extends Connexion
{
    /**
     * Récupère les statistiques globales pour le tableau de bord d'immatriculation
     *
     * @param string|null $startDate Date de début optionnelle
     * @param string|null $endDate Date de fin optionnelle
     * @return array Tableau avec les statistiques
     */
    public function getDashboardStats($startDate = null, $endDate = null)
    {
        try {
            // Si pas de dates fournies, utiliser le mois en cours
            if (!$startDate && !$endDate) {
                $startDate = date('Y-m-01');
                $endDate = date('Y-m-t');
            }

            // Construire la clause WHERE pour les dates
            $whereClause = "";
            $params = [];

            if ($startDate && $endDate) {
                $whereClause = " WHERE DATE(pi.date_paiement) BETWEEN :start_date AND :end_date";
                $params[':start_date'] = $startDate;
                $params[':end_date'] = $endDate;
            }

            // Statistiques principales
            $sql = "SELECT 
                    COUNT(DISTINCT pi.id) as total_paiements,
                    COUNT(DISTINCT pi.particulier_id) as total_assujettis,
                    COUNT(DISTINCT e.id) as total_engins,
                    COUNT(DISTINCT p.id) as total_plaques_attribuees,
                    COUNT(DISTINCT CASE WHEN pi.statut = 'completed' THEN pi.id END) as paiements_completes,
                    COUNT(DISTINCT CASE WHEN pi.statut = 'pending' THEN pi.id END) as paiements_en_attente,
                    COUNT(DISTINCT CASE WHEN pi.statut = 'failed' THEN pi.id END) as paiements_echoues,
                    COUNT(DISTINCT CASE WHEN pa.statut = 1 THEN pa.id END) as plaques_avec_carte_rose,
                    COUNT(DISTINCT CASE WHEN pa.statut = 0 THEN pa.id END) as plaques_sans_carte_rose,
                    COALESCE(SUM(CASE WHEN pi.statut = 'completed' THEN pi.montant ELSE 0 END), 0) as total_revenus,
                    COALESCE(SUM(pi.nombre_plaques), 0) as total_plaques_payees,
                    COUNT(DISTINCT s.id) as total_series,
                    COUNT(DISTINCT si.id) as total_series_items
                FROM paiements_immatriculation pi
                LEFT JOIN engins e ON pi.engin_id = e.id
                LEFT JOIN plaques_attribuees pa ON pi.id = pa.paiement_id
                LEFT JOIN series s ON 1=1
                LEFT JOIN serie_items si ON 1=1
                $whereClause";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);

            // Statistiques par mode de paiement
            $sqlMethodes = "SELECT 
                            mode_paiement,
                            COUNT(*) as nombre_paiements,
                            SUM(montant) as total_montant
                        FROM paiements_immatriculation 
                        WHERE 1=1";

            if ($startDate && $endDate) {
                $sqlMethodes .= " AND DATE(date_paiement) BETWEEN :start_date AND :end_date";
            }

            $sqlMethodes .= " GROUP BY mode_paiement ORDER BY total_montant DESC";

            $stmtMethodes = $this->pdo->prepare($sqlMethodes);
            $stmtMethodes->execute($params);
            $methodesPaiement = $stmtMethodes->fetchAll(PDO::FETCH_ASSOC);

            $stats['methodes_paiement'] = $methodesPaiement;

            // Statistiques par province
            $sqlProvinces = "SELECT 
                            p.nom as province,
                            COUNT(DISTINCT pi.id) as nombre_paiements,
                            SUM(pi.montant) as total_revenus
                        FROM paiements_immatriculation pi
                        LEFT JOIN particuliers part ON pi.particulier_id = part.id
                        LEFT JOIN provinces p ON part.province = p.nom
                        WHERE 1=1";

            if ($startDate && $endDate) {
                $sqlProvinces .= " AND DATE(pi.date_paiement) BETWEEN :start_date AND :end_date";
            }

            $sqlProvinces .= " GROUP BY p.nom ORDER BY total_revenus DESC";

            $stmtProvinces = $this->pdo->prepare($sqlProvinces);
            $stmtProvinces->execute($params);
            $statsProvinces = $stmtProvinces->fetchAll(PDO::FETCH_ASSOC);

            $stats['revenus_par_province'] = $statsProvinces;

            return [
                "status" => "success",
                "data" => $stats,
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des statistiques d'immatriculation: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des statistiques: " . $e->getMessage(),
            ];
        }
    }

    /**
     * Récupère les données détaillées des paiements avec filtres
     *
     * @param array $filters Tableau de filtres
     * @return array Données filtrées
     */
    public function getPaiementsDetails($filters = [])
    {
        try {
            $sql = "SELECT 
                        pi.id,
                        pi.numero_transaction,
                        CONCAT(part.nom, ' ', part.prenom) as assujetti,
                        part.nif,
                        e.numero_plaque,
                        e.type_engin,
                        e.marque,
                        pi.montant,
                        pi.montant_initial,
                        pi.mode_paiement,
                        pi.operateur,
                        pi.statut,
                        pi.date_paiement,
                        pi.nombre_plaques,
                        pa.statut as statut_plaque,
                        s.nom_serie,
                        si.value as valeur_serie,
                        CONCAT(s.nom_serie, si.value) as plaque_complete,
                        u.nom_complet as caissier,
                        site.nom as site
                    FROM paiements_immatriculation pi
                    LEFT JOIN particuliers part ON pi.particulier_id = part.id
                    LEFT JOIN engins e ON pi.engin_id = e.id
                    LEFT JOIN plaques_attribuees pa ON pi.id = pa.paiement_id
                    LEFT JOIN serie_items si ON pa.serie_item_id = si.id
                    LEFT JOIN series s ON pa.serie_id = s.id
                    LEFT JOIN utilisateurs u ON pi.utilisateur_id = u.id
                    LEFT JOIN sites site ON pi.site_id = site.id
                    WHERE 1=1";

            $params = [];

            // Appliquer les filtres
            if (!empty($filters['search'])) {
                $sql .= " AND (pi.numero_transaction LIKE :search OR 
                              CONCAT(part.nom, ' ', part.prenom) LIKE :search OR 
                              part.nif LIKE :search OR 
                              e.numero_plaque LIKE :search)";
                $params[':search'] = '%' . $filters['search'] . '%';
            }

            if (!empty($filters['statut']) && $filters['statut'] !== 'all') {
                $sql .= " AND pi.statut = :statut";
                $params[':statut'] = $filters['statut'];
            }

            if (!empty($filters['mode_paiement']) && $filters['mode_paiement'] !== 'all') {
                $sql .= " AND pi.mode_paiement = :mode_paiement";
                $params[':mode_paiement'] = $filters['mode_paiement'];
            }

            if (!empty($filters['province']) && $filters['province'] !== 'all') {
                $sql .= " AND part.province = :province";
                $params[':province'] = $filters['province'];
            }

            if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
                $sql .= " AND DATE(pi.date_paiement) BETWEEN :start_date AND :end_date";
                $params[':start_date'] = $filters['start_date'];
                $params[':end_date'] = $filters['end_date'];
            }

            $sql .= " ORDER BY pi.date_paiement DESC
                      LIMIT :limit OFFSET :offset";

            $limit = $filters['limit'] ?? 50;
            $offset = $filters['offset'] ?? 0;

            $params[':limit'] = (int)$limit;
            $params[':offset'] = (int)$offset;

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Compter le total pour la pagination
            $countSql = "SELECT COUNT(*) as total 
                        FROM paiements_immatriculation pi
                        LEFT JOIN particuliers part ON pi.particulier_id = part.id
                        LEFT JOIN engins e ON pi.engin_id = e.id
                        WHERE 1=1";

            $countParams = [];
            if (!empty($filters['search'])) {
                $countSql .= " AND (pi.numero_transaction LIKE :search OR 
                                  CONCAT(part.nom, ' ', part.prenom) LIKE :search OR 
                                  part.nif LIKE :search OR 
                                  e.numero_plaque LIKE :search)";
                $countParams[':search'] = '%' . $filters['search'] . '%';
            }

            $stmtCount = $this->pdo->prepare($countSql);
            $stmtCount->execute($countParams);
            $total = $stmtCount->fetch(PDO::FETCH_ASSOC)['total'];

            return [
                "status" => "success",
                "data" => $data,
                "pagination" => [
                    "total" => $total,
                    "limit" => $limit,
                    "offset" => $offset
                ]
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des détails de paiement: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des données: " . $e->getMessage(),
            ];
        }
    }

    /**
     * Récupère les statistiques des bénéficiaires
     */
    public function getStatsBeneficiaires($startDate = null, $endDate = null)
    {
        try {
            $whereClause = "";
            $params = [];

            if ($startDate && $endDate) {
                $whereClause = " WHERE DATE(rpi.date_creation) BETWEEN :start_date AND :end_date";
                $params[':start_date'] = $startDate;
                $params[':end_date'] = $endDate;
            }

            $sql = "SELECT 
                        b.id,
                        b.nom,
                        b.telephone,
                        b.numero_compte,
                        COUNT(rpi.id) as nombre_repartitions,
                        SUM(rpi.montant) as total_montant,
                        AVG(rpi.montant) as moyenne_montant
                    FROM beneficiaires b
                    LEFT JOIN repartition_paiements_immatriculation rpi ON b.id = rpi.beneficiaire_id
                    $whereClause
                    GROUP BY b.id, b.nom, b.telephone, b.numero_compte
                    ORDER BY total_montant DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $beneficiaires = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "data" => $beneficiaires,
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des stats bénéficiaires: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des statistiques bénéficiaires",
            ];
        }
    }

    /**
     * Récupère les séries les plus populaires
     */
    public function getSeriesPopulaires($limit = 10)
    {
        try {
            $sql = "SELECT 
                        s.id,
                        s.nom_serie,
                        s.description,
                        COUNT(pa.id) as nombre_attributions,
                        COUNT(si.id) as total_items,
                        COUNT(CASE WHEN si.statut = '1' THEN si.id END) as items_utilises,
                        COUNT(CASE WHEN si.statut = '0' THEN si.id END) as items_disponibles
                    FROM series s
                    LEFT JOIN serie_items si ON s.id = si.serie_id
                    LEFT JOIN plaques_attribuees pa ON si.id = pa.serie_item_id
                    GROUP BY s.id, s.nom_serie, s.description
                    ORDER BY nombre_attributions DESC
                    LIMIT :limit";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':limit' => (int)$limit]);
            $series = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "data" => $series,
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des séries populaires: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des séries",
            ];
        }
    }

    /**
     * Récupère les données pour l'analyse des tendances
     */
    public function getTendances($periode = 'month', $limit = 12)
    {
        try {
            $format = '';
            $interval = '';

            switch ($periode) {
                case 'day':
                    $format = '%Y-%m-%d';
                    $interval = 'DAY';
                    break;
                case 'week':
                    $format = '%Y-%U';
                    $interval = 'WEEK';
                    break;
                case 'month':
                default:
                    $format = '%Y-%m';
                    $interval = 'MONTH';
                    break;
            }

            $sql = "SELECT 
                        DATE_FORMAT(pi.date_paiement, :format) as periode,
                        COUNT(pi.id) as nombre_paiements,
                        SUM(pi.montant) as total_revenus,
                        AVG(pi.montant) as moyenne_revenus,
                        COUNT(DISTINCT pi.particulier_id) as nouveaux_assujettis
                    FROM paiements_immatriculation pi
                    WHERE pi.date_paiement >= DATE_SUB(NOW(), INTERVAL :limit $interval)
                    GROUP BY periode
                    ORDER BY periode ASC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':format' => $format,
                ':limit' => $limit
            ]);
            $tendances = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "data" => $tendances,
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des tendances: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des tendances",
            ];
        }
    }

    /**
     * Récupère toutes les données nécessaires pour l'IA
     */
    public function getDataForIA($startDate = null, $endDate = null)
    {
        try {
            $stats = $this->getDashboardStats($startDate, $endDate);
            $paiements = $this->getPaiementsDetails(['limit' => 20, 'offset' => 0]);
            $series = $this->getSeriesPopulaires(5);
            $beneficiaires = $this->getStatsBeneficiaires($startDate, $endDate);
            $tendances = $this->getTendances('month', 6);

            return [
                "status" => "success",
                "data" => [
                    "statistiques" => $stats['status'] === 'success' ? $stats['data'] : [],
                    "paiements" => $paiements['status'] === 'success' ? $paiements['data'] : [],
                    "series" => $series['status'] === 'success' ? $series['data'] : [],
                    "beneficiaires" => $beneficiaires['status'] === 'success' ? $beneficiaires['data'] : [],
                    "tendances" => $tendances['status'] === 'success' ? $tendances['data'] : []
                ]
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des données pour l'IA: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des données pour l'IA",
            ];
        }
    }
}
?>