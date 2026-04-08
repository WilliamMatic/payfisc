<?php
/**
 * Script de génération de rapport général pour toutes les déclarations
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

    // Récupérer les filtres
    $filters = [
        'search' => isset($_GET['search']) ? $_GET['search'] : '',
        'status' => isset($_GET['status']) ? $_GET['status'] : '',
        'tax_type' => isset($_GET['tax_type']) ? $_GET['tax_type'] : '',
        'taxpayer_type' => isset($_GET['taxpayer_type']) ? $_GET['taxpayer_type'] : '',
        'payment_method' => isset($_GET['payment_method']) ? $_GET['payment_method'] : '',
        'payment_place' => isset($_GET['payment_place']) ? $_GET['payment_place'] : '',
        'declaration_status' => isset($_GET['declaration_status']) ? $_GET['declaration_status'] : '',
        'start_date' => isset($_GET['start_date']) ? $_GET['start_date'] : '',
        'end_date' => isset($_GET['end_date']) ? $_GET['end_date'] : ''
    ];

    $result = $dashboardManager->getRapportGeneral($filters);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la génération du rapport général: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: Impossible de générer le rapport général."]);
}
?>