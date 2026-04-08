<?php
/**
 * Script de listing des taxes liées à un administrateur
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/AdminTaxe.php';

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

if (!isset($_GET['admin_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "L'ID de l'administrateur est requis."]);
    exit;
}

$adminId = filter_var($_GET['admin_id'], FILTER_VALIDATE_INT);

if ($adminId === false || $adminId <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID de l'administrateur est invalide."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe AdminTaxe
    $adminTaxeManager = new AdminTaxe();
    
    // Récupération des taxes liées à l'administrateur
    $result = $adminTaxeManager->listerTaxesParAdmin($adminId);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors du listing des taxes par admin : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>