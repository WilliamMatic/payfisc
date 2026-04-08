<?php
require_once 'Connexion.php';

/**
 * Classe Taux - Gestion complète des taux avec support multi-province/impôt
 * 
 * Cette classe étend la classe Connexion et fournit toutes les fonctionnalités
 * de gestion des taux, incluant :
 * - Création, modification, suppression des taux
 * - Attribution des taux aux provinces et impôts
 * - Gestion des taux par défaut par impôt
 * - Logs d'audit pour toutes les opérations
 */
class Taux extends Connexion
{
    /**
     * Vérifie l'existence d'un taux par son ID
     *
     * @param int $id ID du taux
     * @return array|false Données complètes du taux si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function tauxExisteParId($id)
    {
        try {
            $sql = "SELECT * FROM taux WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du taux par ID: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'un taux par son nom (non unique maintenant)
     *
     * @param string $nom Nom à vérifier
     * @return array|false Données du taux si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function tauxExisteParNom($nom)
    {
        try {
            $sql = "SELECT id, nom, valeur, description FROM taux WHERE nom = :nom";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['nom' => $nom]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence du taux: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Ajoute un nouveau taux au système
     *
     * @param string $nom Nom du taux
     * @param float $valeur Valeur en CDF
     * @param string $description Description du taux
     * @param bool $est_par_defaut Indique si c'est un taux par défaut
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function ajouterTaux($nom, $valeur, $description, $est_par_defaut = false)
    {
        // ============ VALIDATION DES DONNÉES ============
        if (empty($nom) || empty($valeur)) {
            return ["status" => "error", "message" => "Le nom et la valeur sont obligatoires."];
        }

        if (!is_numeric($valeur) || $valeur <= 0) {
            return ["status" => "error", "message" => "La valeur doit être un nombre positif."];
        }

        // ============ TRAITEMENT PRINCIPAL ============
        try {
            $this->pdo->beginTransaction();

            // Insertion du taux
            $sql = "INSERT INTO taux (nom, valeur, description, est_par_defaut) 
                    VALUES (:nom, :valeur, :description, :est_par_defaut)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom' => $nom,
                ':valeur' => $valeur,
                ':description' => $description,
                ':est_par_defaut' => $est_par_defaut ? 1 : 0
            ]);

            $tauxId = $this->pdo->lastInsertId();

            $this->pdo->commit();

            // Log d'audit
            $this->logAudit("Ajout du taux ID $tauxId: $nom ($valeur CDF)");

            return ["status" => "success", "message" => "Taux ajouté avec succès.", "id" => $tauxId];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'ajout du taux: " . $e->getMessage());
            
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Modifie les informations d'un taux existant
     *
     * @param int $id ID du taux à modifier
     * @param string $nom Nouveau nom
     * @param float $valeur Nouvelle valeur
     * @param string $description Nouvelle description
     * @param bool $est_par_defaut Nouveau statut par défaut
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function modifierTaux($id, $nom, $valeur, $description, $est_par_defaut = false)
    {
        // Validation des champs obligatoires
        if (empty($nom) || empty($valeur)) {
            return ["status" => "error", "message" => "Le nom et la valeur sont obligatoires."];
        }

        if (!is_numeric($valeur) || $valeur <= 0) {
            return ["status" => "error", "message" => "La valeur doit être un nombre positif."];
        }

        try {
            // Mise à jour des informations
            $sql = "UPDATE taux 
                    SET nom = :nom, 
                        valeur = :valeur, 
                        description = :description,
                        est_par_defaut = :est_par_defaut,
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom' => $nom,
                ':valeur' => $valeur,
                ':description' => $description,
                ':est_par_defaut' => $est_par_defaut ? 1 : 0,
                ':id' => $id
            ]);

            // Log d'audit
            $this->logAudit("Modification du taux ID $id: $nom ($valeur CDF)");

            return ["status" => "success", "message" => "Les informations du taux ont été mises à jour."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification du taux: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime un taux du système
     *
     * @param int $id ID du taux à supprimer
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function supprimerTaux($id)
    {
        // Vérification de l'existence du taux
        $taux = $this->tauxExisteParId($id);
        if (!$taux) {
            return ["status" => "error", "message" => "Le taux spécifié n'existe pas."];
        }

        try {
            $this->pdo->beginTransaction();

            // Supprimer d'abord les liaisons
            $sqlLiaisons = "DELETE FROM taux_province_impot WHERE taux_id = :id";
            $stmtLiaisons = $this->pdo->prepare($sqlLiaisons);
            $stmtLiaisons->execute(['id' => $id]);

            // Supprimer les liaisons par défaut
            $sqlDefaut = "DELETE FROM taux_defaut_impot WHERE taux_id = :id";
            $stmtDefaut = $this->pdo->prepare($sqlDefaut);
            $stmtDefaut->execute(['id' => $id]);

            // Supprimer le taux
            $sql = "DELETE FROM taux WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);

            $this->pdo->commit();

            // Log d'audit
            $this->logAudit("Suppression du taux ID $id: " . $taux['nom'] . ' (' . $taux['valeur'] . ' CDF)');

            return ["status" => "success", "message" => "Le taux a été supprimé avec succès."];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de la suppression du taux: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Attribue un taux à une province et un impôt
     *
     * @param int $taux_id ID du taux
     * @param int $province_id ID de la province (NULL pour toutes provinces)
     * @param int $impot_id ID de l'impôt
     * @param bool $actif Si le taux est actif pour cette combinaison
     * @return array Tableau avec statut et message
     */
    public function attribuerTaux($taux_id, $province_id, $impot_id, $actif = true)
    {
        // Vérification de l'existence du taux
        $taux = $this->tauxExisteParId($taux_id);
        if (!$taux) {
            return ["status" => "error", "message" => "Le taux spécifié n'existe pas."];
        }

        // Vérifier si l'impôt existe
        try {
            $sqlCheckImpot = "SELECT id FROM impots WHERE id = :impot_id";
            $stmtCheckImpot = $this->pdo->prepare($sqlCheckImpot);
            $stmtCheckImpot->execute([':impot_id' => $impot_id]);
            
            if ($stmtCheckImpot->rowCount() === 0) {
                return ["status" => "error", "message" => "L'impôt spécifié n'existe pas."];
            }
        } catch (PDOException $e) {
            error_log("Erreur vérification impôt: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur vérification impôt."];
        }

        // Si province_id n'est pas null, vérifier qu'elle existe
        if ($province_id !== null) {
            try {
                $sqlCheckProvince = "SELECT id FROM provinces WHERE id = :province_id";
                $stmtCheckProvince = $this->pdo->prepare($sqlCheckProvince);
                $stmtCheckProvince->execute([':province_id' => $province_id]);
                
                if ($stmtCheckProvince->rowCount() === 0) {
                    return ["status" => "error", "message" => "La province spécifiée n'existe pas."];
                }
            } catch (PDOException $e) {
                error_log("Erreur vérification province: " . $e->getMessage());
                return ["status" => "error", "message" => "Erreur vérification province."];
            }
        }

        try {
            $this->pdo->beginTransaction();

            // Désactiver l'ancien taux actif si on active un nouveau
            if ($actif) {
                $sqlDesactiver = "UPDATE taux_province_impot 
                                 SET actif = 0 
                                 WHERE province_id " . ($province_id === null ? "IS NULL" : "= :province_id") . "
                                 AND impot_id = :impot_id";
                $stmtDesactiver = $this->pdo->prepare($sqlDesactiver);
                
                $params = [':impot_id' => $impot_id];
                if ($province_id !== null) {
                    $params[':province_id'] = $province_id;
                }
                
                $stmtDesactiver->execute($params);
            }

            // Vérifier si la liaison existe déjà
            $sqlCheck = "SELECT id FROM taux_province_impot 
                        WHERE taux_id = :taux_id 
                        AND province_id " . ($province_id === null ? "IS NULL" : "= :province_id") . "
                        AND impot_id = :impot_id";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            
            $paramsCheck = [
                ':taux_id' => $taux_id,
                ':impot_id' => $impot_id
            ];
            if ($province_id !== null) {
                $paramsCheck[':province_id'] = $province_id;
            }
            
            $stmtCheck->execute($paramsCheck);
            $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                // Mettre à jour la liaison existante
                $sqlUpdate = "UPDATE taux_province_impot 
                             SET actif = :actif,
                                 date_modification = CURRENT_TIMESTAMP
                             WHERE id = :id";
                $stmtUpdate = $this->pdo->prepare($sqlUpdate);
                $stmtUpdate->execute([
                    ':actif' => $actif ? 1 : 0,
                    ':id' => $existing['id']
                ]);
            } else {
                // Créer une nouvelle liaison
                $sqlInsert = "INSERT INTO taux_province_impot (taux_id, province_id, impot_id, actif) 
                             VALUES (:taux_id, :province_id, :impot_id, :actif)";
                $stmtInsert = $this->pdo->prepare($sqlInsert);
                
                $paramsInsert = [
                    ':taux_id' => $taux_id,
                    ':province_id' => $province_id,
                    ':impot_id' => $impot_id,
                    ':actif' => $actif ? 1 : 0
                ];
                
                $stmtInsert->execute($paramsInsert);
            }

            $this->pdo->commit();

            // Log d'audit
            $provinceText = $province_id === null ? "toutes provinces" : "province ID $province_id";
            $this->logAudit("Attribution du taux ID $taux_id à $provinceText pour l'impôt ID $impot_id");

            return ["status" => "success", "message" => "Taux attribué avec succès."];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'attribution du taux: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Définit un taux par défaut pour un impôt
     *
     * @param int $taux_id ID du taux
     * @param int $impot_id ID de l'impôt
     * @return array Tableau avec statut et message
     */
    public function definirTauxDefautImpot($taux_id, $impot_id)
    {
        // Vérification de l'existence du taux
        $taux = $this->tauxExisteParId($taux_id);
        if (!$taux) {
            return ["status" => "error", "message" => "Le taux spécifié n'existe pas."];
        }

        try {
            $this->pdo->beginTransaction();

            // Vérifier si un taux par défaut existe déjà pour cet impôt
            $sqlCheck = "SELECT id FROM taux_defaut_impot WHERE impot_id = :impot_id";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([':impot_id' => $impot_id]);
            $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                // Mettre à jour
                $sqlUpdate = "UPDATE taux_defaut_impot 
                             SET taux_id = :taux_id 
                             WHERE id = :id";
                $stmtUpdate = $this->pdo->prepare($sqlUpdate);
                $stmtUpdate->execute([
                    ':taux_id' => $taux_id,
                    ':id' => $existing['id']
                ]);
            } else {
                // Créer
                $sqlInsert = "INSERT INTO taux_defaut_impot (taux_id, impot_id) 
                             VALUES (:taux_id, :impot_id)";
                $stmtInsert = $this->pdo->prepare($sqlInsert);
                $stmtInsert->execute([
                    ':taux_id' => $taux_id,
                    ':impot_id' => $impot_id
                ]);
            }

            $this->pdo->commit();

            // Marquer le taux comme par défaut
            $sqlUpdateTaux = "UPDATE taux SET est_par_defaut = 1 WHERE id = :taux_id";
            $stmtUpdateTaux = $this->pdo->prepare($sqlUpdateTaux);
            $stmtUpdateTaux->execute([':taux_id' => $taux_id]);

            $this->logAudit("Définition du taux ID $taux_id comme taux par défaut pour l'impôt ID $impot_id");

            return ["status" => "success", "message" => "Taux par défaut défini avec succès."];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de la définition du taux par défaut: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère le taux actif pour une province et un impôt spécifiques
     *
     * @param int $province_id ID de la province (NULL pour toutes provinces)
     * @param int $impot_id ID de l'impôt
     * @return array Tableau avec statut et données
     */
    public function getTauxActifPourProvinceImpot($province_id, $impot_id)
    {
        try {
            // Chercher d'abord un taux spécifique à la province
            $sql = "SELECT t.*, tpi.actif, tpi.date_creation as date_attribution
                    FROM taux t
                    INNER JOIN taux_province_impot tpi ON t.id = tpi.taux_id
                    WHERE tpi.province_id " . ($province_id === null ? "IS NULL" : "= :province_id") . "
                    AND tpi.impot_id = :impot_id
                    AND tpi.actif = 1
                    LIMIT 1";
            
            $stmt = $this->pdo->prepare($sql);
            
            $params = [':impot_id' => $impot_id];
            if ($province_id !== null) {
                $params[':province_id'] = $province_id;
            }
            
            $stmt->execute($params);
            $taux = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($taux) {
                return ["status" => "success", "data" => $taux];
            }

            // Si pas de taux spécifique, chercher le taux par défaut de l'impôt
            $sqlDefaut = "SELECT t.*, tdi.date_creation as date_attribution
                         FROM taux t
                         INNER JOIN taux_defaut_impot tdi ON t.id = tdi.taux_id
                         WHERE tdi.impot_id = :impot_id
                         LIMIT 1";
            
            $stmtDefaut = $this->pdo->prepare($sqlDefaut);
            $stmtDefaut->execute([':impot_id' => $impot_id]);
            $tauxDefaut = $stmtDefaut->fetch(PDO::FETCH_ASSOC);

            if ($tauxDefaut) {
                return ["status" => "success", "data" => $tauxDefaut, "est_par_defaut" => true];
            }

            return ["status" => "error", "message" => "Aucun taux trouvé pour cette combinaison."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération du taux actif: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère tous les taux disponibles
     *
     * @return array Liste des taux ou message d'erreur
     */
    public function listerTaux()
    {
        try {
            $sql = "SELECT id, nom, valeur, description, est_par_defaut, 
                    DATE_FORMAT(date_creation, '%d/%m/%Y') as date_creation 
                    FROM taux 
                    ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des taux: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère les taux avec leurs attributions
     *
     * @return array Liste des taux avec attributions
     */
    public function listerTauxAvecAttributions()
    {
        try {
            // Récupérer tous les taux
            $sqlTaux = "SELECT * FROM taux ORDER BY nom ASC";
            $stmtTaux = $this->pdo->query($sqlTaux);
            $taux = $stmtTaux->fetchAll(PDO::FETCH_ASSOC);

            // Pour chaque taux, récupérer ses attributions
            foreach ($taux as &$t) {
                // Attributions par province/impôt
                $sqlAttributions = "SELECT tpi.*, 
                                   p.nom as province_nom, 
                                   i.nom as impot_nom
                                   FROM taux_province_impot tpi
                                   LEFT JOIN provinces p ON tpi.province_id = p.id
                                   INNER JOIN impots i ON tpi.impot_id = i.id
                                   WHERE tpi.taux_id = :taux_id";
                $stmtAttributions = $this->pdo->prepare($sqlAttributions);
                $stmtAttributions->execute([':taux_id' => $t['id']]);
                $t['attributions'] = $stmtAttributions->fetchAll(PDO::FETCH_ASSOC);

                // Taux par défaut
                $sqlDefaut = "SELECT tdi.*, i.nom as impot_nom
                             FROM taux_defaut_impot tdi
                             INNER JOIN impots i ON tdi.impot_id = i.id
                             WHERE tdi.taux_id = :taux_id";
                $stmtDefaut = $this->pdo->prepare($sqlDefaut);
                $stmtDefaut->execute([':taux_id' => $t['id']]);
                $t['taux_defaut'] = $stmtDefaut->fetchAll(PDO::FETCH_ASSOC);
            }

            return ["status" => "success", "data" => $taux];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des taux avec attributions: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère les impôts disponibles
     *
     * @return array Liste des impôts
     */
    public function getImpots()
    {
        try {
            $sql = "SELECT id, nom, description FROM impots WHERE actif = 1 ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            $impots = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $impots];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des impôts: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère les provinces disponibles
     *
     * @return array Liste des provinces
     */
    public function getProvinces()
    {
        try {
            $sql = "SELECT id, nom, code FROM provinces WHERE actif = 1 ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            $provinces = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $provinces];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des provinces: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Retire l'attribution d'un taux
     *
     * @param int $taux_id ID du taux
     * @param int|null $province_id ID de la province (NULL pour toutes provinces)
     * @param int $impot_id ID de l'impôt
     * @return array Tableau avec statut et message
     */
    public function retirerAttributionTaux($taux_id, $province_id, $impot_id)
    {
        try {
            $sql = "DELETE FROM taux_province_impot 
                    WHERE taux_id = :taux_id 
                    AND province_id " . ($province_id === null ? "IS NULL" : "= :province_id") . "
                    AND impot_id = :impot_id";
            
            $stmt = $this->pdo->prepare($sql);
            
            $params = [
                ':taux_id' => $taux_id,
                ':impot_id' => $impot_id
            ];
            if ($province_id !== null) {
                $params[':province_id'] = $province_id;
            }
            
            $stmt->execute($params);

            $provinceText = $province_id === null ? "toutes provinces" : "province ID $province_id";
            $this->logAudit("Retrait de l'attribution du taux ID $taux_id pour $provinceText et impôt ID $impot_id");

            return ["status" => "success", "message" => "Attribution retirée avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors du retrait de l'attribution: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Retire le taux par défaut d'un impôt
     *
     * @param int $impot_id ID de l'impôt
     * @return array Tableau avec statut et message
     */
    public function retirerTauxDefautImpot($impot_id)
    {
        try {
            $sql = "DELETE FROM taux_defaut_impot WHERE impot_id = :impot_id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':impot_id' => $impot_id]);

            $this->logAudit("Retrait du taux par défaut pour l'impôt ID $impot_id");

            return ["status" => "success", "message" => "Taux par défaut retiré avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors du retrait du taux par défaut: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Log une action dans le journal d'audit
     *
     * @param string $message Message à logger
     * @return void
     */
    public function logAudit($message)
    {
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
    }
}