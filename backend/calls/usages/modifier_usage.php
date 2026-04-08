<?php
/**
 * Script de modification d'un usage existant
 */

require '../headers/head.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../class/UsageEngin.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

if (!isset($_POST['id'], $_POST['code'], $_POST['libelle'])) {
    echo json_encode(["status" => "error", "message" => "Tous les champs sont requis."]);
    exit;
}

$id = (int) $_POST['id'];
$code = trim(htmlspecialchars($_POST['code'], ENT_QUOTES, 'UTF-8'));
$libelle = trim(htmlspecialchars($_POST['libelle'], ENT_QUOTES, 'UTF-8'));
$description = isset($_POST['description']) ? trim(htmlspecialchars($_POST['description'], ENT_QUOTES, 'UTF-8')) : '';

try {
    $usageManager = new UsageEngin();
    $result = $usageManager->modifierUsage($id, $code, $libelle, $description);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la modification d'un usage : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>