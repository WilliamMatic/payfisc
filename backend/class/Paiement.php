<?php
require_once 'Connexion.php';

/**
 * Classe Paiement - Gestion des vérifications NIF et processus de paiement
 */
class Paiement extends Connexion
{
    /**
     * Enregistre une notification dans la base de données
     *
     * @param string $type Type de notification
     * @param string $titre Titre de la notification
     * @param string $message Message de la notification
     * @param string|null $nif NIF du contribuable
     * @param int|null $idDeclaration ID de la déclaration
     * @param int|null $idPaiement ID du paiement
     * @return bool Succès de l'opération
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

    /**
     * Vérifie l'existence d'un NIF dans la base de données
     */
    public function verifierNif($nif)
    {
        try {
            // Vérifier d'abord dans la table des particuliers
            $sqlParticulier = "SELECT * FROM particuliers WHERE nif = :nif OR telephone = :telephone";
            $stmtParticulier = $this->pdo->prepare($sqlParticulier);
            $stmtParticulier->execute(['nif' => $nif, 'telephone' => $nif]);
            $particulier = $stmtParticulier->fetch(PDO::FETCH_ASSOC);

            if ($particulier) {
                return [
                    "status" => "success",
                    "message" => "NIF trouvé",
                    "data" => $particulier,
                    "type" => "particulier",
                ];
            }

            // Si pas trouvé dans les particuliers, vérifier dans les entreprises
            $sqlEntreprise = "SELECT * FROM entreprises WHERE nif = :nif OR telephone = :telephone";
            $stmtEntreprise = $this->pdo->prepare($sqlEntreprise);
            $stmtEntreprise->execute(['nif' => $nif, 'telephone' => $nif]);
            $entreprise = $stmtEntreprise->fetch(PDO::FETCH_ASSOC);

            if ($entreprise) {
                return [
                    "status" => "success",
                    "message" => "NIF trouvé",
                    "data" => $entreprise,
                    "type" => "entreprise",
                ];
            }

            // Si aucun résultat trouvé
            return [
                "status" => "error",
                "message" => "Numéro NIF introuvable",
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du NIF: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la vérification du NIF",
            ];
        }
    }

    /**
     * Enregistre une déclaration et prépare le paiement AVEC NOTIFICATION
     */
    public function enregistrerDeclaration($data)
    {
        try {
            $this->pdo->beginTransaction();

            // Récupérer les infos du site si site_code est fourni
            $siteId = null;
            $provinceId = null;

            if (!empty($data['site_code'])) {
                $sqlSite = "SELECT id, province_id FROM sites WHERE code = :code AND actif = 1";
                $stmtSite = $this->pdo->prepare($sqlSite);
                $stmtSite->execute([':code' => $data['site_code']]);
                $site = $stmtSite->fetch(PDO::FETCH_ASSOC);

                if ($site) {
                    $siteId = $site['id'];
                    $provinceId = $site['province_id'];
                }
            }

            // Générer une référence unique pour cette déclaration
            $reference = 'DEC' . date('YmdHis') . rand(1000, 9999);

            // Insérer la déclaration principale avec les nouvelles colonnes
            $sqlDeclaration = "INSERT INTO declarations 
                          (reference, nif_contribuable, type_contribuable, id_impot, 
                           montant, statut, donnees_json, date_creation, utilisateur, site, province) 
                          VALUES 
                          (:reference, :nif, :type_contribuable, :id_impot, 
                           :montant, 'en_attente', :donnees_json, NOW(), :utilisateur, :site, :province)";

            $stmtDeclaration = $this->pdo->prepare($sqlDeclaration);
            $stmtDeclaration->execute([
                ':reference' => $reference,
                ':nif' => $data['nif'],
                ':type_contribuable' => $data['type_contribuable'],
                ':id_impot' => $data['id_impot'],
                ':montant' => $data['montant'],
                ':donnees_json' => json_encode($data['donnees_formulaire']),
                ':utilisateur' => $data['utilisateur_id'] ?? null,
                ':site' => $siteId,
                ':province' => $provinceId
            ]);

            $idDeclaration = $this->pdo->lastInsertId();

            // 🔔 ENREGISTRER LA NOTIFICATION
            $this->enregistrerNotification(
                'declaration_enregistree',
                'Déclaration enregistrée',
                "Déclaration #$reference a été enregistrée avec succès. Montant : {$data['montant']} ",
                $data['nif'],
                $idDeclaration
            );

            $this->pdo->commit();

            return [
                "status" => "success",
                "message" => "Déclaration enregistrée avec succès",
                "data" => [
                    "id_declaration" => $idDeclaration,
                    "reference" => $reference,
                    "montant" => $data['montant']
                ]
            ];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'enregistrement de la déclaration: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de l'enregistrement de la déclaration"
            ];
        }
    }

    /**
     * Récupère les détails d'une déclaration pour générer un reçu
     *
     * @param int $idDeclaration ID de la déclaration
     * @return array Détails de la déclaration
     */
    public function getDetailsDeclaration($idDeclaration)
    {
        try {
            $sql = "SELECT d.*, i.nom as nom_impot, i.description as description_impot,
                               CASE 
                                   WHEN d.type_contribuable = 'particulier' THEN p.nom
                                   WHEN d.type_contribuable = 'entreprise' THEN e.raison_sociale
                               END as nom_contribuable,
                               CASE 
                                   WHEN d.type_contribuable = 'particulier' THEN p.prenom
                                   ELSE NULL
                               END as prenom_contribuable
                        FROM declarations d
                        JOIN impots i ON d.id_impot = i.id
                        LEFT JOIN particuliers p ON d.nif_contribuable = p.nif AND d.type_contribuable = 'particulier'
                        LEFT JOIN entreprises e ON d.nif_contribuable = e.nif AND d.type_contribuable = 'entreprise'
                        WHERE d.id = :id";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $idDeclaration]);
            $declaration = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$declaration) {
                return [
                    "status" => "error",
                    "message" => "Déclaration introuvable",
                ];
            }

            // Décoder les données JSON
            $declaration['donnees_json'] = json_decode($declaration['donnees_json'], true);

            return [
                "status" => "success",
                "data" => $declaration,
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des détails de la déclaration: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des détails de la déclaration",
            ];
        }
    }

    /**
     * Récupère les méthodes de paiement disponibles
     *
     * @return array Liste des méthodes de paiement
     */
    public function getMethodesPaiement()
    {
        try {
            $sql = "SELECT id, nom, description, frais, actif 
                        FROM methodes_paiement 
                        WHERE actif = 1 
                        ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            $methodes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "data" => $methodes,
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des méthodes de paiement: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des méthodes de paiement",
            ];
        }
    }
    /**
     * Supprime une déclaration AVEC NOTIFICATION
     *
     * @param int $idDeclaration ID de la déclaration à supprimer
     * @return array Résultat de l'opération
     */
    public function supprimerDeclaration($idDeclaration)
    {
        try {
            $this->pdo->beginTransaction();

            // Vérifier que la déclaration existe et n'est pas déjà payée
            $sqlVerif = "SELECT id, statut, reference, nif_contribuable FROM declarations WHERE id = :id";
            $stmtVerif = $this->pdo->prepare($sqlVerif);
            $stmtVerif->execute([':id' => $idDeclaration]);
            $declaration = $stmtVerif->fetch(PDO::FETCH_ASSOC);

            if (!$declaration) {
                return [
                    "status" => "error",
                    "message" => "Déclaration introuvable"
                ];
            }

            if ($declaration['statut'] === 'payee') {
                return [
                    "status" => "error",
                    "message" => "Impossible de supprimer une déclaration déjà payée"
                ];
            }
            // Supprimer la notification
            $sqlDelete = "DELETE FROM notifications WHERE id_declaration = :id";
            $stmtDelete = $this->pdo->prepare($sqlDelete);
            $stmtDelete->execute([':id' => $idDeclaration]);

            // Supprimer la déclaration
            $sqlDelete = "DELETE FROM declarations WHERE id = :id";
            $stmtDelete = $this->pdo->prepare($sqlDelete);
            $stmtDelete->execute([':id' => $idDeclaration]);

            // 🔔 ENREGISTRER LA NOTIFICATION DE SUPPRESSION
            $this->enregistrerNotification(
                'declaration_supprimee',
                'Déclaration supprimée',
                "Déclaration #{$declaration['reference']} a été supprimée avec succès",
                $declaration['nif_contribuable'],
                $idDeclaration
            );

            $this->pdo->commit();

            return [
                "status" => "success",
                "message" => "Déclaration supprimée avec succès"
            ];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de la suppression de la déclaration: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la suppression de la déclaration " . $e
            ];
        }
    }

    /**
     * Traite un paiement pour une déclaration AVEC NOTIFICATION ET REPARTITION ET DONNEES SUPPLEMENTAIRES
     *
     * @param int $idDeclaration ID de la déclaration
     * @param int $idMethodePaiement ID de la méthode de paiement
     * @param float $montantPenalites Montant des pénalités
     * @param array $donneesPaiement Données supplémentaires de paiement
     * @param string $referencePaiement Référence du paiement
     * @return array Résultat de l'opération
     */
    public function traiterPaiement($idDeclaration, $idMethodePaiement, $montantPenalites = 0, $donneesPaiement = [], $referencePaiement = null)
    {
        try {
            $this->pdo->beginTransaction();

            // Vérifier que la déclaration existe et est en attente
            $sqlVerif = "SELECT d.id, d.montant, d.statut, d.nif_contribuable, d.reference as reference_declaration 
                     FROM declarations d 
                     WHERE d.id = :id";
            $stmtVerif = $this->pdo->prepare($sqlVerif);
            $stmtVerif->execute([':id' => $idDeclaration]);
            $declaration = $stmtVerif->fetch(PDO::FETCH_ASSOC);

            if (!$declaration) {
                return [
                    "status" => "error",
                    "message" => "Déclaration introuvable"
                ];
            }

            if ($declaration['statut'] !== 'en_attente') {
                return [
                    "status" => "error",
                    "message" => "La déclaration a déjà été traitée"
                ];
            }

            // Calculer le montant total (montant initial + pénalités)
            $montantTotal = $declaration['montant'] + $montantPenalites;

            // Générer une référence de paiement si non fournie
            if (!$referencePaiement) {
                $referencePaiement = 'PAY' . date('YmdHis') . rand(1000, 9999);
            }

            // Sérialiser les données de paiement supplémentaires
            $donneesPaiementJson = !empty($donneesPaiement) ? json_encode($donneesPaiement) : null;

            // Enregistrer le paiement avec les pénalités et données supplémentaires
            $sqlPaiement = "INSERT INTO paiements 
                       (id_declaration, methode_paiement, reference_paiement, montant, montant_penalite, donnees_paiement, statut, date_paiement, lieu_paiement) 
                       VALUES 
                       (:id_declaration, :methode_paiement, :reference_paiement, :montant, :montant_penalite, :donnees_paiement, 'complete', NOW(), 'app')";

            $stmtPaiement = $this->pdo->prepare($sqlPaiement);
            $stmtPaiement->execute([
                ':id_declaration' => $idDeclaration,
                ':methode_paiement' => $idMethodePaiement,
                ':reference_paiement' => $referencePaiement,
                ':montant' => $montantTotal,
                ':montant_penalite' => $montantPenalites,
                ':donnees_paiement' => $donneesPaiementJson
            ]);

            $idPaiement = $this->pdo->lastInsertId();

            // Mettre à jour le statut de la déclaration
            $sqlUpdate = "UPDATE declarations SET statut = 'payé', date_modification = NOW() WHERE id = :id";
            $stmtUpdate = $this->pdo->prepare($sqlUpdate);
            $stmtUpdate->execute([':id' => $idDeclaration]);

            // 🔄 CALCULER LA REPARTITION DES BENEFICIAIRES
            $resultRepartition = $this->calculerRepartitionBeneficiaires($idDeclaration, $montantTotal, 1);

            if ($resultRepartition['status'] === 'error') {
                // Logger l'erreur mais ne pas bloquer le paiement
                error_log("Erreur répartition bénéficiaires: " . $resultRepartition['message']);
            }

            // 🔔 ENREGISTRER LA NOTIFICATION DE PAIEMENT
            $this->enregistrerNotification(
                'paiement_effectue',
                'Paiement effectué',
                "Paiement #$referencePaiement pour la déclaration #{$declaration['reference_declaration']} a été traité avec succès. Montant total : $montantTotal ",
                $declaration['nif_contribuable'],
                $idDeclaration,
                $idPaiement
            );

            $this->pdo->commit();

            return [
                "status" => "success",
                "message" => "Paiement traité avec succès",
                "data" => [
                    "id_paiement" => $idPaiement,
                    "reference_paiement" => $referencePaiement,
                    "montant_initial" => $declaration['montant'],
                    "montant_penalites" => $montantPenalites,
                    "montant_total" => $montantTotal,
                    "donnees_paiement" => $donneesPaiement,
                    "repartition" => $resultRepartition['status'] === 'success' ? $resultRepartition['data'] : null
                ]
            ];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors du traitement du paiement: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors du traitement du paiement"
            ];
        }
    }

    /**
     * Recherche une déclaration par son numéro et vérifie qu'elle est en attente
     */
    public function rechercherDeclaration($numeroDeclaration)
    {
        try {
            // Rechercher la déclaration avec les informations de l'impôt
            $sql = "SELECT d.*, i.nom as nom_impot, i.description as description_impot, 
                               i.formulaire_json, i.periode, i.delai_accord, i.penalites,
                               CASE 
                                   WHEN d.type_contribuable = 'particulier' THEN p.nom
                                   WHEN d.type_contribuable = 'entreprise' THEN e.raison_sociale
                               END as nom_contribuable,
                               CASE 
                                   WHEN d.type_contribuable = 'particulier' THEN p.prenom
                                   ELSE NULL
                               END as prenom_contribuable,
                               CASE 
                                   WHEN d.type_contribuable = 'particulier' THEN p.nif
                                   WHEN d.type_contribuable = 'entreprise' THEN e.nif
                               END as nif_contribuable
                        FROM declarations d
                        JOIN impots i ON d.id_impot = i.id
                        LEFT JOIN particuliers p ON d.nif_contribuable = p.nif AND d.type_contribuable = 'particulier'
                        LEFT JOIN entreprises e ON d.nif_contribuable = e.nif AND d.type_contribuable = 'entreprise'
                        WHERE d.reference = :reference";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':reference' => $numeroDeclaration]);
            $declaration = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$declaration) {
                return [
                    "status" => "error",
                    "message" => "Déclaration introuvable",
                ];
            }

            // Vérifier que la déclaration est en attente
            if ($declaration['statut'] !== 'en_attente') {
                return [
                    "status" => "error",
                    "message" => "Cette déclaration a déjà été traitée (statut: " . $declaration['statut'] . ")",
                ];
            }

            // Décoder les données JSON
            $declaration['donnees_json'] = json_decode($declaration['donnees_json'], true);
            $declaration['formulaire_json'] = json_decode($declaration['formulaire_json'], true);
            $declaration['penalites'] = json_decode($declaration['penalites'], true);

            return [
                "status" => "success",
                "message" => "Déclaration trouvée et en attente de paiement",
                "data" => $declaration,
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche de déclaration: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la recherche de déclaration",
            ];
        }
    }

    /**
     * Récupère les dernières notifications (sans NIF spécifique)
     *
     * @param int $limit Nombre de notifications à récupérer
     * @return array Liste des notifications
     */
    public function getDernieresNotifications($limit = 3)
    {
        try {
            $sql = "SELECT id, type_notification, titre, message, lu, date_creation, date_lu
                    FROM notifications 
                    WHERE lu = 0
                    ORDER BY date_creation DESC 
                    LIMIT :limit";

            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();

            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "data" => $notifications
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des dernières notifications: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des notifications"
            ];
        }
    }

    /**
     * Récupère les statistiques des notifications
     *
     * @param string|null $nif NIF spécifique (optionnel)
     * @return array Statistiques des notifications
     */
    public function getStatsNotifications($nif = null)
    {
        try {
            $whereClause = "";
            $params = [];

            if ($nif) {
                $whereClause = "WHERE nif_contribuable = :nif";
                $params[':nif'] = $nif;
            }

            // Fonction pour ajouter correctement WHERE ou AND
            $addCondition = function ($condition) use (&$whereClause) {
                if ($whereClause === "") {
                    $whereClause = "WHERE $condition";
                } else {
                    $whereClause .= " AND $condition";
                }
                return $whereClause;
            };

            // Total des notifications
            $sqlTotal = "SELECT COUNT(*) as total FROM notifications $whereClause";
            $stmtTotal = $this->pdo->prepare($sqlTotal);
            $stmtTotal->execute($params);
            $total = $stmtTotal->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

            // Notifications non lues
            $whereUnread = $nif ? "WHERE nif_contribuable = :nif AND lu = 0" : "WHERE lu = 0";
            $sqlUnread = "SELECT COUNT(*) as unread FROM notifications $whereUnread";
            $stmtUnread = $this->pdo->prepare($sqlUnread);
            $stmtUnread->execute($params);
            $unread = $stmtUnread->fetch(PDO::FETCH_ASSOC)['unread'] ?? 0;

            // Notifications de type succès
            $whereSuccess = $nif ? "WHERE nif_contribuable = :nif AND type_notification = 'paiement_effectue'"
                                 : "WHERE type_notification = 'paiement_effectue'";
            $sqlSuccess = "SELECT COUNT(*) as success FROM notifications $whereSuccess";
            $stmtSuccess = $this->pdo->prepare($sqlSuccess);
            $stmtSuccess->execute($params);
            $success = $stmtSuccess->fetch(PDO::FETCH_ASSOC)['success'] ?? 0;

            // Notifications de type alerte (warning + error)
            $whereAlerts = $nif ? "WHERE nif_contribuable = :nif AND type_notification IN ('declaration_en_attente', 'declaration_supprimee', 'paiement_echec')"
                                : "WHERE type_notification IN ('declaration_en_attente', 'declaration_supprimee', 'paiement_echec')";
            $sqlAlerts = "SELECT COUNT(*) as alerts FROM notifications $whereAlerts";
            $stmtAlerts = $this->pdo->prepare($sqlAlerts);
            $stmtAlerts->execute($params);
            $alerts = $stmtAlerts->fetch(PDO::FETCH_ASSOC)['alerts'] ?? 0;

            return [
                "status" => "success",
                "data" => [
                    "total" => (int)$total,
                    "unread" => (int)$unread,
                    "success" => (int)$success,
                    "alerts" => (int)$alerts
                ]
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des stats notifications: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des statistiques : " . $e->getMessage()
            ];
        }
    }


    /**
     * Récupère les notifications non lues et les marque comme lues
     *
     * @param string|null $nif NIF spécifique (optionnel)
     * @param int $limit Nombre maximum de notifications
     * @return array Liste des notifications non lues
     */
    public function getNotificationsNonLues($nif = null, $limit = 50)
    {
        try {
            $this->pdo->beginTransaction();

            // Construire WHERE
            $whereClause = "WHERE lu = 0";
            $params = [];

            if ($nif) {
                $whereClause .= " AND nif_contribuable = :nif";
                $params[':nif'] = $nif;
            }

            // Récupérer les notifications non lues
            // Note : LIMIT ne peut pas être lié comme un paramètre PDO, donc on le place directement en entier sécurisé
            $limit = (int)$limit; // Sécurité
            $sqlSelect = "SELECT id, type_notification, titre, message, lu, date_creation, date_lu,
                                 nif_contribuable, id_declaration, id_paiement
                          FROM notifications 
                          $whereClause 
                          ORDER BY date_creation DESC 
                          LIMIT $limit";

            $stmtSelect = $this->pdo->prepare($sqlSelect);
            $stmtSelect->execute($params);
            $notifications = $stmtSelect->fetchAll(PDO::FETCH_ASSOC);

            // Marquer comme lues
            if (!empty($notifications)) {
                $ids = array_column($notifications, 'id');

                // Sécurité : s'assurer que les IDs sont bien des entiers
                $ids = array_map('intval', $ids);

                $placeholders = implode(',', array_fill(0, count($ids), '?'));

                $sqlUpdate = "UPDATE notifications SET lu = 1, date_lu = NOW() WHERE id IN ($placeholders)";
                $stmtUpdate = $this->pdo->prepare($sqlUpdate);
                $stmtUpdate->execute($ids);
            }

            $this->pdo->commit();

            return [
                "status" => "success",
                "data" => $notifications
            ];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de la récupération des notifications non lues: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des notifications : " . $e->getMessage()
            ];
        }
    }

    /**
     * Récupère un impôt spécifique par son ID
     */
    public function getImpotById($idImpot)
    {
        try {
            $sql = "SELECT id, nom, description, formulaire_json, periode, delai_accord, penalites 
                    FROM impots 
                    WHERE id = :id AND actif = 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $idImpot]);
            $impot = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$impot) {
                return [
                    "status" => "error",
                    "message" => "Impôt introuvable ou inactif",
                ];
            }

            // Décoder le JSON
            $impot['formulaire_json'] = json_decode($impot['formulaire_json'], true);
            $impot['penalites'] = json_decode($impot['penalites'], true);

            return [
                "status" => "success",
                "data" => $impot,
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération de l'impôt: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération de l'impôt",
            ];
        }
    }



    /**
     * Récupère tous les impôts disponibles
     *
     * @return array Liste des impôts ou message d'erreur
     */
    public function getImpots()
    {
        try {
            $sql = "SELECT id, nom, description, formulaire_json, periode, delai_accord, penalites 
                        FROM impots 
                        WHERE actif = 1 
                        ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            $impots = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Décoder le JSON pour chaque impôt
            foreach ($impots as &$impot) {
                $impot['formulaire_json'] = json_decode($impot['formulaire_json'], true);
            }

            return [
                "status" => "success",
                "data" => $impots,
            ];
        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des impôts: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des impôts",
            ];
        }
    }

    /**
     * Calcule et enregistre la répartition pour les bénéficiaires
     * en multipliant les pourcentages par le nombre de déclarations
     */
    public function calculerRepartitionBeneficiaires($idDeclaration, $montantTotal, $nombreDeclarations)
    {
        try {

            // 1. Récupérer l'impôt lié à cette déclaration
            $sqlImpot = "SELECT id_impot FROM declarations WHERE id = :id_declaration";
            $stmtImpot = $this->pdo->prepare($sqlImpot);
            $stmtImpot->execute([':id_declaration' => $idDeclaration]);
            $declaration = $stmtImpot->fetch(PDO::FETCH_ASSOC);

            if (!$declaration) {
                throw new Exception("Déclaration introuvable");
            }

            $idImpot = $declaration['id_impot'];

            // 2. Récupérer les bénéficiaires de cet impôt
            $sqlBeneficiaires = "SELECT ib.beneficiaire_id, ib.type_part, ib.valeur_part, b.nom
                            FROM impot_beneficiaires ib
                            INNER JOIN beneficiaires b ON ib.beneficiaire_id = b.id
                            WHERE ib.impot_id = :impot_id";
            $stmtBeneficiaires = $this->pdo->prepare($sqlBeneficiaires);
            $stmtBeneficiaires->execute([':impot_id' => $idImpot]);
            $beneficiaires = $stmtBeneficiaires->fetchAll(PDO::FETCH_ASSOC);

            if (empty($beneficiaires)) {
                throw new Exception("Aucun bénéficiaire trouvé pour cet impôt");
            }

            $repartitions = [];
            $totalPourcentages = 0;

            // 3. Calculer les nouvelles parts
            foreach ($beneficiaires as $beneficiaire) {
                $nouvellePart = $beneficiaire;

                if ($beneficiaire['type_part'] === 'pourcentage') {
                    // Multiplier le pourcentage
                    $nouveauPourcentage = $beneficiaire['valeur_part'];
                    $nouvellePart['valeur_part_calculee'] = $nouveauPourcentage;
                    $nouvellePart['montant'] = ($montantTotal * $nouveauPourcentage) / 100;
                    $totalPourcentages += $nouveauPourcentage;
                } else {
                    // Pour les montants fixes
                    $nouveauMontant = $beneficiaire['valeur_part'];
                    $nouvellePart['valeur_part_calculee'] = $nouveauMontant;
                    $nouvellePart['montant'] = $nouveauMontant;
                }

                $repartitions[] = $nouvellePart;
            }

            // 4. Vérifier que le total ne dépasse pas 100% (pour les pourcentages)
            if ($totalPourcentages > 100) {
                // Ajuster proportionnellement
                foreach ($repartitions as &$repartition) {
                    if ($repartition['type_part'] === 'pourcentage') {
                        $repartition['valeur_part_calculee'] = ($repartition['valeur_part_calculee'] * 100) / $totalPourcentages;
                        $repartition['montant'] = ($montantTotal * $repartition['valeur_part_calculee']) / 100;
                    }
                }
            }

            // 5. Enregistrer les répartitions
            foreach ($repartitions as $repartition) {
                $sqlInsert = "INSERT INTO repartition_paiements 
                         (id_declaration, beneficiaire_id, type_part, valeur_part_originale, 
                          valeur_part_calculee, montant, date_creation) 
                         VALUES 
                         (:id_declaration, :beneficiaire_id, :type_part, :valeur_part_originale, 
                          :valeur_part_calculee, :montant, NOW())";

                $stmtInsert = $this->pdo->prepare($sqlInsert);
                $stmtInsert->execute([
                    ':id_declaration' => $idDeclaration,
                    ':beneficiaire_id' => $repartition['beneficiaire_id'],
                    ':type_part' => $repartition['type_part'],
                    ':valeur_part_originale' => $repartition['valeur_part'],
                    ':valeur_part_calculee' => $repartition['valeur_part_calculee'],
                    ':montant' => $repartition['montant']
                ]);
            }

            return [
                "status" => "success",
                "message" => "Répartition calculée avec succès",
                "data" => [
                    "repartitions" => $repartitions,
                    "nombre_declarations" => $nombreDeclarations,
                    "montant_total" => $montantTotal
                ]
            ];

        } catch (Exception $e) {
            error_log("Erreur lors du calcul de la répartition: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur lors du calcul de la répartition: " . $e->getMessage()
            ];
        }
    }

    /**
     * Récupère toutes les déclarations d'un NIF donné
     */
    public function getDeclarationsByNif($nif)
    {
        try {
            $sql = "SELECT id, reference, donnees_json, date_creation, statut 
                FROM declarations 
                WHERE nif_contribuable = :nif AND statut = 'payé' 
                ORDER BY date_creation DESC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':nif' => $nif]);
            $declarations = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Décoder les données JSON pour chaque déclaration
            foreach ($declarations as &$declaration) {
                $declaration['donnees_json'] = json_decode($declaration['donnees_json'], true);
            }

            return [
                "status" => "success",
                "data" => $declarations,
                "count" => count($declarations)
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des déclarations par NIF: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des déclarations"
            ];
        }
    }


    // LA GESTION DES SYNCHRINISATIONS

    /**
     * Synchronise les ventes depuis l'application mobile
     */
    public function synchroniserVentes($ventes, $utilisateur)
    {
        try {
            $this->pdo->beginTransaction();

            $ventesTraitees = 0;
            $erreurs = [];

            foreach ($ventes as $index => $vente) {
                try {
                    // 1. Vérifier et insérer le particulier
                    $particulierId = $this->insererOuRecupererParticulier($vente['assujetti'], $utilisateur);

                    // 2. Préparer les données pour la déclaration
                    $donneesEngins = $this->preparerDonneesEngins($vente['engins'], $vente['assujetti']);

                    // 3. Insérer la déclaration
                    $declarationId = $this->insererDeclaration($vente, $particulierId, $donneesEngins, $utilisateur);

                    $ventesTraitees++;

                } catch (Exception $e) {
                    $erreurs[] = [
                        'reference' => $vente['reference'],
                        'erreur' => $e->getMessage(),
                        'index' => $index
                    ];
                    error_log("Erreur synchronisation vente {$vente['reference']}: " . $e->getMessage());
                }
            }

            $this->pdo->commit();

            return [
                "status" => "success",
                "message" => "Synchronisation terminée",
                "data" => [
                    "ventes_traitees" => $ventesTraitees,
                    "ventes_total" => count($ventes),
                    "erreurs" => $erreurs
                ]
            ];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de la synchronisation des ventes: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la synchronisation"
            ];
        }
    }

    /**
     * Insère ou récupère un particulier
     */
    private function insererOuRecupererParticulier($assujetti, $utilisateur)
    {
        // Générer un NIF unique si non fourni
        $nif = $assujetti['telephone'];

        // Vérifier si le particulier existe déjà par téléphone
        $sqlCheck = "SELECT id FROM particuliers WHERE telephone = :telephone";
        $stmtCheck = $this->pdo->prepare($sqlCheck);
        $stmtCheck->execute([':telephone' => $assujetti['telephone']]);
        $existant = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if ($existant) {
            return $existant['id'];
        }

        // Insérer le nouveau particulier
        $sql = "INSERT INTO particuliers 
            (nom, prenom, telephone, email, rue, ville, nif, actif, date_creation, utilisateur, site) 
            VALUES 
            (:nom, :prenom, :telephone, :email, :rue, :ville, :nif, 1, NOW(), :utilisateur, :site)";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':nom' => $assujetti['nom'],
            ':prenom' => $assujetti['prenom'],
            ':telephone' => $assujetti['telephone'],
            ':email' => $assujetti['email'] ?: '',
            ':rue' => $assujetti['adresse'],
            ':ville' => 'Kindu', // Ville par défaut
            ':nif' => $nif,
            ':utilisateur' => $utilisateur,
            ':site' => 1
        ]);

        return $this->pdo->lastInsertId();
    }

    /**
     * Génère un NIF unique
     */
    private function genererNIFUnique()
    {
        do {
            $nif = 'NIF' . date('Ymd') . rand(1000, 9999);

            $sqlCheck = "SELECT COUNT(*) FROM particuliers WHERE nif = :nif";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([':nif' => $nif]);
            $existe = $stmtCheck->fetchColumn();

        } while ($existe > 0);

        return $nif;
    }

    /**
     * Prépare les données des engins pour le JSON
     */
    private function preparerDonneesEngins($engins, $assujetti)
    {
        $donneesFormatees = [];

        foreach ($engins as $engin) {
            $donneesFormatees[] = [
                'Nom' => $assujetti['nom'],
                'Prénom' => $assujetti['prenom'],
                'Usage' => $engin['Usage'] ?? '',
                'Marque' => $engin['Marque'] ?? '',
                'Couleur' => $engin['Couleur'] ?? '',
                'Énergie' => $engin['Énergie'] ?? '',
                "Type d'engin" => $engin["Type d'engin"] ?? '',
                "Adresse physique" => $assujetti['adresse'],
                "Puissance Fiscal" => $engin['Puissance Fiscal'] ?? '',
                "Numéro de moteur" => $engin['Numéro de moteur'] ?? '',
                "Numéro de plaque" => $engin['Numéro de plaque'] ?? '',
                "Numéro de châssis" => $engin['Numéro de châssis'] ?? '',
                "Année de circulation" => $engin['Année de circulation'] ?? '',
                "Année de fabrication" => $engin['Année de fabrication'] ?? '',
                "Numéro de téléphone" => $assujetti['telephone']
            ];
        }

        return $donneesFormatees;
    }

    /**
     * Insère une déclaration
     */
    private function insererDeclaration($vente, $particulierId, $donneesEngins, $utilisateur)
    {
        // ID d'impot pour les plaques (à adapter selon votre configuration)
        $idImpot = 11;

        // Générer une référence unique
        $reference = $vente['reference'];

        // Insérer la déclaration
        $sqlDeclaration = "INSERT INTO declarations 
                      (reference, nif_contribuable, type_contribuable, id_impot, 
                       montant, statut, donnees_json, date_creation, utilisateur) 
                      VALUES 
                      (:reference, :nif, :type_contribuable, :id_impot, 
                       :montant, 'en_attente', :donnees_json, NOW(), :utilisateur)";

        $stmtDeclaration = $this->pdo->prepare($sqlDeclaration);
        $stmtDeclaration->execute([
            ':reference' => $reference,
            ':nif' => $this->getNIFByParticulierId($particulierId),
            ':type_contribuable' => 'particulier',
            ':id_impot' => $idImpot,
            ':montant' => $vente['montantTotal'],
            ':donnees_json' => json_encode($donneesEngins),
            ':utilisateur' => $utilisateur
        ]);

        $idDeclaration = $this->pdo->lastInsertId();

        // 🔔 ENREGISTRER LA NOTIFICATION
        $this->enregistrerNotification(
            'vente_synchronisee',
            'Vente synchronisée',
            "Vente #$reference synchronisée depuis mobile. Montant : {$vente['montantTotal']} $",
            $this->getNIFByParticulierId($particulierId),
            $idDeclaration
        );

        return $idDeclaration;
    }

    /**
     * Récupère le NIF d'un particulier par son ID
     */
    private function getNIFByParticulierId($particulierId)
    {
        $sql = "SELECT nif FROM particuliers WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':id' => $particulierId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ? $result['nif'] : 'null';
    }

    /**
     * Récupère les derniers logs d'audit
     *
     * @param int $limit Nombre de logs à récupérer
     * @return array Liste des logs d'audit
     */
    public function getDerniersLogsAudit($limit = 100)
    {
        try {
            $sql = "SELECT id, user_id, user_type, action, timestamp
                    FROM audit_log 
                    ORDER BY timestamp DESC 
                    LIMIT :limit";

            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();

            $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "data" => $logs
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des logs d'audit: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des logs d'audit"
            ];
        }
    }

    /**
     * Récupère les statistiques des logs d'audit
     *
     * @return array Statistiques des logs d'audit
     */
    public function getAuditStats()
    {
        try {
            // Total des logs
            $sqlTotal = "SELECT COUNT(*) as total FROM audit_log";
            $stmtTotal = $this->pdo->query($sqlTotal);
            $total = $stmtTotal->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

            // Logs d'aujourd'hui
            $sqlToday = "SELECT COUNT(*) as today FROM audit_log WHERE DATE(timestamp) = CURDATE()";
            $stmtToday = $this->pdo->query($sqlToday);
            $today = $stmtToday->fetch(PDO::FETCH_ASSOC)['today'] ?? 0;

            // Logs par type d'utilisateur
            $sqlByType = "SELECT user_type, COUNT(*) as count FROM audit_log GROUP BY user_type";
            $stmtByType = $this->pdo->query($sqlByType);
            $byType = $stmtByType->fetchAll(PDO::FETCH_ASSOC);

            // Initialiser les compteurs
            $admin = 0;
            $agent = 0;
            $system = 0;
            $utilisateur = 0;

            // Compter par type
            foreach ($byType as $row) {
                switch ($row['user_type']) {
                    case 'admin':
                        $admin = (int)$row['count'];
                        break;
                    case 'agent':
                        $agent = (int)$row['count'];
                        break;
                    case 'system':
                        $system = (int)$row['count'];
                        break;
                    case 'utilisateur':
                        $utilisateur = (int)$row['count'];
                        break;
                }
            }

            return [
                "status" => "success",
                "data" => [
                    "total" => (int)$total,
                    "today" => (int)$today,
                    "admin" => $admin,
                    "agent" => $agent,
                    "system" => $system,
                    "utilisateur" => $utilisateur
                ]
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des statistiques d'audit: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur système lors de la récupération des statistiques d'audit"
            ];
        }
    }


}
?>
