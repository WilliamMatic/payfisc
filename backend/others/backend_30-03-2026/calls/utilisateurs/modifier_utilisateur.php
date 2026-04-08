<?php
/**
 * Script de modification d'un utilisateur
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Utilisateur.php';

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

if (!isset($_POST['id'], $_POST['nom_complet'], $_POST['telephone'], $_POST['site_affecte_id'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Tous les champs obligatoires sont requis."]);
    exit;
}

// Nettoyage des données d'entrée
$id = (int)$_POST['id'];
$nomComplet = trim(htmlspecialchars($_POST['nom_complet'], ENT_QUOTES, 'UTF-8'));
$telephone = trim(htmlspecialchars($_POST['telephone'], ENT_QUOTES, 'UTF-8'));
$adresse = isset($_POST['adresse']) ? trim(htmlspecialchars($_POST['adresse'], ENT_QUOTES, 'UTF-8')) : '';
$siteAffecteId = (int)$_POST['site_affecte_id'];

// Récupération et validation des privilèges
$privileges = [];
if (isset($_POST['privileges'])) {
    $privilegesData = json_decode($_POST['privileges'], true);
    if (json_last_error() === JSON_ERROR_NONE) {
        $privileges = $privilegesData;
    }
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Utilisateur
    $utilisateurManager = new Utilisateur();
    
    // Tentative de modification de l'utilisateur
    $result = $utilisateurManager->modifierUtilisateur($id, $nomComplet, $telephone, $adresse, $siteAffecteId, $privileges);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la modification d'un utilisateur : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}