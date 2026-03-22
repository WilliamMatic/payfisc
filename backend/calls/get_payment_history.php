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
    $limit = $data['limit'] ?? 10;
    
    if (empty($nif)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'NIF requis']);
        exit;
    }
    
    // Requête pour récupérer l'historique des paiements
    $stmt = $pdo->prepare("
        SELECT 
            p.id,
            p.reference_paiement,
            p.montant,
            p.statut,
            p.date_paiement,
            p.methode_paiement,
            d.reference as declaration_reference,
            d.type_contribuable,
            i.nom as impot_nom
        FROM paiements p 
        JOIN declarations d ON p.id_declaration = d.id 
        JOIN impots i ON d.id_impot = i.id
        WHERE d.nif_contribuable = :nif 
        AND p.statut = 'complete'
        ORDER BY p.date_paiement DESC 
        LIMIT :limit
    ");
    
    $stmt->bindValue(':nif', $nif, PDO::PARAM_STR);
    $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
    $stmt->execute();
    
    $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Formater les données pour la réponse
    $formattedPayments = [];
    foreach ($payments as $payment) {
        $formattedPayments[] = [
            'id' => $payment['id'],
            'reference' => $payment['reference_paiement'],
            'declaration_reference' => $payment['declaration_reference'],
            'description' => $payment['impot_nom'],
            'amount' => $payment['montant'],
            'status' => 'Payé',
            'date' => date('d/m/Y', strtotime($payment['date_paiement'])),
            'methode_paiement' => $payment['methode_paiement']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'payments' => $formattedPayments
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>