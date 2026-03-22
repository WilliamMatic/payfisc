package repository

import (
	"database/sql"
)

type FraisRepository struct {
	db *sql.DB
}

func NewFraisRepository(db *sql.DB) *FraisRepository {
	return &FraisRepository{db: db}
}

func (r *FraisRepository) GetPourcentageActif() (float64, error) {
	query := `SELECT valeur FROM frais_bancaires WHERE type = 'pourcentage' AND actif = 1 ORDER BY date_creation DESC LIMIT 1`
	var val float64
	err := r.db.QueryRow(query).Scan(&val)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0.5, nil // défaut
		}
		return 0, err
	}
	return val, nil
}

func (r *FraisRepository) GetMinimumActif() (float64, error) {
	query := `SELECT valeur FROM frais_bancaires WHERE type = 'minimum' AND actif = 1 ORDER BY date_creation DESC LIMIT 1`
	var val float64
	err := r.db.QueryRow(query).Scan(&val)
	if err != nil {
		if err == sql.ErrNoRows {
			return 100, nil // défaut
		}
		return 0, err
	}
	return val, nil
}
