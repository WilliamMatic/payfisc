<?php
// backend/calls/achats-grossistes/exporter.php

require '../headers/head.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../class/GrossisteAchat.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

try {
    $filtres = [
        'date_debut' => isset($_POST['date_debut']) ? trim($_POST['date_debut']) : null,
        'date_fin' => isset($_POST['date_fin']) ? trim($_POST['date_fin']) : null,
        'recherche' => isset($_POST['recherche']) ? trim($_POST['recherche']) : null,
        'telephone' => isset($_POST['telephone']) ? trim($_POST['telephone']) : null,
        'plaque' => isset($_POST['plaque']) ? trim($_POST['plaque']) : null,
    ];
    
    $format = isset($_POST['format']) && $_POST['format'] === 'excel' ? 'excel' : 'csv';

    $achatManager = new GrossisteAchat();
    
    if ($format === 'excel') {
        // Pour Excel, vous pourriez utiliser une bibliothèque comme PhpSpreadsheet
        // Ici, on retourne CSV par défaut
        $result = $achatManager->exporterCSV($filtres);
    } else {
        $result = $achatManager->exporterCSV($filtres);
    }
    
    if ($result['status'] === 'success') {
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="' . $result['filename'] . '"');
        echo $result['data'];
        exit;
    } else {
        echo json_encode($result);
    }

} catch (Exception $e) {
    error_log("Erreur lors de l'export des achats : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>