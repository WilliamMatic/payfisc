package models

type Beneficiaire struct {
	ID           int    `db:"id" json:"id"`
	Nom          string `db:"nom" json:"nom"`
	Telephone    string `db:"telephone" json:"telephone"`
	NumeroCompte string `db:"numero_compte" json:"numero_compte"`
	Actif        bool   `db:"actif" json:"actif"`
}

type ImpotBeneficiaire struct {
	ID             int     `db:"id" json:"id"`
	ImpotID        int     `db:"impot_id" json:"impot_id"`
	BeneficiaireID int     `db:"beneficiaire_id" json:"beneficiaire_id"`
	TypePart       string  `db:"type_part" json:"type_part"` // pourcentage / fixe
	ValeurPart     float64 `db:"valeur_part" json:"valeur_part"`
}

// RepartitionBeneficiaire est la structure renvoyée à l'initialisation
type RepartitionBeneficiaire struct {
	BeneficiaireID      int     `json:"beneficiaire_id"`
	Nom                 string  `json:"nom"`
	Telephone           string  `json:"telephone"`
	NumeroCompte        string  `json:"numero_compte"`
	TypePart            string  `json:"type_part"`
	ValeurPartOriginale float64 `json:"valeur_part_originale"`
	Montant             float64 `json:"montant"`
}
