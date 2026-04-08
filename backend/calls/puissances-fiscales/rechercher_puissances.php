<?php
/**
 * Script pour rechercher des puissances fiscales par type d'engin et terme
 */

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/PuissanceFiscale.php';
require_once __DIR__ . '/../../class/TypeEngin.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

if (!isset($_POST['type_engin']) || !isset($_POST['search_term'])) {
    echo json_encode(["status" => "error", "message" => "Les paramètres type_engin et search_term sont obligatoires."]);
    exit;
}

try {
    $puissanceManager = new PuissanceFiscale();
    $typeEnginManager = new TypeEngin();
    
    $typeEngin = trim($_POST['type_engin']);
    $searchTerm = trim($_POST['search_term']);
    
    // Chercher l'ID du type d'engin par son libellé en utilisant la méthode existante
    $typesActifs = $typeEnginManager->listerTypeEnginsActifs();
    
    if ($typesActifs['status'] === 'error') {
        echo json_encode($typesActifs);
        exit;
    }
    
    $typeId = null;
    foreach ($typesActifs['data'] as $type) {
        if ($type['libelle'] === $typeEngin) {
            $typeId = $type['id'];
            break;
        }
    }
    
    if (!$typeId) {
        echo json_encode(["status" => "error", "message" => "Type d'engin non trouvé."]);
        exit;
    }
    
    // Utiliser la méthode existante pour lister les puissances actives
    $result = $puissanceManager->listerPuissancesFiscalesActives();
    
    if ($result['status'] === 'error') {
        echo json_encode($result);
        exit;
    }
    
    $puissances = $result['data'] ?? [];
    
    // Filtrer par type d'engin et terme de recherche
    $puissancesFiltrees = array_filter($puissances, function($puissance) use ($typeId, $searchTerm) {
        // Filtrer par type d'engin
        if ($puissance['type_engin_id'] != $typeId) {
            return false;
        }
        
        // Filtrer par terme de recherche si fourni
        if (!empty($searchTerm)) {
            $searchTermLower = strtolower($searchTerm);
            return stripos($puissance['libelle'], $searchTermLower) !== false ||
                   stripos((string)$puissance['valeur'], $searchTermLower) !== false ||
                   stripos($puissance['description'] ?? '', $searchTermLower) !== false;
        }
        
        return true;
    });
    
    // Trier par valeur
    usort($puissancesFiltrees, function($a, $b) {
        return $a['valeur'] <=> $b['valeur'];
    });
    
    // Limiter à 10 résultats
    $puissancesFiltrees = array_slice($puissancesFiltrees, 0, 10);
    
    // Formater les résultats
    $resultats = array_map(function($puissance) {
        return [
            'id' => $puissance['id'],
            'libelle' => $puissance['libelle'],
            'valeur' => $puissance['valeur'],
            'description' => $puissance['description'] ?? '',
            'type_engin_id' => $puissance['type_engin_id'],
            'type_engin_libelle' => $puissance['type_engin_libelle'] ?? ''
        ];
    }, $puissancesFiltrees);
    
    echo json_encode([
        "status" => "success",
        "data" => $resultats
    ]);

} catch (Exception $e) {
    error_log("Erreur lors de la recherche des puissances : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>