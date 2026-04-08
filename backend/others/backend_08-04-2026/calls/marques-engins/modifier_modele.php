<?php
/**
 * Script de modification d'un modèle d'engin existant
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/MarqueEngin.php';

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

if (!isset($_POST['id'], $_POST['libelle'], $_POST['marque_engin_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Tous les champs obligatoires sont requis."]);
    exit;
}

// Nettoyage des données d'entrée
$id = filter_var($_POST['id'], FILTER_VALIDATE_INT);
$libelle = trim(htmlspecialchars($_POST['libelle'], ENT_QUOTES, 'UTF-8'));
$description = isset($_POST['description']) ? trim(htmlspecialchars($_POST['description'], ENT_QUOTES, 'UTF-8')) : '';
$marqueEnginId = filter_var($_POST['marque_engin_id'], FILTER_VALIDATE_INT);

if ($id === false || $id <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID du modèle est invalide."]);
    exit;
}

if ($marqueEnginId === false || $marqueEnginId <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID de la marque est invalide."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe MarqueEngin
    $marqueManager = new MarqueEngin();
    
    // Tentative de modification du modèle
    $result = $marqueManager->modifierModele($id, $libelle, $description, $marqueEnginId);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la modification du modèle : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}