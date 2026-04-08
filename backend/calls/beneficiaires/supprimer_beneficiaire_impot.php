<?php
/**
 * Script de suppression d'un bénéficiaire d'un impôt pour une province spécifique
 */

// CORS headers
require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Impot.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['impot_id'], $input['beneficiaire_id'])) {
    echo json_encode(["status" => "error", "message" => "L'ID de l'impôt et du bénéficiaire sont requis."]);
    exit;
}

$impotId = (int)$input['impot_id'];
$beneficiaireId = (int)$input['beneficiaire_id'];
$provinceId = isset($input['province_id']) ? (int)$input['province_id'] : null;

try {
    $impotManager = new Impot();
    $result = $impotManager->supprimerBeneficiaireImpot($impotId, $beneficiaireId, $provinceId);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la suppression du bénéficiaire de l'impôt: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}