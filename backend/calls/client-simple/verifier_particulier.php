<?php
/**
 * Script de vérification d'un particulier par téléphone
 */

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/ClientSimple.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

if (!isset($_POST['telephone']) || empty($_POST['telephone'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le numéro de téléphone est obligatoire."]);
    exit;
}

try {
    $clientSimpleManager = new ClientSimple();
    
    $result = $clientSimpleManager->verifierParticulierParTelephone($_POST['telephone']);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la vérification du particulier : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>