<?php
/**
 * Endpoint: Initialisation d'un paiement d'impôt
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
    echo json_encode([
        "status" => "error", 
        "code" => "MISSING_AUTH_HEADERS",
        "message" => "En-têtes d'authentification manquants"
    ]);
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
        
        if (empty($input['impot_id']) || empty($input['nombre_declarations'])) {
            echo json_encode([
                "status" => "error",
                "code" => "MISSING_PARAMETERS", 
                "message" => "Paramètres 'impot_id' et 'nombre_declarations' requis"
            ]);
            exit;
        }
        
        $impotId = (int)$input['impot_id'];
        $nombreDeclarations = (int)$input['nombre_declarations'];
        
        if ($nombreDeclarations <= 0) {
            echo json_encode([
                "status" => "error",
                "code" => "INVALID_NUMBER",
                "message" => "Le nombre de déclarations doit être supérieur à 0"
            ]);
            exit;
        }
        
        $result = $paymentAPI->initialiserPaiement($impotId, $nombreDeclarations);
        
        if ($result['status'] === 'success') {
            http_response_code(201);
            echo json_encode($result);
        } else {
            echo json_encode($result);
        }
        
    } else {
        echo json_encode([
            "status" => "error",
            "code" => "METHOD_NOT_ALLOWED",
            "message" => "Méthode non autorisée (POST requis)"
        ]);
    }

} catch (Exception $e) {
    error_log("Erreur endpoint initialisation paiement: " . $e->getMessage());
    echo json_encode([
        "status" => "error",
        "code" => "SYSTEM_ERROR",
        "message" => "Erreur système: Impossible d'initialiser le paiement."
    ]);
}
?>