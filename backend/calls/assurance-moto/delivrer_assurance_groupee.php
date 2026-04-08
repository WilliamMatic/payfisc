<?php
// backend/calls/assurance-moto/delivrer_assurance_groupee.php

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

$requiredFields = ['reference_bancaire', 'numero_assurance', 'engin_id', 'particulier_id', 'utilisateur_id'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
        echo json_encode(["status" => "error", "message" => "Champ requis manquant: $field"]);
        exit;
    }
}

require_once __DIR__ . '/../../class/AssuranceMoto.php';

header('Content-Type: application/json');

try {
    $assuranceMoto = new AssuranceMoto();
    $result = $assuranceMoto->delivrerAssuranceGroupee($data);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur délivrance assurance groupée: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: " . $e->getMessage()]);
}
?>