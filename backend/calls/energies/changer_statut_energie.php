<?php
require '../headers/head.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../class/Energie.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

if (!isset($_POST['id'], $_POST['actif'])) {
    echo json_encode(["status" => "error", "message" => "ID et statut de l'énergie requis."]);
    exit;
}

$id = (int) $_POST['id'];
$actif = filter_var($_POST['actif'], FILTER_VALIDATE_BOOLEAN);

try {
    $energieManager = new Energie();
    $result = $energieManager->changerStatutEnergie($id, $actif);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors du changement de statut d'une énergie : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}