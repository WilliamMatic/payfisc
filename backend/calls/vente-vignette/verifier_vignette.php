<?php
// backend/calls/vente-vignette/verifier_vignette.php

// CORS headers
require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Vérifier la méthode HTTP
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée"]);
    exit;
}

// Vérifier si le contenu est du JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE || !isset($data['plaque'])) {
    echo json_encode(["status" => "error", "message" => "Données invalides. Plaque requise."]);
    exit;
}

$plaque = trim($data['plaque']);

if (empty($plaque)) {
    echo json_encode(["status" => "error", "message" => "Numéro de plaque vide"]);
    exit;
}

// Inclure la classe appropriée
require_once __DIR__ . '/../../class/VenteVignette.php';

header('Content-Type: application/json');

try {
    $recherche = new VenteVignette();
    $result = $recherche->verifierVignetteExistante($plaque);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur vérification vignette: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système"]);
}
?>