<?php
require '../headers/head.php';

require_once __DIR__ . '/../../class/DashboardManager.php';

try {
    $dashboardManager = new DashboardManager();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $nif = $data['nif'] ?? '';
    
    if (empty($nif)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'NIF requis']);
        exit;
    }
    
    $result = $dashboardManager->getTotalPayments($nif);
    echo json_encode($result);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>