<?php
/**
 * Script pour supprimer une vente non-grossiste
 */

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Ventes.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Champs obligatoires
$requiredFields = ['paiement_id', 'utilisateur_id'];
foreach ($requiredFields as $field) {
    if (!isset($_POST[$field]) || empty($_POST[$field])) {
        echo json_encode(["status" => "error", "message" => "Le champ $field est obligatoire."]);
        exit;
    }
}

try {
    $ventesManager = new Ventes();
    
    $paiementId = intval($_POST['paiement_id']);
    $utilisateurId = intval($_POST['utilisateur_id']);
    $raison = $_POST['raison'] ?? "Suppression via interface admin";
    
    $result = $ventesManager->supprimerVente($paiementId, $utilisateurId, $raison);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la suppression de la vente : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>