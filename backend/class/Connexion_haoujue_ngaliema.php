<?php
class Connexion_haoujue_ngaliema {

    private $host = "localhost";
    private $dbname = "haojue_ngaliema";
    private $username = "root";
    private $password = "";
    protected $pdo;

    public function __construct() {
        try {
            $this->pdo = new PDO("mysql:host={$this->host};dbname={$this->dbname}", $this->username, $this->password);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            throw new Exception("Erreur de connexion à la base Haojue Ngaliema : " . $e->getMessage());
        }
    }
}
?>
