<?php
/**
 * Script pour récupérer l'historique des ventes
 */

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

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
    
    $period = $_POST['period'] ?? 'week';
    $saleType = $_POST['sale_type'] ?? null;
    
    // Ici vous implémenterez la logique pour récupérer l'historique
    // Pour l'instant, retournons des données mock
    $history = [
        [
            'period' => date('Y-m-d'),
            'sale_type' => 'retail',
            'amount' => 450000,
            'transactions' => 2
        ],
        // ... autres données
    ];
    
    echo json_encode([
        "status" => "success",
        "data" => $history
    ]);

} catch (Exception $e) {
    error_log("Erreur récupération historique: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système."]);
}
?>