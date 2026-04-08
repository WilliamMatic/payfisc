<?php
/**
 * Script de listing des impôts actifs
 */

// CORS headers
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

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {

    $siteCode = isset($_GET['site_code']) ? $_GET['site_code'] : '';

    // Instanciation de la classe Impot
    $impotManager = new Impot();
    
    // Récupération de la liste des impôts actifs
    $result = $impotManager->listerImpotActifs($siteCode);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors du listing des impôts : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}