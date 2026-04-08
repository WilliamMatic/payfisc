<?php
require '../headers/head.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../class/Energie.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

if (!isset($_POST['id'], $_POST['nom'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "ID et nom sont requis."]);
    exit;
}

$id = (int) $_POST['id'];
$nom = trim(htmlspecialchars($_POST['nom'], ENT_QUOTES, 'UTF-8'));
$description = isset($_POST['description']) ? trim(htmlspecialchars($_POST['description'], ENT_QUOTES, 'UTF-8')) : '';
$couleur = isset($_POST['couleur']) ? trim(htmlspecialchars($_POST['couleur'], ENT_QUOTES, 'UTF-8')) : '#6B7280';

try {
    $energieManager = new Energie();
    $result = $energieManager->modifierEnergie($id, $nom, $description, $couleur);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la modification d'une énergie : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}