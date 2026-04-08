<?php
/**
 * Script de modification d'une entreprise existante
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Entreprise.php';

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

if (!isset($_POST['id']) || empty(trim($_POST['id']))) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "L'ID de l'entreprise est requis."]);
    exit;
}

$requiredFields = ['raison_sociale', 'nif', 'registre_commerce', 'telephone', 'email'];
foreach ($requiredFields as $field) {
    if (!isset($_POST[$field]) || empty(trim($_POST[$field]))) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Le champ $field est requis."]);
        exit;
    }
}

// Nettoyage des données d'entrée
$id = (int)trim(htmlspecialchars($_POST['id'], ENT_QUOTES, 'UTF-8'));
$data = [
    'raison_sociale' => trim(htmlspecialchars($_POST['raison_sociale'], ENT_QUOTES, 'UTF-8')),
    'forme_juridique' => isset($_POST['forme_juridique']) ? trim(htmlspecialchars($_POST['forme_juridique'], ENT_QUOTES, 'UTF-8')) : '',
    'nif' => trim(htmlspecialchars($_POST['nif'], ENT_QUOTES, 'UTF-8')),
    'registre_commerce' => trim(htmlspecialchars($_POST['registre_commerce'], ENT_QUOTES, 'UTF-8')),
    'date_creation' => isset($_POST['date_creation']) ? trim(htmlspecialchars($_POST['date_creation'], ENT_QUOTES, 'UTF-8')) : '',
    'adresse_siege' => isset($_POST['adresse_siege']) ? trim(htmlspecialchars($_POST['adresse_siege'], ENT_QUOTES, 'UTF-8')) : '',
    'telephone' => trim(htmlspecialchars($_POST['telephone'], ENT_QUOTES, 'UTF-8')),
    'email' => isset($_POST['email']) ? trim(htmlspecialchars($_POST['email'], ENT_QUOTES, 'UTF-8')) : '',
    'representant_legal' => isset($_POST['representant_legal']) ? trim(htmlspecialchars($_POST['representant_legal'], ENT_QUOTES, 'UTF-8')) : '',
    'reduction_type' => $_POST['reduction_type'] ?? null,
    'reduction_valeur' => isset($_POST['reduction_valeur']) ? (float)$_POST['reduction_valeur'] : 0
];

// Validation du format de l'email
if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "L'adresse email est invalide."]);
    exit;
}

// Validation de la réduction
if (!empty($data['reduction_type'])) {
    if (!in_array($data['reduction_type'], ['pourcentage', 'fixe'])) {
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
    // Instanciation de la classe Entreprise
    $entrepriseManager = new Entreprise();
    
    // Tentative de modification de l'entreprise
    $result = $entrepriseManager->modifierEntreprise($id, $data);
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la modification d'une entreprise : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>