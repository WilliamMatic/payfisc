<?php
/**
 * Script de création d'un nouveau particulier
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Particulier.php';

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
// VALIDATION DES DONNÉES DU FORMULAIRE - CORRIGÉ : SEULEMENT NOM, PRÉNOM, TÉLÉPHONE, RUE
// ======================================================================

$requiredFields = ['nom', 'prenom', 'telephone', 'rue'];
foreach ($requiredFields as $field) {
    if (!isset($_POST[$field]) || empty(trim($_POST[$field]))) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Le champ $field est requis."]);
        exit;
    }
}

// Nettoyage des données d'entrée
$data = [
    'nom' => trim(htmlspecialchars($_POST['nom'], ENT_QUOTES, 'UTF-8')),
    'prenom' => trim(htmlspecialchars($_POST['prenom'], ENT_QUOTES, 'UTF-8')),
    'date_naissance' => $_POST['date_naissance'] ?? '',
    'lieu_naissance' => $_POST['lieu_naissance'] ?? '',
    'sexe' => $_POST['sexe'] ?? '',
    'rue' => trim(htmlspecialchars($_POST['rue'], ENT_QUOTES, 'UTF-8')),
    'ville' => $_POST['ville'] ?? '',
    'code_postal' => $_POST['code_postal'] ?? '',
    'province' => $_POST['province'] ?? '',
    'id_national' => $_POST['id_national'] ?? '',
    'telephone' => trim(htmlspecialchars($_POST['telephone'], ENT_QUOTES, 'UTF-8')),
    'email' => $_POST['email'] ?? '',
    'nif' => $_POST['nif'] ?? '', // OPTIONNEL MAINTENANT
    'situation_familiale' => $_POST['situation_familiale'] ?? '',
    'dependants' => isset($_POST['dependants']) ? (int)$_POST['dependants'] : 0,
    'reduction_type' => $_POST['reduction_type'] ?? null,
    'reduction_valeur' => isset($_POST['reduction_valeur']) ? (float)$_POST['reduction_valeur'] : 0,
    'site_code' => isset($_POST['site']) ? trim(htmlspecialchars($_POST['site'], ENT_QUOTES, 'UTF-8')) : null,
    'utilisateur' => isset($_POST['utilisateur']) ? (int)$_POST['utilisateur'] : null,
];

// Validation de l'email
if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "L'adresse email est invalide."]);
    exit;
}

// Validation de la réduction
if (!empty($data['reduction_type'])) {
    if (!in_array($data['reduction_type'], ['pourcentage', 'montant_fixe'])) {
        echo json_encode(["status" => "error", "message" => "Type de réduction invalide."]);
        exit;
    }
    
    if ($data['reduction_valeur'] <= 0) {
        echo json_encode(["status" => "error", "message" => "La valeur de réduction doit être supérieure à 0."]);
        exit;
    }
    
    if ($data['reduction_type'] === 'pourcentage' && $data['reduction_valeur'] > 100) {
        echo json_encode(["status" => "error", "message" => "Le pourcentage de réduction ne peut pas dépasser 100%."]);
        exit;
    }
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    $particulierManager = new Particulier();

    // Transmission complète des données (y compris site et utilisateur)
    $result = $particulierManager->ajouterParticulier($data);

    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de l'ajout d'un particulier : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>