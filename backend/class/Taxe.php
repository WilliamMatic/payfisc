<?php
require_once 'Connexion.php';

/**
 * Classe Taxe - Gestion des taxes
 */
class Taxe extends Connexion
{
    /**
     * Récupère la liste de toutes les taxes
     */
    public function listerTaxes()
    {
        try {
            $sql = "SELECT id, nom, description, prix AS taux, actif, 
                    DATE_FORMAT(date_creation, '%d/%m/%Y') as date_creation 
                    FROM impots 
                    ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des taxes: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste des taxes actives
     */
    public function listerTaxesActives()
    {
        try {
            $sql = "SELECT id, nom, description, prix AS taux, actif, 
                    DATE_FORMAT(date_creation, '%d/%m/%Y') as date_creation 
                    FROM impots 
                    WHERE actif = 1
                    ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des taxes actives: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère une taxe par son ID
     */
    public function getTaxeById($id)
    {
        try {
            $sql = "SELECT id, nom, description, prix AS taux, actif, 
                    DATE_FORMAT(date_creation, '%d/%m/%Y') as date_creation 
                    FROM impots 
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$result) {
                return ["status" => "error", "message" => "Taxe non trouvée."];
            }

            return ["status" => "success", "data" => $result];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération de la taxe: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }
}
?>