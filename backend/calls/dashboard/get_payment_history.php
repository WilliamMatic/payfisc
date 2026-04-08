<?php
require '../headers/head.php';

require_once __DIR__ . '/../../class/DashboardManager.php';

try {
    $dashboardManager = new DashboardManager();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $nif = $data['nif'] ?? '';
    $limit = $data['limit'] ?? 5;
    
    if (empty($nif)) {
        echo json_encode(['success' => false, 'message' => 'NIF requis']);
        exit;
    }
    
    $result = $dashboardManager->getPaymentHistory($nif, $limit);
    echo json_encode($result);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>