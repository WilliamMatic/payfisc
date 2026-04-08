<?php
// calls/refactor/traiter_refactor.php

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/RefactorCarte.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée"]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// Validation des données requises
if (!isset($data['source'])) {
    echo json_encode(["status" => "error", "message" => "Source non spécifiée"]);
    exit;
}

if (!isset($data['site_code']) || empty($data['site_code'])) {
    echo json_encode(["status" => "error", "message" => "Le code du site est obligatoire"]);
    exit;
}

try {
    $refactorManager = new RefactorCarte();
    
    if ($data['source'] === 'externe') {
        // Créer un nouvel enregistrement avec site_code
        $result = $refactorManager->creerNouveauRefactor(
            $data['id_dgrk'],
            $data['donnees_engin'] ?? [],
            $data['donnees_particulier'] ?? [],
            $data['site_code'] // Passer le site_code
        );
    } else {
        // Mettre à jour l'existant
        if (!isset($data['id_dgrk']) || empty($data['id_dgrk'])) {
            echo json_encode(["status" => "error", "message" => "L'identifiant est obligatoire"]);
            exit;
        }
        
        $result = $refactorManager->mettreAJourDonneesRefactor(
            $data['id_dgrk'],
            $data['donnees_engin'] ?? [],
            $data['donnees_particulier'] ?? [],
            $data['site_code'] // Passer le site_code
        );
    }
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur traitement refactor: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système"]);
}
?>