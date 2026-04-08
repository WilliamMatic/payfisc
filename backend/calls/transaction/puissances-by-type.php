<?php
/**
 * Script pour récupérer les puissances selon le type d'engin
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
require_once __DIR__ . '/../../class/PuissanceFiscale.php';

header('Content-Type: application/json');

// ======================================================================
// VALIDATION DE LA REQUÊTE HTTP
// ======================================================================

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES PARAMÈTRES
// ======================================================================

if (!isset($_GET['type']) || empty(trim($_GET['type']))) {
    echo json_encode(["status" => "error", "message" => "Le paramètre 'type' est obligatoire."]);
    exit;
}

$typeEngin = trim(htmlspecialchars($_GET['type'], ENT_QUOTES, 'UTF-8'));

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    $typeEnginManager = new TypeEngin();
    $puissanceManager = new PuissanceFiscale();
    
    // 1. Récupérer l'ID du type d'engin
    $typeInfo = $typeEnginManager->typeEnginExiste($typeEngin);
    if (!$typeInfo) {
        echo json_encode(["status" => "error", "message" => "Type d'engin non trouvé."]);
        exit;
    }
    
    $typeEnginId = $typeInfo['id'];
    
    // 2. Récupérer les puissances pour ce type
    $result = $puissanceManager->listerPuissancesFiscalesActivesParType($typeEnginId);
    
    if ($result['status'] === 'success') {
        $puissances = array_column($result['data'], 'libelle');
        
        echo json_encode([
            "status" => "success",
            "data" => $puissances
        ]);
    } else {
        echo json_encode([
            "status" => "error", 
            "message" => $result['message'] || "Aucune puissance trouvée pour ce type d'engin."
        ]);
    }

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des puissances: " . $e->getMessage());
    
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système: Impossible de récupérer les puissances."
    ]);
}
?>