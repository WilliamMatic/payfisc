<?php
require '../headers/head.php';

require_once __DIR__ . '/../../class/DashboardManager.php';

try {
    $dashboardManager = new DashboardManager();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = $data['user_id'] ?? '';
    $userType = $data['user_type'] ?? '';
    
    if (empty($userId) || empty($userType)) {
        echo json_encode(['success' => false, 'message' => 'ID utilisateur et type requis']);
        exit;
    }
    
    $result = $dashboardManager->getContribuableInfo($userId, $userType);
    
    if ($result['success']) {
        echo json_encode($result);
    } else {
        echo json_encode($result);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>