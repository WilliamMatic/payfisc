<?php

/**
 * Response — Réponses JSON standardisées
 * 
 * Toutes les réponses de l'API ont le même format :
 * { "status": "success|error", "message": "...", "data": {...} }
 */
class Response {

    /**
     * Envoie une réponse de succès JSON et arrête l'exécution
     */
    public static function success($data, string $message = "Succès", int $code = 200): void {
        self::send($code, [
            "status"  => "success",
            "message" => $message,
            "data"    => $data
        ]);
    }

    /**
     * Envoie une réponse d'erreur JSON et arrête l'exécution
     */
    public static function error(string $message, string $detail = "", int $code = 500): void {
        self::send($code, [
            "status"  => "error",
            "message" => $message,
            "error"   => $detail
        ]);
    }

    /**
     * Envoie la réponse HTTP avec les bons headers
     */
    private static function send(int $code, array $body): void {
        // Vider tout buffer de sortie parasite
        if (ob_get_length()) ob_clean();

        http_response_code($code);
        header("Content-Type: application/json; charset=utf-8");
        header("X-Content-Type-Options: nosniff");
        header("Cache-Control: no-store, no-cache");
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, OPTIONS");
        header("Access-Control-Allow-Headers: X-Bank-ID, X-API-Key, Content-Type");

        echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
}