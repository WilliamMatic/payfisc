<?php
/**
 * Script de modification d'un agent existant
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

if (!isset($_POST['id'], $_POST['nom'], $_POST['prenom'], $_POST['email'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Tous les champs sont requis."]);
    exit;
}

$id = (int) $_POST['id'];
$nom = trim(htmlspecialchars($_POST['nom'], ENT_QUOTES, 'UTF-8'));
$prenom = trim(htmlspecialchars($_POST['prenom'], ENT_QUOTES, 'UTF-8'));
$email = trim(htmlspecialchars($_POST['email'], ENT_QUOTES, 'UTF-8'));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "L'adresse email est invalide."]);
    exit;
}

try {
    $agentManager = new Agent();
    $result = $agentManager->modifierAgent($id, $nom, $prenom, $email);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la modification d'un agent : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}