<?php
require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Taux.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

try {
    $tauxManager = new Taux();
    $result = $tauxManager->getProvinces();
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des provinces : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>