package repository

import (
	"database/sql"
)

type ParticulierRepository struct {
	db *sql.DB
}

func NewParticulierRepository(db *sql.DB) *ParticulierRepository {
	return &ParticulierRepository{db: db}
}

func (r *ParticulierRepository) GetNIFByID(id int) (string, error) {
	var nif sql.NullString
	query := `SELECT nif FROM particuliers WHERE id = ?`
	err := r.db.QueryRow(query, id).Scan(&nif)
	if err != nil {
		return "", err
	}
	return nif.String, nil
}
