<?php
/**
 * Script de soumission d'une commande de plaques pour client spécial
 * Version corrigée : gestion propre des transactions
 */

require '../headers/head.php';

// Gestion des requêtes OPTIONS pour CORS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/ClientSimple.php';

header('Content-Type: application/json');

// Vérification de la méthode HTTP
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Validation des champs obligatoires
$requiredFields = ['impot_id', 'utilisateur_id', 'site_id', 'nom', 'prenom', 'telephone', 'adresse', 'nombre_plaques'];
foreach ($requiredFields as $field) {
    if (!isset($_POST[$field]) || empty($_POST[$field])) {
        echo json_encode(["status" => "error", "message" => "Le champ $field est obligatoire."]);
        exit;
    }
}

// Validation des types de données
if (!is_numeric($_POST['nombre_plaques']) || (int)$_POST['nombre_plaques'] <= 0) {
    echo json_encode(["status" => "error", "message" => "Le nombre de plaques doit être un nombre positif."]);
    exit;
}

try {
    // Instanciation et traitement
    $clientSimpleManager = new ClientSimple();
    
    // Traitement de la commande DANS UNE SEULE TRANSACTION
    $result = $clientSimpleManager->traiterCommande($_POST);
    
    // Toujours HTTP 200 - le statut est dans le JSON (Nginx/ISPConfig intercepte les 400/500)
    http_response_code(200);
    echo json_encode($result);

} catch (PDOException $e) {
    // Erreur de base de données
    error_log("Erreur PDO lors du traitement de la commande : " . $e->getMessage());
    http_response_code(200);
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système de base de données. L'opération a été annulée."
    ]);
} catch (Exception $e) {
    // Erreur générale
    error_log("Erreur générale lors du traitement de la commande : " . $e->getMessage());
    http_response_code(200);
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système. L'opération a été annulée."
    ]);
}
?>