<?php
/**
 * Script de récupération des statistiques des plaques
 */

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Serie.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée."]);
    exit;
}

try {
    // Récupération du paramètre
    $particulierId = isset($_GET['particulier_id']) ? (int)$_GET['particulier_id'] : 0;
    
    // Validation
    if ($particulierId <= 0) {
        echo json_encode(["status" => "error", "message" => "ID du particulier requis."]);
        exit;
    }
    
    $plaqueManager = new Plaque();
    
    // Vérification que le particulier existe
    $particulier = $plaqueManager->particulierExiste($particulierId);
    if (!$particulier) {
        echo json_encode(["status" => "error", "message" => "Particulier non trouvé."]);
        exit;
    }
    
    $result = $plaqueManager->getStatistiquesPlaques($particulierId);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des statistiques : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système."]);
}
?>