<?php
// class/RecherchePlaque.php
require_once 'Connexion_haoujue.php';

/**
 * Classe RecherchePlaque - Gestion de la recherche de plaques
 */
class RecherchePlaque extends Connexion_haoujue
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

            /* ============================
             * 1️⃣ RECHERCHE DANS LA BASE PRINCIPALE
             * ============================ */
            $sql = "SELECT 
                CONCAT(finance_gclient.nom, ' ', COALESCE(finance_gclient.postnom, ''), ' ', COALESCE(finance_gclient.prenom, '')) AS nom_complet,
                finance_gclient.telephone,
                finance_gclient.adresse,

                finance_gvehicule.chassis,
                finance_gvehicule.moteur,
                finance_gvehicule.anneefabr AS annee_fabrication,
                finance_gvehicule.anneecirc AS annee_circulation,

                CONCAT(finance_marquev.libelle, ' ', COALESCE(finance_modelev.libelle, '')) AS marque,
                finance_modelev.libelle AS modele,

                'Essence' AS energie,
                finance_couleurv.libelle AS couleur,
                finance_gusage.libelle AS usage_vehicule,
                'Bicycle — Tricycle' AS type_auto,
                finance_gpuissance.libelle AS puissance,

                finance_gplaque.plaque AS numero_plaque,
                finance_gsuivi.montant AS montant_suivi,
                finance_gplaquesortie.datecreation AS date_achat_plaque

            FROM finance_gclient
            LEFT JOIN finance_gvehicule ON finance_gclient.id = finance_gvehicule.idclient
            LEFT JOIN finance_marquev ON finance_gvehicule.idmarque = finance_marquev.id
            LEFT JOIN finance_modelev ON finance_gvehicule.idmodele = finance_modelev.id
            LEFT JOIN finance_energiev ON finance_gvehicule.idenergie = finance_energiev.id
            LEFT JOIN finance_couleurv ON finance_gvehicule.idcouleur = finance_couleurv.id
            LEFT JOIN finance_gusage ON finance_gvehicule.idusage = finance_gusage.id
            LEFT JOIN finance_autov ON finance_gvehicule.idtypeauto = finance_autov.id
            LEFT JOIN finance_gpuissance ON finance_gvehicule.idpuissance = finance_gpuissance.id
            LEFT JOIN finance_gsuivi ON finance_gvehicule.id = finance_gsuivi.idvehicule
            LEFT JOIN finance_gplaquesortie ON finance_gsuivi.id = finance_gplaquesortie.idsuivi
            LEFT JOIN finance_gplaque ON finance_gplaquesortie.idplaque = finance_gplaque.id
            WHERE finance_gplaque.plaque = :plaque
            LIMIT 1";

            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':plaque', $plaque, PDO::PARAM_STR);
            $stmt->execute();

            $donnees = $stmt->fetch(PDO::FETCH_ASSOC);

            /* ============================
             * 2️⃣ SI NON TROUVÉ → BASE ONLINE
             * ============================ */
            if (!$donnees) {

                $sql = "SELECT 
                    noms AS nom_complet,
                    adresse,
                    '' AS telephone,
                    chassis,
                    moteur,
                    anneefabr AS annee_fabrication,
                    anneecir AS annee_circulation,
                    marquemodele AS marque,
                    '' AS modele,
                    'Essence' AS energie,
                    couleur,
                    usages AS usage_vehicule,
                    'Bicycle — Tricycle' AS type_auto,
                    puisfiscale AS puissance,
                    plaque AS numero_plaque,
                    '32' AS montant_suivi,
                    DATE(datecreation) AS date_achat_plaque
                FROM finance_gplaqueonline
                WHERE plaque = :plaque
                LIMIT 1";

                $stmt = $this->pdo->prepare($sql);
                $stmt->bindValue(':plaque', $plaque, PDO::PARAM_STR);
                $stmt->execute();

                $donnees = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$donnees) {
                    return [
                        "status" => "error",
                        "message" => "Aucune donnée trouvée pour la plaque : " . $plaque
                    ];
                }
            }

            /* ============================
             * 3️⃣ FORMATAGE FINAL
             * ============================ */
            $formattedData = [
                "client" => [
                    "nom_complet" => $donnees['nom_complet'] ?? '',
                    "telephone"   => $donnees['telephone'] ?? '',
                    "adresse"     => $donnees['adresse'] ?? ''
                ],
                "vehicule" => [
                    "chassis"             => $donnees['chassis'] ?? '',
                    "moteur"              => $donnees['moteur'] ?? '',
                    "annee_fabrication"   => $donnees['annee_fabrication'] ?? '',
                    "annee_circulation"   => $donnees['annee_circulation'] ?? '',
                    "marque"              => $donnees['marque'] ?? '',
                    "modele"              => $donnees['modele'] ?? '',
                    "energie"             => $donnees['energie'] ?? '',
                    "couleur"             => $donnees['couleur'] ?? '',
                    "usage"               => $donnees['usage_vehicule'] ?? '',
                    "type_auto"           => $donnees['type_auto'] ?? '',
                    "puissance"           => $donnees['puissance'] ?? ''
                ],
                "plaque" => [
                    "numero"      => $donnees['numero_plaque'] ?? '',
                    "date_achat"  => $donnees['date_achat_plaque'] ?? ''
                ],
                "suivi" => [
                    "montant" => $donnees['montant_suivi'] ?? 0
                ]
            ];

            /* ============================
             * 4️⃣ AUDIT
             * ============================ */
            $this->logAuditRecherche(
                $plaque,
                $formattedData['client']['nom_complet'] ?: 'INCONNU'
            );

            return [
                "status"  => "success",
                "message" => "Données trouvées avec succès",
                "data"    => $formattedData
            ];

        } catch (Exception $e) {
            error_log("Erreur recherche plaque : " . $e->getMessage());
            return [
                "status"  => "error",
                "message" => "Erreur système"
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

            // Construction dynamique de la requête
            $sql = "SELECT 
                -- Informations client
                CONCAT(finance_gclient.nom, ' ', COALESCE(finance_gclient.postnom, ''), ' ', COALESCE(finance_gclient.prenom, '')) AS nom_complet,
                finance_gclient.telephone,
                finance_gclient.adresse,
                
                -- Informations véhicule
                finance_gvehicule.chassis,
                finance_gvehicule.moteur,
                finance_gvehicule.anneefabr AS annee_fabrication,
                finance_gvehicule.anneecirc AS annee_circulation,
                
                -- Marque
                finance_marquev.libelle AS marque,
                
                -- Modèle
                finance_modelev.libelle AS modele,
                
                -- Énergie
                'Essence' AS energie,
                
                -- Couleur
                finance_couleurv.libelle AS couleur,
                
                -- Usage
                finance_gusage.libelle AS usage_vehicule,
                
                -- Auto
                finance_autov.libelle AS type_auto,
                
                -- Puissance
                finance_gpuissance.libelle AS puissance,
                
                -- Informations plaque
                finance_gplaque.plaque AS numero_plaque,
                
                -- Information de suivi
                finance_gsuivi.montant AS montant_suivi,
                
                -- Information plaque sortie
                finance_gplaquesortie.datecreation AS date_achat_plaque
                
            FROM finance_gclient
            
            LEFT JOIN finance_gvehicule ON finance_gclient.id = finance_gvehicule.idclient
            LEFT JOIN finance_marquev ON finance_gvehicule.idmarque = finance_marquev.id
            LEFT JOIN finance_modelev ON finance_gvehicule.idmodele = finance_modelev.id
            LEFT JOIN finance_energiev ON finance_gvehicule.idenergie = finance_energiev.id
            LEFT JOIN finance_couleurv ON finance_gvehicule.idcouleur = finance_couleurv.id
            LEFT JOIN finance_gusage ON finance_gvehicule.idusage = finance_gusage.id
            LEFT JOIN finance_autov ON finance_gvehicule.idtypeauto = finance_autov.id
            LEFT JOIN finance_gpuissance ON finance_gvehicule.idpuissance = finance_gpuissance.id
            LEFT JOIN finance_gsuivi ON finance_gvehicule.id = finance_gsuivi.idvehicule
            LEFT JOIN finance_gplaquesortie ON finance_gsuivi.id = finance_gplaquesortie.idsuivi
            LEFT JOIN finance_gplaque ON finance_gplaquesortie.idplaque = finance_gplaque.id
            
            WHERE 1=1";

            $params = [];

            // Ajout des conditions dynamiques
            if (!empty($criteres['plaque'])) {
                $sql .= " AND finance_gplaque.plaque LIKE :plaque";
                $params[':plaque'] = '%' . $criteres['plaque'] . '%';
            }

            if (!empty($criteres['chassis'])) {
                $sql .= " AND finance_gvehicule.chassis LIKE :chassis";
                $params[':chassis'] = '%' . $criteres['chassis'] . '%';
            }

            if (!empty($criteres['moteur'])) {
                $sql .= " AND finance_gvehicule.moteur LIKE :moteur";
                $params[':moteur'] = '%' . $criteres['moteur'] . '%';
            }

            if (!empty($criteres['nom_client'])) {
                $sql .= " AND (finance_gclient.nom LIKE :nom OR finance_gclient.prenom LIKE :prenom)";
                $params[':nom'] = '%' . $criteres['nom_client'] . '%';
                $params[':prenom'] = '%' . $criteres['nom_client'] . '%';
            }

            if (!empty($criteres['telephone'])) {
                $sql .= " AND finance_gclient.telephone LIKE :telephone";
                $params[':telephone'] = '%' . $criteres['telephone'] . '%';
            }

            // Ordre de tri
            $sql .= " ORDER BY finance_gclient.nom, finance_gclient.postnom, finance_gclient.prenom, finance_gvehicule.anneefabr DESC";

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

            // Formater les résultats
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
            $sql = "SELECT COUNT(*) as count FROM finance_gplaque WHERE plaque = :plaque";
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