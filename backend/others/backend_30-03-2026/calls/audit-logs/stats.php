<?php
/**
 * Script de récupération des statistiques des logs d'audit
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

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

try {
    $paiementManager = new Paiement();
    
    // Récupérer les statistiques des logs d'audit
    $result = $paiementManager->getAuditStats();
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des statistiques d'audit : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: Impossible de récupérer les statistiques d'audit."]);
}
?>