<?php
// backend/calls/vente-vignette/verifier_reference.php

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

if (json_last_error() !== JSON_ERROR_NONE || !isset($data['reference'])) {
    echo json_encode(["status" => "error", "message" => "Référence requise"]);
    exit;
}

$reference = trim($data['reference']);
$impotId = isset($data['impot_id']) ? (int)$data['impot_id'] : null;

if (empty($reference)) {
    echo json_encode(["status" => "error", "message" => "Référence requise"]);
    exit;
}

require_once __DIR__ . '/../../class/VenteVignette.php';

header('Content-Type: application/json');

try {
    $venteVignette = new VenteVignette();
    $result = $venteVignette->verifierReferenceBancaire($reference, $impotId);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur vérification référence: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: " . $e->getMessage()]);
}
?>