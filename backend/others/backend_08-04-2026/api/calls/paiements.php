<?php
// calls/paiements.php

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

if (!$data || !isset($data['action'])) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Données invalides"
    ]);
    exit;
}

try {
    require_once '../class/Paiement.php';
    
    $service = new Paiement();
    
    switch ($data['action']) {
        case 'get_derniers':
            $search = isset($data['search']) ? trim($data['search']) : '';
            $result = $service->getDerniersPaiements($search);
            break;
            
        case 'get_by_id':
            if (!isset($data['id'])) {
                http_response_code(400);
                echo json_encode([
                    "status" => "error",
                    "message" => "ID requis"
                ]);
                exit;
            }
            $result = $service->getPaiementById($data['id']);
            break;

        case 'get_quittance':
            if (!isset($data['id'])) {
                http_response_code(400);
                echo json_encode([
                    "status" => "error",
                    "message" => "ID requis"
                ]);
                exit;
            }
            $result = $service->getPaiementQuittance($data['id']);
            break;
            
        default:
            http_response_code(400);
            echo json_encode([
                "status" => "error",
                "message" => "Action non supportée"
            ]);
            exit;
    }
    
    echo json_encode($result);
    
} catch (Throwable $e) {
    error_log("Erreur paiements: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Erreur système"
    ]);
}