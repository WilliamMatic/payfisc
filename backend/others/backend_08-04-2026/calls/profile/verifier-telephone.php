<?php
require '../../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Profile.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

if (empty($_GET['telephone']) || empty($_GET['user_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Téléphone et user_id sont requis."]);
    exit;
}

try {
    $profileManager = new Profile();
    $disponible = $profileManager->estTelephoneDisponible($_GET['telephone'], intval($_GET['user_id']));
    
    echo json_encode([
        "status" => "success",
        "data" => [
            "disponible" => $disponible,
            "champ" => "telephone"
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système lors de la vérification du téléphone."
    ]);
}
?>