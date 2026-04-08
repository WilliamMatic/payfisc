<?php
/**
 * Script de modification d'un administrateur existant
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Admin.php';

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

if (!isset($_POST['id'], $_POST['nom_complet'], $_POST['email'], $_POST['role'])) {
    echo json_encode(["status" => "error", "message" => "Tous les champs obligatoires sont requis."]);
    exit;
}

// Nettoyage des données d'entrée
$id = filter_var($_POST['id'], FILTER_VALIDATE_INT);
$nomComplet = trim(htmlspecialchars($_POST['nom_complet'], ENT_QUOTES, 'UTF-8'));
$email = trim(htmlspecialchars($_POST['email'], ENT_QUOTES, 'UTF-8'));
$telephone = isset($_POST['telephone']) ? trim(htmlspecialchars($_POST['telephone'], ENT_QUOTES, 'UTF-8')) : '';
$role = trim(htmlspecialchars($_POST['role'], ENT_QUOTES, 'UTF-8'));
$provinceId = isset($_POST['province_id']) && !empty($_POST['province_id']) 
    ? filter_var($_POST['province_id'], FILTER_VALIDATE_INT) 
    : null;

if ($id === false || $id <= 0) {
    echo json_encode(["status" => "error", "message" => "L'ID de l'administrateur est invalide."]);
    exit;
}

// Validation du rôle
if (!in_array($role, ['super', 'partenaire'])) {
    echo json_encode(["status" => "error", "message" => "Le rôle doit être 'super' ou 'partenaire'."]);
    exit;
}

// Validation de l'email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "L'adresse email n'est pas valide."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Admin
    $adminManager = new Admin();
    
    // Tentative de modification de l'administrateur
    $result = $adminManager->modifierAdmin($id, $nomComplet, $email, $telephone, $role, $provinceId);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la modification de l'administrateur : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}