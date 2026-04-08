<?php
/**
 * Script de modification d'une province existante
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Province.php';

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

if (!isset($_POST['id'], $_POST['nom'], $_POST['code'])) {
    echo json_encode(["status" => "error", "message" => "L'ID, le nom et le code sont requis."]);
    exit;
}

// Nettoyage des données d'entrée
$id = (int)$_POST['id'];
$nom = trim(htmlspecialchars($_POST['nom'], ENT_QUOTES, 'UTF-8'));
$code = trim(htmlspecialchars($_POST['code'], ENT_QUOTES, 'UTF-8'));
$description = isset($_POST['description']) ? trim(htmlspecialchars($_POST['description'], ENT_QUOTES, 'UTF-8')) : '';

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Province
    $provinceManager = new Province();
    
    // Tentative de modification de la province
    $result = $provinceManager->modifierProvince($id, $nom, $code, $description);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la modification d'une province : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}