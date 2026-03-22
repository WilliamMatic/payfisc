<?php
/**
 * Script de recherche des séries selon la province de l'utilisateur
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

// Vérifier que les champs requis sont fournis
if (!isset($_POST['search']) || !isset($_POST['utilisateur_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Les champs search et utilisateur_id sont obligatoires."]);
    exit;
}

try {
    $plaqueManager = new PlaqueManager();
    
    // Recherche des séries selon la province de l'utilisateur
    $result = $plaqueManager->rechercherSeriesByUtilisateur(
        $_POST['search'],
        intval($_POST['utilisateur_id'])
    );
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la recherche des séries : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>