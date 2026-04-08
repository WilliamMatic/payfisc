<?php
/**
 * Script de modification d'un particulier existant
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
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES DONNÉES DU FORMULAIRE - CORRIGÉ : SEULEMENT NOM, PRÉNOM, TÉLÉPHONE, RUE
// ======================================================================

if (!isset($_POST['id']) || empty(trim($_POST['id']))) {
    echo json_encode(["status" => "error", "message" => "L'ID du particulier est requis."]);
    exit;
}

// CORRECTION : Seulement nom, prénom, téléphone, rue obligatoires
$requiredFields = ['nom', 'prenom', 'telephone', 'rue'];
foreach ($requiredFields as $field) {
    if (!isset($_POST[$field]) || empty(trim($_POST[$field]))) {
        echo json_encode(["status" => "error", "message" => "Le champ $field est requis."]);
        exit;
    }
}

// Nettoyage des données d'entrée - CORRIGÉ : gestion des champs vides
$id = (int)$_POST['id'];
$data = [
    'nom' => trim(htmlspecialchars($_POST['nom'], ENT_QUOTES, 'UTF-8')),
    'prenom' => trim(htmlspecialchars($_POST['prenom'], ENT_QUOTES, 'UTF-8')),
    'date_naissance' => isset($_POST['date_naissance']) ? trim(htmlspecialchars($_POST['date_naissance'], ENT_QUOTES, 'UTF-8')) : '',
    'lieu_naissance' => isset($_POST['lieu_naissance']) ? trim(htmlspecialchars($_POST['lieu_naissance'], ENT_QUOTES, 'UTF-8')) : '',
    'sexe' => isset($_POST['sexe']) ? trim(htmlspecialchars($_POST['sexe'], ENT_QUOTES, 'UTF-8')) : '',
    'rue' => trim(htmlspecialchars($_POST['rue'], ENT_QUOTES, 'UTF-8')), // OBLIGATOIRE
    'ville' => isset($_POST['ville']) ? trim(htmlspecialchars($_POST['ville'], ENT_QUOTES, 'UTF-8')) : '',
    'code_postal' => isset($_POST['code_postal']) ? trim(htmlspecialchars($_POST['code_postal'], ENT_QUOTES, 'UTF-8')) : '',
    'province' => isset($_POST['province']) ? trim(htmlspecialchars($_POST['province'], ENT_QUOTES, 'UTF-8')) : '',
    'id_national' => isset($_POST['id_national']) ? trim(htmlspecialchars($_POST['id_national'], ENT_QUOTES, 'UTF-8')) : '',
    'telephone' => trim(htmlspecialchars($_POST['telephone'], ENT_QUOTES, 'UTF-8')), // OBLIGATOIRE
    'email' => isset($_POST['email']) ? trim(htmlspecialchars($_POST['email'], ENT_QUOTES, 'UTF-8')) : '',
    'nif' => isset($_POST['nif']) ? trim(htmlspecialchars($_POST['nif'], ENT_QUOTES, 'UTF-8')) : '', // OPTIONNEL
    'situation_familiale' => isset($_POST['situation_familiale']) ? trim(htmlspecialchars($_POST['situation_familiale'], ENT_QUOTES, 'UTF-8')) : '',
    'dependants' => isset($_POST['dependants']) ? (int)$_POST['dependants'] : 0,
    'reduction_type' => $_POST['reduction_type'] ?? null,
    'reduction_valeur' => isset($_POST['reduction_valeur']) ? (float)$_POST['reduction_valeur'] : 0
];

// CORRECTION : Validation du format de l'email seulement si fourni
if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "L'adresse email est invalide."]);
    exit;
}

// CORRECTION : Validation de la réduction seulement si fournie
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
    // Instanciation de la classe Particulier
    $particulierManager = new Particulier();

    // Tentative de modification du particulier
    $result = $particulierManager->modifierParticulier($id, $data);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la modification d'un particulier : " . $e->getMessage());

    // Message générique pour l'utilisateur
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>