<?php
/**
 * Script de récupération des noms d'impôts uniques
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
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

try {
    $dashboardManager = new Dashboard();
    $result = $dashboardManager->getUniqueTaxNames();
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des noms d'impôts : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: Impossible de récupérer les noms d'impôts."]);
}
?>