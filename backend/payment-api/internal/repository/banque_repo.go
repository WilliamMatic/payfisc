package repository

import (
	"database/sql"
	"errors"
	"payment-api/internal/models"
)

type BanqueRepository struct {
	db *sql.DB
}

func NewBanqueRepository(db *sql.DB) *BanqueRepository {
	return &BanqueRepository{db: db}
}

// GetBanqueWithPartenaireByBankIDAndKey récupère une banque partenaire avec ses infos partenaire
func (r *BanqueRepository) GetBanqueWithPartenaireByBankIDAndKey(bankID, apiKey string) (*models.BanquePartenaire, error) {
	query := `
        SELECT 
            bp.id, bp.bank_id, bp.partenaire_id, bp.api_key,
            bp.url_webhook_confirmation, bp.secret_webhook,
            bp.date_expiration, bp.ip_autorisees, bp.user_agent_autorises,
            bp.permissions, bp.limite_transaction_journaliere, bp.limite_transaction_mensuelle,
            bp.montant_minimum, bp.montant_maximum, bp.actif, bp.suspendu,
            bp.dernier_acces, bp.date_creation,
            p.nom as partenaire_nom, p.base_url_api, p.timeout_api, p.retry_attempts,
            p.raison_sociale, p.email, p.telephone, p.ip_whitelist, p.en_maintenance
        FROM banques_partenaire bp
        JOIN partenaires p ON bp.partenaire_id = p.id
        WHERE bp.bank_id = ? AND bp.api_key = ? 
          AND bp.actif = 1 AND bp.suspendu = 0
          AND p.actif = 1 AND p.en_maintenance = 0
          AND (bp.date_expiration IS NULL OR bp.date_expiration > NOW())
    `
	row := r.db.QueryRow(query, bankID, apiKey)

	var bp models.BanquePartenaire
	var p models.Partenaire

	var (
		baseURLAPI, raisonSociale, email, telephone, ipWhitelist sql.NullString
		timeoutAPI, retryAttempts                                sql.NullInt32
		enMaintenance                                            bool
	)

	err := row.Scan(
		// bp.* (18 colonnes)
		&bp.ID, &bp.BankID, &bp.PartenaireID, &bp.APIKey,
		&bp.URLWebhookConfirmation, &bp.SecretWebhook,
		&bp.DateExpiration, &bp.IPAutorisees, &bp.UserAgentAutorises,
		&bp.Permissions, &bp.LimiteTransactionJournaliere, &bp.LimiteTransactionMensuelle,
		&bp.MontantMinimum, &bp.MontantMaximum, &bp.Actif, &bp.Suspendu,
		&bp.DernierAcces, &bp.DateCreation,
		// p.* (9 colonnes)
		&p.Nom, &baseURLAPI, &timeoutAPI, &retryAttempts,
		&raisonSociale, &email, &telephone, &ipWhitelist, &enMaintenance,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("banque non trouvée ou inactive")
		}
		return nil, err
	}

	// Remplir les informations du partenaire
	p.ID = bp.PartenaireID
	p.BaseURLAPI = baseURLAPI
	p.TimeoutAPI = timeoutAPI
	p.RetryAttempts = retryAttempts
	p.RaisonSociale = raisonSociale
	p.Email = email
	p.Telephone = telephone
	p.IPWhitelist = ipWhitelist
	p.EnMaintenance = enMaintenance
	p.Actif = true

	bp.Partenaire = &p
	return &bp, nil
}

// GetBanqueByBankID récupère uniquement la config banque
func (r *BanqueRepository) GetBanqueByBankID(bankID string) (*models.BanquePartenaire, error) {
	query := `
        SELECT 
            ip_autorisees, user_agent_autorises, permissions,
            limite_transaction_journaliere, limite_transaction_mensuelle,
            montant_minimum, montant_maximum
        FROM banques_partenaire 
        WHERE bank_id = ? AND actif = 1 AND suspendu = 0
    `
	row := r.db.QueryRow(query, bankID)

	var bp models.BanquePartenaire
	err := row.Scan(
		&bp.IPAutorisees, &bp.UserAgentAutorises, &bp.Permissions,
		&bp.LimiteTransactionJournaliere, &bp.LimiteTransactionMensuelle,
		&bp.MontantMinimum, &bp.MontantMaximum,
	)
	if err != nil {
		return nil, err
	}
	return &bp, nil
}

// GetDailyTotal retourne le total des paiements complets du jour
func (r *BanqueRepository) GetDailyTotal(bankID string) (float64, error) {
	query := `
        SELECT COALESCE(SUM(pi.montant), 0)
        FROM paiements_bancaires pb
        JOIN paiements_immatriculation pi ON pb.id_paiement = pi.id
        WHERE pb.bank_id = ? AND DATE(pb.date_creation) = CURDATE() 
          AND pb.statut = 'complete'
    `
	var total float64
	err := r.db.QueryRow(query, bankID).Scan(&total)
	return total, err
}

// GetMonthlyTotal retourne le total des paiements complets du mois
func (r *BanqueRepository) GetMonthlyTotal(bankID string) (float64, error) {
	query := `
        SELECT COALESCE(SUM(pi.montant), 0)
        FROM paiements_bancaires pb
        JOIN paiements_immatriculation pi ON pb.id_paiement = pi.id
        WHERE pb.bank_id = ? AND YEAR(pb.date_creation) = YEAR(CURDATE()) 
          AND MONTH(pb.date_creation) = MONTH(CURDATE())
          AND pb.statut = 'complete'
    `
	var total float64
	err := r.db.QueryRow(query, bankID).Scan(&total)
	return total, err
}

// UpdateLastAccess met à jour la colonne dernier_acces
func (r *BanqueRepository) UpdateLastAccess(banqueID int) error {
	query := `UPDATE banques_partenaire SET dernier_acces = NOW() WHERE id = ?`
	_, err := r.db.Exec(query, banqueID)
	return err
}

// InsertConnexion enregistre une connexion
func (r *BanqueRepository) InsertConnexion(banqueID int, ip, userAgent string) error {
	query := `INSERT INTO connexions_bancaires (banque_id, ip, user_agent, date_connexion) VALUES (?, ?, ?, NOW())`
	_, err := r.db.Exec(query, banqueID, ip, userAgent)
	return err
}
