<?php
require_once 'Connexion.php';

/**
 * Classe DeclarationPaymentAPI - Gestion des déclarations et paiements
 * Version: 1.0 - Intégration complète avec les tables existantes
 */
class DeclarationPaymentAPI extends Connexion
{
    private $apiConfig;
    private $bankData;
    
    public function __construct() {
        parent::__construct();
    }
    
    /**
     * Charge la configuration bancaire depuis la BDD
     */
    private function loadBankConfig($bankId) {
        try {
            $sql = "SELECT bp.*, p.nom as partenaire_nom, p.base_url_api, p.timeout_api, p.retry_attempts,
                           p.raison_sociale, p.email AS contact_email, p.telephone AS contact_telephone
                    FROM banques_partenaire bp
                    JOIN partenaires p ON bp.partenaire_id = p.id
                    WHERE bp.bank_id = :bank_id AND bp.actif = 1";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':bank_id' => $bankId]);
            $this->bankData = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$this->bankData) {
                throw new Exception("Banque non configurée ou inactive");
            }
            
            $this->apiConfig = [
                'base_url' => $this->bankData['base_url_api'] ?? 'https://api.banque.com/v1',
                'timeout' => $this->bankData['timeout_api'] ?? 30,
                'max_retries' => $this->bankData['retry_attempts'] ?? 3,
                'webhook_url' => $this->bankData['url_webhook_confirmation'],
                'webhook_secret' => $this->bankData['secret_webhook'],
                'frais_percentage' => 0.5,
                'frais_minimum' => 100,
                'devise' => 'USD',
                'limite_journaliere' => $this->bankData['limite_transaction_journaliere'] ?? 10000000,
                'limite_mensuelle' => $this->bankData['limite_transaction_mensuelle'] ?? 100000000,
                'montant_minimum' => $this->bankData['montant_minimum'] ?? 100,
                'montant_maximum' => $this->bankData['montant_maximum'] ?? 5000000,
                'bank_info' => $this->bankData
            ];
            
        } catch (Exception $e) {
            error_log("Erreur chargement config banque $bankId: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Authentifie une banque via API Key
     */
    public function authenticateBank($bankId, $apiKey) {
        try {
            $sql = "SELECT bp.*, p.nom as partenaire_nom, p.raison_sociale,
                           p.email AS contact_email, p.telephone AS contact_telephone 
                    FROM banques_partenaire bp
                    JOIN partenaires p ON bp.partenaire_id = p.id
                    WHERE bp.bank_id = :bank_id 
                    AND bp.api_key = :api_key 
                    AND bp.actif = 1 
                    AND bp.suspendu = 0
                    AND (bp.date_expiration IS NULL OR bp.date_expiration > NOW())";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':bank_id' => $bankId,
                ':api_key' => $apiKey
                // ':api_key' => hash('sha256', $apiKey)
            ]);
            
            $banque = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$banque) {
                error_log("Échec authentification - BankID: $bankId");
                return [
                    "status" => "error",
                    "code" => "AUTH_FAILED",
                    "message" => "Authentification échouée: Identifiants invalides, compte suspendu ou expiré"
                ];
            }
            
            // Vérifier les permissions
            $permissions = json_decode($banque['permissions'] ?? '["process_payments"]', true);
            if (!$this->checkPermissions($permissions, ['process_payments'])) {
                return [
                    "status" => "error",
                    "code" => "INSUFFICIENT_PERMISSIONS",
                    "message" => "Permissions insuffisantes pour traiter les paiements"
                ];
            }
            
            // Charger la configuration de cette banque
            $this->loadBankConfig($bankId);
            
            // Vérifier les limites
            $checkLimits = $this->checkTransactionLimits($banque['id']);
            if ($checkLimits !== true) {
                return $checkLimits;
            }
            
            // Enregistrer la connexion
            $this->enregistrerConnexion($banque['id']);
            
            // Mettre à jour le dernier accès
            $this->updateLastAccess($banque['id']);
            
            error_log("Authentification réussie - Bank: " . $banque['partenaire_nom']);
            
            return [
                "status" => "success",
                "message" => "Authentification réussie",
                "data" => [
                    "bank_name" => $banque['partenaire_nom'],
                    "bank_id" => $banque['bank_id'],
                    "permissions" => $permissions,
                    "limits" => [
                        "daily" => $this->apiConfig['limite_journaliere'],
                        "monthly" => $this->apiConfig['limite_mensuelle'],
                        "min_amount" => $this->apiConfig['montant_minimum'],
                        "max_amount" => $this->apiConfig['montant_maximum']
                    ]
                ]
            ];
            
        } catch (Exception $e) {
            error_log("Erreur authentification banque: " . $e->getMessage());
            return [
                "status" => "error",
                "code" => "AUTH_ERROR",
                "message" => "Erreur technique lors de l'authentification"
            ];
        }
    }
    
    /**
     * Récupère les informations d'une déclaration avec calcul des pénalités
     */
    public function getDeclarationInfo($referenceDeclaration) {
        try {
            // Récupérer la déclaration
            $sql = "SELECT d.*, i.nom as impot_nom, i.description, i.periode, i.delai_accord, i.penalites
                    FROM declarations d
                    JOIN impots i ON d.id_impot = i.id
                    WHERE d.reference = :reference";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':reference' => $referenceDeclaration]);
            $declaration = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$declaration) {
                return [
                    "status" => "error",
                    "code" => "DECLARATION_NOT_FOUND",
                    "message" => "Déclaration non trouvée"
                ];
            }
            
            // Calculer les pénalités
            $penalite = $this->calculerPenalite($declaration);
            $montantTotal = $declaration['montant'] + $penalite['montant_penalite'];
            
            // Récupérer les informations du contribuable
            $contribuable = $this->getContribuableInfo($declaration['nif_contribuable'], $declaration['type_contribuable']);
            
            if (!$contribuable) {
                return [
                    "status" => "error",
                    "code" => "CONTRIBUABLE_NOT_FOUND",
                    "message" => "Contribuable non trouvé"
                ];
            }
            
            return [
                "status" => "success",
                "message" => "Déclaration récupérée avec succès",
                "data" => [
                    "declaration" => [
                        "id" => $declaration['id'],
                        "reference" => $declaration['reference'],
                        "nif_contribuable" => $declaration['nif_contribuable'],
                        "type_contribuable" => $declaration['type_contribuable'],
                        "montant_base" => $declaration['montant'],
                        "penalite" => $penalite,
                        "montant_total" => $montantTotal,
                        "statut" => $declaration['statut'],
                        "date_creation" => $declaration['date_creation'],
                        "donnees_json" => json_decode($declaration['donnees_json'], true)
                    ],
                    "impot" => [
                        "nom" => $declaration['impot_nom'],
                        "description" => $declaration['description'],
                        "periode" => $declaration['periode'],
                        "delai_accord" => $declaration['delai_accord'],
                        "penalites" => $declaration['penalites']
                    ],
                    "contribuable" => $contribuable
                ]
            ];
            
        } catch (Exception $e) {
            error_log("Erreur récupération déclaration: " . $e->getMessage());
            return [
                "status" => "error",
                "code" => "SYSTEM_ERROR",
                "message" => "Erreur système lors de la récupération de la déclaration"
            ];
        }
    }
    
    /**
     * Calcule les pénalités pour une déclaration
     */
    private function calculerPenalite($declaration) {
        $dateCreation = new DateTime($declaration['date_creation']);
        $dateLimite = clone $dateCreation;
        $dateLimite->modify('+' . $declaration['delai_accord'] . ' days');
        $dateActuelle = new DateTime();
        
        $penaliteConfig = json_decode($declaration['penalites'], true);
        $montantPenalite = 0;
        $en_retard = false;
        
        if ($dateActuelle > $dateLimite) {
            $en_retard = true;
            $joursRetard = $dateActuelle->diff($dateLimite)->days;
            
            if ($penaliteConfig['type'] === 'pourcentage') {
                $montantPenalite = $declaration['montant'] * ($penaliteConfig['valeur'] / 100);
            } elseif ($penaliteConfig['type'] === 'fixe') {
                $montantPenalite = $penaliteConfig['valeur'];
            }
        }
        
        return [
            "en_retard" => $en_retard,
            "jours_retard" => $en_retard ? $joursRetard : 0,
            "type_penalite" => $penaliteConfig['type'] ?? 'aucune',
            "valeur_penalite" => $penaliteConfig['valeur'] ?? 0,
            "montant_penalite" => $montantPenalite,
            "date_limite" => $dateLimite->format('Y-m-d H:i:s')
        ];
    }
    
    /**
     * Récupère les informations du contribuable
     */
    private function getContribuableInfo($nif, $type) {
        try {
            if ($type === 'entreprise') {
                $sql = "SELECT id, raison_sociale, forme_juridique, nif, registre_commerce, 
                               date_creation, adresse_siege, telephone, email, representant_legal
                        FROM entreprises 
                        WHERE nif = :nif AND actif = 1";
            } else {
                $sql = "SELECT id, nom, prenom, date_naissance, lieu_naissance, sexe, 
                               rue, ville, code_postal, province, id_national, telephone, email, nif,
                               situation_familiale, dependants
                        FROM particuliers 
                        WHERE nif = :nif AND actif = 1";
            }
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':nif' => $nif]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            error_log("Erreur récupération contribuable: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Traite un paiement
     */
    public function traiterPaiement($referenceDeclaration, $methodePaiement, $bankId) {
        try {
            // Récupérer les infos de la déclaration
            $declarationInfo = $this->getDeclarationInfo($referenceDeclaration);
            
            if ($declarationInfo['status'] !== 'success') {
                return $declarationInfo;
            }
            
            $data = $declarationInfo['data'];
            
            // Vérifier si la déclaration est déjà payée
            if ($data['declaration']['statut'] === 'payé') {
                return [
                    "status" => "error",
                    "code" => "ALREADY_PAID",
                    "message" => "Cette déclaration a déjà été payée"
                ];
            }
            
            // Vérifier si la déclaration est rejetée
            if ($data['declaration']['statut'] === 'rejeté') {
                return [
                    "status" => "error",
                    "code" => "DECLARATION_REJECTED",
                    "message" => "Cette déclaration a été rejetée"
                ];
            }
            
            // Insérer dans la table paiements
            $idPaiement = $this->creerPaiement($data['declaration']['id'], $methodePaiement, $data['declaration']['montant_total']);
            
            if (!$idPaiement) {
                return [
                    "status" => "error",
                    "code" => "PAYMENT_CREATION_FAILED",
                    "message" => "Échec de la création du paiement"
                ];
            }
            
            // Insérer dans la table paiements_bancaires
            $referenceBancaire = $this->genererReferenceBancaire();
            $idPaiementBancaire = $this->creerPaiementBancaire($data['declaration']['id'], $bankId, $referenceBancaire);
            
            if (!$idPaiementBancaire) {
                return [
                    "status" => "error",
                    "code" => "BANK_PAYMENT_CREATION_FAILED",
                    "message" => "Échec de la création du paiement bancaire"
                ];
            }
            
            return [
                "status" => "success",
                "message" => "Paiement traité avec succès",
                "data" => [
                    "paiement_id" => $idPaiement,
                    "paiement_bancaire_id" => $idPaiementBancaire,
                    "reference_bancaire" => $referenceBancaire,
                    "declaration" => $data['declaration'],
                    "impot" => $data['impot'],
                    "contribuable" => $data['contribuable'],
                    "banque" => [
                        "bank_id" => $bankId,
                        "nom" => $this->bankData['partenaire_nom'] ?? 'Banque Partenaire'
                    ]
                ]
            ];
            
        } catch (Exception $e) {
            error_log("Erreur traitement paiement: " . $e->getMessage());
            return [
                "status" => "error",
                "code" => "PAYMENT_PROCESSING_ERROR",
                "message" => "Erreur lors du traitement du paiement"
            ];
        }
    }
    
    /**
     * Annule une déclaration et ses paiements associés
     */
    public function annulerDeclaration($referenceDeclaration) {
        try {
            // Récupérer la déclaration
            $sql = "SELECT d.id, d.statut, pb.id as id_paiement_bancaire, p.id as id_paiement
                    FROM declarations d
                    LEFT JOIN paiements_bancaires pb ON d.id = pb.id_declaration
                    LEFT JOIN paiements p ON d.id = p.id_declaration
                    WHERE d.reference = :reference";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':reference' => $referenceDeclaration]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$result) {
                return [
                    "status" => "error",
                    "code" => "DECLARATION_NOT_FOUND",
                    "message" => "Déclaration non trouvée"
                ];
            }
            
            // Vérifier si la déclaration peut être annulée
            if ($result['statut'] !== 'en_attente') {
                return [
                    "status" => "error",
                    "code" => "CANNOT_CANCEL",
                    "message" => "Seules les déclarations en attente peuvent être annulées"
                ];
            }
            
            // Démarrer une transaction
            $this->pdo->beginTransaction();
            
            try {
                // Supprimer le paiement bancaire
                if ($result['id_paiement_bancaire']) {
                    $sql = "DELETE FROM paiements_bancaires WHERE id = :id";
                    $stmt = $this->pdo->prepare($sql);
                    $stmt->execute([':id' => $result['id_paiement_bancaire']]);
                }
                
                // Supprimer le paiement
                if ($result['id_paiement']) {
                    $sql = "DELETE FROM paiements WHERE id = :id";
                    $stmt = $this->pdo->prepare($sql);
                    $stmt->execute([':id' => $result['id_paiement']]);
                }
                
                // Mettre à jour le statut de la déclaration
                $sql = "UPDATE declarations SET statut = 'rejeté', date_modification = NOW() WHERE id = :id";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([':id' => $result['id']]);
                
                $this->pdo->commit();
                
                return [
                    "status" => "success",
                    "message" => "Déclaration annulée avec succès",
                    "data" => [
                        "declaration_id" => $result['id'],
                        "reference" => $referenceDeclaration,
                        "nouveau_statut" => "rejeté"
                    ]
                ];
                
            } catch (Exception $e) {
                $this->pdo->rollBack();
                throw $e;
            }
            
        } catch (Exception $e) {
            error_log("Erreur annulation déclaration: " . $e->getMessage());
            return [
                "status" => "error",
                "code" => "CANCELLATION_ERROR",
                "message" => "Erreur lors de l'annulation de la déclaration"
            ];
        }
    }
    
    // =========================================================================
    // MÉTHODES UTILITAIRES
    // =========================================================================
    
    private function creerPaiement($idDeclaration, $methodePaiement, $montant) {
        try {
            $referencePaiement = 'PAY' . date('YmdHis') . rand(1000, 9999);
            
            $sql = "INSERT INTO paiements 
                    (id_declaration, methode_paiement, reference_paiement, montant, statut, date_creation)
                    VALUES 
                    (:id_declaration, :methode_paiement, :reference_paiement, :montant, 'en_attente', NOW())";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':id_declaration' => $idDeclaration,
                ':methode_paiement' => $methodePaiement,
                ':reference_paiement' => $referencePaiement,
                ':montant' => $montant
            ]);
            
            return $this->pdo->lastInsertId();
            
        } catch (Exception $e) {
            error_log("Erreur création paiement: " . $e->getMessage());
            return false;
        }
    }
    
    private function creerPaiementBancaire($idDeclaration, $bankId, $referenceBancaire) {
        try {
            $sql = "INSERT INTO paiements_bancaires 
                    (id_declaration, bank_id, reference_bancaire, statut, date_creation)
                    VALUES 
                    (:id_declaration, :bank_id, :reference_bancaire, 'initie', NOW())";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':id_declaration' => $idDeclaration,
                ':bank_id' => $bankId,
                ':reference_bancaire' => $referenceBancaire
            ]);
            
            return $this->pdo->lastInsertId();
            
        } catch (Exception $e) {
            error_log("Erreur création paiement bancaire: " . $e->getMessage());
            return false;
        }
    }
    
    private function genererReferenceBancaire() {
        return 'BANK' . date('YmdHis') . rand(1000, 9999);
    }
    
    private function checkPermissions($permissions, $required) {
        foreach ($required as $permission) {
            if (!in_array($permission, $permissions)) {
                return false;
            }
        }
        return true;
    }
    
    private function checkTransactionLimits($banqueId) {
        try {
            // Vérifier limite journalière
            $sqlDaily = "SELECT COALESCE(SUM(montant), 0) as total_journalier 
                        FROM paiements_bancaires pb
                        JOIN declarations d ON pb.id_declaration = d.id
                        WHERE pb.bank_id = :bank_id 
                        AND DATE(pb.date_creation) = CURDATE() 
                        AND pb.statut = 'complete'";
            
            $stmt = $this->pdo->prepare($sqlDaily);
            $stmt->execute([':bank_id' => $this->bankData['bank_id']]);
            $dailyTotal = $stmt->fetch(PDO::FETCH_ASSOC)['total_journalier'];
            
            if ($dailyTotal >= $this->apiConfig['limite_journaliere']) {
                return [
                    "status" => "error",
                    "code" => "DAILY_LIMIT_EXCEEDED",
                    "message" => "Limite journalière de transactions atteinte"
                ];
            }
            
            // Vérifier limite mensuelle
            $sqlMonthly = "SELECT COALESCE(SUM(montant), 0) as total_mensuel 
                          FROM paiements_bancaires pb
                          JOIN declarations d ON pb.id_declaration = d.id
                          WHERE pb.bank_id = :bank_id 
                          AND YEAR(pb.date_creation) = YEAR(CURDATE()) 
                          AND MONTH(pb.date_creation) = MONTH(CURDATE())
                          AND pb.statut = 'complete'";
            
            $stmt = $this->pdo->prepare($sqlMonthly);
            $stmt->execute([':bank_id' => $this->bankData['bank_id']]);
            $monthlyTotal = $stmt->fetch(PDO::FETCH_ASSOC)['total_mensuel'];
            
            if ($monthlyTotal >= $this->apiConfig['limite_mensuelle']) {
                return [
                    "status" => "error",
                    "code" => "MONTHLY_LIMIT_EXCEEDED",
                    "message" => "Limite mensuelle de transactions atteinte"
                ];
            }
            
            return true;
            
        } catch (Exception $e) {
            error_log("Erreur vérification limites: " . $e->getMessage());
            return true; // On continue en cas d'erreur de vérification
        }
    }
    
    private function updateLastAccess($banqueId) {
        try {
            $sql = "UPDATE banques_partenaire SET dernier_acces = NOW() WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $banqueId]);
        } catch (Exception $e) {
            error_log("Erreur mise à jour dernier accès: " . $e->getMessage());
        }
    }
    
    private function enregistrerConnexion($banqueId) {
        try {
            $sql = "INSERT INTO connexions_bancaires 
                    (banque_id, ip, user_agent, date_connexion)
                    VALUES 
                    (:banque_id, :ip, :user_agent, NOW())";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':banque_id' => $banqueId,
                ':ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                ':user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
            ]);
            
        } catch (PDOException $e) {
            error_log("Erreur enregistrement connexion: " . $e->getMessage());
        }
    }
}
?>