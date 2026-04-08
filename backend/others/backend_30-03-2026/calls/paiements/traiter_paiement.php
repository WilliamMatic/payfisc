<?php
/**
 * Script de traitement d'un paiement avec données supplémentaires
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_secure' => true,
        'cookie_httponly' => true,
        'use_strict_mode' => true
    ]);
}

// CORS headers

require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Paiement.php';

header('Content-Type: application/json');

// Vérifier que la requête est bien en POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Récupérer les données POST
$input = file_get_contents("php://input");
$data = json_decode($input, true);

// Vérifier si le JSON est valide
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Données JSON invalides."]);
    exit;
}

// Valider les données requises
$required_fields = ['id_declaration', 'methode_paiement'];
foreach ($required_fields as $field) {
    if (!isset($data[$field])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Le paramètre $field est requis."]);
        exit;
    }
}

// Récupérer le montant des pénalités (optionnel, défaut à 0)
$montantPenalites = isset($data['montant_penalites']) ? floatval($data['montant_penalites']) : 0;

// Récupérer les données de paiement supplémentaires
$donneesPaiement = isset($data['donnees_paiement']) ? $data['donnees_paiement'] : [];

try {
    $paiementManager = new Paiement();
    $result = $paiementManager->traiterPaiement(
        $data['id_declaration'],
        $data['methode_paiement'],
        $montantPenalites,
        $donneesPaiement // Passer les données supplémentaires
    );
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors du traitement du paiement : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: Impossible de traiter le paiement." . $e]);
}
?>