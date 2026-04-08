<?php
/**
 * Endpoint: Traitement d'un paiement
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_secure' => true,
        'cookie_httponly' => true,
        'use_strict_mode' => true
    ]);
}

// CORS headers
require '../../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../../class/DeclarationPaymentAPI.php';

header('Content-Type: application/json');

// Vérifier l'authentification
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
$bankId = $_SERVER['HTTP_X_BANK_ID'] ?? '';

if (empty($apiKey) || empty($bankId)) {
    echo json_encode(["status" => "error", "message" => "En-têtes d'authentification manquants"]);
    exit;
}

try {
    $paymentAPI = new DeclarationPaymentAPI();
    
    // Authentifier la banque
    $auth = $paymentAPI->authenticateBank($bankId, $apiKey);
    if ($auth['status'] !== 'success') {
        echo json_encode($auth);
        exit;
    }
    
    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (empty($input['reference_declaration']) || empty($input['methode_paiement'])) {
            echo json_encode(["status" => "error", "message" => "Paramètres 'reference_declaration' et 'methode_paiement' requis"]);
            exit;
        }
        
        $result = $paymentAPI->traiterPaiement($input['reference_declaration'], $input['methode_paiement'], $bankId);
        
        if ($result['status'] === 'success') {
            http_response_code(200);
            echo json_encode($result);
        } else {
            echo json_encode($result);
        }
        
    } else {
        echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)"]);
    }

} catch (Exception $e) {
    error_log("Erreur endpoint paiement: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: Impossible de traiter le paiement."]);
}
?>