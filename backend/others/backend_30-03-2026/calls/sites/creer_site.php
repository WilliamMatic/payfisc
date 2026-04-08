<?php
/**
 * Script de création d'un nouveau site
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
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES DONNÉES DU FORMULAIRE
// ======================================================================

if (!isset($_POST['nom'], $_POST['code'], $_POST['province_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le nom, le code et la province sont requis."]);
    exit;
}

// Nettoyage des données d'entrée
$nom = trim(htmlspecialchars($_POST['nom'], ENT_QUOTES, 'UTF-8'));
$code = trim(htmlspecialchars($_POST['code'], ENT_QUOTES, 'UTF-8'));
$description = isset($_POST['description']) ? trim(htmlspecialchars($_POST['description'], ENT_QUOTES, 'UTF-8')) : '';
$formule = isset($_POST['formule']) ? trim(htmlspecialchars($_POST['formule'], ENT_QUOTES, 'UTF-8')) : '';
$provinceId = filter_var($_POST['province_id'], FILTER_VALIDATE_INT);

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
    
    // Tentative d'ajout du nouveau site
    $result = $siteManager->ajouterSite($nom, $code, $description, $formule, $provinceId);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de l'ajout d'un site : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}