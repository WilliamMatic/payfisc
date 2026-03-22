<?php
/**
 * Script de soumission complète de la carte rose
 * Version avec support de l'attribution automatique (serie_id et serie_item_id à 0)
 * 
 * @author Système d'immatriculation
 * @version 1.0
 */

// ======================================================================
// CONFIGURATION CORS ET EN-TÊTES
// ======================================================================

// Configuration des en-têtes CORS
require '../headers/head.php';

// Réponse aux requêtes OPTIONS (preflight)
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// ======================================================================
// CHARGEMENT DES DÉPENDANCES
// ======================================================================

require_once __DIR__ . '/../../class/CarteRose.php';

// Définition du type de contenu de la réponse
header('Content-Type: application/json');

// ======================================================================
// VALIDATION DE LA MÉTHODE HTTP
// ======================================================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405); // Method Not Allowed
    echo json_encode([
        "status" => "error", 
        "message" => "Méthode non autorisée. Veuillez utiliser POST."
    ]);
    exit;
}

// ======================================================================
// VALIDATION DES DONNÉES OBLIGATOIRES
// ======================================================================

// Liste des champs requis (serie_id et serie_item_id peuvent être 0)
$champsObligatoires = [
    'impot_id', 
    'utilisateur_id', 
    'site_id',
    'nom', 
    'prenom', 
    'adresse',
    'type_engin', 
    'marque', 
    'numero_plaque'
];

$erreurs = [];
foreach ($champsObligatoires as $champ) {
    if (!isset($_POST[$champ]) || empty(trim($_POST[$champ]))) {
        $erreurs[] = "Le champ '$champ' est obligatoire.";
    }
}

// Si des erreurs sont détectées, on les retourne
if (!empty($erreurs)) {
    http_response_code(400); // Bad Request
    echo json_encode([
        "status" => "error", 
        "message" => implode(" ", $erreurs)
    ]);
    exit;
}

// ======================================================================
// NETTOYAGE ET VALIDATION APPROFONDIE DES DONNÉES
// ======================================================================

/**
 * Nettoie les entrées utilisateur de manière sécurisée
 * 
 * @param mixed $data Donnée à nettoyer (string ou array)
 * @return mixed Donnée nettoyée
 */
function nettoyerInput($data) {
    if (is_array($data)) {
        return array_map('nettoyerInput', $data);
    }
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

// Application du nettoyage à toutes les entrées POST
$_POST = nettoyerInput($_POST);

// ======================================================================
// VALIDATION DES IDENTIFIANTS NUMÉRIQUES
// ======================================================================

// Validation de l'utilisateur_id
if (!is_numeric($_POST['utilisateur_id']) || (int)$_POST['utilisateur_id'] <= 0) {
    http_response_code(400);
    echo json_encode([
        "status" => "error", 
        "message" => "L'identifiant de l'utilisateur est invalide."
    ]);
    exit;
}

// Validation du site_id
if (!is_numeric($_POST['site_id']) || (int)$_POST['site_id'] <= 0) {
    http_response_code(400);
    echo json_encode([
        "status" => "error", 
        "message" => "L'identifiant du site est invalide."
    ]);
    exit;
}

// ======================================================================
// GESTION DES SÉRIES (PEUVENT ÊTRE À 0 POUR ATTRIBUTION AUTOMATIQUE)
// ======================================================================

$serieId = isset($_POST['serie_id']) ? (int)$_POST['serie_id'] : 0;
$serieItemId = isset($_POST['serie_item_id']) ? (int)$_POST['serie_item_id'] : 0;

// ======================================================================
// VALIDATION DU NUMÉRO DE PLAQUE
// ======================================================================

$numeroPlaque = strtoupper(trim($_POST['numero_plaque']));
if (!preg_match('/^[A-Z0-9\s\-]{2,15}$/', $numeroPlaque)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error", 
        "message" => "Le format du numéro de plaque est invalide. Utilisez 2 à 15 caractères alphanumériques."
    ]);
    exit;
}

// ======================================================================
// VALIDATION DU NUMÉRO DE TÉLÉPHONE (SI FOURNI)
// ======================================================================

$telephone = $_POST['telephone'] ?? '';
if (!empty($telephone) && $telephone !== '-') {
    if (!preg_match('/^[\+\d\s\-\(\)]{8,20}$/', $telephone)) {
        http_response_code(400);
        echo json_encode([
            "status" => "error", 
            "message" => "Le format du numéro de téléphone est invalide."
        ]);
        exit;
    }
}

// ======================================================================
// CONSTRUCTION DU TABLEAU DE DONNÉES POUR LE TRAITEMENT
// ======================================================================

$data = [
    // Données du particulier
    'impot_id' => $_POST['impot_id'],
    'utilisateur_id' => (int)$_POST['utilisateur_id'],
    'site_id' => (int)$_POST['site_id'],
    'nom' => $_POST['nom'],
    'prenom' => $_POST['prenom'],
    'telephone' => $telephone,
    'email' => $_POST['email'] ?? '',
    'adresse' => $_POST['adresse'],
    'ville' => $_POST['ville'] ?? '',
    'code_postal' => $_POST['code_postal'] ?? '',
    'province' => $_POST['province'] ?? '',
    
    // Données de l'engin
    'type_engin' => $_POST['type_engin'],
    'marque' => $_POST['marque'],
    'modele' => $_POST['modele'] ?? '',
    'energie' => $_POST['energie'] ?? '',
    'annee_fabrication' => $_POST['annee_fabrication'] ?? '',
    'annee_circulation' => $_POST['annee_circulation'] ?? '',
    'couleur' => $_POST['couleur'] ?? '',
    'puissance_fiscal' => $_POST['puissance_fiscal'] ?? '',
    'usage_engin' => $_POST['usage_engin'] ?? '',
    'numero_chassis' => $_POST['numero_chassis'] ?? '',
    'numero_moteur' => $_POST['numero_moteur'] ?? '',
    
    // Données de la plaque
    'numero_plaque' => $numeroPlaque,
    'serie_id' => $serieId,
    'serie_item_id' => $serieItemId,
    'plaque_attribuee_id' => isset($_POST['plaque_attribuee_id']) ? (int)$_POST['plaque_attribuee_id'] : null
];

// ======================================================================
// TRAITEMENT PRINCIPAL AVEC TRANSACTION UNIQUE
// ======================================================================

try {
    // Initialisation du gestionnaire de carte rose
    $carteRoseManager = new CarteRose();
    
    // ======================================================================
    // ÉTAPE 1 : VÉRIFICATION D'UNE CARTE ROSE EXISTANTE
    // ======================================================================
    
    if (!empty($data['numero_plaque'])) {
        $verifExistante = $carteRoseManager->verifierCarteRoseExistante(
            $data['numero_plaque'], 
            $data['utilisateur_id']
        );
        
        // Analyse du résultat de la vérification
        if (isset($verifExistante['status']) && $verifExistante['status'] === 'error') {
            // Si l'erreur est "carte non trouvée", c'est normal, on continue
            if ($verifExistante['type'] !== 'carte_rose_non_trouvee') {
                // Pour toute autre erreur, on bloque le processus
                http_response_code(400);
                echo json_encode([
                    "status" => "error",
                    "message" => $verifExistante['message']
                ]);
                exit;
            }
        } elseif ($verifExistante && isset($verifExistante['statut']) && $verifExistante['statut'] == 1) {
            // Une carte rose active existe déjà pour cette plaque
            http_response_code(409); // Conflict
            echo json_encode([
                "status" => "error", 
                "message" => "Une carte rose active existe déjà pour ce numéro de plaque.",
                "data" => $verifExistante
            ]);
            exit;
        }
    }
    
    // ======================================================================
    // ÉTAPE 2 : EXÉCUTION DU PROCESSUS COMPLET DE CRÉATION
    // ======================================================================
    
    $resultat = $carteRoseManager->creerCarteRoseComplete($data);
    
    // ======================================================================
    // ÉTAPE 3 : TRAITEMENT DU RÉSULTAT
    // ======================================================================
    
    if ($resultat['status'] === 'success') {
        // Construction du message de succès
        $message = "La carte rose a été créée avec succès.";
        
        // Ajout d'une mention pour l'attribution automatique si applicable
        if (isset($resultat['data']['serie_id_auto']) && $resultat['data']['serie_id_auto']) {
            $message .= " La plaque a été attribuée automatiquement.";
        }
        
        // Envoi de la réponse de succès
        echo json_encode([
            "status" => "success", 
            "message" => $message,
            "data" => $resultat['data']
        ]);
        
    } else {
        // Erreur métier retournée par la méthode
        http_response_code(400);
        echo json_encode($resultat);
    }
    
} catch (PDOException $e) {
    // ======================================================================
    // GESTION DES ERREURS DE BASE DE DONNÉES
    // ======================================================================
    
    // Journalisation de l'erreur technique
    error_log("Erreur PDO - soumission carte rose: " . $e->getMessage());
    
    // Message adapté à l'environnement (détaillé en local, générique en production)
    $message = (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false)
        ? "Erreur de base de données: " . $e->getMessage()
        : "Une erreur technique est survenue. Veuillez réessayer ultérieurement.";
    
    http_response_code(500); // Internal Server Error
    echo json_encode([
        "status" => "error", 
        "message" => $message
    ]);
    
} catch (Exception $e) {
    // ======================================================================
    // GESTION DES AUTRES TYPES D'ERREURS
    // ======================================================================
    
    // Journalisation de l'erreur technique
    error_log("Exception - soumission carte rose: " . $e->getMessage());
    
    // Message adapté à l'environnement
    $message = (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false)
        ? "Erreur: " . $e->getMessage()
        : "Une erreur inattendue est survenue. Veuillez réessayer ultérieurement.";
    
    http_response_code(500); // Internal Server Error
    echo json_encode([
        "status" => "error", 
        "message" => $message
    ]);
}