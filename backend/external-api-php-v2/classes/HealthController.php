<?php

require_once __DIR__ . '/Connexion.php';
require_once __DIR__ . '/Response.php';

class HealthController extends Connexion {

    public function check(): void {
        $dbStatus = "ok";

        try {
            $this->pdo->query("SELECT 1");
        } catch (Exception $e) {
            $dbStatus = "error: " . $e->getMessage();
        }

        Response::success([
            "api"     => "TSC-NPS External API",
            "version" => "1.0.0",
            "db"      => $dbStatus,
            "time"    => date("Y-m-d H:i:s")
        ], "API opérationnelle");
    }
}