<?php
/**
 * Script pour récupérer les types de véhicules disponibles
 */

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Carte_Rose.php';

header('Content-Type: application/json');

try {
    $carteRoseManager = new CarteRose();
    
    $result = $carteRoseManager->getTypesVehicules();
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des types de véhicules : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>