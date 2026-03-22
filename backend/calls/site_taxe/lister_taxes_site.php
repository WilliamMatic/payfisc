<?php
/**
 * Script de listing des taxes associées à un site
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/SiteTaxe.php';

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

if (!isset($_GET['site_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "L'ID du site est requis."]);
    exit;
}

$siteId = filter_var($_GET['site_id'], FILTER_VALIDATE_INT);

if ($siteId === false || $siteId <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID du site est invalide."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    $siteTaxeManager = new SiteTaxe();
    $result = $siteTaxeManager->listerTaxesParSite($siteId);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors du listing des taxes du site: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}