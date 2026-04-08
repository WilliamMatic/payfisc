<?php
require_once 'Connexion.php';

/**
 * Classe Stats - Gestion des statistiques globales du système
 */
class Stats extends Connexion
{
    /**
     * Récupère les statistiques globales du système
     *
     * @return array Tableau avec les statistiques
     */
    public function getGlobalStats()
    {
        try {
            // Total contribuables (particuliers + entreprises actifs)
            $sqlContribuables = "SELECT 
                                (SELECT COUNT(*) FROM particuliers) as total_particuliers,
                                (SELECT COUNT(*) FROM entreprises) as total_entreprises";
            
            $stmt = $this->pdo->query($sqlContribuables);
            $contribuables = $stmt->fetch(PDO::FETCH_ASSOC);
            $totalContribuables = intval($contribuables['total_particuliers']) + intval($contribuables['total_entreprises']);

            // Total provinces (depuis la table provinces)
            $sqlProvinces = "SELECT COUNT(*) as total_provinces FROM provinces";
            $stmt = $this->pdo->query($sqlProvinces);
            $provinces = $stmt->fetch(PDO::FETCH_ASSOC);
            $totalProvinces = intval($provinces['total_provinces']);

            // Total paiements (paiements complétés)
            $sqlPaiements = "SELECT COUNT(*) as total_paiements FROM paiements_immatriculation WHERE etat = 0";
            $stmt = $this->pdo->query($sqlPaiements);
            $paiements = $stmt->fetch(PDO::FETCH_ASSOC);
            $totalPaiements = intval($paiements['total_paiements']);

            // Total sites (depuis la table sites)
            $sqlSites = "SELECT COUNT(*) as total_sites FROM sites";
            $stmt = $this->pdo->query($sqlSites);
            $sites = $stmt->fetch(PDO::FETCH_ASSOC);
            $totalSites = intval($sites['total_sites']);

            // Formater les résultats
            $formattedStats = [
                'total_contribuables' => $totalContribuables,
                'total_provinces' => $totalProvinces,
                'total_paiements' => $totalPaiements,
                'total_sites' => $totalSites
            ];

            return [
                "status" => "success",
                "data" => $formattedStats,
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des statistiques globales: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des statistiques: " . $e->getMessage(),
            ];
        }
    }
}
?>