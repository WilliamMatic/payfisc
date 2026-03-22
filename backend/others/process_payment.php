<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

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
    $stmt = $pdo->prepare("
        SELECT d.id, d.reference, d.montant, d.id_impot 
        FROM declarations d 
        WHERE d.id = ? AND d.statut != 'payé'
    ");
    $stmt->execute([$declaration_id]);
    $declaration = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$declaration) {
        throw new Exception('Déclaration non trouvée ou déjà payée');
    }

    // Récupérer les bénéficiaires et leurs parts pour cet impôt
    $stmt = $pdo->prepare("
        SELECT ib.beneficiaire_id, ib.type_part, ib.valeur_part, b.nom
        FROM impot_beneficiaires ib
        INNER JOIN beneficiaires b ON ib.beneficiaire_id = b.id
        WHERE ib.impot_id = ?
        ORDER BY ib.id
    ");
    $stmt->execute([$declaration['id_impot']]);
    $beneficiaires = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($beneficiaires)) {
        throw new Exception('Aucun bénéficiaire configuré pour cet impôt');
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
        // Insérer le paiement
        $stmt = $pdo->prepare("
            INSERT INTO paiements 
            (id_declaration, methode_paiement, reference_paiement, montant, montant_penalite, statut, date_paiement, lieu_paiement) 
            VALUES (?, ?, ?, ?, ?, 'complete', NOW(), 'app')
        ");
        
        $success = $stmt->execute([
            $declaration_id,
            $methode_paiement_id,
            $reference_paiement,
            $montant_total,
            $penalites
        ]);

        if (!$success) {
            throw new Exception('Erreur lors de l\'insertion du paiement');
        }
        
        $paymentId = $pdo->lastInsertId();
        
        // Calculer et insérer la répartition du paiement pour chaque bénéficiaire
        $stmtRepartition = $pdo->prepare("
            INSERT INTO repartition_paiements 
            (id_declaration, beneficiaire_id, type_part, valeur_part_originale, valeur_part_calculee, montant, date_creation) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");

        $repartitionDetails = [];
        
        foreach ($beneficiaires as $beneficiaire) {
            $montant_part = 0;
            $valeur_part_calculee = 0;
            
            if ($beneficiaire['type_part'] === 'pourcentage') {
                // Pour les pourcentages, appliquer sur le montant principal (sans pénalités)
                $montant_part = ($amount * $beneficiaire['valeur_part']) / 100;
                $valeur_part_calculee = $beneficiaire['valeur_part'];
            } else {
                // Pour les montants fixes
                $montant_part = $beneficiaire['valeur_part'];
                $valeur_part_calculee = $beneficiaire['valeur_part'];
            }
            
            // Arrondir à 2 décimales
            $montant_part = round($montant_part, 2);
            $valeur_part_calculee = round($valeur_part_calculee, 2);
            
            $success = $stmtRepartition->execute([
                $declaration_id,
                $beneficiaire['beneficiaire_id'],
                $beneficiaire['type_part'],
                $beneficiaire['valeur_part'],
                $valeur_part_calculee,
                $montant_part
            ]);

            if (!$success) {
                throw new Exception('Erreur lors de l\'insertion de la répartition du paiement');
            }
            
            $repartitionDetails[] = [
                'beneficiaire_id' => (int)$beneficiaire['beneficiaire_id'],
                'beneficiaire_nom' => $beneficiaire['nom'],
                'type_part' => $beneficiaire['type_part'],
                'valeur_part_originale' => (float)$beneficiaire['valeur_part'],
                'valeur_part_calculee' => $valeur_part_calculee,
                'montant' => $montant_part
            ];
        }

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
            'payment_method' => $payment_method,
            'repartition' => $repartitionDetails
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