<?php
/**
 * Script de recherche de puissances fiscales par type d'engin
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/PuissanceFiscale.php';

header('Content-Type: application/json');

// ======================================================================
// VALIDATION DE LA REQUÊTE HTTP
// ======================================================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES DONNÉES
// ======================================================================

if (!isset($_POST['type_engin_libelle']) || empty($_POST['type_engin_libelle'])) {
    echo json_encode(["status" => "error", "message" => "Le type d'engin est obligatoire."]);
    exit;
}

// ======================================================================
// NETTOYAGE DES DONNÉES
// ======================================================================

$typeEnginLibelle = trim(htmlspecialchars($_POST['type_engin_libelle'], ENT_QUOTES, 'UTF-8'));
$searchTerm = isset($_POST['search']) ? trim(htmlspecialchars($_POST['search'], ENT_QUOTES, 'UTF-8')) : '';

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    $puissanceFiscaleManager = new PuissanceFiscale();
    
    // Rechercher les puissances par type d'engin
    $resultat = $puissanceFiscaleManager->rechercherPuissancesParTypeLibelle($typeEnginLibelle, $searchTerm);
    
    echo json_encode($resultat);

} catch (Exception $e) {
    error_log("Erreur lors de la recherche des puissances fiscales: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système lors de la recherche des puissances fiscales."]);
}
?>