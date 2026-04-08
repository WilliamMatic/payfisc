<?php
/**
 * Script de changement de statut d'une taxe associée à un site
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
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES DONNÉES DU FORMULAIRE
// ======================================================================

if (!isset($_POST['id'], $_POST['status'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "L'ID et le statut sont requis."]);
    exit;
}

$id = filter_var($_POST['id'], FILTER_VALIDATE_INT);
$status = filter_var($_POST['status'], FILTER_VALIDATE_INT);

if ($id === false || $id <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID de l'association est invalide."]);
    exit;
}

if (!in_array($status, [0, 1])) {
    echo json_encode(["status" => "error", "message" => "Le statut doit être 0 ou 1."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    $siteTaxeManager = new SiteTaxe();
    $result = $siteTaxeManager->changerStatutTaxeSite($id, $status);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors du changement de statut de la taxe du site: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}