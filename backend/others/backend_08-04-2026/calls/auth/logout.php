<?php
/**
 * Script de déconnexion
 * 
 * Ce script détruit la session utilisateur et logge l'action.
 */

// ========== CORS HEADERS ==========
require '../headers/head.php';

// Réponse pour le preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// ========== DÉMARRAGE DE LA SESSION ==========
if (session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_secure' => true,     // uniquement HTTPS
        'cookie_httponly' => true,   // inaccessible au JS
        'use_strict_mode' => true,   // sécurité contre fixation de session
        'cookie_samesite' => 'Lax'   // protection CSRF légère
    ]);
}

header('Content-Type: application/json');

// ========== LOG DE LA DÉCONNEXION ==========
if (isset($_SESSION['agent_id'])) {
    // Inclusion sécurisée de la classe Agent
    require_once __DIR__ . '/../../class/Agent.php';
    
    try {
        $agentManager = new Agent();
        $prenomNom = trim(($_SESSION['agent_prenom'] ?? '') . ' ' . ($_SESSION['agent_nom'] ?? ''));
        $agentManager->logAudit("Déconnexion de l'agent ID " . $_SESSION['agent_id'] . ": $prenomNom");
    } catch (Exception $e) {
        error_log("Erreur lors de la journalisation de déconnexion : " . $e->getMessage());
    }
}

// ========== DESTRUCTION DE LA SESSION ==========
$_SESSION = []; // Vider toutes les variables de session

// Supprimer le cookie de session
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Détruire la session
session_destroy();

// ========== RÉPONSE JSON ==========
echo json_encode([
    "status" => "success",
    "message" => "Déconnexion réussie."
]);
