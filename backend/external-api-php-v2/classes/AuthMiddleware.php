<?php

require_once __DIR__ . '/Connexion.php';
require_once __DIR__ . '/Response.php';

/**
 * AuthMiddleware — Authentification des partenaires bancaires
 * 
 * Hérite de Connexion pour interroger la base.
 * Vérifie les headers X-Bank-ID et X-API-Key à chaque requête.
 */
class AuthMiddleware extends Connexion {

    /** Données du partenaire authentifié (rempli après handle()) */
    private array $banque = [];

    /**
     * Point d'entrée : authentifie la requête courante
     * Retourne les données du partenaire ou envoie une erreur JSON
     */
    public function handle(): array {
        $bankId = $this->getHeader("X-Bank-ID");
        $apiKey = $this->getHeader("X-API-Key");

        // ── 1. Headers obligatoires ──────────────────────────────────────────
        if (empty($bankId) || empty($apiKey)) {
            Response::error(
                "Headers manquants",
                "Les headers X-Bank-ID et X-API-Key sont obligatoires",
                401
            );
        }

        // ── 2. Chercher le partenaire en base ────────────────────────────────
        $stmt = $this->pdo->prepare("
            SELECT
                bp.id,
                bp.partenaire_id,
                bp.bank_id,
                bp.limite_transaction_journaliere,
                bp.limite_transaction_mensuelle,
                bp.montant_minimum,
                bp.montant_maximum,
                bp.date_expiration,
                bp.ip_autorisees,
                bp.actif,
                bp.suspendu,
                COALESCE(bp.raison_suspension, '') AS raison_suspension
            FROM banques_partenaire bp
            WHERE bp.bank_id = :bank_id
              AND bp.api_key = :api_key
            LIMIT 1
        ");
        $stmt->execute([":bank_id" => $bankId, ":api_key" => $apiKey]);
        $banque = $stmt->fetch();

        // Credentials inconnus — ne pas révéler lequel est faux
        if (!$banque) {
            error_log("[AUTH] Credentials invalides — bank_id: {$bankId}");
            Response::error("Authentification échouée", "Credentials invalides", 401);
        }

        // ── 3. Compte actif ? ────────────────────────────────────────────────
        if (!(bool)$banque["actif"]) {
            Response::error("Accès refusé", "Ce compte partenaire est désactivé", 403);
        }

        // ── 4. Compte suspendu ? ─────────────────────────────────────────────
        if ((bool)$banque["suspendu"]) {
            Response::error("Compte suspendu", "Raison : " . $banque["raison_suspension"], 403);
        }

        // ── 5. Credentials expirés ? ─────────────────────────────────────────
        if (!empty($banque["date_expiration"])) {
            if (new DateTime() > new DateTime($banque["date_expiration"])) {
                $exp = (new DateTime($banque["date_expiration"]))->format("d/m/Y");
                Response::error("Credentials expirés", "Vos credentials ont expiré le {$exp}", 403);
            }
        }

        // ── 6. IP whitelist ? ────────────────────────────────────────────────
        if (!empty($banque["ip_autorisees"])) {
            $ipsAutorisees = json_decode($banque["ip_autorisees"], true) ?? [];
            if (!empty($ipsAutorisees) && !in_array($this->getClientIp(), $ipsAutorisees, true)) {
                Response::error(
                    "IP non autorisée",
                    "Votre IP {$this->getClientIp()} n'est pas dans la liste autorisée",
                    403
                );
            }
        }

        // ── 7. Mettre à jour le dernier accès ────────────────────────────────
        $this->updateDernierAcces((int)$banque["id"]);

        // ── 8. Enregistrer la connexion pour audit ───────────────────────────
        $this->logConnexion((int)$banque["id"]);

        $this->banque = $banque;
        return $banque;
    }

    /**
     * Vérifie que le montant est dans les limites du partenaire
     * Doit être appelé après handle()
     */
    public function verifierMontant(float $montant): void {
        if (empty($this->banque)) return;

        $min = (float)$this->banque["montant_minimum"];
        $max = (float)$this->banque["montant_maximum"];

        if ($montant < $min) {
            Response::error(
                "Montant inférieur au minimum autorisé",
                sprintf("Montant %.2f inférieur au minimum de %.2f", $montant, $min),
                403
            );
        }

        if ($montant > $max) {
            Response::error(
                "Montant supérieur au maximum autorisé",
                sprintf("Montant %.2f supérieur au maximum de %.2f", $montant, $max),
                403
            );
        }
    }

    // ── Méthodes privées ─────────────────────────────────────────────────────

    private function updateDernierAcces(int $banqueId): void {
        try {
            $stmt = $this->pdo->prepare(
                "UPDATE banques_partenaire SET dernier_acces = NOW() WHERE id = :id"
            );
            $stmt->execute([":id" => $banqueId]);
        } catch (Exception $e) {
            error_log("[AUTH] Erreur mise à jour dernier_acces: " . $e->getMessage());
        }
    }

    private function logConnexion(int $banqueId): void {
        try {
            $stmt = $this->pdo->prepare(
                "INSERT INTO connexions_bancaires (banque_id, ip, user_agent)
                 VALUES (:bid, :ip, :ua)"
            );
            $stmt->execute([
                ":bid" => $banqueId,
                ":ip"  => $this->getClientIp(),
                ":ua"  => $_SERVER["HTTP_USER_AGENT"] ?? "unknown"
            ]);
        } catch (Exception $e) {
            error_log("[AUTH] Erreur log connexion: " . $e->getMessage());
        }
    }

    /** Récupère l'IP réelle du client (gère les proxies Nginx) */
    private function getClientIp(): string {
        foreach (["HTTP_X_FORWARDED_FOR", "HTTP_X_REAL_IP", "REMOTE_ADDR"] as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = trim(explode(",", $_SERVER[$header])[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
            }
        }
        return "0.0.0.0";
    }

    /** Récupère un header HTTP (PHP le transforme en HTTP_X_BANK_ID etc.) */
    private function getHeader(string $name): string {
        $key = "HTTP_" . strtoupper(str_replace("-", "_", $name));
        return trim($_SERVER[$key] ?? "");
    }
}