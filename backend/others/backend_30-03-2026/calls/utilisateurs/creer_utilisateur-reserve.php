<?php
/**
 * Script de création d'un nouvel utilisateur - MPako Gestion Fiscale
 */

// ======================================================================
// CONFIGURATION CORS ET EN-TÊTES
// ======================================================================
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// ======================================================================
// INCLUSIONS ET CONFIGURATION
// ======================================================================
require_once __DIR__ . '/../../class/Utilisateur.php';

// Configuration PHPMailer
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

require __DIR__ . '/../../vendor/autoload.php';

header('Content-Type: application/json');

// ======================================================================
// VALIDATION DE LA REQUÊTE HTTP
// ======================================================================
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée. Utilisez POST."]);
    exit;
}

// ======================================================================
// VALIDATION ET NETTOYAGE DES DONNÉES
// ======================================================================
$required_fields = ['nom_complet', 'telephone', 'site_affecte_id'];
$missing_fields = [];

foreach ($required_fields as $field) {
    if (!isset($_POST[$field]) || empty(trim($_POST[$field]))) {
        $missing_fields[] = $field;
    }
}

if (!empty($missing_fields)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error", 
        "message" => "Champs obligatoires manquants: " . implode(', ', $missing_fields)
    ]);
    exit;
}

// Nettoyage des données
$nomComplet = trim(htmlspecialchars($_POST['nom_complet'], ENT_QUOTES, 'UTF-8'));
$telephone = trim(htmlspecialchars($_POST['telephone'], ENT_QUOTES, 'UTF-8'));
$adresse = isset($_POST['adresse']) ? trim(htmlspecialchars($_POST['adresse'], ENT_QUOTES, 'UTF-8')) : '';
$siteAffecteId = (int)$_POST['site_affecte_id'];

// Validation supplémentaire du téléphone
if (!preg_match('/^\+?[0-9\s\-\(\)]{8,20}$/', $telephone)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Le format du téléphone est invalide."]);
    exit;
}

// ======================================================================
// FONCTION DE GÉNÉRATION DE MOT DE PASSE
// ======================================================================
function genererMotDePasse($longueur = 8) {
    $caracteres = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&';
    $motDePasse = '';
    $max = strlen($caracteres) - 1;
    
    for ($i = 0; $i < $longueur; $i++) {
        $motDePasse .= $caracteres[random_int(0, $max)];
    }
    
    return $motDePasse;
}

// ======================================================================
// FONCTION D'ENVOI D'EMAIL
// ======================================================================
function envoyerEmailCredentials($email, $nomComplet, $motDePasse, $telephone) {
    try {
        $mail = new PHPMailer(true);

        // Configuration du serveur
        $mail->isSMTP();
        $mail->Host = 'mail.mpako.net';
        $mail->SMTPAuth = true;
        $mail->Username = 'contact@mpako.net';
        $mail->Password = 'wU9-Mhb$VW45EgK';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port = 465;
        $mail->CharSet = 'UTF-8';

        // Expéditeur et destinataire
        $mail->setFrom('contact@mpako.net', 'MPako Gestion Fiscale');
        $mail->addAddress($email, $nomComplet);
        
        // Contenu de l'email
        $mail->isHTML(true);
        $mail->Subject = 'Votre compte MPako Gestion Fiscale - Informations de connexion';
        
        // Template HTML épuré et professionnel
        $mail->Body = "
        <!DOCTYPE html>
        <html lang='fr'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Votre compte MPako</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Arial, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    margin: 0; 
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: white; 
                    padding: 30px; 
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .header { 
                    text-align: center; 
                    border-bottom: 3px solid #2c5aa0; 
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .logo { 
                    color: #2c5aa0; 
                    font-size: 28px; 
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .slogan {
                    color: #666;
                    font-style: italic;
                    font-size: 14px;
                }
                .content { 
                    margin: 20px 0; 
                }
                .credentials {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 5px;
                    border-left: 4px solid #2c5aa0;
                    margin: 20px 0;
                }
                .credential-item {
                    margin: 10px 0;
                    padding: 8px 0;
                }
                .label {
                    font-weight: bold;
                    color: #2c5aa0;
                }
                .important {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .footer { 
                    text-align: center; 
                    margin-top: 30px; 
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #666;
                    font-size: 12px;
                }
                .button {
                    display: inline-block;
                    background: #2c5aa0;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <div class='logo'>MPAKO</div>
                    <div class='slogan'>Gestion Fiscale Moderne et Intuitive</div>
                </div>
                
                <div class='content'>
                    <h2>Bienvenue sur MPako, $nomComplet !</h2>
                    
                    <p>Votre compte administrateur a été créé avec succès sur notre plateforme de gestion fiscale.</p>
                    
                    <div class='credentials'>
                        <h3>Vos identifiants de connexion :</h3>
                        
                        <div class='credential-item'>
                            <span class='label'>Plateforme :</span><br>
                            <a href='https://mpako.vercel.app/' style='color: #2c5aa0;'>https://mpako.vercel.app/</a>
                        </div>
                        
                        <div class='credential-item'>
                            <span class='label'>Téléphone :</span><br>
                            $telephone
                        </div>
                        
                        <div class='credential-item'>
                            <span class='label'>Mot de passe temporaire :</span><br>
                            <strong style='font-size: 18px; color: #d35400;'>$motDePasse</strong>
                        </div>
                    </div>
                    
                    <div class='important'>
                        <strong>🔒 Sécurité importante :</strong><br>
                        • Changez votre mot de passe après votre première connexion<br>
                        • Ne partagez jamais vos identifiants<br>
                        • Utilisez un mot de passe fort et unique
                    </div>
                    
                    <p>Vous pourrez :</p>
                    <ul>
                        <li>Effectuer des ventes et transactions</li>
                        <li>Générer des déclarations fiscales</li>
                        <li>Suivre les contributions des contribuables</li>
                        <li>Consulter les statistiques en temps réel</li>
                    </ul>
                    
                    <div style='text-align: center;'>
                        <a href='https://mpako.vercel.app/' class='button'>Accéder à MPako</a>
                    </div>
                </div>
                
                <div class='footer'>
                    <p>© " . date('Y') . " MPako Gestion Fiscale. Tous droits réservés.</p>
                    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                    <p>Si vous n'êtes pas à l'origine de cette création de compte, veuillez nous contacter immédiatement.</p>
                </div>
            </div>
        </body>
        </html>
        ";

        // Version texte pour les clients email simples
        $mail->AltBody = "
        MPAKO - Gestion Fiscale Moderne et Intuitive

        Bienvenue sur MPako, $nomComplet !

        Votre compte administrateur a été créé avec succès.

        INFORMATIONS DE CONNEXION :
        Plateforme : https://mpako.vercel.app/
        Téléphone : $telephone
        Mot de passe temporaire : $motDePasse

        🔒 SÉCURITÉ IMPORTANTE :
        - Changez votre mot de passe après votre première connexion
        - Ne partagez jamais vos identifiants

        FONCTIONNALITÉS DISPONIBLES :
        • Effectuer des ventes et transactions
        • Générer des déclarations fiscales
        • Suivre les contributions des contribuables
        • Consulter les statistiques en temps réel

        Accédez à votre compte : https://mpako.vercel.app/

        © " . date('Y') . " MPako Gestion Fiscale. Tous droits réservés.
        ";

        $mail->send();
        return true;
        
    } catch (Exception $e) {
        error_log("Erreur d'envoi d'email: " . $mail->ErrorInfo);
        return false;
    }
}

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================
try {
    // Instanciation de la classe Utilisateur
    $utilisateurManager = new Utilisateur();

    // Génération du mot de passe
    $motDePasseClair = genererMotDePasse(8);
    $motDePasseHash = password_hash($motDePasseClair, PASSWORD_DEFAULT);

    // Création de l'utilisateur
    $result = $utilisateurManager->ajouterUtilisateur(
        $nomComplet, 
        $telephone, 
        $adresse, 
        $siteAffecteId, 
        $motDePasseHash
    );

    // Vérifier si l'utilisateur a été créé avec succès
    if ($result['status'] === 'success') {
        // Tentative d'envoi de l'email
        $emailEnvoye = envoyerEmailCredentials(
            'contact@mpako.net', // À adapter selon votre logique métier
            $nomComplet,
            $motDePasseClair,
            $telephone
        );

        if ($emailEnvoye) {
            $finalMessage = "Utilisateur ajouté avec succès. Les identifiants ont été envoyés par email.";
        } else {
            $finalMessage = "Utilisateur ajouté avec succès, mais l'envoi de l'email a échoué.";
        }

        // Retourner la réponse finale
        echo json_encode([
            "status" => "success",
            "message" => $finalMessage,
            "user_id" => $result['user_id'] ?? null
        ]);
    } else {
        // Retourner l'erreur de la méthode ajouterUtilisateur
        echo json_encode([
            "status" => "error",
            "message" => $result['message']
        ]);
    }

} catch (Exception $e) {
    error_log("Erreur critique lors de l'ajout d'utilisateur: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système: Impossible de traiter la requête."
    ]);
}