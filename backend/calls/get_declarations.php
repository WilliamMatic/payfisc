<?php
require 'headers/head.php';

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
    $statut = $data['statut'] ?? ''; // Optionnel: filtrer par statut
    
    if (empty($nif)) {
        echo json_encode(['success' => false, 'message' => 'NIF manquant']);
        exit;
    }
    
    // Construire la requête avec les informations des impôts (délai et pénalités)
    $sql = "SELECT d.*, i.nom as nom_impot, i.description, i.periode, i.delai_accord, i.penalites 
            FROM declarations d 
            JOIN impots i ON d.id_impot = i.id 
            WHERE d.nif_contribuable = :nif";
    
    $params = [':nif' => $nif];
    
    if (!empty($statut)) {
        $sql .= " AND d.statut = :statut";
        $params[':statut'] = $statut;
    }
    
    $sql .= " ORDER BY d.date_creation DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    $declarations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Décoder les JSON des pénalités
    foreach ($declarations as &$declaration) {
        if (!empty($declaration['penalites'])) {
            $declaration['penalites'] = json_decode($declaration['penalites'], true);
        }
    }
    
    echo json_encode([
        'success' => true,
        'declarations' => $declarations
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>