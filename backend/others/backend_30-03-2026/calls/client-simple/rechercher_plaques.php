<?php
/**
 * Script de recherche de plaques disponibles avec autocomplétion
 */
require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/ClientSimple.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Vérifier que les champs requis sont fournis
if (!isset($_POST['recherche']) || !isset($_POST['utilisateur_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Les champs recherche et utilisateur_id sont obligatoires."]);
    exit;
}

try {
    $clientSimpleManager = new ClientSimple();
    
    // Recherche des plaques disponibles
    $result = $clientSimpleManager->rechercherPlaquesDisponibles(
        $_POST['recherche'],
        intval($_POST['utilisateur_id'])
    );
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la recherche des plaques : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>