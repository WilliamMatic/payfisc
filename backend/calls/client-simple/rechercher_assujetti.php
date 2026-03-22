<?php
/**
 * Script pour rechercher un assujetti par téléphone
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
    
    $telephone = trim($_POST['telephone']);
    $utilisateurId = isset($_POST['utilisateur_id']) ? (int)$_POST['utilisateur_id'] : null;
    
    $result = $clientSimpleManager->rechercherAssujettiParTelephone($telephone, $utilisateurId);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la recherche de l'assujetti : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>