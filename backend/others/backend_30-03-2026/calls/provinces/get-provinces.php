<?php
/**
 * Script pour récupérer la liste des provinces actives
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Province.php';

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
    // Instanciation de la classe Province
    $provinceManager = new Province();
    
    // Récupération des provinces actives
    $provinces = $provinceManager->getProvincesActives();
    
    if ($provinces === false) {
        throw new Exception("Erreur lors de la récupération des provinces");
    }
    
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "data" => $provinces,
        "message" => "Provinces récupérées avec succès"
    ]);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la récupération des provinces : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: Impossible de récupérer les provinces."]);
}