<?php
/**
 * Script de récupération de l'historique des transactions d'un utilisateur
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
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES PARAMÈTRES
// ======================================================================

if (!isset($_GET['particulier_id']) || empty($_GET['particulier_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "L'ID du particulier est requis."]);
    exit;
}

$particulierId = filter_var($_GET['particulier_id'], FILTER_VALIDATE_INT);

if ($particulierId === false || $particulierId <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "L'ID du particulier est invalide."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Transaction
    $transactionManager = new Transaction();
    
    // Récupération de l'historique des transactions
    $historique = $transactionManager->getHistoriqueTransactions($particulierId);
    
    if ($historique) {
        echo json_encode([
            "status" => "success",
            "message" => "Historique récupéré avec succès",
            "data" => $historique
        ]);
    } else {
        echo json_encode([
            "status" => "success",
            "message" => "Aucune transaction trouvée",
            "data" => []
        ]);
    }

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la récupération de l'historique : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système: Impossible de récupérer l'historique des transactions."
    ]);
}
?>