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
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['user_id'], $input['user_type'], $input['code'], $input['new_password'])) {
    echo json_encode(["status" => "error", "message" => "ID utilisateur, type, code et nouveau mot de passe requis."]);
    exit;
}

$userId = (int)$input['user_id'];
$userType = $input['user_type'];
$code = trim(htmlspecialchars($input['code'], ENT_QUOTES, 'UTF-8'));
$newPassword = $input['new_password'];

try {
    if ($userType === 'agent') {
        $agentManager = new Agent();
        $result = $agentManager->reinitialiserMotDePasse($userId, $newPassword, $code);
    } else if ($userType === 'utilisateur') {
        $utilisateurManager = new Utilisateur();
        $result = $utilisateurManager->reinitialiserMotDePasse($userId, $newPassword, $code);
    } else {
        echo json_encode(["status" => "error", "message" => "Type d'utilisateur invalide."]);
        exit;
    }

    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la réinitialisation: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: La réinitialisation a échoué."]);
}
?>