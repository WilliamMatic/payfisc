<?php

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/ControleTechnique.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

if (!isset($_POST['controle_id']) || empty($_POST['controle_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le champ controle_id est obligatoire."]);
    exit;
}

if (!isset($_POST['resultats']) || empty($_POST['resultats'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le champ resultats est obligatoire."]);
    exit;
}

$resultats = json_decode($_POST['resultats'], true);

if (!is_array($resultats) || empty($resultats)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le format des résultats est invalide."]);
    exit;
}

try {
    $ct = new ControleTechnique();
    $result = $ct->modifierResultats($_POST['controle_id'], $resultats);

    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
        http_response_code(400);
    }

    echo json_encode($result);
} catch (Exception $e) {
    error_log("Erreur modifier_resultats: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système lors de la modification des résultats."]);
}
