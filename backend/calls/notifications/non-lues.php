<?php
/**
 * API pour récupérer les notifications non lues
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

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

try {
    $paiementManager = new Paiement();
    
    // Récupérer le paramètre limit
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
    
    // Récupérer les notifications non lues (sans NIF spécifique pour l'instant)
    $result = $paiementManager->getNotificationsNonLues(null, $limit);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des notifications non lues : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: Impossible de récupérer les notifications."]);
}
?>