package models

import "time"

type FraisBancaire struct {
	ID           int       `db:"id" json:"id"`
	Type         string    `db:"type" json:"type"` // pourcentage, minimum
	Valeur       float64   `db:"valeur" json:"valeur"`
	Actif        bool      `db:"actif" json:"actif"`
	DateCreation time.Time `db:"date_creation" json:"date_creation"`
}
