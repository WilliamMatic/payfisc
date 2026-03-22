<?php
/**
 * Script de création d'une nouvelle série avec province et plage numérique
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

if (!isset($_POST['nom_serie'], $_POST['province_id'], $_POST['debut_numeros'], $_POST['fin_numeros'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Tous les champs obligatoires sont requis."]);
    exit;
}

// Nettoyage des données d'entrée
$nomSerie = trim(htmlspecialchars($_POST['nom_serie'], ENT_QUOTES, 'UTF-8'));
$provinceId = filter_var($_POST['province_id'], FILTER_VALIDATE_INT);
$debutNumeros = filter_var($_POST['debut_numeros'], FILTER_VALIDATE_INT);
$finNumeros = filter_var($_POST['fin_numeros'], FILTER_VALIDATE_INT);
$description = isset($_POST['description']) ? trim(htmlspecialchars($_POST['description'], ENT_QUOTES, 'UTF-8')) : null;

// Validation des données
if ($provinceId === false || $provinceId <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID de la province est invalide."]);
    exit;
}

if ($debutNumeros === false || $finNumeros === false || $debutNumeros < 1 || $finNumeros > 999 || $debutNumeros > $finNumeros) {
    echo json_encode(["status" => "error", "message" => "La plage numérique est invalide. Doit être entre 1 et 999 avec début <= fin."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Plaque
    $plaqueManager = new Plaque();
    
    // Tentative d'ajout de la nouvelle série
    $result = $plaqueManager->ajouterSerie($nomSerie, $provinceId, $debutNumeros, $finNumeros, $description);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de l'ajout de la série : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}