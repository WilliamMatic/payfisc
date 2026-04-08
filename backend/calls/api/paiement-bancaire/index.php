<?php
/**
 * API Paiement Bancaire - Point d'entrée production
 * URL: http://localhost/SOCOFIAPP/Impot/backend/calls/api/paiement-bancaire/
 * Documentation: http://localhost/SOCOFIAPP/Impot/backend/calls/api/paiement-bancaire/docs
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_secure' => true,
        'cookie_httponly' => true,
        'use_strict_mode' => true
    ]);
}

// Headers CORS pour API bancaire
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Bank-ID, X-Request-ID");
header("Content-Type: application/json; charset=UTF-8");

// Réponse preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Log des requêtes
function logRequest($method, $endpoint, $bankId, $status) {
    $log = date('Y-m-d H:i:s') . " | $method $endpoint | Bank: $bankId | Status: $status" . PHP_EOL;
    file_put_contents(__DIR__ . '/bank_api.log', $log, FILE_APPEND | LOCK_EX);
}

require_once __DIR__ . '/../../../class/Paiement.php';
require_once __DIR__ . '/../../../class/BankAPI.php';

class BankPaymentAPI {
    private $paiementManager;
    private $bankAPI;
    private $bankId;
    private $requestId;
    
    public function __construct() {
        $this->paiementManager = new Paiement();
        $this->bankAPI = new BankAPI();
        $this->requestId = $_SERVER['HTTP_X_REQUEST_ID'] ?? uniqid();
        $this->authenticateBank();
    }
    
    /**
     * Authentification de la banque via API Key
     */
    private function authenticateBank() {
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
        $bankId = $_SERVER['HTTP_X_BANK_ID'] ?? '';
        
        if (empty($apiKey) || empty($bankId)) {
            $this->sendResponse(401, [
                "status" => "error",
                "code" => "MISSING_CREDENTIALS",
                "message" => "Authentification requise: X-API-Key et X-Bank-ID manquants",
                "request_id" => $this->requestId
            ]);
        }
        
        $authResult = $this->bankAPI->authenticateBank($bankId, $apiKey);
        if ($authResult['status'] !== 'success') {
            logRequest($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI'], $bankId, 'AUTH_FAILED');
            $this->sendResponse(401, array_merge($authResult, ['request_id' => $this->requestId]));
        }
        
        $this->bankId = $bankId;
        logRequest($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI'], $bankId, 'AUTH_SUCCESS');
    }
    
    /**
     * Router les requêtes
     */
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Extraire l'endpoint depuis l'URL
        $basePath = '/api/paiement-bancaire/';
        $endpoint = str_replace($basePath, '', $path);
        
        // Nettoyer les paramètres GET
        $endpoint = strtok($endpoint, '?');
        
        try {
            switch("$method $endpoint") {
                case "POST initier-paiement":
                    $this->initierPaiement();
                    break;
                    
                case "POST confirmer-paiement":
                    $this->confirmerPaiement();
                    break;
                    
                case "POST annuler-paiement":
                    $this->annulerPaiement();
                    break;
                    
                case "GET statut-paiement":
                    $this->getStatutPaiement();
                    break;
                    
                case "GET rechercher-declaration":
                    $this->rechercherDeclaration();
                    break;
                    
                case "GET docs":
                    $this->getDocumentation();
                    break;
                    
                case "GET webhook-config":
                    $this->getWebhookConfig();
                    break;
                    
                case "GET health":
                    $this->healthCheck();
                    break;
                    
                default:
                    $this->sendResponse(404, [
                        "status" => "error",
                        "message" => "Endpoint non trouvé. Consultez /api/paiement-bancaire/docs",
                        "request_id" => $this->requestId
                    ]);
            }
        } catch (Exception $e) {
            error_log("Erreur API Bancaire [$this->requestId]: " . $e->getMessage());
            logRequest($method, $endpoint, $this->bankId, 'ERROR');
            
            $this->sendResponse(500, [
                "status" => "error",
                "message" => "Erreur interne du serveur",
                "request_id" => $this->requestId
            ]);
        }
    }
    
    /**
     * Endpoint 1: Initier un paiement
     */
    private function initierPaiement() {
        $input = json_decode(file_get_contents("php://input"), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->sendResponse(400, [
                "status" => "error",
                "code" => "INVALID_JSON",
                "message" => "JSON invalide dans le corps de la requête",
                "request_id" => $this->requestId
            ]);
        }
        
        // Validation des champs requis
        $required = ['reference_declaration', 'methode_paiement', 'montant'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                $this->sendResponse(400, [
                    "status" => "error",
                    "code" => "MISSING_FIELD",
                    "message" => "Champ requis manquant: $field",
                    "request_id" => $this->requestId
                ]);
            }
        }
        
        // Rechercher la déclaration
        $declarationResult = $this->paiementManager->rechercherDeclaration($input['reference_declaration']);
        if ($declarationResult['status'] !== 'success') {
            $this->sendResponse(404, array_merge($declarationResult, ['request_id' => $this->requestId]));
        }
        
        $declaration = $declarationResult['data'];
        
        // Vérifier que la déclaration est en attente
        if ($declaration['statut'] !== 'en_attente') {
            $this->sendResponse(400, [
                "status" => "error",
                "code" => "DECLARATION_ALREADY_PAID",
                "message" => "Cette déclaration a déjà été traitée (statut: " . $declaration['statut'] . ")",
                "request_id" => $this->requestId
            ]);
        }
        
        // Vérifier le montant
        if ($declaration['montant'] != $input['montant']) {
            $this->sendResponse(400, [
                "status" => "error",
                "code" => "AMOUNT_MISMATCH",
                "message" => "Le montant ne correspond pas à la déclaration. Montant attendu: " . $declaration['montant'],
                "request_id" => $this->requestId
            ]);
        }
        
        // Initier le paiement côté banque
        $paymentData = [
            'reference_declaration' => $input['reference_declaration'],
            'montant' => $input['montant'],
            'methode_paiement' => $input['methode_paiement'],
            'bank_id' => $this->bankId,
            'donnees_contribuable' => [
                'nom' => $declaration['nom_contribuable'],
                'prenom' => $declaration['prenom_contribuable'] ?? '',
                'nif' => $declaration['nif_contribuable'],
                'email' => $declaration['donnees_json']['email'] ?? null,
                'telephone' => $declaration['donnees_json']['telephone'] ?? null
            ]
        ];
        
        $initiationResult = $this->bankAPI->initierPaiementBancaire($paymentData);
        
        if ($initiationResult['status'] === 'success') {
            // Enregistrer la tentative de paiement
            $tentativeId = $this->bankAPI->enregistrerTentativePaiement([
                'id_declaration' => $declaration['id'],
                'bank_id' => $this->bankId,
                'reference_bancaire' => $initiationResult['data']['reference_bancaire'],
                'montant' => $input['montant'],
                'statut' => 'initie',
                'donnees_initiation' => json_encode($initiationResult['data'])
            ]);
            
            if ($tentativeId) {
                $initiationResult['data']['tentative_id'] = $tentativeId;
            }
            
            logRequest('POST', 'initier-paiement', $this->bankId, 'SUCCESS');
        } else {
            logRequest('POST', 'initier-paiement', $this->bankId, 'FAILED');
        }
        
        $this->sendResponse(200, array_merge($initiationResult, ['request_id' => $this->requestId]));
    }
    
    /**
     * Endpoint 2: Confirmer un paiement
     */
    private function confirmerPaiement() {
        $input = json_decode(file_get_contents("php://input"), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->sendResponse(400, [
                "status" => "error",
                "code" => "INVALID_JSON", 
                "message" => "JSON invalide dans le corps de la requête",
                "request_id" => $this->requestId
            ]);
        }
        
        $required = ['reference_bancaire', 'reference_transaction', 'montant'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                $this->sendResponse(400, [
                    "status" => "error",
                    "code" => "MISSING_FIELD",
                    "message" => "Champ requis manquant: $field",
                    "request_id" => $this->requestId
                ]);
            }
        }
        
        // Confirmer le paiement côté banque
        $confirmationResult = $this->bankAPI->confirmerPaiementBancaire([
            'reference_bancaire' => $input['reference_bancaire'],
            'reference_transaction' => $input['reference_transaction'],
            'montant' => $input['montant'],
            'bank_id' => $this->bankId
        ]);
        
        if ($confirmationResult['status'] === 'success') {
            // Récupérer la tentative de paiement
            $tentative = $this->bankAPI->getTentativePaiement($input['reference_bancaire']);
            
            if ($tentative) {
                // Traiter le paiement dans notre système
                $paiementResult = $this->paiementManager->traiterPaiement(
                    $tentative['id_declaration'],
                    1, // ID méthode de paiement par défaut
                    0, // Pas de pénalités
                    $input['reference_transaction']
                );
                
                if ($paiementResult['status'] === 'success') {
                    // Mettre à jour le statut de la tentative
                    $this->bankAPI->mettreAJourStatutTentative(
                        $input['reference_bancaire'],
                        'complete',
                        json_encode($confirmationResult['data'])
                    );
                    
                    // Notifier le webhook de confirmation
                    $this->bankAPI->notifierWebhookConfirmation([
                        'reference_declaration' => $tentative['reference_declaration'],
                        'reference_transaction' => $input['reference_transaction'],
                        'montant' => $input['montant'],
                        'date_paiement' => date('Y-m-d H:i:s'),
                        'statut' => 'success'
                    ]);
                    
                    logRequest('POST', 'confirmer-paiement', $this->bankId, 'SUCCESS');
                } else {
                    logRequest('POST', 'confirmer-paiement', $this->bankId, 'SYSTEM_ERROR');
                }
            }
        } else {
            logRequest('POST', 'confirmer-paiement', $this->bankId, 'FAILED');
        }
        
        $this->sendResponse(200, array_merge($confirmationResult, ['request_id' => $this->requestId]));
    }
    
    /**
     * Endpoint 3: Annuler un paiement
     */
    private function annulerPaiement() {
        $input = json_decode(file_get_contents("php://input"), true);
        
        if (empty($input['reference_bancaire'])) {
            $this->sendResponse(400, [
                "status" => "error",
                "code" => "MISSING_REFERENCE",
                "message" => "Reference bancaire requise",
                "request_id" => $this->requestId
            ]);
        }
        
        $annulationResult = $this->bankAPI->annulerPaiementBancaire([
            'reference_bancaire' => $input['reference_bancaire'],
            'bank_id' => $this->bankId,
            'raison' => $input['raison'] ?? 'Annulation client'
        ]);
        
        if ($annulationResult['status'] === 'success') {
            // Mettre à jour le statut de la tentative
            $this->bankAPI->mettreAJourStatutTentative(
                $input['reference_bancaire'],
                'annule',
                json_encode($annulationResult['data'])
            );
            
            logRequest('POST', 'annuler-paiement', $this->bankId, 'SUCCESS');
        } else {
            logRequest('POST', 'annuler-paiement', $this->bankId, 'FAILED');
        }
        
        $this->sendResponse(200, array_merge($annulationResult, ['request_id' => $this->requestId]));
    }
    
    /**
     * Endpoint 4: Vérifier statut paiement
     */
    private function getStatutPaiement() {
        $reference = $_GET['reference'] ?? '';
        
        if (empty($reference)) {
            $this->sendResponse(400, [
                "status" => "error",
                "code" => "MISSING_REFERENCE",
                "message" => "Paramètre 'reference' requis",
                "request_id" => $this->requestId
            ]);
        }
        
        $statut = $this->bankAPI->getStatutPaiementBancaire($reference, $this->bankId);
        logRequest('GET', 'statut-paiement', $this->bankId, $statut['status']);
        
        $this->sendResponse(200, array_merge($statut, ['request_id' => $this->requestId]));
    }
    
    /**
     * Endpoint 5: Rechercher déclaration
     */
    private function rechercherDeclaration() {
        $reference = $_GET['reference'] ?? '';
        
        if (empty($reference)) {
            $this->sendResponse(400, [
                "status" => "error",
                "code" => "MISSING_REFERENCE",
                "message" => "Paramètre 'reference' requis",
                "request_id" => $this->requestId
            ]);
        }
        
        $result = $this->paiementManager->rechercherDeclaration($reference);
        logRequest('GET', 'rechercher-declaration', $this->bankId, $result['status']);
        
        $this->sendResponse($result['status'] === 'success' ? 200 : 404, 
            array_merge($result, ['request_id' => $this->requestId]));
    }
    
    /**
     * Endpoint 6: Documentation de l'API
     */
    private function getDocumentation() {
        $docs = [
            "status" => "success",
            "message" => "Documentation API Paiement Bancaire",
            "version" => "2.0",
            "base_url" => "https://api.mpako.net/api/paiement-bancaire",
            "authentication" => [
                "type" => "API Key",
                "headers" => [
                    "X-API-Key" => "Votre clé API secrète",
                    "X-Bank-ID" => "Votre identifiant bancaire"
                ]
            ],
            "endpoints" => [
                [
                    "method" => "POST",
                    "endpoint" => "/initier-paiement",
                    "description" => "Initier un nouveau paiement",
                    "body" => [
                        "reference_declaration" => "string (requis)",
                        "methode_paiement" => "string (requis)",
                        "montant" => "number (requis)"
                    ]
                ],
                [
                    "method" => "POST", 
                    "endpoint" => "/confirmer-paiement",
                    "description" => "Confirmer un paiement effectué",
                    "body" => [
                        "reference_bancaire" => "string (requis)",
                        "reference_transaction" => "string (requis)", 
                        "montant" => "number (requis)"
                    ]
                ],
                [
                    "method" => "POST",
                    "endpoint" => "/annuler-paiement", 
                    "description" => "Annuler un paiement en cours",
                    "body" => [
                        "reference_bancaire" => "string (requis)",
                        "raison" => "string (optionnel)"
                    ]
                ],
                [
                    "method" => "GET",
                    "endpoint" => "/statut-paiement?reference=REF",
                    "description" => "Vérifier le statut d'un paiement"
                ],
                [
                    "method" => "GET",
                    "endpoint" => "/rechercher-declaration?reference=REF", 
                    "description" => "Rechercher une déclaration"
                ]
            ],
            "codes_erreur" => [
                "AUTH_FAILED" => "Authentification échouée",
                "MISSING_FIELD" => "Champ requis manquant",
                "DECLARATION_ALREADY_PAID" => "Déclaration déjà payée",
                "AMOUNT_MISMATCH" => "Montant incorrect",
                "DAILY_LIMIT_EXCEEDED" => "Limite journalière atteinte"
            ]
        ];
        
        $this->sendResponse(200, $docs);
    }
    
    /**
     * Endpoint 7: Configuration webhook
     */
    private function getWebhookConfig() {
        $config = [
            "status" => "success",
            "data" => [
                "webhooks_requis" => [
                    [
                        "endpoint" => "confirmation_paiement",
                        "url" => "https://votre-banque.com/webhook/confirmation",
                        "method" => "POST",
                        "format" => "JSON",
                        "headers" => [
                            "Content-Type: application/json",
                            "X-Webhook-Signature: {signature}"
                        ],
                        "champs_obligatoires" => [
                            "reference_declaration",
                            "reference_transaction",
                            "montant", 
                            "date_paiement",
                            "statut"
                        ]
                    ]
                ],
                "signature" => [
                    "algorithme" => "HMAC-SHA256",
                    "secret" => "Utiliser le secret_webhook de votre configuration"
                ]
            ]
        ];
        
        $this->sendResponse(200, $config);
    }
    
    /**
     * Endpoint 8: Health check
     */
    private function healthCheck() {
        $health = [
            "status" => "success",
            "message" => "API Paiement Bancaire opérationnelle",
            "timestamp" => date('c'),
            "version" => "2.0",
            "environment" => "production"
        ];
        
        $this->sendResponse(200, $health);
    }
    
    private function sendResponse($code, $data) {
        header("X-Request-ID: " . $this->requestId);
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

// Lancement de l'API
try {
    $api = new BankPaymentAPI();
    $api->handleRequest();
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Erreur critique: " . $e->getMessage(),
        "request_id" => uniqid()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>