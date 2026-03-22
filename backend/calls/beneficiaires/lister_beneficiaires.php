<?php
/**
 * Script de listing des bénéficiaires
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Beneficiaire.php';

header('Content-Type: application/json');

// Validation de la requête HTTP
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

// Traitement principal
try {
    // Instanciation de la classe Beneficiaire
    $beneficiaireManager = new Beneficiaire();

    // Tentative de listing des bénéficiaires
    $result = $beneficiaireManager->listerBeneficiaires();
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors du listing des bénéficiaires : " . $e->getMessage());

    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}