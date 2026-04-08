<?php
/**
 * Script de création d'un nouvel impôt
 */

require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Impot.php';

header('Content-Type: application/json');

// ======================================================================
// VALIDATION DE LA REQUÊTE HTTP
// ======================================================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES DONNÉES DU FORMULAIRE
// ======================================================================

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['nom'], $input['jsonData'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le nom et les données JSON sont requis."]);
    exit;
}

// Nettoyage des données d'entrée
$nom = trim(htmlspecialchars($input['nom'], ENT_QUOTES, 'UTF-8'));
$description = isset($input['description']) ? trim(htmlspecialchars($input['description'], ENT_QUOTES, 'UTF-8')) : '';
$jsonData = json_encode($input['jsonData']); // On s'assure que c'est bien du JSON valide

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Impot
    $impotManager = new Impot();
    
    // Tentative d'ajout du nouvel impôt
    $result = $impotManager->ajouterImpot($nom, $description, $jsonData);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de l'ajout d'un impôt : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}