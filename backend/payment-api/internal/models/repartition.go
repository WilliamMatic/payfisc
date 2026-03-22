package models

import "time"

type RepartitionPaiement struct {
	ID                        int       `db:"id" json:"id"`
	IDPaiementImmatriculation int       `db:"id_paiement_immatriculation" json:"id_paiement_immatriculation"`
	BeneficiaireID            int       `db:"beneficiaire_id" json:"beneficiaire_id"`
	TypePart                  string    `db:"type_part" json:"type_part"`
	ValeurPartOriginale       float64   `db:"valeur_part_originale" json:"valeur_part_originale"`
	ValeurPartCalculee        float64   `db:"valeur_part_calculee" json:"valeur_part_calculee"`
	Montant                   float64   `db:"montant" json:"montant"`
	DateCreation              time.Time `db:"date_creation" json:"date_creation"`
}
