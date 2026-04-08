<?php
/**
 * Script de vérification d'un ID DGRK et récupération des données
 */

// CORS headers

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée
require_once __DIR__ . '/../class/RefactorCarte.php';

header('Content-Type: application/json');

// Validation de la requête
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Validation des données
if (!isset($_POST['id_dgrk']) || empty($_POST['id_dgrk'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "L'identifiant DGRK est obligatoire."]);
    exit;
}

if (!isset($_POST['site_code']) || empty($_POST['site_code'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le code du site est obligatoire."]);
    exit;
}

try {
    // Instanciation
    $refactorManager = new RefactorCarte();
    
    // Vérification de l'ID DGRK avec site_code
    $result = $refactorManager->recupererDonneesParIdDGRK($_POST['id_dgrk'], $_POST['site_code']);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
        http_response_code(404);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la vérification de l'ID DGRK : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: La vérification a échoué."]);
}
?>