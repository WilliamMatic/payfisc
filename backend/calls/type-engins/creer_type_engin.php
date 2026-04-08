<?php
/**
 * Script de création d'un nouveau type d'engin
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/TypeEngin.php';

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

if (!isset($_POST['libelle'])) {
    echo json_encode(["status" => "error", "message" => "Le libellé est requis."]);
    exit;
}

// Nettoyage des données d'entrée
$libelle = trim(htmlspecialchars($_POST['libelle'], ENT_QUOTES, 'UTF-8'));
$description = isset($_POST['description']) ? trim(htmlspecialchars($_POST['description'], ENT_QUOTES, 'UTF-8')) : '';

// Validation de la longueur du libellé
if (strlen($libelle) > 100) {
    echo json_encode(["status" => "error", "message" => "Le libellé ne doit pas dépasser 100 caractères."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe TypeEngin
    $typeEnginManager = new TypeEngin();
    
    // Tentative d'ajout du nouveau type d'engin
    $result = $typeEnginManager->ajouterTypeEngin($libelle, $description);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de l'ajout d'un type d'engin : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}