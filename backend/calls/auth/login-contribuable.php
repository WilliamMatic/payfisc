<?php
/**
 * Script d'authentification des contribuables
 * 
 * Ce script vérifie les identifiants de connexion (NIF et mot de passe)
 * et retourne les informations du contribuable.
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Contribuable.php';
session_start();
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Récupération et validation des données
$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['nif'], $input['password'])) {
    echo json_encode(["success" => false, "message" => "NIF et mot de passe requis."]);
    exit;
}

$nif = trim(htmlspecialchars($input['nif'], ENT_QUOTES, 'UTF-8'));
$password = $input['password'];

try {
    $contribuableManager = new Contribuable();
    $result = $contribuableManager->authentifierContribuable($nif, $password);
    
    // Adaptation du format de réponse pour correspondre à l'attente du frontend
    if ($result['status'] === 'success') {
        echo json_encode([
            "success" => true,
            "user" => $result['user'],
            "message" => $result['message']
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => $result['message']
        ]);
    }

} catch (Exception $e) {
    error_log("Erreur lors de l'authentification : " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Erreur système: L'authentification a échoué."]);
}
?>