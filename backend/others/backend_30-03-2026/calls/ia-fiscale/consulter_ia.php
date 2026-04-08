<?php
/**
 * Script de consultation de l'IA fiscale
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/IaFiscale.php';

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

// Validation de la longueur
if (strlen($question) > 1000) {
    echo json_encode(["status" => "error", "message" => "La question est trop longue (max 1000 caractères)."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe IaFiscale
    $iaFiscale = new IaFiscale();
    
    // Interrogation de l'IA
    $result = $iaFiscale->interrogerIa($question);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la consultation de l'IA fiscale : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système: L'IA fiscale n'a pas pu répondre à votre question."
    ]);
}
?>