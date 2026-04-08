<?php
// backend/calls/vente-vignette/enregistrer_paiement.php

// CORS headers
require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Vérifier la méthode HTTP
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée"]);
    exit;
}

// Vérifier si le contenu est du JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE || !$data) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(["status" => "error", "message" => "Données JSON invalides"]);
    exit;
}

// Validation des champs requis
$requiredFields = [
    'engin_id', 'particulier_id', 'montant', 'montant_initial', 
    'impot_id', 'mode_paiement', 'utilisateur_id', 'site_id', 'taux_cdf'
];

foreach ($requiredFields as $field) {
    if (!isset($data[$field])) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(["status" => "error", "message" => "Champ requis manquant: $field"]);
        exit;
    }
}

// Inclure la classe appropriée
require_once __DIR__ . '/../../class/VenteVignette.php';

header('Content-Type: application/json');

try {
    $venteVignette = new VenteVignette();
    $result = $venteVignette->enregistrerPaiement($data);
    
    if ($result['status'] === 'success') {
        http_response_code(201);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur enregistrement paiement: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(["status" => "error", "message" => "Erreur système: " . $e->getMessage()]);
}
?>