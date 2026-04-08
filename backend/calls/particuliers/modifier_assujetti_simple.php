<?php
/**
 * Modification simplifiée d'un assujetti (nom_complet, telephone, adresse, nif, email)
 * Utilisé depuis les modals de détails (suppression-vignette, suppression-controle-technique)
 * Délègue toute la logique à la classe Particulier
 */

require '../headers/head.php';

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header('Content-Type: application/json');
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée"]);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE || !$data) {
    header('Content-Type: application/json');
    echo json_encode(["status" => "error", "message" => "Données JSON invalides"]);
    exit;
}

$id = isset($data['id']) ? (int)$data['id'] : 0;
if ($id <= 0) {
    header('Content-Type: application/json');
    echo json_encode(["status" => "error", "message" => "ID du particulier requis"]);
    exit;
}

require_once __DIR__ . '/../../class/Particulier.php';

header('Content-Type: application/json');

try {
    $particulier = new Particulier();
    $result = $particulier->modifierAssujettiSimple($id, $data);

    if ($result['status'] === 'success') {
        http_response_code(200);
    } else {
    }

    echo json_encode($result);

} catch (Exception $e) {
    error_log("Erreur modifier_assujetti_simple: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Erreur système"]);
}
?>
