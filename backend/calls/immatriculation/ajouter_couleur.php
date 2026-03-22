<?php
/**
 * Script pour ajouter une nouvelle couleur
 */

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/EnginCouleur.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Champs obligatoires
$requiredFields = ['nom', 'code_hex'];
foreach ($requiredFields as $field) {
    if (!isset($_POST[$field]) || empty(trim($_POST[$field]))) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Le champ $field est obligatoire."]);
        exit;
    }
}

try {
    $couleurManager = new EnginCouleur();
    
    $nom = trim($_POST['nom']);
    $codeHex = trim($_POST['code_hex']);
    
    // Validation du code hexadécimal
    if (!preg_match('/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/', $codeHex)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Format de code couleur invalide. Format attendu: #FFFFFF ou #FFF"]);
        exit;
    }
    
    $result = $couleurManager->ajouterCouleur($nom, $codeHex);
    
    if ($result['status'] === 'success') {
        http_response_code(201);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de l'ajout de la couleur : " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>