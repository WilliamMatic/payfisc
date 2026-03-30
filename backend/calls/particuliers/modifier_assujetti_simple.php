<?php
/**
 * Modification simplifiée d'un assujetti (nom_complet, telephone, adresse, nif, email)
 * Utilisé depuis les modals de détails (suppression-vignette, suppression-controle-technique)
 */

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée"]);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE || !$data) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(["status" => "error", "message" => "Données JSON invalides"]);
    exit;
}

$id = isset($data['id']) ? (int)$data['id'] : 0;
if ($id <= 0) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(["status" => "error", "message" => "ID du particulier requis"]);
    exit;
}

$nomComplet = trim($data['nom_complet'] ?? '');
if (empty($nomComplet)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(["status" => "error", "message" => "Le nom complet est requis"]);
    exit;
}

header('Content-Type: application/json');

try {
    $pdo = new PDO("mysql:host=localhost;dbname=payfisc", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Vérifier que le particulier existe
    $sqlCheck = "SELECT id FROM particuliers WHERE id = :id LIMIT 1";
    $stmtCheck = $pdo->prepare($sqlCheck);
    $stmtCheck->bindValue(':id', $id, PDO::PARAM_INT);
    $stmtCheck->execute();
    if (!$stmtCheck->fetch()) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Particulier non trouvé"]);
        exit;
    }

    // Séparer nom_complet en nom + prenom
    $parts = explode(' ', $nomComplet, 2);
    $nom = $parts[0];
    $prenom = $parts[1] ?? '';

    $telephone = trim($data['telephone'] ?? '');
    $adresse = trim($data['adresse'] ?? '');
    $nif = trim($data['nif'] ?? '');
    $email = trim($data['email'] ?? '');

    // Validation email si fourni
    if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Adresse email invalide"]);
        exit;
    }

    // Vérifier unicité téléphone si fourni
    if (!empty($telephone)) {
        $sqlTel = "SELECT id FROM particuliers WHERE telephone = :tel AND id != :id LIMIT 1";
        $stmtTel = $pdo->prepare($sqlTel);
        $stmtTel->bindValue(':tel', $telephone, PDO::PARAM_STR);
        $stmtTel->bindValue(':id', $id, PDO::PARAM_INT);
        $stmtTel->execute();
        if ($stmtTel->fetch()) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Ce numéro de téléphone est déjà utilisé"]);
            exit;
        }
    }

    // Vérifier unicité NIF si fourni
    if (!empty($nif)) {
        $sqlNif = "SELECT id FROM particuliers WHERE nif = :nif AND id != :id LIMIT 1";
        $stmtNif = $pdo->prepare($sqlNif);
        $stmtNif->bindValue(':nif', $nif, PDO::PARAM_STR);
        $stmtNif->bindValue(':id', $id, PDO::PARAM_INT);
        $stmtNif->execute();
        if ($stmtNif->fetch()) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Ce NIF est déjà utilisé"]);
            exit;
        }
    }

    // Mise à jour
    $sql = "UPDATE particuliers SET nom = :nom, prenom = :prenom, telephone = :telephone, rue = :adresse, nif = :nif, email = :email WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':nom', $nom, PDO::PARAM_STR);
    $stmt->bindValue(':prenom', $prenom, PDO::PARAM_STR);
    $stmt->bindValue(':telephone', $telephone, PDO::PARAM_STR);
    $stmt->bindValue(':adresse', $adresse, PDO::PARAM_STR);
    $stmt->bindValue(':nif', $nif, PDO::PARAM_STR);
    $stmt->bindValue(':email', $email, PDO::PARAM_STR);
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();

    echo json_encode([
        "status" => "success",
        "message" => "Assujetti modifié avec succès",
        "data" => [
            "id" => $id,
            "nom_complet" => $nomComplet,
            "telephone" => $telephone,
            "adresse" => $adresse,
            "nif" => $nif,
            "email" => $email,
        ]
    ]);

} catch (Exception $e) {
    error_log("Erreur modifier_assujetti_simple: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Erreur système"]);
}
?>
