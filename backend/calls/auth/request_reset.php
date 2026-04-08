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
if (!isset($input['identifiant'])) {
    echo json_encode(["status" => "error", "message" => "Identifiant requis (email ou téléphone)."]);
    exit;
}

$identifiant = trim(htmlspecialchars($input['identifiant'], ENT_QUOTES, 'UTF-8'));

try {
    // Déterminer le type d'identifiant
    $isEmail = filter_var($identifiant, FILTER_VALIDATE_EMAIL) !== false;
    $isPhone = preg_match('/^\+?[0-9\s\-\(\)]{8,20}$/', $identifiant);

    if (!$isEmail && !$isPhone) {
        echo json_encode(["status" => "error", "message" => "Format d'identifiant invalide. Utilisez un email ou un numéro de téléphone."]);
        exit;
    }

    if ($isEmail) {
        // Traitement pour les agents (email)
        $agentManager = new Agent();
        $result = $agentManager->envoyerCodeReinitialisation($identifiant);
    } else {
        // Traitement pour les utilisateurs (téléphone)
        $utilisateurManager = new Utilisateur();
        $result = $utilisateurManager->envoyerCodeReinitialisation($identifiant);
    }

    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de l'envoi du code: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'envoi du code a échoué."]);
}
?>