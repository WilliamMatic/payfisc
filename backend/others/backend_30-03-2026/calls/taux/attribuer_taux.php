<?php
require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Taux.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

if (!isset($_POST['taux_id'], $_POST['impot_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le taux et l'impôt sont requis."]);
    exit;
}

$taux_id = (int)$_POST['taux_id'];
$province_id = isset($_POST['province_id']) && $_POST['province_id'] !== '' ? (int)$_POST['province_id'] : null;
$impot_id = (int)$_POST['impot_id'];
$actif = isset($_POST['actif']) && $_POST['actif'] === 'true';

try {
    $tauxManager = new Taux();
    $result = $tauxManager->attribuerTaux($taux_id, $province_id, $impot_id, $actif);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de l'attribution d'un taux : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>