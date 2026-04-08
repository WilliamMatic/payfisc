<?php
/**
 * Script de suppression d'un lien entre administrateur et taxe
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

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES DONNÉES DU FORMULAIRE
// ======================================================================

if (!isset($_POST['admin_id']) || !isset($_POST['taxe_id'])) {
    echo json_encode(["status" => "error", "message" => "L'ID de l'administrateur et l'ID de la taxe sont requis."]);
    exit;
}

// Nettoyage des données d'entrée
$adminId = filter_var($_POST['admin_id'], FILTER_VALIDATE_INT);
$taxeId = filter_var($_POST['taxe_id'], FILTER_VALIDATE_INT);

if ($adminId === false || $adminId <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID de l'administrateur est invalide."]);
    exit;
}

if ($taxeId === false || $taxeId <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID de la taxe est invalide."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe AdminTaxe
    $adminTaxeManager = new AdminTaxe();
    
    // Tentative de suppression du lien
    $result = $adminTaxeManager->supprimerLien($adminId, $taxeId);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la suppression du lien admin-taxe : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>