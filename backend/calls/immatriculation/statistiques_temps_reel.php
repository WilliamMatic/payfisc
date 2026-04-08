<?php
/**
 * Endpoint pour les statistiques temps réel
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

if (!isset($_POST['utilisateur_id']) || empty($_POST['utilisateur_id'])) {
    echo json_encode(["status" => "error", "message" => "L'ID utilisateur est requis."]);
    exit;
}

try {
    $statistiquesManager = new StatistiquesImmatriculation();
    
    $utilisateurId = (int)$_POST['utilisateur_id'];
    
    $result = $statistiquesManager->getStatistiquesTempsReel($utilisateurId);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des statistiques temps réel: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>