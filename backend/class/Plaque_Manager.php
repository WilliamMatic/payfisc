<?php
require_once 'Connexion.php';

/**
 * Classe PlaqueManager - Gestion complète des plaques avec filtrage par province
 */
class PlaqueManager extends Connexion
{
    /**
     * Récupère la province_id d'un utilisateur via son site
     */
    private function getProvinceIdByUtilisateur($utilisateurId)
    {
        try {
            $sql = "SELECT s.province_id 
                    FROM utilisateurs u 
                    JOIN sites s ON u.site_affecte_id = s.id 
                    WHERE u.id = :utilisateur_id";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':utilisateur_id' => $utilisateurId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$result || !$result['province_id']) {
                throw new Exception("Province non trouvée pour cet utilisateur");
            }

            return $result['province_id'];
        } catch (PDOException $e) {
            error_log("Erreur récupération province: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Récupère les séries selon la province de l'utilisateur
     */
    public function getSeriesByUtilisateur($utilisateurId)
    {
        try {
            // Récupérer la province de l'utilisateur
            $provinceId = $this->getProvinceIdByUtilisateur($utilisateurId);

            $sql = "SELECT 
                    s.id,
                    s.nom_serie,
                    s.description,
                    s.actif,
                    s.province_id,
                    p.nom as province_nom,
                    p.code as province_code,
                    s.debut_numeros,
                    s.fin_numeros,
                    s.date_creation,
                    DATE_FORMAT(s.date_creation, '%d/%m/%Y %H:%i') as date_creation_formatted,
                    COUNT(si.id) as total_items,
                    SUM(CASE WHEN si.statut = '0' THEN 1 ELSE 0 END) as items_disponibles,
                    SUM(CASE WHEN si.statut = '1' THEN 1 ELSE 0 END) as items_utilises
                FROM series s
                LEFT JOIN serie_items si ON s.id = si.serie_id
                LEFT JOIN provinces p ON s.province_id = p.id
                WHERE s.province_id = :province_id
                GROUP BY s.id, s.nom_serie, s.description, s.actif, s.province_id, p.nom, p.code, s.debut_numeros, s.fin_numeros, s.date_creation
                ORDER BY s.nom_serie ASC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':province_id' => $provinceId]);
            $series = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "data" => $series
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des séries: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        } catch (Exception $e) {
            error_log("Erreur lors de la récupération des séries: " . $e->getMessage());
            return ["status" => "error", "message" => $e->getMessage()];
        }
    }

    /**
     * Récupère les items d'une série selon la province de l'utilisateur
     */
    public function getSerieItemsByUtilisateur($serieId, $utilisateurId)
    {
        try {
            // Récupérer la province de l'utilisateur
            $provinceId = $this->getProvinceIdByUtilisateur($utilisateurId);

            $sql = "SELECT 
                    si.id,
                    si.serie_id,
                    si.value,
                    si.statut,
                    si.date_creation,
                    s.nom_serie,
                    p.nom as province_nom
                FROM serie_items si
                JOIN series s ON si.serie_id = s.id
                JOIN provinces p ON s.province_id = p.id
                WHERE si.serie_id = :serie_id 
                AND s.province_id = :province_id
                ORDER BY si.value ASC";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':serie_id' => $serieId,
                ':province_id' => $provinceId
            ]);
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "data" => $items
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des items: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        } catch (Exception $e) {
            error_log("Erreur lors de la récupération des items: " . $e->getMessage());
            return ["status" => "error", "message" => $e->getMessage()];
        }
    }

    /**
     * Crée une nouvelle série avec vérification de la province
     */
    public function creerSerie($data)
    {
        $requiredFields = ['nom_serie', 'province_id', 'debut_numeros', 'fin_numeros', 'utilisateur_id'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                return ["status" => "error", "message" => "Le champ $field est obligatoire."];
            }
        }

        try {
            // Vérifier que l'utilisateur a accès à cette province
            $provinceIdUtilisateur = $this->getProvinceIdByUtilisateur($data['utilisateur_id']);
            $provinceIdDemandee = intval($data['province_id']);

            if ($provinceIdUtilisateur !== $provinceIdDemandee) {
                return ["status" => "error", "message" => "Vous n'avez pas accès à cette province."];
            }

            // Vérifier si la série existe déjà
            $sqlCheck = "SELECT id FROM series WHERE nom_serie = :nom_serie AND province_id = :province_id";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([
                ':nom_serie' => $data['nom_serie'],
                ':province_id' => $provinceIdDemandee
            ]);

            if ($stmtCheck->fetch()) {
                return ["status" => "error", "message" => "Une série avec ce nom existe déjà pour cette province."];
            }

            // Créer la série
            $sql = "INSERT INTO series 
                    (nom_serie, description, province_id, debut_numeros, fin_numeros, date_creation) 
                    VALUES 
                    (:nom_serie, :description, :province_id, :debut_numeros, :fin_numeros, NOW())";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom_serie' => $data['nom_serie'],
                ':description' => $data['description'] ?? null,
                ':province_id' => $provinceIdDemandee,
                ':debut_numeros' => intval($data['debut_numeros']),
                ':fin_numeros' => intval($data['fin_numeros'])
            ]);

            $serieId = $this->pdo->lastInsertId();

            // Générer les items de la série
            $this->genererItemsSerie($serieId, intval($data['debut_numeros']), intval($data['fin_numeros']));

            return [
                "status" => "success",
                "message" => "Série créée avec succès",
                "data" => [
                    "serie_id" => $serieId
                ]
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la création de la série: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        } catch (Exception $e) {
            error_log("Erreur lors de la création de la série: " . $e->getMessage());
            return ["status" => "error", "message" => $e->getMessage()];
        }
    }

    /**
     * Génère les items d'une série
     */
    private function genererItemsSerie($serieId, $debut, $fin)
    {
        try {
            $sql = "INSERT INTO serie_items (serie_id, value, date_creation) VALUES (:serie_id, :value, NOW())";
            $stmt = $this->pdo->prepare($sql);

            for ($i = $debut; $i <= $fin; $i++) {
                $stmt->execute([
                    ':serie_id' => $serieId,
                    ':value' => $i
                ]);
            }

            return true;
        } catch (PDOException $e) {
            error_log("Erreur lors de la génération des items: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Modifie une série existante avec vérification de la province
     */
    public function modifierSerie($data)
    {
        $requiredFields = ['id', 'nom_serie', 'province_id', 'utilisateur_id'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                return ["status" => "error", "message" => "Le champ $field est obligatoire."];
            }
        }

        try {
            // Vérifier que l'utilisateur a accès à cette province
            $provinceIdUtilisateur = $this->getProvinceIdByUtilisateur($data['utilisateur_id']);
            $provinceIdDemandee = intval($data['province_id']);

            if ($provinceIdUtilisateur !== $provinceIdDemandee) {
                return ["status" => "error", "message" => "Vous n'avez pas accès à cette province."];
            }

            // Vérifier si la série existe et appartient à la bonne province
            $sqlCheck = "SELECT id FROM series WHERE id = :id AND province_id = :province_id";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([
                ':id' => $data['id'],
                ':province_id' => $provinceIdDemandee
            ]);

            if (!$stmtCheck->fetch()) {
                return ["status" => "error", "message" => "Série non trouvée ou vous n'y avez pas accès."];
            }

            // Vérifier si le nouveau nom existe déjà pour cette province
            $sqlCheckNom = "SELECT id FROM series WHERE nom_serie = :nom_serie AND province_id = :province_id AND id != :id";
            $stmtCheckNom = $this->pdo->prepare($sqlCheckNom);
            $stmtCheckNom->execute([
                ':nom_serie' => $data['nom_serie'],
                ':province_id' => $provinceIdDemandee,
                ':id' => $data['id']
            ]);

            if ($stmtCheckNom->fetch()) {
                return ["status" => "error", "message" => "Une série avec ce nom existe déjà pour cette province."];
            }

            // Modifier la série
            $sql = "UPDATE series 
                    SET nom_serie = :nom_serie, 
                        description = :description,
                        date_modification = NOW()
                    WHERE id = :id AND province_id = :province_id";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom_serie' => $data['nom_serie'],
                ':description' => $data['description'] ?? null,
                ':id' => $data['id'],
                ':province_id' => $provinceIdDemandee
            ]);

            return [
                "status" => "success",
                "message" => "Série modifiée avec succès"
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification de la série: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        } catch (Exception $e) {
            error_log("Erreur lors de la modification de la série: " . $e->getMessage());
            return ["status" => "error", "message" => $e->getMessage()];
        }
    }

    /**
     * Supprime une série avec vérification de la province
     */
    public function supprimerSerie($data)
    {
        $requiredFields = ['id', 'utilisateur_id'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                return ["status" => "error", "message" => "Le champ $field est obligatoire."];
            }
        }

        try {
            // Vérifier que l'utilisateur a accès à cette série
            $provinceIdUtilisateur = $this->getProvinceIdByUtilisateur($data['utilisateur_id']);

            // Vérifier si la série existe et appartient à la bonne province
            $sqlCheck = "SELECT id FROM series WHERE id = :id AND province_id = :province_id";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([
                ':id' => $data['id'],
                ':province_id' => $provinceIdUtilisateur
            ]);

            if (!$stmtCheck->fetch()) {
                return ["status" => "error", "message" => "Série non trouvée ou vous n'y avez pas accès."];
            }

            // Supprimer la série (les items seront supprimés par CASCADE)
            $sql = "DELETE FROM series WHERE id = :id AND province_id = :province_id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':id' => $data['id'],
                ':province_id' => $provinceIdUtilisateur
            ]);

            return [
                "status" => "success",
                "message" => "Série supprimée avec succès"
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de la série: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        } catch (Exception $e) {
            error_log("Erreur lors de la suppression de la série: " . $e->getMessage());
            return ["status" => "error", "message" => $e->getMessage()];
        }
    }

    /**
     * Change le statut d'une série avec vérification de la province
     */
    public function changerStatutSerie($data)
    {
        $requiredFields = ['id', 'actif', 'utilisateur_id'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                return ["status" => "error", "message" => "Le champ $field est obligatoire."];
            }
        }

        try {
            // Vérifier que l'utilisateur a accès à cette série
            $provinceIdUtilisateur = $this->getProvinceIdByUtilisateur($data['utilisateur_id']);

            // Vérifier si la série existe et appartient à la bonne province
            $sqlCheck = "SELECT id FROM series WHERE id = :id AND province_id = :province_id";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->execute([
                ':id' => $data['id'],
                ':province_id' => $provinceIdUtilisateur
            ]);

            if (!$stmtCheck->fetch()) {
                return ["status" => "error", "message" => "Série non trouvée ou vous n'y avez pas accès."];
            }

            // Changer le statut
            $sql = "UPDATE series 
                    SET actif = :actif, 
                        date_modification = NOW()
                    WHERE id = :id AND province_id = :province_id";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':actif' => $data['actif'] ? 1 : 0,
                ':id' => $data['id'],
                ':province_id' => $provinceIdUtilisateur
            ]);

            return [
                "status" => "success",
                "message" => "Statut de la série modifié avec succès"
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors du changement de statut de la série: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        } catch (Exception $e) {
            error_log("Erreur lors du changement de statut de la série: " . $e->getMessage());
            return ["status" => "error", "message" => $e->getMessage()];
        }
    }

    /**
     * Recherche des séries selon la province de l'utilisateur
     */
    public function rechercherSeriesByUtilisateur($searchTerm, $utilisateurId)
    {
        try {
            // Récupérer la province de l'utilisateur
            $provinceId = $this->getProvinceIdByUtilisateur($utilisateurId);

            $sql = "SELECT 
                    s.id,
                    s.nom_serie,
                    s.description,
                    s.actif,
                    s.province_id,
                    p.nom as province_nom,
                    p.code as province_code,
                    s.debut_numeros,
                    s.fin_numeros,
                    s.date_creation,
                    DATE_FORMAT(s.date_creation, '%d/%m/%Y %H:%i') as date_creation_formatted,
                    COUNT(si.id) as total_items,
                    SUM(CASE WHEN si.statut = '0' THEN 1 ELSE 0 END) as items_disponibles,
                    SUM(CASE WHEN si.statut = '1' THEN 1 ELSE 0 END) as items_utilises
                FROM series s
                LEFT JOIN serie_items si ON s.id = si.serie_id
                LEFT JOIN provinces p ON s.province_id = p.id
                WHERE s.province_id = :province_id
                AND (s.nom_serie LIKE :search OR s.description LIKE :search)
                GROUP BY s.id, s.nom_serie, s.description, s.actif, s.province_id, p.nom, p.code, s.debut_numeros, s.fin_numeros, s.date_creation
                ORDER BY s.nom_serie ASC";

            $stmt = $this->pdo->prepare($sql);
            $searchPattern = "%" . $searchTerm . "%";
            $stmt->execute([
                ':province_id' => $provinceId,
                ':search' => $searchPattern
            ]);
            $series = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "data" => $series
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des séries: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        } catch (Exception $e) {
            error_log("Erreur lors de la recherche des séries: " . $e->getMessage());
            return ["status" => "error", "message" => $e->getMessage()];
        }
    }
}
?>