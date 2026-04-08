<?php
/**
 * Script pour rechercher des données spécifiques pour l'IA
 * Version étendue avec recherche par localité et type d'engin
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/IAFiscale.php';

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
// VALIDATION DES DONNÉES
// ======================================================================

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['question']) || empty(trim($input['question']))) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "La question est requise."]);
    exit;
}

// Nettoyage de la question
$question = trim(htmlspecialchars($input['question'], ENT_QUOTES, 'UTF-8'));

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe IAFiscale
    $iaFiscale = new IAFiscale();
    
    // Recherche des données pertinentes pour la question
    $result = $iaFiscale->rechercherDonneesPourQuestion($question);
    
    // Log de l'audit
    $iaFiscale->logAudit("Recherche IA fiscale: " . substr($question, 0, 100));
    
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la recherche des données : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: Impossible d'effectuer la recherche."]);
}
?>