<?php
/**
 * Script de changement de statut d'un particulier
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

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES DONNÉES DU FORMULAIRE
// ======================================================================

if (!isset($_POST['id']) || empty(trim($_POST['id']))) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "L'ID du particulier est requis."]);
    exit;
}

if (!isset($_POST['actif'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le statut (actif) est requis."]);
    exit;
}

$id = (int)$_POST['id'];
$actif = filter_var($_POST['actif'], FILTER_VALIDATE_BOOLEAN);

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Particulier
    $particulierManager = new Particulier();
    
    // Tentative de changement de statut du particulier
    $result = $particulierManager->changerStatutParticulier($id, $actif);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors du changement de statut d'un particulier : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}