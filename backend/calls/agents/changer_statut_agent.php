<?php
/**
 * Script de changement de statut d'un agent (actif/inactif)
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

if (!isset($_POST['id'], $_POST['actif'])) {
    echo json_encode(["status" => "error", "message" => "ID et statut de l'agent requis."]);
    exit;
}

$id = (int) $_POST['id'];
$actif = filter_var($_POST['actif'], FILTER_VALIDATE_BOOLEAN);

try {
    $agentManager = new Agent();
    $result = $agentManager->changerStatutAgent($id, $actif);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors du changement de statut d'un agent : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}