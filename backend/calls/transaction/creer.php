<?php
/**
 * Script de création d'une nouvelle transaction d'immatriculation
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Transaction.php';

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
$requiredFields = [
    'nom', 'prenom', 'telephone', 'adresse', 'typeEngin', 'marque',
    'energie', 'anneeFabrication', 'anneeCirculation', 'couleur',
    'puissanceFiscale', 'usage', 'numeroChassis', 'numeroMoteur',
    'modePaiement'
];

foreach ($requiredFields as $field) {
    if (empty($input[$field])) {
        echo json_encode(["status" => "error", "message" => "Le champ $field est obligatoire."]);
        exit;
    }
}

// Validation des nouveaux champs obligatoires
if (empty($input['utilisateur_id'])) {
    echo json_encode(["status" => "error", "message" => "L'ID du particulier est obligatoire."]);
    exit;
}

if (empty($input['province_nom'])) {
    echo json_encode(["status" => "error", "message" => "Le nom de la province est obligatoire."]);
    exit;
}

// Validation spécifique pour mobile_money
if ($input['modePaiement'] === 'mobile_money' && empty($input['operateur'])) {
    echo json_encode(["status" => "error", "message" => "L'opérateur est obligatoire pour le paiement mobile."]);
    exit;
}

// Validation des années
$anneeFab = intval($input['anneeFabrication']);
$anneeCirc = intval($input['anneeCirculation']);

if ($anneeFab < 2000 || $anneeFab > 2025) {
    echo json_encode(["status" => "error", "message" => "L'année de fabrication doit être entre 2000 et 2025."]);
    exit;
}

if ($anneeCirc < 2000 || $anneeCirc > 2025) {
    echo json_encode(["status" => "error", "message" => "L'année de circulation doit être entre 2000 et 2025."]);
    exit;
}

if ($anneeCirc < $anneeFab) {
    echo json_encode(["status" => "error", "message" => "L'année de circulation ne peut pas être antérieure à l'année de fabrication."]);
    exit;
}

// Nettoyage des données
$vehicleData = [
    'nom' => trim(htmlspecialchars($input['nom'], ENT_QUOTES, 'UTF-8')),
    'prenom' => trim(htmlspecialchars($input['prenom'], ENT_QUOTES, 'UTF-8')),
    'telephone' => trim(htmlspecialchars($input['telephone'], ENT_QUOTES, 'UTF-8')),
    'email' => isset($input['email']) ? trim(htmlspecialchars($input['email'], ENT_QUOTES, 'UTF-8')) : null,
    'adresse' => trim(htmlspecialchars($input['adresse'], ENT_QUOTES, 'UTF-8')),
    'typeEngin' => trim(htmlspecialchars($input['typeEngin'], ENT_QUOTES, 'UTF-8')),
    'marque' => trim(htmlspecialchars($input['marque'], ENT_QUOTES, 'UTF-8')),
    'energie' => trim(htmlspecialchars($input['energie'], ENT_QUOTES, 'UTF-8')),
    'anneeFabrication' => $anneeFab,
    'anneeCirculation' => $anneeCirc,
    'couleur' => trim(htmlspecialchars($input['couleur'], ENT_QUOTES, 'UTF-8')),
    'puissanceFiscale' => trim(htmlspecialchars($input['puissanceFiscale'], ENT_QUOTES, 'UTF-8')),
    'usage' => trim(htmlspecialchars($input['usage'], ENT_QUOTES, 'UTF-8')),
    'numeroChassis' => trim(htmlspecialchars($input['numeroChassis'], ENT_QUOTES, 'UTF-8')),
    'numeroMoteur' => trim(htmlspecialchars($input['numeroMoteur'], ENT_QUOTES, 'UTF-8'))
];

$paymentData = [
    'modePaiement' => trim(htmlspecialchars($input['modePaiement'], ENT_QUOTES, 'UTF-8')),
    'operateur' => isset($input['operateur']) ? trim(htmlspecialchars($input['operateur'], ENT_QUOTES, 'UTF-8')) : null,
    'numeroTransaction' => isset($input['numeroTransaction']) ? trim(htmlspecialchars($input['numeroTransaction'], ENT_QUOTES, 'UTF-8')) : null,
    'numeroCheque' => isset($input['numeroCheque']) ? trim(htmlspecialchars($input['numeroCheque'], ENT_QUOTES, 'UTF-8')) : null,
    'banque' => isset($input['banque']) ? trim(htmlspecialchars($input['banque'], ENT_QUOTES, 'UTF-8')) : null
];

// Récupération des nouveaux paramètres
$particulierId = intval($input['utilisateur_id']);
$provinceNom = trim(htmlspecialchars($input['province_nom'], ENT_QUOTES, 'UTF-8'));

// IDs utilisateur (à adapter selon votre système d'authentification)
$utilisateurId = $input['utilisateur_id']; // Récupérer de la session

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Transaction
    $transactionManager = new Transaction();
    
    // Traitement de la transaction avec les nouveaux paramètres
    $result = $transactionManager->traiterTransaction(
        $vehicleData, 
        $paymentData, 
        $particulierId, 
        $provinceNom
    );
    
    if ($result['status'] === 'success') {
        http_response_code(201);
        echo json_encode($result);
    } else {
        echo json_encode($result);
    }

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage
    error_log("Erreur lors du traitement de la transaction : " . $e->getMessage());
    
    // Message générique pour l'utilisateur
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système: L'opération a échoué.",
        "debug" => $e->getMessage() // À retirer en production
    ]);
}
?>