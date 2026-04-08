<?php
/**
 * Script de recherche de modèles par marque et terme de recherche
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

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
// VALIDATION DES DONNÉES
// ======================================================================

if (!isset($_POST['marque_id']) || empty($_POST['marque_id'])) {
    echo json_encode(["status" => "error", "message" => "L'ID de la marque est obligatoire."]);
    exit;
}

// ======================================================================
// NETTOYAGE DES DONNÉES
// ======================================================================

$marqueId = (int)$_POST['marque_id'];
$searchTerm = isset($_POST['search']) ? trim(htmlspecialchars($_POST['search'], ENT_QUOTES, 'UTF-8')) : '';

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    $marqueEnginManager = new MarqueEngin();
    
    // Rechercher les modèles
    $resultat = $marqueEnginManager->rechercherModeles($marqueId, $searchTerm);
    
    echo json_encode($resultat);

} catch (Exception $e) {
    error_log("Erreur lors de la recherche des modèles: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système lors de la recherche des modèles."]);
}
?>