<?php
// auth/user_logout.php
/**
 * Déconnexion utilisateur
 */
require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

session_start();
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

try {
    // Journaliser la déconnexion
    if (isset($_SESSION['user_id'])) {
        require_once __DIR__ . '/../../class/Utilisateur.php';
        $utilisateurManager = new Utilisateur();
        $utilisateurManager->logAudit("Déconnexion de l'utilisateur ID " . $_SESSION['user_id']);
    }
    
    // Détruire la session
    session_unset();
    session_destroy();
    
    echo json_encode(["status" => "success", "message" => "Déconnexion réussie"]);
    
} catch (Exception $e) {
    error_log("Erreur lors de la déconnexion utilisateur : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système"]);
}
?>