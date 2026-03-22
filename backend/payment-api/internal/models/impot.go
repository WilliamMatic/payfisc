package models

type Impot struct {
	ID          int     `db:"id" json:"id"`
	Nom         string  `db:"nom" json:"nom"`
	Description string  `db:"description" json:"description"`
	Prix        float64 `db:"prix" json:"prix"`
	Periode     string  `db:"periode" json:"periode"`
	Actif       bool    `db:"actif" json:"actif"`
}
