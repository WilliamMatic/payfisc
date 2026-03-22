<?php
// auth/check_user_session.php
/**
 * Vérification de session utilisateur
 */
require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

session_start();
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

try {
    // Vérifier si l'utilisateur est connecté
    if (isset($_SESSION['user_id']) && $_SESSION['user_type'] === 'utilisateur') {
        require_once __DIR__ . '/../../class/Utilisateur.php';
        $utilisateurManager = new Utilisateur();
        $utilisateur = $utilisateurManager->utilisateurExisteParId($_SESSION['user_id']);
        
        if ($utilisateur && $utilisateur['actif']) {
            echo json_encode([
                "status" => "success",
                "data" => [
                    "utilisateur" => [
                        "id" => $utilisateur['id'],
                        "nom_complet" => $utilisateur['nom_complet'],
                        "telephone" => $utilisateur['telephone'],
                        "adresse" => $utilisateur['adresse'],
                        "site_nom" => $utilisateur['site_nom'],
                        "site_code" => $utilisateur['site_code'],
                        "site_id" => $utilisateur['site_affecte_id'],
                        "formule" => $utilisateur['site_formule'],
                        "privileges_include" => $utilisateur['privilege_json']
                    ]
                ]
            ]);
            exit;
        }
    }
    
    echo json_encode(["status" => "error", "message" => "Session utilisateur invalide"]);
    
} catch (Exception $e) {
    error_log("Erreur vérification session utilisateur : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système"]);
}
?>