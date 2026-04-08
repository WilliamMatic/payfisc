<?php
/**
 * Script de suppression d'un utilisateur
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Utilisateur.php';

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

if (!isset($_POST['id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "ID de l'utilisateur requis."]);
    exit;
}

// Nettoyage des données d'entrée
$id = (int)$_POST['id'];

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Utilisateur
    $utilisateurManager = new Utilisateur();
    
    // Tentative de suppression de l'utilisateur
    $result = $utilisateurManager->supprimerUtilisateur($id);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la suppression d'un utilisateur : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}