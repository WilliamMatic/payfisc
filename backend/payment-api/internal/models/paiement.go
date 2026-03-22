package models

import (
	"encoding/json"
	"time"
)

type PaiementTemp struct {
	ID                 int             `db:"id" json:"id"`
	Reference          string          `db:"reference" json:"reference"`
	ImpotID            int             `db:"impot_id" json:"impot_id"`
	NombreDeclarations int             `db:"nombre_declarations" json:"nombre_declarations"`
	MontantTotal       float64         `db:"montant_total" json:"montant_total"`
	RepartitionJSON    json.RawMessage `db:"repartition_json" json:"repartition_json"`
	DateCreation       time.Time       `db:"date_creation" json:"date_creation"`
}

type PaiementImmatriculation struct {
	ID             int       `db:"id" json:"id"`
	Montant        float64   `db:"montant" json:"montant"`
	MontantInitial float64   `db:"montant_initial" json:"montant_initial"`
	ImpotID        string    `db:"impot_id" json:"impot_id"` // Attention: dans le code PHP c'est string (cast)
	ModePaiement   string    `db:"mode_paiement" json:"mode_paiement"`
	Statut         string    `db:"statut" json:"statut"`
	DatePaiement   time.Time `db:"date_paiement" json:"date_paiement"`
	UtilisateurID  int       `db:"utilisateur_id" json:"utilisateur_id"`
	SiteID         int       `db:"site_id" json:"site_id"`
	NombrePlaques  int       `db:"nombre_plaques" json:"nombre_plaques"`
	Etat           int       `db:"etat" json:"etat"` // 1 = servi, 0 = non servi ?
	ParticulierID  int       `db:"particulier_id" json:"particulier_id"`
}

type PaiementBancaire struct {
	ID                int             `db:"id" json:"id"`
	IDPaiement        int             `db:"id_paiement" json:"id_paiement"`
	BankID            string          `db:"bank_id" json:"bank_id"`
	ReferenceBancaire string          `db:"reference_bancaire" json:"reference_bancaire"`
	Statut            string          `db:"statut" json:"statut"` // complete, pending, cancelled
	DonneesInitiation json.RawMessage `db:"donnees_initiation" json:"donnees_initiation"`
	DateCreation      time.Time       `db:"date_creation" json:"date_creation"`
}
