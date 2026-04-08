<?php
// auth/check_any_session.php
/**
 * Vérifie TOUTES les sessions (agent et utilisateur)
 */

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

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
    // 1. D'abord vérifier la session agent
    if (isset($_SESSION['agent_id'])) {
        require_once __DIR__ . '/../../class/Agent.php';
        $agentManager = new Agent();
        $agent = $agentManager->agentExisteParId($_SESSION['agent_id']);
        
        if ($agent && $agent['actif']) {
            $privilegesResult = $agentManager->getPrivilegesAgent($_SESSION['agent_id']);
            
            echo json_encode([
                "status" => "success", 
                "data" => [
                    "agent" => [
                        "id" => $_SESSION['agent_id'],
                        "nom" => $_SESSION['agent_nom'],
                        "prenom" => $_SESSION['agent_prenom'],
                        "email" => $_SESSION['agent_email']
                    ],
                    "privileges" => $privilegesResult['data'] ?? []
                ],
                "userType" => "agent"
            ]);
            exit;
        }
    }
    
    // 2. Ensuite vérifier la session utilisateur
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
                        "privileges_include" => $utilisateur['privilege_json'],
                        "province_id" => $utilisateur['province_id'],
                        "province_code" => $utilisateur['province_code'],
                        "extension_site" => $utilisateur['extension_site']
                    ]
                ],
                "userType" => "utilisateur"
            ]);
            exit;
        }
    }
    
    // 3. Aucune session valide
    echo json_encode(["status" => "error", "message" => "Aucune session valide"]);
    
} catch (Exception $e) {
    error_log("Erreur vérification session : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système"]);
}
?>