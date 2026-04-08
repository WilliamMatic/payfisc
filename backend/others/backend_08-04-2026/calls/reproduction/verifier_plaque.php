<?php
/**
 * Script de vérification d'une plaque et récupération des données (locale)
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée
require_once __DIR__ . '/../../class/ReproductionCarte.php';

header('Content-Type: application/json');

// Validation de la requête
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Validation des données
if (!isset($_POST['numero_plaque']) || empty($_POST['numero_plaque'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le numéro de plaque est obligatoire."]);
    exit;
}

if (!isset($_POST['site_code']) || empty($_POST['site_code'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le code du site est obligatoire."]);
    exit;
}

$extension = isset($_POST['extension']) ? trim($_POST['extension']) : '';

try {
    // Instanciation
    $reproductionManager = new ReproductionCarte();
    
    // Vérification de la plaque dans la base locale
    $result = $reproductionManager->verifierPlaqueLocale($_POST['numero_plaque'], $_POST['site_code'], $extension);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
        http_response_code(404);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la vérification de la plaque : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: La vérification a échoué."]);
}
?>