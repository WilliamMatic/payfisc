<?php
/**
 * Script de modification d'une taxe associée à un site
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

if (!isset($_POST['id'], $_POST['prix'], $_POST['status'])) {
    echo json_encode(["status" => "error", "message" => "Tous les champs sont requis."]);
    exit;
}

$id = filter_var($_POST['id'], FILTER_VALIDATE_INT);
$prix = filter_var($_POST['prix'], FILTER_VALIDATE_FLOAT);
$status = filter_var($_POST['status'], FILTER_VALIDATE_INT);

if ($id === false || $id <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID de l'association est invalide."]);
    exit;
}

if ($prix === false || $prix < 0) {
    echo json_encode(["status" => "error", "message" => "Le prix doit être un nombre positif."]);
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
    $result = $siteTaxeManager->modifierTaxeSite($id, $prix, $status);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la modification de la taxe du site: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}