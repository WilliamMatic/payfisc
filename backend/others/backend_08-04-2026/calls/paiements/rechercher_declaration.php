<?php
/**
 * Script de recherche d'une déclaration par numéro
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
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Récupérer les données POST
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['numero_declaration']) || empty($data['numero_declaration'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le paramètre numero_declaration est requis."]);
    exit;
}

try {
    $paiementManager = new Paiement();
    $result = $paiementManager->rechercherDeclaration($data['numero_declaration']);
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la recherche de déclaration : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: Impossible de rechercher la déclaration."]);
}