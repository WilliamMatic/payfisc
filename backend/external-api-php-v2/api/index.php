<?php

/**
 * ============================================================
 * API EXTERNE TSC-NPS — Entrée unique simplifiée
 * Utilise un paramètre `route` dans l'URL (ex: ?route=health)
 * ============================================================
 */

require_once __DIR__ . '/../classes/Connexion.php';
require_once __DIR__ . '/../classes/Response.php';
require_once __DIR__ . '/../classes/AuthMiddleware.php';
require_once __DIR__ . '/../classes/PaiementModel.php';
require_once __DIR__ . '/../classes/PaiementController.php';
require_once __DIR__ . '/../classes/HealthController.php';

// ── Configuration ───────────────────────────────────────────
define("API_DEBUG", true);  // true pour voir les erreurs exactes
ini_set("display_errors", "0");
ini_set("log_errors",     "1");
error_reporting(E_ALL);
ob_start();

// ── Gestion des exceptions et erreurs fatales ──────────────
set_exception_handler(function (Throwable $e) {
    error_log("[FATAL] " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine());
    if (ob_get_length()) ob_clean();
    http_response_code(500);
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode([
        "status"  => "error",
        "message" => "Erreur interne du serveur",
        "error"   => API_DEBUG
            ? "[DEBUG] " . $e->getMessage() . " @ " . basename($e->getFile()) . ":" . $e->getLine()
            : "Contactez le support TSC-NPS."
    ], JSON_UNESCAPED_UNICODE);
    exit;
});

register_shutdown_function(function () {
    $err = error_get_last();
    if ($err && in_array($err["type"], [E_ERROR, E_PARSE, E_COMPILE_ERROR, E_CORE_ERROR])) {
        if (ob_get_length()) ob_clean();
        http_response_code(500);
        header("Content-Type: application/json; charset=utf-8");
        echo json_encode([
            "status"  => "error",
            "message" => "Erreur fatale PHP",
            "error"   => API_DEBUG
                ? "[DEBUG] " . $err["message"] . " @ " . basename($err["file"]) . ":" . $err["line"]
                : "Contactez le support TSC-NPS."
        ], JSON_UNESCAPED_UNICODE);
    }
});

// ── CORS (preflight) ───────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, OPTIONS");
    header("Access-Control-Allow-Headers: X-Bank-ID, X-API-Key, Content-Type");
    exit;
}

// ── Récupération de la route ───────────────────────────────
$route = $_GET['route'] ?? '';
$route = trim($route, '/');

// ── Routage simple ─────────────────────────────────────────
try {
    switch ($route) {
        // Route publique : health check
        case 'health':
            $controller = new HealthController();
            $controller->check();
            break;

        // Route protégée : recherche par plaque
        case 'paiement/plaque':
            $plaque = $_GET['plaque'] ?? '';
            if (empty($plaque)) {
                Response::error("Paramètre manquant", "Le paramètre 'plaque' est requis", 400);
            }
            $auth = new AuthMiddleware();
            $auth->handle(); // authentification
            $controller = new PaiementController();
            $controller->getParPlaque($plaque, $auth);
            break;

        // Route protégée : recherche par transaction
        case 'paiement/transaction':
            $ref = $_GET['ref'] ?? '';
            if (empty($ref)) {
                Response::error("Paramètre manquant", "Le paramètre 'ref' est requis", 400);
            }
            $auth = new AuthMiddleware();
            $auth->handle();
            $controller = new PaiementController();
            $controller->getParTransaction($ref, $auth);
            break;

        // Route inconnue
        default:
            Response::error(
                "Route introuvable",
                "La route '{$route}' n'existe pas. Routes disponibles : health, paiement/plaque, paiement/transaction",
                404
            );
    }
} catch (Exception $e) {
    // Les exceptions sont déjà capturées par le handler,
    // mais on les relance pour être sûr.
    throw $e;
}