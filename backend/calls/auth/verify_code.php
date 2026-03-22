<?php
require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Agent.php';
require_once __DIR__ . '/../../class/Utilisateur.php';
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['identifiant'], $input['code'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Identifiant et code requis."]);
    exit;
}

$identifiant = trim(htmlspecialchars($input['identifiant'], ENT_QUOTES, 'UTF-8'));
$code = trim(htmlspecialchars($input['code'], ENT_QUOTES, 'UTF-8'));

try {
    // Déterminer le type d'identifiant
    $isEmail = filter_var($identifiant, FILTER_VALIDATE_EMAIL) !== false;

    if ($isEmail) {
        // Vérification pour les agents
        $agentManager = new Agent();
        $result = $agentManager->verifierCodeReset($identifiant, $code);
        if ($result['status'] === 'success') {
            $result['user_type'] = 'agent';
        }
    } else {
        // Vérification pour les utilisateurs
        $utilisateurManager = new Utilisateur();
        $result = $utilisateurManager->verifierCodeReset($identifiant, $code);
        if ($result['status'] === 'success') {
            $result['user_type'] = 'utilisateur';
        }
    }

    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la vérification du code: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: La vérification du code a échoué."]);
}
?>