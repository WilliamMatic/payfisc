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
    $userId = $data['user_id'] ?? '';
    $userType = $data['user_type'] ?? '';
    
    if (empty($userId) || empty($userType)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID utilisateur et type requis']);
        exit;
    }
    
    if ($userType === 'particulier') {
        $stmt = $pdo->prepare("SELECT * FROM particuliers WHERE id = :id AND actif = 1");
    } else {
        $stmt = $pdo->prepare("SELECT * FROM entreprises WHERE id = :id AND actif = 1");
    }
    
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        // Préparation des données de réponse
        $responseData = [
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'nif' => $user['nif'],
                'type' => $userType,
                'email' => $user['email'],
                'telephone' => $user['telephone']
            ]
        ];
        
        // Ajout des informations spécifiques selon le type d'utilisateur
        if ($userType === 'particulier') {
            $responseData['user']['nom'] = $user['nom'];
            $responseData['user']['prenom'] = $user['prenom'];
            $responseData['user']['display_name'] = $user['prenom'] . ' ' . $user['nom'];
        } else {
            $responseData['user']['raison_sociale'] = $user['raison_sociale'];
            $responseData['user']['display_name'] = $user['raison_sociale'];
        }
        
        echo json_encode($responseData);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Utilisateur non trouvé']);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>