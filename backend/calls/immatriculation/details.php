<?php
/**
 * Endpoint pour les détails des immatriculations
 */

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/StatistiquesImmatriculation.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

try {
    $statistiquesManager = new StatistiquesImmatriculation();
    
    // Récupérer les filtres
    $filtres = [];
    
    if (isset($_POST['date_debut']) && !empty($_POST['date_debut'])) {
        $filtres['date_debut'] = $_POST['date_debut'];
    }
    
    if (isset($_POST['date_fin']) && !empty($_POST['date_fin'])) {
        $filtres['date_fin'] = $_POST['date_fin'];
    }
    
    if (isset($_POST['site_id']) && !empty($_POST['site_id'])) {
        $filtres['site_id'] = (int)$_POST['site_id'];
    }
    
    if (isset($_POST['type_engin']) && !empty($_POST['type_engin'])) {
        $filtres['type_engin'] = $_POST['type_engin'];
    }
    
    if (isset($_POST['mode_paiement']) && !empty($_POST['mode_paiement'])) {
        $filtres['mode_paiement'] = $_POST['mode_paiement'];
    }
    
    if (isset($_POST['utilisateur_id']) && !empty($_POST['utilisateur_id'])) {
        $filtres['utilisateur_id'] = (int)$_POST['utilisateur_id'];
    }
    
    // Pagination
    if (isset($_POST['limit']) && !empty($_POST['limit'])) {
        $filtres['limit'] = (int)$_POST['limit'];
    }
    
    if (isset($_POST['offset']) && !empty($_POST['offset'])) {
        $filtres['offset'] = (int)$_POST['offset'];
    }
    
    // Tri
    if (isset($_POST['sort_by']) && !empty($_POST['sort_by'])) {
        $filtres['sort_by'] = $_POST['sort_by'];
    }
    
    if (isset($_POST['sort_order']) && !empty($_POST['sort_order'])) {
        $filtres['sort_order'] = $_POST['sort_order'];
    }
    
    $result = $statistiquesManager->getDetailsImmatriculation($filtres);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des détails: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>