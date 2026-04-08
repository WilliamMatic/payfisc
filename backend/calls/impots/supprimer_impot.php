<?php
/**
 * Script de suppression d'un impôt
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

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES DONNÉES DU FORMULAIRE
// ======================================================================

if (!isset($_POST['id'])) {
    echo json_encode(["status" => "error", "message" => "L'ID de l'impôt est requis."]);
    exit;
}

// Nettoyage des données d'entrée
$id = (int)$_POST['id'];

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Impot
    $impotManager = new Impot();
    
    // Tentative de suppression de l'impôt
    $result = $impotManager->supprimerImpot($id);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la suppression de l'impôt : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}