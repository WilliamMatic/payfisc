<?php
/**
 * Script pour récupérer uniquement les statistiques du dashboard
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée
require_once __DIR__ . '/../../class/DashboardReports.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée."]);
    exit;
}

if (!isset($_POST['site_id'])) {
    echo json_encode(["status" => "error", "message" => "L'ID du site est requis."]);
    exit;
}

$siteId = filter_var($_POST['site_id'], FILTER_VALIDATE_INT);
if ($siteId === false || $siteId <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID du site n'est pas valide."]);
    exit;
}

try {
    $dashboardReports = new DashboardReports();
    
    $startDate = $_POST['start_date'] ?? null;
    $endDate = $_POST['end_date'] ?? null;
    
    $result = $dashboardReports->getStatsCards($siteId, $startDate, $endDate);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur récupération stats dashboard: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système."]);
}
?>