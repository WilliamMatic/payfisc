<?php
require_once 'Connexion.php';

/**
 * Classe CarteRose - Gestion complète de la délivrance et annulation des cartes roses
 */
class CarteRose extends Connexion
{
    private $transactionActive = false;

    /**
     * Démarre une transaction sécurisée
     */
    private function beginTransactionSafe()
    {
        try {
            if (!$this->transactionActive) {
                $this->pdo->beginTransaction();
                $this->transactionActive = true;
            }
        } catch (PDOException $e) {
            error_log("Erreur lors du début de transaction: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Commit sécurisé
     */
    private function commitSafe()
    {
        try {
            if ($this->transactionActive) {
                $this->pdo->commit();
                $this->transactionActive = false;
            }
        } catch (PDOException $e) {
            error_log("Erreur lors du commit: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Rollback sécurisé
     */
    private function rollbackSafe()
    {
        try {
            if ($this->transactionActive) {
                $this->pdo->rollBack();
                $this->transactionActive = false;
            }
        } catch (PDOException $e) {
            error_log("Erreur lors du rollback: " . $e->getMessage());
            $this->transactionActive = false;
        }
    }

    /**
     * Récupère les cartes roses avec pagination et filtres
     */
    public function getCartesRoses($params = [])
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
                    DATE_FORMAT(pi.date_paiement, '%Y-%m-%d %H:%i:%s') as date_attribution,
                    p.nom,
                    p.prenom,
                    p.telephone,
                    p.email,
                    p.rue as adresse,
                    p.nif,
                    e.numero_plaque,
                    e.type_engin,
                    e.marque,
                    e.energie,
                    e.annee_fabrication,
                    e.annee_circulation,
                    e.couleur,
                    e.puissance_fiscal,
                    e.usage_engin,
                    e.numero_chassis,
                    e.numero_moteur,
                    s.nom as site_nom,
                    u.nom_complet as caissier,
                    pi.site_id,
                    pi.utilisateur_id,
                    pi.impot_id,
                    pa.id as plaque_attribuee_id,
                    cr.id as reprint_id
                FROM paiements_immatriculation pi
                JOIN engins e ON pi.engin_id = e.id
                JOIN particuliers p ON pi.particulier_id = p.id
                LEFT JOIN plaques_attribuees pa ON e.numero_plaque = pa.numero_plaque 
                    AND e.particulier_id = pa.particulier_id
                LEFT JOIN carte_reprint cr ON cr.id_paiement = pi.id
                LEFT JOIN sites s ON pi.site_id = s.id
                LEFT JOIN utilisateurs u ON pi.utilisateur_id = u.id
                WHERE pi.montant_initial = 0
                AND pi.engin_id IS NOT NULL";
            
            // Filtres
            $conditions = [];
            $bindings = [];
            
            // Recherche par texte
            if (!empty($params['search'])) {
                $search = '%' . $params['search'] . '%';
                $conditions[] = "(p.nom LIKE :search OR p.prenom LIKE :search OR 
                                 p.telephone LIKE :search OR p.nif LIKE :search OR
                                 e.numero_plaque LIKE :search OR e.numero_chassis LIKE :search OR
                                 e.marque LIKE :search OR CONCAT(p.nom, ' ', p.prenom) LIKE :search)";
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
            
            // Filtre par type d'engin
            if (!empty($params['type_engin'])) {
                $conditions[] = "e.type_engin = :type_engin";
                $bindings[':type_engin'] = $params['type_engin'];
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
                'id', 'date_paiement', 'nom', 'prenom', 'numero_plaque', 'type_engin', 'marque'
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
            $cartesRoses = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                "status" => "success",
                "data" => [
                    "cartesRoses" => $cartesRoses,
                    "pagination" => [
                        "total" => $total,
                        "page" => $page,
                        "limit" => $limit,
                        "totalPages" => ceil($total / $limit)
                    ]
                ]
            ];
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des cartes roses: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère les statistiques des cartes roses
     */
    public function getStatsCartesRoses($params = [])
    {
        try {
            $sql = "SELECT 
                    COUNT(DISTINCT pi.id) as total_cartes,
                    COUNT(DISTINCT pi.particulier_id) as clients_uniques,
                    MIN(pi.date_paiement) as date_premiere,
                    MAX(pi.date_paiement) as date_derniere
                FROM paiements_immatriculation pi
                JOIN engins e ON pi.engin_id = e.id
                JOIN particuliers p ON pi.particulier_id = p.id
                WHERE pi.montant_initial = 0
                AND pi.engin_id IS NOT NULL";
            
            $conditions = [];
            $bindings = [];
            
            // Filtres
            if (!empty($params['search'])) {
                $search = '%' . $params['search'] . '%';
                $conditions[] = "(p.nom LIKE :search OR p.prenom LIKE :search OR 
                                 p.telephone LIKE :search OR p.nif LIKE :search OR
                                 e.numero_plaque LIKE :search)";
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
            
            if (!empty($params['type_engin'])) {
                $conditions[] = "e.type_engin = :type_engin";
                $bindings[':type_engin'] = $params['type_engin'];
            }
            
            if (!empty($conditions)) {
                $sql .= " AND " . implode(" AND ", $conditions);
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($bindings);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Récupérer la répartition par type de véhicule
            $sqlTypes = "SELECT 
                        e.type_engin, 
                        COUNT(*) as count
                    FROM paiements_immatriculation pi
                    JOIN engins e ON pi.engin_id = e.id
                    JOIN particuliers p ON pi.particulier_id = p.id
                    WHERE pi.montant = 0
                    AND pi.engin_id IS NOT NULL";
            
            if (!empty($conditions)) {
                $sqlTypes .= " AND " . implode(" AND ", $conditions);
            }
            
            $sqlTypes .= " GROUP BY e.type_engin ORDER BY count DESC";
            
            $stmtTypes = $this->pdo->prepare($sqlTypes);
            $stmtTypes->execute($bindings);
            $typesData = $stmtTypes->fetchAll(PDO::FETCH_ASSOC);
            
            $typesVehicules = [];
            foreach ($typesData as $type) {
                $typesVehicules[$type['type_engin']] = (int)$type['count'];
            }
            
            if (!$stats) {
                $stats = [
                    'total_cartes' => 0,
                    'clients_uniques' => 0,
                    'date_premiere' => null,
                    'date_derniere' => null
                ];
            }
            
            return [
                "status" => "success",
                "data" => [
                    "total" => (int)$stats['total_cartes'],
                    "clientsUniques" => (int)$stats['clients_uniques'],
                    "datePremiere" => $stats['date_premiere'],
                    "dateDerniere" => $stats['date_derniere'],
                    "typesVehicules" => $typesVehicules
                ]
            ];
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des statistiques: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère les détails d'une carte rose spécifique
     */
    public function getDetailsCarteRose($paiementId)
    {
        try {
            // Récupérer les informations de base de la carte rose
            $sql = "SELECT 
                    pi.id as paiement_id,
                    pi.engin_id,
                    pi.particulier_id,
                    DATE_FORMAT(pi.date_paiement, '%Y-%m-%d %H:%i:%s') as date_attribution,
                    p.nom,
                    p.prenom,
                    p.telephone,
                    p.email,
                    p.rue as adresse,
                    p.nif,
                    e.numero_plaque,
                    e.type_engin,
                    e.marque,
                    e.energie,
                    e.annee_fabrication,
                    e.annee_circulation,
                    e.couleur,
                    e.puissance_fiscal,
                    e.usage_engin,
                    e.numero_chassis,
                    e.numero_moteur,
                    s.nom as site_nom,
                    u.nom_complet as caissier,
                    pi.site_id,
                    pi.utilisateur_id,
                    pi.impot_id,
                    pa.id as plaque_attribuee_id,
                    cr.id as reprint_id
                FROM paiements_immatriculation pi
                JOIN engins e ON pi.engin_id = e.id
                JOIN particuliers p ON pi.particulier_id = p.id
                LEFT JOIN plaques_attribuees pa ON e.numero_plaque = pa.numero_plaque 
                    AND e.particulier_id = pa.particulier_id
                LEFT JOIN carte_reprint cr ON cr.id_paiement = pi.id
                LEFT JOIN sites s ON pi.site_id = s.id
                LEFT JOIN utilisateurs u ON pi.utilisateur_id = u.id
                WHERE pi.id = :paiement_id
                AND pi.montant = 0
                AND pi.engin_id IS NOT NULL";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':paiement_id' => $paiementId]);
            $carteRose = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$carteRose) {
                return ["status" => "error", "message" => "Carte rose non trouvée"];
            }
            
            return [
                "status" => "success",
                "data" => $carteRose
            ];
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des détails: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Annule une carte rose et restaure l'état
     */
    public function annulerCarteRose($paiementId, $utilisateurId, $raisonSuppression = '')
    {
        try {
            // Commencer une transaction
            $this->beginTransactionSafe();

            // 1. Vérifier que la carte rose existe
            $sqlCheck = "SELECT 
                        pi.id, pi.engin_id, pi.particulier_id,
                        e.numero_plaque, e.serie_id, e.serie_item_id,
                        p.nom, p.prenom, p.telephone, p.nif,
                        pa.id as plaque_attribuee_id,
                        cr.id as reprint_id, 
                        e.type_engin, e.marque
                    FROM paiements_immatriculation pi
                    JOIN engins e ON pi.engin_id = e.id
                    JOIN particuliers p ON pi.particulier_id = p.id
                    LEFT JOIN plaques_attribuees pa ON e.numero_plaque = pa.numero_plaque 
                        -- AND e.particulier_id = pa.particulier_id
                    LEFT JOIN carte_reprint cr ON cr.id_paiement = pi.id
                    WHERE pi.id = :paiement_id
                    AND pi.montant = 0
                    AND pi.engin_id IS NOT NULL";
            
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([':paiement_id' => $paiementId]);
            $carteRose = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if (!$carteRose) {
                $this->rollbackSafe();
                return [
                    "status" => "error",
                    "message" => "Carte rose non trouvée"
                ];
            }

            $enginId = $carteRose['engin_id'];
            $particulierId = $carteRose['particulier_id'];
            $plaqueAttribueeId = $carteRose['plaque_attribuee_id'];
            $reprintId = $carteRose['reprint_id'];

            // 2. Supprimer les répartitions bénéficiaires associées (montant à zéro)
            $sqlDeleteRepartition = "DELETE FROM repartition_paiements_immatriculation 
                                    WHERE id_paiement_immatriculation = :paiement_id";
            
            $stmtDeleteRepartition = $this->pdo->prepare($sqlDeleteRepartition);
            $stmtDeleteRepartition->execute([':paiement_id' => $paiementId]);

            // 3. Supprimer l'enregistrement de carte_reprint si existe
            if ($reprintId) {
                $sqlDeleteReprint = "DELETE FROM carte_reprint WHERE id = :reprint_id";
                $stmtDeleteReprint = $this->pdo->prepare($sqlDeleteReprint);
                $stmtDeleteReprint->execute([':reprint_id' => $reprintId]);
            }

            // 4. Mettre à jour le statut de la plaque attribuée (de 1 à 0 - disponible)
            if ($plaqueAttribueeId) {
                $sqlUpdatePlaque = "UPDATE plaques_attribuees 
                                  SET statut = 0, date_attribution = NULL
                                  WHERE id = :plaque_attribuee_id";
                
                $stmtUpdatePlaque = $this->pdo->prepare($sqlUpdatePlaque);
                $stmtUpdatePlaque->execute([
                    ':plaque_attribuee_id' => $plaqueAttribueeId
                ]);
            }

            // 5. Supprimer l'engin
            $sqlDeleteEngin = "DELETE FROM engins WHERE id = :engin_id";
            $stmtDeleteEngin = $this->pdo->prepare($sqlDeleteEngin);
            $stmtDeleteEngin->execute([':engin_id' => $enginId]);

            // 6. Supprimer le paiement
            $sqlDeletePaiement = "DELETE FROM paiements_immatriculation 
                                 WHERE id = :paiement_id";
            
            $stmtDeletePaiement = $this->pdo->prepare($sqlDeletePaiement);
            $stmtDeletePaiement->execute([':paiement_id' => $paiementId]);

            // 7. Vérifier si le particulier a d'autres cartes roses ou commandes
            $sqlCheckParticulier = "SELECT 
                (SELECT COUNT(*) FROM paiements_immatriculation WHERE particulier_id = :particulier_id) as nb_paiements,
                (SELECT COUNT(*) FROM engins WHERE particulier_id = :particulier_id) as nb_engins";
            
            $stmtCheckParticulier = $this->pdo->prepare($sqlCheckParticulier);
            $stmtCheckParticulier->execute([
                ':particulier_id' => $particulierId
            ]);
            $result = $stmtCheckParticulier->fetch(PDO::FETCH_ASSOC);

            // 8. Si le particulier n'a plus d'engins ni de paiements, on peut le supprimer s'il n'a pas d'autres liens
            if ($result && $result['nb_paiements'] == 0 && $result['nb_engins'] == 0) {
                // Vérifier s'il n'a pas d'autres liens
                $sqlCheckAutresLiens = "SELECT 
                    (SELECT COUNT(*) FROM plaques_attribuees WHERE particulier_id = :particulier_id) as nb_plaques";
                
                $stmtCheckLiens = $this->pdo->prepare($sqlCheckAutresLiens);
                $stmtCheckLiens->execute([':particulier_id' => $particulierId]);
                $liens = $stmtCheckLiens->fetch(PDO::FETCH_ASSOC);
                
                if ($liens && $liens['nb_plaques'] == 0) {
                    // Supprimer le particulier
                    $sqlDeleteParticulier = "DELETE FROM particuliers WHERE id = :id";
                    $stmtDeleteParticulier = $this->pdo->prepare($sqlDeleteParticulier);
                    $stmtDeleteParticulier->execute([':id' => $particulierId]);
                }
            }

            // 9. Enregistrer dans la table des suppressions (pour audit)
            $sqlLogSuppression = "INSERT INTO suppressions_log 
                                 (table_name, record_id, utilisateur_id, raison_suppression, 
                                  details, date_suppression) 
                                 VALUES 
                                 ('carte_rose', :record_id, :utilisateur_id, 
                                  :raison_suppression, :details, NOW())";
            
            $details = json_encode([
                'particulier' => [
                    'nom' => $carteRose['nom'],
                    'prenom' => $carteRose['prenom'],
                    'telephone' => $carteRose['telephone'],
                    'nif' => $carteRose['nif']
                ],
                'vehicule' => [
                    'numero_plaque' => $carteRose['numero_plaque'],
                    'type_engin' => $carteRose['type_engin'],
                    'marque' => $carteRose['marque']
                ],
                'engin_id' => $enginId,
                'plaque_restauree' => $plaqueAttribueeId ? true : false,
                'reprint_supprime' => $reprintId ? true : false
            ]);
            
            $stmtLogSuppression = $this->pdo->prepare($sqlLogSuppression);
            $stmtLogSuppression->execute([
                ':record_id' => $paiementId,
                ':utilisateur_id' => $utilisateurId,
                ':raison_suppression' => $raisonSuppression,
                ':details' => $details
            ]);

            // 10. Log d'audit
            $this->logAudit(
                "Suppression carte rose #$paiementId - " .
                "Client: {$carteRose['nom']} {$carteRose['prenom']} - " .
                "Plaque: {$carteRose['numero_plaque']} - " .
                "Raison: $raisonSuppression"
            );

            // 11. Enregistrer une notification
            $this->enregistrerNotification(
                'suppression_carte_rose',
                'Carte rose supprimée',
                "Carte rose #$paiementId supprimée pour {$carteRose['nom']} {$carteRose['prenom']} - Plaque: {$carteRose['numero_plaque']}",
                $carteRose['nif'],
                null,
                $paiementId
            );

            $this->commitSafe();

            return [
                "status" => "success",
                "message" => "Carte rose annulée avec succès",
                "data" => [
                    "paiement_id" => $paiementId,
                    "particulier" => [
                        "nom" => $carteRose['nom'],
                        "prenom" => $carteRose['prenom'],
                        "telephone" => $carteRose['telephone']
                    ],
                    "vehicule" => [
                        "numero_plaque" => $carteRose['numero_plaque'],
                        "type_engin" => $carteRose['type_engin']
                    ],
                    "plaque_restauree" => $plaqueAttribueeId ? true : false,
                    "raison_suppression" => $raisonSuppression
                ]
            ];

        } catch (PDOException $e) {
            $this->rollbackSafe();
            error_log("Erreur lors de l'annulation de la carte rose: " . $e->getMessage());
            return [
                "status" => "error", 
                "message" => "Erreur système lors de l'annulation: " . $e->getMessage()
            ];
        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("Erreur lors de l'annulation de la carte rose: " . $e->getMessage());
            return [
                "status" => "error", 
                "message" => $e->getMessage()
            ];
        }
    }

    /**
     * Exporte les cartes roses en format Excel
     */
    public function exporterExcel($params = [])
    {
        try {
            // Récupérer toutes les cartes roses sans pagination
            $params['limit'] = 10000; // Limite élevée
            $result = $this->getCartesRoses($params);
            
            if ($result['status'] !== 'success') {
                return $result;
            }
            
            $cartesRoses = $result['data']['cartesRoses'];
            
            // Créer le fichier CSV (format Excel)
            $filename = "cartes_roses_" . date('Y-m-d_H-i-s') . ".csv";
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
                'ID Paiement', 'Date Attribution', 'Nom', 'Prénom', 'Téléphone', 'Email',
                'Adresse', 'NIF', 'Numéro Plaque', 'Type Engin', 'Marque', 'Énergie',
                'Année Fabrication', 'Année Circulation', 'Couleur', 'Puissance Fiscal',
                'Usage', 'Numéro Chassis', 'Numéro Moteur', 'Site', 'Caissier'
            ], ';');
            
            // Données
            foreach ($cartesRoses as $carte) {
                fputcsv($fp, [
                    $carte['paiement_id'],
                    $carte['date_attribution'],
                    $carte['nom'],
                    $carte['prenom'],
                    $carte['telephone'],
                    $carte['email'] ?? '',
                    $carte['adresse'],
                    $carte['nif'] ?? '',
                    $carte['numero_plaque'],
                    $carte['type_engin'],
                    $carte['marque'],
                    $carte['energie'] ?? '',
                    $carte['annee_fabrication'] ?? '',
                    $carte['annee_circulation'] ?? '',
                    $carte['couleur'] ?? '',
                    $carte['puissance_fiscal'] ?? '',
                    $carte['usage_engin'] ?? '',
                    $carte['numero_chassis'] ?? '',
                    $carte['numero_moteur'] ?? '',
                    $carte['site_nom'] ?? '',
                    $carte['caissier'] ?? ''
                ], ';');
            }
            
            fclose($fp);
            
            return [
                "status" => "success",
                "data" => [
                    "filename" => $filename,
                    "filepath" => $filepath,
                    "url" => "/exports/" . $filename,
                    "count" => count($cartesRoses)
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

    /**
     * Récupère les types de véhicules disponibles
     */
    public function getTypesVehicules()
    {
        try {
            $sql = "SELECT DISTINCT type_engin, COUNT(*) as count 
                    FROM engins 
                    WHERE type_engin IS NOT NULL AND type_engin != ''
                    GROUP BY type_engin 
                    ORDER BY type_engin ASC";
            
            $stmt = $this->pdo->query($sql);
            $types = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                "status" => "success",
                "data" => $types
            ];
            
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des types de véhicules: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Log une action dans le journal d'audit
     */
    public function logAudit($message)
    {
        try {
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
        } catch (PDOException $e) {
            error_log("Erreur lors du log d'audit: " . $e->getMessage());
        }
    }

    /**
     * Enregistre une notification dans la base de données
     */
    private function enregistrerNotification($type, $titre, $message, $nif = null, $idDeclaration = null, $idPaiement = null)
    {
        try {
            $sql = "INSERT INTO notifications 
                    (type_notification, nif_contribuable, id_declaration, id_paiement, titre, message, date_creation) 
                    VALUES 
                    (:type, :nif, :id_declaration, :id_paiement, :titre, :message, NOW())";

            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([
                ':type' => $type,
                ':nif' => $nif,
                ':id_declaration' => $idDeclaration,
                ':id_paiement' => $idPaiement,
                ':titre' => $titre,
                ':message' => $message,
            ]);
        } catch (PDOException $e) {
            error_log("Erreur lors de l'enregistrement de la notification: " . $e->getMessage());
            return false;
        }
    }

    public function __destruct()
    {
        if ($this->transactionActive) {
            error_log("ATTENTION: Transaction toujours active à la destruction de l'objet CarteRose");
            $this->rollbackSafe();
        }
    }
}