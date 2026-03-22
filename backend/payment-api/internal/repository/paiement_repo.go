package repository

import (
	"database/sql"
	"payment-api/internal/models"
)

type PaiementRepository struct {
	db *sql.DB
	tx *sql.Tx // optionnel, pour les transactions
}

func NewPaiementRepository(db *sql.DB) *PaiementRepository {
	return &PaiementRepository{
		db: db,
		tx: nil,
	}
}

// NewPaiementRepositoryWithTx crée un repository qui utilise une transaction
func NewPaiementRepositoryWithTx(tx *sql.Tx) *PaiementRepository {
	return &PaiementRepository{
		db: nil,
		tx: tx,
	}
}

// exec utilise la transaction si elle existe, sinon le db direct
func (r *PaiementRepository) exec(query string, args ...interface{}) (sql.Result, error) {
	if r.tx != nil {
		return r.tx.Exec(query, args...)
	}
	return r.db.Exec(query, args...)
}

// queryRow utilise la transaction si elle existe
func (r *PaiementRepository) queryRow(query string, args ...interface{}) *sql.Row {
	if r.tx != nil {
		return r.tx.QueryRow(query, args...)
	}
	return r.db.QueryRow(query, args...)
}

// query utilise la transaction si elle existe
func (r *PaiementRepository) query(query string, args ...interface{}) (*sql.Rows, error) {
	if r.tx != nil {
		return r.tx.Query(query, args...)
	}
	return r.db.Query(query, args...)
}

// ---- TEMPORAIRE ----
func (r *PaiementRepository) CreateTemp(p *models.PaiementTemp) (int64, error) {
	query := `
        INSERT INTO paiements_immatriculation_temp 
        (reference, impot_id, nombre_declarations, montant_total, repartition_json, date_creation)
        VALUES (?, ?, ?, ?, ?, NOW())
    `
	result, err := r.exec(query, p.Reference, p.ImpotID, p.NombreDeclarations, p.MontantTotal, p.RepartitionJSON)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func (r *PaiementRepository) GetTempByReference(ref string) (*models.PaiementTemp, error) {
	var p models.PaiementTemp
	query := `SELECT id, reference, impot_id, nombre_declarations, montant_total, repartition_json, date_creation 
              FROM paiements_immatriculation_temp WHERE reference = ?`
	err := r.queryRow(query, ref).Scan(
		&p.ID, &p.Reference, &p.ImpotID, &p.NombreDeclarations, &p.MontantTotal,
		&p.RepartitionJSON, &p.DateCreation,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PaiementRepository) DeleteTempByReference(ref string) error {
	query := `DELETE FROM paiements_immatriculation_temp WHERE reference = ?`
	_, err := r.exec(query, ref)
	return err
}

// ---- PAIEMENT IMMATRICULATION ----
func (r *PaiementRepository) CreatePaiementImmatriculation(p *models.PaiementImmatriculation) (int64, error) {
	query := `
        INSERT INTO paiements_immatriculation 
        (montant, montant_initial, impot_id, mode_paiement, statut, date_paiement, 
         utilisateur_id, site_id, nombre_plaques, etat, particulier_id)
        VALUES (?, ?, ?, ?, 'completed', NOW(), ?, ?, ?, ?, ?)
    `
	result, err := r.exec(query,
		p.Montant, p.MontantInitial, p.ImpotID, p.ModePaiement,
		p.UtilisateurID, p.SiteID, p.NombrePlaques, p.Etat, p.ParticulierID,
	)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func (r *PaiementRepository) GetPaiementImmatriculationByID(id int) (*models.PaiementImmatriculation, error) {
	var p models.PaiementImmatriculation
	query := `SELECT id, montant, montant_initial, impot_id, mode_paiement, statut, date_paiement,
              utilisateur_id, site_id, nombre_plaques, etat, particulier_id
              FROM paiements_immatriculation WHERE id = ?`
	err := r.queryRow(query, id).Scan(
		&p.ID, &p.Montant, &p.MontantInitial, &p.ImpotID, &p.ModePaiement,
		&p.Statut, &p.DatePaiement, &p.UtilisateurID, &p.SiteID,
		&p.NombrePlaques, &p.Etat, &p.ParticulierID,
	)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PaiementRepository) DeletePaiementImmatriculation(id int) error {
	query := `DELETE FROM paiements_immatriculation WHERE id = ?`
	_, err := r.exec(query, id)
	return err
}

// ---- PAIEMENT BANCAIRE ----
func (r *PaiementRepository) CreatePaiementBancaire(p *models.PaiementBancaire) (int64, error) {
	query := `
        INSERT INTO paiements_bancaires 
        (id_paiement, bank_id, reference_bancaire, statut, donnees_initiation, date_creation)
        VALUES (?, ?, ?, ?, ?, NOW())
    `
	result, err := r.exec(query,
		p.IDPaiement, p.BankID, p.ReferenceBancaire, p.Statut, p.DonneesInitiation,
	)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func (r *PaiementRepository) GetPaiementBancaireByReference(ref string) (*models.PaiementBancaire, *models.PaiementImmatriculation, error) {
	query := `
        SELECT pb.*, pi.etat
        FROM paiements_bancaires pb
        INNER JOIN paiements_immatriculation pi ON pi.id = pb.id_paiement
        WHERE pb.reference_bancaire = ?
    `
	row := r.queryRow(query, ref)

	var pb models.PaiementBancaire
	var etat int
	var donneesInitiation []byte

	err := row.Scan(
		&pb.ID, &pb.IDPaiement, &pb.BankID, &pb.ReferenceBancaire,
		&pb.Statut, &donneesInitiation, &pb.DateCreation,
		&etat,
	)
	if err != nil {
		return nil, nil, err
	}
	pb.DonneesInitiation = donneesInitiation

	pi, err := r.GetPaiementImmatriculationByID(pb.IDPaiement)
	if err != nil {
		return nil, nil, err
	}
	pi.Etat = etat

	return &pb, pi, nil
}

func (r *PaiementRepository) DeletePaiementBancaireByPaiementID(idPaiement int) error {
	query := `DELETE FROM paiements_bancaires WHERE id_paiement = ?`
	_, err := r.exec(query, idPaiement)
	return err
}

// ---- REPARTITION ----
func (r *PaiementRepository) CreateRepartition(repartitions []models.RepartitionPaiement) error {
	for _, rep := range repartitions {
		query := `
            INSERT INTO repartition_paiements_immatriculation
            (id_paiement_immatriculation, beneficiaire_id, type_part, 
             valeur_part_originale, valeur_part_calculee, montant, date_creation)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `
		_, err := r.exec(query,
			rep.IDPaiementImmatriculation, rep.BeneficiaireID, rep.TypePart,
			rep.ValeurPartOriginale, rep.ValeurPartCalculee, rep.Montant,
		)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *PaiementRepository) DeleteRepartitionByPaiementID(idPaiement int) error {
	query := `DELETE FROM repartition_paiements_immatriculation WHERE id_paiement_immatriculation = ?`
	_, err := r.exec(query, idPaiement)
	return err
}
