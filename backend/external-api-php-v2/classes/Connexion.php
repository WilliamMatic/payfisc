<?php

/**
 * Connexion — Classe de base PDO
 * 
 * Toutes les classes métier héritent de cette classe
 * pour accéder à la base de données via $this->pdo
 */
class Connexion {
    private   $host     = "localhost";
    private   $dbname   = "payfisc";
    private   $username = "root";
    private   $password = "";
    protected $pdo;

    public function __construct() {
        try {
            $this->pdo = new PDO(
                "mysql:host={$this->host};dbname={$this->dbname};charset=utf8mb4",
                $this->username,
                $this->password
            );
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE,            PDO::ERRMODE_EXCEPTION);
            $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $this->pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES,   false);
        } catch (PDOException $e) {
            die(json_encode([
                "status"  => "error",
                "message" => "Erreur de connexion à la base de données",
                "error"   => $e->getMessage()
            ]));
        }
    }
}