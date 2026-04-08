<?php
require_once 'Connexion.php';

/**
 * Classe Plaque - Gestion complète des plaques
 */
class Plaque extends Connexion
{
    /**
     * Récupère les plaques d'un particulier avec pagination
     */
    public function listerPlaquesParParticulier($particulierId, $page = 1, $limit = 20, $statut = null, $searchTerm = null)
    {
        try {
            // Validation de l'ID du particulier
            if (empty($particulierId) || !is_numeric($particulierId)) {
                return ['status' => 'error', 'message' => 'ID du particulier invalide.'];
            }
            
            $offset = ($page - 1) * $limit;
            
            // Construction de la requête de base
            $sql = "SELECT pa.id, pa.numero_plaque, pa.statut, pa.date_attribution,
                           p.nom, p.prenom, p.rue, p.ville, p.province,
                           e.marque, '' as modele, e.energie, e.annee_fabrication, 
                           e.annee_circulation, e.couleur, e.puissance_fiscal,
                           e.usage_engin, e.numero_chassis, e.numero_moteur,
                           e.type_engin
                    FROM plaques_attribuees pa
                    LEFT JOIN particuliers p ON pa.particulier_id = p.id
                    LEFT JOIN engins e ON pa.numero_plaque = e.numero_plaque
                    WHERE pa.particulier_id = :particulier_id";
            
            $params = [':particulier_id' => $particulierId];
            
            // Ajout des filtres
            if ($statut !== null) {
                $sql .= " AND pa.statut = :statut";
                $params[':statut'] = $statut;
            }
            
            if ($searchTerm) {
                $sql .= " AND (pa.numero_plaque LIKE :search 
                         OR p.nom LIKE :search 
                         OR p.prenom LIKE :search
                         OR e.marque LIKE :search)";
                $params[':search'] = '%' . $searchTerm . '%';
            }
            
            $sql .= " ORDER BY pa.date_attribution DESC";
            
            // Requête pour le total
            $sqlCount = "SELECT COUNT(*) as total FROM plaques_attribuees pa 
                         LEFT JOIN particuliers p ON pa.particulier_id = p.id
                         LEFT JOIN engins e ON pa.numero_plaque = e.numero_plaque
                         WHERE pa.particulier_id = :particulier_id";
            $paramsCount = [':particulier_id' => $particulierId];
            
            if ($statut !== null) {
                $sqlCount .= " AND pa.statut = :statut";
                $paramsCount[':statut'] = $statut;
            }
            
            if ($searchTerm) {
                $sqlCount .= " AND (pa.numero_plaque LIKE :search 
                               OR p.nom LIKE :search 
                               OR p.prenom LIKE :search
                               OR e.marque LIKE :search)";
                $paramsCount[':search'] = '%' . $searchTerm . '%';
            }
            
            $stmtCount = $this->pdo->prepare($sqlCount);
            $stmtCount->execute($paramsCount);
            $totalResult = $stmtCount->fetch(PDO::FETCH_ASSOC);
            $total = $totalResult['total'];
            
            // Requête paginée
            $sql .= " LIMIT :limit OFFSET :offset";
            $stmt = $this->pdo->prepare($sql);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
            
            $stmt->execute();
            $plaques = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Formatage des données
            $formattedPlaques = [];
            foreach ($plaques as $plaque) {
                $formattedPlaques[] = [
                    'id' => $plaque['id'],
                    'numero' => $plaque['numero_plaque'],
                    'statut' => $plaque['statut'] == 1 ? 'livre' : 'non-livre',
                    'date_attribution' => $plaque['date_attribution'],
                    'assujetti' => $plaque['nom'] ? [
                        'nom' => $plaque['nom'],
                        'prenom' => $plaque['prenom'],
                        'adresse' => trim(implode(', ', array_filter([$plaque['rue'], $plaque['ville'], $plaque['province']])), ', '),
                    ] : null,
                    'moto' => $plaque['marque'] ? [
                        'marque' => $plaque['marque'],
                        'modele' => $plaque['modele'],
                        'energie' => $plaque['energie'],
                        'anneeFabrication' => $plaque['annee_fabrication'],
                        'anneeCirculation' => $plaque['annee_circulation'],
                        'couleur' => $plaque['couleur'],
                        'puissanceFiscale' => (int)$plaque['puissance_fiscal'],
                        'usage' => $plaque['usage_engin'],
                        'numeroChassis' => $plaque['numero_chassis'],
                        'numeroMoteur' => $plaque['numero_moteur'],
                        'typeEngin' => $plaque['type_engin']
                    ] : null
                ];
            }
            
            return [
                'status' => 'success',
                'data' => [
                    'plaques' => $formattedPlaques,
                    'pagination' => [
                        'page' => $page,
                        'limit' => $limit,
                        'total' => $total,
                        'pages' => ceil($total / $limit)
                    ]
                ]
            ];
            
        } catch (PDOException $e) {
            error_log("Erreur lors du listing des plaques: " . $e->getMessage());
            return ['status' => 'error', 'message' => 'Erreur système: ' . $e->getMessage()];
        }
    }

    /**
     * Récupère les statistiques des plaques
     */
    public function getStatistiquesPlaques($particulierId)
    {
        try {
            // Validation de l'ID du particulier
            if (empty($particulierId) || !is_numeric($particulierId)) {
                return ['status' => 'error', 'message' => 'ID du particulier invalide.'];
            }
            
            $sql = "SELECT 
                    SUM(CASE WHEN statut = 0 THEN 1 ELSE 0 END) as non_livrees,
                    SUM(CASE WHEN statut = 1 THEN 1 ELSE 0 END) as livrees,
                    COUNT(*) as total
                    FROM plaques_attribuees 
                    WHERE particulier_id = :particulier_id";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':particulier_id' => $particulierId]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return [
                'status' => 'success',
                'data' => [
                    'nonLivrees' => (int)$stats['non_livrees'],
                    'livrees' => (int)$stats['livrees'],
                    'total' => (int)$stats['total']
                ]
            ];
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des statistiques: " . $e->getMessage());
            return ['status' => 'error', 'message' => 'Erreur système: ' . $e->getMessage()];
        }
    }

    /**
     * Vérifie si le particulier existe
     */
    public function particulierExiste($particulierId)
    {
        try {
            $sql = "SELECT id, nom, prenom FROM particuliers WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $particulierId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du particulier: " . $e->getMessage());
            return false;
        }
    }
}