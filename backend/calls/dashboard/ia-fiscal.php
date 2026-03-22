<?php
// api/ia-fiscal.php
if (session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_secure' => true,
        'cookie_httponly' => true,
        'use_strict_mode' => true
    ]);
}

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/DashboardImmatriculation.php';

header('Content-Type: application/json');

// Vérifier la méthode
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// Récupérer les données POST
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['question'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Question manquante."]);
    exit;
}

try {
    $dashboardManager = new DashboardImmatriculation();
    
    // Récupérer les données pour l'IA
    $startDate = $input['start_date'] ?? date('Y-m-01');
    $endDate = $input['end_date'] ?? date('Y-m-t');
    
    $dataResult = $dashboardManager->getDataForIA($startDate, $endDate);
    
    if ($dataResult['status'] === 'error') {
        throw new Exception($dataResult['message']);
    }
    
    $fiscalData = $dataResult['data'];
    
    // Appeler l'IA (à intégrer avec ton service Gemini)
    $reponseIA = appelerIAFiscal($input['question'], $fiscalData);
    
    echo json_encode([
        "status" => "success",
        "data" => $reponseIA
    ]);

} catch (Exception $e) {
    error_log("Erreur API IA Fiscal: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système: " . $e->getMessage()
    ]);
}

// Fonction pour appeler l'IA (à adapter avec ton service Gemini)
function appelerIAFiscal($question, $fiscalData) {
    // Simulation de réponse IA - À REMPLACER PAR TON SERVICE GEMINI
    $questionLower = strtolower($question);
    
    $stats = $fiscalData['statistiques'];
    $paiements = $fiscalData['paiements'];
    $series = $fiscalData['series'];
    $beneficiaires = $fiscalData['beneficiaires'];
    $tendances = $fiscalData['tendances'];
    
    // Réponses basées sur le type de question
    if (strpos($questionLower, 'revenu') !== false || strpos($questionLower, 'montant') !== false) {
        return "💰 **Analyse des Revenus**\n\n" .
               "Le revenu total des immatriculations est de **" . 
               number_format($stats['total_revenus'] ?? 0, 2, ',', ' ') . 
               " USD**.\n\n" .
               "Détail par mode de paiement:\n";
               
    } elseif (strpos($questionLower, 'plaque') !== false || strpos($questionLower, 'immatriculation') !== false) {
        $tauxCarteRose = $stats['total_plaques_attribuees'] > 0 ? 
            round(($stats['plaques_avec_carte_rose'] / $stats['total_plaques_attribuees']) * 100, 2) : 0;
            
        return "🚗 **Statistiques des Plaques**\n\n" .
               "• Plaques payées : **" . ($stats['total_plaques_payees'] ?? 0) . "**\n" .
               "• Plaques attribuées : **" . ($stats['total_plaques_attribuees'] ?? 0) . "**\n" .
               "• Cartes roses délivrées : **" . ($stats['plaques_avec_carte_rose'] ?? 0) . "**\n" .
               "• Taux de délivrance : **" . $tauxCarteRose . "%**\n\n" .
               "Séries les plus populaires:\n";
               
    } elseif (strpos($questionLower, 'assujetti') !== false || strpos($questionLower, 'contribuable') !== false) {
        return "👥 **Analyse des Assujettis**\n\n" .
               "Nombre total d'assujettis : **" . ($stats['total_assujettis'] ?? 0) . "**\n" .
               "Nouveaux assujettis (période) : **" . ($tendances[0]['nouveaux_assujettis'] ?? 0) . "**\n\n";
               
    } elseif (strpos($questionLower, 'série') !== false || strpos($questionLower, 'serie') !== false) {
        $seriesText = "";
        foreach (array_slice($series, 0, 3) as $serie) {
            $seriesText .= "• " . $serie['nom_serie'] . " : " . $serie['nombre_attributions'] . " attributions\n";
        }
        
        return "📊 **Séries de Plaques**\n\n" .
               "Séries les plus populaires:\n" . $seriesText . "\n" .
               "Total des séries : **" . ($stats['total_series'] ?? 0) . "**\n";
               
    } elseif (strpos($questionLower, 'bénéficiaire') !== false || strpos($questionLower, 'beneficiaire') !== false) {
        $benefText = "";
        foreach (array_slice($beneficiaires, 0, 3) as $benef) {
            $benefText .= "• " . $benef['nom'] . " : " . number_format($benef['total_montant'] ?? 0, 2, ',', ' ') . " USD\n";
        }
        
        return "🏦 **Répartition Bénéficiaires**\n\n" .
               "Top bénéficiaires:\n" . $benefText . "\n" .
               "Total réparti : **" . number_format(array_sum(array_column($beneficiaires, 'total_montant')) ?? 0, 2, ',', ' ') . " USD**\n";
               
    } else {
        // Réponse générale
        return "🤖 **Assistant IA Fiscal - Immatriculation**\n\n" .
               "Voici un aperçu général du système d'immatriculation:\n\n" .
               "📈 **Chiffres Clés**\n" .
               "• Revenus totaux : " . number_format($stats['total_revenus'] ?? 0, 2, ',', ' ') . " USD\n" .
               "• Paiements effectués : " . ($stats['total_paiements'] ?? 0) . "\n" .
               "• Assujettis actifs : " . ($stats['total_assujettis'] ?? 0) . "\n" .
               "• Plaques attribuées : " . ($stats['total_plaques_attribuees'] ?? 0) . "\n\n" .
               "🔍 **Pour une analyse détaillée**, posez-moi une question spécifique sur:\n" .
               "• Les revenus et paiements\n" .
               "• Les plaques et séries\n" .
               "• Les assujettis\n" .
               "• Les bénéficiaires\n" .
               "• Les tendances et statistiques";
    }
}
?>