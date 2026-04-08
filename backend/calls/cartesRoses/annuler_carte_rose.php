<?php
/**
 * Script pour annuler une carte rose
 */

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Carte_Rose.php';

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

if (!isset($_POST['utilisateur_id']) || empty($_POST['utilisateur_id'])) {
    echo json_encode(["status" => "error", "message" => "Le champ utilisateur_id est obligatoire."]);
    exit;
}

// Vérifier que la raison est fournie (pour audit)
if (!isset($_POST['raison_suppression']) || empty($_POST['raison_suppression'])) {
    echo json_encode(["status" => "error", "message" => "La raison d'annulation est obligatoire pour l'audit."]);
    exit;
}

try {
    $carteRoseManager = new CarteRose();
    
    $paiementId = (int)$_POST['paiement_id'];
    $utilisateurId = (int)$_POST['utilisateur_id'];
    $raisonSuppression = trim($_POST['raison_suppression']);
    
    $result = $carteRoseManager->annulerCarteRose($paiementId, $utilisateurId, $raisonSuppression);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de l'annulation de la carte rose : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>