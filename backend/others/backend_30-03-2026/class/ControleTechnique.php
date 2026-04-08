<?php

require_once __DIR__ . '/Connexion.php';

class ControleTechnique extends Connexion
{
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Récupérer la liste paginée des contrôles techniques avec filtres
     */
    public function getControles($params)
    {
        $page = isset($params['page']) ? max(1, intval($params['page'])) : 1;
        $limit = isset($params['limit']) ? max(1, min(50, intval($params['limit']))) : 10;
        $offset = ($page - 1) * $limit;

        $search = isset($params['search']) ? trim($params['search']) : '';
        $decision = isset($params['decision']) ? $params['decision'] : 'tous';
        $statut = isset($params['statut']) ? $params['statut'] : 'tous';
        $dateDebut = isset($params['date_debut']) ? $params['date_debut'] : '';
        $dateFin = isset($params['date_fin']) ? $params['date_fin'] : '';

        $conditions = [];
        $bindings = [];

        if ($search !== '') {
            $conditions[] = "(
                e.numero_plaque LIKE :search 
                OR CONCAT(p.nom, ' - ', p.prenom) LIKE :search2
                OR p.telephone LIKE :search3
                OR CAST(ct.id AS CHAR) LIKE :search4
            )";
            $searchTerm = "%{$search}%";
            $bindings[':search'] = $searchTerm;
            $bindings[':search2'] = $searchTerm;
            $bindings[':search3'] = $searchTerm;
            $bindings[':search4'] = $searchTerm;
        }

        if ($decision === 'favorable') {
            $conditions[] = "ct.decision_finale = 1";
        } elseif ($decision === 'defavorable') {
            $conditions[] = "ct.decision_finale = 0";
        }

        if ($statut === 'termine') {
            $conditions[] = "ct.status = 1";
        } elseif ($statut === 'en-cours') {
            $conditions[] = "ct.status = 0";
        }

        if ($dateDebut !== '') {
            $conditions[] = "COALESCE(ct.date_controle, ct.date_creation) >= :date_debut";
            $bindings[':date_debut'] = $dateDebut . ' 00:00:00';
        }
        if ($dateFin !== '') {
            $conditions[] = "COALESCE(ct.date_controle, ct.date_creation) <= :date_fin";
            $bindings[':date_fin'] = $dateFin . ' 23:59:59';
        }

        $whereClause = count($conditions) > 0 ? 'WHERE ' . implode(' AND ', $conditions) : '';

        // Nombre total avec filtres (pour pagination)
        $countSql = "
            SELECT COUNT(*) as total
            FROM controle_technique ct
            JOIN particuliers p ON ct.particulier_id = p.id
            JOIN engins e ON ct.engin_id = e.id
            {$whereClause}
        ";
        $countStmt = $this->pdo->prepare($countSql);
        foreach ($bindings as $key => $val) {
            $countStmt->bindValue($key, $val);
        }
        $countStmt->execute();
        $total = intval($countStmt->fetch(PDO::FETCH_ASSOC)['total']);

        // Statistiques globales (non filtrées)
        $statsSql = "
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN ct.decision_finale = 1 THEN 1 ELSE 0 END) as favorables,
                SUM(CASE WHEN ct.decision_finale = 0 THEN 1 ELSE 0 END) as defavorables,
                SUM(CASE WHEN ct.status = 0 THEN 1 ELSE 0 END) as en_cours
            FROM controle_technique ct
        ";
        $statsStmt = $this->pdo->prepare($statsSql);
        $statsStmt->execute();
        $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

        // Requête principale
        $sql = "
            SELECT 
                ct.id,
                ct.engin_id,
                ct.particulier_id,
                ct.paiement_id,
                ct.date_creation,
                ct.status,
                ct.decision_finale,
                ct.date_controle,
                ct.agent_id,
                ct.pv_generated,
                CONCAT(p.nom, ' - ', p.prenom) AS nom_complet,
                p.telephone,
                COALESCE(p.rue, '-') AS adresse,
                p.nif,
                p.email,
                e.id AS e_id,
                e.numero_plaque,
                e.marque,
                e.type_engin,
                e.couleur,
                e.energie,
                e.usage_engin,
                e.puissance_fiscal,
                e.annee_fabrication,
                e.annee_circulation,
                e.numero_chassis,
                e.numero_moteur
            FROM controle_technique ct
            JOIN particuliers p ON ct.particulier_id = p.id
            JOIN engins e ON ct.engin_id = e.id
            {$whereClause}
            ORDER BY ct.date_creation DESC
            LIMIT " . intval($limit) . " OFFSET " . intval($offset);

        $stmt = $this->pdo->prepare($sql);
        foreach ($bindings as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Récupérer tous les résultats en une seule requête (évite N+1)
        $controleIds = array_column($rows, 'id');
        $resultatsByControle = [];

        if (!empty($controleIds)) {
            $placeholders = implode(',', array_fill(0, count($controleIds), '?'));
            $resultatsSql = "SELECT * FROM controle_technique_resultats 
                             WHERE controle_id IN ({$placeholders}) 
                             ORDER BY controle_id, id";
            $resStmt = $this->pdo->prepare($resultatsSql);
            $resStmt->execute($controleIds);
            $allResultats = $resStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($allResultats as $r) {
                $resultatsByControle[$r['controle_id']][] = $r;
            }
        }

        // Formater les résultats
        $controles = [];
        foreach ($rows as $row) {
            $resultats = $resultatsByControle[$row['id']] ?? [];

            $controles[] = [
                'id' => intval($row['id']),
                'reference' => 'CT-' . str_pad($row['id'], 4, '0', STR_PAD_LEFT),
                'assujetti' => [
                    'id' => intval($row['particulier_id']),
                    'nom_complet' => $row['nom_complet'],
                    'telephone' => $row['telephone'] ?? '',
                    'adresse' => $row['adresse'],
                    'nif' => $row['nif'],
                    'email' => $row['email'],
                ],
                'engin' => [
                    'id' => intval($row['e_id']),
                    'numero_plaque' => $row['numero_plaque'],
                    'marque' => $row['marque'],
                    'couleur' => $row['couleur'] ?? '',
                    'energie' => $row['energie'] ?? '',
                    'usage_engin' => $row['usage_engin'] ?? '',
                    'puissance_fiscal' => $row['puissance_fiscal'] ?? '',
                    'annee_fabrication' => $row['annee_fabrication'] ?? '',
                    'annee_circulation' => $row['annee_circulation'] ?? '',
                    'numero_chassis' => $row['numero_chassis'] ?? '',
                    'numero_moteur' => $row['numero_moteur'] ?? '',
                    'type_engin' => $row['type_engin'] ?? '',
                ],
                'date_controle' => $row['date_controle'],
                'date_creation' => $row['date_creation'],
                'statut' => intval($row['status']) === 1 ? 'termine' : 'en-cours',
                'decision_finale' => $row['decision_finale'] === null ? null
                    : (intval($row['decision_finale']) === 1 ? 'favorable' : 'defavorable'),
                'pv_generated' => intval($row['pv_generated']),
                'agent_id' => $row['agent_id'] ? intval($row['agent_id']) : null,
                'paiement_id' => $row['paiement_id'] ? intval($row['paiement_id']) : null,
                'resultats' => array_map(function ($r) {
                    return [
                        'id' => intval($r['id']),
                        'controle_id' => intval($r['controle_id']),
                        'element_id' => intval($r['element_id']),
                        'nom_element' => $r['nom_element'],
                        'statut' => $r['statut'],
                        'date_verification' => $r['date_verification'],
                    ];
                }, $resultats),
            ];
        }

        return [
            'status' => 'success',
            'data' => [
                'controles' => $controles,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'total_pages' => intval(ceil($total / max($limit, 1))),
                ],
                'stats' => [
                    'total' => intval($stats['total']),
                    'favorables' => intval($stats['favorables']),
                    'defavorables' => intval($stats['defavorables']),
                    'en_cours' => intval($stats['en_cours']),
                ],
            ],
        ];
    }

    /**
     * Supprimer un contrôle technique, ses résultats, le paiement et sa répartition
     * Ne supprime PAS les engins ni les particuliers
     */
    public function supprimerControle($id)
    {
        $id = intval($id);

        // Vérifier que le contrôle existe + récupérer le paiement_id
        $checkSql = "SELECT ct.id, ct.status, ct.decision_finale, ct.date_controle,
                     ct.paiement_id,
                     CONCAT(p.nom, ' - ', p.prenom) AS nom_complet,
                     e.numero_plaque
                     FROM controle_technique ct
                     JOIN particuliers p ON ct.particulier_id = p.id
                     JOIN engins e ON ct.engin_id = e.id
                     WHERE ct.id = :id";
        $checkStmt = $this->pdo->prepare($checkSql);
        $checkStmt->bindValue(':id', $id, PDO::PARAM_INT);
        $checkStmt->execute();
        $controle = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$controle) {
            return ['status' => 'error', 'message' => 'Contrôle technique non trouvé'];
        }

        // Compter les résultats avant suppression
        $countSql = "SELECT COUNT(*) as total,
                     SUM(CASE WHEN statut = 'bon' THEN 1 ELSE 0 END) as bons,
                     SUM(CASE WHEN statut = 'mauvais' THEN 1 ELSE 0 END) as mauvais
                     FROM controle_technique_resultats WHERE controle_id = :id";
        $countStmt = $this->pdo->prepare($countSql);
        $countStmt->bindValue(':id', $id, PDO::PARAM_INT);
        $countStmt->execute();
        $resultatsStats = $countStmt->fetch(PDO::FETCH_ASSOC);

        $paiementId = $controle['paiement_id'] ? intval($controle['paiement_id']) : null;

        $this->pdo->beginTransaction();

        try {
            // 1. Supprimer le contrôle (CASCADE supprime les résultats)
            $deleteSql = "DELETE FROM controle_technique WHERE id = :id";
            $deleteStmt = $this->pdo->prepare($deleteSql);
            $deleteStmt->bindValue(':id', $id, PDO::PARAM_INT);
            $deleteStmt->execute();

            // 2. Supprimer la répartition puis le paiement associé
            if ($paiementId) {
                $deleteRepSql = "DELETE FROM repartition_paiements_immatriculation 
                                 WHERE id_paiement_immatriculation = :paiement_id";
                $deleteRepStmt = $this->pdo->prepare($deleteRepSql);
                $deleteRepStmt->bindValue(':paiement_id', $paiementId, PDO::PARAM_INT);
                $deleteRepStmt->execute();

                $deletePaiSql = "DELETE FROM paiements_immatriculation WHERE id = :paiement_id";
                $deletePaiStmt = $this->pdo->prepare($deletePaiSql);
                $deletePaiStmt->bindValue(':paiement_id', $paiementId, PDO::PARAM_INT);
                $deletePaiStmt->execute();
            }

            $this->pdo->commit();
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }

        return [
            'status' => 'success',
            'message' => 'Contrôle technique, paiement et répartition supprimés avec succès',
            'data' => [
                'id' => $id,
                'reference' => 'CT-' . str_pad($id, 4, '0', STR_PAD_LEFT),
                'nom_complet' => $controle['nom_complet'],
                'numero_plaque' => $controle['numero_plaque'],
                'date_controle' => $controle['date_controle'],
                'decision_finale' => $controle['decision_finale'] === null ? null
                    : (intval($controle['decision_finale']) === 1 ? 'favorable' : 'defavorable'),
                'statut' => intval($controle['status']) === 1 ? 'termine' : 'en-cours',
                'nombre_elements' => intval($resultatsStats['total']),
                'elements_bons' => intval($resultatsStats['bons'] ?? 0),
                'elements_mauvais' => intval($resultatsStats['mauvais'] ?? 0),
                'paiement_supprime' => $paiementId,
            ],
        ];
    }

    /**
     * Modifier les résultats d'un contrôle technique
     * Recalcule automatiquement la décision finale et le statut
     */
    public function modifierResultats($controle_id, $resultats)
    {
        $controle_id = intval($controle_id);

        // Vérifier que le contrôle existe
        $checkSql = "SELECT id FROM controle_technique WHERE id = :id";
        $checkStmt = $this->pdo->prepare($checkSql);
        $checkStmt->bindValue(':id', $controle_id, PDO::PARAM_INT);
        $checkStmt->execute();

        if (!$checkStmt->fetch()) {
            return ['status' => 'error', 'message' => 'Contrôle technique non trouvé'];
        }

        $this->pdo->beginTransaction();

        try {
            $updateSql = "UPDATE controle_technique_resultats 
                         SET statut = :statut, date_verification = NOW()
                         WHERE id = :id AND controle_id = :controle_id";
            $updateStmt = $this->pdo->prepare($updateSql);

            $updated = 0;
            $validStatuts = ['bon', 'mauvais', 'non-commence'];

            foreach ($resultats as $resultat) {
                if (!isset($resultat['id'], $resultat['statut'])) continue;
                if (!in_array($resultat['statut'], $validStatuts)) continue;

                $updateStmt->bindValue(':statut', $resultat['statut']);
                $updateStmt->bindValue(':id', intval($resultat['id']), PDO::PARAM_INT);
                $updateStmt->bindValue(':controle_id', $controle_id, PDO::PARAM_INT);
                $updateStmt->execute();
                $updated += $updateStmt->rowCount();
            }

            // Recalculer la décision finale et le statut
            $statsSql = "SELECT
                         COUNT(*) as total,
                         SUM(CASE WHEN statut = 'mauvais' THEN 1 ELSE 0 END) as mauvais,
                         SUM(CASE WHEN statut = 'non-commence' THEN 1 ELSE 0 END) as non_commence
                         FROM controle_technique_resultats WHERE controle_id = :id";
            $statsStmt = $this->pdo->prepare($statsSql);
            $statsStmt->bindValue(':id', $controle_id, PDO::PARAM_INT);
            $statsStmt->execute();
            $statsResult = $statsStmt->fetch(PDO::FETCH_ASSOC);

            $decision = null;
            $status = 0;

            if (intval($statsResult['non_commence']) === 0 && intval($statsResult['total']) > 0) {
                $status = 1;
                $decision = intval($statsResult['mauvais']) > 0 ? 0 : 1;
            }

            if ($status === 1) {
                $updateCtSql = "UPDATE controle_technique 
                               SET decision_finale = :decision, status = 1, 
                                   date_controle = COALESCE(date_controle, NOW())
                               WHERE id = :id";
            } else {
                $updateCtSql = "UPDATE controle_technique 
                               SET decision_finale = :decision, status = 0
                               WHERE id = :id";
            }

            $updateCtStmt = $this->pdo->prepare($updateCtSql);
            $updateCtStmt->bindValue(':decision', $decision, $decision === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
            $updateCtStmt->bindValue(':id', $controle_id, PDO::PARAM_INT);
            $updateCtStmt->execute();

            $this->pdo->commit();

            return [
                'status' => 'success',
                'message' => "{$updated} résultat(s) modifié(s) avec succès",
                'data' => [
                    'updated' => $updated,
                    'decision_finale' => $decision === null ? null : ($decision === 1 ? 'favorable' : 'defavorable'),
                    'statut' => $status === 1 ? 'termine' : 'en-cours',
                ],
            ];
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}
