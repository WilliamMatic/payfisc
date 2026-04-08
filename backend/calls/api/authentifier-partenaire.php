<?php
/**
 * Script d'authentification des partenaires bancaires
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Partenaire.php';

header('Content-Type: application/json');

// ======================================================================
// VALIDATION DE LA REQUÊTE HTTP
// ======================================================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// ======================================================================
// RÉCUPÉRATION ET VALIDATION DES DONNÉES
// ======================================================================

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(["status" => "error", "message" => "JSON invalide."]);
    exit;
}

if (empty($data['bank_id']) || empty($data['api_key'])) {
    echo json_encode(["status" => "error", "message" => "Bank ID et API Key requis."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Partenaire
    $partenaireManager = new Partenaire();
    
    // Récupération de l'IP et du User-Agent
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';

    // Vérification des restrictions
    $restrictions = $partenaireManager->verifierRestrictions($data['bank_id'], $ip, $userAgent);
    
    if ($restrictions['status'] === 'error') {
        echo json_encode($restrictions);
        exit;
    }

    // Authentification du partenaire
    $result = $partenaireManager->authentifierPartenaire($data['bank_id'], $data['api_key']);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
        echo json_encode($result);
    } else {
        echo json_encode($result);
    }

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de l'authentification du partenaire : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    echo json_encode(["status" => "error", "message" => "Erreur système: L'authentification a échoué."]);
}