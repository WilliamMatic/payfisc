<?php
/**
 * Script de vérification pour la délivrance plaque + carte
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
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES DONNÉES
// ======================================================================

if (!isset($_POST['reference'], $_POST['numero_plaque'])) {
    echo json_encode(["status" => "error", "message" => "La référence et le numéro de plaque sont requis."]);
    exit;
}

// Nettoyage des données
$reference = trim(htmlspecialchars($_POST['reference'], ENT_QUOTES, 'UTF-8'));
$numeroPlaque = trim(htmlspecialchars($_POST['numero_plaque'], ENT_QUOTES, 'UTF-8'));

// Validation basique
if (empty($reference) || empty($numeroPlaque)) {
    echo json_encode(["status" => "error", "message" => "La référence et le numéro de plaque ne peuvent pas être vides."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation
    $delivranceManager = new DelivrancePlaqueCarte();
    
    // Vérification
    $result = $delivranceManager->verifierDelivrance($reference, $numeroPlaque);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la vérification délivrance : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}