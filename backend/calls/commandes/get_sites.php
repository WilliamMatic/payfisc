<?php
/**
 * Script pour récupérer la liste des sites disponibles
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
    
    $result = $commandesManager->getSitesDisponibles();
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des sites : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>