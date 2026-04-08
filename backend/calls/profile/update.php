<?php
/**
 * Script de mise à jour du profil utilisateur
 */

// CORS headers
require '../../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Profile.php';

header('Content-Type: application/json');

// ======================================================================
// VALIDATION DE LA REQUÊTE HTTP
// ======================================================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES DONNÉES DU FORMULAIRE
// ======================================================================

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(["status" => "error", "message" => "Données JSON invalides."]);
    exit;
}

// Validation des champs obligatoires
$requiredFields = ['user_id', 'nom', 'prenom', 'telephone', 'nif'];

foreach ($requiredFields as $field) {
    if (empty($input[$field])) {
        echo json_encode(["status" => "error", "message" => "Le champ $field est obligatoire."]);
        exit;
    }
}

// Validation de l'email si fourni
if (!empty($input['email']) && !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "Format d'email invalide."]);
    exit;
}

// Validation du téléphone (format basique)
if (!preg_match('/^[0-9+\-\s()]{8,20}$/', $input['telephone'])) {
    echo json_encode(["status" => "error", "message" => "Format de téléphone invalide."]);
    exit;
}

// Nettoyage des données
$profileData = [
    'user_id' => intval($input['user_id']),
    'nom' => trim(htmlspecialchars($input['nom'], ENT_QUOTES, 'UTF-8')),
    'prenom' => trim(htmlspecialchars($input['prenom'], ENT_QUOTES, 'UTF-8')),
    'date_naissance' => isset($input['date_naissance']) ? trim(htmlspecialchars($input['date_naissance'], ENT_QUOTES, 'UTF-8')) : null,
    'lieu_naissance' => isset($input['lieu_naissance']) ? trim(htmlspecialchars($input['lieu_naissance'], ENT_QUOTES, 'UTF-8')) : null,
    'sexe' => isset($input['sexe']) ? trim(htmlspecialchars($input['sexe'], ENT_QUOTES, 'UTF-8')) : null,
    'rue' => isset($input['rue']) ? trim(htmlspecialchars($input['rue'], ENT_QUOTES, 'UTF-8')) : null,
    'ville' => isset($input['ville']) ? trim(htmlspecialchars($input['ville'], ENT_QUOTES, 'UTF-8')) : null,
    'code_postal' => isset($input['code_postal']) ? trim(htmlspecialchars($input['code_postal'], ENT_QUOTES, 'UTF-8')) : null,
    'province' => isset($input['province']) ? trim(htmlspecialchars($input['province'], ENT_QUOTES, 'UTF-8')) : null,
    'telephone' => trim(htmlspecialchars($input['telephone'], ENT_QUOTES, 'UTF-8')),
    'email' => isset($input['email']) ? trim(htmlspecialchars($input['email'], ENT_QUOTES, 'UTF-8')) : null,
    'nif' => trim(htmlspecialchars($input['nif'], ENT_QUOTES, 'UTF-8')),
    'dependants' => isset($input['dependants']) ? intval($input['dependants']) : 0
];

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Profile
    $profileManager = new Profile();
    
    // Mise à jour du profil
    $result = $profileManager->mettreAJourProfil($profileData);
    
    if ($result['status'] === 'success') {
        http_response_code(200);
        echo json_encode($result);
    } else {
        echo json_encode($result);
    }

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors de la mise à jour du profil : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système: La mise à jour du profil a échoué."
    ]);
}
?>