package repository

import (
	"database/sql"
	"payment-api/internal/models"
)

type ImpotRepository struct {
	db *sql.DB
}

func NewImpotRepository(db *sql.DB) *ImpotRepository {
	return &ImpotRepository{db: db}
}

func (r *ImpotRepository) GetByID(impotID int) (*models.Impot, error) {
	var i models.Impot
	query := `SELECT id, nom, description, prix, periode, actif FROM impots WHERE id = ? AND actif = 1`
	err := r.db.QueryRow(query, impotID).Scan(&i.ID, &i.Nom, &i.Description, &i.Prix, &i.Periode, &i.Actif)
	if err != nil {
		return nil, err
	}
	return &i, nil
}
