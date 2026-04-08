<?php
// api/dashboard-immatriculation.php
if (session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_secure' => true,
        'cookie_httponly' => true,
        'use_strict_mode' => true
    ]);
}

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/DashboardImmatriculation.php';

header('Content-Type: application/json');

try {
    $dashboardManager = new DashboardImmatriculation();
    
    // Récupérer les paramètres
    $startDate = isset($_GET['start_date']) ? $_GET['start_date'] : null;
    $endDate = isset($_GET['end_date']) ? $_GET['end_date'] : null;
    $type = isset($_GET['type']) ? $_GET['type'] : 'stats';
    
    switch ($type) {
        case 'paiements':
            $filters = [
                'search' => $_GET['search'] ?? '',
                'statut' => $_GET['statut'] ?? 'all',
                'mode_paiement' => $_GET['mode_paiement'] ?? 'all',
                'province' => $_GET['province'] ?? 'all',
                'start_date' => $_GET['start_date'] ?? null,
                'end_date' => $_GET['end_date'] ?? null,
                'limit' => $_GET['limit'] ?? 50,
                'offset' => $_GET['offset'] ?? 0
            ];
            $result = $dashboardManager->getPaiementsDetails($filters);
            break;
            
        case 'beneficiaires':
            $result = $dashboardManager->getStatsBeneficiaires($startDate, $endDate);
            break;
            
        case 'series':
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            $result = $dashboardManager->getSeriesPopulaires($limit);
            break;
            
        case 'tendances':
            $periode = $_GET['periode'] ?? 'month';
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 12;
            $result = $dashboardManager->getTendances($periode, $limit);
            break;

        case 'data-ia':
            $result = $dashboardManager->getDataForIA($startDate, $endDate);
            break;
            
        case 'stats':
        default:
            $result = $dashboardManager->getDashboardStats($startDate, $endDate);
            break;
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur API Dashboard Immatriculation: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système: " . $e->getMessage()
    ]);
}
?>