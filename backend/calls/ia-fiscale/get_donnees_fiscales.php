<?php
/**
 * Script pour récupérer les données fiscales pour l'IA
 * Version étendue avec sites, localités et audits
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

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe IAFiscale
    $iaFiscale = new IAFiscale();
    
    // Récupération de toutes les données fiscales
    $result = $iaFiscale->getDonneesFiscalesCompletes();
    
    // Log de l'audit
    $iaFiscale->logAudit("Récupération des données fiscales complètes pour l'IA (avec sites et audits)");
    
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la récupération des données fiscales : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    echo json_encode(["status" => "error", "message" => "Erreur système: Impossible de récupérer les données fiscales."]);
}
?>