<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_secure' => true,
        'cookie_httponly' => true,
        'use_strict_mode' => true
    ]);
}

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/Paiement.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$required_fields = ['id_declaration', 'montant_total', 'nombre_declarations'];
foreach ($required_fields as $field) {
    if (!isset($data[$field])) {
        echo json_encode(["status" => "error", "message" => "Le paramètre $field est requis."]);
        exit;
    }
}

try {
    $paiementManager = new Paiement();
    $result = $paiementManager->calculerRepartitionBeneficiaires(
        $data['id_declaration'],
        $data['montant_total'],
        $data['nombre_declarations']
    );

    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur lors du calcul de la répartition : " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système: Impossible de calculer la répartition."]);
}
?>