<?php
/**
 * Script pour récupérer les détails complets d'un particulier
 */

// CORS headers
require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Particulier.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

if (!isset($_POST['id']) || empty(trim($_POST['id']))) {
    echo json_encode(["status" => "error", "message" => "L'ID du particulier est requis."]);
    exit;
}

try {
    $id = (int)$_POST['id'];
    $particulierManager = new Particulier();
    $result = $particulierManager->getDetailsParticulier($id);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des détails : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}