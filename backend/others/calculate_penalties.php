<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Configuration de la base de données
$host = 'localhost';
$dbname = 'payfisc';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Récupération des données POST
    $data = json_decode(file_get_contents('php://input'), true);
    
    $declaration_id = $data['declaration_id'] ?? '';
    
    if (empty($declaration_id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de déclaration manquant']);
        exit;
    }
    
    // Récupérer les informations de la déclaration et de l'impôt
    $sql = "SELECT d.*, i.delai_accord, i.penalites, i.nom as nom_impot 
            FROM declarations d 
            JOIN impots i ON d.id_impot = i.id 
            WHERE d.id = :declaration_id";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':declaration_id' => $declaration_id]);
    
    $declaration = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$declaration) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Déclaration non trouvée']);
        exit;
    }
    
    // Calcul des pénalités
    $penalites = calculerPenalites($declaration);
    
    echo json_encode([
        'success' => true,
        'penalites' => $penalites,
        'declaration' => [
            'id' => $declaration['id'],
            'reference' => $declaration['reference'],
            'montant_initial' => $declaration['montant'],
            'nom_impot' => $declaration['nom_impot']
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}

/**
 * Calcule les pénalités pour une déclaration
 */
function calculerPenalites($declaration) {
    $dateCreation = new DateTime($declaration['date_creation']);
    $aujourdHui = new DateTime();
    
    // Différence en jours
    $interval = $dateCreation->diff($aujourdHui);
    $joursEcoules = $interval->days;
    
    $delaiAccorde = $declaration['delai_accord'] ?? 30;
    
    // Nombre de délais accordés COMPLÈTEMENT écoulés
    $nombreDelaisEcoules = floor($joursEcoules / $delaiAccorde);
    
    $montantInitial = floatval($declaration['montant']);
    $montantPenalites = 0;
    
    // Configuration des pénalités depuis la table impots
    $penalitesConfig = json_decode($declaration['penalites'] ?? '{"type":"pourcentage","valeur":10}', true);
    
    if ($nombreDelaisEcoules > 0) {
        if ($penalitesConfig['type'] === 'pourcentage') {
            $tauxPenalite = $penalitesConfig['valeur'] / 100;
            $montantPenalites = $montantInitial * $tauxPenalite * $nombreDelaisEcoules;
        } else if ($penalitesConfig['type'] === 'fixe') {
            $montantPenalites = $penalitesConfig['valeur'] * $nombreDelaisEcoules;
        }
    }
    
    $montantTotal = $montantInitial + $montantPenalites;
    
    return [
        'jours_ecoules' => $joursEcoules,
        'delai_accorde' => $delaiAccorde,
        'nombre_delais_ecoules' => $nombreDelaisEcoules,
        'montant_penalites' => $montantPenalites,
        'montant_total' => $montantTotal,
        'montant_initial' => $montantInitial,
        'details_calcul' => $joursEcoules . " jours écoulés = " . $nombreDelaisEcoules . " délai(s) de " . $delaiAccorde . " jours écoulé(s)",
        'calcul_automatique' => true,
        'date_calcul' => date('Y-m-d H:i:s')
    ];
}
?>