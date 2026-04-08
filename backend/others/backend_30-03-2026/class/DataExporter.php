<?php
require_once 'Connexion.php';

/**
 * Classe DataExporter - Exporte toutes les données des tables en JSON
 */
class DataExporter extends Connexion
{
    /**
     * Récupère toutes les données des tables principales au format JSON
     *
     * @return array Tableau avec toutes les données
     */
    public function getAllDataForAI()
    {
        try {
            $allData = [];
            
            // Récupérer les données des impôts
            $sqlImpots = "SELECT * FROM impots WHERE actif = 1";
            $stmtImpots = $this->pdo->query($sqlImpots);
            $allData['impots'] = $stmtImpots->fetchAll(PDO::FETCH_ASSOC);
            
            // Récupérer les données des déclarations
            $sqlDeclarations = "SELECT d.*, i.nom as nom_impot 
                               FROM declarations d 
                               LEFT JOIN impots i ON d.id_impot = i.id";
            $stmtDeclarations = $this->pdo->query($sqlDeclarations);
            $allData['declarations'] = $stmtDeclarations->fetchAll(PDO::FETCH_ASSOC);
            
            // Récupérer les données des paiements
            $sqlPaiements = "SELECT p.*, d.reference, d.nif_contribuable, d.type_contribuable
                            FROM paiements p
                            LEFT JOIN declarations d ON p.id_declaration = d.id";
            $stmtPaiements = $this->pdo->query($sqlPaiements);
            $allData['paiements'] = $stmtPaiements->fetchAll(PDO::FETCH_ASSOC);
            
            // Récupérer les données des particuliers
            $sqlParticuliers = "SELECT * FROM particuliers WHERE actif = 1";
            $stmtParticuliers = $this->pdo->query($sqlParticuliers);
            $allData['particuliers'] = $stmtParticuliers->fetchAll(PDO::FETCH_ASSOC);
            
            // Récupérer les données des entreprises
            $sqlEntreprises = "SELECT * FROM entreprises WHERE actif = 1";
            $stmtEntreprises = $this->pdo->query($sqlEntreprises);
            $allData['entreprises'] = $stmtEntreprises->fetchAll(PDO::FETCH_ASSOC);
            
            // Ajouter des statistiques globales
            // $dashboard = new Dashboard();
            // $stats = $dashboard->getDashboardStats();
            // if ($stats['status'] === 'success') {
            //     $allData['statistiques'] = $stats['data'];
            // }

            // $allData['statistiques'] = $stats['data'];
            
            return [
                "status" => "success", 
                "data" => $allData
            ];
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des données pour l'IA: " . $e->getMessage());
            return [
                "status" => "error", 
                "message" => "Erreur système lors de la récupération des données pour l'IA"
            ];
        }
    }
}
?>