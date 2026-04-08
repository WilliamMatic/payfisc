<?php
/**
 * Script d'ajout d'une taxe à un site
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

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES DONNÉES DU FORMULAIRE
// ======================================================================

if (!isset($_POST['site_id'], $_POST['taxe_id'], $_POST['prix'])) {
    echo json_encode(["status" => "error", "message" => "Tous les champs sont requis."]);
    exit;
}

$siteId = filter_var($_POST['site_id'], FILTER_VALIDATE_INT);
$taxeId = filter_var($_POST['taxe_id'], FILTER_VALIDATE_INT);
$prix = filter_var($_POST['prix'], FILTER_VALIDATE_FLOAT);

if ($siteId === false || $siteId <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID du site est invalide."]);
    exit;
}

if ($taxeId === false || $taxeId <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID de la taxe est invalide."]);
    exit;
}

if ($prix === false || $prix < 0) {
    echo json_encode(["status" => "error", "message" => "Le prix doit être un nombre positif."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    $siteTaxeManager = new SiteTaxe();
    $result = $siteTaxeManager->ajouterTaxeAuSite($siteId, $taxeId, $prix);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de l'ajout de la taxe au site: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}