<?php
/**
 * Script de listing des plaques avec pagination
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée
require_once __DIR__ . '/../../class/Serie.php';

header('Content-Type: application/json');

// Validation de la requête
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

try {
    // Récupération des paramètres
    $particulierId = isset($_GET['particulier_id']) ? (int)$_GET['particulier_id'] : 0;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $statut = isset($_GET['statut']) ? $_GET['statut'] : null;
    $search = isset($_GET['search']) ? trim($_GET['search']) : null;
    
    // Validation des paramètres
    if ($particulierId <= 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID du particulier requis."]);
        exit;
    }
    
    // Instanciation de la classe Plaque
    $plaqueManager = new Plaque();
    
    // Vérification que le particulier existe
    $particulier = $plaqueManager->particulierExiste($particulierId);
    if (!$particulier) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Particulier non trouvé."]);
        exit;
    }
    
    // Récupération des plaques
    $result = $plaqueManager->listerPlaquesParParticulier($particulierId, $page, $limit, $statut, $search);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors du listing des plaques : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>