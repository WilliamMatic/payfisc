<?php
/**
 * Script de création d'une puissance fiscale par type d'engin
 */

// CORS headers
require '../headers/head.php';

// Réponse au preflight OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../class/PuissanceFiscale.php';
require_once __DIR__ . '/../../class/TypeEngin.php';

header('Content-Type: application/json');

// ======================================================================
// VALIDATION DE LA REQUÊTE HTTP
// ======================================================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée (POST requis)."]);
    exit;
}

// ======================================================================
// VALIDATION DES DONNÉES
// ======================================================================

$champsObligatoires = ['libelle', 'valeur', 'type_engin_libelle'];
foreach ($champsObligatoires as $champ) {
    if (!isset($_POST[$champ]) || empty($_POST[$champ])) {
        echo json_encode(["status" => "error", "message" => "Le champ $champ est obligatoire."]);
        exit;
    }
}

// ======================================================================
// NETTOYAGE DES DONNÉES
// ======================================================================

$libelle = trim(htmlspecialchars($_POST['libelle'], ENT_QUOTES, 'UTF-8'));
$valeur = trim(htmlspecialchars($_POST['valeur'], ENT_QUOTES, 'UTF-8'));
$typeEnginLibelle = trim(htmlspecialchars($_POST['type_engin_libelle'], ENT_QUOTES, 'UTF-8'));
$description = isset($_POST['description']) ? trim(htmlspecialchars($_POST['description'], ENT_QUOTES, 'UTF-8')) : '';

// Validation de la valeur (doit être numérique)
if (!is_numeric($valeur)) {
    echo json_encode(["status" => "error", "message" => "La valeur doit être un nombre."]);
    exit;
}

$valeur = (float)$valeur;

// ======================================================================
// TRAITEMENT PRINCIPAL
// ======================================================================

try {
    $puissanceFiscaleManager = new PuissanceFiscale();
    $typeEnginManager = new TypeEngin();
    
    // Récupérer l'ID du type d'engin en utilisant la classe TypeEngin
    $typeEngin = $typeEnginManager->typeEnginExiste($typeEnginLibelle);
    
    if (!$typeEngin) {
        echo json_encode([
            "status" => "error", 
            "message" => "Le type d'engin '$typeEnginLibelle' n'existe pas ou est inactif."
        ]);
        exit;
    }
    
    $typeEnginId = $typeEngin['id'];
    
    // Vérifier si la puissance fiscale existe déjà pour ce type d'engin
    $puissanceExistante = $puissanceFiscaleManager->puissanceFiscaleExiste($libelle, $typeEnginId);
    if ($puissanceExistante) {
        echo json_encode([
            "status" => "success",
            "message" => "Puissance fiscale existante",
            "data" => [
                [
                    "id" => $puissanceExistante['id'],
                    "libelle" => $puissanceExistante['libelle'],
                    "valeur" => $puissanceExistante['valeur'],
                    "description" => $puissanceExistante['description'] ?? '',
                    "type_engin_libelle" => $typeEnginLibelle
                ]
            ]
        ]);
        exit;
    }
    
    // Ajouter la puissance fiscale
    $resultat = $puissanceFiscaleManager->ajouterPuissanceFiscale($libelle, $valeur, $typeEnginId, $description);
    
    // Si l'ajout a réussi, retourner les données complètes
    if ($resultat['status'] === 'success') {
        // Récupérer l'ID de la puissance créée (soit de la réponse, soit la dernière insertion)
        $puissanceId = null;
        if (isset($resultat['id'])) {
            $puissanceId = $resultat['id'];
        } else {
            // Si l'ID n'est pas dans la réponse, récupérer la dernière puissance créée pour ce type
            $dernieresPuissances = $puissanceFiscaleManager->rechercherPuissancesParType($typeEnginId, $libelle);
            
            if ($dernieresPuissances['status'] === 'success' && !empty($dernieresPuissances['data'])) {
                // Prendre la première puissance qui correspond au libellé
                foreach ($dernieresPuissances['data'] as $puissance) {
                    if ($puissance['libelle'] === $libelle) {
                        $puissanceId = $puissance['id'];
                        break;
                    }
                }
            }
        }
        
        if ($puissanceId) {
            // Récupérer les informations complètes de la puissance
            $puissanceComplete = $puissanceFiscaleManager->puissanceFiscaleExisteParId($puissanceId);
            
            if ($puissanceComplete) {
                echo json_encode([
                    "status" => "success",
                    "message" => "Puissance fiscale créée avec succès",
                    "data" => [
                        [
                            "id" => $puissanceComplete['id'],
                            "libelle" => $puissanceComplete['libelle'],
                            "valeur" => $puissanceComplete['valeur'],
                            "description" => $puissanceComplete['description'] ?? '',
                            "type_engin_libelle" => $typeEnginLibelle
                        ]
                    ]
                ]);
            } else {
                echo json_encode([
                    "status" => "success",
                    "message" => $resultat['message'],
                    "data" => [
                        [
                            "libelle" => $libelle,
                            "valeur" => $valeur,
                            "description" => $description,
                            "type_engin_libelle" => $typeEnginLibelle
                        ]
                    ]
                ]);
            }
        } else {
            echo json_encode([
                "status" => "success",
                "message" => $resultat['message'],
                "data" => [
                    [
                        "libelle" => $libelle,
                        "valeur" => $valeur,
                        "description" => $description,
                        "type_engin_libelle" => $typeEnginLibelle
                    ]
                ]
            ]);
        }
    } else {
        echo json_encode($resultat);
    }

} catch (Exception $e) {
    error_log("Erreur lors de la création de la puissance fiscale: " . $e->getMessage());
    echo json_encode([
        "status" => "error", 
        "message" => "Erreur système lors de la création de la puissance fiscale."
    ]);
}
?>