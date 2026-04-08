<?php
/**
 * Script d'enregistrement d'une déclaration
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_secure' => true,
        'cookie_httponly' => true,
        'use_strict_mode' => true
    ]);
}

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Paiement.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Récupérer les données POST
$data = json_decode(file_get_contents("php://input"), true);

// Vérifier que l'utilisateur a bien passé l'étape 1 (NIF vérifié)
if (!isset($_SESSION['nif']) || !isset($_SESSION['contribuable_type'])) {
    echo json_encode(["status" => "error", "message" => "Veuillez d'abord vérifier votre NIF."]);
    exit;
}

// Valider les données requises
$required_fields = ['id_impot', 'montant', 'donnees_formulaire'];
foreach ($required_fields as $field) {
    if (!isset($data[$field])) {
        echo json_encode(["status" => "error", "message" => "Le paramètre $field est requis."]);
        exit;
    }
}

try {
    $declarationData = [
        'nif' => $_SESSION['nif'],
        'type_contribuable' => $_SESSION['contribuable_type'],
        'id_impot' => $data['id_impot'],
        'montant' => $data['montant'],
        'donnees_formulaire' => $data['donnees_formulaire'],
        'utilisateur_id' => $data['utilisateur_id'] ?? null,
        'site_code' => $data['site_code'] ?? null
    ];

    $paiementManager = new Paiement();
    $result = $paiementManager->enregistrerDeclaration($declarationData);

    // Stocker l'ID de déclaration en session pour le paiement
    if ($result['status'] === 'success') {
        $_SESSION['id_declaration'] = $result['data']['id_declaration'];
        $_SESSION['reference_declaration'] = $result['data']['reference'];
        $_SESSION['montant'] = $result['data']['montant'];
    }

    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de l'enregistrement de la déclaration : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: Impossible d'enregistrer la déclaration."]);
}