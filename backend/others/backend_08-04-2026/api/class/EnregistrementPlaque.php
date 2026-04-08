<?php
require_once 'Connexion.php';

/**
 * Classe EnregistrementPlaque - Gestion de l'enregistrement des plaques
 */
class EnregistrementPlaque extends Connexion
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
            error_log("Erreur début transaction: " . $e->getMessage());
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
            error_log("Erreur commit: " . $e->getMessage());
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
            error_log("Erreur rollback: " . $e->getMessage());
            $this->transactionActive = false;
        }
    }
    
    /**
     * Enregistre une nouvelle plaque avec paiement
     */
    public function enregistrer($data)
    {
        try {
            $this->beginTransactionSafe();
            
            // 1. Récupérer ou créer l'assujetti
            $assujettiId = $this->getOrCreateAssujetti($data['assujetti'], $data['admin']);
            
            // 2. Vérifier si l'engin existe déjà
            $enginExiste = $this->verifierEnginExiste($data['engin']['plaque'], $data['admin']);
            
            if ($enginExiste) {
                // Engin existant, récupérer son ID
                $enginId = $this->getEnginIdByPlaque($data['engin']['plaque'], $data['admin']);
            } else {
                // Nouvel engin, récupérer les infos série et créer l'engin
                $enginId = $this->creerEngin($data['engin'], $assujettiId, $data['admin']);
            }
            
            // 3. Récupérer l'ID de la taxe Contrôle technique
            $taxeId = $this->getTaxeControleTechniqueId();
            
            // 4. Récupérer les infos utilisateur/site
            $userId = $_SESSION['user_id'] ?? 1;
            $siteId = $_SESSION['site_id'] ?? 1;
            
            // 5. Créer le paiement
            $paiementId = $this->creerPaiement(
                $data['paiement'],
                $enginId,
                $assujettiId,
                $taxeId,
                $data['admin']
            );
            
            // 6. Calculer la répartition des bénéficiaires
            $montantTotal = $data['paiement']['montant'];
            $resultRepartition = $this->calculerRepartitionBeneficiaires($paiementId, $montantTotal, $taxeId);

            // 7. Créer l'enregistrement dans la table controle_technique
            $controleTechniqueId = $this->creerControleTechnique($enginId, $assujettiId, $paiementId);
            
            $this->commitSafe();
            
            // Log d'audit
            $this->logAudit(
                "Enregistrement plaque " . $data['engin']['plaque'] . 
                " - Assujetti: " . $assujettiId . 
                " - Paiement: " . $paiementId
            );
            
            return [
                "status" => "success",
                "message" => "Enregistrement effectué avec succès",
                "data" => [
                    "assujetti_id" => $assujettiId,
                    "engin_id" => $enginId,
                    "paiement_id" => $paiementId,
                    "plaque" => $data['engin']['plaque'],
                    "repartition" => ($resultRepartition['status'] ?? '') === 'success' ? ($resultRepartition['data'] ?? null) : null
                ]
            ];
            
        } catch (Exception $e) {
            $this->rollbackSafe();
            error_log("Erreur enregistrement plaque: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "Erreur lors de l'enregistrement: " . $e->getMessage()
            ];
        }
    }
    
    /**
     * Calcule et enregistre la répartition pour les bénéficiaires
     */
    private function calculerRepartitionBeneficiaires($idPaiement, $montantTotal, $idImpot)
    {
        try {
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

            foreach ($beneficiaires as $beneficiaire) {
                $nouvellePart = $beneficiaire;

                if ($beneficiaire['type_part'] === 'pourcentage') {
                    $nouveauPourcentage = $beneficiaire['valeur_part'];
                    $nouvellePart['valeur_part_calculee'] = $nouveauPourcentage;
                    $nouvellePart['montant'] = ($montantTotal * $nouveauPourcentage) / 100;
                    $totalPourcentages += $nouveauPourcentage;
                } else {
                    $nouveauMontant = $beneficiaire['valeur_part'];
                    $nouvellePart['valeur_part_calculee'] = $nouveauMontant;
                    $nouvellePart['montant'] = $nouveauMontant;
                }

                $repartitions[] = $nouvellePart;
            }

            if ($totalPourcentages > 100) {
                foreach ($repartitions as &$repartition) {
                    if ($repartition['type_part'] === 'pourcentage') {
                        $repartition['valeur_part_calculee'] = ($repartition['valeur_part_calculee'] * 100) / $totalPourcentages;
                        $repartition['montant'] = ($montantTotal * $repartition['valeur_part_calculee']) / 100;
                    }
                }
            }

            foreach ($repartitions as $repartition) {
                $sqlInsert = "INSERT INTO repartition_paiements_immatriculation 
                         (id_paiement_immatriculation, beneficiaire_id, type_part, valeur_part_originale, 
                          valeur_part_calculee, montant, date_creation) 
                         VALUES 
                         (:id_paiement, :beneficiaire_id, :type_part, :valeur_part_originale, 
                          :valeur_part_calculee, :montant, NOW())";

                $stmtInsert = $this->pdo->prepare($sqlInsert);
                $stmtInsert->execute([
                    ':id_paiement' => $idPaiement,
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
     * Crée un enregistrement dans la table controle_technique
     */
    private function creerControleTechnique($enginId, $particulierId, $paiementId)
    {
        try {
            $sql = "INSERT INTO controle_technique (
                engin_id, particulier_id, paiement_id, date_creation, status
            ) VALUES (
                :engin_id, :particulier_id, :paiement_id, NOW(), 0
            )";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':engin_id' => $enginId,
                ':particulier_id' => $particulierId,
                ':paiement_id' => $paiementId
            ]);
            
            return $this->pdo->lastInsertId();
            
        } catch (Exception $e) {
            error_log("Erreur création enregistrement contrôle technique: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Récupère ou crée un assujetti
     */
    private function getOrCreateAssujetti($assujettiData, $adminData)
    {
        // Vérifier si l'assujetti existe déjà par téléphone
        if (!empty($assujettiData['telephone'])) {
            $sql = "SELECT id FROM particuliers WHERE telephone = :telephone LIMIT 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':telephone' => $assujettiData['telephone']]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                return $result['id'];
            }
        }
        
        // Extraire nom et prénom du nom_complet si nécessaire
        $nom = $assujettiData['nom'] ?? '';
        $prenom = $assujettiData['prenom'] ?? '';
        
        if (empty($nom) && isset($assujettiData['nom_complet'])) {
            $parts = explode(' ', $assujettiData['nom_complet'], 2);
            $nom = $parts[0] ?? '';
            $prenom = $parts[1] ?? '';
        }
        
        // Créer le nouvel assujetti
        $sql = "INSERT INTO particuliers (
            nom, prenom, telephone, rue, ville, province,
            actif, date_creation, utilisateur, site
        ) VALUES (
            :nom, :prenom, :telephone, :adresse, '', :province,
            1, NOW(), :utilisateur, :site
        )";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':nom' => $nom,
            ':prenom' => $prenom,
            ':telephone' => $assujettiData['telephone'] ?? '',
            ':adresse' => $assujettiData['adresse'] ?? '',
            ':province' => $adminData['province'] ?? '',
            ':utilisateur' => $adminData['id'] ?? '',
            ':site' => $adminData['site'] ?? ''
        ]);
        
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Vérifie si un engin existe déjà
     */
    private function verifierEnginExiste(string $plaque, array $adminData): bool
    {
        $sql = "
            SELECT COUNT(*) 
            FROM engins
            WHERE numero_plaque = :plaque
            AND site_id IN (
                SELECT id FROM sites WHERE province_id = :province_id
            )
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':plaque' => $plaque,
            ':province_id' => $adminData['province']
        ]);

        return $stmt->fetchColumn() > 0;
    }
    
    /**
     * Récupère l'ID d'un engin par sa plaque et la province de l'admin
     */
    private function getEnginIdByPlaque(string $plaque, array $adminData): ?int
    {
        $sql = "
            SELECT id 
            FROM engins 
            WHERE numero_plaque = :plaque
            AND site_id IN (
                SELECT id FROM sites WHERE province_id = :province_id
            )
            LIMIT 1
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':plaque' => $plaque,
            ':province_id' => $adminData['province']
        ]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ? (int) $result['id'] : null;
    }

    
    /**
     * Extrait les deux premières lettres d'une plaque
     */
    private function extractSerieFromPlaque($plaque)
    {
        // Supprimer les espaces et convertir en majuscules
        $plaque = strtoupper(trim($plaque));
        
        // Extraire les deux premières lettres (ex: XP002 -> XP)
        $serie = substr($plaque, 0, 2);
        
        // Vérifier que c'est bien 2 lettres
        if (preg_match('/^[A-Z]{2}$/', $serie)) {
            return $serie;
        }
        
        throw new Exception("Format de plaque invalide. Doit commencer par 2 lettres.");
    }
    
    /**
     * Extrait le numéro de la plaque (3 derniers chiffres)
     */
    private function extractNumeroFromPlaque($plaque)
    {
        // Supprimer les espaces
        $plaque = strtoupper(trim($plaque));
        
        // Extraire les 3 derniers chiffres (ex: XP002 -> 002)
        $numero = substr($plaque, 2, 3);
        
        // Vérifier que c'est bien 3 chiffres
        if (preg_match('/^[0-9]{3}$/', $numero)) {
            return (int)$numero; // Convertir en entier pour enlever les zéros devant
        }
        
        throw new Exception("Format de plaque invalide. Doit se terminer par 3 chiffres.");
    }
    
    /**
     * Récupère l'ID de la série à partir des deux premières lettres
     */
    private function getSerieIdByNom($nomSerie, $province)
    {
        $sql = "SELECT id FROM series WHERE nom_serie = :nom_serie AND actif = 1 AND province_id = :province_id LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':nom_serie' => $nomSerie, ':province_id' => $province]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            throw new Exception("Série '$nomSerie' non trouvée ou inactive");
        }
        
        return $result['id'];
    }
    
    /**
     * Récupère ou réserve un item de série
     */
    private function getOrReserveSerieItem($serieId, $numero)
    {
        // D'abord vérifier si l'item existe déjà avec ce numéro
        $sql = "SELECT id, statut FROM serie_items 
                WHERE serie_id = :serie_id AND value = :value LIMIT 1";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':serie_id' => $serieId,
            ':value' => $numero
        ]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            // Vérifier si l'item est déjà pris
            
            // Mettre à jour le statut à "pris"
            $sqlUpdate = "UPDATE serie_items SET statut = '1' WHERE id = :id";
            $stmtUpdate = $this->pdo->prepare($sqlUpdate);
            $stmtUpdate->execute([':id' => $result['id']]);
            
            return $result['id'];
        }
        
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Crée un nouvel engin
     */
    private function creerEngin($enginData, $assujettiId, $adminData)
    {
        $plaque = $enginData['plaque'];
        
        // 1. Extraire la série et le numéro de la plaque
        $nomSerie = $this->extractSerieFromPlaque($plaque);
        $numero = $this->extractNumeroFromPlaque($plaque);
        
        // 2. Récupérer l'ID de la série
        $serieId = $this->getSerieIdByNom($nomSerie, $adminData['province']);
        
        // 3. Récupérer ou réserver l'item de série
        $serieItemId = $this->getOrReserveSerieItem($serieId, $numero);
        
        // 4. Récupérer l'ID de la taxe
        $taxeId = $this->getTaxeControleTechniqueId();
        
        // 5. Insérer l'engin
        $sql = "INSERT INTO engins (
            particulier_id, serie_id, serie_item_id, numero_plaque,
            type_engin, marque, energie, annee_fabrication,
            annee_circulation, couleur, puissance_fiscal,
            usage_engin, numero_chassis, numero_moteur,
            impot_id, utilisateur_id, site_id, date_creation
        ) VALUES (
            :particulier_id, :serie_id, :serie_item_id, :numero_plaque,
            :type_engin, :marque, :energie, :annee_fabrication,
            :annee_circulation, :couleur, :puissance_fiscal,
            :usage_engin, :numero_chassis, :numero_moteur,
            :impot_id, :utilisateur_id, :site_id, NOW()
        )";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':particulier_id' => $assujettiId,
            ':serie_id' => $serieId,
            ':serie_item_id' => $serieItemId,
            ':numero_plaque' => $plaque,
            ':type_engin' => $enginData['type'] ?? '',
            ':marque' => $enginData['marque'] ?? '',
            ':energie' => $enginData['energie'] ?? '',
            ':annee_fabrication' => $enginData['anneeFabrication'] ?? null,
            ':annee_circulation' => $enginData['anneeCirculation'] ?? null,
            ':couleur' => $enginData['couleur'] ?? '',
            ':puissance_fiscal' => $enginData['puissanceFiscale'] ?? '',
            ':usage_engin' => $enginData['usage'] ?? '',
            ':numero_chassis' => $enginData['numeroChassis'] ?? '',
            ':numero_moteur' => $enginData['numeroMoteur'] ?? '',
            ':impot_id' => $taxeId,
            ':utilisateur_id' => $adminData['id'],
            ':site_id' => $adminData['site']
        ]);
        
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Récupère l'ID de la taxe Contrôle technique
     */
    private function getTaxeControleTechniqueId()
    {
        $sql = "SELECT id FROM impots WHERE id = 18 AND actif = 1 LIMIT 1";
        $stmt = $this->pdo->query($sql);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ? $result['id'] : 18; // ID par défaut
    }
    
    /**
     * Crée un paiement
     */
    private function creerPaiement($paiementData, $enginId, $assujettiId, $taxeId, $adminData)
    {
        $sql = "INSERT INTO paiements_immatriculation (
            engin_id, particulier_id, montant, montant_initial,
            impot_id, mode_paiement, operateur, numero_transaction,
            statut, date_paiement, utilisateur_id, site_id,
            nombre_plaques, etat
        ) VALUES (
            :engin_id, :particulier_id, :montant, :montant_initial,
            :impot_id, :mode_paiement, :operateur, :numero_transaction,
            'completed', NOW(), :utilisateur_id, :site_id,
            1, 1
        )";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':engin_id' => $enginId,
            ':particulier_id' => $assujettiId,
            ':montant' => $paiementData['montant'],
            ':montant_initial' => $paiementData['montant'],
            ':impot_id' => $taxeId,
            ':mode_paiement' => $paiementData['mode'] ?? 'espece',
            ':operateur' => $paiementData['operateur'] ?? null,
            ':numero_transaction' => $paiementData['numeroTransaction'] ?? null,
            ':utilisateur_id' => $adminData['id'],
            ':site_id' => $adminData['site']
        ]);
        
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Log d'audit
     */
    private function logAudit($message)
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
    
    /**
     * Destructeur
     */
    public function __destruct()
    {
        if ($this->transactionActive) {
            error_log("ATTENTION: Transaction toujours active à la destruction");
            $this->rollbackSafe();
        }
    }
}