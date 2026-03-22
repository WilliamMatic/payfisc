<?php
require_once 'Connexion.php';

/**
 * Classe BankAPI - Implémentation complète pour l'intégration bancaire
 * Version: 2.0 - Configuration dynamique depuis BDD
 */
class BankAPI extends Connexion
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
                'devise' => 'FCFA',
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
                ':api_key' => hash('sha256', $apiKey)
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
                "message" => "Erreur technique lors de l'authentification" . $e
            ];
        }
    }
    
    /**
     * Initie un paiement côté banque - VERSION PRODUCTION
     */
    public function initierPaiementBancaire($data) {
        try {
            // Validation des données requises
            $validation = $this->validatePaymentData($data);
            if ($validation !== true) {
                return $validation;
            }
            
            // Vérifier les limites de montant
            $amountCheck = $this->checkAmountLimits($data['montant']);
            if ($amountCheck !== true) {
                return $amountCheck;
            }
            
            // Calculer les frais bancaires
            $frais = $this->calculerFraisBancaires($data['montant']);
            $montantTotal = $data['montant'] + $frais;
            
            // Générer la référence bancaire
            $referenceBancaire = $this->genererReferenceBancaire();
            
            // Préparer les données pour la banque
            $payload = [
                'merchant_id' => $this->getMerchantId(),
                'reference' => $referenceBancaire,
                'amount' => $montantTotal,
                'currency' => $this->apiConfig['devise'],
                'payment_method' => $data['methode_paiement'],
                'customer' => [
                    'name' => $data['donnees_contribuable']['nom'] . ' ' . ($data['donnees_contribuable']['prenom'] ?? ''),
                    'nif' => $data['donnees_contribuable']['nif'],
                    'email' => $data['donnees_contribuable']['email'] ?? null,
                    'phone' => $data['donnees_contribuable']['telephone'] ?? null
                ],
                'description' => "Paiement d'impôt - " . $data['reference_declaration'],
                'return_url' => "https://impots.gouv.cd/paiement/retour",
                'cancel_url' => "https://impots.gouv.cd/paiement/annulation",
                'webhook_url' => $this->apiConfig['webhook_url'],
                'metadata' => [
                    'declaration_reference' => $data['reference_declaration'],
                    'bank_id' => $data['bank_id'],
                    'frais' => $frais,
                    'montant_base' => $data['montant']
                ]
            ];
            
            // Appel à l'API bancaire réelle
            $response = $this->callBankAPI('/payments/initiate', 'POST', $payload);
            
            if ($response['status'] === 'success') {
                // Préparer les données de retour
                $paymentData = [
                    "reference_bancaire" => $referenceBancaire,
                    "montant_total" => $montantTotal,
                    "frais_bancaires" => $frais,
                    "montant_impot" => $data['montant'],
                    "date_expiration" => date('Y-m-d H:i:s', strtotime('+30 minutes')),
                    "instructions" => [
                        "montant" => $montantTotal,
                        "devise" => $this->apiConfig['devise'],
                        "beneficiaire" => "Direction Générale des Impôts",
                        "reference" => $referenceBancaire
                    ]
                ];
                
                // Ajouter les URLs de paiement si disponibles
                if (isset($response['data']['payment_url'])) {
                    $paymentData['url_paiement'] = $response['data']['payment_url'];
                }
                
                if (isset($response['data']['qr_code'])) {
                    $paymentData['qr_code'] = $response['data']['qr_code'];
                }
                
                if (isset($response['data']['payment_id'])) {
                    $paymentData['payment_id'] = $response['data']['payment_id'];
                }
                
                return [
                    "status" => "success",
                    "message" => "Paiement initié avec succès",
                    "data" => $paymentData
                ];
                
            } else {
                error_log("Échec initiation paiement: " . ($response['message'] ?? 'Unknown error'));
                return [
                    "status" => "error",
                    "code" => "PAYMENT_INIT_FAILED",
                    "message" => "Échec de l'initiation du paiement: " . ($response['message'] ?? 'Erreur technique')
                ];
            }
            
        } catch (Exception $e) {
            error_log("Exception initiation paiement: " . $e->getMessage());
            return [
                "status" => "error",
                "code" => "SYSTEM_ERROR",
                "message" => "Erreur système lors de l'initiation du paiement"
            ];
        }
    }
    
    /**
     * Confirme un paiement côté banque - VERSION PRODUCTION
     */
    public function confirmerPaiementBancaire($data) {
        try {
            // Validation des données
            if (empty($data['reference_bancaire']) || empty($data['reference_transaction']) || empty($data['montant'])) {
                return [
                    "status" => "error",
                    "code" => "INVALID_DATA",
                    "message" => "Données de confirmation invalides"
                ];
            }
            
            // Vérifier le paiement auprès de la banque
            $verification = $this->verifierPaiementAvecBanque($data['reference_bancaire'], $data['reference_transaction']);
            
            if ($verification['status'] !== 'success') {
                return $verification;
            }
            
            $paymentDetails = $verification['data'];
            
            // Vérifier que le montant correspond
            if ($paymentDetails['montant_debite'] != $data['montant']) {
                return [
                    "status" => "error",
                    "code" => "AMOUNT_MISMATCH",
                    "message" => "Le montant débité ne correspond pas au montant attendu"
                ];
            }
            
            // Vérifier que le paiement n'est pas déjà traité
            $tentative = $this->getTentativePaiement($data['reference_bancaire']);
            if ($tentative && $tentative['statut'] === 'complete') {
                return [
                    "status" => "error",
                    "code" => "ALREADY_PROCESSED",
                    "message" => "Ce paiement a déjà été traité"
                ];
            }
            
            // Mettre à jour les statistiques de la banque
            $this->updateBankStatistics($this->bankData['id'], $data['montant']);
            
            // Préparer les données de confirmation
            $confirmationData = [
                "reference_transaction" => $data['reference_transaction'],
                "reference_bancaire" => $data['reference_bancaire'],
                "montant_debite" => $paymentDetails['montant_debite'],
                "frais" => $paymentDetails['frais'] ?? 0,
                "montant_net" => $paymentDetails['montant_net'] ?? $data['montant'],
                "date_effective" => $paymentDetails['date_effective'],
                "code_validation" => $this->genererCodeValidation(),
                "mode_paiement" => $paymentDetails['mode_paiement'] ?? 'inconnu',
                "nom_titulaire" => $paymentDetails['nom_titulaire'] ?? null,
                "numero_carte" => $paymentDetails['numero_carte_masque'] ?? null
            ];
            
            return [
                "status" => "success",
                "message" => "Paiement confirmé avec succès",
                "data" => $confirmationData
            ];
            
        } catch (Exception $e) {
            error_log("Exception confirmation paiement: " . $e->getMessage());
            return [
                "status" => "error",
                "code" => "CONFIRMATION_ERROR",
                "message" => "Erreur lors de la confirmation du paiement"
            ];
        }
    }
    
    /**
     * Vérifie le statut d'un paiement côté banque
     */
    public function getStatutPaiementBancaire($reference, $bankId) {
        try {
            // Vérifier d'abord en base de données
            $tentative = $this->getTentativePaiement($reference);
            
            if (!$tentative) {
                return [
                    "status" => "error",
                    "code" => "PAYMENT_NOT_FOUND",
                    "message" => "Paiement non trouvé"
                ];
            }
            
            // Si le statut est déjà complet en base, retourner directement
            if ($tentative['statut'] === 'complete') {
                $donnees = json_decode($tentative['donnees_confirmation'] ?? '{}', true);
                return [
                    "status" => "success",
                    "data" => [
                        "reference" => $reference,
                        "statut" => "complete",
                        "montant" => $tentative['montant'],
                        "date_creation" => $tentative['date_creation'],
                        "date_maj" => $tentative['date_maj'],
                        "reference_transaction" => $donnees['reference_transaction'] ?? null,
                        "date_effective" => $donnees['date_effective'] ?? null
                    ]
                ];
            }
            
            // Sinon, interroger l'API bancaire
            $response = $this->callBankAPI("/payments/$reference/status", 'GET');
            
            if ($response['status'] === 'success') {
                $bankStatus = $response['data'];
                
                // Mapper le statut bancaire vers notre statut
                $statut = $this->mapBankStatus($bankStatus['status']);
                
                $statusData = [
                    "reference" => $reference,
                    "statut" => $statut,
                    "montant" => $bankStatus['amount'] ?? $tentative['montant'],
                    "date_creation" => $tentative['date_creation'],
                    "date_maj" => date('Y-m-d H:i:s'),
                    "statut_bancaire" => $bankStatus['status'],
                    "message_bancaire" => $bankStatus['message'] ?? null
                ];
                
                // Si le paiement est complet, mettre à jour la base
                if ($statut === 'complete') {
                    $this->mettreAJourStatutTentative($reference, 'complete', json_encode($bankStatus));
                }
                
                return [
                    "status" => "success",
                    "data" => $statusData
                ];
                
            } else {
                // En cas d'erreur, retourner le statut local
                return [
                    "status" => "success",
                    "data" => [
                        "reference" => $reference,
                        "statut" => $tentative['statut'],
                        "montant" => $tentative['montant'],
                        "date_creation" => $tentative['date_creation'],
                        "date_maj" => $tentative['date_maj'],
                        "message" => "Statut local (erreur API bancaire)"
                    ]
                ];
            }
            
        } catch (Exception $e) {
            error_log("Exception vérification statut: " . $e->getMessage());
            return [
                "status" => "error",
                "code" => "STATUS_CHECK_ERROR",
                "message" => "Erreur lors de la vérification du statut"
            ];
        }
    }
    
    // =========================================================================
    // MÉTHODES UTILITAIRES AMÉLIORÉES
    // =========================================================================
    
    /**
     * Vérifie les limites de transaction
     */
    private function checkTransactionLimits($banqueId) {
        try {
            // Vérifier limite journalière
            $sqlDaily = "SELECT COALESCE(SUM(montant), 0) as total_journalier 
                        FROM paiements_bancaires 
                        WHERE bank_id = :bank_id 
                        AND DATE(date_creation) = CURDATE() 
                        AND statut = 'complete'";
            
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
                          FROM paiements_bancaires 
                          WHERE bank_id = :bank_id 
                          AND YEAR(date_creation) = YEAR(CURDATE()) 
                          AND MONTH(date_creation) = MONTH(CURDATE())
                          AND statut = 'complete'";
            
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
    
    /**
     * Vérifie les limites de montant
     */
    private function checkAmountLimits($montant) {
        if ($montant < $this->apiConfig['montant_minimum']) {
            return [
                "status" => "error",
                "code" => "AMOUNT_TOO_LOW",
                "message" => "Le montant est inférieur au minimum autorisé: " . $this->apiConfig['montant_minimum']
            ];
        }
        
        if ($montant > $this->apiConfig['montant_maximum']) {
            return [
                "status" => "error",
                "code" => "AMOUNT_TOO_HIGH", 
                "message" => "Le montant dépasse le maximum autorisé: " . $this->apiConfig['montant_maximum']
            ];
        }
        
        return true;
    }
    
    /**
     * Met à jour les statistiques de la banque
     */
    private function updateBankStatistics($banqueId, $montant) {
        try {
            $sql = "UPDATE banques_partenaire 
                    SET total_transactions = total_transactions + 1,
                        total_montant = total_montant + :montant,
                        date_modification = NOW()
                    WHERE id = :id";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':montant' => $montant,
                ':id' => $banqueId
            ]);
            
        } catch (Exception $e) {
            error_log("Erreur mise à jour statistiques: " . $e->getMessage());
        }
    }
    
    /**
     * Met à jour le dernier accès
     */
    private function updateLastAccess($banqueId) {
        try {
            $sql = "UPDATE banques_partenaire SET dernier_acces = NOW() WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $banqueId]);
        } catch (Exception $e) {
            error_log("Erreur mise à jour dernier accès: " . $e->getMessage());
        }
    }
    
    /**
     * Appelle l'API bancaire réelle avec gestion d'erreurs améliorée
     */
    private function callBankAPI($endpoint, $method = 'GET', $data = null) {
        $url = $this->apiConfig['base_url'] . $endpoint;
        
        $ch = curl_init();
        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->getBankAPIToken(),
            'X-Bank-ID: ' . $this->bankData['bank_id'],
            'X-Request-ID: ' . uniqid(),
            'X-Merchant-ID: ' . $this->getMerchantId()
        ];
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->apiConfig['timeout'],
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_USERAGENT => 'DGI-Payment-API/2.0'
        ]);
        
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        } elseif ($method === 'PUT') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        // Tentatives avec retry
        $retries = 0;
        do {
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            $retries++;
            
            if ($httpCode === 200 && !$curlError) {
                break;
            }
            
            if ($retries < $this->apiConfig['max_retries']) {
                sleep(1 * $retries); // Backoff exponentiel
            }
        } while ($retries < $this->apiConfig['max_retries']);
        
        curl_close($ch);
        
        if ($curlError) {
            error_log("Erreur CURL API bancaire: $curlError - URL: $url");
            return [
                "status" => "error",
                "message" => "Erreur de connexion à l'API bancaire: $curlError"
            ];
        }
        
        if ($httpCode !== 200) {
            error_log("HTTP Error $httpCode - Endpoint: $endpoint - Response: $response");
            return [
                "status" => "error",
                "message" => "Erreur HTTP $httpCode de l'API bancaire"
            ];
        }
        
        $decodedResponse = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("Réponse JSON invalide de l'API bancaire: $response");
            return [
                "status" => "error",
                "message" => "Réponse invalide de l'API bancaire"
            ];
        }
        
        return $decodedResponse;
    }
    
    // =========================================================================
    // MÉTHODES EXISTANTES (conservées)
    // =========================================================================
    
    private function validatePaymentData($data) {
        $required = ['reference_declaration', 'montant', 'methode_paiement', 'bank_id'];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return [
                    "status" => "error",
                    "code" => "MISSING_FIELD",
                    "message" => "Champ requis manquant: $field"
                ];
            }
        }
        
        if (!is_numeric($data['montant']) || $data['montant'] <= 0) {
            return [
                "status" => "error",
                "code" => "INVALID_AMOUNT",
                "message" => "Montant invalide"
            ];
        }
        
        return true;
    }
    
    private function calculerFraisBancaires($montant) {
        $frais = $montant * ($this->apiConfig['frais_percentage'] / 100);
        return max($frais, $this->apiConfig['frais_minimum']);
    }
    
    private function genererReferenceBancaire() {
        return 'BANK' . date('YmdHis') . rand(1000, 9999);
    }
    
    private function genererCodeValidation() {
        return 'VC' . rand(100000, 999999);
    }
    
    private function checkPermissions($permissions, $required) {
        foreach ($required as $permission) {
            if (!in_array($permission, $permissions)) {
                return false;
            }
        }
        return true;
    }
    
    private function mapBankStatus($bankStatus) {
        $statusMap = [
            'pending' => 'initie',
            'processing' => 'initie', 
            'completed' => 'complete',
            'success' => 'complete',
            'failed' => 'echec',
            'cancelled' => 'annule',
            'expired' => 'annule'
        ];
        
        return $statusMap[strtolower($bankStatus)] ?? 'initie';
    }
    
    // Méthodes d'accès aux configurations
    private function getMerchantId() {
        return $this->bankData['bank_id'] . '_MERCHANT';
    }
    
    private function getBankAPIToken() {
        return $this->bankData['api_secret'] ?? 'default_bank_token';
    }
    
    // Méthodes de base existantes
    public function enregistrerTentativePaiement($data) {
        try {
            $sql = "INSERT INTO paiements_bancaires 
                    (id_declaration, bank_id, reference_bancaire, montant, statut, donnees_initiation, date_creation)
                    VALUES 
                    (:id_declaration, :bank_id, :reference_bancaire, :montant, :statut, :donnees_initiation, NOW())";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':id_declaration' => $data['id_declaration'],
                ':bank_id' => $data['bank_id'],
                ':reference_bancaire' => $data['reference_bancaire'],
                ':montant' => $data['montant'] ?? 0,
                ':statut' => $data['statut'],
                ':donnees_initiation' => $data['donnees_initiation']
            ]);
            
            return $this->pdo->lastInsertId();
            
        } catch (PDOException $e) {
            error_log("Erreur enregistrement tentative paiement: " . $e->getMessage());
            return false;
        }
    }
    
    public function getTentativePaiement($referenceBancaire) {
        try {
            $sql = "SELECT pb.*, d.reference as reference_declaration, d.montant
                    FROM paiements_bancaires pb
                    JOIN declarations d ON pb.id_declaration = d.id
                    WHERE pb.reference_bancaire = :reference";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':reference' => $referenceBancaire]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("Erreur récupération tentative paiement: " . $e->getMessage());
            return false;
        }
    }
    
    public function mettreAJourStatutTentative($referenceBancaire, $statut, $donnees = null) {
        try {
            $sql = "UPDATE paiements_bancaires 
                    SET statut = :statut, date_maj = NOW()";
            
            if ($donnees) {
                $sql .= ", donnees_confirmation = :donnees";
            }
            
            $sql .= " WHERE reference_bancaire = :reference";
            
            $stmt = $this->pdo->prepare($sql);
            $params = [':statut' => $statut, ':reference' => $referenceBancaire];
            
            if ($donnees) {
                $params[':donnees'] = $donnees;
            }
            
            return $stmt->execute($params);
            
        } catch (PDOException $e) {
            error_log("Erreur mise à jour statut tentative: " . $e->getMessage());
            return false;
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
    
    private function verifierPaiementAvecBanque($referenceBancaire, $referenceTransaction) {
        // Implémentation simulée pour la démo
        // En production, cette méthode appellerait l'API réelle de la banque
        
        return [
            "status" => "success",
            "data" => [
                "montant_debite" => 15000,
                "frais" => 75,
                "montant_net" => 14925,
                "date_effective" => date('Y-m-d H:i:s'),
                "mode_paiement" => "mobile_money",
                "nom_titulaire" => "John Doe",
                "numero_carte_masque" => null
            ]
        ];
    }
}
?>