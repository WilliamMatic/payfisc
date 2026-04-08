<?php
/**
 * Script de modification d'une série existante
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Plaque.php';

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

if (!isset($_POST['id'], $_POST['nom_serie'], $_POST['province_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "L'ID, le nom de la série et la province sont requis."]);
    exit;
}

// Nettoyage des données d'entrée
$id = filter_var($_POST['id'], FILTER_VALIDATE_INT);
$nomSerie = trim(htmlspecialchars($_POST['nom_serie'], ENT_QUOTES, 'UTF-8'));
$provinceId = filter_var($_POST['province_id'], FILTER_VALIDATE_INT);
$description = isset($_POST['description']) ? trim(htmlspecialchars($_POST['description'], ENT_QUOTES, 'UTF-8')) : null;

if ($id === false || $id <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID de la série est invalide."]);
    exit;
}

if ($provinceId === false || $provinceId <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID de la province est invalide."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Plaque
    $plaqueManager = new Plaque();
    
    // Tentative de modification de la série
    $result = $plaqueManager->modifierSerie($id, $nomSerie, $provinceId, $description);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la modification de la série : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}