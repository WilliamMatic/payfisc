<?php
require_once 'Connexion.php';

/**
 * Classe Profile - Gestion complète des profils utilisateurs
 */
class Profile extends Connexion
{
    /**
     * Met à jour le profil d'un utilisateur
     */
    public function mettreAJourProfil($profileData)
    {
        try {
            $this->pdo->beginTransaction();

            // 1. Vérifier que l'utilisateur existe
            $utilisateurExiste = $this->verifierUtilisateurExiste($profileData['user_id']);
            if (!$utilisateurExiste) {
                throw new Exception("Utilisateur non trouvé.");
            }

            // 2. Vérifier les contraintes d'unicité
            $contraintes = $this->verifierContraintesUnicite($profileData);
            if ($contraintes['status'] === 'error') {
                throw new Exception($contraintes['message']);
            }

            // 3. Mettre à jour le profil
            $sql = "UPDATE particuliers SET 
                    nom = :nom,
                    prenom = :prenom,
                    date_naissance = :date_naissance,
                    lieu_naissance = :lieu_naissance,
                    sexe = :sexe,
                    rue = :rue,
                    ville = :ville,
                    code_postal = :code_postal,
                    province = :province,
                    telephone = :telephone,
                    email = :email,
                    nif = :nif,
                    dependants = :dependants,
                    date_modification = CURRENT_TIMESTAMP
                    WHERE id = :user_id";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nom' => $profileData['nom'],
                ':prenom' => $profileData['prenom'],
                ':date_naissance' => $profileData['date_naissance'],
                ':lieu_naissance' => $profileData['lieu_naissance'],
                ':sexe' => $profileData['sexe'],
                ':rue' => $profileData['rue'],
                ':ville' => $profileData['ville'],
                ':code_postal' => $profileData['code_postal'],
                ':province' => $profileData['province'],
                ':telephone' => $profileData['telephone'],
                ':email' => $profileData['email'],
                ':nif' => $profileData['nif'],
                ':dependants' => $profileData['dependants'],
                ':user_id' => $profileData['user_id']
            ]);

            if ($stmt->rowCount() === 0) {
                throw new Exception("Aucune modification effectuée.");
            }

            // 4. Récupérer les données mises à jour
            $profilMisAJour = $this->getProfilParId($profileData['user_id']);
            if (!$profilMisAJour) {
                throw new Exception("Erreur lors de la récupération du profil mis à jour.");
            }

            $this->pdo->commit();

            // 5. Enregistrer la notification
            $this->enregistrerNotification(
                'profil_updated',
                'Profil mis à jour',
                "Profil utilisateur mis à jour - " . $profileData['prenom'] . " " . $profileData['nom'],
                $profilMisAJour['nif'],
                null,
                null
            );

            return [
                'status' => 'success',
                'message' => 'Profil mis à jour avec succès',
                'data' => $profilMisAJour
            ];

        } catch (Exception $e) {
            $this->pdo->rollBack();
            error_log("Erreur lors de la mise à jour du profil: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Vérifie que l'utilisateur existe
     */
    private function verifierUtilisateurExiste($userId)
    {
        try {
            $sql = "SELECT id FROM particuliers WHERE id = :user_id AND actif = 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':user_id' => $userId]);
            return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
        } catch (PDOException $e) {
            error_log("Erreur vérification utilisateur: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie les contraintes d'unicité
     */
    private function verifierContraintesUnicite($profileData)
    {
        try {
            // Vérification téléphone
            if (!$this->estTelephoneDisponible($profileData['telephone'], $profileData['user_id'])) {
                return [
                    'status' => 'error',
                    'message' => 'Ce numéro de téléphone est déjà utilisé par un autre utilisateur.'
                ];
            }

            // Vérification email (si fourni)
            if (!empty($profileData['email']) && !$this->estEmailDisponible($profileData['email'], $profileData['user_id'])) {
                return [
                    'status' => 'error',
                    'message' => 'Cette adresse email est déjà utilisée par un autre utilisateur.'
                ];
            }

            // Vérification NIF
            if (!$this->estNIFDisponible($profileData['nif'], $profileData['user_id'])) {
                return [
                    'status' => 'error',
                    'message' => 'Ce NIF est déjà utilisé par un autre utilisateur.'
                ];
            }

            return ['status' => 'success'];

        } catch (PDOException $e) {
            error_log("Erreur vérification contraintes unicité: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie si un téléphone est disponible
     */
    public function estTelephoneDisponible($telephone, $userId)
    {
        try {
            $sql = "SELECT id FROM particuliers WHERE telephone = :telephone AND id != :user_id AND actif = 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':telephone' => $telephone,
                ':user_id' => $userId
            ]);
            return $stmt->fetch(PDO::FETCH_ASSOC) === false;
        } catch (PDOException $e) {
            error_log("Erreur vérification téléphone: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie si un email est disponible
     */
    public function estEmailDisponible($email, $userId)
    {
        try {
            $sql = "SELECT id FROM particuliers WHERE email = :email AND id != :user_id AND actif = 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':email' => $email,
                ':user_id' => $userId
            ]);
            return $stmt->fetch(PDO::FETCH_ASSOC) === false;
        } catch (PDOException $e) {
            error_log("Erreur vérification email: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Vérifie si un NIF est disponible
     */
    public function estNIFDisponible($nif, $userId)
    {
        try {
            $sql = "SELECT id FROM particuliers WHERE nif = :nif AND id != :user_id AND actif = 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':nif' => $nif,
                ':user_id' => $userId
            ]);
            return $stmt->fetch(PDO::FETCH_ASSOC) === false;
        } catch (PDOException $e) {
            error_log("Erreur vérification NIF: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Récupère un profil par son ID
     */
    private function getProfilParId($userId)
    {
        try {
            $sql = "SELECT 
                    id, nom, prenom, date_naissance, lieu_naissance, sexe,
                    rue, ville, code_postal, province, id_national, telephone,
                    email, nif, dependants, photo, actif
                    FROM particuliers 
                    WHERE id = :user_id AND actif = 1";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([':user_id' => $userId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Erreur récupération profil: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Met à jour la photo de profil
     */
    public function mettreAJourPhotoProfil($userId, $photoPath)
    {
        try {
            $sql = "UPDATE particuliers SET 
                    photo = :photo,
                    date_modification = CURRENT_TIMESTAMP
                    WHERE id = :user_id AND actif = 1";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':photo' => $photoPath,
                ':user_id' => $userId
            ]);

            if ($stmt->rowCount() === 0) {
                throw new Exception("Échec de la mise à jour de la photo.");
            }

            return [
                'status' => 'success',
                'message' => 'Photo de profil mise à jour avec succès',
                'data' => ['photo' => $photoPath]
            ];

        } catch (Exception $e) {
            error_log("Erreur mise à jour photo: " . $e->getMessage());
            return [
                'status' => 'error',
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Enregistre une notification
     */
    private function enregistrerNotification($type, $titre, $message, $nif = null, $idDeclaration = null, $idPaiement = null)
    {
        try {
            $sql = "INSERT INTO notifications 
                    (type_notification, nif_contribuable, id_declaration, id_paiement, titre, message, date_creation) 
                    VALUES 
                    (:type, :nif, :id_declaration, :id_paiement, :titre, :message, NOW())";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':type' => $type,
                ':nif' => $nif,
                ':id_declaration' => $idDeclaration,
                ':id_paiement' => $idPaiement,
                ':titre' => $titre,
                ':message' => $message,
            ]);
        } catch (PDOException $e) {
            error_log("Erreur enregistrement notification: " . $e->getMessage());
        }
    }
}
?>