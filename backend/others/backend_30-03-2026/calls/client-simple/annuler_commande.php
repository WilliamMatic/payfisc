<?php
/**
 * Script de suppression d'une commande de plaques
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

// Vérifier les champs obligatoires
if (!isset($_POST['paiement_id']) || empty($_POST['paiement_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le champ paiement_id est obligatoire."]);
    exit;
}

if (!isset($_POST['utilisateur_id']) || empty($_POST['utilisateur_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le champ utilisateur_id est obligatoire."]);
    exit;
}

// Vérifier que la raison est fournie (pour audit)
if (!isset($_POST['raison_suppression']) || empty($_POST['raison_suppression'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "La raison de suppression est obligatoire pour l'audit."]);
    exit;
}

// Vérifier les droits utilisateur (ajoutez votre propre logique)
session_start();
if (!isset($_SESSION['user_type']) || $_SESSION['user_type'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Accès refusé. Droits administrateur requis."]);
    exit;
}

try {
    $clientSimpleManager = new ClientSimple();
    
    $paiementId = (int)$_POST['paiement_id'];
    $utilisateurId = (int)$_POST['utilisateur_id'];
    $raisonSuppression = trim($_POST['raison_suppression']);
    
    $result = $clientSimpleManager->supprimerCommande($paiementId, $utilisateurId, $raisonSuppression);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la suppression de la commande : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>