<?php
/**
 * Script de récupération d'un numéro de plaque disponible (SANS changer le statut)
 * avec filtrage par province du site de l'utilisateur
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

// Vérifier que l'utilisateur_id est fourni
if (!isset($_POST['utilisateur_id']) || empty($_POST['utilisateur_id'])) {
    echo json_encode(["status" => "error", "message" => "L'identifiant utilisateur est obligatoire."]);
    exit;
}

try {
    $immatriculationManager = new Immatriculation();
    
    // Récupération du numéro de plaque disponible SANS changer le statut, avec filtrage par province
    $result = $immatriculationManager->getNumeroPlaqueDisponibleSansReservation($_POST['utilisateur_id']);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération du numéro de plaque : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>