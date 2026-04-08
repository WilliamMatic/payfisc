<?php
/**
 * Script d'ajout d'un bénéficiaire à un impôt pour une province spécifique
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

if (!isset($input['impot_id'], $input['beneficiaire_id'], $input['type_part'], $input['valeur_part'])) {
    echo json_encode(["status" => "error", "message" => "Tous les champs sont requis."]);
    exit;
}

$impotId = (int)$input['impot_id'];
$beneficiaireId = (int)$input['beneficiaire_id'];
$typePart = trim(htmlspecialchars($input['type_part'], ENT_QUOTES, 'UTF-8'));
$valeurPart = (float)$input['valeur_part'];
$provinceId = isset($input['province_id']) ? (int)$input['province_id'] : null;

try {
    $impotManager = new Impot();
    $result = $impotManager->ajouterBeneficiaireImpot($impotId, $beneficiaireId, $typePart, $valeurPart, $provinceId);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de l'ajout du bénéficiaire à l'impôt: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}