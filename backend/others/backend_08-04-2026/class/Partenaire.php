<?php
require_once 'Connexion.php';

/**
 * Classe Partenaire - Gestion complète des partenaires bancaires
 */
class Partenaire extends Connexion
{
    /**
     * Vérifie l'existence d'un partenaire par son bank_id
     */
    public function partenaireExisteParBankId($bankId)
    {
        try {
            $sql = "SELECT bp.id, bp.partenaire_id, bp.bank_id, bp.api_key, bp.actif, bp.suspendu, 
                           bp.limite_transaction_journaliere, bp.limite_transaction_mensuelle,
                           bp.montant_minimum, bp.montant_maximum, bp.date_expiration,
                           p.nom, p.type_partenaire, p.en_maintenance, p.ip_whitelist,
                           bp.ip_autorisees, bp.user_agent_autorises
                    FROM banques_partenaire bp
                    INNER JOIN partenaires p ON bp.partenaire_id = p.id
                    WHERE bp.bank_id = :bank_id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['bank_id' => $bankId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification du partenaire: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Authentifie un partenaire avec bank_id et api_key
     */
    public function authentifierPartenaire($bankId, $apiKey)
    {
        try {
            $partenaire = $this->partenaireExisteParBankId($bankId);
            
            if (!$partenaire) {
                return ["status" => "error", "message" => "Partenaire non trouvé", "code" => "PARTNER_NOT_FOUND"];
            }

            // Vérification de l'API Key
            if (!hash_equals($partenaire['api_key'], $apiKey)) {
                return ["status" => "error", "message" => "Clé API invalide", "code" => "INVALID_API_KEY"];
            }

            // Vérification du statut actif
            if (!$partenaire['actif']) {
                return ["status" => "error", "message" => "Partenaire inactif", "code" => "PARTNER_INACTIVE"];
            }

            // Vérification de la suspension
            if ($partenaire['suspendu']) {
                return ["status" => "error", "message" => "Partenaire suspendu", "code" => "PARTNER_SUSPENDED"];
            }

            // Vérification de la maintenance
            if ($partenaire['en_maintenance']) {
                return ["status" => "error", "message" => "Partenaire en maintenance", "code" => "PARTNER_MAINTENANCE"];
            }

            // Vérification de l'expiration
            if ($partenaire['date_expiration'] && strtotime($partenaire['date_expiration']) < time()) {
                return ["status" => "error", "message" => "Clé API expirée", "code" => "API_KEY_EXPIRED"];
            }

            // Mise à jour du dernier accès
            $this->mettreAJourDernierAcces($partenaire['id']);

            return [
                "status" => "success", 
                "message" => "Authentification réussie",
                "data" => [
                    "partenaire_id" => $partenaire['partenaire_id'],
                    "bank_id" => $partenaire['bank_id'],
                    "nom" => $partenaire['nom'],
                    "type_partenaire" => $partenaire['type_partenaire'],
                    "limites" => [
                        "journaliere" => $partenaire['limite_transaction_journaliere'],
                        "mensuelle" => $partenaire['limite_transaction_mensuelle'],
                        "minimum" => $partenaire['montant_minimum'],
                        "maximum" => $partenaire['montant_maximum']
                    ]
                ]
            ];

        } catch (PDOException $e) {
            error_log("Erreur lors de l'authentification du partenaire: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie les restrictions IP et User-Agent
     */
    public function verifierRestrictions($bankId, $ip, $userAgent)
    {
        try {
            $partenaire = $this->partenaireExisteParBankId($bankId);
            
            if (!$partenaire) {
                return ["status" => "error", "message" => "Partenaire non trouvé", "code" => "PARTNER_NOT_FOUND"];
            }

            // Vérification des IPs autorisées
            $ipAutorisees = json_decode($partenaire['ip_autorisees'] ?? '[]', true);
            $ipWhitelist = json_decode($partenaire['ip_whitelist'] ?? '[]', true);
            
            $allIpAutorisees = array_merge($ipAutorisees, $ipWhitelist);
            
            if (!empty($allIpAutorisees)) {
                $ipTrouvee = false;
                foreach ($allIpAutorisees as $ipRange) {
                    if ($this->ipInRange($ip, $ipRange)) {
                        $ipTrouvee = true;
                        break;
                    }
                }
                if (!$ipTrouvee) {
                    return ["status" => "error", "message" => "Adresse IP non autorisée", "code" => "IP_NOT_AUTHORIZED"];
                }
            }

            // Vérification des User-Agents autorisés
            $userAgentAutorises = json_decode($partenaire['user_agent_autorises'] ?? '[]', true);
            if (!empty($userAgentAutorises)) {
                $uaTrouve = false;
                foreach ($userAgentAutorises as $uaPattern) {
                    if (stripos($userAgent, $uaPattern) !== false) {
                        $uaTrouve = true;
                        break;
                    }
                }
                if (!$uaTrouve) {
                    return ["status" => "error", "message" => "User-Agent non autorisé", "code" => "USER_AGENT_NOT_AUTHORIZED"];
                }
            }

            return ["status" => "success", "message" => "Restrictions vérifiées"];

        } catch (PDOException $e) {
            error_log("Erreur lors de la vérification des restrictions: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie si une IP est dans une plage donnée
     */
    private function ipInRange($ip, $range)
    {
        if (strpos($range, '/') !== false) {
            // Notation CIDR
            list($subnet, $bits) = explode('/', $range);
            $ip = ip2long($ip);
            $subnet = ip2long($subnet);
            $mask = -1 << (32 - $bits);
            return ($ip & $mask) == ($subnet & $mask);
        } else {
            // IP simple
            return $ip === $range;
        }
    }

    /**
     * Met à jour la date du dernier accès
     */
    private function mettreAJourDernierAcces($id)
    {
        try {
            $sql = "UPDATE banques_partenaire SET dernier_acces = NOW() WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['id' => $id]);
        } catch (PDOException $e) {
            error_log("Erreur lors de la mise à jour du dernier accès: " . $e->getMessage());
        }
    }

    /**
     * Ajoute un nouveau partenaire
     */
    public function ajouterPartenaire($data)
    {
        try {
            $this->pdo->beginTransaction();

            // Insertion dans la table partenaires
            $sqlPartenaire = "INSERT INTO partenaires 
                (type_partenaire, nom, code_swift, code_banque, pays, ville, adresse, 
                 telephone, email, site_web, contact_principal, logo_url, base_url_api, 
                 timeout_api, retry_attempts, ip_whitelist, raison_sociale) 
                VALUES 
                (:type_partenaire, :nom, :code_swift, :code_banque, :pays, :ville, :adresse,
                 :telephone, :email, :site_web, :contact_principal, :logo_url, :base_url_api,
                 :timeout_api, :retry_attempts, :ip_whitelist, :raison_sociale)";

            $stmtPartenaire = $this->pdo->prepare($sqlPartenaire);
            $stmtPartenaire->execute([
                ':type_partenaire' => $data['type_partenaire'],
                ':nom' => $data['nom'],
                ':code_swift' => $data['code_swift'] ?? null,
                ':code_banque' => $data['code_banque'] ?? null,
                ':pays' => $data['pays'] ?? 'Sénégal',
                ':ville' => $data['ville'] ?? null,
                ':adresse' => $data['adresse'] ?? null,
                ':telephone' => $data['telephone'] ?? null,
                ':email' => $data['email'] ?? null,
                ':site_web' => $data['site_web'] ?? null,
                ':contact_principal' => $data['contact_principal'] ?? null,
                ':logo_url' => $data['logo_url'] ?? null,
                ':base_url_api' => $data['base_url_api'] ?? null,
                ':timeout_api' => $data['timeout_api'] ?? 30,
                ':retry_attempts' => $data['retry_attempts'] ?? 3,
                ':ip_whitelist' => json_encode($data['ip_whitelist'] ?? []),
                ':raison_sociale' => $data['raison_sociale'] ?? null
            ]);

            $partenaireId = $this->pdo->lastInsertId();

            // Génération des identifiants API
            $bankId = $this->genererBankId($data['nom']);
            $apiKey = $this->genererApiKey();

            // Insertion dans la table banques_partenaire
            $sqlBanque = "INSERT INTO banques_partenaire 
                (partenaire_id, bank_id, api_key, api_secret, permissions,
                 limite_transaction_journaliere, limite_transaction_mensuelle,
                 montant_minimum, montant_maximum, url_webhook_confirmation,
                 url_webhook_annulation, secret_webhook, date_expiration,
                 ip_autorisees, user_agent_autorises) 
                VALUES 
                (:partenaire_id, :bank_id, :api_key, :api_secret, :permissions,
                 :limite_journaliere, :limite_mensuelle, :montant_minimum, 
                 :montant_maximum, :webhook_confirmation, :webhook_annulation,
                 :secret_webhook, :date_expiration, :ip_autorisees, :user_agent_autorises)";

            $stmtBanque = $this->pdo->prepare($sqlBanque);
            $stmtBanque->execute([
                ':partenaire_id' => $partenaireId,
                ':bank_id' => $bankId,
                ':api_key' => $apiKey,
                ':api_secret' => $data['api_secret'] ?? null,
                ':permissions' => json_encode($data['permissions'] ?? ['paiement_impots']),
                ':limite_journaliere' => $data['limite_transaction_journaliere'] ?? 10000000.00,
                ':limite_mensuelle' => $data['limite_transaction_mensuelle'] ?? 100000000.00,
                ':montant_minimum' => $data['montant_minimum'] ?? 100.00,
                ':montant_maximum' => $data['montant_maximum'] ?? 5000000.00,
                ':webhook_confirmation' => $data['url_webhook_confirmation'] ?? null,
                ':webhook_annulation' => $data['url_webhook_annulation'] ?? null,
                ':secret_webhook' => $data['secret_webhook'] ?? null,
                ':date_expiration' => $data['date_expiration'] ?? null,
                ':ip_autorisees' => json_encode($data['ip_autorisees'] ?? []),
                ':user_agent_autorises' => json_encode($data['user_agent_autorises'] ?? [])
            ]);

            $this->pdo->commit();

            $this->logAudit("Ajout du partenaire ID $partenaireId: {$data['nom']} - Bank ID: $bankId");

            return [
                "status" => "success", 
                "message" => "Partenaire ajouté avec succès",
                "data" => [
                    "partenaire_id" => $partenaireId,
                    "bank_id" => $bankId,
                    "api_key" => $apiKey
                ]
            ];

        } catch (PDOException $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de l'ajout du partenaire: " . $e->getMessage());
            
            if ($e->getCode() == '23000') {
                return ["status" => "error", "message" => "Ce partenaire existe déjà."];
            }
            
            return ["status" => "error", "message" => "Erreur système: " . $e->getMessage()];
        }
    }

    /**
     * Génère un Bank ID unique
     */
    private function genererBankId($nom)
    {
        $prefix = substr(strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $nom)), 0, 3);
        $timestamp = time();
        $random = mt_rand(1000, 9999);
        
        return $prefix . $timestamp . $random;
    }

    /**
     * Génère une clé API sécurisée
     */
    private function genererApiKey()
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * Récupère la liste de tous les partenaires
     */
    public function listerPartenaires()
    {
        try {
            $sql = "SELECT p.id, p.nom, p.type_partenaire, p.code_banque, p.telephone, p.email,
                    p.actif, p.en_maintenance, 
                    bp.bank_id, bp.total_transactions, bp.total_montant,
                    DATE_FORMAT(p.date_creation, '%d/%m/%Y') as date_creation 
                    FROM partenaires p
                    LEFT JOIN banques_partenaire bp ON p.id = bp.partenaire_id
                    ORDER BY p.nom ASC";
            $stmt = $this->pdo->query($sql);
            $resultats = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ["status" => "success", "data" => $resultats];

        } catch (PDOException $e) {
            error_log("Erreur lors du listing des partenaires: " . $e->getMessage());
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