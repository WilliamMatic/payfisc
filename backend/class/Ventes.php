<?php
require_once 'Connexion.php';

/**
 * Classe Ventes - Gestion complète des ventes non-grossistes
 */
class Ventes extends Connexion
{
    /**
     * Récupère les ventes non-grossistes avec pagination et filtres
     */
    public function getVentesNonGrossistes($params = [])
    {
        try {
            // Paramètres par défaut
            $page = isset($params['page']) ? max(1, (int)$params['page']) : 1;
            $limit = isset($params['limit']) ? min(max(1, (int)$params['limit']), 100) : 20;
            $offset = ($page - 1) * $limit;
            
            // Construire la requête SQL
            $sql = "SELECT 
                pi.id as paiement_id,
                pi.engin_id,
                pi.particulier_id,
                pi.montant,
                pi.montant_initial,
                pi.mode_paiement,
                pi.operateur,
                pi.numero_transaction,
                DATE_FORMAT(pi.date_paiement, '%d/%m/%Y %H:%i') as date_paiement,
                e.serie_item_id,
                e.serie_id,
                e.numero_plaque,
                e.utilisateur_id as createur_engin,
                e.site_id,
                p.telephone,
                p.nom,
                p.prenom,
                p.nif,
                p.email,
                p.rue as adresse,
                e.type_engin,
                e.marque,
                u.nom_complet as utilisateur_nom,
                (SELECT COUNT(*) FROM engins WHERE particulier_id = p.id) as nb_engins_particulier
                FROM paiements_immatriculation pi
                JOIN engins e ON pi.engin_id = e.id
                JOIN particuliers p ON pi.particulier_id = p.id
                JOIN utilisateurs u ON e.utilisateur_id = u.id
                WHERE pi.montant BETWEEN 1 AND 60 AND pi.engin_id IS NOT NULL AND pi.impot_id <> 18";
            
            // Filtres
            $conditions = [];
            $bindings = [];
            
            // Recherche par texte
            if (!empty($params['search'])) {
                $search = '%' . $params['search'] . '%';
                $conditions[] = "(p.nom LIKE :search OR p.prenom LIKE :search OR 
                                 p.telephone LIKE :search OR e.numero_plaque LIKE :search OR
                                 p.nif LIKE :search OR CONCAT(p.nom, ' ', p.prenom) LIKE :search)";
                $bindings[':search'] = $search;
            }
            
            // Filtre par date de début
            if (!empty($params['date_debut'])) {
                $conditions[] = "pi.date_paiement >= :date_debut";
                $bindings[':date_debut'] = $params['date_debut'];
            }
            
            // Filtre par date de fin
            if (!empty($params['date_fin'])) {
                $conditions[] = "pi.date_paiement <= :date_fin";
                $bindings[':date_fin'] = $params['date_fin'] . ' 23:59:59';
            }
            
            // Filtre par site
            if (!empty($params['site_id'])) {
                $conditions[] = "e.site_id = :site_id";
                $bindings[':site_id'] = $params['site_id'];
            }
            
            // Ajouter les conditions
            if (!empty($conditions)) {
                $sql .= " AND " . implode(" AND ", $conditions);
            }
            
            // Compter le nombre total
            $sqlCount = "SELECT COUNT(*) as total FROM ($sql) as t";
            $stmtCount = $this->pdo->prepare($sqlCount);
            $stmtCount->execute($bindings);
            $countResult = $stmtCount->fetch(PDO::FETCH_ASSOC);
            $total = (int)$countResult['total'];
            
            // Tri
            $orderBy = isset($params['order_by']) && in_array($params['order_by'], [
                'paiement_id', 'date_paiement', 'nom', 'prenom', 'numero_plaque', 'montant'
            ]) ? $params['order_by'] : 'pi.date_paiement';
            
            $orderDir = isset($params['order_dir']) && in_array(strtoupper($params['order_dir']), ['ASC', 'DESC']) 
                ? strtoupper($params['order_dir']) 
                : 'DESC';
            
            $sql .= " ORDER BY $orderBy $orderDir";
            
            // Pagination
            $sql .= " LIMIT :limit OFFSET :offset";
            $bindings[':limit'] = $limit;
            $bindings[':offset'] = $offset;
            
            // Exécuter la requête principale
            $stmt = $this->pdo->prepare($sql);
            
            // Bind des paramètres
            foreach ($bindings as $key => $value) {
                if ($key === ':limit' || $key === ':offset') {
                    $stmt->bindValue($key, $value, PDO::PARAM_INT);
                } else {
                    $stmt->bindValue($key, $value, PDO::PARAM_STR);
                }
            }
            
            $stmt->execute();
            $ventes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Calculer les totaux
            $montantTotal = 0;
            foreach ($ventes as $vente) {
                $montantTotal += (float)$vente['montant'];
            }
            
            return [
                "status" => "success",
                "data" => [
                    "ventes" => $ventes,
                    "pagination" => [
                        "total" => $total,
                        "page" => $page,
                        "limit" => $limit,
                        "totalPages" => ceil($total / $limit)
                    ]
                ]
            ];
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des ventes: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère les statistiques des ventes non-grossistes
     */
    public function getStatsVentes($params = [])
    {
        try {
            $sql = "SELECT 
                    COUNT(DISTINCT pi.id) as total_ventes,
                    SUM(pi.montant) as montant_total,
                    COUNT(DISTINCT pi.particulier_id) as clients_uniques,
                    AVG(pi.montant) as montant_moyen,
                    MIN(pi.date_paiement) as date_premiere,
                    MAX(pi.date_paiement) as date_derniere
                    FROM paiements_immatriculation pi
                    JOIN engins e ON pi.engin_id = e.id
                    JOIN particuliers p ON pi.particulier_id = p.id
                    WHERE pi.montant > 0 AND pi.engin_id IS NOT NULL AND pi.impot_id <> 18";
            
            $conditions = [];
            $bindings = [];
            
            // Filtres
            if (!empty($params['search'])) {
                $search = '%' . $params['search'] . '%';
                $conditions[] = "(p.nom LIKE :search OR p.prenom LIKE :search OR 
                                 p.telephone LIKE :search OR e.numero_plaque LIKE :search)";
                $bindings[':search'] = $search;
            }
            
            if (!empty($params['date_debut'])) {
                $conditions[] = "pi.date_paiement >= :date_debut";
                $bindings[':date_debut'] = $params['date_debut'];
            }
            
            if (!empty($params['date_fin'])) {
                $conditions[] = "pi.date_paiement <= :date_fin";
                $bindings[':date_fin'] = $params['date_fin'] . ' 23:59:59';
            }
            
            if (!empty($params['site_id'])) {
                $conditions[] = "e.site_id = :site_id";
                $bindings[':site_id'] = $params['site_id'];
            }
            
            if (!empty($conditions)) {
                $sql .= " AND " . implode(" AND ", $conditions);
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($bindings);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$stats) {
                $stats = [
                    'total_ventes' => 0,
                    'montant_total' => 0,
                    'clients_uniques' => 0,
                    'montant_moyen' => 0,
                    'date_premiere' => null,
                    'date_derniere' => null
                ];
            }
            
            return [
                "status" => "success",
                "data" => [
                    "total" => (int)$stats['total_ventes'],
                    "montantTotal" => (float)$stats['montant_total'],
                    "clientsUniques" => (int)$stats['clients_uniques'],
                    "montantMoyen" => (float)$stats['montant_moyen'],
                    "datePremiere" => $stats['date_premiere'],
                    "dateDerniere" => $stats['date_derniere']
                ]
            ];
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des statistiques: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime une vente non-grossiste (utilise la méthode d'annulation existante)
     */
    public function supprimerVente($paiementId, $utilisateurId, $raison = "Suppression via interface admin")
    {
        try {
            // Utiliser la méthode existante d'annulation d'immatriculation
            require_once 'Immatriculation.php';
            $immatriculationManager = new Immatriculation();
            
            return $immatriculationManager->annulerImmatriculation($paiementId, $utilisateurId, $raison);
            
        } catch (Exception $e) {
            error_log("Erreur lors de la suppression de la vente: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Exporte les ventes en format Excel
     */
    public function exporterExcel($params = [])
    {
        try {
            // Récupérer toutes les ventes sans pagination
            $params['limit'] = 10000; // Limite élevée
            $result = $this->getVentesNonGrossistes($params);
            
            if ($result['status'] !== 'success') {
                return $result;
            }
            
            $ventes = $result['data']['ventes'];
            
            // Créer le fichier Excel
            $filename = "ventes_non_grossistes_" . date('Y-m-d_H-i-s') . ".xlsx";
            $filepath = __DIR__ . "/../../exports/" . $filename;
            
            // Créer le répertoire d'export s'il n'existe pas
            if (!file_exists(__DIR__ . "/../../exports")) {
                mkdir(__DIR__ . "/../../exports", 0777, true);
            }
            
            // Utiliser une bibliothèque Excel (PhpSpreadsheet) - à installer
            // Pour l'instant, créons un fichier CSV simple
            
            $fp = fopen($filepath, 'w');
            
            // En-têtes
            fputcsv($fp, [
                'ID Paiement', 'Date Paiement', 'Client', 'Téléphone', 'NIF',
                'Numéro Plaque', 'Montant ($)', 'Mode Paiement', 'Opérateur',
                'Site', 'Agent', 'ID Engin', 'ID Particulier'
            ], ';');
            
            // Données
            foreach ($ventes as $vente) {
                fputcsv($fp, [
                    $vente['paiement_id'],
                    $vente['date_paiement'],
                    $vente['nom'] . ' ' . $vente['prenom'],
                    $vente['telephone'],
                    $vente['nif'] ?? '',
                    $vente['numero_plaque'],
                    number_format($vente['montant'], 2, ',', ' '),
                    $vente['mode_paiement'],
                    $vente['operateur'] ?? '',
                    $vente['site_nom'],
                    $vente['utilisateur_nom'],
                    $vente['engin_id'],
                    $vente['particulier_id']
                ], ';');
            }
            
            fclose($fp);
            
            return [
                "status" => "success",
                "data" => [
                    "filename" => $filename,
                    "filepath" => $filepath,
                    "url" => "/exports/" . $filename,
                    "count" => count($ventes)
                ]
            ];
            
        } catch (Exception $e) {
            error_log("Erreur lors de l'export Excel: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur lors de l'export: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste des sites disponibles
     */
    public function getSitesDisponibles()
    {
        try {
            $sql = "SELECT id, nom, code FROM sites WHERE actif = 1 ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            $sites = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                "status" => "success",
                "data" => $sites
            ];
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des sites: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }
}
?>