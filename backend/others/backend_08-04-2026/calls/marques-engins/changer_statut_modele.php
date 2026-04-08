<?php
/**
 * Script de changement de statut d'un modèle d'engin
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/MarqueEngin.php';

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
// VALIDATION DES DONNÉES DU FORMULAIRE
// ======================================================================

if (!isset($_POST['id'], $_POST['actif'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "L'ID du modèle et le statut sont requis."]);
    exit;
}

// Nettoyage des données d'entrée
$id = filter_var($_POST['id'], FILTER_VALIDATE_INT);
$actif = filter_var($_POST['actif'], FILTER_VALIDATE_BOOLEAN);

if ($id === false || $id <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID du modèle est invalide."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe MarqueEngin
    $marqueManager = new MarqueEngin();
    
    // Tentative de changement de statut
    $result = $marqueManager->changerStatutModele($id, $actif);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors du changement de statut du modèle : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}