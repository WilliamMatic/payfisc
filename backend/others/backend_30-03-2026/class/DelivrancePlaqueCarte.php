<?php
require_once 'Connexion.php';

/**
 * Classe DelivrancePlaqueCarte - Gestion complète de la délivrance plaque + carte
 */
class DelivrancePlaqueCarte extends Connexion
{
    /**
     * Vérifie et récupère les données pour la délivrance
     */
    public function verifierDelivrance($reference, $numeroPlaque)
    {
        try {
            // Vérification dans paiements_immatriculation
            $sqlPaiement = "SELECT pi.*, pi.id AS idpaiement, p.*, e.*
                           FROM paiements_immatriculation pi
                           JOIN particuliers p ON pi.particulier_id = p.id
                           JOIN engins e ON pi.engin_id = e.id
                           WHERE pi.id = :reference 
                           AND e.numero_plaque = :numero_plaque
                           AND pi.etat IN (0,1)";
            
            $stmt = $this->pdo->prepare($sqlPaiement);
            $stmt->execute([
                ':reference' => $reference,
                ':numero_plaque' => $numeroPlaque
            ]);
            
            $resultat = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$resultat) {
                return ["status" => "error", "message" => "Aucune donnée trouvée pour cette référence et plaque"];
            }
            
            // Formatage des données
            $donnees = [
                "paiement" => [
                    "id" => $resultat['idpaiement'],
                    "impot_id" => $resultat['impot_id'],
                    "montant" => $resultat['montant'],
                    "mode_paiement" => $resultat['mode_paiement'],
                    "statut" => $resultat['statut'],
                    "etat" => $resultat['etat'],
                    "date_paiement" => $resultat['date_paiement']
                ],
                "particulier" => [
                    "id" => $resultat['particulier_id'],
                    "nom" => $resultat['nom'],
                    "prenom" => $resultat['prenom'],
                    "telephone" => $resultat['telephone'],
                    "email" => $resultat['email'],
                    "rue" => $resultat['rue'],
                    "ville" => $resultat['ville'],
                    "code_postal" => $resultat['code_postal'],
                    "province" => $resultat['province'],
                    "nif" => $resultat['nif'],
                    "id_national" => $resultat['id_national']
                ],
                "engin" => [
                    "id" => $resultat['engin_id'],
                    "numero_plaque" => $resultat['numero_plaque'],
                    "type_engin" => $resultat['type_engin'],
                    "marque" => $resultat['marque'],
                    "energie" => $resultat['energie'],
                    "annee_fabrication" => $resultat['annee_fabrication'],
                    "annee_circulation" => $resultat['annee_circulation'],
                    "couleur" => $resultat['couleur'],
                    "puissance_fiscal" => $resultat['puissance_fiscal'],
                    "usage_engin" => $resultat['usage_engin'],
                    "numero_chassis" => $resultat['numero_chassis'],
                    "numero_moteur" => $resultat['numero_moteur']
                ]
            ];
            
            return ["status" => "success", "data" => $donnees];
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification délivrance: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Marque la délivrance comme complétée
     */
    public function completerDelivrance($paiementId)
    {
        try {
            $this->pdo->beginTransaction();

            // Mettre à jour l'état du paiement à 0 (délivré)
            $sql = "UPDATE paiements_immatriculation SET etat = 0 WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $paiementId]);

            $this->pdo->commit();

            // Log d'audit
            $this->logAudit("Délivrance complétée pour paiement ID: $paiementId");

            return ["status" => "success", "message" => "Délivrance marquée comme complétée"];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de la complétion délivrance: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère les données pour l'impression
     */
    public function getDonneesImpression($paiementId)
    {
        try {
            $sql = "SELECT 
                    p.nom, p.prenom, 
                    CONCAT(p.rue, ', ', p.ville, ', ', p.province) as adresse,
                    p.nif,
                    e.numero_plaque, e.annee_circulation, e.marque, e.type_engin,
                    e.usage_engin as usage_engin, e.numero_chassis, e.numero_moteur,
                    e.annee_fabrication, e.couleur, e.puissance_fiscal, e.energie
                FROM paiements_immatriculation pi
                JOIN particuliers p ON pi.particulier_id = p.id
                JOIN engins e ON pi.engin_id = e.id
                WHERE pi.id = :paiement_id";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':paiement_id' => $paiementId]);
            
            $resultat = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$resultat) {
                return ["status" => "error", "message" => "Données non trouvées pour l'impression"];
            }
            
            return ["status" => "success", "data" => $resultat];
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération données impression: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Log une action dans le journal d'audit
     */
    public function logAudit($message)
    {
        $userId = $_SESSION['user_id'] ?? 'system';
        $userType = $_SESSION['user_type'] ?? 'system';
        
        $sql = "INSERT INTO audit_log (user_id, user_type, action, timestamp) 
                VALUES (:user_id, :user_type, :action, NOW())";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':user_type' => $userType,
            ':action' => $message
        ]);
    }
}