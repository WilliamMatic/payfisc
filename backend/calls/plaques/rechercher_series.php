<?php
/**
 * Script de recherche des séries avec pagination
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Plaque.php';

header('Content-Type: application/json');

// ======================================================================
// VALIDATION DE LA REQUÊTE HTTP
// ======================================================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES PARAMÈTRES
// ======================================================================

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['search'])) {
    echo json_encode(["status" => "error", "message" => "Le terme de recherche est requis."]);
    exit;
}

$searchTerm = trim(htmlspecialchars($input['search'], ENT_QUOTES, 'UTF-8'));
$page = isset($input['page']) ? intval($input['page']) : 1;
$limit = isset($input['limit']) ? intval($input['limit']) : 15;
$utilisateurId = isset($input['utilisateurId']) ? intval($input['utilisateurId']) : null;

if (empty($searchTerm)) {
    echo json_encode(["status" => "error", "message" => "Le terme de recherche ne peut pas être vide."]);
    exit;
}

if ($page < 1) {
    $page = 1;
}
if ($limit < 1 || $limit > 100) {
    $limit = 15;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Plaque
    $plaqueManager = new Plaque();
    
    // Recherche des séries avec pagination
    $result = $plaqueManager->rechercherSeriesPagination($searchTerm, $page, $limit, $utilisateurId);
    
    if ($result['status'] === 'error') {
        echo json_encode($result);
        exit;
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la recherche des séries : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}