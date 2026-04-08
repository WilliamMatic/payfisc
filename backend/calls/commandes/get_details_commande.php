<?php
/**
 * Script pour récupérer les détails d'une commande spécifique
 */

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/CommandesPlaques.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Vérifier les champs obligatoires
if (!isset($_POST['paiement_id']) || empty($_POST['paiement_id'])) {
    echo json_encode(["status" => "error", "message" => "Le champ paiement_id est obligatoire."]);
    exit;
}

try {
    $commandesManager = new CommandesPlaques();
    
    $paiementId = (int)$_POST['paiement_id'];
    
    $result = $commandesManager->getDetailsCommande($paiementId);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des détails : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>