<?php
// backend/calls/vente-vignette/renouveler_vignette.php

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée"]);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(["status" => "error", "message" => "Données JSON invalides"]);
    exit;
}

$requiredFields = ['vignette_id', 'utilisateur_id', 'site_id'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field])) {
        echo json_encode(["status" => "error", "message" => "Champ requis manquant: $field"]);
        exit;
    }
}

require_once __DIR__ . '/../../class/VenteVignette.php';

header('Content-Type: application/json');

try {
    $venteVignette = new VenteVignette();
    $result = $venteVignette->renouvelerVignette($data);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur renouvellement vignette: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: " . $e->getMessage()]);
}
?>
