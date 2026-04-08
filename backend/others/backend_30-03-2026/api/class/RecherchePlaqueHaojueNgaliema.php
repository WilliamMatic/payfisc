<?php
// class/RecherchePlaque.php
require_once 'Connexion_haoujue_ngaliema.php';

/**
 * Classe RecherchePlaque - Gestion de la recherche de plaques
 */
class RecherchePlaque_haoujue_ngaliema extends Connexion_haoujue_ngaliema
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
     * Recherche les informations complètes d'un véhicule par plaque
     */
    public function rechercherParPlaque($plaque)
    {
        try {
            $this->beginTransactionSafe();

            // Nouvelle requête simplifiée avec les mêmes alias que l'ancienne
            $sql = "SELECT 
                -- Informations client (comme dans l'ancienne requête)
                CONCAT(p.first_name, ' ', p.last_name) AS nom_complet,
                p.phone_number AS telephone,
                p.address_line1 AS adresse,
                
                -- Informations véhicule
                v.chassis_number AS chassis,
                v.engine_number AS moteur,
                v.manufacturation_year AS annee_fabrication,
                v.working_year AS annee_circulation,
                
                -- Marque (concaténation comme dans l'ancienne requête)
                CONCAT(
                    v.vehicle_make_name,
                    ' ',
                    COALESCE(v.vehicle_model_name, '')
                ) AS marque,
                
                -- Modèle
                v.vehicle_model_name AS modele,
                
                -- Énergie (alias 'energie' dans la nouvelle requête)
                v.engine_power_name AS energie,
                
                -- Couleur
                v.vehicle_color_name AS couleur,
                
                -- Usage
                v.vehicle_usage_name AS usage_vehicule,
                
                -- Auto (valeur fixe comme dans l'ancienne requête)
                'Bicycle — Tricycle' AS type_auto,
                
                -- Puissance
                v.vehicle_fiscal_power_name AS puissance,
                
                -- Informations plaque (alias 'Plaque' dans la nouvelle requête)
                ia.reference AS numero_plaque,
                
                -- Information de suivi (à adapter selon ta logique)
                0 AS montant_suivi, -- Valeur par défaut ou à récupérer d'ailleurs
                
                -- Information plaque sortie (à adapter)
                NULL AS date_achat_plaque -- Valeur par défaut ou à récupérer d'ailleurs
                
            FROM people p
            
            INNER JOIN forms f ON p.id = f.person_id
            INNER JOIN vehicles v ON f.vehicle_id = v.id
            INNER JOIN inventory_articles ia ON f.id = ia.form_id
            INNER JOIN payments py ON f.id = py.form_id
            
            WHERE p.type = 'customer'
              AND f.form_state = 3
              AND f.status = 1
              AND f.is_deleted = 0
              AND p.is_deleted = 0
              AND ia.type = 'article'
              AND ia.status = 3
              AND ia.is_deleted = 0
              AND ia.reference = :plaque
            
            ORDER BY py.payment_date DESC, p.last_name, p.first_name";

            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':plaque', $plaque, PDO::PARAM_STR);
            $stmt->execute();
            
            $donnees = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$donnees) {
                $this->commitSafe();
                return [
                    "status" => "error", 
                    "message" => "Aucune donnée trouvée pour la plaque: " . $plaque
                ];
            }

            // Formater les données pour une utilisation plus facile
            // (RESTE IDENTIQUE - les noms d'alias sont les mêmes)
            $formattedData = [
                "client" => [
                    "nom_complet" => $donnees['nom_complet'] ?? '',
                    "telephone" => $donnees['telephone'] ?? '',
                    "adresse" => $donnees['adresse'] ?? ''
                ],
                "vehicule" => [
                    "chassis" => $donnees['chassis'] ?? '',
                    "moteur" => $donnees['moteur'] ?? '',
                    "annee_fabrication" => $donnees['annee_fabrication'] ?? '',
                    "annee_circulation" => $donnees['annee_circulation'] ?? '',
                    "marque" => $donnees['marque'] ?? '',
                    "modele" => $donnees['modele'] ?? '',
                    "energie" => $donnees['energie'] ?? '',
                    "couleur" => $donnees['couleur'] ?? '',
                    "usage" => $donnees['usage_vehicule'] ?? '',
                    "type_auto" => $donnees['type_auto'] ?? '',
                    "puissance" => $donnees['puissance'] ?? ''
                ],
                "plaque" => [
                    "numero" => $donnees['numero_plaque'] ?? '',
                    "date_achat" => $donnees['date_achat_plaque'] ?? ''
                ],
                "suivi" => [
                    "montant" => $donnees['montant_suivi'] ?? 0
                ]
            ];

            // Log de l'action de recherche
            $this->logAuditRecherche($plaque, $formattedData['client']['nom_complet']);

            $this->commitSafe();

            return [
                "status" => "success",
                "message" => "Données trouvées avec succès",
                "data" => $formattedData
            ];

        } catch (PDOException $e) {
            $this->rollbackSafe();
            error_log("Erreur lors de la recherche par plaque: " . $e->getMessage());
            return [
                "status" => "error", 
                "message" => "Erreur système: " . $e->getMessage()
            ];
        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("Erreur lors de la recherche par plaque: " . $e->getMessage());
            return [
                "status" => "error", 
                "message" => "Erreur: " . $e->getMessage()
            ];
        }
    }

    /**
     * Recherche avancée avec plusieurs critères
     */
    public function rechercherAvancee($criteres)
    {
        try {
            $this->beginTransactionSafe();

            // Construction dynamique de la requête avec la nouvelle structure
            $sql = "SELECT 
                -- Informations client
                CONCAT(p.first_name, ' ', p.last_name) AS nom_complet,
                p.phone_number AS telephone,
                p.address_line1 AS adresse,
                
                -- Informations véhicule
                v.chassis_number AS chassis,
                v.engine_number AS moteur,
                v.manufacturation_year AS annee_fabrication,
                v.working_year AS annee_circulation,
                
                -- Marque (avec concaténation comme avant)
                CONCAT(
                    v.vehicle_make_name,
                    ' ',
                    COALESCE(v.vehicle_model_name, '')
                ) AS marque,
                
                -- Modèle
                v.vehicle_model_name AS modele,
                
                -- Énergie
                v.engine_power_name AS energie,
                
                -- Couleur
                v.vehicle_color_name AS couleur,
                
                -- Usage
                v.vehicle_usage_name AS usage_vehicule,
                
                -- Auto (valeur fixe comme avant)
                'Moto' AS type_auto,
                
                -- Puissance
                v.vehicle_fiscal_power_name AS puissance,
                
                -- Informations plaque
                ia.reference AS numero_plaque,
                
                -- Information de suivi (à adapter)
                0 AS montant_suivi,
                
                -- Information plaque sortie (à adapter)
                NULL AS date_achat_plaque
                
            FROM people p
            
            INNER JOIN forms f ON p.id = f.person_id
            INNER JOIN vehicles v ON f.vehicle_id = v.id
            INNER JOIN inventory_articles ia ON f.id = ia.form_id
            INNER JOIN payments py ON f.id = py.form_id
            
            WHERE p.type = 'customer'
              AND f.form_state = 3
              AND f.status = 1
              AND f.is_deleted = 0
              AND p.is_deleted = 0
              AND ia.type = 'article'
              AND ia.status = 3
              AND ia.is_deleted = 0";

            $params = [];

            // Ajout des conditions dynamiques adaptées à la nouvelle structure
            if (!empty($criteres['plaque'])) {
                $sql .= " AND ia.reference LIKE :plaque";
                $params[':plaque'] = '%' . $criteres['plaque'] . '%';
            }

            if (!empty($criteres['chassis'])) {
                $sql .= " AND v.chassis_number LIKE :chassis";
                $params[':chassis'] = '%' . $criteres['chassis'] . '%';
            }

            if (!empty($criteres['moteur'])) {
                $sql .= " AND v.engine_number LIKE :moteur";
                $params[':moteur'] = '%' . $criteres['moteur'] . '%';
            }

            if (!empty($criteres['nom_client'])) {
                $sql .= " AND (p.first_name LIKE :nom OR p.last_name LIKE :prenom)";
                $params[':nom'] = '%' . $criteres['nom_client'] . '%';
                $params[':prenom'] = '%' . $criteres['nom_client'] . '%';
            }

            if (!empty($criteres['telephone'])) {
                $sql .= " AND p.phone_number LIKE :telephone";
                $params[':telephone'] = '%' . $criteres['telephone'] . '%';
            }

            // Ajout de critères supplémentaires pour la nouvelle structure
            if (!empty($criteres['marque'])) {
                $sql .= " AND v.vehicle_make_name LIKE :marque";
                $params[':marque'] = '%' . $criteres['marque'] . '%';
            }

            if (!empty($criteres['modele'])) {
                $sql .= " AND v.vehicle_model_name LIKE :modele";
                $params[':modele'] = '%' . $criteres['modele'] . '%';
            }

            // Ordre de tri adapté
            $sql .= " ORDER BY p.last_name, p.first_name, v.manufacturation_year DESC, py.payment_date DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($resultats)) {
                $this->commitSafe();
                return [
                    "status" => "error", 
                    "message" => "Aucun résultat trouvé avec les critères spécifiés"
                ];
            }

            // Formater les résultats (RESTE IDENTIQUE - mêmes alias)
            $formattedResults = [];
            foreach ($resultats as $donnees) {
                $formattedResults[] = [
                    "client" => [
                        "nom_complet" => $donnees['nom_complet'] ?? '',
                        "telephone" => $donnees['telephone'] ?? '',
                        "adresse" => $donnees['adresse'] ?? ''
                    ],
                    "vehicule" => [
                        "chassis" => $donnees['chassis'] ?? '',
                        "moteur" => $donnees['moteur'] ?? '',
                        "annee_fabrication" => $donnees['annee_fabrication'] ?? '',
                        "annee_circulation" => $donnees['annee_circulation'] ?? '',
                        "marque" => $donnees['marque'] ?? '',
                        "modele" => $donnees['modele'] ?? '',
                        "energie" => $donnees['energie'] ?? '',
                        "couleur" => $donnees['couleur'] ?? '',
                        "usage" => $donnees['usage_vehicule'] ?? '',
                        "type_auto" => $donnees['type_auto'] ?? '',
                        "puissance" => $donnees['puissance'] ?? ''
                    ],
                    "plaque" => [
                        "numero" => $donnees['numero_plaque'] ?? '',
                        "date_achat" => $donnees['date_achat_plaque'] ?? ''
                    ],
                    "suivi" => [
                        "montant" => $donnees['montant_suivi'] ?? 0
                    ]
                ];
            }

            $this->commitSafe();

            return [
                "status" => "success",
                "message" => count($formattedResults) . " résultat(s) trouvé(s)",
                "data" => $formattedResults,
                "count" => count($formattedResults)
            ];

        } catch (PDOException $e) {
            $this->rollbackSafe();
            error_log("Erreur lors de la recherche avancée: " . $e->getMessage());
            return [
                "status" => "error", 
                "message" => "Erreur système: " . $e->getMessage()
            ];
        }
    }

    /**
     * Vérifie si une plaque existe déjà
     */
    public function verifierExistencePlaque($plaque)
    {
        try {
            $sql = "SELECT COUNT(*) as count FROM inventory_articles WHERE reference = :plaque";
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':plaque', $plaque, PDO::PARAM_STR);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return [
                "status" => "success",
                "existe" => ($result['count'] > 0),
                "count" => $result['count']
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de plaque: " . $e->getMessage());
            return [
                "status" => "error", 
                "message" => "Erreur système: " . $e->getMessage()
            ];
        }
    }

    /**
     * Log l'action de recherche
     */
    private function logAuditRecherche($plaque, $nomClient)
    {
        try {
            $userId = $_SESSION['user_id'] ?? 'system';
            $userType = $_SESSION['user_type'] ?? 'system';
            $message = "Recherche plaque: $plaque - Client: $nomClient";
            
            $sql = "INSERT INTO audit_log (user_id, user_type, action, timestamp) 
                    VALUES (:user_id, :user_type, :action, NOW())";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':user_id' => $userId,
                ':user_type' => $userType,
                ':action' => $message
            ]);
        } catch (PDOException $e) {
            error_log("Erreur lors du log d'audit recherche: " . $e->getMessage());
        }
    }

    /**
     * Vérifie si une transaction est active
     */
    public function isTransactionActive()
    {
        return $this->transactionActive;
    }

    /**
     * Destructeur pour s'assurer que les transactions sont fermées
     */
    public function __destruct()
    {
        if ($this->transactionActive) {
            error_log("ATTENTION: Transaction toujours active à la destruction de l'objet RecherchePlaque");
            $this->rollbackSafe();
        }
    }
}
?>