<?php
/**
 * Script de création d'une nouvelle marque d'engin
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
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES DONNÉES DU FORMULAIRE
// ======================================================================

if (!isset($_POST['libelle'], $_POST['type_engin_id'])) {
    echo json_encode(["status" => "error", "message" => "Le libellé et le type d'engin sont requis."]);
    exit;
}

// Nettoyage des données d'entrée
$libelle = trim(htmlspecialchars($_POST['libelle'], ENT_QUOTES, 'UTF-8'));
$description = isset($_POST['description']) ? trim(htmlspecialchars($_POST['description'], ENT_QUOTES, 'UTF-8')) : '';
$typeEnginId = filter_var($_POST['type_engin_id'], FILTER_VALIDATE_INT);

if ($typeEnginId === false || $typeEnginId <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID du type d'engin est invalide."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe MarqueEngin
    $marqueManager = new MarqueEngin();
    
    // Tentative d'ajout de la nouvelle marque
    $result = $marqueManager->ajouterMarque($libelle, $description, $typeEnginId);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de l'ajout d'une marque : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}