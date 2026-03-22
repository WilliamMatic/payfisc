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
    $password = $data['password'] ?? '';

    if (empty($nif) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'NIF et mot de passe requis']);
        exit;
    }

    $user = null;
    $userType = 'particulier';

    // Recherche dans la table particuliers avec nif + password
    $stmt = $pdo->prepare("SELECT * FROM particuliers WHERE nif = :nif AND password = :password AND actif = 1");
    $stmt->execute([':nif' => $nif, ':password' => $password]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Si pas trouvé dans particuliers, recherche dans entreprises
    if (!$user) {
        $stmt = $pdo->prepare("SELECT * FROM entreprises WHERE nif = :nif AND password = :password AND actif = 1");
        $stmt->execute([':nif' => $nif, ':password' => $password]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $userType = 'entreprise';
    }

    if ($user) {
        // Préparation des données de réponse
        $responseData = [
            'success' => true,
            'message' => 'Connexion réussie',
            'user' => [
                'id' => $user['id'],
                'nif' => $user['nif'],
                'type' => $userType
            ]
        ];

        // Ajout des informations spécifiques selon le type d'utilisateur
        if ($userType === 'particulier') {
            $responseData['user']['nom'] = $user['nom'];
            $responseData['user']['prenom'] = $user['prenom'];
            $responseData['user']['email'] = $user['email'];
        } else {
            $responseData['user']['raison_sociale'] = $user['raison_sociale'];
            $responseData['user']['email'] = $user['email'];
        }

        echo json_encode($responseData);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Identifiants incorrects ou utilisateur inactif']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de base de données: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>
