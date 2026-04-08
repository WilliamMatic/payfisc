<?php
/**
 * Script de vérification de la disponibilité des plaques
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Transaction.php';

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

if (!isset($_GET['province']) || empty(trim($_GET['province']))) {
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
    
    // Vérification de la disponibilité selon la province
    $result = $transactionManager->verifierPlaqueDisponibleParProvinceFinal($provinceNom);
    
    if ($result['status'] === 'success') {
        echo json_encode($result);
    } else {
        echo json_encode($result);
    }

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la vérification de la plaque : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système: Impossible de vérifier la disponibilité des plaques."
    ]);
}
?>