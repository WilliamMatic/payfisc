<?php
require_once 'Connexion.php';

/**
 * Classe Dashboard - Gestion des statistiques et données pour le tableau de bord fiscal
 */
class Dashboard extends Connexion
{
    /**
     * Récupère les statistiques globales pour le tableau de bord
     *
     * @param string|null $startDate Date de début optionnelle
     * @param string|null $endDate Date de fin optionnelle
     * @return array Tableau avec les statistiques
     */
    public function getDashboardStats($startDate = null, $endDate = null)
    {
        try {
            // Si pas de dates fournies, utiliser la date du jour
            if (!$startDate && !$endDate) {
                $startDate = date('Y-m-d');
                $endDate = date('Y-m-d');
            }

            // Construire la clause WHERE pour les dates
            $whereClause = "";
            $params = [];

            if ($startDate && $endDate) {
                $whereClause = " WHERE DATE(d.date_creation) BETWEEN :start_date AND :end_date";
                $params[':start_date'] = $startDate;
                $params[':end_date'] = $endDate;
            }

            // Le reste du code reste identique...
            $sql = "SELECT 
                    COUNT(DISTINCT d.id) as total_declarations,
                    COUNT(DISTINCT CASE WHEN d.statut = 'payé' THEN d.id END) as declarations_payees,
                    COUNT(DISTINCT CASE WHEN d.statut = 'en_attente' THEN d.id END) as declarations_en_attente,
                    COUNT(DISTINCT CASE WHEN d.statut = 'rejeté' THEN d.id END) as declarations_rejetees,
                    COUNT(DISTINCT d.nif_contribuable) as total_contribuables,
                    COUNT(DISTINCT CASE WHEN d.type_contribuable = 'particulier' THEN d.nif_contribuable END) as total_particuliers,
                    COUNT(DISTINCT CASE WHEN d.type_contribuable = 'entreprise' THEN d.nif_contribuable END) as total_entreprises,
                    COALESCE(SUM(CASE WHEN d.statut = 'payé' THEN d.montant ELSE 0 END), 0) as total_taxes_payees,
                    COUNT(DISTINCT i.id) as total_taxes_differentes
                FROM declarations d
                LEFT JOIN impots i ON d.id_impot = i.id
                $whereClause";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);

            // Calculer les échéances proches (pour aujourd'hui seulement si dates du jour)
            $sqlUpcoming = "SELECT COUNT(*) as echeances_proches
                        FROM declarations 
                        WHERE statut = 'en_attente'";

            if ($startDate && $endDate && $startDate === $endDate) {
                $sqlUpcoming .= " AND DATE(date_creation) = :today";
                $paramsUpcoming = [':today' => $startDate];
            } else if ($startDate && $endDate) {
                $sqlUpcoming .= " AND DATE(date_creation) BETWEEN :start_date AND :end_date";
                $paramsUpcoming = [
                    ':start_date' => $startDate,
                    ':end_date' => $endDate
                ];
            } else {
                $paramsUpcoming = [];
            }

            $stmtUpcoming = $this->pdo->prepare($sqlUpcoming);
            $stmtUpcoming->execute($paramsUpcoming);
            $upcoming = $stmtUpcoming->fetch(PDO::FETCH_ASSOC);
            $stats['echeances_proches'] = $upcoming['echeances_proches'];

            return [
                "status" => "success",
                "data" => $stats,
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des statistiques: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des statistiques: " . $e->getMessage(),
            ];
        }
    }

    /**
     * Récupère les données pour l'onglet vérification avec filtres
     *
     * @param array $filters Tableau de filtres
     * @return array Données filtrées
     */
    public function getVerificationData($filters = [])
    {
        try {
            // Construire la requête avec les filtres
            $sql = "SELECT 
                        d.reference,
                        i.nom as nom_impot,
                        CASE 
                            WHEN d.type_contribuable = 'particulier' THEN CONCAT(COALESCE(par.nom, ''), ' ', COALESCE(par.prenom, ''))
                            WHEN d.type_contribuable = 'entreprise' THEN COALESCE(e.raison_sociale, '')
                            ELSE 'Inconnu'
                        END as contribuable,
                        d.type_contribuable,
                        d.montant as montant_du,
                        COALESCE(SUM(CASE WHEN pa.statut = 'complete' THEN pa.montant ELSE 0 END), 0) as montant_paye,
                        MAX(CASE 
                            WHEN pa.methode_paiement = 1 THEN 'cash'
                            WHEN pa.methode_paiement = 2 THEN 'mobile_money'
                            WHEN pa.methode_paiement = 3 THEN 'bank_deposit'
                            WHEN pa.methode_paiement = 4 THEN 'bank_transfer'
                            ELSE 'non_payé'
                        END) as methode_paiement,
                        MAX(COALESCE(pa.lieu_paiement, '')) as lieu_paiement,
                        d.statut,
                        d.date_creation,
                        d.nif_contribuable,
                        i.id as code_impot,
                        d.id as declaration_id
                    FROM declarations d
                    LEFT JOIN paiements pa ON d.id = pa.id_declaration
                    LEFT JOIN impots i ON d.id_impot = i.id
                    LEFT JOIN particuliers par ON d.nif_contribuable = par.nif AND d.type_contribuable = 'particulier'
                    LEFT JOIN entreprises e ON d.nif_contribuable = e.nif AND d.type_contribuable = 'entreprise'
                    WHERE 1=1";

            $params = [];

            // Appliquer les filtres
            if (!empty($filters['search'])) {
                $sql .= " AND (d.reference LIKE :search OR i.nom LIKE :search OR 
                          par.nom LIKE :search OR par.prenom LIKE :search OR e.raison_sociale LIKE :search)";
                $params[':search'] = '%' . $filters['search'] . '%';
            }

            if (!empty($filters['status']) && $filters['status'] !== 'all') {
                $sql .= " AND d.statut = :status";
                $params[':status'] = $filters['status'];
            }

            if (!empty($filters['tax_type']) && $filters['tax_type'] !== 'all') {
                $sql .= " AND i.nom = :tax_type";
                $params[':tax_type'] = $filters['tax_type'];
            }

            if (!empty($filters['taxpayer_type']) && $filters['taxpayer_type'] !== 'all') {
                $sql .= " AND d.type_contribuable = :taxpayer_type";
                $params[':taxpayer_type'] = $filters['taxpayer_type'];
            }

            if (!empty($filters['payment_method']) && $filters['payment_method'] !== 'all') {
                $sql .= " AND pa.methode_paiement = :payment_method";
                $params[':payment_method'] = $this->getPaymentMethodId($filters['payment_method']);
            }

            if (!empty($filters['payment_place']) && $filters['payment_place'] !== 'all') {
                $sql .= " AND pa.lieu_paiement = :payment_place";
                $params[':payment_place'] = $filters['payment_place'];
            }

            if (!empty($filters['declaration_status']) && $filters['declaration_status'] !== 'all') {
                $sql .= " AND d.statut = :declaration_status";
                $params[':declaration_status'] = $filters['declaration_status'];
            }

            if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
                $sql .= " AND d.date_creation BETWEEN :start_date AND :end_date";
                $params[':start_date'] = $filters['start_date'] . " 00:00:00";
                $params[':end_date'] = $filters['end_date'] . " 23:59:59";
            }

            $sql .= " GROUP BY d.id
                      ORDER BY d.date_creation DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "data" => $data,
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des données de vérification: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des données de vérification: " . $e->getMessage(),
            ];
        }
    }

    /**
     * Récupère la liste des noms d'impôts uniques pour les filtres
     *
     * @return array Liste des noms d'impôts
     */
    public function getUniqueTaxNames()
    {
        try {
            $sql = "SELECT DISTINCT nom FROM impots WHERE actif = 1 ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            $taxNames = $stmt->fetchAll(PDO::FETCH_COLUMN);

            return [
                "status" => "success",
                "data" => $taxNames ?: [],
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des noms d'impôts: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des noms d'impôts",
            ];
        }
    }

    /**
     * Récupère les détails complets d'une déclaration
     *
     * @param int $declarationId ID de la déclaration
     * @return array Détails de la déclaration
     */
    public function getDeclarationDetails($declarationId)
    {
        try {
            $sql = "SELECT 
                        d.reference,
                        i.nom as nom_impot,
                        CASE 
                            WHEN d.type_contribuable = 'particulier' THEN CONCAT(COALESCE(par.nom, ''), ' ', COALESCE(par.prenom, ''))
                            WHEN d.type_contribuable = 'entreprise' THEN COALESCE(e.raison_sociale, '')
                            ELSE 'Inconnu'
                        END as contribuable,
                        d.type_contribuable,
                        d.nif_contribuable,
                        d.montant as montant_du,
                        COALESCE(SUM(CASE WHEN pa.statut = 'complete' THEN pa.montant ELSE 0 END), 0) as montant_paye,
                        (d.montant - COALESCE(SUM(CASE WHEN pa.statut = 'complete' THEN pa.montant ELSE 0 END), 0)) as solde,
                        MAX(CASE 
                            WHEN pa.methode_paiement = 1 THEN 'cash'
                            WHEN pa.methode_paiement = 2 THEN 'mobile_money'
                            WHEN pa.methode_paiement = 3 THEN 'bank_deposit'
                            WHEN pa.methode_paiement = 4 THEN 'bank_transfer'
                            ELSE 'non_payé'
                        END) as methode_paiement,
                        MAX(COALESCE(pa.lieu_paiement, '')) as lieu_paiement,
                        d.statut,
                        d.date_creation,
                        d.date_creation,
                        i.id as code_impot,
                        i.periode as periode_fiscale
                    FROM declarations d
                    LEFT JOIN paiements pa ON d.id = pa.id_declaration
                    LEFT JOIN impots i ON d.id_impot = i.id
                    LEFT JOIN particuliers par ON d.nif_contribuable = par.nif AND d.type_contribuable = 'particulier'
                    LEFT JOIN entreprises e ON d.nif_contribuable = e.nif AND d.type_contribuable = 'entreprise'
                    WHERE d.id = :id
                    GROUP BY d.id";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $declarationId]);
            $declaration = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$declaration) {
                return [
                    "status" => "error",
                    "message" => "Déclaration non trouvée",
                ];
            }

            // Récupérer les détails des paiements
            $sqlPaiements = "SELECT 
                                montant,
                                date_paiement,
                                CASE 
                                    WHEN methode_paiement = 1 THEN 'cash'
                                    WHEN methode_paiement = 2 THEN 'mobile_money'
                                    WHEN methode_paiement = 3 THEN 'bank_deposit'
                                    WHEN methode_paiement = 4 THEN 'bank_transfer'
                                    ELSE 'autre'
                                END as methode_paiement,
                                lieu_paiement
                             FROM paiements 
                             WHERE id_declaration = :id AND statut = 'complete'
                             ORDER BY date_paiement DESC";

            $stmtPaiements = $this->pdo->prepare($sqlPaiements);
            $stmtPaiements->execute([':id' => $declarationId]);
            $paiements = $stmtPaiements->fetchAll(PDO::FETCH_ASSOC);

            $declaration['details_paiements'] = $paiements ?: [];

            return [
                "status" => "success",
                "data" => $declaration,
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des détails de déclaration: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des détails de déclaration: " . $e->getMessage(),
            ];
        }
    }

    /**
     * Récupère les bénéficiaires d'une déclaration
     */
    public function getBeneficiairesDeclaration($declarationId)
    {
        try {
            $sql = "SELECT 
                    b.id,
                    b.nom,
                    b.telephone,
                    b.numero_compte,
                    rp.type_part,
                    rp.valeur_part_originale,
                    rp.valeur_part_calculee,
                    rp.montant
                FROM repartition_paiements rp
                JOIN beneficiaires b ON rp.beneficiaire_id = b.id
                WHERE rp.id_declaration = :declaration_id
                ORDER BY rp.montant DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':declaration_id' => $declarationId]);
            $beneficiaires = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "data" => $beneficiaires,
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des bénéficiaires: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des bénéficiaires",
            ];
        }
    }

    /**
     * Récupère les données complètes pour le rapport
     */
    public function getRapportDeclaration($declarationId)
    {
        try {
            // Récupérer les détails de base de la déclaration
            $detailsResult = $this->getDeclarationDetails($declarationId);
            if ($detailsResult['status'] === 'error') {
                return $detailsResult;
            }

            // Récupérer les bénéficiaires
            $beneficiairesResult = $this->getBeneficiairesDeclaration($declarationId);

            // Calculer les pénalités si nécessaire
            $penalites = $this->calculerPenalitesDeclaration($declarationId);

            $rapport = [
                'declaration' => $detailsResult['data'],
                'beneficiaires' => $beneficiairesResult['data'] ?? [],
                'penalites' => $penalites,
                'total_beneficiaires' => array_sum(array_column($beneficiairesResult['data'] ?? [], 'montant'))
            ];

            return [
                "status" => "success",
                "data" => $rapport,
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la génération du rapport: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la génération du rapport",
            ];
        }
    }

    /**
     * Calcule les pénalités pour une déclaration
     */
    private function calculerPenalitesDeclaration($declarationId)
    {
        try {
            $sql = "SELECT 
                    d.date_creation,
                    d.montant,
                    i.delai_paiement,
                    i.penalite_type,
                    i.penalite_valeur
                FROM declarations d
                LEFT JOIN impots i ON d.id_impot = i.id
                WHERE d.id = :id";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $declarationId]);
            $declaration = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$declaration) {
                return [
                    'montant_penalites' => 0,
                    'details' => 'Aucune pénalité'
                ];
            }

            $dateCreation = new DateTime($declaration['date_creation']);
            $aujourdHui = new DateTime();
            $delaiAccorde = $declaration['delai_paiement'] ?? 30;

            $interval = $dateCreation->diff($aujourdHui);
            $joursEcoules = $interval->days;

            $nombreDelaisEcoules = floor($joursEcoules / $delaiAccorde);
            $montantPenalites = 0;

            if ($nombreDelaisEcoules > 0) {
                $penaliteType = $declaration['penalite_type'] ?? 'pourcentage';
                $penaliteValeur = $declaration['penalite_valeur'] ?? 10;

                if ($penaliteType === 'pourcentage') {
                    $montantPenalites = $declaration['montant'] * ($penaliteValeur / 100) * $nombreDelaisEcoules;
                } else {
                    $montantPenalites = $penaliteValeur * $nombreDelaisEcoules;
                }
            }

            return [
                'montant_penalites' => $montantPenalites,
                'jours_ecoules' => $joursEcoules,
                'nombre_delais_ecoules' => $nombreDelaisEcoules,
                'details' => $nombreDelaisEcoules > 0 ?
                    "{$joursEcoules} jours écoulés = {$nombreDelaisEcoules} délai(s) de {$delaiAccorde} jours écoulé(s)" :
                    "Aucun délai complet écoulé"
            ];
        } catch (Exception $e) {
            error_log("Erreur calcul pénalités: " . $e->getMessage());
            return [
                'montant_penalites' => 0,
                'details' => 'Erreur calcul'
            ];
        }
    }

    /**
     * Récupère les données pour le rapport général avec toutes les déclarations
     */
    public function getRapportGeneral($filters = [])
    {
        try {
            // Récupérer toutes les déclarations avec les filtres
            $sql = "SELECT 
                    d.id,
                    d.reference,
                    i.nom as nom_impot,
                    CASE 
                        WHEN d.type_contribuable = 'particulier' THEN CONCAT(COALESCE(par.nom, ''), ' ', COALESCE(par.prenom, ''))
                        WHEN d.type_contribuable = 'entreprise' THEN COALESCE(e.raison_sociale, '')
                        ELSE 'Inconnu'
                    END as contribuable,
                    d.type_contribuable,
                    d.nif_contribuable,
                    d.montant as montant_du,
                    COALESCE(SUM(CASE WHEN pa.statut = 'complete' THEN pa.montant ELSE 0 END), 0) as montant_paye,
                    (d.montant - COALESCE(SUM(CASE WHEN pa.statut = 'complete' THEN pa.montant ELSE 0 END), 0)) as solde,
                    MAX(CASE 
                        WHEN pa.methode_paiement = 1 THEN 'cash'
                        WHEN pa.methode_paiement = 2 THEN 'mobile_money'
                        WHEN pa.methode_paiement = 3 THEN 'bank_deposit'
                        WHEN pa.methode_paiement = 4 THEN 'bank_transfer'
                        ELSE 'non_payé'
                    END) as methode_paiement,
                    MAX(COALESCE(pa.lieu_paiement, '')) as lieu_paiement,
                    d.statut,
                    d.date_creation,
                    d.donnees_json,
                    i.id as code_impot,
                    i.periode as periode_fiscale
                FROM declarations d
                LEFT JOIN paiements pa ON d.id = pa.id_declaration
                LEFT JOIN impots i ON d.id_impot = i.id
                LEFT JOIN particuliers par ON d.nif_contribuable = par.nif AND d.type_contribuable = 'particulier'
                LEFT JOIN entreprises e ON d.nif_contribuable = e.nif AND d.type_contribuable = 'entreprise'
                WHERE 1=1";

            $params = [];

            // Appliquer les filtres (même logique que getVerificationData)
            if (!empty($filters['search'])) {
                $sql .= " AND (d.reference LIKE :search OR i.nom LIKE :search OR 
                      par.nom LIKE :search OR par.prenom LIKE :search OR e.raison_sociale LIKE :search)";
                $params[':search'] = '%' . $filters['search'] . '%';
            }

            if (!empty($filters['status']) && $filters['status'] !== 'all') {
                $sql .= " AND d.statut = :status";
                $params[':status'] = $filters['status'];
            }

            if (!empty($filters['tax_type']) && $filters['tax_type'] !== 'all') {
                $sql .= " AND i.nom = :tax_type";
                $params[':tax_type'] = $filters['tax_type'];
            }

            if (!empty($filters['taxpayer_type']) && $filters['taxpayer_type'] !== 'all') {
                $sql .= " AND d.type_contribuable = :taxpayer_type";
                $params[':taxpayer_type'] = $filters['taxpayer_type'];
            }

            if (!empty($filters['payment_method']) && $filters['payment_method'] !== 'all') {
                $sql .= " AND pa.methode_paiement = :payment_method";
                $params[':payment_method'] = $this->getPaymentMethodId($filters['payment_method']);
            }

            if (!empty($filters['payment_place']) && $filters['payment_place'] !== 'all') {
                $sql .= " AND pa.lieu_paiement = :payment_place";
                $params[':payment_place'] = $filters['payment_place'];
            }

            if (!empty($filters['declaration_status']) && $filters['declaration_status'] !== 'all') {
                $sql .= " AND d.statut = :declaration_status";
                $params[':declaration_status'] = $filters['declaration_status'];
            }

            if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
                $sql .= " AND d.date_creation BETWEEN :start_date AND :end_date";
                $params[':start_date'] = $filters['start_date'] . " 00:00:00";
                $params[':end_date'] = $filters['end_date'] . " 23:59:59";
            }

            $sql .= " GROUP BY d.id
                  ORDER BY d.date_creation DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $declarations = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Récupérer les bénéficiaires pour chaque déclaration
            foreach ($declarations as &$declaration) {
                $sqlBeneficiaires = "SELECT 
                                    b.id,
                                    b.nom,
                                    b.telephone,
                                    b.numero_compte,
                                    rp.type_part,
                                    rp.valeur_part_originale,
                                    rp.valeur_part_calculee,
                                    rp.montant
                                FROM repartition_paiements rp
                                JOIN beneficiaires b ON rp.beneficiaire_id = b.id
                                WHERE rp.id_declaration = :declaration_id
                                ORDER BY rp.montant DESC";

                $stmtBenef = $this->pdo->prepare($sqlBeneficiaires);
                $stmtBenef->execute([':declaration_id' => $declaration['id']]);
                $beneficiaires = $stmtBenef->fetchAll(PDO::FETCH_ASSOC);

                $declaration['beneficiaires'] = $beneficiaires;
                $declaration['total_beneficiaires'] = array_sum(array_column($beneficiaires, 'montant'));

                // Décoder les données JSON si elles existent
                if (!empty($declaration['donnees_json'])) {
                    $declaration['donnees_json_decoded'] = json_decode($declaration['donnees_json'], true);
                }
            }

            // Calculer les totaux
            $totaux = [
                'total_montant_du' => array_sum(array_column($declarations, 'montant_du')),
                'total_montant_paye' => array_sum(array_column($declarations, 'montant_paye')),
                'total_solde' => array_sum(array_column($declarations, 'solde')),
                'total_declarations' => count($declarations),
                'declarations_payees' => count(array_filter($declarations, function($d) { return $d['statut'] === 'payé'; })),
                'declarations_en_attente' => count(array_filter($declarations, function($d) { return $d['statut'] === 'en_attente'; })),
                'declarations_rejetees' => count(array_filter($declarations, function($d) { return $d['statut'] === 'rejeté'; }))
            ];

            return [
                "status" => "success",
                "data" => [
                    "declarations" => $declarations,
                    "totaux" => $totaux,
                    "filtres_appliques" => $filters,
                    "date_generation" => date('Y-m-d H:i:s')
                ],
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération du rapport général: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération du rapport général: " . $e->getMessage(),
            ];
        }
    }

    /**
     * Convertit le nom de méthode de paiement en ID
     *
     * @param string $methodName Nom de la méthode
     * @return int ID de la méthode
     */
    private function getPaymentMethodId($methodName)
    {
        $methods = [
            'cash' => 1,
            'mobile_money' => 2,
            'bank_deposit' => 3,
            'bank_transfer' => 4,
        ];

        return $methods[$methodName] ?? 0;
    }
}
?>
