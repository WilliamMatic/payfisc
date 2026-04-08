<?php
// calls/impots.php

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
    require_once '../class/Impot.php';
    
    $impot = new Impot();
    
    switch ($data['action']) {
        case 'get_by_id':
            if (empty($data['id'])) {
                throw new Exception("ID impôt requis");
            }
            
            $result = $impot->getImpotById($data['id']);
            
            if ($result['status'] === 'error') {
                echo json_encode($result);
                exit;
            }
            
            echo json_encode([
                "status" => "success",
                "data" => $result['data']
            ]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode([
                "status" => "error",
                "message" => "Action non supportée"
            ]);
            exit;
    }
    
} catch (Throwable $e) {
    error_log("Erreur impots: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Erreur système"
    ]);
}