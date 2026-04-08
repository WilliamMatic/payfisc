<?php
// auth/user_login.php
/**
 * Script d'authentification des utilisateurs (particuliers/entreprises)
 */

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Utilisateur.php';
session_start();
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['telephone'], $input['password'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Téléphone et mot de passe requis."]);
    exit;
}

$telephone = trim(htmlspecialchars($input['telephone'], ENT_QUOTES, 'UTF-8'));
$password = $input['password'];

try {
    $utilisateurManager = new Utilisateur();
    $result = $utilisateurManager->authentifierUtilisateur($telephone, $password);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de l'authentification utilisateur : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'authentification a échoué."]);
}
?>