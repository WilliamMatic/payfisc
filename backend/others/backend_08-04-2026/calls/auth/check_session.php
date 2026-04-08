// auth/check_session.php
<?php
/**
 * Script de vérification de session
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
    // Vérifier la session agent
    if (isset($_SESSION['agent_id'])) {
        require_once __DIR__ . '/../../class/Agent.php';
        $agentManager = new Agent();
        $agent = $agentManager->agentExisteParId($_SESSION['agent_id']);
        
        if ($agent && $agent['actif']) {
            // Récupération des privilèges
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
                ]
            ]);
            exit;
        }
    }
    
    echo json_encode(["status" => "error", "message" => "Session invalide"]);
    
} catch (Exception $e) {
    error_log("Erreur lors de la vérification de session : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système"]);
}
?>