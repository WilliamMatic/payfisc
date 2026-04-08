<?php
// backend/calls/vente-vignette/vignettes_a_renouveler.php

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée"]);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    $data = [];
}

require_once __DIR__ . '/../../class/VenteVignette.php';

header('Content-Type: application/json');

try {
    $venteVignette = new VenteVignette();
    $result = $venteVignette->getVignettesARenouveler($data);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur vignettes à renouveler: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: " . $e->getMessage()]);
}
?>
