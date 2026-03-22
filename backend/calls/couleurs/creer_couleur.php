<?php
/**
 * Script de création d'une nouvelle couleur d'engin
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/EnginCouleur.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

if (!isset($_POST['nom'], $_POST['code_hex'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Tous les champs sont requis."]);
    exit;
}

// Nettoyage des données d'entrée
$nom = trim(htmlspecialchars($_POST['nom'], ENT_QUOTES, 'UTF-8'));
$code_hex = trim(htmlspecialchars($_POST['code_hex'], ENT_QUOTES, 'UTF-8'));

try {
    $couleurManager = new EnginCouleur();
    $result = $couleurManager->ajouterCouleur($nom, $code_hex);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de l'ajout d'une couleur : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}