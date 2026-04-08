<?php
// calls/marques_engins.php

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
    require_once '../class/MarqueEngin.php';
    
    $service = new MarqueEngin();
    
    switch ($data['action']) {
        case 'rechercher':
            if (empty($data['type_engin_libelle'])) {
                throw new Exception("Type d'engin requis");
            }
            $result = $service->rechercherMarques(
                $data['type_engin_libelle'],
                $data['search'] ?? ''
            );
            break;
            
        case 'lister_actives':
            if (empty($data['type_engin_id'])) {
                throw new Exception("ID type d'engin requis");
            }
            $result = $service->listerMarquesActivesParType($data['type_engin_id']);
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
    error_log("Erreur marques engins: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Erreur système"
    ]);
}