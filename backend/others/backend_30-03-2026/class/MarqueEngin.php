<?php
require_once 'Connexion.php';

/**
 * Classe MarqueEngin - Gestion complète des marques d'engins
 * 
 * Cette classe étend la classe Connexion et fournit toutes les fonctionnalités
 * de gestion des marques d'engins, incluant :
 * - Création, modification, suppression et activation/désactivation des marques
 * - Vérification de l'unicité des libellés par type d'engin
 * - Logs d'audit pour toutes les opérations
 */
class MarqueEngin extends Connexion
{
    /**
     * Vérifie l'existence d'une marque par son libellé et type d'engin
     *
     * @param string $libelle Libellé à vérifier
     * @param int $typeEnginId ID du type d'engin
     * @param int $excludeId ID à exclure (pour la modification)
     * @return array|false Données de la marque si trouvée, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function marqueExiste($libelle, $typeEnginId, $excludeId = null)
    {
        try {
            $sql = "SELECT id, libelle, description, actif, type_engin_id 
                    FROM marques_engins 
                    WHERE libelle = :libelle AND type_engin_id = :type_engin_id";
            $params = [
                'libelle' => $libelle,
                'type_engin_id' => $typeEnginId
            ];
            
            if ($excludeId !== null) {
                $sql .= " AND id != :exclude_id";
                $params['exclude_id'] = $excludeId;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence de la marque: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'une marque par son ID
     *
     * @param int $id ID de la marque
     * @return array|false Données complètes de la marque si trouvée, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function marqueExisteParId($id)
    {
        try {
            $sql = "SELECT m.*, te.libelle as type_engin_libelle,
                    (SELECT COUNT(*) FROM modeles_engins me WHERE me.marque_engin_id = m.id) as modeles_count
                    FROM marques_engins m 
                    LEFT JOIN type_engins te ON m.type_engin_id = te.id 
                    WHERE m.id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de la marque par ID: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'un type d'engin par son ID
     *
     * @param int $id ID du type d'engin
     * @return array|false Données du type d'engin si trouvé, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function typeEnginExisteParId($id)
    {
        try {
            $sql = "SELECT id, libelle, description FROM type_engins WHERE id = :id AND actif = 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du type d'engin: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Recherche des marques par type d'engin et terme de recherche
     *
     * @param string $typeEnginLibelle Libellé du type d'engin
     * @param string $searchTerm Terme de recherche
     * @return array Tableau avec statut et données
     * @throws PDOException En cas d'erreur de base de données
     */
    public function rechercherMarques($typeEnginLibelle, $searchTerm)
    {
        try {
            // D'abord, récupérer l'ID du type d'engin
            $sqlType = "SELECT id FROM type_engins WHERE libelle = :libelle AND actif = 1";
            $stmtType = $this->pdo->prepare($sqlType);
            $stmtType->execute([':libelle' => $typeEnginLibelle]);
            $typeEngin = $stmtType->fetch(PDO::FETCH_ASSOC);

            if (!$typeEngin) {
                return ["status" => "error", "message" => "Type d'engin non trouvé"];
            }

            $typeEnginId = $typeEngin['id'];

            // Ensuite, rechercher les marques correspondantes
            $sql = "SELECT m.id, m.libelle, m.description, m.actif, 
                    m.type_engin_id, te.libelle as type_engin_libelle,
                    (SELECT COUNT(*) FROM modeles_engins me WHERE me.marque_engin_id = m.id) as modeles_count
                    FROM marques_engins m 
                    LEFT JOIN type_engins te ON m.type_engin_id = te.id 
                    WHERE m.type_engin_id = :type_engin_id 
                    AND m.actif = 1";
            
            $params = [':type_engin_id' => $typeEnginId];
            
            if (!empty($searchTerm)) {
                $sql .= " AND (m.libelle LIKE :search OR m.description LIKE :search)";
                $params[':search'] = '%' . $searchTerm . '%';
            }
            
            $sql .= " ORDER BY 
                        CASE 
                            WHEN m.libelle LIKE :exact THEN 1
                            WHEN m.libelle LIKE :start THEN 2
                            ELSE 3
                        END,
                        m.libelle ASC
                    LIMIT 10";
            
            if (!empty($searchTerm)) {
                $params[':exact'] = $searchTerm;
                $params[':start'] = $searchTerm . '%';
            } else {
                $params[':exact'] = '';
                $params[':start'] = '';
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des marques: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Ajoute une nouvelle marque d'engin au système
     *
     * @param string $libelle Libellé de la marque
     * @param string $description Description de la marque
     * @param int $typeEnginId ID du type d'engin
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function ajouterMarque($libelle, $description, $typeEnginId)
    {
        if (empty($libelle) || empty($typeEnginId)) {
            return ["status" => "error", "message" => "Le libellé et le type d'engin sont obligatoires."];
        }

        if ($this->marqueExiste($libelle, $typeEnginId)) {
            return ["status" => "error", "message" => "Cette marque existe déjà pour ce type d'engin."];
        }

        if (!$this->typeEnginExisteParId($typeEnginId)) {
            return ["status" => "error", "message" => "Le type d'engin sélectionné n'existe pas ou est inactive."];
        }

        try {
            $this->pdo->beginTransaction();

            $sql = "INSERT INTO marques_engins (libelle, description, type_engin_id) 
                    VALUES (:libelle, :description, :type_engin_id)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':libelle' => $libelle,
                ':description' => $description,
                ':type_engin_id' => $typeEnginId
            ]);

            $marqueId = $this->pdo->lastInsertId();
            $this->pdo->commit();

            $this->logAudit("Ajout de la marque ID $marqueId: $libelle");
            return ["status" => "success", "message" => "Marque ajoutée avec succès."];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'ajout de la marque: " . $e->getMessage());
            
            if ($e->getCode() == '23000') {
                return ["status" => "error", "message" => "Cette marque existe déjà pour ce type d'engin."];
            }
            
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Modifie les informations d'une marque existante
     *
     * @param int $id ID de la marque à modifier
     * @param string $libelle Nouveau libellé
     * @param string $description Nouvelle description
     * @param int $typeEnginId Nouveau type d'engin ID
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function modifierMarque($id, $libelle, $description, $typeEnginId)
    {
        if (empty($libelle) || empty($typeEnginId)) {
            return ["status" => "error", "message" => "Le libellé et le type d'engin sont obligatoires."];
        }

        if (!$this->typeEnginExisteParId($typeEnginId)) {
            return ["status" => "error", "message" => "Le type d'engin sélectionné n'existe pas ou est inactive."];
        }

        try {
            if ($this->marqueExiste($libelle, $typeEnginId, $id)) {
                return ["status" => "error", "message" => "Cette marque existe déjà pour ce type d'engin."];
            }

            $sql = "UPDATE marques_engins 
                    SET libelle = :libelle, 
                        description = :description,
                        type_engin_id = :type_engin_id,
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':libelle' => $libelle,
                ':description' => $description,
                ':type_engin_id' => $typeEnginId,
                ':id' => $id
            ]);

            $this->logAudit("Modification de la marque ID $id: $libelle");
            return ["status" => "success", "message" => "Les informations de la marque ont été mises à jour."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification de la marque: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime une marque du système
     *
     * @param int $id ID de la marque à supprimer
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function supprimerMarque($id)
    {
        $marque = $this->marqueExisteParId($id);
        if (!$marque) {
            return ["status" => "error", "message" => "La marque spécifiée n'existe pas."];
        }

        try {
            $sql = "DELETE FROM marques_engins WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);

            $this->logAudit("Suppression de la marque ID $id: " . $marque['libelle']);
            return ["status" => "success", "message" => "La marque a été supprimée avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de la marque: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Change le statut actif/inactif d'une marque
     *
     * @param int $id ID de la marque
     * @param bool $actif Nouveau statut (true = actif, false = inactif)
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function changerStatutMarque($id, $actif)
    {
        $marque = $this->marqueExisteParId($id);
        if (!$marque) {
            return ["status" => "error", "message" => "La marque spécifiée n'existe pas."];
        }

        try {
            $sql = "UPDATE marques_engins 
                    SET actif = :actif, 
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);

            $actifInt = $actif ? 1 : 0;
            $stmt->bindValue(':actif', $actifInt, PDO::PARAM_INT);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);

            $stmt->execute();

            $statut = $actifInt === 1 ? "activée" : "désactivée";
            $this->logAudit("Changement de statut de la marque ID $id: " . $marque['libelle'] . ' -> ' . $statut);

            return ["status" => "success", "message" => "La marque a été $statut avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors du changement de statut de la marque: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de toutes les marques
     *
     * @return array Liste des marques ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerMarques()
    {
        try {
            $sql = "SELECT m.id, m.libelle, m.description, m.actif, 
                    m.type_engin_id, te.libelle as type_engin_libelle,
                    (SELECT COUNT(*) FROM modeles_engins me WHERE me.marque_engin_id = m.id) as modeles_count,
                    DATE_FORMAT(m.date_creation, '%d/%m/%Y') as date_creation 
                    FROM marques_engins m 
                    LEFT JOIN type_engins te ON m.type_engin_id = te.id 
                    ORDER BY m.libelle ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des marques: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Recherche des marques par terme de recherche
     *
     * @param string $searchTerm Terme de recherche
     * @return array Liste des marques correspondantes ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function rechercherMarquesAncien($searchTerm)
    {
        try {
            $sql = "SELECT m.id, m.libelle, m.description, m.actif, 
                    m.type_engin_id, te.libelle as type_engin_libelle,
                    (SELECT COUNT(*) FROM modeles_engins me WHERE me.marque_engin_id = m.id) as modeles_count,
                    DATE_FORMAT(m.date_creation, '%d/%m/%Y') as date_creation 
                    FROM marques_engins m 
                    LEFT JOIN type_engins te ON m.type_engin_id = te.id 
                    WHERE m.libelle LIKE :search OR te.libelle LIKE :search OR m.description LIKE :search
                    ORDER BY m.libelle ASC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':search' => '%' . $searchTerm . '%']);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des marques: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Vérifie l'existence d'un modèle par son libellé et marque
     */
    public function modeleExiste($libelle, $marqueEnginId, $excludeId = null)
    {
        try {
            $sql = "SELECT id, libelle, description, actif, marque_engin_id 
                    FROM modeles_engins 
                    WHERE libelle = :libelle AND marque_engin_id = :marque_engin_id";
            $params = [
                'libelle' => $libelle,
                'marque_engin_id' => $marqueEnginId
            ];
            
            if ($excludeId !== null) {
                $sql .= " AND id != :exclude_id";
                $params['exclude_id'] = $excludeId;
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence du modèle: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'une marque pour un modèle
     */
    public function marqueExistePourModele($marqueEnginId)
    {
        try {
            $sql = "SELECT id, libelle FROM marques_engins WHERE id = :id AND actif = 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $marqueEnginId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de la marque pour modèle: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Ajoute un nouveau modèle d'engin
     */
    public function ajouterModele($libelle, $description, $marqueEnginId)
    {
        if (empty($libelle) || empty($marqueEnginId)) {
            return ["status" => "error", "message" => "Le libellé du modèle est obligatoire."];
        }

        if ($this->modeleExiste($libelle, $marqueEnginId)) {
            return ["status" => "error", "message" => "Ce modèle existe déjà pour cette marque."];
        }

        // Vérification de l'existence de la marque
        if (!$this->marqueExistePourModele($marqueEnginId)) {
            return ["status" => "error", "message" => "La marque sélectionnée n'existe pas ou est inactive."];
        }

        try {
            $this->pdo->beginTransaction();

            $sql = "INSERT INTO modeles_engins (libelle, description, marque_engin_id) 
                    VALUES (:libelle, :description, :marque_engin_id)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':libelle' => $libelle,
                ':description' => $description,
                ':marque_engin_id' => $marqueEnginId
            ]);

            $modeleId = $this->pdo->lastInsertId();
            $this->pdo->commit();

            $this->logAudit("Ajout du modèle ID $modeleId: $libelle pour marque ID $marqueEnginId");
            return ["status" => "success", "message" => "Modèle ajouté avec succès."];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'ajout du modèle: " . $e->getMessage());
            
            if ($e->getCode() == '23000') {
                return ["status" => "error", "message" => "Ce modèle existe déjà pour cette marque."];
            }
            
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste des modèles d'engins
     */
    public function listerModeles($marqueId = null)
    {
        try {
            $sql = "SELECT me.id, me.libelle, me.description, me.actif, 
                    me.marque_engin_id, m.libelle as marque_libelle,
                    m.type_engin_id, te.libelle as type_engin_libelle,
                    DATE_FORMAT(me.date_creation, '%d/%m/%Y') as date_creation 
                    FROM modeles_engins me 
                    LEFT JOIN marques_engins m ON me.marque_engin_id = m.id 
                    LEFT JOIN type_engins te ON m.type_engin_id = te.id";
            
            $params = [];
            
            if ($marqueId !== null) {
                $sql .= " WHERE me.marque_engin_id = :marque_id";
                $params['marque_id'] = $marqueId;
            }
            
            $sql .= " ORDER BY me.libelle ASC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des modèles: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère les marques actives par type d'engin
     */
    public function listerMarquesActivesParType($typeEnginId)
    {
        try {
            $sql = "SELECT m.libelle 
                    FROM marques_engins m 
                    WHERE m.type_engin_id = :type_engin_id 
                    AND m.actif = 1 
                    ORDER BY m.libelle ASC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':type_engin_id' => $typeEnginId]);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des marques par type: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Modifie les informations d'un modèle existant
     */
    public function modifierModele($id, $libelle, $description, $marqueEnginId)
    {
        if (empty($libelle) || empty($marqueEnginId)) {
            return ["status" => "error", "message" => "Le libellé du modèle est obligatoire."];
        }

        // Vérification de l'existence de la marque
        if (!$this->marqueExistePourModele($marqueEnginId)) {
            return ["status" => "error", "message" => "La marque sélectionnée n'existe pas ou est inactive."];
        }

        try {
            // Vérification de l'unicité du nouveau libellé
            if ($this->modeleExiste($libelle, $marqueEnginId, $id)) {
                return ["status" => "error", "message" => "Ce modèle existe déjà pour cette marque."];
            }

            // Mise à jour des informations
            $sql = "UPDATE modeles_engins 
                    SET libelle = :libelle, 
                        description = :description,
                        marque_engin_id = :marque_engin_id,
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':libelle' => $libelle,
                ':description' => $description,
                ':marque_engin_id' => $marqueEnginId,
                ':id' => $id
            ]);

            // Log d'audit
            $this->logAudit("Modification du modèle ID $id: $libelle");

            return ["status" => "success", "message" => "Les informations du modèle ont été mises à jour."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification du modèle: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime un modèle du système
     */
    public function supprimerModele($id)
    {
        // Vérification de l'existence du modèle
        $modele = $this->modeleExisteParId($id);
        if (!$modele) {
            return ["status" => "error", "message" => "Le modèle spécifié n'existe pas."];
        }

        try {
            // Suppression du modèle
            $sql = "DELETE FROM modeles_engins WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);

            // Log d'audit
            $this->logAudit("Suppression du modèle ID $id: " . $modele['libelle']);

            return ["status" => "success", "message" => "Le modèle a été supprimé avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression du modèle: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Change le statut actif/inactif d'un modèle
     */
    public function changerStatutModele($id, $actif)
    {
        // Vérification de l'existence du modèle
        $modele = $this->modeleExisteParId($id);
        if (!$modele) {
            return ["status" => "error", "message" => "Le modèle spécifié n'existe pas."];
        }

        try {
            $sql = "UPDATE modeles_engins 
                    SET actif = :actif, 
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);

            $actifInt = $actif ? 1 : 0;
            $stmt->bindValue(':actif', $actifInt, PDO::PARAM_INT);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);

            $stmt->execute();

            $statut = $actifInt === 1 ? "activé" : "désactivé";
            $this->logAudit("Changement de statut du modèle ID $id: " . $modele['libelle'] . ' -> ' . $statut);

            return ["status" => "success", "message" => "Le modèle a été $statut avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors du changement de statut du modèle: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Recherche des modèles par marque et terme de recherche
     */
    public function rechercherModeles($marqueId, $searchTerm)
    {
        try {
            $sql = "SELECT me.id, me.libelle, me.description, me.actif, 
                    me.marque_engin_id, m.libelle as marque_libelle,
                    m.type_engin_id, te.libelle as type_engin_libelle
                    FROM modeles_engins me 
                    LEFT JOIN marques_engins m ON me.marque_engin_id = m.id 
                    LEFT JOIN type_engins te ON m.type_engin_id = te.id 
                    WHERE me.marque_engin_id = :marque_id 
                    AND me.actif = 1";
            
            $params = [':marque_id' => $marqueId];
            
            if (!empty($searchTerm)) {
                $sql .= " AND (me.libelle LIKE :search OR me.description LIKE :search)";
                $params[':search'] = '%' . $searchTerm . '%';
            }
            
            $sql .= " ORDER BY 
                        CASE 
                            WHEN me.libelle LIKE :exact THEN 1
                            WHEN me.libelle LIKE :start THEN 2
                            ELSE 3
                        END,
                        me.libelle ASC
                    LIMIT 10";
            
            if (!empty($searchTerm)) {
                $params[':exact'] = $searchTerm;
                $params[':start'] = $searchTerm . '%';
            } else {
                $params[':exact'] = '';
                $params[':start'] = '';
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des modèles: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Vérifie l'existence d'un modèle par son ID
     */
    public function modeleExisteParId($id)
    {
        try {
            $sql = "SELECT me.*, m.libelle as marque_libelle, m.type_engin_id, te.libelle as type_engin_libelle
                    FROM modeles_engins me 
                    LEFT JOIN marques_engins m ON me.marque_engin_id = m.id 
                    LEFT JOIN type_engins te ON m.type_engin_id = te.id 
                    WHERE me.id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du modèle par ID: " . $e->getMessage());
            throw $e;
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