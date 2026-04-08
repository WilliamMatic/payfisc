<?php
/**
 * Script de soumission d'une demande d'immatriculation
 */

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Immatriculation.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Champs obligatoires mis à jour (téléphone retiré des champs obligatoires)
$requiredFields = ['impot_id', 'utilisateur_id', 'site_id', 'nom', 'prenom', 'adresse', 'type_engin', 'marque'];
foreach ($requiredFields as $field) {
    if (!isset($_POST[$field]) || empty($_POST[$field])) {
        echo json_encode(["status" => "error", "message" => "Le champ $field est obligatoire."]);
        exit;
    }
}

// Normaliser le téléphone : si vide ou non défini, utiliser '-'
$_POST['telephone'] = isset($_POST['telephone']) && trim($_POST['telephone']) !== '' 
    ? trim($_POST['telephone']) 
    : '-';

try {
    $immatriculationManager = new Immatriculation();
    
    // Inclure le serie_item_id s'il est fourni
    if (isset($_POST['serie_item_id']) && !empty($_POST['serie_item_id'])) {
        $_POST['serie_item_id'] = intval($_POST['serie_item_id']);
    }
    
    $result = $immatriculationManager->traiterImmatriculation($_POST);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors du traitement de l'immatriculation : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>