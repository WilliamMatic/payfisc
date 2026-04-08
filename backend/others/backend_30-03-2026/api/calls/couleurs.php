<?php
// calls/couleurs.php

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
    require_once '../class/EnginCouleur.php';
    
    $service = new EnginCouleur();
    
    switch ($data['action']) {
        case 'rechercher':
            $result = $service->listerCouleursActives();
            // Filtrer localement si search fourni
            if (!empty($data['search'])) {
                $search = strtolower($data['search']);
                if (isset($result['data'])) {
                    $result['data'] = array_filter($result['data'], function($couleur) use ($search) {
                        return stripos($couleur['nom'], $search) !== false;
                    });
                    $result['data'] = array_values($result['data']);
                }
            }
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
    error_log("Erreur couleurs: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Erreur système"
    ]);
}