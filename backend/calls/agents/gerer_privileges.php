<?php
/**
 * Script de gestion des privilèges d'un agent
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
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

if (!isset($_POST['agent_id'], $_POST['privileges'])) {
    echo json_encode(["status" => "error", "message" => "ID de l'agent et privilèges requis."]);
    exit;
}

$agentId = (int) $_POST['agent_id'];
$privileges = json_decode($_POST['privileges'], true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(["status" => "error", "message" => "Format des privilèges invalide."]);
    exit;
}

try {
    $agentManager = new Agent();
    $result = $agentManager->mettreAJourPrivileges($agentId, $privileges);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la gestion des privilèges d'un agent : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}