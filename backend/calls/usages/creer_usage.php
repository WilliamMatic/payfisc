<?php
/**
 * Script de création d'un nouvel usage d'engin
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/UsageEngin.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

if (!isset($_POST['code'], $_POST['libelle'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le code et le libellé sont requis."]);
    exit;
}

$code = trim(htmlspecialchars($_POST['code'], ENT_QUOTES, 'UTF-8'));
$libelle = trim(htmlspecialchars($_POST['libelle'], ENT_QUOTES, 'UTF-8'));
$description = isset($_POST['description']) ? trim(htmlspecialchars($_POST['description'], ENT_QUOTES, 'UTF-8')) : '';

try {
    $usageManager = new UsageEngin();
    $result = $usageManager->ajouterUsage($code, $libelle, $description);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de l'ajout d'un usage d'engin : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>