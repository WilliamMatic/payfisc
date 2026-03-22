<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
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
    $nif = $data['nif'] ?? '';
    
    if (empty($nif)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'NIF requis']);
        exit;
    }
    
    // Requête pour récupérer le total des paiements
    $stmt = $pdo->prepare("
        SELECT SUM(p.montant) as total_paye 
        FROM paiements p 
        JOIN declarations d ON p.id_declaration = d.id 
        WHERE d.nif_contribuable = :nif 
        AND p.statut = 'complete'
        AND YEAR(p.date_paiement) = YEAR(CURDATE())
    ");
    
    $stmt->execute([':nif' => $nif]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $total = $result['total_paye'] ?? 0;
    
    echo json_encode([
        'success' => true,
        'total_paye' => (float)$total
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>