<?php
/**
 * Script d'inscription des contribuables
 * 
 * Ce script gère l'inscription des particuliers et entreprises
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
if (!$input) {
    echo json_encode(["success" => false, "message" => "Données JSON invalides."]);
    exit;
}

// Validation des champs obligatoires de base
if (!isset($input['userType'], $input['nif'], $input['email'], $input['telephone'])) {
    echo json_encode(["success" => false, "message" => "Champs obligatoires manquants."]);
    exit;
}

try {
    $contribuableManager = new Contribuable();
    $result = $contribuableManager->inscrireContribuable($input);
    
    // Adaptation du format de réponse pour correspondre à l'attente du frontend
    if ($result['status'] === 'success') {
        echo json_encode([
            "success" => true,
            "message" => $result['message']
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => $result['message']
        ]);
    }

} catch (Exception $e) {
    error_log("Erreur lors de l'inscription : " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Erreur système: L'inscription a échoué."]);
}
?>