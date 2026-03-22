<?php
require_once 'Connexion.php';

/**
 * Classe CommandesPlaques - Gestion complète des commandes de plaques
 */
class CommandesPlaques extends Connexion
{
    /**
     * Récupère les commandes de plaques avec pagination et filtres
     */
    public function getCommandesPlaques($params = [])
    {
        try {
            // Paramètres par défaut
            $page = isset($params['page']) ? max(1, (int)$params['page']) : 1;
            $limit = isset($params['limit']) ? min(max(1, (int)$params['limit']), 100) : 20;
            $offset = ($page - 1) * $limit;
            
            // Construire la requête SQL
            $sql = "SELECT 
                pi.id,
                pi.particulier_id,
                pi.montant,
                pi.montant_initial,
                pi.nombre_plaques,
                pi.mode_paiement,
                pi.operateur,
                pi.numero_transaction,
                pi.numero_cheque,
                pi.banque,
                pi.impot_id,
                pi.utilisateur_id,
                pi.site_id,
                DATE_FORMAT(pi.date_paiement, '%Y-%m-%d %H:%i:%s') as date_paiement,
                p.nom,
                p.prenom,
                p.telephone,
                p.nif,
                p.email,
                p.rue as adresse,
                p.reduction_type,
                p.reduction_valeur,
                s.nom as site_nom,
                u.nom_complet as caissier,
                GROUP_CONCAT(DISTINCT pa.statut) as statuts_plaques,
                COUNT(DISTINCT pa.id) as nombre_plaques_attribuees
                FROM paiements_immatriculation pi
                JOIN plaques_attribuees pa ON pi.id = pa.paiement_id
                JOIN particuliers p ON pi.particulier_id = p.id
                LEFT JOIN sites s ON pi.site_id = s.id
                LEFT JOIN utilisateurs u ON pi.utilisateur_id = u.id
                WHERE pi.engin_id IS NULL AND pi.montant_initial > 0";
            
            // Filtres
            $conditions = [];
            $bindings = [];
            
            // Recherche par texte
            if (!empty($params['search'])) {
                $search = '%' . $params['search'] . '%';
                $conditions[] = "(p.nom LIKE :search OR p.prenom LIKE :search OR 
                                 p.telephone LIKE :search OR p.nif LIKE :search OR
                                 CONCAT(p.nom, ' ', p.prenom) LIKE :search OR
                                 pa.numero_plaque LIKE :search)";
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
                $conditions[] = "pi.site_id = :site_id";
                $bindings[':site_id'] = $params['site_id'];
            }
            
            // Filtre par statut des plaques (optionnel)
            if (!empty($params['statut'])) {
                $conditions[] = "pa.statut = :statut";
                $bindings[':statut'] = $params['statut'];
            }
            
            // Ajouter les conditions
            if (!empty($conditions)) {
                $sql .= " AND " . implode(" AND ", $conditions);
            }
            
            // GROUP BY pour agréger les plaques
            $sql .= " GROUP BY pi.id, pi.particulier_id, pi.montant, pi.montant_initial, 
                      pi.nombre_plaques, pi.mode_paiement, pi.operateur, pi.numero_transaction,
                      pi.numero_cheque, pi.banque, pi.impot_id, pi.utilisateur_id, pi.site_id,
                      pi.date_paiement, p.nom, p.prenom, p.telephone, p.nif, p.email, p.rue,
                      p.reduction_type, p.reduction_valeur, s.nom, u.nom_complet";
            
            // Compter le nombre total
            $sqlCount = "SELECT COUNT(*) as total FROM (
                SELECT pi.id
                FROM paiements_immatriculation pi
                JOIN plaques_attribuees pa ON pi.id = pa.paiement_id
                JOIN particuliers p ON pi.particulier_id = p.id
                WHERE pi.engin_id IS NULL AND pi.montant_initial > 0";
            
            if (!empty($conditions)) {
                $sqlCount .= " AND " . implode(" AND ", $conditions);
            }
            
            $sqlCount .= " GROUP BY pi.id) as t";
            
            $stmtCount = $this->pdo->prepare($sqlCount);
            $stmtCount->execute($bindings);
            $countResult = $stmtCount->fetch(PDO::FETCH_ASSOC);
            $total = (int)$countResult['total'];
            
            // Tri
            $orderBy = isset($params['order_by']) && in_array($params['order_by'], [
                'id', 'date_paiement', 'nom', 'prenom', 'nombre_plaques', 'montant'
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
            $commandes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                "status" => "success",
                "data" => [
                    "commandes" => $commandes,
                    "pagination" => [
                        "total" => $total,
                        "page" => $page,
                        "limit" => $limit,
                        "totalPages" => ceil($total / $limit)
                    ]
                ]
            ];
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des commandes: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère les statistiques des commandes
     */
    public function getStatsCommandes($params = [])
    {
        try {
            // Première partie : statistiques de base sur les paiements (sans jointure qui duplique)
            $sqlBase = "SELECT 
                    COUNT(DISTINCT pi.id) as total_commandes,
                    SUM(pi.montant) as montant_total,
                    SUM(pi.nombre_plaques) as plaques_commandees,
                    COUNT(DISTINCT pi.particulier_id) as clients_uniques,
                    AVG(pi.montant) as montant_moyen,
                    MIN(pi.date_paiement) as date_premiere,
                    MAX(pi.date_paiement) as date_derniere
                    FROM paiements_immatriculation pi
                    JOIN particuliers p ON pi.particulier_id = p.id
                    WHERE pi.engin_id IS NULL 
                    AND p.telephone <> '0850000001'";
            
            $conditions = [];
            $bindings = [];
            
            // Filtres
            if (!empty($params['search'])) {
                $search = '%' . $params['search'] . '%';
                $conditions[] = "(p.nom LIKE :search OR p.prenom LIKE :search OR 
                                 p.telephone LIKE :search OR p.nif LIKE :search OR
                                 EXISTS (SELECT 1 FROM plaques_attribuees pa2 WHERE pa2.paiement_id = pi.id AND pa2.numero_plaque LIKE :search))";
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
                $conditions[] = "pi.site_id = :site_id";
                $bindings[':site_id'] = $params['site_id'];
            }
            
            if (!empty($conditions)) {
                $sqlBase .= " AND " . implode(" AND ", $conditions);
            }
            
            // Exécuter la requête de base
            $stmtBase = $this->pdo->prepare($sqlBase);
            $stmtBase->execute($bindings);
            $statsBase = $stmtBase->fetch(PDO::FETCH_ASSOC);
            
            // Deuxième partie : statistiques sur les plaques attribuées (avec statuts)
            $sqlPlaques = "SELECT 
                    COUNT(CASE WHEN pa.statut = 'en_attente' THEN 1 END) as plaques_en_attente,
                    COUNT(CASE WHEN pa.statut = 'en_cours' THEN 1 END) as plaques_en_cours,
                    COUNT(CASE WHEN pa.statut = 'terminee' THEN 1 END) as plaques_terminees,
                    COUNT(DISTINCT CASE WHEN pa.statut = 'en_attente' THEN pa.paiement_id END) as commandes_en_attente,
                    COUNT(DISTINCT CASE WHEN pa.statut = 'en_cours' THEN pa.paiement_id END) as commandes_en_cours,
                    COUNT(DISTINCT CASE WHEN pa.statut = 'terminee' THEN pa.paiement_id END) as commandes_terminees
                    FROM plaques_attribuees pa
                    JOIN paiements_immatriculation pi ON pa.paiement_id = pi.id
                    JOIN particuliers p ON pi.particulier_id = p.id
                    WHERE pi.engin_id IS NULL 
                    AND p.telephone <> '0850000001'";
            
            if (!empty($conditions)) {
                $sqlPlaques .= " AND " . implode(" AND ", $conditions);
            }
            
            $stmtPlaques = $this->pdo->prepare($sqlPlaques);
            $stmtPlaques->execute($bindings);
            $statsPlaques = $stmtPlaques->fetch(PDO::FETCH_ASSOC);
            
            // Fusionner les résultats
            if (!$statsBase) {
                $statsBase = [
                    'total_commandes' => 0,
                    'montant_total' => 0,
                    'plaques_commandees' => 0,
                    'clients_uniques' => 0,
                    'montant_moyen' => 0,
                    'date_premiere' => null,
                    'date_derniere' => null
                ];
            }
            
            if (!$statsPlaques) {
                $statsPlaques = [
                    'commandes_en_attente' => 0,
                    'commandes_en_cours' => 0,
                    'commandes_terminees' => 0,
                    'plaques_en_attente' => 0,
                    'plaques_en_cours' => 0,
                    'plaques_terminees' => 0
                ];
            }
            
            return [
                "status" => "success",
                "data" => [
                    "total" => (int)$statsBase['total_commandes'],
                    "montantTotal" => (float)$statsBase['montant_total'],
                    "plaquesTotal" => (int)$statsBase['plaques_commandees'],
                    "clientsUniques" => (int)$statsBase['clients_uniques'],
                    "montantMoyen" => (float)$statsBase['montant_moyen'],
                    "datePremiere" => $statsBase['date_premiere'],
                    "dateDerniere" => $statsBase['date_derniere'],
                    "commandesParStatut" => [
                        "en_attente" => (int)$statsPlaques['commandes_en_attente'],
                        "en_cours" => (int)$statsPlaques['commandes_en_cours'],
                        "terminee" => (int)$statsPlaques['commandes_terminees']
                    ],
                    "plaquesParStatut" => [
                        "en_attente" => (int)$statsPlaques['plaques_en_attente'],
                        "en_cours" => (int)$statsPlaques['plaques_en_cours'],
                        "terminee" => (int)$statsPlaques['plaques_terminees']
                    ]
                ]
            ];
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des statistiques: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère les détails d'une commande avec ses plaques
     */
    public function getDetailsCommande($paiementId)
    {
        try {
            // Récupérer les informations de base de la commande
            $sql = "SELECT 
                    pi.id,
                    pi.particulier_id,
                    pi.montant,
                    pi.montant_initial,
                    pi.nombre_plaques,
                    pi.mode_paiement,
                    pi.operateur,
                    pi.numero_transaction,
                    pi.numero_cheque,
                    pi.banque,
                    pi.impot_id,
                    pi.utilisateur_id,
                    pi.site_id,
                    DATE_FORMAT(pi.date_paiement, '%Y-%m-%d %H:%i:%s') as date_paiement,
                    p.nom,
                    p.prenom,
                    p.telephone,
                    p.nif,
                    p.email,
                    p.rue as adresse,
                    p.reduction_type,
                    p.reduction_valeur,
                    s.nom as site_nom,
                    u.nom_complet as caissier
                    FROM paiements_immatriculation pi
                    JOIN particuliers p ON pi.particulier_id = p.id
                    LEFT JOIN sites s ON pi.site_id = s.id
                    LEFT JOIN utilisateurs u ON pi.utilisateur_id = u.id
                    WHERE pi.id = :paiement_id";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':paiement_id' => $paiementId]);
            $commande = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$commande) {
                return ["status" => "error", "message" => "Commande non trouvée"];
            }
            
            // Récupérer les plaques attribuées
            $sqlPlaques = "SELECT 
                          numero_plaque
                          FROM plaques_attribuees 
                          WHERE paiement_id = :paiement_id
                          ORDER BY numero_plaque ASC";
            
            $stmtPlaques = $this->pdo->prepare($sqlPlaques);
            $stmtPlaques->execute([':paiement_id' => $paiementId]);
            $plaques = $stmtPlaques->fetchAll(PDO::FETCH_COLUMN);
            
            $commande['plaques_attribuees'] = $plaques;
            
            return [
                "status" => "success",
                "data" => $commande
            ];
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des détails: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Annule une commande de plaques
     */
    public function annulerCommande($paiementId, $utilisateurId, $raison = "Annulation via interface admin")
    {
        try {
            // Utiliser la méthode existante de suppression de commande
            require_once 'ClientSimple.php';
            $clientSimpleManager = new ClientSimple();
            
            return $clientSimpleManager->supprimerCommande($paiementId, $utilisateurId, $raison);
            
        } catch (Exception $e) {
            error_log("Erreur lors de l'annulation de la commande: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Exporte les commandes en format Excel
     */
    public function exporterExcel($params = [])
    {
        try {
            // Récupérer toutes les commandes sans pagination
            $params['limit'] = 10000; // Limite élevée
            $result = $this->getCommandesPlaques($params);
            
            if ($result['status'] !== 'success') {
                return $result;
            }
            
            $commandes = $result['data']['commandes'];
            
            // Créer le fichier CSV (format Excel)
            $filename = "commandes_plaques_" . date('Y-m-d_H-i-s') . ".csv";
            $filepath = __DIR__ . "/../../exports/" . $filename;
            
            // Créer le répertoire d'export s'il n'existe pas
            if (!file_exists(__DIR__ . "/../../exports")) {
                mkdir(__DIR__ . "/../../exports", 0777, true);
            }
            
            $fp = fopen($filepath, 'w');
            
            // En-têtes UTF-8 BOM pour Excel
            fwrite($fp, "\xEF\xBB\xBF");
            
            // En-têtes
            fputcsv($fp, [
                'ID Commande', 'Date Paiement', 'Nom', 'Prénom', 'Téléphone', 'NIF',
                'Email', 'Adresse', 'Nombre Plaques', 'Montant ($)', 'Montant Initial ($)',
                'Réduction Type', 'Réduction Valeur', 'Mode Paiement', 'Opérateur',
                'Numéro Transaction', 'Banque', 'Site', 'Caissier', 'ID Impôt'
            ], ';');
            
            // Données
            foreach ($commandes as $commande) {
                fputcsv($fp, [
                    $commande['id'],
                    $commande['date_paiement'],
                    $commande['nom'],
                    $commande['prenom'],
                    $commande['telephone'],
                    $commande['nif'] ?? '',
                    $commande['email'] ?? '',
                    $commande['adresse'] ?? '',
                    $commande['nombre_plaques'],
                    number_format($commande['montant'], 2, ',', ' '),
                    number_format($commande['montant_initial'], 2, ',', ' '),
                    $commande['reduction_type'] ?? '',
                    $commande['reduction_valeur'] ?? 0,
                    $commande['mode_paiement'],
                    $commande['operateur'] ?? '',
                    $commande['numero_transaction'] ?? '',
                    $commande['banque'] ?? '',
                    $commande['site_nom'] ?? '',
                    $commande['caissier'] ?? '',
                    $commande['impot_id']
                ], ';');
            }
            
            fclose($fp);
            
            return [
                "status" => "success",
                "data" => [
                    "filename" => $filename,
                    "filepath" => $filepath,
                    "url" => "/exports/" . $filename,
                    "count" => count($commandes)
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