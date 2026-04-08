<?php
// backend/calls/achats-grossistes/statistiques.php

require '../headers/head.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../class/GrossisteAchat.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

try {
    $dateDebut = isset($_GET['date_debut']) ? trim($_GET['date_debut']) : date('Y-m-d');
    $dateFin = isset($_GET['date_fin']) ? trim($_GET['date_fin']) : date('Y-m-d');

    $achatManager = new GrossisteAchat();
    $result = $achatManager->getStatistiques($dateDebut, $dateFin);
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des statistiques : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>