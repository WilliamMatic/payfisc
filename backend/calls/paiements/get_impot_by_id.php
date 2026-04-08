<?php
/**
 * Script de récupération d'un impôt spécifique par ID
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

require_once __DIR__ . '/../../class/Paiement.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id']) || empty($input['id'])) {
        echo json_encode(["status" => "error", "message" => "ID d'impôt manquant."]);
        exit;
    }

    $paiementManager = new Paiement();
    $result = $paiementManager->getImpotById($input['id']);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération de l'impôt : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: Impossible de récupérer l'impôt."]);
}