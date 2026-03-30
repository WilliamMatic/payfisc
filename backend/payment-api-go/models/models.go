package models

import (
	"database/sql"
	"time"
)

// ============================================================================
// Requêtes (Request Bodies)
// ============================================================================

// LoginRequest représente le corps de la requête d'authentification
type LoginRequest struct {
	BankID string `json:"bank_id" validate:"required,min=1,max=100"`
	APIKey string `json:"api_key" validate:"required,min=1,max=255"`
}

// InitPaymentRequest représente la requête d'initialisation de paiement
type InitPaymentRequest struct {
	ImpotID            int `json:"impot_id" validate:"required,gt=0"`
	NombreDeclarations int `json:"nombre_declarations" validate:"required,gt=0,lte=10000"`
}

// ProcessPaymentRequest représente la requête de traitement de paiement
type ProcessPaymentRequest struct {
	ReferencePaiement string `json:"reference_paiement" validate:"required,min=5,max=50"`
	MethodePaiement   string `json:"methode_paiement" validate:"required,oneof=mobile_money carte virement especes"`
}

// CancelPaymentRequest représente la requête d'annulation de paiement
type CancelPaymentRequest struct {
	ReferencePaiement string `json:"reference_paiement" validate:"required,min=5,max=50"`
}

// ============================================================================
// Réponses (Response Bodies)
// ============================================================================

// APIResponse est la structure standardisée pour toutes les réponses API
type APIResponse struct {
	Status  string      `json:"status"`
	Code    string      `json:"code,omitempty"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// AuthResponse contient les données retournées après authentification
type AuthResponse struct {
	Token       string   `json:"token"`
	ExpiresAt   string   `json:"expires_at"`
	BankName    string   `json:"bank_name"`
	BankID      string   `json:"bank_id"`
	Permissions []string `json:"permissions"`
	Limits      Limits   `json:"limits"`
}

// Limits contient les limites de transaction
type Limits struct {
	Daily     float64 `json:"daily"`
	Monthly   float64 `json:"monthly"`
	MinAmount float64 `json:"min_amount"`
	MaxAmount float64 `json:"max_amount"`
}

// InitPaymentResponse contient les données retournées après initialisation
type InitPaymentResponse struct {
	ReferencePaiement string              `json:"reference_paiement"`
	Impot             ImpotInfo           `json:"impot"`
	Details           PaymentDetails      `json:"details"`
	Repartition       []BeneficiaireShare `json:"repartition"`
	CallbackURL       string              `json:"callback_url"`
	DateExpiration    string              `json:"date_expiration"`
}

// ImpotInfo contient les informations d'un impôt
type ImpotInfo struct {
	ID           int     `json:"id"`
	Nom          string  `json:"nom"`
	Description  string  `json:"description"`
	PrixUnitaire float64 `json:"prix_unitaire"`
	Periode      string  `json:"periode"`
}

// PaymentDetails contient le détail du calcul
type PaymentDetails struct {
	NombreDeclarations int     `json:"nombre_declarations"`
	MontantTotal       float64 `json:"montant_total"`
	MontantUnitaire    float64 `json:"montant_unitaire"`
}

// BeneficiaireShare contient la part d'un bénéficiaire
type BeneficiaireShare struct {
	BeneficiaireID      int     `json:"beneficiaire_id"`
	Nom                 string  `json:"nom"`
	Telephone           string  `json:"telephone"`
	NumeroCompte        string  `json:"numero_compte"`
	TypePart            string  `json:"type_part"`
	ValeurPartOriginale float64 `json:"valeur_part_originale"`
	Montant             float64 `json:"montant"`
}

// ProcessPaymentResponse contient les données après traitement
type ProcessPaymentResponse struct {
	PaiementID         string `json:"paiement_id"`
	PaiementBancaireID string `json:"paiement_bancaire_id"`
	ReferenceBancaire  string `json:"reference_bancaire"`
	ReferencePaiement  string `json:"reference_paiement"`
	Montant            string `json:"montant"`
	NombreDeclarations int    `json:"nombre_declarations"`
	MethodePaiement    string `json:"methode_paiement"`
	DatePaiement       string `json:"date_paiement"`
}

// CancelPaymentResponse contient les données après annulation
type CancelPaymentResponse struct {
	Reference string `json:"reference"`
	Type      string `json:"type"`
}

// ============================================================================
// Modèles de base de données
// ============================================================================

// BankPartner représente un partenaire bancaire avec toutes ses données
type BankPartner struct {
	ID                 int
	PartenaireID       int
	BankID             string
	APIKey             string
	PartenaireName     string
	RaisonSociale      sql.NullString
	ContactEmail       sql.NullString
	ContactTelephone   sql.NullString
	BaseURLAPI         sql.NullString
	TimeoutAPI         sql.NullInt64
	RetryAttempts      sql.NullInt64
	IPWhitelist        sql.NullString
	EnMaintenance      int
	WebhookURL         sql.NullString
	WebhookSecret      sql.NullString
	DateExpiration     sql.NullTime
	IPAutorisees       sql.NullString
	UserAgentAutorises sql.NullString
	Actif              int
	Suspendu           int
	Permissions        sql.NullString
	LimiteJournaliere  sql.NullFloat64
	LimiteMensuelle    sql.NullFloat64
	MontantMinimum     sql.NullFloat64
	MontantMaximum     sql.NullFloat64
}

// Impot représente un impôt dans la base de données
type Impot struct {
	ID          int
	Nom         string
	Description sql.NullString
	Prix        float64
	Periode     sql.NullString
	Actif       int
}

// TempPayment représente un paiement temporaire
type TempPayment struct {
	ID                 int
	Reference          string
	ImpotID            int
	NombreDeclarations int
	MontantTotal       float64
	RepartitionJSON    string
	BankID             string
	DateCreation       time.Time
}

// PaymentRecord représente un enregistrement de paiement avec données bancaires
type PaymentRecord struct {
	ID                int
	IDPaiement        int
	BankID            string
	ReferenceBancaire string
	Statut            string
	DonneesInitiation sql.NullString
	DateCreation      sql.NullTime
	Etat              int
}
