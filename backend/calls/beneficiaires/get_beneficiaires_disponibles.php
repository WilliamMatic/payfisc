<?php
/**
 * Script de récupération des bénéficiaires disponibles pour un impôt et une province
 */

// CORS headers
require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Impot.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

if (!isset($_GET['impot_id'])) {
    echo json_encode(["status" => "error", "message" => "L'ID de l'impôt est requis."]);
    exit;
}

$impotId = (int)$_GET['impot_id'];
$provinceId = isset($_GET['province_id']) ? (int)$_GET['province_id'] : null;

try {
    $impotManager = new Impot();
    $result = $impotManager->getBeneficiairesDisponibles($impotId, $provinceId);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des bénéficiaires disponibles: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}