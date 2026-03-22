<?php
/**
 * Script pour récupérer les données pour l'impression de la carte rose
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée
require_once __DIR__ . '/../../class/DelivrancePlaqueCarte.php';

header('Content-Type: application/json');

// ======================================================================
// VALIDATION DE LA REQUÊTE HTTP
// ======================================================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES DONNÉES
// ======================================================================

if (!isset($_POST['paiement_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "L'ID du paiement est requis."]);
    exit;
}

// Nettoyage et validation
$paiementId = filter_var($_POST['paiement_id'], FILTER_VALIDATE_INT);

if ($paiementId === false || $paiementId <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID du paiement n'est pas valide."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation
    $delivranceManager = new DelivrancePlaqueCarte();
    
    // Récupération des données pour l'impression
    $result = $delivranceManager->getDonneesImpression($paiementId);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération données impression : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}