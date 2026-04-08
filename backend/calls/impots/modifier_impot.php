<?php
/**
 * Script de modification d'un impôt existant
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Impot.php';

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

if (!isset($_POST['id'], $_POST['nom'], $_POST['description'], $_POST['jsonData'])) {
    echo json_encode(["status" => "error", "message" => "Tous les champs sont requis."]);
    exit;
}

// Nettoyage des données d'entrée
$id = (int)$_POST['id'];
$nom = trim(htmlspecialchars($_POST['nom'], ENT_QUOTES, 'UTF-8'));
$description = trim(htmlspecialchars($_POST['description'], ENT_QUOTES, 'UTF-8'));
$jsonData = $_POST['jsonData'];

// Validation des champs
if (empty($nom)) {
    echo json_encode(["status" => "error", "message" => "Le nom est obligatoire."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Impot
    $impotManager = new Impot();
    
    // Tentative de modification de l'impôt
    $result = $impotManager->modifierImpot($id, $nom, $description, $jsonData);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la modification de l'impôt : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}