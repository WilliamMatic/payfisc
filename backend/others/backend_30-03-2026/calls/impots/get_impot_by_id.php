<?php
require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Impot.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée"]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['id']) || empty($input['id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "L'ID de l'impôt est obligatoire"]);
    exit;
}

try {
    $impotManager = new Impot();
    $result = $impotManager->getImpotById($input['id']);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
        http_response_code(404);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur récupération impôt: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système"]);
}
?>