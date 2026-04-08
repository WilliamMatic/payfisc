<?php
/**
 * API pour mettre à jour le statut d'une carte
 */

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/CarteReprintManager.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Validation
if (!isset($_POST['carte_id']) || empty($_POST['carte_id'])) {
    echo json_encode(["status" => "error", "message" => "L'ID de la carte est requis."]);
    exit;
}

$carteId = (int)$_POST['carte_id'];

try {
    $manager = new CarteReprintManager();
    $success = $manager->mettreAJourstatusCarte($carteId);
    
    if ($success) {
        echo json_encode([
            "status" => "success", 
            "message" => "Statut de la carte mis à jour avec succès."
        ]);
    } else {
        echo json_encode([
            "status" => "error", 
            "message" => "Carte non trouvée ou déjà mise à jour."
        ]);
    }

} catch (Exception $e) {
    error_log("Erreur lors de la mise à jour du statut: " . $e->getMessage());
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système: " . $e->getMessage()
    ]);
}
?>