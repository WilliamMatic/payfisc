<?php
require_once 'Connexion.php';

/**
 * Classe Authentification - Gestion de l'authentification des utilisateurs
 * 
 * Cette classe étend la classe Connexion et fournit les fonctionnalités
 * d'authentification des utilisateurs par nom complet et mot de passe.
 * Elle gère :
 * - Vérification des identifiants
 * - Vérification du statut actif
 * - Création de session
 * - Logs d'audit
 */
class Authentification extends Connexion
{
    /**
     * Authentifie un utilisateur par nom complet et mot de passe
     *
     * @param string $nomComplet Nom complet de l'utilisateur
     * @param string $password Mot de passe en clair
     * @return array Tableau avec statut, message et données de l'utilisateur
     */
    public function authentifierUtilisateur($nomComplet, $password)
    {
        // ============ VALIDATION DES DONNÉES ============
        if (empty($nomComplet) || empty($password)) {
            return ["status" => "error", "message" => "Le nom complet et le mot de passe sont obligatoires."];
        }

        try {
            // ============ RÉCUPÉRATION DES DONNÉES UTILISATEUR ============
            $sql = "SELECT u.*, s.id as site_id, s.nom as site_nom, s.code as site_code, s.province_id as province_id
                    FROM utilisateurs u 
                    INNER JOIN sites s ON u.site_affecte_id = s.id 
                    WHERE u.nom_complet = :nom_complet";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['nom_complet' => $nomComplet]);
            $utilisateurData = $stmt->fetch(PDO::FETCH_ASSOC);

            // ============ VÉRIFICATION DE L'EXISTENCE ============
            if (!$utilisateurData) {
                return ["status" => "error", "message" => "Identifiants incorrects."];
            }

            // ============ VÉRIFICATION DU STATUT ACTIF ============
            if (!$utilisateurData['actif']) {
                return ["status" => "error", "message" => "Votre compte est désactivé. Contactez l'administrateur."];
            }

            // ============ VÉRIFICATION DU MOT DE PASSE ============
            if (!password_verify($password, $utilisateurData['password'])) {
                return ["status" => "error", "message" => "Identifiants incorrects."];
            }

            // ============ DÉCODAGE DES PRIVILÈGES ============
            $privileges = json_decode($utilisateurData['privilege_json'], true) ?? [
                'simple' => false,
                'special' => false,
                'delivrance' => false,
                'plaque' => false,
                'reproduction' => false
            ];

            // ============ CRÉATION DE LA SESSION ============
            session_start();
            $_SESSION['user_id'] = $utilisateurData['id'];
            $_SESSION['user_nom'] = $utilisateurData['nom_complet'];
            $_SESSION['user_telephone'] = $utilisateurData['telephone'];
            $_SESSION['user_type'] = 'utilisateur';
            $_SESSION['site_affecte_id'] = $utilisateurData['site_affecte_id'];
            $_SESSION['site_nom'] = $utilisateurData['site_nom'];
            $_SESSION['province_id'] = $utilisateurData['province_id'];
            $_SESSION['privileges'] = $privileges;

            // ============ JOURNALISATION ============
            $this->logAudit("Connexion de l'utilisateur ID " . $utilisateurData['id'] . ": " . $utilisateurData['nom_complet']);

            // ============ PRÉPARATION DE LA RÉPONSE ============
            $response = [
                "status" => "success",
                "message" => "Connexion réussie.",
                "data" => [
                    "utilisateur" => [
                        "id" => $utilisateurData['id'],
                        "nom_complet" => $utilisateurData['nom_complet'],
                        "telephone" => $utilisateurData['telephone'],
                        "adresse" => $utilisateurData['adresse'],
                        "site_id" => $utilisateurData['site_id'],
                        "site_nom" => $utilisateurData['site_nom'],
                        "site_code" => $utilisateurData['site_code'],
                        "province_id" => $utilisateurData['province_id'],
                        "privileges" => $privileges,
                        "actif" => (bool)$utilisateurData['actif'],
                        "date_creation" => $utilisateurData['date_creation'],
                        "date_modification" => $utilisateurData['date_modification']
                    ]
                ]
            ];

            return $response;

        } catch (PDOException $e) {
            error_log("Erreur lors de l'authentification: " . $e->getMessage());
            return ["status" => "error", "message" => "Erreur système lors de l'authentification."];
        }
    }

    /**
     * Log une action dans le journal d'audit
     *
     * @param string $message Message à logger
     * @return void
     */
    private function logAudit($message)
    {
        try {
            $userId = $_SESSION['user_id'] ?? 'system';
            $userType = $_SESSION['user_type'] ?? 'system';
            
            // Vérifie si la table audit_log existe
            $tableExists = $this->pdo->query("SHOW TABLES LIKE 'audit_log'")->rowCount() > 0;
            
            if ($tableExists) {
                $sql = "INSERT INTO audit_log (user_id, user_type, action, timestamp) 
                        VALUES (:user_id, :user_type, :action, NOW())";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([
                    ':user_id' => $userId,
                    ':user_type' => $userType,
                    ':action' => $message
                ]);
            } else {
                // Log dans les erreurs PHP si la table n'existe pas
                error_log("AUDIT: " . $message);
            }
        } catch (Exception $e) {
            error_log("Erreur lors du log audit: " . $e->getMessage());
        }
    }
}