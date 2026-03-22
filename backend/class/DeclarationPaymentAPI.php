<?php
require_once 'Connexion.php';

/**
 * Classe DeclarationPaymentAPI - Gestion complète des paiements d'impôts
 * Version: 1.0 - Intégration complète avec paiements_bancaires et sécurité renforcée
 * 
 * Cette classe gère le processus complet de paiement d'impôts :
 * 1. Authentification des banques partenaires
 * 2. Initialisation des paiements
 * 3. Traitement des transactions
 * 4. Gestion des annulations
 * 5. Sécurité et vérifications
 */
class DeclarationPaymentAPI extends Connexion
{
    // Configuration de l'API
    private $apiConfig;
    
    // Données de la banque partenaire
    private $bankData;
    
    // ID de la banque actuellement connectée
    private $currentBankId;
    
    /**
     * Constructeur - Initialise la connexion à la base de données
     */
    public function __construct() {
        parent::__construct();
    }
    
    // =========================================================================
    // MÉTHODES D'AUTHENTIFICATION ET CONFIGURATION
    // =========================================================================
    
    /**
     * Charge la configuration bancaire depuis la BDD
     * 
     * @param string $bankId Identifiant unique de la banque
     * @throws Exception Si la banque n'est pas configurée ou inactive
     */
    private function loadBankConfig($bankId) {
        try {
            // Requête pour récupérer toutes les informations de la banque partenaire
            $sql = "SELECT bp.*, p.nom as partenaire_nom, p.base_url_api, p.timeout_api, p.retry_attempts,
                           p.raison_sociale, p.email AS contact_email, p.telephone AS contact_telephone,
                           p.ip_whitelist, p.en_maintenance,
                           bp.url_webhook_confirmation, bp.secret_webhook, bp.date_expiration,
                           bp.ip_autorisees, bp.user_agent_autorises, bp.actif as bp_actif, bp.suspendu
                    FROM banques_partenaire bp
                    JOIN partenaires p ON bp.partenaire_id = p.id
                    WHERE bp.bank_id = :bank_id AND bp.actif = 1 AND p.actif = 1";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':bank_id' => $bankId]);
            $this->bankData = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Vérifier si la banque existe et est active
            if (!$this->bankData) {
                throw new Exception("Banque non configurée ou inactive");
            }
            
            // Stocker l'ID de la banque actuelle
            $this->currentBankId = $bankId;
            
            // Construire la configuration API complète
            $this->apiConfig = [
                'base_url' => $this->bankData['base_url_api'] ?? 'https://api.banque.com/v1',
                'timeout' => $this->bankData['timeout_api'] ?? 30,
                'max_retries' => $this->bankData['retry_attempts'] ?? 3,
                'webhook_url' => $this->bankData['url_webhook_confirmation'],
                'webhook_secret' => $this->bankData['secret_webhook'],
                'frais_percentage' => $this->getFraisPercentage(),
                'frais_minimum' => $this->getFraisMinimum(),
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
     * Authentifie une banque via API Key avec vérifications de sécurité complètes
     * 
     * @param string $bankId Identifiant de la banque
     * @param string $apiKey Clé API pour l'authentification
     * @return array Réponse d'authentification avec statut et données
     */
    public function authenticateBank($bankId, $apiKey) {
        try {
            // ÉTAPE 1: Vérification des IPs autorisées
            $ipCheck = $this->checkIPAuthorization($bankId);
            if ($ipCheck !== true) {
                return $ipCheck;
            }
            
            // ÉTAPE 2: Vérification User-Agent
            $uaCheck = $this->checkUserAgentAuthorization($bankId);
            if ($uaCheck !== true) {
                return $uaCheck;
            }
            
            // ÉTAPE 3: Requête d'authentification dans la base de données
            $sql = "SELECT bp.*, p.nom as partenaire_nom, p.raison_sociale,
                           p.email AS contact_email, p.telephone AS contact_telephone,
                           p.timeout_api, p.retry_attempts, p.ip_whitelist, p.en_maintenance,
                           bp.date_expiration, bp.ip_autorisees, bp.user_agent_autorises,
                           bp.actif as bp_actif, bp.suspendu
                    FROM banques_partenaire bp
                    JOIN partenaires p ON bp.partenaire_id = p.id
                    WHERE bp.bank_id = :bank_id 
                    AND bp.api_key = :api_key 
                    AND bp.actif = 1 
                    AND bp.suspendu = 0
                    AND p.actif = 1
                    AND p.en_maintenance = 0
                    AND (bp.date_expiration IS NULL OR bp.date_expiration > NOW())";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':bank_id' => $bankId,
                ':api_key' => $apiKey
            ]);
            
            $banque = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // ÉTAPE 4: Vérifier si l'authentification a réussi
            if (!$banque) {
                error_log("Échec authentification - BankID: $bankId");
                return [
                    "status" => "error",
                    "code" => "AUTH_FAILED",
                    "message" => "Authentification échouée: Identifiants invalides, compte suspendu, expiré ou en maintenance"
                ];
            }
            
            // ÉTAPE 5: Vérifier si le partenaire est en maintenance
            if ($banque['en_maintenance'] == 1) {
                return [
                    "status" => "error",
                    "code" => "PARTNER_MAINTENANCE",
                    "message" => "Le partenaire est actuellement en maintenance"
                ];
            }
            
            // ÉTAPE 6: Vérifier les permissions nécessaires
            $permissions = json_decode($banque['permissions'] ?? '["process_payments"]', true);
            if (!$this->checkPermissions($permissions, ['process_payments'])) {
                return [
                    "status" => "error",
                    "code" => "INSUFFICIENT_PERMISSIONS",
                    "message" => "Permissions insuffisantes pour traiter les paiements"
                ];
            }
            
            // ÉTAPE 7: Charger la configuration spécifique de cette banque
            $this->loadBankConfig($bankId);
            
            // ÉTAPE 8: Vérifier les limites de transaction
            $checkLimits = $this->checkTransactionLimits($banque['id']);
            if ($checkLimits !== true) {
                return $checkLimits;
            }
            
            // ÉTAPE 9: Enregistrer la connexion dans les logs
            $this->enregistrerConnexion($banque['id']);
            
            // ÉTAPE 10: Mettre à jour la date du dernier accès
            $this->updateLastAccess($banque['id']);
            
            // Journaliser le succès de l'authentification
            error_log("Authentification réussie - Bank: " . $banque['partenaire_nom']);
            
            // Retourner la réponse de succès avec toutes les informations
            return [
                "status" => "success",
                "message" => "Authentification réussie",
                "data" => [
                    "bank_name" => $banque['partenaire_nom'],
                    "bank_id" => $banque['bank_id'],
                    "permissions" => $permissions,
                    "timeout" => $banque['timeout_api'],
                    "retry_attempts" => $banque['retry_attempts'],
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
    
    // =========================================================================
    // MÉTHODES DE GESTION DES PAIEMENTS
    // =========================================================================
    
    /**
     * Initialise un paiement d'impôt
     * 
     * Cette méthode :
     * 1. Vérifie l'existence de l'impôt
     * 2. Calcule le montant total
     * 3. Vérifie les limites de montant
     * 4. Récupère la répartition des bénéficiaires
     * 5. Crée un paiement temporaire
     * 6. Retourne les détails pour l'interface bancaire
     * 
     * @param int $impotId ID de l'impôt à payer
     * @param int $nombreDeclarations Nombre de déclarations (ex: nombre de plaques)
     * @return array Réponse avec les détails du paiement initialisé
     */
    public function initialiserPaiement($impotId, $nombreDeclarations) {
        try {
            // ÉTAPE 1: Récupérer les informations de l'impôt
            $sql = "SELECT * FROM impots WHERE id = :impot_id AND actif = 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':impot_id' => $impotId]);
            $impot = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$impot) {
                return [
                    "status" => "error",
                    "code" => "IMPOT_NOT_FOUND",
                    "message" => "Impôt non trouvé ou inactif"
                ];
            }
            
            // ÉTAPE 2: Calculer le montant total (prix unitaire × quantité)
            $montantTotal = $impot['prix'] * $nombreDeclarations;
            
            // ÉTAPE 3: Vérifier que le montant est dans les limites autorisées
            $amountCheck = $this->checkAmountLimits($montantTotal);
            if ($amountCheck !== true) {
                return $amountCheck;
            }
            
            // ÉTAPE 4: Récupérer la répartition des bénéficiaires
            $repartition = $this->getRepartitionBeneficiaires($impotId, $montantTotal);
            
            if (!$repartition) {
                return [
                    "status" => "error",
                    "code" => "NO_BENEFICIARIES",
                    "message" => "Aucun bénéficiaire configuré pour cet impôt"
                ];
            }
            
            // ÉTAPE 5: Générer une référence unique pour ce paiement
            $referencePaiement = $this->genererReferenceUnique();
            
            // ÉTAPE 6: Créer un enregistrement temporaire dans la base
            $idTemp = $this->creerPaiementTemporaire($referencePaiement, $impotId, $nombreDeclarations, $montantTotal, $repartition);
            
            // ÉTAPE 7: Enregistrer une notification pour le suivi
            $this->enregistrerNotification(
                'paiement_initialise',
                'Paiement initialisé',
                "Paiement d'impôt initialisé - Référence: $referencePaiement - Montant: $montantTotal",
                null, // NIF si disponible
                null, // ID déclaration si applicable
                $idTemp
            );
            
            // ÉTAPE 8: Construire l'URL de callback pour le webhook
            $callbackUrl = $this->apiConfig['webhook_url'] . '?ref=' . $referencePaiement;
            
            // ÉTAPE 9: Vérifier que la création temporaire a réussi
            if (!$idTemp) {
                return [
                    "status" => "error",
                    "code" => "TEMP_PAYMENT_CREATION_FAILED",
                    "message" => "Échec de la création du paiement temporaire"
                ];
            }
            
            // ÉTAPE 10: Retourner les détails du paiement initialisé
            return [
                "status" => "success",
                "message" => "Paiement initialisé avec succès",
                "data" => [
                    "reference_paiement" => $referencePaiement,
                    "impot" => [
                        "id" => $impot['id'],
                        "nom" => $impot['nom'],
                        "description" => $impot['description'],
                        "prix_unitaire" => $impot['prix'],
                        "periode" => $impot['periode']
                    ],
                    "details" => [
                        "nombre_declarations" => $nombreDeclarations,
                        "montant_total" => $montantTotal,
                        "montant_unitaire" => $impot['prix']
                    ],
                    "repartition" => $repartition,
                    "callback_url" => $callbackUrl,
                    "date_expiration" => date('Y-m-d H:i:s', strtotime('+1 hour')) // Expire dans 1 heure
                ]
            ];
            
        } catch (Exception $e) {
            error_log("Erreur initialisation paiement: " . $e->getMessage());
            return [
                "status" => "error",
                "code" => "INIT_PAYMENT_ERROR",
                "message" => "Erreur lors de l'initialisation du paiement"
            ];
        }
    }
    
    /**
     * Traite un paiement d'impôt après initialisation
     * 
     * Cette méthode :
     * 1. Récupère le paiement temporaire
     * 2. Vérifie qu'il n'a pas expiré
     * 3. Crée les enregistrements permanents dans les tables
     * 4. Génère une référence bancaire
     * 5. Supprime le temporaire
     * 
     * @param string $referencePaiement Référence unique du paiement
     * @param string $methodePaiement Méthode de paiement utilisée (ex: 'carte', 'virement')
     * @return array Réponse avec les détails du paiement traité
     */
    public function traiterPaiementImpot($referencePaiement, $methodePaiement) {
        try {
            // ÉTAPE 1: Récupérer le paiement temporaire depuis la base
            $paiementTemp = $this->getPaiementTemporaire($referencePaiement);
            
            if (!$paiementTemp) {
                return [
                    "status" => "error",
                    "code" => "PAYMENT_NOT_FOUND",
                    "message" => "Paiement temporaire non trouvé"
                ];
            }
            
            // ÉTAPE 2: Vérifier que le paiement n'a pas expiré (1 heure de validité)
            if (strtotime($paiementTemp['date_creation']) < strtotime('-1 hour')) {
                return [
                    "status" => "error",
                    "code" => "PAYMENT_EXPIRED",
                    "message" => "Le paiement a expiré"
                ];
            }
            
            // ÉTAPE 3: Démarrer une transaction SQL pour garantir l'intégrité des données
            $this->pdo->beginTransaction();
            
            try {
                // ÉTAPE 4: Créer l'enregistrement principal dans paiements_immatriculation
                $idPaiement = $this->creerPaiementImmatriculation($paiementTemp, $methodePaiement);
                
                if (!$idPaiement) {
                    throw new Exception("Échec création paiement immatriculation");
                }
                
                // ÉTAPE 5: Générer une référence bancaire unique pour ce paiement
                $referenceBancaire = $this->genererReferenceBancaire();
                
                // ÉTAPE 6: Créer l'enregistrement dans paiements_bancaires pour le suivi bancaire
                $idPaiementBancaire = $this->creerPaiementBancaire($idPaiement, $paiementTemp, $methodePaiement, $referenceBancaire);
                
                if (!$idPaiementBancaire) {
                    throw new Exception("Échec création paiement bancaire");
                }
                
                // ÉTAPE 7: Créer les enregistrements de répartition vers les bénéficiaires
                $repartitionSuccess = $this->creerRepartitionPaiement($idPaiement, $paiementTemp);
                
                if (!$repartitionSuccess) {
                    throw new Exception("Échec création répartition");
                }
                
                // ÉTAPE 8: Supprimer l'enregistrement temporaire maintenant que le paiement est traité
                $this->supprimerPaiementTemporaire($referencePaiement);

                // ÉTAPE 9: Enregistrer une notification pour le suivi
                $this->enregistrerNotification(
                    'paiement_traite',
                    'Paiement traité',
                    "Paiement d'impôt traité - Référence: $referencePaiement - Montant: {$paiementTemp['montant_total']}",
                    null,
                    null,
                    $idPaiement
                );
                
                // ÉTAPE 10: Valider la transaction (commit) si tout s'est bien passé
                $this->pdo->commit();
                
                // ÉTAPE 11: Retourner la confirmation de succès
                return [
                    "status" => "success",
                    "message" => "Paiement traité avec succès",
                    "data" => [
                        "paiement_id" => $idPaiement,
                        "paiement_bancaire_id" => $idPaiementBancaire,
                        "reference_bancaire" => $referenceBancaire, // Référence unique bancaire
                        "reference_paiement" => $referencePaiement, // Référence originale du paiement
                        "montant" => $paiementTemp['montant_total'],
                        "nombre_declarations" => $paiementTemp['nombre_declarations'],
                        "methode_paiement" => $methodePaiement,
                        "date_paiement" => date('Y-m-d H:i:s')
                    ]
                ];
                
            } catch (Exception $e) {
                // En cas d'erreur, annuler toutes les opérations de la transaction
                $this->pdo->rollBack();
                throw $e;
            }
            
        } catch (Exception $e) {
            error_log("Erreur traitement paiement impot: " . $e->getMessage());
            return [
                "status" => "error",
                "code" => "PAYMENT_PROCESSING_ERROR",
                "message" => "Erreur lors du traitement du paiement: " . $e->getMessage()
            ];
        }
    }
    
    /**
     * Annule un paiement d'impôt déjà traité
     * 
     * Cette méthode :
     * 1. Récupère le paiement existant
     * 2. Vérifie qu'il peut être annulé (non déjà servi)
     * 3. Supprime tous les enregistrements liés
     * 
     * @param string $referencePaiement Référence unique du paiement à annuler
     * @return array Réponse de confirmation d'annulation
     */
    public function annulerPaiementImpot($referencePaiement) {
        try {
            // ÉTAPE 1: Chercher le paiement dans la table paiements_bancaire
            $paiement = $this->getPaiementImmatriculation($referencePaiement);
            
            if (!$paiement) {
                return [
                    "status" => "error",
                    "code" => "PAYMENT_NOT_FOUND",
                    "message" => "Paiement non trouvé"
                ];
            }
            
            // ÉTAPE 2: Vérifier si le paiement peut être annulé (non déjà servi)
            if ($paiement['etat'] == 0) {
                return [
                    "status" => "error",
                    "code" => "PAYMENT_ALREADY_SERVED",
                    "message" => "Impossible d'annuler un paiement déjà servi"
                ];
            }
            
            // ÉTAPE 3: Démarrer une transaction SQL
            $this->pdo->beginTransaction();
            
            try {
                // ÉTAPE 4: Mettre à jour le statut dans paiements_bancaires
                $this->annulerPaiementBancaire($paiement['id_paiement']);
                
                // ÉTAPE 5: Supprimer la répartition vers les bénéficiaires
                $this->supprimerRepartitionPaiement($paiement['id_paiement']);
                
                // ÉTAPE 6: Supprimer le paiement principal
                $this->supprimerPaiementImmatriculation($paiement['id_paiement']);
                
                // ÉTAPE 7: Valider la transaction
                $this->pdo->commit();
                
                // ÉTAPE 8: Retourner la confirmation d'annulation
                return [
                    "status" => "success",
                    "message" => "Paiement annulé avec succès",
                    "data" => [
                        "reference" => $referencePaiement,
                        "type" => "definitif"
                    ]
                ];
                
            } catch (Exception $e) {
                // Annuler la transaction en cas d'erreur
                $this->pdo->rollBack();
                throw $e;
            }
            
        } catch (Exception $e) {
            error_log("Erreur annulation paiement: " . $e->getMessage());
            return [
                "status" => "error",
                "code" => "CANCELLATION_ERROR",
                "message" => "Erreur lors de l'annulation du paiement"
            ];
        }
    }
    
    // =========================================================================
    // MÉTHODES UTILITAIRES ET SÉCURITÉ
    // =========================================================================
    
    /**
     * Vérifie l'autorisation IP pour une banque donnée
     * 
     * @param string $bankId Identifiant de la banque
     * @return mixed true si autorisé, array d'erreur si non autorisé
     */
    private function checkIPAuthorization($bankId) {
        try {
            // Récupérer les listes d'IP autorisées
            $sql = "SELECT ip_whitelist, ip_autorisees 
                    FROM banques_partenaire bp
                    JOIN partenaires p ON bp.partenaire_id = p.id
                    WHERE bp.bank_id = :bank_id";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':bank_id' => $bankId]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Si pas de configuration, autoriser par défaut
            if (!$data) {
                return true;
            }
            
            // Récupérer l'adresse IP du client
            $clientIP = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            
            // Vérifier la whitelist du partenaire (niveau global)
            $ipWhitelist = json_decode($data['ip_whitelist'] ?? '[]', true);
            if (!empty($ipWhitelist) && !in_array($clientIP, $ipWhitelist)) {
                return [
                    "status" => "error",
                    "code" => "IP_NOT_AUTHORIZED",
                    "message" => "Adresse IP non autorisée"
                ];
            }
            
            // Vérifier les IPs autorisées spécifiques à la banque
            $ipAutorisees = json_decode($data['ip_autorisees'] ?? '[]', true);
            if (!empty($ipAutorisees) && !in_array($clientIP, $ipAutorisees)) {
                return [
                    "status" => "error",
                    "code" => "IP_NOT_AUTHORIZED",
                    "message" => "Adresse IP non autorisée pour cette banque"
                ];
            }
            
            return true;
            
        } catch (Exception $e) {
            error_log("Erreur vérification IP: " . $e->getMessage());
            return true; // En cas d'erreur, autoriser par sécurité
        }
    }
    
    /**
     * Vérifie l'autorisation User-Agent pour une banque donnée
     * 
     * @param string $bankId Identifiant de la banque
     * @return mixed true si autorisé, array d'erreur si non autorisé
     */
    private function checkUserAgentAuthorization($bankId) {
        try {
            // Récupérer les User-Agents autorisés
            $sql = "SELECT user_agent_autorises FROM banques_partenaire WHERE bank_id = :bank_id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':bank_id' => $bankId]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Si pas de configuration, autoriser par défaut
            if (!$data || empty($data['user_agent_autorises'])) {
                return true;
            }
            
            // Récupérer le User-Agent du client
            $clientUA = $_SERVER['HTTP_USER_AGENT'] ?? '';
            $uaAutorises = json_decode($data['user_agent_autorises'], true);
            
            // Vérifier si le User-Agent est autorisé
            if (!empty($uaAutorises) && !in_array($clientUA, $uaAutorises)) {
                return [
                    "status" => "error",
                    "code" => "USER_AGENT_NOT_AUTHORIZED",
                    "message" => "User-Agent non autorisé"
                ];
            }
            
            return true;
            
        } catch (Exception $e) {
            error_log("Erreur vérification User-Agent: " . $e->getMessage());
            return true; // En cas d'erreur, autoriser par sécurité
        }
    }
    
    /**
     * Vérifie les limites de montant pour une transaction
     * 
     * @param float $montant Montant à vérifier
     * @return mixed true si OK, array d'erreur si hors limites
     */
    private function checkAmountLimits($montant) {
        // Vérifier le montant minimum
        if ($montant < $this->apiConfig['montant_minimum']) {
            return [
                "status" => "error",
                "code" => "AMOUNT_TOO_LOW",
                "message" => "Le montant est inférieur au minimum autorisé: " . $this->apiConfig['montant_minimum']
            ];
        }
        
        // Vérifier le montant maximum
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
     * Récupère le pourcentage de frais bancaires depuis la base
     * 
     * @return float Pourcentage de frais (0.5% par défaut)
     */
    private function getFraisPercentage() {
        try {
            $sql = "SELECT valeur FROM frais_bancaires WHERE type = 'pourcentage' AND actif = 1 ORDER BY date_creation DESC LIMIT 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Retourner la valeur ou 0.5% par défaut
            return $result ? floatval($result['valeur']) : 0.5;
        } catch (Exception $e) {
            error_log("Erreur récupération frais: " . $e->getMessage());
            return 0.5;
        }
    }
    
    /**
     * Récupère le minimum de frais depuis la base
     * 
     * @return float Montant minimum de frais (100 par défaut)
     */
    private function getFraisMinimum() {
        try {
            $sql = "SELECT valeur FROM frais_bancaires WHERE type = 'minimum' AND actif = 1 ORDER BY date_creation DESC LIMIT 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Retourner la valeur ou 100 par défaut
            return $result ? floatval($result['valeur']) : 100;
        } catch (Exception $e) {
            error_log("Erreur récupération frais minimum: " . $e->getMessage());
            return 100;
        }
    }
    
    /**
     * Crée un enregistrement dans paiements_bancaires
     * 
     * @param int $idPaiement ID du paiement principal
     * @param array $paiementTemp Données du paiement temporaire
     * @param string $methodePaiement Méthode de paiement utilisée
     * @param string|null $referenceBancaire Référence bancaire (optionnelle)
     * @return int|false ID du paiement bancaire créé ou false en cas d'erreur
     */
    private function creerPaiementBancaire($idPaiement, $paiementTemp, $methodePaiement, $referenceBancaire = null) {
        try {
            // Générer une référence bancaire si non fournie
            $referenceBancaire = $referenceBancaire ?? $this->genererReferenceBancaire();
            
            $sql = "INSERT INTO paiements_bancaires 
                    (id_paiement, bank_id, reference_bancaire, statut, donnees_initiation, date_creation)
                    VALUES 
                    (:id_paiement, :bank_id, :reference_bancaire, 'complete', :donnees_initiation, NOW())";
            
            // Préparer les données d'initiation au format JSON
            $donneesInitiation = json_encode([
                'montant' => $paiementTemp['montant_total'],
                'methode_paiement' => $methodePaiement,
                'nombre_declarations' => $paiementTemp['nombre_declarations'],
                'impot_id' => $paiementTemp['impot_id']
            ]);
            
            $stmt = $this->pdo->prepare($sql);
            $result = $stmt->execute([
                ':id_paiement' => $idPaiement,
                ':bank_id' => $this->currentBankId,
                ':reference_bancaire' => $referenceBancaire,
                ':donnees_initiation' => $donneesInitiation
            ]);
            
            // Vérifier le résultat et journaliser les erreurs SQL
            if (!$result) {
                $errorInfo = $stmt->errorInfo();
                error_log("Erreur SQL paiement bancaire: " . print_r($errorInfo, true));
                return false;
            }
            
            // Retourner l'ID du nouvel enregistrement
            return $this->pdo->lastInsertId();
            
        } catch (Exception $e) {
            error_log("Erreur création paiement bancaire: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Annule un paiement dans paiements_bancaires
     * 
     * @param int $idPaiement ID du paiement à annuler
     * @return bool Succès de l'opération
     */
    private function annulerPaiementBancaire($idPaiement) {
        try {
            $sql = "DELETE FROM paiements_bancaires
                    WHERE id_paiement = :id_paiement";
            
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([':id_paiement' => $idPaiement]);
            
        } catch (Exception $e) {
            error_log("Erreur annulation paiement bancaire: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Génère une référence bancaire unique
     * 
     * Format: BANK + DateHeure + Random (ex: BANK202401151430451234)
     * 
     * @return string Référence bancaire unique
     */
    private function genererReferenceBancaire() {
        return 'BANK' . date('YmdHis') . mt_rand(1000, 9999);
    }
    
    // =========================================================================
    // MÉTHODES EXISTANTES (conservées avec améliorations)
    // =========================================================================
    
    /**
     * Récupère la répartition des bénéficiaires pour un impôt
     * 
     * @param int $impotId ID de l'impôt
     * @param float $montantTotal Montant total à répartir
     * @return array|null Liste des bénéficiaires avec leurs parts
     */
    private function getRepartitionBeneficiaires($impotId, $montantTotal) {
        try {
            $sql = "SELECT ib.*, b.nom, b.telephone, b.numero_compte
                    FROM impot_beneficiaires ib
                    JOIN beneficiaires b ON ib.beneficiaire_id = b.id
                    WHERE ib.impot_id = :impot_id AND b.actif = 1
                    ORDER BY ib.id";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':impot_id' => $impotId]);
            $beneficiaires = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($beneficiaires)) {
                return null;
            }
            
            // Calculer la répartition pour chaque bénéficiaire
            $repartition = [];
            foreach ($beneficiaires as $benef) {
                if ($benef['type_part'] === 'pourcentage') {
                    $montant = ($montantTotal * $benef['valeur_part']) / 100;
                } else {
                    $montant = $benef['valeur_part'];
                }
                
                $repartition[] = [
                    "beneficiaire_id" => $benef['beneficiaire_id'],
                    "nom" => $benef['nom'],
                    "telephone" => $benef['telephone'],
                    "numero_compte" => $benef['numero_compte'],
                    "type_part" => $benef['type_part'],
                    "valeur_part_originale" => $benef['valeur_part'],
                    "montant" => $montant
                ];
            }
            
            return $repartition;
            
        } catch (Exception $e) {
            error_log("Erreur récupération bénéficiaires: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Crée un paiement temporaire dans la base
     * 
     * @param string $reference Référence unique
     * @param int $impotId ID de l'impôt
     * @param int $nombreDeclarations Nombre de déclarations
     * @param float $montantTotal Montant total
     * @param array $repartition Répartition JSON des bénéficiaires
     * @return int|false ID du paiement temporaire ou false
     */
    private function creerPaiementTemporaire($reference, $impotId, $nombreDeclarations, $montantTotal, $repartition) {
        try {
            // S'assurer que la table temporaire existe
            $this->creerTableTemporaire();
            
            $sql = "INSERT INTO paiements_immatriculation_temp 
                    (reference, impot_id, nombre_declarations, montant_total, repartition_json, date_creation)
                    VALUES 
                    (:reference, :impot_id, :nombre_declarations, :montant_total, :repartition_json, NOW())";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':reference' => $reference,
                ':impot_id' => $impotId,
                ':nombre_declarations' => $nombreDeclarations,
                ':montant_total' => $montantTotal,
                ':repartition_json' => json_encode($repartition)
            ]);
            
            return $this->pdo->lastInsertId();
            
        } catch (Exception $e) {
            error_log("Erreur création paiement temporaire: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Crée la table temporaire si elle n'existe pas
     */
    private function creerTableTemporaire() {
        try {
            $sql = "CREATE TABLE IF NOT EXISTS paiements_immatriculation_temp (
                id INT AUTO_INCREMENT PRIMARY KEY,
                reference VARCHAR(50) UNIQUE NOT NULL,
                impot_id INT NOT NULL,
                nombre_declarations INT NOT NULL,
                montant_total DECIMAL(15,2) NOT NULL,
                repartition_json JSON NOT NULL,
                date_creation DATETIME NOT NULL,
                INDEX idx_reference (reference),
                INDEX idx_date_creation (date_creation)
            )";
            
            $this->pdo->exec($sql);
            
        } catch (Exception $e) {
            error_log("Erreur création table temporaire: " . $e->getMessage());
        }
    }
    
    /**
     * Récupère un paiement temporaire par sa référence
     * 
     * @param string $reference Référence unique
     * @return array|null Données du paiement ou null
     */
    private function getPaiementTemporaire($reference) {
        try {
            $sql = "SELECT * FROM paiements_immatriculation_temp WHERE reference = :reference";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':reference' => $reference]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            error_log("Erreur récupération paiement temporaire: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Supprime un paiement temporaire
     * 
     * @param string $reference Référence unique
     * @return bool Succès de l'opération
     */
    private function supprimerPaiementTemporaire($reference) {
        try {
            $sql = "DELETE FROM paiements_immatriculation_temp WHERE reference = :reference";
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([':reference' => $reference]);
            
        } catch (Exception $e) {
            error_log("Erreur suppression paiement temporaire: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Crée un paiement permanent dans paiements_immatriculation
     * 
     * @param array $paiementTemp Données du paiement temporaire
     * @param string $methodePaiement Méthode de paiement
     * @return int|false ID du paiement créé ou false
     */
    private function creerPaiementImmatriculation($paiementTemp, $methodePaiement) {
        try {
            $impotId = (string)$paiementTemp['impot_id'];
            
            $sql = "INSERT INTO paiements_immatriculation 
                    (montant, montant_initial, impot_id, mode_paiement, statut, date_paiement, 
                     utilisateur_id, site_id, nombre_plaques, etat, particulier_id)
                    VALUES 
                    (:montant, :montant_initial, :impot_id, :mode_paiement, 'completed', NOW(),
                     :utilisateur_id, :site_id, :nombre_plaques, 1, :particulier_id)";
            
            $stmt = $this->pdo->prepare($sql);
            $result = $stmt->execute([
                ':montant' => $paiementTemp['montant_total'],
                ':montant_initial' => $paiementTemp['montant_total'],
                ':impot_id' => $impotId,
                ':mode_paiement' => $methodePaiement,
                ':utilisateur_id' => 0,
                ':site_id' => 0,
                ':nombre_plaques' => $paiementTemp['nombre_declarations'],
                ':particulier_id' => 0
            ]);
            
            if (!$result) {
                $errorInfo = $stmt->errorInfo();
                error_log("Erreur SQL paiement immatriculation: " . print_r($errorInfo, true));
                return false;
            }
            
            return $this->pdo->lastInsertId();
            
        } catch (Exception $e) {
            error_log("Erreur création paiement immatriculation: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Récupère un paiement depuis la table paiements_immatriculation
     * 
     * @param string $reference Référence bancaire
     * @return array|null Données du paiement ou null
     */
    private function getPaiementImmatriculation($reference) {
        try {
            $sql = "
                SELECT
                    paiements_bancaires.*,
                    paiements_immatriculation.etat
                FROM paiements_bancaires
                INNER JOIN paiements_immatriculation
                    ON paiements_immatriculation.id = paiements_bancaires.id_paiement
                WHERE paiements_bancaires.reference_bancaire = :reference_bancaire
            ";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':reference_bancaire' => $reference]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            error_log("Erreur récupération paiement immatriculation: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Supprime un paiement de paiements_immatriculation
     * 
     * @param int $id ID du paiement
     * @return bool Succès de l'opération
     */
    private function supprimerPaiementImmatriculation($id) {
        try {
            $sql = "DELETE FROM paiements_immatriculation WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([':id' => $id]);
            
        } catch (Exception $e) {
            error_log("Erreur suppression paiement immatriculation: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Crée les enregistrements de répartition pour un paiement
     * 
     * @param int $idPaiement ID du paiement principal
     * @param array $paiementTemp Données du paiement temporaire
     * @return bool Succès de l'opération
     */
    private function creerRepartitionPaiement($idPaiement, $paiementTemp) {
        try {
            // Décoder la répartition JSON
            $repartition = json_decode($paiementTemp['repartition_json'], true);
            
            // Créer un enregistrement pour chaque bénéficiaire
            foreach ($repartition as $benef) {
                $sql = "INSERT INTO repartition_paiements_immatriculation 
                        (id_paiement_immatriculation, beneficiaire_id, type_part, 
                         valeur_part_originale, valeur_part_calculee, montant, date_creation)
                        VALUES 
                        (:id_paiement, :beneficiaire_id, :type_part, 
                         :valeur_originale, :valeur_calculee, :montant, NOW())";
                
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([
                    ':id_paiement' => $idPaiement,
                    ':beneficiaire_id' => $benef['beneficiaire_id'],
                    ':type_part' => $benef['type_part'],
                    ':valeur_originale' => $benef['valeur_part_originale'],
                    ':valeur_calculee' => $benef['montant'],
                    ':montant' => $benef['montant']
                ]);
            }
            
            return true;
            
        } catch (Exception $e) {
            error_log("Erreur création répartition: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Supprime les répartitions d'un paiement
     * 
     * @param int $idPaiement ID du paiement
     * @return bool Succès de l'opération
     */
    private function supprimerRepartitionPaiement($idPaiement) {
        try {
            $sql = "DELETE FROM repartition_paiements_immatriculation WHERE id_paiement_immatriculation = :id_paiement";
            $stmt = $this->pdo->prepare($sql);
            return $stmt->execute([':id_paiement' => $idPaiement]);
            
        } catch (Exception $e) {
            error_log("Erreur suppression répartition: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Génère une référence unique pour un paiement
     * 
     * Format: IMP + DateHeure + Random (ex: IMP20240115143045ABC12)
     * 
     * @return string Référence unique
     */
    private function genererReferenceUnique() {
        $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $reference = '';
        for ($i = 0; $i < 5; $i++) {
            $reference .= $characters[rand(0, strlen($characters) - 1)];
        }
        return 'IMP' . date('YmdHis') . $reference;
    }
    
    /**
     * Vérifie si les permissions requises sont présentes
     * 
     * @param array $permissions Permissions disponibles
     * @param array $required Permissions requises
     * @return bool true si toutes les permissions sont présentes
     */
    private function checkPermissions($permissions, $required) {
        foreach ($required as $permission) {
            if (!in_array($permission, $permissions)) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Vérifie les limites de transaction pour une banque
     * 
     * @param int $banqueId ID de la banque
     * @return mixed true si OK, array d'erreur si limites dépassées
     */
    private function checkTransactionLimits($banqueId) {
        try {
            // Vérifier la limite journalière
            $sqlDaily = "SELECT COALESCE(SUM(montant), 0) as total_journalier 
                        FROM paiements_bancaires pb
                        JOIN paiements_immatriculation pi ON pb.id_paiement = pi.id
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
            
            // Vérifier la limite mensuelle
            $sqlMonthly = "SELECT COALESCE(SUM(montant), 0) as total_mensuel 
                          FROM paiements_bancaires pb
                          JOIN paiements_immatriculation pi ON pb.id_paiement = pi.id
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
            return true; // En cas d'erreur, autoriser par sécurité
        }
    }
    
    /**
     * Met à jour la date du dernier accès pour une banque
     * 
     * @param int $banqueId ID de la banque
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
     * Enregistre une connexion bancaire dans les logs
     * 
     * @param int $banqueId ID de la banque
     */
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
     * Récupère le NIF d'un particulier par son ID
     * 
     * @param int $particulierId ID du particulier
     * @return string|null NIF du particulier ou null
     */
    private function getNIFByParticulierId($particulierId)
    {
        try {
            $sql = "SELECT nif FROM particuliers WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':id' => $particulierId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return $result ? $result['nif'] : null;
        } catch (PDOException $e) {
            error_log("Erreur récupération NIF: " . $e->getMessage());
            return null;
        }
    }
}
?>