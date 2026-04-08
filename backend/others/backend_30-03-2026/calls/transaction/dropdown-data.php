<?php
/**
 * Script pour récupérer les données des dropdowns depuis la base
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Connexion.php';
require_once __DIR__ . '/../../class/TypeEngin.php';
require_once __DIR__ . '/../../class/MarqueEngin.php';
require_once __DIR__ . '/../../class/Energie.php';
require_once __DIR__ . '/../../class/EnginCouleur.php';
require_once __DIR__ . '/../../class/PuissanceFiscale.php';
require_once __DIR__ . '/../../class/UsageEngin.php';

header('Content-Type: application/json');

// ======================================================================
// VALIDATION DE LA REQUÊTE HTTP
// ======================================================================

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Initialiser les classes
    $typeEnginManager = new TypeEngin();
    $marqueManager = new MarqueEngin();
    $energieManager = new Energie();
    $couleurManager = new EnginCouleur();
    $puissanceManager = new PuissanceFiscale();
    $usageManager = new UsageEngin();
    
    // Récupérer les types d'engins actifs
    $resultTypes = $typeEnginManager->listerTypeEnginsActifs();
    $typesEngin = $resultTypes['status'] === 'success' ? array_column($resultTypes['data'], 'libelle') : [];
    
    // Récupérer les énergies actives
    $resultEnergies = $energieManager->listerEnergiesActives();
    $energies = $resultEnergies['status'] === 'success' ? array_column($resultEnergies['data'], 'nom') : [];
    
    // Récupérer les couleurs actives
    $resultCouleurs = $couleurManager->listerCouleursActives();
    $couleurs = $resultCouleurs['status'] === 'success' ? array_column($resultCouleurs['data'], 'nom') : [];
    
    // Récupérer les usages actifs
    $resultUsages = $usageManager->listerUsagesActifs();
    $usages = $resultUsages['status'] === 'success' ? array_column($resultUsages['data'], 'libelle') : [];
    
    // Pour les marques et puissances, on récupère d'abord les types disponibles
    // puis on prendra les premières marques/puissances pour l'initialisation
    $marques = [];
    $puissances = [];
    
    if (!empty($typesEngin)) {
        // Prendre le premier type pour l'initialisation des marques
        $firstType = $typesEngin[0];
        
        // Récupérer les marques pour ce type
        $typeInfo = $typeEnginManager->typeEnginExiste($firstType);
        if ($typeInfo) {
            $resultMarques = $marqueManager->listerMarquesActivesParType($typeInfo['id']);
            if ($resultMarques['status'] === 'success') {
                $marques = array_column($resultMarques['data'], 'libelle');
            }
        }
        
        // Récupérer les puissances pour ce type
        $resultPuissances = $puissanceManager->listerPuissancesFiscalesActivesParType($typeInfo['id']);
        if ($resultPuissances['status'] === 'success') {
            $puissances = array_column($resultPuissances['data'], 'libelle');
        }
    }
    
    echo json_encode([
        "status" => "success",
        "data" => [
            "typesEngin" => $typesEngin,
            "marques" => $marques,
            "energies" => $energies,
            "couleurs" => $couleurs,
            "puissances" => $puissances,
            "usages" => $usages
        ]
    ]);

} catch (Exception $e) {
    error_log("Erreur lors de la récupération des données dropdown: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système: Impossible de récupérer les données."
    ]);
}
?>