<?php
require_once 'Connexion.php';

/**
 * Classe Paiement - Gestion complète des paiements d'immatriculation
 * 
 * Cette classe étend la classe Connexion et fournit toutes les fonctionnalités
 * de gestion des paiements pour l'impôt ID 18
 */
class Paiement extends Connexion
{
    /**
     * Récupère les 10 derniers paiements pour l'impôt ID 18
     *
     * @param string $searchTerm Terme de recherche optionnel
     * @return array Tableau avec statut et données des paiements
     */
    public function getDerniersPaiements($searchTerm = '')
    {
        try {
            $sql = "SELECT 
                    p.id,
                    p.mode_paiement,
                    p.montant,
                    p.statut,
                    DATE_FORMAT(p.date_paiement, '%d/%m/%Y') as date_paiement,
                    DATE_FORMAT(p.date_paiement, '%H:%i') as heure_paiement,
                    CONCAT('PAY-', YEAR(p.date_paiement), '-', LPAD(p.id, 3, '0')) as reference,
                    p.operateur,
                    p.numero_transaction,
                    p.numero_cheque,
                    p.banque,
                    p.utilisateur_id,
                    p.site_id,
                    
                    -- Informations particuliers
                    part.id as particulier_id,
                    part.nom,
                    part.prenom,
                    part.telephone,
                    CONCAT(part.rue, ', ', part.ville, ', ', part.province) as adresse,
                    part.email,
                    part.nif,
                    
                    -- Informations engins
                    e.id as engin_id,
                    e.numero_plaque,
                    e.type_engin,
                    e.marque,
                    '' as modele,
                    e.energie,
                    YEAR(e.annee_fabrication) as annee_fabrication,
                    e.couleur,
                    e.puissance_fiscal,
                    e.usage_engin,
                    e.numero_chassis,
                    e.numero_moteur
                    
                FROM paiements_immatriculation p
                INNER JOIN particuliers part ON p.particulier_id = part.id
                LEFT JOIN engins e ON p.engin_id = e.id
                WHERE p.impot_id = 18
                AND p.statut = 'completed'
                AND p.mode_paiement = 'espece'";
            
            $params = [];
            
            // Ajout du filtre de recherche si fourni
            if (!empty($searchTerm)) {
                $sql .= " AND (
                    CONCAT('PAY-', YEAR(p.date_paiement), '-', LPAD(p.id, 3, '0')) LIKE :search
                    OR part.nom LIKE :search
                    OR part.prenom LIKE :search
                    OR e.numero_plaque LIKE :search
                    OR e.marque LIKE :search
                    OR e.modele LIKE :search
                )";
                $params[':search'] = '%' . $searchTerm . '%';
            }
            
            $sql .= " ORDER BY p.date_paiement DESC LIMIT 10";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Formater les données pour le frontend
            $formattedResults = array_map(function($row) {
                return [
                    'id' => $row['id'],
                    'numero' => $row['reference'],
                    'date' => $row['date_paiement'],
                    'heure' => $row['heure_paiement'],
                    'montantUSD' => 10, // Valeur fixe pour l'impôt 18
                    'montantCDF' => (float)$row['montant'],
                    'modePaiement' => $this->formatModePaiement($row['mode_paiement']),
                    'statut' => $this->formatStatut($row['statut']),
                    'assujettiId' => $row['particulier_id'],
                    'enginId' => $row['engin_id'],
                    'assujetti' => [
                        'id' => $row['particulier_id'],
                        'nom' => $row['nom'],
                        'prenom' => $row['prenom'],
                        'telephone' => $row['telephone'],
                        'adresse' => $row['adresse'],
                        'email' => $row['email'],
                        'nif' => $row['nif']
                    ],
                    'engin' => [
                        'id' => $row['engin_id'],
                        'plaque' => $row['numero_plaque'],
                        'type' => $row['type_engin'],
                        'marque' => $row['marque'],
                        'modele' => $row['modele'],
                        'energie' => $row['energie'],
                        'anneeFabrication' => $row['annee_fabrication'],
                        'couleur' => $row['couleur'],
                        'puissanceFiscale' => $row['puissance_fiscal'],
                        'usageEngin' => $row['usage_engin']
                    ]
                ];
            }, $resultats);
            
            return [
                "status" => "success", 
                "data" => $formattedResults,
                "total" => count($formattedResults)
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération des paiements: " . $e->getMessage());
            return [
                "status" => "error", 
                "message" => "Erreur système: " . $e->getMessage()
            ];
        }
    }

    /**
     * Récupère un paiement spécifique par son ID
     *
     * @param int $id ID du paiement
     * @return array Tableau avec statut et données du paiement
     */
    public function getPaiementById($id)
    {
        try {
            $sql = "SELECT 
                    p.id,
                    p.mode_paiement,
                    p.montant,
                    p.statut,
                    DATE_FORMAT(p.date_paiement, '%d/%m/%Y') as date_paiement,
                    DATE_FORMAT(p.date_paiement, '%H:%i') as heure_paiement,
                    CONCAT('PAY-', YEAR(p.date_paiement), '-', LPAD(p.id, 3, '0')) as reference,
                    p.operateur,
                    p.numero_transaction,
                    p.numero_cheque,
                    p.banque,
                    p.utilisateur_id,
                    p.site_id,
                    p.nombre_plaques,
                    
                    -- Informations particuliers
                    part.id as particulier_id,
                    part.nom,
                    part.prenom,
                    part.telephone,
                    CONCAT(part.rue, ', ', part.ville, ', ', part.province) as adresse,
                    part.email,
                    part.nif,
                    part.date_naissance,
                    DATE_FORMAT(part.date_naissance, '%d/%m/%Y') as date_naissance_formatee,
                    part.lieu_naissance,
                    part.sexe,
                    part.code_postal,
                    part.situation_familiale,
                    part.dependants,
                    
                    -- Informations engins
                    e.id as engin_id,
                    e.numero_plaque,
                    e.type_engin,
                    e.marque,
                    e.modele,
                    e.energie,
                    YEAR(e.annee_fabrication) as annee_fabrication,
                    YEAR(e.annee_circulation) as annee_circulation,
                    e.couleur,
                    e.puissance_fiscal,
                    e.usage_engin,
                    e.numero_chassis,
                    e.numero_moteur
                    
                FROM paiements_immatriculation p
                INNER JOIN particuliers part ON p.particulier_id = part.id
                LEFT JOIN engins e ON p.engin_id = e.id
                WHERE p.id = :id
                AND p.impot_id = 18";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);
            
            $paiement = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$paiement) {
                return [
                    "status" => "error", 
                    "message" => "Paiement non trouvé"
                ];
            }
            
            // Formater les données
            $formattedPaiement = [
                'id' => $paiement['id'],
                'numero' => $paiement['reference'],
                'date' => $paiement['date_paiement'],
                'heure' => $paiement['heure_paiement'],
                'montantUSD' => 10,
                'montantCDF' => (float)$paiement['montant'],
                'modePaiement' => $this->formatModePaiement($paiement['mode_paiement']),
                'statut' => $this->formatStatut($paiement['statut']),
                'operateur' => $paiement['operateur'],
                'numeroTransaction' => $paiement['numero_transaction'],
                'banque' => $paiement['banque'],
                'nombrePlaques' => $paiement['nombre_plaques'],
                'utilisateurId' => $paiement['utilisateur_id'],
                'siteId' => $paiement['site_id'],
                'assujetti' => [
                    'id' => $paiement['particulier_id'],
                    'nom' => $paiement['nom'],
                    'prenom' => $paiement['prenom'],
                    'telephone' => $paiement['telephone'],
                    'adresse' => $paiement['adresse'],
                    'email' => $paiement['email'],
                    'nif' => $paiement['nif'],
                    'dateNaissance' => $paiement['date_naissance_formatee'],
                    'lieuNaissance' => $paiement['lieu_naissance'],
                    'sexe' => $paiement['sexe'],
                    'codePostal' => $paiement['code_postal'],
                    'situationFamiliale' => $paiement['situation_familiale'],
                    'dependants' => $paiement['dependants']
                ],
                'engin' => [
                    'id' => $paiement['engin_id'],
                    'plaque' => $paiement['numero_plaque'],
                    'type' => $paiement['type_engin'],
                    'marque' => $paiement['marque'],
                    'modele' => $paiement['modele'],
                    'energie' => $paiement['energie'],
                    'anneeFabrication' => $paiement['annee_fabrication'],
                    'anneeCirculation' => $paiement['annee_circulation'],
                    'couleur' => $paiement['couleur'],
                    'puissanceFiscale' => $paiement['puissance_fiscal'],
                    'usageEngin' => $paiement['usage_engin'],
                    'numeroChassis' => $paiement['numero_chassis'],
                    'numeroMoteur' => $paiement['numero_moteur']
                ]
            ];
            
            return [
                "status" => "success", 
                "data" => $formattedPaiement
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération du paiement: " . $e->getMessage());
            return [
                "status" => "error", 
                "message" => "Erreur système: " . $e->getMessage()
            ];
        }
    }


    /**
     * Récupère les détails complets d'un paiement pour générer une quittance
     *
     * @param int $id ID du paiement
     * @return array Tableau avec statut et données complètes du paiement
     */
    public function getPaiementQuittance($id)
    {
        try {
            $sql = "SELECT 
                    p.id,
                    p.mode_paiement,
                    p.montant,
                    p.statut,
                    DATE_FORMAT(p.date_paiement, '%d/%m/%Y %H:%i') as date_paiement_complete,
                    DATE_FORMAT(p.date_paiement, '%d/%m/%Y') as date_paiement,
                    DATE_FORMAT(p.date_paiement, '%H:%i') as heure_paiement,
                    DATE_ADD(p.date_paiement, INTERVAL 72 HOUR) as date_expiration,
                    CONCAT('PAY-', YEAR(p.date_paiement), '-', LPAD(p.id, 6, '0')) as reference,
                    p.operateur,
                    p.numero_transaction,
                    p.numero_cheque,
                    p.banque,
                    p.utilisateur_id,
                    p.site_id,
                    p.nombre_plaques,
                    p.impot_id,
                    
                    -- Informations particuliers
                    part.id as particulier_id,
                    part.nom,
                    part.prenom,
                    part.telephone,
                    CONCAT(part.rue, ', ', part.ville, ', ', part.province) as adresse,
                    part.email,
                    part.nif,
                    part.date_naissance,
                    DATE_FORMAT(part.date_naissance, '%d/%m/%Y') as date_naissance_formatee,
                    part.lieu_naissance,
                    part.sexe,
                    part.code_postal,
                    part.situation_familiale,
                    part.dependants,
                    
                    -- Informations engins
                    e.id as engin_id,
                    e.numero_plaque,
                    e.type_engin,
                    e.marque,
                    '' as modele,
                    e.energie,
                    YEAR(e.annee_fabrication) as annee_fabrication,
                    YEAR(e.annee_circulation) as annee_circulation,
                    e.couleur,
                    e.puissance_fiscal,
                    e.usage_engin,
                    e.numero_chassis,
                    e.numero_moteur,
                    e.serie_id,
                    e.serie_item_id,
                    
                    -- Informations impot (taxe)
                    i.nom as impot_nom,
                    i.description as impot_description,
                    i.prix as prix_usd,
                    '' as prix_cdf
                    
                FROM paiements_immatriculation p
                INNER JOIN particuliers part ON p.particulier_id = part.id
                LEFT JOIN engins e ON p.engin_id = e.id
                LEFT JOIN impots i ON p.impot_id = i.id
                WHERE p.id = :id
                AND p.impot_id = 18
                AND p.statut = 'completed'";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $id]);
            
            $paiement = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$paiement) {
                return [
                    "status" => "error", 
                    "message" => "Paiement non trouvé ou non éligible pour la quittance"
                ];
            }
            
            // Formater les données pour la quittance
            $formattedPaiement = [
                'id' => $paiement['id'],
                'reference' => $paiement['reference'],
                'date_paiement' => $paiement['date_paiement'],
                'heure_paiement' => $paiement['heure_paiement'],
                'date_paiement_complete' => $paiement['date_paiement_complete'],
                'date_expiration' => $paiement['date_expiration'],
                'montantUSD' => $paiement['prix_usd'] ?? 10,
                'montantCDF' => (float)$paiement['montant'],
                'modePaiement' => $this->formatModePaiement($paiement['mode_paiement']),
                'statut' => $this->formatStatut($paiement['statut']),
                'nombrePlaques' => $paiement['nombre_plaques'],
                'impot' => [
                    'nom' => $paiement['impot_nom'],
                    'description' => $paiement['impot_description']
                ],
                'assujetti' => [
                    'id' => $paiement['particulier_id'],
                    'nom' => $paiement['nom'],
                    'prenom' => $paiement['prenom'],
                    'telephone' => $paiement['telephone'],
                    'adresse' => $paiement['adresse'],
                    'email' => $paiement['email'],
                    'nif' => $paiement['nif'],
                    'dateNaissance' => $paiement['date_naissance_formatee'],
                    'lieuNaissance' => $paiement['lieu_naissance'],
                    'sexe' => $paiement['sexe']
                ],
                'engin' => [
                    'id' => $paiement['engin_id'],
                    'plaque' => $paiement['numero_plaque'],
                    'type' => $paiement['type_engin'],
                    'marque' => $paiement['marque'],
                    'modele' => $paiement['modele'],
                    'energie' => $paiement['energie'],
                    'anneeFabrication' => $paiement['annee_fabrication'],
                    'anneeCirculation' => $paiement['annee_circulation'],
                    'couleur' => $paiement['couleur'],
                    'puissanceFiscale' => $paiement['puissance_fiscal'],
                    'usageEngin' => $paiement['usage_engin'],
                    'numeroChassis' => $paiement['numero_chassis'],
                    'numeroMoteur' => $paiement['numero_moteur']
                ]
            ];
            
            return [
                "status" => "success", 
                "data" => $formattedPaiement
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de la récupération de la quittance: " . $e->getMessage());
            return [
                "status" => "error", 
                "message" => "Erreur système: " . $e->getMessage()
            ];
        }
    }

    /**
     * Formate le mode de paiement pour l'affichage
     *
     * @param string $mode Mode de paiement brut
     * @return string Mode de paiement formaté
     */
    private function formatModePaiement($mode)
    {
        $modes = [
            'espece' => 'Espèces',
            'mobile_money' => 'Mobile Money',
            'cheque' => 'Chèque',
            'banque' => 'Banque'
        ];
        
        return $modes[$mode] ?? $mode;
    }

    /**
     * Formate le statut pour l'affichage
     *
     * @param string $statut Statut brut
     * @return string Statut formaté
     */
    private function formatStatut($statut)
    {
        $statuts = [
            'completed' => 'payé',
            'pending' => 'en attente',
            'failed' => 'annulé'
        ];
        
        return $statuts[$statut] ?? $statut;
    }

    /**
     * Log une action dans le journal d'audit
     *
     * @param string $message Message à logger
     * @return void
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
}