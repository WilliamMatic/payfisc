<?php
/**
 * Script pour récupérer les statistiques des ventes
 */

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Ventes.php';

header('Content-Type: application/json');

try {
    $ventesManager = new Ventes();
    
    // Récupérer les paramètres
    $params = [
        'search' => isset($_POST['search']) ? trim($_POST['search']) : '',
        'date_debut' => isset($_POST['date_debut']) ? $_POST['date_debut'] : date('Y-m-d'),
        'date_fin' => isset($_POST['date_fin']) ? $_POST['date_fin'] : date('Y-m-d'),
        'site_id' => isset($_POST['site_id']) ? (int)$_POST['site_id'] : 0
    ];
    
    $result = $ventesManager->getStatsVentes($params);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des statistiques : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>