<?php
require 'headers/head.php';

// Répondre immédiatement aux requêtes OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Désactiver l'affichage des erreurs en production
error_reporting(0);
ini_set('display_errors', 0);

// Configuration de la base de données
$host = 'localhost';
$dbname = 'payfisc';
$username = 'root';
$password = '';

$response = [];

try {
    // Vérifier la méthode HTTP
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Méthode non autorisée. Utilisez POST.');
    }

    // Vérifier le Content-Type
    $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
    if (stripos($contentType, 'application/json') === false) {
        throw new Exception('Content-Type doit être application/json');
    }

    // Lire les données d'entrée
    $input = file_get_contents('php://input');
    
    if (empty($input)) {
        throw new Exception('Aucune donnée reçue');
    }

    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('JSON invalide: ' . json_last_error_msg());
    }

    // Validation des données requises
    $requiredFields = ['nif', 'user_type', 'tax_id', 'amount'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            throw new Exception("Champ requis manquant: $field");
        }
    }

    $nif = trim($data['nif']);
    $userType = trim($data['user_type']);
    $taxId = intval($data['tax_id']);
    $amount = floatval($data['amount']);
    $declarationData = $data['declaration_data'] ?? [];
    $declarationCount = intval($data['declaration_count'] ?? 1);

    // Validation du type de contribuable
    if (!in_array($userType, ['particulier', 'entreprise'])) {
        throw new Exception('Type de contribuable invalide');
    }

    // Connexion à la base de données
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
    
    // Vérifier que l'impôt existe
    $stmt = $pdo->prepare("SELECT id, nom FROM impots WHERE id = ? AND actif = 1");
    $stmt->execute([$taxId]);
    $tax = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tax) {
        throw new Exception('Impôt non trouvé ou inactif');
    }

    // Générer une référence unique
    $reference = 'DEC-' . date('YmdHis') . '-' . rand(1000, 9999);
    
    // Calculer le montant total
    $montantTotal = $amount * $declarationCount;
    
    // Préparer les données JSON
    $donneesJson = json_encode($declarationData, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
    if ($donneesJson === false) {
        throw new Exception('Erreur encodage JSON des données');
    }

    // Enregistrer la déclaration
    $stmt = $pdo->prepare("
        INSERT INTO declarations 
        (reference, nif_contribuable, type_contribuable, id_impot, montant, donnees_json, statut, date_creation) 
        VALUES (?, ?, ?, ?, ?, ?, 'en_attente', NOW())
    ");
    
    $success = $stmt->execute([
        $reference,
        $nif,
        $userType,
        $taxId,
        $montantTotal,
        $donneesJson
    ]);

    if (!$success) {
        throw new Exception('Erreur lors de l\'insertion en base de données');
    }

    $declarationId = $pdo->lastInsertId();

    // Réponse de succès
    $response = [
        'success' => true,
        'declaration_id' => (int)$declarationId,
        'reference' => $reference,
        'montant_total' => $montantTotal,
        'message' => 'Déclaration enregistrée avec succès'
    ];

} catch (PDOException $e) {
    error_log("Erreur PDO: " . $e->getMessage());
    $response = [
        'success' => false, 
        'message' => 'Erreur de base de données' . $e,
        'error_code' => 'DB_ERROR'
    ];
} catch (Exception $e) {
    error_log("Erreur application: " . $e->getMessage());
    $response = [
        'success' => false, 
        'message' => $e->getMessage(),
        'error_code' => 'APP_ERROR'
    ];
}

// Toujours retourner du JSON valide
echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>