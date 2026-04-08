<?php
require_once 'Connexion.php';

/**
 * Classe CarteReprintManager - Gestion complète des cartes à réimprimer
 */
class CarteReprintManager extends Connexion
{
    /**
     * Récupère l'ID du site par son nom
     */
    public function getSiteIdByName($siteNom)
    {
        try {
            $sql = "SELECT id FROM sites WHERE nom = :site_nom LIMIT 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':site_nom' => $siteNom]);
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ? $result['id'] : null;
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération de l'ID du site: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Récupère les cartes à réimprimer avec pagination et filtre par site
     */
    public function getCartesReprint($siteId, $page = 1, $limit = 10, $searchTerm = '', $statusFilter = 'all')
    {
        try {
            $offset = ($page - 1) * $limit;
            
            // Construire la requête avec filtres
            $whereConditions = ["cr.site_id = :site_id"];
            $params = [':site_id' => $siteId];
            
            // Filtrer par status
            if ($statusFilter !== 'all') {
                $whereConditions[] = "cr.status = :status";
                $params[':status'] = $statusFilter;
            }
            
            // Recherche
            if (!empty($searchTerm)) {
                $whereConditions[] = "(cr.nom_proprietaire LIKE :search OR cr.numero_plaque LIKE :search OR cr.nif_proprietaire LIKE :search)";
                $params[':search'] = "%$searchTerm%";
            }
            
            $whereClause = count($whereConditions) > 0 ? "WHERE " . implode(" AND ", $whereConditions) : "";
            
            // Requête pour les données
            $sql = "SELECT 
                    cr.id AS id_primaire,
                    cr.nom_proprietaire,
                    cr.adresse_proprietaire,
                    cr.nif_proprietaire,
                    cr.annee_mise_circulation,
                    cr.numero_plaque,
                    cr.marque_vehicule,
                    cr.usage_vehicule,
                    cr.numero_chassis,
                    cr.numero_moteur,
                    cr.annee_fabrication,
                    cr.couleur_vehicule,
                    cr.puissance_vehicule,
                    cr.utilisateur_id AS id,
                    cr.site_id,
                    cr.status,
                    cr.date_creation,
                    cr.id_paiement AS id,             -- id utilisé pour le front
                    u.nom_complet AS utilisateur_nom,
                    s.nom AS site_nom
                    FROM carte_reprint cr
                    LEFT JOIN utilisateurs u ON cr.utilisateur_id = u.id
                    LEFT JOIN sites s ON cr.site_id = s.id
                    $whereClause
                    ORDER BY cr.date_creation DESC
                    LIMIT :limit OFFSET :offset";
            
            $stmt = $this->pdo->prepare($sql);
            
            // Ajouter les paramètres
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            
            $stmt->execute();
            $cartes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Requête pour le total
            $countSql = "SELECT COUNT(*) as total 
                        FROM carte_reprint cr
                        $whereClause";
            
            $countStmt = $this->pdo->prepare($countSql);
            foreach ($params as $key => $value) {
                if ($key !== ':limit' && $key !== ':offset') {
                    $countStmt->bindValue($key, $value);
                }
            }
            $countStmt->execute();
            $totalResult = $countStmt->fetch(PDO::FETCH_ASSOC);
            $total = $totalResult['total'];
            
            return [
                'cartes' => $cartes,
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'totalPages' => ceil($total / $limit)
            ];
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des cartes à réimprimer: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Met à jour le status d'une carte (à imprimer → déjà imprimé)
     */
    public function mettreAJourstatusCarte($carteId)
    {
        try {
            $sql = "UPDATE carte_reprint 
                    SET status = 1 
                    WHERE id = :id";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $carteId]);
            
            return $stmt->rowCount() > 0;
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la mise à jour du status de la carte: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Insère une nouvelle carte dans la table carte_reprint
     */
    public function insererCarteReprint($data)
    {
        try {
            $sql = "INSERT INTO carte_reprint (
                nom_proprietaire, adresse_proprietaire, nif_proprietaire,
                annee_mise_circulation, numero_plaque, marque_vehicule, 
                usage_vehicule, numero_chassis, numero_moteur, annee_fabrication,
                couleur_vehicule, puissance_vehicule, utilisateur_id, site_id, status, date_creation
            ) VALUES (
                :nom_proprietaire, :adresse_proprietaire, :nif_proprietaire,
                :annee_mise_circulation, :numero_plaque, :marque_vehicule, 
                :usage_vehicule, :numero_chassis, :numero_moteur, :annee_fabrication,
                :couleur_vehicule, :puissance_vehicule, :utilisateur_id, :site_id, :status, NOW()
            )";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom_proprietaire' => $data['nom_proprietaire'] ?? '',
                ':adresse_proprietaire' => $data['adresse_proprietaire'] ?? '',
                ':nif_proprietaire' => $data['nif_proprietaire'] ?? '-',
                ':annee_mise_circulation' => $data['annee_mise_circulation'] ?? null,
                ':numero_plaque' => $data['numero_plaque'] ?? '',
                ':marque_vehicule' => $data['marque_vehicule'] ?? '',
                ':usage_vehicule' => $data['usage_vehicule'] ?? '',
                ':numero_chassis' => $data['numero_chassis'] ?? '',
                ':numero_moteur' => $data['numero_moteur'] ?? '',
                ':annee_fabrication' => $data['annee_fabrication'] ?? null,
                ':couleur_vehicule' => $data['couleur_vehicule'] ?? '',
                ':puissance_vehicule' => $data['puissance_vehicule'] ?? '',
                ':utilisateur_id' => $data['utilisateur_id'],
                ':site_id' => $data['site_id'],
                ':status' => $data['status'] ?? 0
            ]);

            return $this->pdo->lastInsertId();
            
        } catch (PDOException $e) {
            error_log("Erreur lors de l'insertion dans carte_reprint: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Supprime une carte de la table carte_reprint
     */
    public function supprimerCarteReprint($carteId)
    {
        try {
            $sql = "DELETE FROM carte_reprint WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $carteId]);
            
            return $stmt->rowCount() > 0;
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de la carte: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Récupère les statistiques des cartes par status
     */
    public function getStatistiquesCartes($siteId, $searchTerm = '')
    {
        try {
            $sql = "SELECT status, COUNT(*) as count 
                    FROM carte_reprint 
                    WHERE site_id = :site_id";
            
            $params = [':site_id' => $siteId];
            
            if (!empty($searchTerm)) {
                $sql .= " AND (nom_proprietaire LIKE :search OR numero_plaque LIKE :search OR nif_proprietaire LIKE :search)";
                $params[':search'] = "%$searchTerm%";
            }
            
            $sql .= " GROUP BY status";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Initialiser les statistiques
            $stats = [
                'total' => 0,
                'aImprimer' => 0,
                'dejaImprime' => 0
            ];
            
            // Calculer les totaux
            foreach ($results as $row) {
                $count = (int)$row['count'];
                $stats['total'] += $count;
                
                if ($row['status'] == 0) {
                    $stats['aImprimer'] = $count;
                } else if ($row['status'] == 1) {
                    $stats['dejaImprime'] = $count;
                }
            }
            
            return $stats;
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des statistiques: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Formate les dates des cartes
     */
    public function formaterDatesCartes($cartes)
    {
        foreach ($cartes as &$carte) {
            if (isset($carte['date_creation'])) {
                try {
                    $date = new DateTime($carte['date_creation']);
                    $carte['date_creation_formatted'] = $date->format('d/m/Y');
                } catch (Exception $e) {
                    $carte['date_creation_formatted'] = 'Date invalide';
                }
            }
        }
        
        return $cartes;
    }
}
?>