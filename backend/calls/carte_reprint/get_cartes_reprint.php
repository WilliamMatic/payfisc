<?php
/**
 * API pour récupérer les cartes à réimprimer
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/CarteReprintManager.php';

header('Content-Type: application/json');

// ======================================================================
// VALIDATION DE LA REQUÊTE HTTP
// ======================================================================

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES PARAMÈTRES
// ======================================================================

$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$limit = isset($_GET['limit']) ? min(max(1, intval($_GET['limit'])), 100) : 10;
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$statut = isset($_GET['statut']) ? $_GET['statut'] : 'all';
$site_nom = isset($_GET['site_nom']) ? trim($_GET['site_nom']) : '';

if (empty($site_nom)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le nom du site est requis."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    $manager = new CarteReprintManager();
    
    // Récupérer l'ID du site
    $siteId = $manager->getSiteIdByName($site_nom);
    
    if (!$siteId) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Site non trouvé."]);
        exit;
    }
    
    // Récupérer les cartes avec pagination
    $result = $manager->getCartesReprint($siteId, $page, $limit, $search, $statut);
    
    // Formater les dates
    $result['cartes'] = $manager->formaterDatesCartes($result['cartes']);
    
    // Récupérer les statistiques
    $stats = $manager->getStatistiquesCartes($siteId, $search);
    
    echo json_encode([
        "status" => "success", 
        "data" => $result['cartes'],
        "pagination" => [
            "page" => $result['page'],
            "limit" => $result['limit'],
            "total" => $result['total'],
            "totalPages" => $result['totalPages']
        ],
        "stats" => $stats,
        "site_id" => $siteId
    ]);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des cartes à réimprimer: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système: " . $e->getMessage()
    ]);
}
?>