<?php
/**
 * API Analytics - Gestion des métriques de performance Web Vitals
 * 
 * Ce script reçoit les données POST des Web Vitals Next.js,
 * les sauvegarde en base et fournit les statistiques via GET.
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée
require_once __DIR__ . '/../../class/Analytics.php';

header('Content-Type: application/json');

// ======================================================================
// VALIDATION DU TOKEN API
// ======================================================================

function validateApiToken() {
    $expectedToken = 'ton_token_secret_analytics_2024';
    $receivedToken = $_SERVER['HTTP_X_API_TOKEN'] ?? '';
    
    if (empty($receivedToken) || $receivedToken !== $expectedToken) {
        echo json_encode([
            "status" => "error", 
            "message" => "Token API invalide ou manquant"
        ]);
        exit;
    }
}

// ======================================================================
// GESTION DES REQUÊTES
// ======================================================================

try {
    $analyticsManager = new Analytics();

    switch ($_SERVER["REQUEST_METHOD"]) {
        case 'POST':
            validateApiToken();
            handlePostRequest($analyticsManager);
            break;

        case 'GET':
            handleGetRequest($analyticsManager);
            break;

        default:
            echo json_encode([
                "status" => "error", 
                "message" => "Méthode non autorisée"
            ]);
            break;
    }

} catch (Exception $e) {
    error_log("Erreur API Analytics: " . $e->getMessage());
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système: L'opération a échoué."
    ]);
}

// ======================================================================
// FONCTIONS DE TRAITEMENT
// ======================================================================

/**
 * Gère les requêtes POST (enregistrement des métriques)
 */
function handlePostRequest($analyticsManager) {
    // Récupération des données JSON
    $jsonInput = file_get_contents('php://input');
    $metricData = json_decode($jsonInput, true);

    if (!$metricData) {
        echo json_encode([
            "status" => "error", 
            "message" => "Données JSON invalides"
        ]);
        return;
    }

    // Ajouter l'user agent si manquant
    if (!isset($metricData['user_agent'])) {
        $metricData['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? '';
    }

    $result = $analyticsManager->saveMetric($metricData);
    
    // Retourner le même code HTTP que le statut
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
    }
    
    echo json_encode($result);
}

/**
 * Gère les requêtes GET (récupération des statistiques)
 */
function handleGetRequest($analyticsManager) {
    $action = $_GET['action'] ?? 'stats';
    
    switch ($action) {
        case 'stats':
            $startDate = $_GET['start_date'] ?? null;
            $endDate = $_GET['end_date'] ?? null;
            $result = $analyticsManager->getDashboardStats($startDate, $endDate);
            break;

        case 'trends':
            $period = $_GET['period'] ?? 'week';
            $metric = $_GET['metric'] ?? null;
            $result = $analyticsManager->getTrendData($period, $metric);
            break;

        default:
            $result = [
                "status" => "error",
                "message" => "Action non reconnue"
            ];
            break;
    }

    echo json_encode($result);
}
?>