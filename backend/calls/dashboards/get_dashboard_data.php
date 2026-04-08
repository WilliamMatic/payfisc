<?php
/**
 * Script pour récupérer toutes les données du dashboard
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

// ======================================================================
// VALIDATION DE LA REQUÊTE HTTP
// ======================================================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES DONNÉES
// ======================================================================

if (!isset($_POST['site_id'])) {
    echo json_encode(["status" => "error", "message" => "L'ID du site est requis."]);
    exit;
}

// Nettoyage et validation
$siteId = filter_var($_POST['site_id'], FILTER_VALIDATE_INT);

if ($siteId === false || $siteId <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID du site n'est pas valide."]);
    exit;
}

// Récupération des filtres
$filters = [
    'startDate' => $_POST['start_date'] ?? null,
    'endDate' => $_POST['end_date'] ?? null,
    'plateNumber' => $_POST['plate_number'] ?? null,
    'saleType' => $_POST['sale_type'] ?? null
];

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation
    $dashboardReports = new DashboardReports();
    
    // Récupération des données
    $result = $dashboardReports->getDashboardData($siteId, $filters);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération données dashboard : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué." . $e]);
}
?>