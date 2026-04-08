<?php
/**
 * Endpoint: Annulation d'une déclaration
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
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "En-têtes d'authentification manquants"]);
    exit;
}

try {
    $paymentAPI = new DeclarationPaymentAPI();
    
    // Authentifier la banque
    $auth = $paymentAPI->authenticateBank($bankId, $apiKey);
    if ($auth['status'] !== 'success') {
        http_response_code(401);
        echo json_encode($auth);
        exit;
    }
    
    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (empty($input['reference_declaration'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Paramètre 'reference_declaration' requis"]);
            exit;
        }
        
        $result = $paymentAPI->annulerDeclaration($input['reference_declaration']);
        
        if ($result['status'] === 'success') {
            http_response_code(200);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode($result);
        }
        
    } else {
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)"]);
    }

} catch (Exception $e) {
    error_log("Erreur endpoint annulation: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: Impossible d'annuler la déclaration."]);
}
?>