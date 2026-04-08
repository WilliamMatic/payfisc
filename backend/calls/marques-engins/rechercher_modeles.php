<?php
/**
 * Script pour rechercher des modèles par marque et terme
 */

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/MarqueEngin.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

if (!isset($_POST['marque_id']) || !isset($_POST['search_term'])) {
    echo json_encode(["status" => "error", "message" => "Les paramètres marque_id et search_term sont obligatoires."]);
    exit;
}

try {
    $marqueManager = new MarqueEngin();
    
    $marqueId = (int)$_POST['marque_id'];
    $searchTerm = trim($_POST['search_term']);
    
    // Vérifier si la marque existe
    $marque = $marqueManager->marqueExistePourModele($marqueId);
    if (!$marque) {
        echo json_encode(["status" => "error", "message" => "Marque non trouvée."]);
        exit;
    }
    
    // Rechercher les modèles par marque ID
    $result = $marqueManager->listerModeles($marqueId);
    
    if ($result['status'] === 'error') {
        echo json_encode($result);
        exit;
    }
    
    $modeles = $result['data'] ?? [];
    
    // Filtrer les modèles par le terme de recherche (si fourni)
    if (!empty($searchTerm) && !empty($modeles)) {
        $searchTermLower = strtolower($searchTerm);
        $modelesFiltres = array_filter($modeles, function($modele) use ($searchTermLower) {
            return stripos($modele['libelle'], $searchTermLower) !== false ||
                   stripos($modele['description'] ?? '', $searchTermLower) !== false;
        });
        
        // Trier par pertinence (ceux qui commencent par le terme de recherche d'abord)
        usort($modelesFiltres, function($a, $b) use ($searchTermLower) {
            $aStarts = stripos($a['libelle'], $searchTermLower) === 0;
            $bStarts = stripos($b['libelle'], $searchTermLower) === 0;
            
            if ($aStarts && !$bStarts) return -1;
            if (!$aStarts && $bStarts) return 1;
            return strcasecmp($a['libelle'], $b['libelle']);
        });
        
        $modeles = array_values($modelesFiltres);
    }
    
    // Limiter à 10 résultats
    $modeles = array_slice($modeles, 0, 10);
    
    echo json_encode([
        "status" => "success",
        "data" => $modeles
    ]);

} catch (Exception $e) {
    error_log("Erreur lors de la recherche des modèles : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>