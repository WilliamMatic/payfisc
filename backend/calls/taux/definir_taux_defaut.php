<?php
require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Taux.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

if (!isset($_POST['taux_id'], $_POST['impot_id'])) {
    echo json_encode(["status" => "error", "message" => "Le taux et l'impôt sont requis."]);
    exit;
}

$taux_id = (int)$_POST['taux_id'];
$impot_id = (int)$_POST['impot_id'];

try {
    $tauxManager = new Taux();
    $result = $tauxManager->definirTauxDefautImpot($taux_id, $impot_id);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la définition du taux par défaut : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>