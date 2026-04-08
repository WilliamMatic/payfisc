<?php
/**
 * Script de recherche des sites
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Site.php';

header('Content-Type: application/json');

// ======================================================================
// VALIDATION DE LA REQUÊTE HTTP
// ======================================================================

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES PARAMÈTRES
// ======================================================================

if (!isset($_GET['search'])) {
    echo json_encode(["status" => "error", "message" => "Le paramètre de recherche est requis."]);
    exit;
}

// Nettoyage du terme de recherche
$searchTerm = trim(htmlspecialchars($_GET['search'], ENT_QUOTES, 'UTF-8'));

if (empty($searchTerm)) {
    echo json_encode(["status" => "error", "message" => "Le terme de recherche ne peut pas être vide."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Site
    $siteManager = new Site();
    
    // Recherche des sites
    $result = $siteManager->rechercherSites($searchTerm);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la recherche des sites : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}