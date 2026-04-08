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

try {
    $ct = new ControleTechnique();

    $params = [
        'page' => $_POST['page'] ?? 1,
        'limit' => $_POST['limit'] ?? 10,
        'search' => $_POST['search'] ?? '',
        'decision' => $_POST['decision'] ?? 'tous',
        'statut' => $_POST['statut'] ?? 'tous',
        'date_debut' => $_POST['date_debut'] ?? '',
        'date_fin' => $_POST['date_fin'] ?? '',
    ];

    $result = $ct->getControles($params);
    http_response_code(200);
    echo json_encode($result);
} catch (Exception $e) {
    error_log("Erreur get_controles: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système lors de la récupération des contrôles."]);
}
