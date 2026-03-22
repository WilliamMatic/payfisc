<?php
/**
 * Script d'inscription d'un nouveau particulier
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Auth.php';

header('Content-Type: application/json');

// ======================================================================
// VALIDATION DE LA REQUÊTE HTTP
// ======================================================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// ======================================================================
// VALIDATION ET RÉCUPÉRATION DES DONNÉES JSON
// ======================================================================

// Récupération du corps de la requête JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Données JSON invalides."]);
    exit;
}

// Validation des champs obligatoires
if (!isset($data['nom'], $data['prenom'], $data['telephone'], $data['password'], $data['confirmPassword'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Tous les champs obligatoires doivent être remplis."]);
    exit;
}

// Nettoyage des données
$nom = trim(htmlspecialchars($data['nom'], ENT_QUOTES, 'UTF-8'));
$prenom = trim(htmlspecialchars($data['prenom'], ENT_QUOTES, 'UTF-8'));
$telephone = trim(htmlspecialchars($data['telephone'], ENT_QUOTES, 'UTF-8'));
$password = $data['password'];
$confirmPassword = $data['confirmPassword'];
$email = isset($data['email']) ? trim(htmlspecialchars($data['email'], ENT_QUOTES, 'UTF-8')) : null;
$province = isset($data['province']) ? trim(htmlspecialchars($data['province'], ENT_QUOTES, 'UTF-8')) : null;

// Validation de la confirmation du mot de passe
if ($password !== $confirmPassword) {
    echo json_encode(["status" => "error", "message" => "Les mots de passe ne correspondent pas."]);
    exit;
}

// Validation de la force du mot de passe
if (strlen($password) < 6) {
    echo json_encode(["status" => "error", "message" => "Le mot de passe doit contenir au moins 6 caractères."]);
    exit;
}

// Validation de l'email si fourni
if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "L'adresse email n'est pas valide."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Particulier
    $particulierManager = new Particulier();
    
    // Préparation des données pour l'insertion
    $donneesInscription = [
        'nom' => $nom,
        'prenom' => $prenom,
        'telephone' => $telephone,
        'password' => $password,
        'email' => $email
    ];

    // Construction des autres informations
    $autresInfos = [];
    
    // Ajout de la province si fournie
    if (!empty($province)) {
        $autresInfos['province'] = $province;
    }

    // Ajout des champs optionnels s'ils sont présents dans les données
    $champsOptionnels = [
        'date_naissance', 'lieu_naissance', 'sexe', 'rue', 'ville', 
        'code_postal', 'id_national', 'situation_familiale', 'dependants'
    ];

    foreach ($champsOptionnels as $champ) {
        if (isset($data[$champ]) && !empty(trim($data[$champ]))) {
            $autresInfos[$champ] = trim(htmlspecialchars($data[$champ], ENT_QUOTES, 'UTF-8'));
        }
    }

    // Tentative d'inscription du nouveau particulier
    $result = $particulierManager->ajouterParticulier($nom, $prenom, $telephone, $password, $email, $autresInfos);
    
    if ($result['status'] === 'success') {
        http_response_code(201);
    } else {
        http_response_code(400);
    }
    
    echo json_encode($result);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de l'inscription d'un particulier : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération d'inscription a échoué."]);
}
?>