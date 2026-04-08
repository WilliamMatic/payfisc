<?php
/**
 * Script de modification d'un site existant
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Site.php';

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

if (!isset($_POST['id'], $_POST['nom'], $_POST['code'], $_POST['province_id'])) {
    echo json_encode(["status" => "error", "message" => "Tous les champs obligatoires sont requis."]);
    exit;
}

// Nettoyage des données d'entrée
$id = filter_var($_POST['id'], FILTER_VALIDATE_INT);
$nom = trim(htmlspecialchars($_POST['nom'], ENT_QUOTES, 'UTF-8'));
$code = trim(htmlspecialchars($_POST['code'], ENT_QUOTES, 'UTF-8'));
$description = isset($_POST['description']) ? trim(htmlspecialchars($_POST['description'], ENT_QUOTES, 'UTF-8')) : '';
$formule = isset($_POST['formule']) ? trim(htmlspecialchars($_POST['formule'], ENT_QUOTES, 'UTF-8')) : '';
$templateCarteActuel = isset($_POST['template_carte_actuel']) ? filter_var($_POST['template_carte_actuel'], FILTER_VALIDATE_INT) : 0;
$provinceId = filter_var($_POST['province_id'], FILTER_VALIDATE_INT);

if ($id === false || $id <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID du site est invalide."]);
    exit;
}

if ($provinceId === false || $provinceId <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID de province est invalide."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Site
    $siteManager = new Site();
    
    // Tentative de modification du site
    $result = $siteManager->modifierSite($id, $nom, $code, $description, $formule, $provinceId, $templateCarteActuel);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la modification du site : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}