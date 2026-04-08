<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_secure' => true,
        'cookie_httponly' => true,
        'use_strict_mode' => true
    ]);
}

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Energie.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

try {
    $energieManager = new Energie();
    $result = $energieManager->listerEnergies();
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération de la liste des énergies : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: Impossible de récupérer la liste des énergies."]);
}