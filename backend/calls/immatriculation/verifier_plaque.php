<?php
/**
 * Script de vérification de disponibilité d'un numéro de plaque et suggestions
 */
require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Immatriculation.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Vérifier que le numéro de plaque est fourni
if (!isset($_POST['numero_plaque']) || empty($_POST['numero_plaque'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le numéro de plaque est obligatoire."]);
    exit;
}

// Vérifier que l'utilisateur_id est fourni
if (!isset($_POST['utilisateur_id']) || empty($_POST['utilisateur_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "L'identifiant utilisateur est obligatoire."]);
    exit;
}

try {
    $immatriculationManager = new Immatriculation();
    
    // Vérifier la disponibilité de la plaque et obtenir des suggestions
    $result = $immatriculationManager->verifierDisponibilitePlaqueAvecSuggestions(
        $_POST['numero_plaque'],
        $_POST['utilisateur_id']
    );
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la vérification de la plaque : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>