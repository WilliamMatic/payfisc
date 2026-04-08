<?php
require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Taux.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

if (!isset($_POST['id'], $_POST['nom'], $_POST['valeur'])) {
    echo json_encode(["status" => "error", "message" => "Tous les champs sont requis."]);
    exit;
}

$id = (int)$_POST['id'];
$nom = trim(htmlspecialchars($_POST['nom'], ENT_QUOTES, 'UTF-8'));
$valeur = trim(htmlspecialchars($_POST['valeur'], ENT_QUOTES, 'UTF-8'));
$description = isset($_POST['description']) ? trim(htmlspecialchars($_POST['description'], ENT_QUOTES, 'UTF-8')) : '';
$est_par_defaut = isset($_POST['est_par_defaut']) && $_POST['est_par_defaut'] === 'true';

if (!is_numeric($valeur) || $valeur <= 0) {
    echo json_encode(["status" => "error", "message" => "La valeur doit être un nombre positif."]);
    exit;
}

try {
    $tauxManager = new Taux();
    $result = $tauxManager->modifierTaux($id, $nom, $valeur, $description, $est_par_defaut);
    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors de la modification d'un taux : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: L'opération a échoué."]);
}
?>