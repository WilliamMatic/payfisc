<?php
/**
 * Script de suppression d'un type d'engin
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
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

if (!isset($_POST['id'])) {
    echo json_encode(["status" => "error", "message" => "ID du type d'engin requis."]);
    exit;
}

$id = (int) $_POST['id'];

try {
    $typeEnginManager = new TypeEngin();
    $result = $typeEnginManager->supprimerTypeEngin($id);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la suppression d'un type d'engin : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}