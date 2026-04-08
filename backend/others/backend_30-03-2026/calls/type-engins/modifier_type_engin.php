<?php
/**
 * Script de modification d'un type d'engin existant
 */

// Autoriser les requêtes cross-origin
require '../headers/head.php';

// Répondre directement aux requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../class/TypeEngin.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

if (!isset($_POST['id'], $_POST['libelle'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "L'ID et le libellé sont requis."]);
    exit;
}

$id = (int) $_POST['id'];
$libelle = trim(htmlspecialchars($_POST['libelle'], ENT_QUOTES, 'UTF-8'));
$description = isset($_POST['description']) ? trim(htmlspecialchars($_POST['description'], ENT_QUOTES, 'UTF-8')) : '';

if (strlen($libelle) > 100) {
    echo json_encode(["status" => "error", "message" => "Le libellé ne doit pas dépasser 100 caractères."]);
    exit;
}

try {
    $typeEnginManager = new TypeEngin();
    $result = $typeEnginManager->modifierTypeEngin($id, $libelle, $description);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la modification d'un type d'engin : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}