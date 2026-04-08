<?php
/**
 * Script d'authentification des agents
 * 
 * Ce script vérifie les identifiants de connexion, valide le statut de l'agent
 * et retourne les informations de session avec les privilèges.
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Agent.php';
session_start();
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['email'], $input['password'])) {
    echo json_encode(["status" => "error", "message" => "Email et mot de passe requis."]);
    exit;
}

$email = trim(htmlspecialchars($input['email'], ENT_QUOTES, 'UTF-8'));
$password = $input['password'];

try {
    $agentManager = new Agent();
    $result = $agentManager->authentifierAgent($email, $password);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de l'authentification : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'authentification a échoué."]);
}
