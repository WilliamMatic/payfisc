<?php
/**
 * Script de récupération des séries selon la province de l'utilisateur
 */
require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Plaque_Manager.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Vérifier que l'utilisateur_id est fourni
if (!isset($_POST['utilisateur_id']) || empty($_POST['utilisateur_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "L'identifiant utilisateur est obligatoire."]);
    exit;
}

try {
    $plaqueManager = new PlaqueManager();
    
    // Récupération des séries selon la province de l'utilisateur
    $result = $plaqueManager->getSeriesByUtilisateur($_POST['utilisateur_id']);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des séries : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>