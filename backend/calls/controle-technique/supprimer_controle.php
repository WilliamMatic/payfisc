<?php

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/ControleTechnique.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

if (!isset($_POST['id']) || empty($_POST['id'])) {
    echo json_encode(["status" => "error", "message" => "Le champ id est obligatoire."]);
    exit;
}

try {
    $ct = new ControleTechnique();
    $result = $ct->supprimerControle($_POST['id']);

    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
    }

    echo json_encode($result);
} catch (Exception $e) {
    error_log("Erreur supprimer_controle: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système lors de la suppression."]);
}
