<?php
/**
 * Script pour récupérer les provinces actives
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Province.php';
session_start();
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    echo json_encode(["success" => false, "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

try {
    $provinceManager = new Province();
    
    // Récupérer toutes les provinces
    $result = $provinceManager->listerProvinces();
    
    if ($result['status'] === 'success') {
        // Filtrer pour garder seulement les provinces actives
        $provincesActives = array_filter($result['data'], function($province) {
            return $province['actif'] == 1;
        });
        
        // Réindexer le tableau
        $provincesActives = array_values($provincesActives);
        
        echo json_encode([
            "success" => true,
            "data" => $provincesActives
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => $result['message']
        ]);
    }

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des provinces : " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Erreur système: Impossible de récupérer les provinces."]);
}
?>