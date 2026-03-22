package models

import (
	"database/sql"
	"time"
)

type Partenaire struct {
	ID            int            `db:"id" json:"id"`
	Nom           string         `db:"nom" json:"nom"`
	BaseURLAPI    sql.NullString `db:"base_url_api" json:"base_url_api"`
	TimeoutAPI    sql.NullInt32  `db:"timeout_api" json:"timeout_api"`
	RetryAttempts sql.NullInt32  `db:"retry_attempts" json:"retry_attempts"`
	RaisonSociale sql.NullString `db:"raison_sociale" json:"raison_sociale"`
	Email         sql.NullString `db:"email" json:"email"`
	Telephone     sql.NullString `db:"telephone" json:"telephone"`
	IPWhitelist   sql.NullString `db:"ip_whitelist" json:"ip_whitelist"`
	EnMaintenance bool           `db:"en_maintenance" json:"en_maintenance"`
	Actif         bool           `db:"actif" json:"actif"`
}

type BanquePartenaire struct {
	ID                           int             `db:"id" json:"id"`
	BankID                       string          `db:"bank_id" json:"bank_id"`
	PartenaireID                 int             `db:"partenaire_id" json:"partenaire_id"`
	APIKey                       string          `db:"api_key" json:"-"`
	URLWebhookConfirmation       sql.NullString  `db:"url_webhook_confirmation" json:"url_webhook_confirmation"`
	SecretWebhook                sql.NullString  `db:"secret_webhook" json:"-"`
	DateExpiration               sql.NullTime    `db:"date_expiration" json:"date_expiration"`
	IPAutorisees                 sql.NullString  `db:"ip_autorisees" json:"ip_autorisees"`
	UserAgentAutorises           sql.NullString  `db:"user_agent_autorises" json:"user_agent_autorises"`
	Permissions                  sql.NullString  `db:"permissions" json:"permissions"`
	LimiteTransactionJournaliere sql.NullFloat64 `db:"limite_transaction_journaliere" json:"limite_transaction_journaliere"`
	LimiteTransactionMensuelle   sql.NullFloat64 `db:"limite_transaction_mensuelle" json:"limite_transaction_mensuelle"`
	MontantMinimum               sql.NullFloat64 `db:"montant_minimum" json:"montant_minimum"`
	MontantMaximum               sql.NullFloat64 `db:"montant_maximum" json:"montant_maximum"`
	Actif                        bool            `db:"actif" json:"actif"`
	Suspendu                     bool            `db:"suspendu" json:"suspendu"`
	DernierAcces                 sql.NullTime    `db:"dernier_acces" json:"dernier_acces"`
	DateCreation                 time.Time       `db:"date_creation" json:"date_creation"`

	// Jointure avec partenaire
	Partenaire *Partenaire `db:"-" json:"partenaire,omitempty"`
}

type ConnexionBancaire struct {
	ID            int       `db:"id" json:"id"`
	BanqueID      int       `db:"banque_id" json:"banque_id"`
	IP            string    `db:"ip" json:"ip"`
	UserAgent     string    `db:"user_agent" json:"user_agent"`
	DateConnexion time.Time `db:"date_connexion" json:"date_connexion"`
}

// BankAuthResult représente le résultat de l'authentification
type BankAuthResult struct {
	BankName      string   `json:"bank_name"`
	BankID        string   `json:"bank_id"`
	Permissions   []string `json:"permissions"`
	Timeout       int32    `json:"timeout"`
	RetryAttempts int32    `json:"retry_attempts"`
	Limits        struct {
		DailyLimit   float64 `json:"daily"`
		MonthlyLimit float64 `json:"monthly"`
		MinAmount    float64 `json:"min_amount"`
		MaxAmount    float64 `json:"max_amount"`
	} `json:"limits"`
}
