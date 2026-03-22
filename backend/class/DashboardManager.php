<?php
require_once 'Connexion.php';

/**
 * Classe DashboardManager - Gestion du dashboard des contribuables
 */
class DashboardManager extends Connexion
{
    /**
     * Récupère les informations complètes du contribuable connecté
     *
     * @param int $userId ID de l'utilisateur
     * @param string $userType Type d'utilisateur (particulier/entreprise)
     * @return array Tableau avec statut et données utilisateur
     */
    public function getContribuableInfo($userId, $userType)
    {
        try {
            if ($userType === 'particulier') {
                $sql = "SELECT 
                            id, nom, prenom, nif, email, telephone,
                            CONCAT(prenom, ' ', nom) as display_name,
                            'particulier' as type
                        FROM particuliers 
                        WHERE id = :id AND actif = 1";
            } else {
                $sql = "SELECT 
                            id, raison_sociale, nif, email, telephone, representant_legal,
                            raison_sociale as display_name,
                            'entreprise' as type
                        FROM entreprises 
                        WHERE id = :id AND actif = 1";
            }

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                return [
                    "success" => true,
                    "user" => $user
                ];
            } else {
                return [
                    "success" => false,
                    "message" => "Contribuable non trouvé"
                ];
            }

        } catch (PDOException $e) {
            error_log("Erreur récupération info contribuable: " . $e->getMessage());
            return [
                "success" => false,
                "message" => "Erreur système lors de la récupération des informations"
            ];
        }
    }

    /**
     * Récupère le total des paiements du contribuable
     *
     * @param string $nif NIF du contribuable
     * @return array Tableau avec statut et total payé
     */
    public function getTotalPayments($nif)
    {
        try {
            $sql = "SELECT COALESCE(SUM(p.montant), 0) as total_paye
                    FROM paiements p
                    INNER JOIN declarations d ON p.id_declaration = d.id
                    WHERE d.nif_contribuable = :nif 
                    AND p.statut = 'complete'
                    AND d.statut = 'payé'";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':nif' => $nif]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return [
                "success" => true,
                "total_paye" => (float)$result['total_paye']
            ];

        } catch (PDOException $e) {
            error_log("Erreur récupération total paiements: " . $e->getMessage());
            return [
                "success" => false,
                "message" => "Erreur système lors de la récupération du total des paiements",
                "total_paye" => 0
            ];
        }
    }

    /**
     * Récupère l'historique des paiements (5 derniers)
     *
     * @param string $nif NIF du contribuable
     * @param int $limit Nombre maximum de résultats
     * @return array Tableau avec statut et historique des paiements
     */
    public function getPaymentHistory($nif, $limit = 5)
    {
        try {
            $sql = "SELECT 
                        p.id,
                        p.reference_paiement as reference,
                        d.reference as declaration_reference,
                        i.nom as description,
                        p.montant as amount,
                        CASE 
                            WHEN p.statut = 'complete' THEN 'Payé'
                            ELSE 'En attente'
                        END as status,
                        DATE_FORMAT(p.date_paiement, '%Y-%m-%d') as date,
                        p.methode_paiement
                    FROM paiements p
                    INNER JOIN declarations d ON p.id_declaration = d.id
                    INNER JOIN impots i ON d.id_impot = i.id
                    WHERE d.nif_contribuable = :nif
                    ORDER BY p.date_paiement DESC, p.date_creation DESC
                    LIMIT :limit";

            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':nif', $nif, PDO::PARAM_STR);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "success" => true,
                "payments" => $payments
            ];

        } catch (PDOException $e) {
            error_log("Erreur récupération historique paiements: " . $e->getMessage());
            return [
                "success" => false,
                "message" => "Erreur système lors de la récupération de l'historique",
                "payments" => []
            ];
        }
    }
}
?>