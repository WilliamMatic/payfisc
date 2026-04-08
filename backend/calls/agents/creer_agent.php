<?php
/**
 * Script de création d'un nouvel agent
 * 
 * Ce script reçoit les données POST d'un formulaire, valide les entrées,
 * crée un nouvel agent via la classe Agent, et retourne une réponse JSON.
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}


// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Agent.php';

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

if (!isset($_POST['nom'], $_POST['prenom'], $_POST['email'])) {
    echo json_encode(["status" => "error", "message" => "Tous les champs sont requis."]);
    exit;
}

// Nettoyage des données d'entrée
$nom = trim(htmlspecialchars($_POST['nom'], ENT_QUOTES, 'UTF-8'));
$prenom = trim(htmlspecialchars($_POST['prenom'], ENT_QUOTES, 'UTF-8'));
$email = trim(htmlspecialchars($_POST['email'], ENT_QUOTES, 'UTF-8'));

// Validation du format de l'email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "L'adresse email est invalide."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Agent
    $agentManager = new Agent();
    
    // Tentative d'ajout du nouvel agent
    $result = $agentManager->ajouterAgent($nom, $prenom, $email);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de l'ajout d'un agent : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}