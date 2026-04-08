<?php
/**
 * Script de recherche de bénéficiaires
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
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

// Validation des paramètres
if (!isset($_GET['search'])) {
    echo json_encode(["status" => "error", "message" => "Paramètre de recherche requis."]);
    exit;
}

// Nettoyage du terme de recherche
$searchTerm = trim(htmlspecialchars($_GET['search'], ENT_QUOTES, 'UTF-8'));

// Traitement principal
try {
    // Instanciation de la classe Beneficiaire
    $beneficiaireManager = new Beneficiaire();

    // Tentative de recherche de bénéficiaires
    $result = $beneficiaireManager->rechercherBeneficiaires($searchTerm);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la recherche de bénéficiaires : " . $e->getMessage());

    // Message générique pour l'utilisateur
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}