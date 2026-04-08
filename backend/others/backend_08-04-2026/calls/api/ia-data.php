<?php
/**
 * Script de récupération des données pour l'IA
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_secure' => true,
        'cookie_httponly' => true,
        'use_strict_mode' => true
    ]);
}

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/DataExporter.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

try {
    $dataExporter = new DataExporter();
    $result = $dataExporter->getAllDataForAI();
    
    if ($result['status'] === 'success') {
        echo json_encode($result);
    } else {
        http_response_code(500);
        echo json_encode($result);
    }

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des données pour l'IA : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: Impossible de récupérer les données pour l'IA."]);
}
?>