<?php

require_once __DIR__ . '/Connexion.php';
require_once __DIR__ . '/Response.php';
require_once __DIR__ . '/PaiementModel.php';

/**
 * PaiementController — Assemble la réponse complète pour le partenaire
 * 
 * Hérite de Connexion (via PaiementModel qu'il instancie).
 * Orchestre : PaiementModel → assemblage → Response
 */
class PaiementController extends Connexion {

    private PaiementModel $model;

    public function __construct() {
        parent::__construct();
        $this->model = new PaiementModel();
    }

    /**
     * Traite une recherche par numéro de plaque
     * Appelé par l'AuthMiddleware après authentification
     */
    public function getParPlaque(string $plaque, AuthMiddleware $auth): void {
        $plaque = strtoupper(trim($plaque));

        if (empty($plaque)) {
            Response::error("Paramètre manquant", "Le numéro de plaque est obligatoire", 400);
        }

        // Vérifier que le paiement existe et récupérer le montant
        $ref = $this->model->trouverParPlaque($plaque);
        if (!$ref) {
            Response::error(
                "Paiement introuvable",
                "Aucun paiement complété trouvé pour la plaque '{$plaque}'",
                404
            );
        }

        // Vérifier les limites montant du partenaire
        $auth->verifierMontant((float)$ref["montant"]);

        // Assembler et retourner la réponse complète
        $this->repondre((int)$ref["id"]);
    }

    /**
     * Traite une recherche par numéro de transaction
     * Appelé par l'AuthMiddleware après authentification
     */
    public function getParTransaction(string $numeroTransaction, AuthMiddleware $auth): void {
        $numeroTransaction = trim($numeroTransaction);

        if (empty($numeroTransaction)) {
            Response::error("Paramètre manquant", "Le numéro de transaction est obligatoire", 400);
        }

        $ref = $this->model->trouverParTransaction($numeroTransaction);
        if (!$ref) {
            Response::error(
                "Paiement introuvable",
                "Aucun paiement trouvé pour la référence '{$numeroTransaction}'",
                404
            );
        }

        $auth->verifierMontant((float)$ref["montant"]);

        $this->repondre((int)$ref["id"]);
    }

    // ── Méthodes privées ─────────────────────────────────────────────────────

    /**
     * Récupère toutes les données et envoie la réponse JSON finale
     */
    private function repondre(int $paiementId): void {
        // Requête principale (paiement + toutes les tables liées)
        $raw = $this->model->getDetailsPaiement($paiementId);

        if (!$raw) {
            Response::error("Erreur interne", "Impossible de récupérer les détails du paiement", 500);
        }

        // Requête répartition
        $lignesRepartition = $this->model->getRepartition($paiementId);

        // Calculer les totaux de la répartition
        $details      = [];
        $totalReparti = 0.0;

        foreach ($lignesRepartition as $ligne) {
            $montant       = (float)$ligne["montant"];
            $totalReparti += $montant;

            $details[] = [
                "beneficiaire_id"       => (int)$ligne["beneficiaire_id"],
                "beneficiaire_nom"      => $ligne["beneficiaire_nom"],
                "numero_compte"         => $ligne["numero_compte"],
                "type_part"             => $ligne["type_part"],
                "valeur_part_originale" => (float)$ligne["valeur_part_originale"],
                "valeur_part_calculee"  => (float)$ligne["valeur_part_calculee"],
                "montant"               => $montant
            ];
        }

        $totalReparti = round($totalReparti, 2);
        $montantTotal = (float)$raw["montant"];

        // Construire la réponse dans le format exact attendu
        $reponse = [
            "site" => [
                "id"          => (int)$raw["site_id"],
                "nom_site"    => $raw["site_nom"],
                "fournisseur" => "TSC-NPS"
            ],
            "assujetti" => [
                "id"          => (int)$raw["particulier_id"],
                "nom_complet" => trim($raw["assujetti_nom"] . " - " . $raw["assujetti_prenom"]),
                "telephone"   => $raw["assujetti_telephone"],
                "adresse"     => $raw["assujetti_adresse"],
                "nif"         => $raw["assujetti_nif"],
                "email"       => $raw["assujetti_email"]
            ],
            "engin" => [
                "id"                => (int)$raw["engin_id"],
                "numero_plaque"     => $raw["numero_plaque"],
                "marque"            => $raw["marque_engin"],
                "modele"            => "",
                "couleur"           => $raw["couleur_engin"],
                "energie"           => $raw["energie_engin"],
                "usage_engin"       => $raw["usage_engin"],
                "puissance_fiscal"  => $raw["puissance_fiscal"],
                "annee_fabrication" => $raw["annee_fabrication"],
                "numero_chassis"    => $raw["numero_chassis"],
                "numero_moteur"     => $raw["numero_moteur"],
                "type_engin"        => $raw["type_engin"]
            ],
            "paiement" => [
                "id"                 => (int)$raw["paiement_id"],
                "montant"            => $montantTotal,
                "montant_initial"    => (float)$raw["montant_initial"],
                "mode_paiement"      => $raw["mode_paiement"],
                "operateur"          => $raw["operateur"] ?: null,
                "numero_transaction" => $raw["numero_transaction"],
                "date_paiement"      => $raw["date_paiement"],
                "statut"             => $raw["statut"]
            ],
            "repartition" => [
                "total_montant"        => $montantTotal,
                "total_reparti"        => $totalReparti,
                "reste"                => round($montantTotal - $totalReparti, 2),
                "details"              => $details,
                "nombre_beneficiaires" => count($details)
            ],
            "utilisateur" => [
                "id"  => (int)$raw["utilisateur_id"],
                "nom" => $raw["utilisateur_nom"]
            ]
        ];

        Response::success($reponse, "Paiement récupéré avec succès");
    }
}