<?php
/**
 * Script pour récupérer les ventes non-grossistes avec pagination
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
        'page' => isset($_POST['page']) ? (int)$_POST['page'] : 1,
        'limit' => isset($_POST['limit']) ? (int)$_POST['limit'] : 20,
        'search' => isset($_POST['search']) ? trim($_POST['search']) : '',
        'date_debut' => isset($_POST['date_debut']) ? $_POST['date_debut'] : date('Y-m-d'),
        'date_fin' => isset($_POST['date_fin']) ? $_POST['date_fin'] : date('Y-m-d'),
        'site_id' => isset($_POST['site_id']) ? (int)$_POST['site_id'] : 0,
        'order_by' => isset($_POST['order_by']) ? $_POST['order_by'] : 'date_paiement',
        'order_dir' => isset($_POST['order_dir']) ? $_POST['order_dir'] : 'DESC'
    ];
    
    $result = $ventesManager->getVentesNonGrossistes($params);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des ventes : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>