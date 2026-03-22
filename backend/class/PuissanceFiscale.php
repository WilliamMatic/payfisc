<?php
require_once 'Connexion.php';

/**
 * Classe PuissanceFiscale - Gestion complète des puissances fiscales
 * 
 * Cette classe étend la classe Connexion et fournit toutes les fonctionnalités
 * de gestion des puissances fiscales, incluant :
 * - Création, modification, suppression et activation/désactivation des puissances fiscales
 * - Vérification de l'unicité des libellés par type d'engin
 * - Logs d'audit pour toutes les opérations
 */
class PuissanceFiscale extends Connexion
{
    /**
     * Vérifie l'existence d'une puissance fiscale par son libellé et type d'engin
     *
     * @param string $libelle Libellé à vérifier
     * @param int $typeEnginId ID du type d'engin
     * @param int $excludeId ID à exclure (pour la modification)
     * @return array|false Données de la puissance fiscale si trouvée, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function puissanceFiscaleExiste($libelle, $typeEnginId, $excludeId = null)
    {
        try {
            $sql = "SELECT id, libelle, valeur, type_engin_id, actif 
                    FROM puissances_fiscales 
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
            error_log("Erreur lors de la vérification de l'existence de la puissance fiscale: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'une puissance fiscale par son ID
     *
     * @param int $id ID de la puissance fiscale
     * @return array|false Données complètes de la puissance fiscale si trouvée, false sinon
     * @throws PDOException En cas d'erreur de base de données
     */
    public function puissanceFiscaleExisteParId($id)
    {
        try {
            $sql = "SELECT pf.*, te.libelle as type_engin_libelle 
                    FROM puissances_fiscales pf 
                    LEFT JOIN type_engins te ON pf.type_engin_id = te.id 
                    WHERE pf.id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de la puissance fiscale par ID: " . $e->getMessage());
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
            $sql = "SELECT id, libelle, '' as code FROM type_engins WHERE id = :id AND actif = 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du type d'engin: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Ajoute une nouvelle puissance fiscale au système
     *
     * @param string $libelle Libellé de la puissance fiscale
     * @param float $valeur Valeur de la puissance fiscale
     * @param int $typeEnginId ID du type d'engin
     * @param string $description Description de la puissance fiscale
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function ajouterPuissanceFiscale($libelle, $valeur, $typeEnginId, $description = '')
    {
        // ============ VALIDATION DES DONNÉES ============
        if (empty($libelle) || empty($valeur) || empty($typeEnginId)) {
            return ["status" => "error", "message" => "Le libellé, la valeur et le type d'engin sont obligatoires."];
        }

        if (!is_numeric($valeur) || $valeur <= 0) {
            return ["status" => "error", "message" => "La valeur doit être un nombre positif."];
        }

        if ($this->puissanceFiscaleExiste($libelle, $typeEnginId)) {
            return ["status" => "error", "message" => "Cette puissance fiscale existe déjà pour ce type d'engin."];
        }

        // Vérification de l'existence du type d'engin
        if (!$this->typeEnginExisteParId($typeEnginId)) {
            return ["status" => "error", "message" => "Le type d'engin sélectionné n'existe pas ou est inactive."];
        }

        // ============ TRAITEMENT PRINCIPAL ============
        try {
            $this->pdo->beginTransaction();

            // Insertion de la puissance fiscale
            $sql = "INSERT INTO puissances_fiscales (libelle, valeur, type_engin_id, description) 
                    VALUES (:libelle, :valeur, :type_engin_id, :description)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':libelle' => $libelle,
                ':valeur' => $valeur,
                ':type_engin_id' => $typeEnginId,
                ':description' => $description
            ]);

            $puissanceId = $this->pdo->lastInsertId();

            $this->pdo->commit();

            // Log d'audit
            $this->logAudit("Ajout de la puissance fiscale ID $puissanceId: $libelle ($valeur CV)");

            return ["status" => "success", "message" => "Puissance fiscale ajoutée avec succès."];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'ajout de la puissance fiscale: " . $e->getMessage());
            
            if ($e->getCode() == '23000') {
                return ["status" => "error", "message" => "Cette puissance fiscale existe déjà."];
            }
            
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Modifie les informations d'une puissance fiscale existante
     *
     * @param int $id ID de la puissance fiscale à modifier
     * @param string $libelle Nouveau libellé
     * @param float $valeur Nouvelle valeur
     * @param int $typeEnginId Nouveau type d'engin ID
     * @param string $description Nouvelle description
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function modifierPuissanceFiscale($id, $libelle, $valeur, $typeEnginId, $description = '')
    {
        // Validation des champs obligatoires
        if (empty($libelle) || empty($valeur) || empty($typeEnginId)) {
            return ["status" => "error", "message" => "Le libellé, la valeur et le type d'engin sont obligatoires."];
        }

        if (!is_numeric($valeur) || $valeur <= 0) {
            return ["status" => "error", "message" => "La valeur doit être un nombre positif."];
        }

        // Vérification de l'existence du type d'engin
        if (!$this->typeEnginExisteParId($typeEnginId)) {
            return ["status" => "error", "message" => "Le type d'engin sélectionné n'existe pas ou est inactive."];
        }

        try {
            // Vérification de l'unicité du nouveau libellé
            if ($this->puissanceFiscaleExiste($libelle, $typeEnginId, $id)) {
                return ["status" => "error", "message" => "Cette puissance fiscale existe déjà pour ce type d'engin."];
            }

            // Mise à jour des informations
            $sql = "UPDATE puissances_fiscales 
                    SET libelle = :libelle, 
                        valeur = :valeur,
                        type_engin_id = :type_engin_id,
                        description = :description,
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':libelle' => $libelle,
                ':valeur' => $valeur,
                ':type_engin_id' => $typeEnginId,
                ':description' => $description,
                ':id' => $id
            ]);

            // Log d'audit
            $this->logAudit("Modification de la puissance fiscale ID $id: $libelle ($valeur CV)");

            return ["status" => "success", "message" => "Les informations de la puissance fiscale ont été mises à jour."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification de la puissance fiscale: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime une puissance fiscale du système
     *
     * @param int $id ID de la puissance fiscale à supprimer
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function supprimerPuissanceFiscale($id)
    {
        // Vérification de l'existence de la puissance fiscale
        $puissance = $this->puissanceFiscaleExisteParId($id);
        if (!$puissance) {
            return ["status" => "error", "message" => "La puissance fiscale spécifiée n'existe pas."];
        }

        // Vérification si la puissance fiscale est utilisée dans d'autres tables
        if ($this->estPuissanceFiscaleUtilisee($id)) {
            return ["status" => "error", "message" => "Impossible de supprimer cette puissance fiscale car elle est utilisée dans le système."];
        }

        try {
            // Suppression de la puissance fiscale
            $sql = "DELETE FROM puissances_fiscales WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);

            // Log d'audit
            $this->logAudit("Suppression de la puissance fiscale ID $id: " . $puissance['libelle'] . ' (' . $puissance['valeur'] . ' CV)');

            return ["status" => "success", "message" => "La puissance fiscale a été supprimée avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de la puissance fiscale: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Vérifie si une puissance fiscale est utilisée dans d'autres tables
     *
     * @param int $puissanceId ID de la puissance fiscale
     * @return bool True si utilisée, false sinon
     */
    private function estPuissanceFiscaleUtilisee($puissanceId)
    {
        // Liste des tables qui pourraient référencer les puissances fiscales
        $tables = ['tarifs', 'calcul_impots', 'vehicules']; // À adapter selon votre schéma

        foreach ($tables as $table) {
            try {
                $sql = "SELECT COUNT(*) as count FROM $table WHERE puissance_fiscale_id = :puissance_id";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([':puissance_id' => $puissanceId]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($result && $result['count'] > 0) {
                    return true;
                }
            } catch (PDOException $e) {
                // La table n'existe peut-être pas, on continue
                continue;
            }
        }

        return false;
    }

    /**
     * Change le statut actif/inactif d'une puissance fiscale
     *
     * @param int $id ID de la puissance fiscale
     * @param bool $actif Nouveau statut (true = actif, false = inactif)
     * @return array Tableau avec statut et message
     * @throws PDOException En cas d'erreur de base de données
     */
    public function changerStatutPuissanceFiscale($id, $actif)
    {
        // Vérification de l'existence de la puissance fiscale
        $puissance = $this->puissanceFiscaleExisteParId($id);
        if (!$puissance) {
            return ["status" => "error", "message" => "La puissance fiscale spécifiée n'existe pas."];
        }

        try {
            $sql = "UPDATE puissances_fiscales 
                    SET actif = :actif, 
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);

            // Convertir en entier et binder comme INT
            $actifInt = $actif ? 1 : 0;
            $stmt->bindValue(':actif', $actifInt, PDO::PARAM_INT);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);

            $stmt->execute();

            $statut = $actifInt === 1 ? "activée" : "désactivée";
            $this->logAudit("Changement de statut de la puissance fiscale ID $id: " . $puissance['libelle'] . ' -> ' . $statut);

            return ["status" => "success", "message" => "La puissance fiscale a été $statut avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors du changement de statut de la puissance fiscale: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de toutes les puissances fiscales
     *
     * @return array Liste des puissances fiscales ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerPuissancesFiscales()
    {
        try {
            $sql = "SELECT pf.id, pf.libelle, pf.valeur, pf.description, pf.actif, 
                    te.libelle as type_engin_libelle, te.id as type_engin_id,
                    DATE_FORMAT(pf.date_creation, '%d/%m/%Y') as date_creation 
                    FROM puissances_fiscales pf 
                    LEFT JOIN type_engins te ON pf.type_engin_id = te.id 
                    ORDER BY te.libelle ASC, pf.valeur ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des puissances fiscales: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère les puissances fiscales actives (pour les dropdowns)
     *
     * @return array Liste des puissances fiscales actives
     * @throws PDOException En cas d'erreur de base de données
     */
    public function listerPuissancesFiscalesActives()
    {
        try {
            $sql = "SELECT pf.id, pf.libelle, pf.valeur, pf.description,
                    te.libelle as type_engin_libelle, te.id as type_engin_id
                    FROM puissances_fiscales pf 
                    LEFT JOIN type_engins te ON pf.type_engin_id = te.id 
                    WHERE pf.actif = 1 
                    ORDER BY te.libelle ASC, pf.valeur ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des puissances fiscales actives: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Recherche des puissances fiscales par terme de recherche
     *
     * @param string $searchTerm Terme de recherche
     * @return array Liste des puissances fiscales correspondantes ou message d'erreur
     * @throws PDOException En cas d'erreur de base de données
     */
    public function rechercherPuissancesFiscales($searchTerm)
    {
        try {
            $sql = "SELECT pf.id, pf.libelle, pf.valeur, pf.description, pf.actif, 
                    te.libelle as type_engin_libelle, te.id as type_engin_id,
                    DATE_FORMAT(pf.date_creation, '%d/%m/%Y') as date_creation 
                    FROM puissances_fiscales pf 
                    LEFT JOIN type_engins te ON pf.type_engin_id = te.id 
                    WHERE pf.libelle LIKE :search OR pf.valeur LIKE :search OR te.libelle LIKE :search
                    ORDER BY te.libelle ASC, pf.valeur ASC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':search' => '%' . $searchTerm . '%']);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des puissances fiscales: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère les puissances actives par type d'engin
     */
    public function listerPuissancesFiscalesActivesParType($typeEnginId)
    {
        try {
            $sql = "SELECT pf.libelle 
                    FROM puissances_fiscales pf 
                    WHERE pf.type_engin_id = :type_engin_id 
                    AND pf.actif = 1 
                    ORDER BY pf.valeur ASC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':type_engin_id' => $typeEnginId]);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des puissances par type: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Recherche des puissances fiscales par type d'engin et terme de recherche
     */
    public function rechercherPuissancesParType($typeEnginId, $searchTerm)
    {
        try {
            $sql = "SELECT pf.id, pf.libelle, pf.valeur, pf.description, pf.actif, 
                    pf.type_engin_id, te.libelle as type_engin_libelle
                    FROM puissances_fiscales pf 
                    LEFT JOIN type_engins te ON pf.type_engin_id = te.id 
                    WHERE pf.type_engin_id = :type_engin_id 
                    AND pf.actif = 1";
            
            $params = [':type_engin_id' => $typeEnginId];
            
            if (!empty($searchTerm)) {
                $sql .= " AND (pf.libelle LIKE :search OR pf.valeur LIKE :search OR pf.description LIKE :search)";
                $params[':search'] = '%' . $searchTerm . '%';
            }
            
            $sql .= " ORDER BY pf.valeur ASC LIMIT 10";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des puissances: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Recherche des puissances fiscales par libellé de type d'engin et terme
     */
    public function rechercherPuissancesParTypeLibelle($typeEnginLibelle, $searchTerm)
    {
        try {
            // Récupérer l'ID du type d'engin
            $sqlType = "SELECT id FROM type_engins WHERE libelle = :libelle AND actif = 1";
            $stmtType = $this->pdo->prepare($sqlType);
            $stmtType->execute([':libelle' => $typeEnginLibelle]);
            $typeEnginData = $stmtType->fetch(PDO::FETCH_ASSOC);
            
            if (!$typeEnginData) {
                return ["status" => "error", "message" => "Type d'engin non trouvé."];
            }
            
            $typeId = $typeEnginData['id'];
            
            // Rechercher les puissances
            $sql = "SELECT pf.id, pf.libelle, pf.valeur, pf.description, pf.actif, 
                    pf.type_engin_id, te.libelle as type_engin_libelle
                    FROM puissances_fiscales pf 
                    LEFT JOIN type_engins te ON pf.type_engin_id = te.id 
                    WHERE pf.type_engin_id = :type_id 
                    AND pf.actif = 1";
            
            $params = [':type_id' => $typeId];
            
            if (!empty($searchTerm)) {
                $sql .= " AND (pf.libelle LIKE :search OR pf.valeur LIKE :search OR pf.description LIKE :search)";
                $params[':search'] = '%' . $searchTerm . '%';
            }
            
            $sql .= " ORDER BY pf.valeur ASC LIMIT 10";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des puissances par type: " . $e->getMessage());
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