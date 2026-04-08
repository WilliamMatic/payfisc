<?php
// backend/calls/assurance-moto/verifier_assurance.php

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

if (json_last_error() !== JSON_ERROR_NONE || !isset($data['plaque'])) {
    echo json_encode(["status" => "error", "message" => "Données invalides. Plaque requise."]);
    exit;
}

$plaque = trim($data['plaque']);

if (empty($plaque)) {
    echo json_encode(["status" => "error", "message" => "Numéro de plaque vide"]);
    exit;
}

require_once __DIR__ . '/../../class/AssuranceMoto.php';

header('Content-Type: application/json');

try {
    $assuranceMoto = new AssuranceMoto();
    $result = $assuranceMoto->verifierAssuranceExistante($plaque);
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur vérification assurance: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système"]);
}
?>
