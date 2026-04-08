<?php
/**
 * Script de recherche des marques d'engins par type d'engin et terme de recherche
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/MarqueEngin.php';

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
// VALIDATION DES DONNÉES D'ENTRÉE
// ======================================================================

$typeEngin = trim($_POST['type_engin'] ?? '');
$searchTerm = trim($_POST['search_term'] ?? '');

if (empty($typeEngin)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le type d'engin est obligatoire."]);
    exit;
}

if (empty($searchTerm)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le terme de recherche est obligatoire."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe MarqueEngin
    $marqueManager = new MarqueEngin();
    
    // Recherche des marques
    $result = $marqueManager->rechercherMarques($typeEngin, $searchTerm);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la recherche des marques : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}