<?php
/**
 * Script pour annuler une immatriculation
 */

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Immatriculation.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Champs obligatoires
$requiredFields = ['paiement_id', 'utilisateur_id'];
foreach ($requiredFields as $field) {
    if (!isset($_POST[$field]) || empty($_POST[$field])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Le champ $field est obligatoire."]);
        exit;
    }
}

try {
    $immatriculationManager = new Immatriculation();
    
    $paiementId = intval($_POST['paiement_id']);
    $utilisateurId = intval($_POST['utilisateur_id']);
    $raison = $_POST['raison'] ?? "Annulation par l'utilisateur";
    
    $result = $immatriculationManager->annulerImmatriculation($paiementId, $utilisateurId, $raison);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de l'annulation de l'immatriculation : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>