<?php
/**
 * Script de synchronisation des ventes depuis l'application mobile
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

// Inclure la classe Paiement
require_once __DIR__ . '/../../class/Paiement.php';

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Récupérer les données POST
$input = json_decode(file_get_contents("php://input"), true);

if (!$input || !isset($input['ventes'])) {
    echo json_encode(["status" => "error", "message" => "Données de synchronisation invalides."]);
    exit;
}

$ventes = $input['ventes'];
$utilisateur = 1 ?? 1;

try {
    $paiementManager = new Paiement();
    $result = $paiementManager->synchroniserVentes($ventes, $utilisateur);

    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la synchronisation : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: Impossible de synchroniser les ventes."]);
}