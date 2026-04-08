<?php
/**
 * Script de génération de rapport des séries
 *
 * Corrections :
 *  - Suppression de FILTER_SANITIZE_STRING (déprécié)
 *  - Validation robuste des dates
 *  - Nettoyage des chaînes via trim() + htmlspecialchars()
 *  - Réponses JSON centralisées
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Inclusion sécurisée du fichier de classe
require_once __DIR__ . '/../../class/Plaque.php';

// Toujours renvoyer du JSON (charset explicit)
header('Content-Type: application/json; charset=utf-8');

/**
 * Envoie une réponse JSON et termine l'exécution.
 *
 * @param int $httpCode
 * @param array $payload
 * @return void
 */
function send_json(int $httpCode, array $payload): void {
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Nettoie une chaîne d'entrée pour usage basique.
 *
 * @param mixed $value
 * @return string|null
 */
function clean_string($value): ?string {
    if ($value === null) return null;
    // trim + échappement HTML pour éviter les injections XSS si jamais renvoyé
    return htmlspecialchars(trim((string)$value), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Valide et normalise une date en acceptant 'Y-m-d' ou 'Y-m-d H:i:s'.
 *
 * Retourne la date sous forme 'Y-m-d' si l'heure n'est pas fournie,
 * ou 'Y-m-d H:i:s' si l'heure était présente.
 *
 * @param string $dateStr
 * @return string|false Date normalisée ou false si invalide
 */
function normalize_date(string $dateStr) {
    $dateStr = trim($dateStr);
    $formats = [
        'Y-m-d H:i:s',
        'Y-m-d',
        'Y-m-d\TH:i:s', // iso-like without timezone
    ];
    foreach ($formats as $fmt) {
        $d = DateTime::createFromFormat($fmt, $dateStr);
        if ($d && $d->format($fmt) === $dateStr) {
            // Retourne en fonction du format initial
            if ($fmt === 'Y-m-d') return $d->format('Y-m-d');
            return $d->format('Y-m-d H:i:s');
        }
    }
    // dernière chance : essayer DateTime constructeur (tolérant)
    try {
        $d = new DateTime($dateStr);
        // si on a une heure (non 00:00:00) on renvoie Y-m-d H:i:s sinon Y-m-d
        $time = $d->format('H:i:s');
        if ($time !== '00:00:00') return $d->format('Y-m-d H:i:s');
        return $d->format('Y-m-d');
    } catch (Exception $e) {
        return false;
    }
}

// ======================================================================
// VALIDATION DE LA REQUÊTE HTTP
// ======================================================================

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    send_json(405, ["status" => "error", "message" => "Méthode non autorisée (GET requis)."]);
}

// ======================================================================
// VALIDATION DES PARAMÈTRES
// ======================================================================

if (!isset($_GET['date_debut']) || !isset($_GET['date_fin'])) {
    send_json(400, ["status" => "error", "message" => "Les dates de début et fin sont requises."]);
}

// Récupération brute
$rawDateDebut = $_GET['date_debut'];
$rawDateFin   = $_GET['date_fin'];

// Nettoyage simple des chaînes
$dateDebutStr = clean_string($rawDateDebut);
$dateFinStr   = clean_string($rawDateFin);

// Province (optionnel) - validation int
$provinceIdRaw = isset($_GET['province_id']) ? $_GET['province_id'] : null;
$provinceId = null;
if ($provinceIdRaw !== null && $provinceIdRaw !== '') {
    // utilise FILTER_VALIDATE_INT pour convertir
    $provinceIdFiltered = filter_var($provinceIdRaw, FILTER_VALIDATE_INT);
    if ($provinceIdFiltered === false) {
        send_json(400, ["status" => "error", "message" => "Le paramètre province_id doit être un entier."]);
    }
    $provinceId = $provinceIdFiltered;
}

// Validation/normalisation des dates
$normDebut = normalize_date($dateDebutStr);
$normFin   = normalize_date($dateFinStr);

if ($normDebut === false || $normFin === false) {
    send_json(400, ["status" => "error", "message" => "Les dates fournies sont invalides. Format attendu : YYYY-MM-DD ou YYYY-MM-DD HH:MM:SS."]);
}

// Convertir en DateTime pour comparer précisément
try {
    $dtDebut = new DateTime($normDebut);
    $dtFin   = new DateTime($normFin);
} catch (Exception $e) {
    send_json(400, ["status" => "error", "message" => "Erreur lors de la lecture des dates fournies."]);
}

if ($dtDebut > $dtFin) {
    send_json(400, ["status" => "error", "message" => "La date de début doit être antérieure à la date de fin."]);
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    // Instanciation de la classe Plaque
    $plaqueManager = new Plaque();

    // Si le manager attend des dates au format 'Y-m-d' ou 'Y-m-d H:i:s',
    // on lui fournit la version normalisée :
    // - préférer la version avec heure si l'utilisateur l'a fournie
    $dateDebutToUse = $normDebut;
    $dateFinToUse   = $normFin;

    // Génération du rapport
    $result = $plaqueManager->genererRapportSeries($dateDebutToUse, $dateFinToUse, $provinceId);

    // S'assurer que le résultat est un tableau/objet JSON-serializable
    if (!is_array($result) && !is_object($result)) {
        // le manager a renvoyé quelque chose d'inattendu
        send_json(500, ["status" => "error", "message" => "Erreur système: résultat inattendu lors de la génération du rapport."]);
    }

    // Réponse OK
    send_json(200, ["status" => "success", "data" => $result]);

} catch (Exception $e) {
    // Journalisation de l'erreur pour le débogage serveur (ne pas exposer le message en prod)
    error_log("Erreur lors de la génération du rapport : " . $e->getMessage());

    // Message générique pour l'utilisateur
    send_json(500, ["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
