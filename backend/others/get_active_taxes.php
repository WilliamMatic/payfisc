<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Configuration de la base de données
$host = 'localhost';
$dbname = 'payfisc';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Récupérer tous les impôts actifs
    $stmt = $pdo->prepare("SELECT id, nom, description, formulaire_json, periode FROM impots WHERE actif = 1 ORDER BY nom");
    $stmt->execute();
    
    $taxes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Formater les données pour la réponse
    $formattedTaxes = [];
    foreach ($taxes as $tax) {
        $formulaData = json_decode($tax['formulaire_json'], true);
        $formattedTaxes[] = [
            'id' => $tax['id'],
            'nom' => $tax['nom'],
            'description' => $tax['description'],
            'periode' => $tax['periode'],
            'formulaire' => $formulaData['formulaire'] ?? []
        ];
    }
    
    echo json_encode([
        'success' => true,
        'taxes' => $formattedTaxes
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>