package repository

import (
	"database/sql"
	"payment-api/internal/models"
)

type BeneficiaireRepository struct {
	db *sql.DB
}

func NewBeneficiaireRepository(db *sql.DB) *BeneficiaireRepository {
	return &BeneficiaireRepository{db: db}
}

func (r *BeneficiaireRepository) GetRepartitionByImpotID(impotID int) ([]models.ImpotBeneficiaire, error) {
	query := `
        SELECT ib.id, ib.impot_id, ib.beneficiaire_id, ib.type_part, ib.valeur_part
        FROM impot_beneficiaires ib
        JOIN beneficiaires b ON ib.beneficiaire_id = b.id
        WHERE ib.impot_id = ? AND b.actif = 1
        ORDER BY ib.id
    `
	rows, err := r.db.Query(query, impotID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.ImpotBeneficiaire
	for rows.Next() {
		var ib models.ImpotBeneficiaire
		if err := rows.Scan(&ib.ID, &ib.ImpotID, &ib.BeneficiaireID, &ib.TypePart, &ib.ValeurPart); err != nil {
			return nil, err
		}
		list = append(list, ib)
	}
	return list, nil
}

func (r *BeneficiaireRepository) GetBeneficiaireByID(id int) (*models.Beneficiaire, error) {
	var b models.Beneficiaire
	query := `SELECT id, nom, telephone, numero_compte, actif FROM beneficiaires WHERE id = ?`
	err := r.db.QueryRow(query, id).Scan(&b.ID, &b.Nom, &b.Telephone, &b.NumeroCompte, &b.Actif)
	if err != nil {
		return nil, err
	}
	return &b, nil
}
