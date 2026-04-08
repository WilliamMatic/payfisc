<?php
/**
 * Script pour rechercher des couleurs
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

if (!isset($_POST['search_term']) || empty(trim($_POST['search_term']))) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le terme de recherche est obligatoire."]);
    exit;
}

try {
    $immatriculationManager = new Immatriculation();
    
    $searchTerm = trim($_POST['search_term']);
    
    $result = $immatriculationManager->rechercherCouleursParTerme($searchTerm);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la recherche des couleurs : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>