<?php
/**
 * Script de changement de statut d'un bénéficiaire
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Beneficiaire.php';

header('Content-Type: application/json');

// Validation de la requête HTTP
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Validation des données du formulaire
if (!isset($_POST['id'], $_POST['actif'])) {
    echo json_encode(["status" => "error", "message" => "ID et statut du bénéficiaire requis."]);
    exit;
}

// Nettoyage des données d'entrée
$id = (int)$_POST['id'];
$actif = filter_var($_POST['actif'], FILTER_VALIDATE_BOOLEAN);

// Traitement principal
try {
    // Instanciation de la classe Beneficiaire
    $beneficiaireManager = new Beneficiaire();

    // Tentative de changement de statut du bénéficiaire
    $result = $beneficiaireManager->changerStatutBeneficiaire($id, $actif);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors du changement de statut d'un bénéficiaire : " . $e->getMessage());

    // Message générique pour l'utilisateur
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}