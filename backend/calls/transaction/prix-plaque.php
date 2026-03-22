<?php
/**
 * Script pour récupérer le prix de la plaque selon la province
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée
require_once __DIR__ . '/../../class/Transaction.php';

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

if (!isset($_GET['province']) || empty(trim($_GET['province']))) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le paramètre 'province' est obligatoire."]);
    exit;
}

$provinceNom = trim(htmlspecialchars($_GET['province'], ENT_QUOTES, 'UTF-8'));

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Transaction
    $transactionManager = new Transaction();
    
    // Récupération du prix
    $result = $transactionManager->getPrixPlaqueParProvince($provinceNom);
    
    if ($result['status'] === 'success') {
        echo json_encode($result);
    } else {
        http_response_code(404);
        echo json_encode($result);
    }

} catch (Exception $e) {
    error_log("Erreur lors de la récupération du prix: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système: Impossible de récupérer le prix."
    ]);
}
?>