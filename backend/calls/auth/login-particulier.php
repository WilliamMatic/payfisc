<?php
/**
 * Script d'authentification d'un particulier
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Auth.php';

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
// VALIDATION ET RÉCUPÉRATION DES DONNÉES JSON
// ======================================================================

// Récupération du corps de la requête JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Données JSON invalides."]);
    exit;
}

// Validation des champs obligatoires
if (!isset($data['telephone'], $data['password'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le téléphone et le mot de passe sont obligatoires."]);
    exit;
}

// Nettoyage des données
$telephone = trim(htmlspecialchars($data['telephone'], ENT_QUOTES, 'UTF-8'));
$password = $data['password'];

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Particulier
    $particulierManager = new Particulier();
    
    // Authentification du particulier
    $result = $particulierManager->authentifierParticulier($telephone, $password);
    
    // TOUJOURS retourner un statut HTTP 200 pour les réponses JSON
    // Les erreurs métier sont gérées via le champ "status"
    http_response_code(200);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de l'authentification d'un particulier : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(200); // IMPORTANT: Toujours 200 pour les réponses JSON
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération d'authentification a échoué."]);
}