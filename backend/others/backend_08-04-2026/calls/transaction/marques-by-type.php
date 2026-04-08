<?php
/**
 * Script pour récupérer les marques selon le type d'engin
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée
require_once __DIR__ . '/../../class/Connexion.php';
require_once __DIR__ . '/../../class/TypeEngin.php';
require_once __DIR__ . '/../../class/MarqueEngin.php';

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

if (!isset($_GET['type']) || empty(trim($_GET['type']))) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le paramètre 'type' est obligatoire."]);
    exit;
}

$typeEngin = trim(htmlspecialchars($_GET['type'], ENT_QUOTES, 'UTF-8'));

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    $typeEnginManager = new TypeEngin();
    $marqueManager = new MarqueEngin();
    
    // 1. Récupérer l'ID du type d'engin
    $typeInfo = $typeEnginManager->typeEnginExiste($typeEngin);
    if (!$typeInfo) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Type d'engin non trouvé."]);
        exit;
    }
    
    $typeEnginId = $typeInfo['id'];
    
    // 2. Récupérer les marques pour ce type
    $result = $marqueManager->listerMarquesActivesParType($typeEnginId);
    
    if ($result['status'] === 'success') {
        $marques = array_column($result['data'], 'libelle');
        
        echo json_encode([
            "status" => "success",
            "data" => $marques
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            "status" => "error", 
            "message" => $result['message'] || "Aucune marque trouvée pour ce type d'engin."
        ]);
    }

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des marques: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système: Impossible de récupérer les marques."
    ]);
}
?>