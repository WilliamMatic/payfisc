<?php
/**
 * Script de génération de rapport pour une déclaration
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

require_once __DIR__ . '/../../class/Dashboard.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

if (!isset($_GET['id']) || empty($_GET['id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "ID de déclaration requis."]);
    exit;
}

try {
    $dashboardManager = new Dashboard();
    $declarationId = intval($_GET['id']);
    $result = $dashboardManager->getRapportDeclaration($declarationId);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la génération du rapport: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: Impossible de générer le rapport."]);
}
?>