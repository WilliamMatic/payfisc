<?php
/**
 * API Analytics - Gestion des métriques de performance Web Vitals
 * 
 * Ce script reçoit les données POST des Web Vitals Next.js,
 * les sauvegarde en base et fournit les statistiques via GET.
 */

// ======================================================================
// CONFIGURATION CORS ET SÉCURITÉ
// ======================================================================

require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// ======================================================================
// INCLUSION DES CLASSES
// ======================================================================

require_once __DIR__ . '/../../class/Analytics.php';
require_once __DIR__ . '/../../class/Connexion.php';

header('Content-Type: application/json');

// ======================================================================
// VALIDATION DU TOKEN API
// ======================================================================

function validateApiToken() {
    $expectedToken = 'ton_token_secret_analytics_2024';
    $receivedToken = $_SERVER['HTTP_X_API_TOKEN'] ?? '';
    
    if (empty($receivedToken) || $receivedToken !== $expectedToken) {
        http_response_code(401);
        echo json_encode([
            "status" => "error", 
            "message" => "Token API invalide ou manquant"
        ]);
        exit;
    }
}

// ======================================================================
// FONCTION DE JOURNALISATION
// ======================================================================

function logApiRequest($method, $endpoint, $data = null) {
    $logMessage = date('Y-m-d H:i:s') . " - $method $endpoint";
    if ($data) {
        $logMessage .= " - Data: " . json_encode($data);
    }
    error_log("📡 API Analytics: " . $logMessage);
}

// ======================================================================
// GESTIONNAIRE PRINCIPAL DES REQUÊTES
// ======================================================================

try {
    // Journalisation de la requête
    logApiRequest(
        $_SERVER["REQUEST_METHOD"], 
        $_SERVER["REQUEST_URI"],
        $_SERVER["REQUEST_METHOD"] === 'POST' ? file_get_contents('php://input') : null
    );

    $analyticsManager = new Analytics();

    switch ($_SERVER["REQUEST_METHOD"]) {
        case 'POST':
            // validateApiToken();
            handlePostRequest($analyticsManager);
            break;

        case 'GET':
            handleGetRequest($analyticsManager);
            break;

        default:
            http_response_code(405);
            echo json_encode([
                "status" => "error", 
                "message" => "Méthode non autorisée. Utilisez GET ou POST."
            ]);
            break;
    }

} catch (Exception $e) {
    error_log("❌ Erreur API Analytics: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système: L'opération a échoué."
    ]);
}

// ======================================================================
// FONCTIONS DE TRAITEMENT DES REQUÊTES
// ======================================================================

/**
 * Gère les requêtes POST (enregistrement des métriques Web Vitals)
 */
function handlePostRequest($analyticsManager) {
    // Récupération et validation des données JSON
    $jsonInput = file_get_contents('php://input');
    $metricData = json_decode($jsonInput, true);

    if (!$metricData || !is_array($metricData)) {
        http_response_code(400);
        echo json_encode([
            "status" => "error", 
            "message" => "Données JSON invalides ou manquantes"
        ]);
        return;
    }

    // Validation des champs obligatoires
    $requiredFields = ['name', 'value', 'id', 'url'];
    foreach ($requiredFields as $field) {
        if (!isset($metricData[$field])) {
            http_response_code(400);
            echo json_encode([
                "status" => "error", 
                "message" => "Champ obligatoire manquant: $field"
            ]);
            return;
        }
    }

    // Ajouter l'user agent si manquant
    if (!isset($metricData['user_agent'])) {
        $metricData['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? 'Inconnu';
    }

    // Ajouter le timestamp si manquant
    if (!isset($metricData['timestamp'])) {
        $metricData['timestamp'] = date('Y-m-d H:i:s');
    }

    // Sauvegarde de la métrique
    $result = $analyticsManager->saveMetric($metricData);
    
    // Retourner la réponse appropriée
    if ($result['status'] === 'success') {
        http_response_code(200);
        
        // Journalisation du succès
        error_log("✅ Métrique sauvegardée: " . $metricData['name'] . " = " . $metricData['value']);
        
    } else {
        http_response_code(400);
        
        // Journalisation de l'erreur
        error_log("❌ Erreur sauvegarde métrique: " . $result['message']);
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
            // Récupération des statistiques globales
            $startDate = $_GET['start_date'] ?? null;
            $endDate = $_GET['end_date'] ?? null;
            
            $result = $analyticsManager->getDashboardStats($startDate, $endDate);
            break;

        case 'trends':
            // Récupération des données de tendance
            $period = $_GET['period'] ?? 'week';
            $metric = $_GET['metric'] ?? null;
            
            $result = $analyticsManager->getTrendData($period, $metric);
            break;

        case 'problems':
            // Récupération des problèmes spécifiques
            $severity = $_GET['severity'] ?? null;
            $limit = $_GET['limit'] ?? 50;
            
            $result = $analyticsManager->getProblematicMetrics($severity, $limit);
            break;

        case 'health':
            // Endpoint de santé de l'API
            $result = [
                "status" => "success",
                "data" => [
                    "api_version" => "1.0",
                    "status" => "operational",
                    "timestamp" => date('Y-m-d H:i:s'),
                    "database" => "connected"
                ]
            ];
            break;

        default:
            $result = [
                "status" => "error",
                "message" => "Action non reconnue. Actions disponibles: stats, trends, problems, health"
            ];
            break;
    }

    // Retourner la réponse
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);
}
?>