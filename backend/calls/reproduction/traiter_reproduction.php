<?php
/**
 * Script de traitement d'une reproduction de carte (locale OU externe)
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée
require_once __DIR__ . '/../../class/ReproductionCarte.php';

header('Content-Type: application/json');

// Validation de la requête
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Validation des données obligatoires
$requiredFields = ['impot_id', 'utilisateur_id', 'site_id', 'numero_plaque', 'source', 'site_code'];
foreach ($requiredFields as $field) {
    if (!isset($_POST[$field]) || empty($_POST[$field])) {
        echo json_encode(["status" => "error", "message" => "Le champ $field est obligatoire."]);
        exit;
    }
}

try {
    // Instanciation
    $reproductionManager = new ReproductionCarte();
    
    // Traitement de la reproduction
    $result = $reproductionManager->traiterReproductionCarte($_POST);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors du traitement de la reproduction : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>