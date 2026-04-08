<?php
/**
 * Script d'authentification des utilisateurs
 * Authentifie un utilisateur par nom complet et mot de passe
 */

// ======================================================================
// CONFIGURATION DES EN-TÊTES
// ======================================================================

// Headers CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// ======================================================================
// VALIDATION DE LA REQUÊTE HTTP
// ======================================================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// ======================================================================
// INCLUSION DE LA CLASSE
// ======================================================================

// Inclusion de la classe Authentification
require_once __DIR__ . '/../class/Authentification.php';

// ======================================================================
// TRAITEMENT DES DONNÉES D'ENTRÉE
// ======================================================================

// Lit les données JSON envoyées
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Si pas de JSON, utilise les données POST standard
if (json_last_error() !== JSON_ERROR_NONE) {
    $data = $_POST;
}

// ======================================================================
// VALIDATION DES DONNÉES
// ======================================================================

if (!isset($data['nom_complet'], $data['password'])) {
    http_response_code(400);
    echo json_encode([
        "status" => "error", 
        "message" => "Le nom complet et le mot de passe sont obligatoires."
    ]);
    exit;
}

// Nettoyage des données
$nomComplet = trim(htmlspecialchars($data['nom_complet'], ENT_QUOTES, 'UTF-8'));
$password = $data['password']; // Le mot de passe reste en clair pour vérification

// Validation basique
if (empty($nomComplet) || empty($password)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Tous les champs sont obligatoires."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Authentification
    $authManager = new Authentification();
    
    // Appel de la méthode d'authentification
    $result = $authManager->authentifierUtilisateur($nomComplet, $password);
    
    // Définit le code HTTP approprié
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
        http_response_code(401); // Unauthorized
    }
    
    // Retourne la réponse en JSON
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur
    error_log("Erreur lors de l'authentification: " . $e->getMessage());
    
    // Réponse d'erreur
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système lors de l'authentification."
    ]);
}