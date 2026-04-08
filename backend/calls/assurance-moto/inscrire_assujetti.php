<?php
// backend/calls/assurance-moto/inscrire_assujetti.php

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header('Content-Type: application/json');
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée"]);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE || !$data) {
    header('Content-Type: application/json');
    echo json_encode(["status" => "error", "message" => "Données JSON invalides"]);
    exit;
}

// Validation des champs requis
$requiredFields = ['nom_complet', 'adresse', 'numero_plaque', 'utilisateur_id'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field]) || empty(trim((string)$data[$field]))) {
        header('Content-Type: application/json');
        echo json_encode(["status" => "error", "message" => "Champ requis manquant: $field"]);
        exit;
    }
}

require_once __DIR__ . '/../../class/AssuranceMoto.php';

header('Content-Type: application/json');

try {
    $assuranceMoto = new AssuranceMoto();
    $result = $assuranceMoto->inscrireAssujettiEtEngin($data);
    
    if ($result['status'] === 'success') {
        http_response_code(201);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur inscription assujetti assurance-moto: " . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode(["status" => "error", "message" => "Erreur système"]);
}
?>
