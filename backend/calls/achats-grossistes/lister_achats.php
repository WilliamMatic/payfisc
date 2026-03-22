<?php
// backend/calls/achats-grossistes/lister_achats.php

/**
 * Script pour lister les achats des grossistes avec filtres
 */

// Autoriser les requêtes cross-origin
require '../headers/head.php';

// Répondre directement aux requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../class/GrossisteAchat.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

try {
    // Récupérer les paramètres de filtrage
    $dateDebut = isset($_GET['date_debut']) ? trim($_GET['date_debut']) : date('Y-m-d');
    $dateFin = isset($_GET['date_fin']) ? trim($_GET['date_fin']) : date('Y-m-d');
    $recherche = isset($_GET['recherche']) ? trim($_GET['recherche']) : null;
    $telephone = isset($_GET['telephone']) ? trim($_GET['telephone']) : null;
    $plaque = isset($_GET['plaque']) ? trim($_GET['plaque']) : null;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;

    // Validation des paramètres
    if ($dateDebut && !DateTime::createFromFormat('Y-m-d', $dateDebut)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Format de date début invalide (YYYY-MM-DD requis)."]);
        exit;
    }

    if ($dateFin && !DateTime::createFromFormat('Y-m-d', $dateFin)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Format de date fin invalide (YYYY-MM-DD requis)."]);
        exit;
    }

    // Par défaut, si aucune date n'est spécifiée, afficher les achats du jour
    if (!$dateDebut && !$dateFin && !$recherche && !$telephone && !$plaque) {
        $dateDebut = date('Y-m-d');
        $dateFin = date('Y-m-d');
    }

    $achatManager = new GrossisteAchat();
    $result = $achatManager->listerAchats(
        $dateDebut,
        $dateFin,
        $recherche,
        $telephone,
        $plaque,
        $page,
        $limit
    );
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors du listing des achats grossistes : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>