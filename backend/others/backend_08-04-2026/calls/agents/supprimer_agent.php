<?php
/**
 * Script de suppression d'un agent
 */

// Autoriser les requêtes cross-origin
require '../headers/head.php';

// Répondre directement aux requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}


require_once __DIR__ . '/../../class/Agent.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

if (!isset($_POST['id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "ID de l'agent requis."]);
    exit;
}

$id = (int) $_POST['id'];

try {
    $agentManager = new Agent();
    $result = $agentManager->supprimerAgent($id);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la suppression d'un agent : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}