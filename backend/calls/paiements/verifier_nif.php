<?php
/**
 * Script de vérification du NIF
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

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Récupérer les données POST
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['nif']) || empty($data['nif'])) {
    echo json_encode(["status" => "error", "message" => "Le paramètre NIF est requis."]);
    exit;
}

try {
    $paiementManager = new Paiement();
    $result = $paiementManager->verifierNif($data['nif']);
    
    if ($result['status'] === 'success') {
        // Stocker les informations du contribuable en session pour les étapes suivantes
        $_SESSION['contribuable'] = $result['data'];
        $_SESSION['contribuable_type'] = $result['type'];
        $_SESSION['nif'] = $data['nif'];
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la vérification du NIF : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: Impossible de vérifier le NIF."]);
}