<?php
/**
 * Script de listing des particuliers avec pagination
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Particulier.php';

header('Content-Type: application/json');

// ======================================================================
// VALIDATION DE LA REQUÊTE HTTP
// ======================================================================

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES PARAMÈTRES DE PAGINATION
// ======================================================================

$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
$utilisateurId = isset($_GET['utilisateur']) ? intval($_GET['utilisateur']) : null;

if ($page < 1) {
    $page = 1;
}
if ($limit < 1 || $limit > 100) {
    $limit = 10; // Limite maximale de 100 enregistrements par page
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Particulier
    $particulierManager = new Particulier();
    
    // Récupération de la liste des particuliers avec pagination
    $result = $particulierManager->listerParticuliersPagination($page, $limit, $utilisateurId);
    
    if ($result['status'] === 'error') {
        echo json_encode($result);
        exit;
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors du listing des particuliers : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}