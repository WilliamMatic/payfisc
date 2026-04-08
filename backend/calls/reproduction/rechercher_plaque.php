<?php
// calls/reproduction/rechercher_plaque.php

// CORS headers
require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Vérifier la méthode HTTP
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée"]);
    exit;
}

// Vérifier la présence de la plaque
if (!isset($_POST['plaque']) || empty(trim($_POST['plaque']))) {
    echo json_encode(["status" => "error", "message" => "Le numéro de plaque est obligatoire"]);
    exit;
}

// Récupérer et valider l'extension
$extension = isset($_POST['extension']) ? trim($_POST['extension']) : '';
$plaque = trim($_POST['plaque']);

// Déterminer la classe à utiliser basée sur l'extension
$classePrincipale = null;
$classeFallback = null;

if (empty($extension) || $extension === '0' || $extension === '0') {
    // TSC - Pas d'extension ou extension = 0
    require_once __DIR__ . '/../../class/RecherchePlaqueTsc.php';
    $classePrincipale = 'RecherchePlaque';
} elseif ($extension == 439727) {
    // HAOJUE
    require_once __DIR__ . '/../../class/RecherchePlaque.php';
    $classePrincipale = 'RecherchePlaque';
    // Préparer le fallback pour HAOJUE
    require_once __DIR__ . '/../../class/RecherchePlaqueHaojueNgaliema.php';
    $classeFallback = 'RecherchePlaque_haoujue_ngaliema';
} elseif ($extension == 440071) {
    // TVS
    require_once __DIR__ . '/../../class/RecherchePlaqueTvs.php';
    $classePrincipale = 'RecherchePlaque';
} else {
    // Extension non reconnue
    echo json_encode(["status" => "error", "message" => "Extension non reconnue"]);
    exit;
}

header('Content-Type: application/json');

try {
    // Première recherche avec la classe principale
    $recherche = new $classePrincipale();
    $resultat = $recherche->rechercherParPlaque($plaque);
    
    // Si échec pour HAOJUE, essayer le fallback
    if ($resultat['status'] !== 'success' && $classeFallback !== null) {
        $rechercheFallback = new $classeFallback();
        $resultat = $rechercheFallback->rechercherParPlaque($plaque);
    }
    
    // Déterminer le code HTTP en fonction du résultat
    if ($resultat['status'] === 'success') {
        http_response_code(200);
    } else {
    }
    
    echo json_encode($resultat);
    
} catch (Exception $e) {
    error_log("Erreur recherche plaque (extension: $extension, plaque: $plaque): " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système"]);
}
?>