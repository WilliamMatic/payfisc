<?php
// calls/enregistrer_plaque.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "status" => "error",
        "message" => "Méthode non autorisée"
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Données invalides"
    ]);
    exit;
}

// Vérification des données minimales
if (empty($data['assujetti']) || empty($data['engin']) || empty($data['paiement'])) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Données manquantes"
    ]);
    exit;
}

try {
    // Charger les classes nécessaires
    require_once '../class/EnregistrementPlaque.php';
    
    $service = new EnregistrementPlaque();
    $result = $service->enregistrer($data);
    
    echo json_encode($result);
    
} catch (Throwable $e) {
    error_log("Erreur enregistrement plaque: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Erreur système: " . $e->getMessage()
    ]);
}