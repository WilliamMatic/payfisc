<?php

require_once __DIR__ . '/Connexion.php';
require_once __DIR__ . '/Response.php';

/**
 * PaiementModel — Accès aux données des paiements
 * 
 * Hérite de Connexion pour accéder à $this->pdo.
 * Contient toutes les requêtes SQL liées aux paiements.
 */
class PaiementModel extends Connexion {

    /**
     * Trouve le paiement le plus récent par numéro de plaque
     * Retourne l'ID et le montant, ou null si introuvable
     */
    public function trouverParPlaque(string $plaque): ?array {
        $stmt = $this->pdo->prepare("
            SELECT pi.id, pi.montant
            FROM paiements_immatriculation pi
            INNER JOIN engins e ON pi.engin_id = e.id
            WHERE e.numero_plaque = :plaque
              AND pi.statut = 'completed'
              AND pi.impot_id = 18
            ORDER BY pi.date_paiement DESC
            LIMIT 1
        ");
        $stmt->execute([":plaque" => strtoupper(trim($plaque))]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Trouve un paiement par numéro de transaction
     * Retourne l'ID et le montant, ou null si introuvable
     */
    public function trouverParTransaction(string $numeroTransaction): ?array {
        $stmt = $this->pdo->prepare("
            SELECT id, montant
            FROM paiements_immatriculation
            WHERE numero_transaction = :ref
              AND statut = 'completed'
            LIMIT 1
        ");
        $stmt->execute([":ref" => trim($numeroTransaction)]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Requête principale — récupère TOUT en un seul JOIN
     * (paiement + site + utilisateur + engin + particulier)
     */
    public function getDetailsPaiement(int $paiementId): ?array {
        $stmt = $this->pdo->prepare("
            SELECT
                p.id                                              AS paiement_id,
                p.montant,
                COALESCE(p.montant_initial, p.montant)           AS montant_initial,
                p.mode_paiement,
                p.operateur,
                COALESCE(p.numero_transaction, '')               AS numero_transaction,
                DATE_FORMAT(p.date_paiement, '%Y-%m-%d %H:%i:%s') AS date_paiement,
                p.statut,
                p.particulier_id,
                p.engin_id,

                COALESCE(s.id, 358)                              AS site_id,
                COALESCE(s.nom, 'LIMETE')                        AS site_nom,

                u.id                                             AS utilisateur_id,
                COALESCE(u.nom_complet, 'Caissier')              AS utilisateur_nom,

                COALESCE(e.numero_plaque,    '')                 AS numero_plaque,
                COALESCE(e.marque,           '')                 AS marque_engin,
                COALESCE(e.couleur,          '')                 AS couleur_engin,
                COALESCE(e.energie,          '')                 AS energie_engin,
                COALESCE(e.usage_engin,      '')                 AS usage_engin,
                COALESCE(e.puissance_fiscal, '')                 AS puissance_fiscal,
                COALESCE(CAST(e.annee_fabrication AS CHAR), '')  AS annee_fabrication,
                COALESCE(e.numero_chassis,   '')                 AS numero_chassis,
                COALESCE(e.numero_moteur,    '')                 AS numero_moteur,
                COALESCE(e.type_engin,       '')                 AS type_engin,

                COALESCE(pt.nom,       '')                       AS assujetti_nom,
                COALESCE(pt.prenom,    '')                       AS assujetti_prenom,
                COALESCE(pt.telephone, '')                       AS assujetti_telephone,
                COALESCE(pt.rue,       '')                       AS assujetti_adresse,
                COALESCE(pt.nif,       '')                       AS assujetti_nif,
                COALESCE(pt.email,     '')                       AS assujetti_email

            FROM paiements_immatriculation p
            LEFT JOIN sites        s  ON p.site_id        = s.id
            LEFT JOIN utilisateurs u  ON p.utilisateur_id = u.id
            LEFT JOIN engins       e  ON p.engin_id       = e.id
            LEFT JOIN particuliers pt ON p.particulier_id = pt.id
            WHERE p.id = :id
            LIMIT 1
        ");
        $stmt->execute([":id" => $paiementId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Récupère la répartition entre bénéficiaires pour un paiement
     */
    public function getRepartition(int $paiementId): array {
        $stmt = $this->pdo->prepare("
            SELECT
                r.beneficiaire_id,
                b.nom                         AS beneficiaire_nom,
                COALESCE(b.numero_compte, '') AS numero_compte,
                r.type_part,
                r.valeur_part_originale,
                r.valeur_part_calculee,
                r.montant
            FROM repartition_paiements_immatriculation r
            INNER JOIN beneficiaires b ON r.beneficiaire_id = b.id
            WHERE r.id_paiement_immatriculation = :id
            ORDER BY r.id ASC
        ");
        $stmt->execute([":id" => $paiementId]);
        return $stmt->fetchAll();
    }
}