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
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Récupération et validation des données
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Données JSON invalides."]);
    exit;
}

// Nettoyage des données
$userType = isset($input['userType']) ? trim(htmlspecialchars($input['userType'], ENT_QUOTES, 'UTF-8')) : '';
$nif = isset($input['nif']) ? trim(htmlspecialchars($input['nif'], ENT_QUOTES, 'UTF-8')) : '';
$email = isset($input['email']) ? trim(htmlspecialchars($input['email'], ENT_QUOTES, 'UTF-8')) : '';
$telephone = isset($input['telephone']) ? trim(htmlspecialchars($input['telephone'], ENT_QUOTES, 'UTF-8')) : '';
$adresse = isset($input['adresse']) ? trim(htmlspecialchars($input['adresse'], ENT_QUOTES, 'UTF-8')) : '';

try {
    $contribuableManager = new Contribuable();
    $result = $contribuableManager->inscrireContribuable($input);
    
    if ($result['success']) {
        http_response_code(201);
        echo json_encode($result);
    } else {
        http_response_code(400);
        echo json_encode($result);
    }

} catch (Exception $e) {
    error_log("Erreur lors de l'inscription : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erreur système: L'inscription a échoué."]);
}
?>