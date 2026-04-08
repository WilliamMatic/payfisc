<?php
/**
 * Script de modification d'un bénéficiaire
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
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Validation des données du formulaire
if (!isset($_POST['id'], $_POST['nom'], $_POST['telephone'], $_POST['numero_compte'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Tous les champs obligatoires sont requis."]);
    exit;
}

// Nettoyage des données d'entrée
$id = (int)$_POST['id'];
$nom = trim(htmlspecialchars($_POST['nom'], ENT_QUOTES, 'UTF-8'));
$telephone = trim(htmlspecialchars($_POST['telephone'], ENT_QUOTES, 'UTF-8'));
$numero_compte = trim(htmlspecialchars($_POST['numero_compte'], ENT_QUOTES, 'UTF-8'));

// Traitement principal
try {
    // Instanciation de la classe Beneficiaire
    $beneficiaireManager = new Beneficiaire();

    // Tentative de modification du bénéficiaire
    $result = $beneficiaireManager->modifierBeneficiaire($id, $nom, $telephone, $numero_compte);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la modification d'un bénéficiaire : " . $e->getMessage());

    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}