<?php
/**
 * Script de vérification de séquence de plaques
 */
require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/ClientSimple.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Vérifier que les champs requis sont fournis
if (!isset($_POST['plaque_debut']) || !isset($_POST['quantite']) || !isset($_POST['utilisateur_id'])) {
    echo json_encode(["status" => "error", "message" => "Les champs plaque_debut, quantite et utilisateur_id sont obligatoires."]);
    exit;
}

try {
    $clientSimpleManager = new ClientSimple();
    
    // Vérification de la séquence de plaques
    $result = $clientSimpleManager->verifierSequencePlaques(
        $_POST['plaque_debut'],
        intval($_POST['quantite']),
        intval($_POST['utilisateur_id'])
    );
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la vérification de la séquence : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>