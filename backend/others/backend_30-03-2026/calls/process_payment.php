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

    // Validation des données
    $requiredFields = ['declaration_id', 'payment_method', 'amount'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            throw new Exception("Champ requis manquant: $field");
        }
    }

    $declaration_id = intval($data['declaration_id']);
    $payment_method = trim($data['payment_method']);
    $amount = floatval($data['amount']);
    $penalites = floatval($data['penalites'] ?? 0);

    // Valider la méthode de paiement
    $methodesValides = ['mobile_money', 'carte_bancaire', 'virement', 'cheque'];
    if (!in_array($payment_method, $methodesValides)) {
        throw new Exception('Méthode de paiement invalide');
    }

    // Connexion à la base de données
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

    // Vérifier que la déclaration existe et n'est pas déjà payée
    $stmt = $pdo->prepare("SELECT id, reference, montant FROM declarations WHERE id = ? AND statut != 'payé'");
    $stmt->execute([$declaration_id]);
    $declaration = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$declaration) {
        throw new Exception('Déclaration non trouvée ou déjà payée');
    }

    // Générer une référence de paiement unique
    $reference_paiement = 'PAY' . date('YmdHis') . rand(1000, 9999);
    
    // Calculer le montant total
    $montant_total = $amount + $penalites;
    
    // Mapper la méthode de paiement vers l'ID
    $methodMapping = [
        'mobile_money' => 1,
        'carte_bancaire' => 2,
        'virement' => 3,
        'cheque' => 4
    ];
    
    $methode_paiement_id = $methodMapping[$payment_method] ?? 1;
    
    // Démarrer une transaction
    $pdo->beginTransaction();
    
    try {
        // Préparer la requête d'insertion avec les champs spécifiques
        $sql = "
            INSERT INTO paiements 
            (id_declaration, methode_paiement, reference_paiement, montant, montant_penalite, 
             operateur_mobile, numero_telephone, 
             numero_carte, nom_titulaire, date_expiration, code_cvv,
             nom_banque, numero_compte, reference_depot,
             numero_cheque, banque_emetteur, date_cheque,
             statut, date_paiement, lieu_paiement) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'complete', NOW(), 'app')
        ";
        
        $stmt = $pdo->prepare($sql);
        
        // Préparer les valeurs selon la méthode de paiement
        $values = [
            $declaration_id,
            $methode_paiement_id,
            $reference_paiement,
            $montant_total,
            $penalites
        ];

        // Ajouter les valeurs spécifiques selon la méthode de paiement
        switch ($payment_method) {
            case 'mobile_money':
                $values[] = $data['mobile_operator'] ?? null;
                $values[] = $data['phone_number'] ?? null;
                // Champs autres méthodes
                $values = array_merge($values, array_fill(0, 11, null));
                break;
                
            case 'carte_bancaire':
                // Champs mobile money
                $values = array_merge($values, array_fill(0, 2, null));
                // Champs carte
                $values[] = $data['card_number'] ?? null;
                $values[] = $data['card_holder'] ?? null;
                $values[] = $data['expiry_date'] ?? null;
                $values[] = $data['cvv'] ?? null;
                // Champs autres méthodes
                $values = array_merge($values, array_fill(0, 7, null));
                break;
                
            case 'virement':
                // Champs mobile money et carte
                $values = array_merge($values, array_fill(0, 6, null));
                // Champs virement
                $values[] = $data['bank_name'] ?? null;
                $values[] = $data['account_number'] ?? null;
                $values[] = $data['deposit_reference'] ?? null;
                // Champs chèque
                $values = array_merge($values, array_fill(0, 4, null));
                break;
                
            case 'cheque':
                // Champs mobile money, carte et virement
                $values = array_merge($values, array_fill(0, 10, null));
                // Champs chèque
                $values[] = $data['cheque_number'] ?? null;
                $values[] = $data['bank_emitter'] ?? null;
                $values[] = $data['cheque_date'] ?? null;
                break;
                
            default:
                $values = array_merge($values, array_fill(0, 13, null));
        }

        $success = $stmt->execute($values);

        if (!$success) {
            throw new Exception('Erreur lors de l\'insertion du paiement');
        }
        
        $paymentId = $pdo->lastInsertId();
        
        // Mettre à jour le statut de la déclaration
        $stmt = $pdo->prepare("UPDATE declarations SET statut = 'payé', date_modification = NOW() WHERE id = ?");
        $success = $stmt->execute([$declaration_id]);
        
        if (!$success) {
            throw new Exception('Erreur lors de la mise à jour de la déclaration');
        }

        // Valider la transaction
        $pdo->commit();
        
        $response = [
            'success' => true,
            'message' => 'Paiement effectué avec succès',
            'payment_id' => (int)$paymentId,
            'payment_reference' => $reference_paiement,
            'amount_paid' => $montant_total,
            'penalties' => $penalites,
            'payment_method' => $payment_method
        ];
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
    
} catch (PDOException $e) {
    error_log("Erreur PDO paiement: " . $e->getMessage());
    $response = [
        'success' => false, 
        'message' => 'Erreur de base de données',
        'error_code' => 'DB_ERROR'
    ];
} catch (Exception $e) {
    error_log("Erreur application paiement: " . $e->getMessage());
    $response = [
        'success' => false, 
        'message' => $e->getMessage(),
        'error_code' => 'APP_ERROR'
    ];
}

// Toujours retourner du JSON valide
echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>