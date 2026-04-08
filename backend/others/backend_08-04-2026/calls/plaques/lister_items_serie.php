<?php
/**
 * Script de listing des items d'une série
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

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES PARAMÈTRES
// ======================================================================

if (!isset($_GET['serie_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "L'ID de la série est requis."]);
    exit;
}

// Nettoyage des données d'entrée
$serieId = filter_var($_GET['serie_id'], FILTER_VALIDATE_INT);

if ($serieId === false || $serieId <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID de la série est invalide."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Plaque
    $plaqueManager = new Plaque();
    
    // Récupération des items de la série
    $result = $plaqueManager->listerItemsSerie($serieId);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors du listing des items de série : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}