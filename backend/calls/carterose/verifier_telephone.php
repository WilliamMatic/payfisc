<?php
/**
 * Script de vérification d'un téléphone existant
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/CarteRose.php';

header('Content-Type: application/json');

// ======================================================================
// VALIDATION DE LA REQUÊTE HTTP
// ======================================================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES DONNÉES
// ======================================================================

if (!isset($_POST['telephone'])) {
    echo json_encode(["status" => "error", "message" => "Le téléphone est requis."]);
    exit;
}

// ======================================================================
// NETTOYAGE DES DONNÉES
// ======================================================================

$telephone = trim(htmlspecialchars($_POST['telephone'], ENT_QUOTES, 'UTF-8'));

// Si le téléphone est vide ou juste un tiret, retourner succès sans vérification
if (empty($telephone) || $telephone === '-') {
    echo json_encode([
        "status" => "success",
        "message" => "Téléphone vide ou '-', pas de vérification nécessaire",
        "data" => null
    ]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    $carteRoseManager = new CarteRose();
    
    // Vérifier si le numéro de téléphone existe déjà
    $particulierExistant = $carteRoseManager->verifierTelephoneExistant($telephone);
    
    if ($particulierExistant) {
        echo json_encode([
            "status" => "success",
            "message" => "Particulier trouvé",
            "data" => [
                "particulier" => [
                    "id" => $particulierExistant['id'],
                    "nom" => $particulierExistant['nom'],
                    "prenom" => $particulierExistant['prenom'],
                    "telephone" => $particulierExistant['telephone'],
                    "email" => $particulierExistant['email'] ?? '',
                    "adresse" => $particulierExistant['adresse'],
                    "ville" => $particulierExistant['ville'] ?? '',
                    "province" => $particulierExistant['province'] ?? '',
                    "nif" => $particulierExistant['nif'] ?? ''
                ]
            ]
        ]);
    } else {
        echo json_encode([
            "status" => "success",
            "message" => "Aucun particulier trouvé avec ce téléphone",
            "data" => null
        ]);
    }

} catch (Exception $e) {
    error_log("Erreur lors de la vérification du téléphone: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système lors de la vérification du téléphone."]);
}
?>