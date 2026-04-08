<?php
// backend/calls/assurance-moto/verifier_paiement_bancaire.php

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

if (json_last_error() !== JSON_ERROR_NONE || !isset($data['plaque']) || !isset($data['reference'])) {
    echo json_encode(["status" => "error", "message" => "Données invalides"]);
    exit;
}

$plaque = trim($data['plaque']);
$reference = trim($data['reference']);

if (empty($plaque) || empty($reference)) {
    echo json_encode(["status" => "error", "message" => "Plaque et référence requises"]);
    exit;
}

require_once __DIR__ . '/../../class/AssuranceMoto.php';

header('Content-Type: application/json');

try {
    $assuranceMoto = new AssuranceMoto();
    $result = $assuranceMoto->verifierPaiementBancaire($plaque, $reference);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur vérification paiement assurance: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: " . $e->getMessage()]);
}
?>