<?php
/**
 * Script de vérification plaque et téléphone particulier
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée
require_once __DIR__ . '/../../class/CarteRose.php';

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
// VALIDATION DES DONNÉES
// ======================================================================

if (!isset($_POST['numero_plaque'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le numéro de plaque est requis."]);
    exit;
}

// Nettoyage des données
$telephone = isset($_POST['telephone']) 
    ? trim(htmlspecialchars($_POST['telephone'], ENT_QUOTES, 'UTF-8')) 
    : "";
$numeroPlaque = trim(htmlspecialchars($_POST['numero_plaque'], ENT_QUOTES, 'UTF-8'));
$utilisateurId = isset($_POST['user']) ? (int)$_POST['user'] : null;

// Validation basique
if (empty($numeroPlaque)) {
    echo json_encode(["status" => "error", "message" => "Le numéro de plaque ne peut pas être vide."]);
    exit;
}

if (empty($utilisateurId) || $utilisateurId <= 0) {
    echo json_encode(["status" => "error", "message" => "L'identifiant utilisateur est requis et doit être valide."]);
    exit;
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    $carteRoseManager = new CarteRose();
    
    // Vérifier d'abord si une carte rose existe déjà
    $resultatVerification = $carteRoseManager->verifierCarteRoseExistante($numeroPlaque, $utilisateurId);
    
    // ANALYSE DU RETOUR DE LA MÉTHODE
    
    // Cas 1: La méthode retourne une erreur structurée
    if (is_array($resultatVerification) && isset($resultatVerification['status']) && $resultatVerification['status'] === 'error') {
        
        // Seul le cas 'carte_rose_non_trouvee' permet de continuer
        if (isset($resultatVerification['type']) && $resultatVerification['type'] === 'carte_rose_non_trouvee') {
            // OK, pas de carte rose existante, on continue
        } else {
            // Pour tous les autres types d'erreur, on retourne tel quel
            echo json_encode($resultatVerification);
            exit;
        }
    }
    // Cas 2: La méthode retourne des données de carte rose (sans erreur)
    else if (is_array($resultatVerification) && isset($resultatVerification['numero_plaque']) && isset($resultatVerification['statut'])) {
        // C'est une carte rose existante, on formate la réponse d'erreur
        echo json_encode([
            "status" => "error", 
            "message" => "Carte rose déjà délivrée pour cette plaque. Elle appartient à " . 
                        ($resultatVerification['particulier_nom'] ?? '') . ' ' . 
                        ($resultatVerification['prenom'] ?? ''),
            "type" => "carte_existante",
            "details" => [
                "nom_complet" => ($resultatVerification['particulier_nom'] ?? '') . ' ' . ($resultatVerification['prenom'] ?? ''),
                "telephone" => $resultatVerification['telephone'] ?? '',
                "adresse" => $resultatVerification['adresse'] ?? '',
                "numero_plaque" => $resultatVerification['numero_plaque'] ?? '',
                "date_attribution" => $resultatVerification['date_attribution'] ?? '',
                "nif" => $resultatVerification['nif'] ?? '',
                "site_nom" => $resultatVerification['site_nom'] ?? '',
                "province_nom" => $resultatVerification['province_nom'] ?? '',
                "statut" => $resultatVerification['statut'] ?? 0
            ]
        ]);
        exit;
    }
    // Cas 3: Retour inattendu
    else if ($resultatVerification !== null && $resultatVerification !== false) {
        // Log pour déboguer
        error_log("Retour inattendu de verifierCarteRoseExistante: " . json_encode($resultatVerification));
        
        echo json_encode([
            "status" => "error",
            "message" => "Format de réponse inattendu du système.",
            "type" => "format_inattendu"
        ]);
        exit;
    }
    
    // ======================================================================
    // SI ON ARRIVE ICI, C'EST QU'IL N'Y A PAS DE CARTE ROSE EXISTANTE
    // OU QUE L'ERREUR 'carte_rose_non_trouvee' A ÉTÉ IGNORÉE
    // ======================================================================
    
    // On continue avec la vérification du particulier
    $verification = $carteRoseManager->verifierParticulierPlaque($telephone, $numeroPlaque, $utilisateurId);
    
    if ($verification && is_array($verification)) {
        // Vérification réussie
        echo json_encode([
            "status" => "success", 
            "message" => "Vérification réussie. Aucune carte rose active n'existe pour cette plaque.",
            "data" => [
                "particulier" => [
                    "id" => $verification['id'] ?? null,
                    "nom" => $verification['nom'] ?? '',
                    "prenom" => $verification['prenom'] ?? '',
                    "telephone" => $verification['telephone'] ?? '',
                    "email" => $verification['email'] ?? '',
                    "adresse" => $verification['rue'] ?? '',
                    "ville" => $verification['ville'] ?? '',
                    "province" => $verification['province'] ?? '',
                    "nif" => $verification['nif'] ?? ''
                ],
                "plaque" => [
                    "id" => $verification['plaque_attribuee_id'] ?? null,
                    "numero_plaque" => $verification['numero_plaque'] ?? '',
                    "serie_id" => $verification['serie_id'] ?? null,
                    "serie_item_id" => $verification['serie_item_id'] ?? null,
                    "statut" => $verification['plaque_statut'] ?? null
                ]
            ]
        ]);
    } else {
        // Aucun enregistrement trouvé avec ces critères
        echo json_encode([
            "status" => "error", 
            "message" => "Aucun enregistrement trouvé avec ces critères. Vérifiez le numéro de plaque et le téléphone.",
            "type" => "non_trouve"
        ]);
    }

} catch (Exception $e) {
    error_log("Erreur lors de la vérification plaque: " . $e->getMessage());
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système: La vérification a échoué.",
        "type" => "exception_systeme"
    ]);
}