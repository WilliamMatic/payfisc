<?php
require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Taux.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

$province_id = isset($_GET['province_id']) && $_GET['province_id'] !== '' ? (int)$_GET['province_id'] : null;
$impot_id = isset($_GET['impot_id']) ? (int)$_GET['impot_id'] : null;

if (!$impot_id) {
    echo json_encode(["status" => "error", "message" => "L'ID de l'impôt est requis."]);
    exit;
}

try {
    $tauxManager = new Taux();
    $result = $tauxManager->getTauxActifPourProvinceImpot($province_id, $impot_id);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération du taux actif : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>