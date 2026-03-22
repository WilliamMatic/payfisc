<?php
require_once 'Connexion.php';

/**
 * Classe Plaque - Gestion complète des séries et plaques
 */
class Plaque extends Connexion
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
     * Vérifie l'existence d'une série par son nom et province
     */
    public function serieExisteParNomEtProvince($nomSerie, $provinceId)
    {
        try {
            $sql = "SELECT id, nom_serie, description, actif FROM series 
                    WHERE nom_serie = :nom_serie AND province_id = :province_id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                'nom_serie' => $nomSerie,
                'province_id' => $provinceId
            ]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de l'existence de la série: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie l'existence d'une série par son ID
     */
    public function serieExisteParId($id)
    {
        try {
            $sql = "SELECT s.*, p.nom as province_nom, p.code as province_code,
                    COUNT(si.id) as total_items,
                    COUNT(CASE WHEN si.statut = '0' THEN 1 END) as items_disponibles,
                    COUNT(CASE WHEN si.statut = '1' THEN 1 END) as items_utilises
                    FROM series s 
                    LEFT JOIN serie_items si ON s.id = si.serie_id 
                    LEFT JOIN provinces p ON s.province_id = p.id
                    WHERE s.id = :id
                    GROUP BY s.id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de la série par ID: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Ajoute une nouvelle série avec plage numérique personnalisée
     * ou étend une série existante si elle n'a pas atteint 999 items
     */
    public function ajouterSerie($nomSerie, $provinceId, $debutNumeros, $finNumeros, $description = null)
    {
        // Validation des données
        if (empty($nomSerie)) {
            return ["status" => "error", "message" => "Le nom de la série est obligatoire."];
        }
        if (empty($provinceId)) {
            return ["status" => "error", "message" => "La province est obligatoire."];
        }
        // Validation du format (2 lettres majuscules)
        if (!preg_match('/^[A-Z]{2}$/', $nomSerie)) {
            return ["status" => "error", "message" => "Le nom de la série doit contenir exactement 2 lettres majuscules."];
        }
        // Validation de la plage numérique
        if ($debutNumeros < 1 || $finNumeros > 999 || $debutNumeros > $finNumeros) {
            return ["status" => "error", "message" => "La plage numérique doit être entre 1 et 999, avec début <= fin."];
        }
        
        // Vérification de l'existence de la province
        $province = $this->provinceExisteParId($provinceId);
        if (!$province) {
            return ["status" => "error", "message" => "La province sélectionnée n'existe pas."];
        }
        
        // Vérifier si la série existe déjà
        $serieExistante = $this->getSerieParNomEtProvince($nomSerie, $provinceId);
        
        try {
            $this->pdo->beginTransaction();
            
            if ($serieExistante) {
                // La série existe, vérifier le nombre d'items actuels
                $sqlCount = "SELECT COUNT(*) as total FROM serie_items WHERE serie_id = :serie_id";
                $stmtCount = $this->pdo->prepare($sqlCount);
                $stmtCount->execute([':serie_id' => $serieExistante['id']]);
                $itemsActuels = $stmtCount->fetch(PDO::FETCH_ASSOC)['total'];
                
                // Calculer le nombre d'items à ajouter
                $nouveauxItems = $finNumeros - $debutNumeros + 1;
                $totalApresAjout = $itemsActuels + $nouveauxItems;
                
                if ($totalApresAjout > 999) {
                    $this->pdo->rollBack();
                    return [
                        "status" => "error", 
                        "message" => "Cette série contient déjà $itemsActuels items. L'ajout de $nouveauxItems items dépasserait la limite de 999 (total: $totalApresAjout)."
                    ];
                }
                
                // Récupérer les valeurs déjà existantes pour éviter les doublons
                $sqlExisting = "SELECT value FROM serie_items WHERE serie_id = :serie_id";
                $stmtExisting = $this->pdo->prepare($sqlExisting);
                $stmtExisting->execute([':serie_id' => $serieExistante['id']]);
                $valeursExistantes = $stmtExisting->fetchAll(PDO::FETCH_COLUMN);
                
                // Insérer uniquement les nouveaux items
                $sqlItem = "INSERT INTO serie_items (serie_id, value) VALUES (:serie_id, :value)";
                $stmtItem = $this->pdo->prepare($sqlItem);
                $itemsAjoutes = 0;
                
                for ($i = $debutNumeros; $i <= $finNumeros; $i++) {
                    if (!in_array($i, $valeursExistantes)) {
                        $stmtItem->execute([
                            ':serie_id' => $serieExistante['id'],
                            ':value' => $i
                        ]);
                        $itemsAjoutes++;
                    }
                }
                
                // Mettre à jour la description si fournie
                if ($description !== null) {
                    $sqlUpdate = "UPDATE series SET description = :description WHERE id = :id";
                    $stmtUpdate = $this->pdo->prepare($sqlUpdate);
                    $stmtUpdate->execute([
                        ':description' => $description,
                        ':id' => $serieExistante['id']
                    ]);
                }
                
                $this->pdo->commit();
                
                // Log d'audit
                $this->logAudit("Extension de la série ID {$serieExistante['id']}: $nomSerie - Province: {$province['nom']} - Ajout de $itemsAjoutes items (plage $debutNumeros-$finNumeros). Total: $totalApresAjout items");
                
                return [
                    "status" => "success", 
                    "message" => "Série étendue avec succès. $itemsAjoutes nouveaux items ajoutés (total: $totalApresAjout/999)."
                ];
                
            } else {
                // Nouvelle série - Code original
                $sql = "INSERT INTO series (nom_serie, province_id, debut_numeros, fin_numeros, description) 
                        VALUES (:nom_serie, :province_id, :debut_numeros, :fin_numeros, :description)";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([
                    ':nom_serie' => $nomSerie,
                    ':province_id' => $provinceId,
                    ':debut_numeros' => $debutNumeros,
                    ':fin_numeros' => $finNumeros,
                    ':description' => $description
                ]);
                $serieId = $this->pdo->lastInsertId();
                
                // Insertion des items selon la plage
                $sqlItem = "INSERT INTO serie_items (serie_id, value) VALUES (:serie_id, :value)";
                $stmtItem = $this->pdo->prepare($sqlItem);
                
                for ($i = $debutNumeros; $i <= $finNumeros; $i++) {
                    $stmtItem->execute([
                        ':serie_id' => $serieId,
                        ':value' => $i
                    ]);
                }
                
                $this->pdo->commit();
                
                // Log d'audit
                $totalItems = $finNumeros - $debutNumeros + 1;
                $this->logAudit("Ajout de la série ID $serieId: $nomSerie - Province: {$province['nom']} - Plage: $debutNumeros-$finNumeros ($totalItems items)");
                
                return [
                    "status" => "success", 
                    "message" => "Série ajoutée avec succès avec $totalItems items générés (plage $debutNumeros-$finNumeros)."
                ];
            }
            
        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'ajout/extension de la série: " . $e->getMessage());
            
            if ($e->getCode() == '23000') {
                return ["status" => "error", "message" => "Erreur d'unicité lors de l'ajout des items."];
            }
            
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère une série par nom et province
     */
    private function getSerieParNomEtProvince($nomSerie, $provinceId)
    {
        $sql = "SELECT * FROM series WHERE nom_serie = :nom_serie AND province_id = :province_id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':nom_serie' => $nomSerie,
            ':province_id' => $provinceId
        ]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Modifie une série existante
     */
    public function modifierSerie($id, $nomSerie, $provinceId, $description = null)
    {
        // Validation des données
        if (empty($nomSerie)) {
            return ["status" => "error", "message" => "Le nom de la série est obligatoire."];
        }

        if (empty($provinceId)) {
            return ["status" => "error", "message" => "La province est obligatoire."];
        }

        // Validation du format
        if (!preg_match('/^[A-Z]{2}$/', $nomSerie)) {
            return ["status" => "error", "message" => "Le nom de la série doit contenir exactement 2 lettres majuscules."];
        }

        // Vérification de l'existence de la série
        $serie = $this->serieExisteParId($id);
        if (!$serie) {
            return ["status" => "error", "message" => "La série spécifiée n'existe pas."];
        }

        // Vérification de l'existence de la province
        $province = $this->provinceExisteParId($provinceId);
        if (!$province) {
            return ["status" => "error", "message" => "La province sélectionnée n'existe pas."];
        }

        // Vérification de l'unicité du nouveau nom dans la même province
        $sqlCheckNom = "SELECT id FROM series WHERE nom_serie = :nom_serie AND province_id = :province_id AND id != :id";
        $stmtCheckNom = $this->pdo->prepare($sqlCheckNom);
        $stmtCheckNom->execute([
            ':nom_serie' => $nomSerie,
            ':province_id' => $provinceId,
            ':id' => $id
        ]);

        if ($stmtCheckNom->rowCount() > 0) {
            return ["status" => "error", "message" => "Ce nom de série est déjà utilisé pour cette province."];
        }

        try {
            // Mise à jour de la série
            $sql = "UPDATE series 
                    SET nom_serie = :nom_serie, 
                        province_id = :province_id,
                        description = :description,
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom_serie' => $nomSerie,
                ':province_id' => $provinceId,
                ':description' => $description,
                ':id' => $id
            ]);

            // Log d'audit
            $this->logAudit("Modification de la série ID $id: $nomSerie - Province: {$province['nom']}");

            return ["status" => "success", "message" => "La série a été modifiée avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la modification de la série: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Supprime une série et ses items
     */
    public function supprimerSerie($id)
    {
        // Vérification de l'existence de la série
        $serie = $this->serieExisteParId($id);
        if (!$serie) {
            return ["status" => "error", "message" => "La série spécifiée n'existe pas."];
        }

        // Vérifier si des items sont utilisés
        if ($serie['items_utilises'] > 0) {
            return ["status" => "error", "message" => "Impossible de supprimer cette série car certains items sont utilisés."];
        }

        try {
            // La suppression en cascade s'occupe des items
            $sql = "DELETE FROM series WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);

            // Log d'audit
            $this->logAudit("Suppression de la série ID $id: " . $serie['nom_serie'] . " - Province: " . $serie['province_nom']);

            return ["status" => "success", "message" => "La série a été supprimée avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors de la suppression de la série: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Change le statut actif/inactif d'une série
     */
    public function changerStatutSerie($id, $actif)
    {
        // Vérification de l'existence de la série
        $serie = $this->serieExisteParId($id);
        if (!$serie) {
            return ["status" => "error", "message" => "La série spécifiée n'existe pas."];
        }

        try {
            $sql = "UPDATE series 
                    SET actif = :actif, 
                        date_modification = CURRENT_TIMESTAMP
                    WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);

            $actifInt = $actif ? 1 : 0;
            $stmt->bindValue(':actif', $actifInt, PDO::PARAM_INT);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);

            $stmt->execute();

            $statut = $actifInt === 1 ? "activée" : "désactivée";
            $this->logAudit("Changement de statut de la série ID $id: " . $serie['nom_serie'] . ' -> ' . $statut);

            return ["status" => "success", "message" => "La série a été $statut avec succès."];

        } catch (PDOException $e) {
            error_log("Erreur lors du changement de statut de la série: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de toutes les séries avec statistiques et pagination
     */
    public function listerSeriesPagination($page = 1, $limit = 15, $utilisateurId = null)
    {
        try {
            $conditions = [];
            $params = [];
            
            // Gestion du filtrage par province si un utilisateur est fourni
            if ($utilisateurId !== null) {
                $provinceId = $this->getProvinceIdByUtilisateur($utilisateurId);
                if ($provinceId) {
                    $conditions[] = "s.province_id = :province_id";
                    $params[':province_id'] = $provinceId;
                }
            }
            
            // Construction de la clause WHERE
            $whereClause = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';
            
            // Calcul de l'offset
            $offset = ($page - 1) * $limit;
            
            // Requête pour compter le total avec filtres
            $sqlCount = "SELECT COUNT(DISTINCT s.id) as total 
                         FROM series s 
                         LEFT JOIN provinces p ON s.province_id = p.id
                         $whereClause";
            
            $stmtCount = $this->pdo->prepare($sqlCount);
            foreach ($params as $key => $value) {
                $stmtCount->bindValue($key, $value);
            }
            $stmtCount->execute();
            $totalResult = $stmtCount->fetch(PDO::FETCH_ASSOC);
            $total = (int)$totalResult['total'];
            
            // Calcul du nombre total de pages
            $totalPages = $total > 0 ? ceil($total / $limit) : 0;
            
            // Requête principale avec pagination
            $sql = "SELECT s.*, 
                    p.nom as province_nom, 
                    p.code as province_code,
                    COUNT(si.id) as total_items,
                    SUM(CASE WHEN si.statut = '0' THEN 1 ELSE 0 END) as items_disponibles,
                    SUM(CASE WHEN si.statut = '1' THEN 1 ELSE 0 END) as items_utilises,
                    DATE_FORMAT(s.date_creation, '%d/%m/%Y') as date_creation_formatted
                    FROM series s 
                    LEFT JOIN serie_items si ON s.id = si.serie_id 
                    LEFT JOIN provinces p ON s.province_id = p.id
                    $whereClause
                    GROUP BY s.id
                    ORDER BY s.date_creation ASC
                    LIMIT :limit OFFSET :offset";
            
            $stmt = $this->pdo->prepare($sql);
            
            // Liaison des paramètres de filtre
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            
            // Liaison des paramètres de pagination
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success", 
                "data" => [
                    "series" => $resultats,
                    "pagination" => [
                        "total" => $total,
                        "page" => (int)$page,
                        "limit" => (int)$limit,
                        "totalPages" => $totalPages
                    ]
                ]
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des séries avec pagination: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste de toutes les séries avec statistiques (sans pagination - pour compatibilité)
     */
    public function listerSeries()
    {
        try {
            $sql = "SELECT s.*, p.nom as province_nom, p.code as province_code,
                    COUNT(si.id) as total_items,
                    COUNT(CASE WHEN si.statut = '0' THEN 1 END) as items_disponibles,
                    COUNT(CASE WHEN si.statut = '1' THEN 1 END) as items_utilises,
                    DATE_FORMAT(s.date_creation, '%d/%m/%Y') as date_creation_formatted
                    FROM series s 
                    LEFT JOIN serie_items si ON s.id = si.serie_id 
                    LEFT JOIN provinces p ON s.province_id = p.id
                    GROUP BY s.id
                    ORDER BY s.date_creation DESC, p.nom ASC, s.nom_serie ASC
                    LIMIT 15"; // Limité à 15 pour compatibilité
                    
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des séries: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère les items d'une série spécifique
     */
    public function listerItemsSerie($serieId)
    {
        try {
            $sql = "SELECT si.*, s.nom_serie, p.nom as province_nom
                    FROM serie_items si 
                    JOIN series s ON si.serie_id = s.id 
                    LEFT JOIN provinces p ON s.province_id = p.id
                    WHERE si.serie_id = :serie_id 
                    ORDER BY si.value ASC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['serie_id' => $serieId]);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des items de série: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Recherche des séries par terme avec pagination
     */
    public function rechercherSeriesPagination($searchTerm, $page = 1, $limit = 15, $utilisateurId = null)
    {
        try {
            // Calcul de l'offset
            $offset = ($page - 1) * $limit;

            // Initialisation des variables
            $conditions = [];
            $params = [];
            
            // Gestion du filtrage par province si un utilisateur est fourni
            if ($utilisateurId !== null) {
                $provinceId = $this->getProvinceIdByUtilisateur($utilisateurId);
                if ($provinceId) {
                    $conditions[] = "s.province_id = :province_id";
                    $params[':province_id'] = $provinceId;
                }
            }
            
            // Ajout de la condition de recherche
            $searchConditions = [];
            $searchConditions[] = "s.nom_serie LIKE :search";
            $searchConditions[] = "s.description LIKE :search";
            $searchConditions[] = "p.nom LIKE :search";
            
            // Ajouter les conditions de recherche aux autres conditions
            if (!empty($conditions)) {
                $whereClause = "(" . implode(" OR ", $searchConditions) . ") AND " . implode(" AND ", $conditions);
            } else {
                $whereClause = "(" . implode(" OR ", $searchConditions) . ")";
            }
            
            // Requête pour compter le total des résultats de recherche AVEC FILTRES
            $sqlCount = "SELECT COUNT(DISTINCT s.id) as total 
                        FROM series s 
                        LEFT JOIN provinces p ON s.province_id = p.id
                        WHERE $whereClause";
            
            $stmtCount = $this->pdo->prepare($sqlCount);
            
            // Liaison des paramètres de recherche
            $stmtCount->bindValue(':search', '%' . $searchTerm . '%');
            
            // Liaison des autres paramètres (province_id)
            foreach ($params as $key => $value) {
                $stmtCount->bindValue($key, $value);
            }
            
            $stmtCount->execute();
            $totalResult = $stmtCount->fetch(PDO::FETCH_ASSOC);
            $total = (int)$totalResult['total'];
            
            // Calcul du nombre total de pages
            $totalPages = $total > 0 ? ceil($total / $limit) : 0;
            
            // Requête principale avec pagination
            $sql = "SELECT s.*, p.nom as province_nom, p.code as province_code,
                    COUNT(si.id) as total_items,
                    COUNT(CASE WHEN si.statut = '0' THEN 1 END) as items_disponibles,
                    COUNT(CASE WHEN si.statut = '1' THEN 1 END) as items_utilises,
                    DATE_FORMAT(s.date_creation, '%d/%m/%Y') as date_creation_formatted
                    FROM series s 
                    LEFT JOIN serie_items si ON s.id = si.serie_id 
                    LEFT JOIN provinces p ON s.province_id = p.id
                    WHERE $whereClause
                    GROUP BY s.id
                    ORDER BY 
                        CASE 
                            WHEN s.nom_serie LIKE :search_exact THEN 1
                            WHEN p.nom LIKE :search_exact THEN 2
                            ELSE 3
                        END,
                        p.nom ASC, s.nom_serie ASC
                    LIMIT :limit OFFSET :offset";
            
            $stmt = $this->pdo->prepare($sql);
            
            // Liaison des paramètres de recherche
            $stmt->bindValue(':search', '%' . $searchTerm . '%');
            $stmt->bindValue(':search_exact', $searchTerm . '%');
            
            // Liaison des autres paramètres (province_id)
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            
            // Liaison des paramètres de pagination
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success", 
                "data" => [
                    "series" => $resultats,
                    "pagination" => [
                        "total" => $total,
                        "page" => (int)$page,
                        "limit" => (int)$limit,
                        "totalPages" => $totalPages
                    ]
                ]
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des séries avec pagination: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        } catch (Exception $e) {
            error_log("Erreur lors de la recherche des séries avec pagination: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur: " . $e->getMessage()];
        }
    }

    /**
     * Recherche des séries par terme (sans pagination - pour compatibilité)
     */
    public function rechercherSeries($searchTerm)
    {
        try {
            $sql = "SELECT s.*, p.nom as province_nom, p.code as province_code,
                    COUNT(si.id) as total_items,
                    COUNT(CASE WHEN si.statut = '0' THEN 1 END) as items_disponibles,
                    COUNT(CASE WHEN si.statut = '1' THEN 1 END) as items_utilises,
                    DATE_FORMAT(s.date_creation, '%d/%m/%Y') as date_creation_formatted
                    FROM series s 
                    LEFT JOIN serie_items si ON s.id = si.serie_id 
                    LEFT JOIN provinces p ON s.province_id = p.id
                    WHERE s.nom_serie LIKE :search OR s.description LIKE :search OR p.nom LIKE :search
                    GROUP BY s.id
                    ORDER BY p.nom ASC, s.nom_serie ASC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':search' => '%' . $searchTerm . '%']);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors de la recherche des séries: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Récupère la liste des provinces actives
     */
    public function listerProvincesActives()
    {
        try {
            $sql = "SELECT id, nom, code FROM provinces WHERE actif = 1 ORDER BY nom ASC";
            $stmt = $this->pdo->query($sql);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors du listing des provinces: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Vérifie l'existence d'une province par son ID
     */
    private function provinceExisteParId($id)
    {
        try {
            $sql = "SELECT id, nom, code FROM provinces WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification de la province: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Génère un rapport détaillé des séries
     */
    public function genererRapportSeries($dateDebut, $dateFin, $provinceId = null)
    {
        try {
            // Construction de la requête de base
            $sqlBase = "SELECT 
                        s.*, 
                        p.nom as province_nom, 
                        p.code as province_code,
                        COUNT(si.id) as total_items,
                        COUNT(CASE WHEN si.statut = '0' THEN 1 END) as items_disponibles,
                        COUNT(CASE WHEN si.statut = '1' THEN 1 END) as items_utilises,
                        a.nom as createur_nom,
                        a.prenom as createur_prenom
                    FROM series s 
                    INNER JOIN serie_items si ON s.id = si.serie_id 
                    INNER JOIN provinces p ON s.province_id = p.id
                    LEFT JOIN agents a ON s.createur_id = a.id
                    WHERE s.date_creation BETWEEN :date_debut AND :date_fin";

            $params = [
                ':date_debut' => $dateDebut . ' 00:00:00',
                ':date_fin' => $dateFin . ' 23:59:59'
            ];

            // Ajout du filtre par province si spécifié
            if ($provinceId !== null) {
                $sqlBase .= " AND s.province_id = :province_id";
                $params[':province_id'] = $provinceId;
            }

            $sqlBase .= " GROUP BY s.id ORDER BY p.nom ASC, s.nom_serie ASC";

            // Récupération des séries détaillées
            $stmtDetails = $this->pdo->prepare($sqlBase);
            $stmtDetails->execute($params);
            $detailsSeries = $stmtDetails->fetchAll(PDO::FETCH_ASSOC);

            // Statistiques globales
            $sqlStats = "SELECT 
                        COUNT(DISTINCT s.id) as total_series,
                        COUNT(DISTINCT CASE WHEN s.actif = 1 THEN s.id END) as series_actives,
                        COUNT(DISTINCT CASE WHEN s.actif = 0 THEN s.id END) as series_inactives,
                        COUNT(si.id) as total_plaques,
                        COUNT(CASE WHEN si.statut = '0' THEN 1 END) as plaques_disponibles,
                        COUNT(CASE WHEN si.statut = '1' THEN 1 END) as plaques_utilisees
                    FROM series s 
                    LEFT JOIN serie_items si ON s.id = si.serie_id 
                    WHERE s.date_creation BETWEEN :date_debut AND :date_fin";

            $stmtStats = $this->pdo->prepare($sqlStats);
            $stmtStats->execute([
                ':date_debut' => $dateDebut . ' 00:00:00',
                ':date_fin' => $dateFin . ' 23:59:59'
            ]);
            $stats = $stmtStats->fetch(PDO::FETCH_ASSOC);

            // Répartition par province
            $sqlProvinces = "SELECT 
                            p.nom as province_nom,
                            p.code as province_code,
                            COUNT(DISTINCT s.id) as total_series,
                            COUNT(si.id) as total_plaques
                        FROM series s 
                        LEFT JOIN serie_items si ON s.id = si.serie_id 
                        LEFT JOIN provinces p ON s.province_id = p.id
                        WHERE s.date_creation BETWEEN :date_debut AND :date_fin";

            if ($provinceId !== null) {
                $sqlProvinces .= " AND s.province_id = :province_id";
            }

            $sqlProvinces .= " GROUP BY p.id, p.nom, p.code ORDER BY p.nom ASC";

            $stmtProvinces = $this->pdo->prepare($sqlProvinces);
            $stmtProvinces->execute($params);
            $seriesParProvince = $stmtProvinces->fetchAll(PDO::FETCH_ASSOC);

            // Information de la province si filtrée
            $provinceInfo = null;
            if ($provinceId !== null) {
                $sqlProvince = "SELECT nom, code FROM provinces WHERE id = :province_id";
                $stmtProvince = $this->pdo->prepare($sqlProvince);
                $stmtProvince->execute([':province_id' => $provinceId]);
                $provinceInfo = $stmtProvince->fetch(PDO::FETCH_ASSOC);
            }

            return [
                "status" => "success",
                "data" => [
                    "periode_debut" => $dateDebut,
                    "periode_fin" => $dateFin,
                    "province_id" => $provinceId,
                    "province_nom" => $provinceInfo ? $provinceInfo['nom'] : null,
                    "total_series" => $stats['total_series'] ?? 0,
                    "series_actives" => $stats['series_actives'] ?? 0,
                    "series_inactives" => $stats['series_inactives'] ?? 0,
                    "total_plaques" => $stats['total_plaques'] ?? 0,
                    "plaques_disponibles" => $stats['plaques_disponibles'] ?? 0,
                    "plaques_utilisees" => $stats['plaques_utilisees'] ?? 0,
                    "series_par_province" => $seriesParProvince,
                    "details_series" => $detailsSeries
                ]
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la génération du rapport des séries: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Log une action dans le journal d'audit
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