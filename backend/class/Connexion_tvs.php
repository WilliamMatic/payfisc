<?php
class Connexion_tvs {

    private $host = "localhost";
    private $dbname = "tsc_system__db";
    private $username = "root";
    private $password = "";
    protected $pdo;

    public function __construct() {
        try {
            $this->pdo = new PDO("mysql:host={$this->host};dbname={$this->dbname}", $this->username, $this->password);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            throw new Exception("Erreur de connexion à la base TVS : " . $e->getMessage());
        }
    }
}
?>
