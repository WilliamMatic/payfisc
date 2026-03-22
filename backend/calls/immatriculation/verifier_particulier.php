<?php
/**
 * Script pour vérifier si un particulier existe par téléphone
 */

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Immatriculation.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Téléphone n'est plus obligatoire
$telephone = $_POST['telephone'] ?? '';

// Si le téléphone est vide ou juste un tiret, on retourne un succès sans vérification
if (empty($telephone) || trim($telephone) === '-') {
    echo json_encode([
        "status" => "success",
        "message" => "Téléphone non renseigné ou invalide, vérification ignorée",
        "data" => null
    ]);
    exit;
}

try {
    $immatriculationManager = new Immatriculation();
    $result = $immatriculationManager->verifierParticulierParTelephone(trim($telephone));
    
    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la vérification du particulier : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>