<?php
require_once 'Connexion.php';

/**
 * Classe Analytics - Gestion des métriques de performance Web Vitals
 */
class Analytics extends Connexion
{
    /**
     * Sauvegarde une métrique Web Vitals dans la base de données
     *
     * @param array $metricData Données de la métrique
     * @return array Résultat de l'opération
     */
    public function saveMetric($metricData)
    {
        try {
            // Validation des données requises
            $required = ['name', 'value', 'id', 'url'];
            foreach ($required as $field) {
                if (!isset($metricData[$field])) {
                    return [
                        "status" => "error",
                        "message" => "Champ requis manquant: $field"
                    ];
                }
            }

            // 🎯 Détection automatique des problèmes de performance
            $description = $this->detectPerformanceIssue(
                $metricData['name'], 
                $metricData['value']
            );

            // Gestion de la sévérité
            $severity = $metricData['severity'] ?? 'info';
            if (!empty($description) && !isset($metricData['severity'])) {
                $severity = $this->getSeverityFromDescription($description);
            }

            // Requête d'insertion
            $sql = "INSERT INTO tb_analytics 
                    (metric_name, metric_value, metric_id, page_url, user_agent, description, severity, date_created)
                    VALUES (:name, :value, :id, :url, :user_agent, :description, :severity, NOW())";

            $stmt = $this->pdo->prepare($sql);
            
            $params = [
                ':name' => $metricData['name'],
                ':value' => (float)$metricData['value'],
                ':id' => $metricData['id'],
                ':url' => $metricData['url'],
                ':user_agent' => $metricData['user_agent'] ?? '',
                ':description' => $description,
                ':severity' => $severity
            ];

            $stmt->execute($params);

            // Log pour le débogage
            error_log("📊 Métrique sauvegardée: " . $metricData['name'] . " = " . $metricData['value'] . " - " . ($description ?: 'Aucun problème'));

            return [
                "status" => "success",
                "message" => "Métrique enregistrée avec succès",
                "problem_detected" => !empty($description),
                "severity" => $severity
            ];

        } catch (PDOException $e) {
            error_log("❌ Erreur sauvegarde analytics: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de l'enregistrement: " . $e->getMessage()
            ];
        }
    }

    /**
     * Détermine la sévérité basée sur la description
     */
    /**
     * Détermine la sévérité basée sur la description
     */
    private function getSeverityFromDescription($description)
    {
        if (strpos($description, 'très lent') !== false || 
            strpos($description, 'mauvaise') !== false ||
            strpos($description, 'élevé') !== false ||
            strpos($description, 'critique') !== false) {
            return 'critical';
        }
        
        if (strpos($description, 'lent') !== false || 
            strpos($description, 'à améliorer') !== false ||
            strpos($description, 'acceptable') !== false ||
            strpos($description, 'à surveiller') !== false) {
            return 'warning';
        }
        
        if (strpos($description, 'excellent') !== false) {
            return 'good';
        }
        
        return 'info';
    }

    /**
     * Détecte les problèmes de performance basés sur les seuils Web Vitals
     */
    /**
     * Détecte les problèmes de performance basés sur les seuils Web Vitals
     */
    private function detectPerformanceIssue($metricName, $metricValue)
    {
        // Utiliser la valeur directement sans conversion pour CLS
        $actualValue = $metricValue;

        switch ($metricName) {
            case 'FCP': // First Contentful Paint (en millisecondes)
                if ($actualValue > 3000) return 'First Contentful Paint très lent (>3s)';
                if ($actualValue > 2000) return 'First Contentful Paint lent (>2s)';
                if ($actualValue <= 1000) return 'First Contentful Paint excellent';
                break;

            case 'LCP': // Largest Contentful Paint (en millisecondes)
                if ($actualValue > 4000) return 'Largest Contentful Paint très lent (>4s)';
                if ($actualValue > 2500) return 'Largest Contentful Paint lent (>2.5s)';
                if ($actualValue <= 2000) return 'Largest Contentful Paint excellent';
                break;

            case 'CLS': // Cumulative Layout Shift (valeur décimale 0.0 - 1.0+)
                if ($actualValue > 0.25) return 'Stabilité visuelle mauvaise (CLS > 0.25)';
                if ($actualValue > 0.1) return 'Stabilité visuelle à améliorer (CLS > 0.1)';
                if ($actualValue <= 0.05) return 'Stabilité visuelle excellente';
                break;

            case 'FID': // First Input Delay (en millisecondes)
                if ($actualValue > 300) return 'Délai de première interaction élevé (>300ms)';
                if ($actualValue > 100) return 'Délai de première interaction acceptable (>100ms)';
                if ($actualValue <= 50) return 'Délai de première interaction excellent';
                break;

            case 'TTFB': // Time to First Byte (en millisecondes)
                if ($actualValue > 800) return 'Time to First Byte lent (>800ms)';
                if ($actualValue > 500) return 'Time to First Byte acceptable (>500ms)';
                if ($actualValue <= 200) return 'Time to First Byte excellent';
                break;

            case 'INP': // Interaction to Next Paint (en millisecondes)
                if ($actualValue > 500) return 'Interaction to Next Paint lent (>500ms)';
                if ($actualValue > 200) return 'Interaction to Next Paint à surveiller (>200ms)';
                if ($actualValue <= 100) return 'Interaction to Next Paint excellent';
                break;

            case 'JS_ERROR':
                return 'Erreur JavaScript détectée';

            case 'PROMISE_REJECTION':
                return 'Promise rejetée non gérée';

            case 'PAGE_VIEW':
                return 'Navigation page vue';

            default:
                // Pour les métriques non reconnues, pas de description spécifique
                break;
        }

        return '';
    }

    /**
     * Récupère les statistiques de performance pour le tableau de bord
     *
     * @param string|null $startDate Date de début optionnelle
     * @param string|null $endDate Date de fin optionnelle
     * @return array Tableau avec les statistiques
     */
    public function getDashboardStats($startDate = null, $endDate = null)
    {
        try {
            // Construire la clause WHERE pour les dates
            $whereClause = "";
            $params = [];

            if ($startDate && $endDate) {
                $whereClause = " WHERE date_created BETWEEN :start_date AND :end_date";
                $params[':start_date'] = $startDate . " 00:00:00";
                $params[':end_date'] = $endDate . " 23:59:59";
            }

            // 📊 Statistiques globales
            $sql = "SELECT 
                        COUNT(*) as total_metrics,
                        COUNT(DISTINCT metric_id) as total_sessions,
                        COUNT(DISTINCT page_url) as total_pages,
                        COUNT(CASE WHEN description IS NOT NULL AND description != '' THEN 1 END) as total_problems,
                        AVG(metric_value) as average_performance,
                        MAX(metric_value) as worst_performance
                    FROM tb_analytics 
                    $whereClause";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $globalStats = $stmt->fetch(PDO::FETCH_ASSOC);

            // 📈 Détails par métrique
            $sqlMetrics = "SELECT 
                            metric_name,
                            COUNT(*) as occurrences,
                            AVG(metric_value) as average_value,
                            MAX(metric_value) as max_value,
                            MIN(metric_value) as min_value,
                            COUNT(CASE WHEN description IS NOT NULL AND description != '' THEN 1 END) as problems_count
                        FROM tb_analytics 
                        $whereClause
                        GROUP BY metric_name
                        ORDER BY occurrences DESC";

            $stmtMetrics = $this->pdo->prepare($sqlMetrics);
            $stmtMetrics->execute($params);
            $metricsDetails = $stmtMetrics->fetchAll(PDO::FETCH_ASSOC);

            // 🚨 Problèmes récurrents
            $whereProblems = "WHERE description IS NOT NULL AND description != ''";
            if ($startDate && $endDate) {
                $whereProblems = " WHERE date_created BETWEEN :start_date AND :end_date 
                                   AND description IS NOT NULL AND description != ''";
            }

            $sqlProblems = "SELECT 
                            metric_name,
                            description,
                            COUNT(*) as problem_count,
                            AVG(metric_value) as average_value
                        FROM tb_analytics 
                        $whereProblems
                        GROUP BY metric_name, description
                        ORDER BY problem_count DESC
                        LIMIT 10";

            $stmtProblems = $this->pdo->prepare($sqlProblems);
            $stmtProblems->execute($params);
            $recurrentProblems = $stmtProblems->fetchAll(PDO::FETCH_ASSOC);

            // 🎯 Calcul de la performance globale
            $performanceScore = $this->calculatePerformanceScore($metricsDetails);

            return [
                "status" => "success",
                "data" => [
                    "global_stats" => $globalStats,
                    "metrics_details" => $metricsDetails,
                    "recurrent_problems" => $recurrentProblems,
                    "performance_score" => $performanceScore,
                    "performance_status" => $this->getPerformanceStatus($performanceScore)
                ]
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des statistiques analytics: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des statistiques: " . $e->getMessage()
            ];
        }
    }

    /**
     * Calcule un score de performance global basé sur les métriques
     *
     * @param array $metricsDetails Détails des métriques
     * @return int Score de performance (0-100)
     */
    private function calculatePerformanceScore($metricsDetails)
    {
        $totalScore = 0;
        $metricCount = 0;

        foreach ($metricsDetails as $metric) {
            $score = 100;

            switch ($metric['metric_name']) {
                case 'LCP':
                    if ($metric['average_value'] > 4000) $score = 20;
                    elseif ($metric['average_value'] > 2500) $score = 60;
                    elseif ($metric['average_value'] > 2000) $score = 80;
                    break;

                case 'FCP':
                    if ($metric['average_value'] > 3000) $score = 30;
                    elseif ($metric['average_value'] > 2000) $score = 70;
                    elseif ($metric['average_value'] > 1000) $score = 90;
                    break;

                case 'CLS':
                    if ($metric['average_value'] > 0.25) $score = 10;
                    elseif ($metric['average_value'] > 0.1) $score = 50;
                    elseif ($metric['average_value'] > 0.05) $score = 80;
                    break;

                case 'FID':
                    if ($metric['average_value'] > 300) $score = 40;
                    elseif ($metric['average_value'] > 100) $score = 70;
                    elseif ($metric['average_value'] > 50) $score = 90;
                    break;

                case 'TTFB':
                    if ($metric['average_value'] > 800) $score = 30;
                    elseif ($metric['average_value'] > 500) $score = 60;
                    elseif ($metric['average_value'] > 200) $score = 85;
                    break;
            }

            // Ajuster selon le nombre de problèmes
            $problemRatio = $metric['problems_count'] / max(1, $metric['occurrences']);
            $score -= ($problemRatio * 50);

            $totalScore += max(0, $score);
            $metricCount++;
        }

        return $metricCount > 0 ? round($totalScore / $metricCount) : 100;
    }

    /**
     * Détermine le statut de performance basé sur le score
     *
     * @param int $score Score de performance
     * @return string Statut de performance
     */
    private function getPerformanceStatus($score)
    {
        if ($score >= 90) return 'Excellent';
        if ($score >= 80) return 'Bon';
        if ($score >= 70) return 'Moyen';
        if ($score >= 50) return 'À améliorer';
        return 'Critique';
    }

    /**
     * Récupère les données pour les graphiques d'évolution
     *
     * @param string $period Période (day, week, month)
     * @param string|null $metric Métrique spécifique
     * @return array Données pour graphiques
     */
    public function getTrendData($period = 'week', $metric = null)
    {
        try {
            $groupBy = "";
            $dateFormat = "";

            switch ($period) {
                case 'day':
                    $groupBy = "DATE_FORMAT(date_created, '%Y-%m-%d %H:00')";
                    $dateFormat = "%Y-%m-%d %H:00";
                    break;
                case 'week':
                    $groupBy = "DATE_FORMAT(date_created, '%Y-%m-%d')";
                    $dateFormat = "%Y-%m-%d";
                    break;
                case 'month':
                    $groupBy = "DATE_FORMAT(date_created, '%Y-%m')";
                    $dateFormat = "%Y-%m";
                    break;
                default:
                    $groupBy = "DATE_FORMAT(date_created, '%Y-%m-%d')";
                    $dateFormat = "%Y-%m-%d";
            }

            $whereMetric = "";
            $params = [];

            if ($metric) {
                $whereMetric = " WHERE metric_name = :metric";
                $params[':metric'] = $metric;
            }

            $sql = "SELECT 
                        DATE_FORMAT(date_created, '$dateFormat') as period,
                        metric_name,
                        AVG(metric_value) as average_value,
                        COUNT(*) as measurement_count,
                        COUNT(CASE WHEN description IS NOT NULL AND description != '' THEN 1 END) as problems_count
                    FROM tb_analytics 
                    $whereMetric
                    GROUP BY period, metric_name
                    ORDER BY period ASC, metric_name ASC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $trendData = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "data" => $trendData
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des données de tendance: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des tendances"
            ];
        }
    }

    /**
     * Récupère les métriques problématiques filtrées par sévérité
     *
     * @param string|null $severity Sévérité (critical, warning, good, info)
     * @param int $limit Nombre maximum de résultats
     * @return array Métriques problématiques
     */
    public function getProblematicMetrics($severity = null, $limit = 50)
    {
        try {
            $whereClause = "WHERE description IS NOT NULL AND description != ''";
            $params = [];

            if ($severity) {
                $whereClause .= " AND severity = :severity";
                $params[':severity'] = $severity;
            }

            $sql = "SELECT 
                        metric_name,
                        metric_value,
                        page_url,
                        description,
                        severity,
                        date_created,
                        user_agent
                    FROM tb_analytics 
                    $whereClause
                    ORDER BY date_created DESC
                    LIMIT :limit";

            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }

            $stmt->execute();
            $problems = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "data" => $problems,
                "total" => count($problems)
            ];

        } catch (PDOException $e) {
            error_log("Erreur récupération métriques problématiques: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des problèmes"
            ];
        }
    }

    /**
     * Récupère les données détaillées pour une métrique spécifique
     *
     * @param string $metricName Nom de la métrique
     * @param string|null $startDate Date de début
     * @param string|null $endDate Date de fin
     * @return array Données détaillées
     */
    public function getMetricDetails($metricName, $startDate = null, $endDate = null)
    {
        try {
            $whereClause = "WHERE metric_name = :metric_name";
            $params = [':metric_name' => $metricName];

            if ($startDate && $endDate) {
                $whereClause .= " AND date_created BETWEEN :start_date AND :end_date";
                $params[':start_date'] = $startDate . " 00:00:00";
                $params[':end_date'] = $endDate . " 23:59:59";
            }

            $sql = "SELECT 
                        metric_value,
                        page_url,
                        description,
                        severity,
                        date_created
                    FROM tb_analytics 
                    $whereClause
                    ORDER BY date_created DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $details = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Calcul des statistiques pour cette métrique
            $stats = [
                'total_measurements' => count($details),
                'average_value' => 0,
                'min_value' => null,
                'max_value' => null,
                'problem_count' => 0
            ];

            if (!empty($details)) {
                $values = array_column($details, 'metric_value');
                $stats['average_value'] = array_sum($values) / count($values);
                $stats['min_value'] = min($values);
                $stats['max_value'] = max($values);
                $stats['problem_count'] = count(array_filter($details, function($item) {
                    return !empty($item['description']);
                }));
            }

            return [
                "status" => "success",
                "data" => [
                    "metric_name" => $metricName,
                    "statistics" => $stats,
                    "measurements" => $details
                ]
            ];

        } catch (PDOException $e) {
            error_log("Erreur récupération détails métrique: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des détails"
            ];
        }
    }
}
?>