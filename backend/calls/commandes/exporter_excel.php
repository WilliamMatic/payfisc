<?php
/**
 * Script pour exporter les commandes en Excel
 */

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/CommandesPlaques.php';

header('Content-Type: application/json');

try {
    $commandesManager = new CommandesPlaques();
    
    // Récupérer les paramètres
    $params = [
        'search' => isset($_POST['search']) ? trim($_POST['search']) : '',
        'date_debut' => isset($_POST['date_debut']) ? $_POST['date_debut'] : '',
        'date_fin' => isset($_POST['date_fin']) ? $_POST['date_fin'] : '',
        'site_id' => isset($_POST['site_id']) ? (int)$_POST['site_id'] : 0
    ];
    
    $result = $commandesManager->exporterExcel($params);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de l'export Excel : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>