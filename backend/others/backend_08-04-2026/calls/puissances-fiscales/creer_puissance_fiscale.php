<?php
/**
 * Script de création d'une nouvelle puissance fiscale
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/PuissanceFiscale.php';

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

if (!isset($_POST['libelle'], $_POST['valeur'], $_POST['type_engin_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le libellé, la valeur et le type d'engin sont requis."]);
    exit;
}

// Nettoyage des données d'entrée
$libelle = trim(htmlspecialchars($_POST['libelle'], ENT_QUOTES, 'UTF-8'));
$valeur = filter_var($_POST['valeur'], FILTER_VALIDATE_FLOAT);
$description = isset($_POST['description']) ? trim(htmlspecialchars($_POST['description'], ENT_QUOTES, 'UTF-8')) : '';
$typeEnginId = filter_var($_POST['type_engin_id'], FILTER_VALIDATE_INT);

if ($valeur === false || $valeur <= 0) {
    echo json_encode(["status" => "error", "message" => "La valeur doit être un nombre positif."]);
    exit;
}

if ($typeEnginId === false || $typeEnginId <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID du type d'engin est invalide."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe PuissanceFiscale
    $puissanceManager = new PuissanceFiscale();
    
    // Tentative d'ajout de la nouvelle puissance fiscale
    $result = $puissanceManager->ajouterPuissanceFiscale($libelle, $valeur, $typeEnginId, $description);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de l'ajout d'une puissance fiscale : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}