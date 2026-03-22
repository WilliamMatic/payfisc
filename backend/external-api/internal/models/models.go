// Package models définit toutes les structures de données de l'API
package models

import "time"

// ============================================================
// MODÈLES DE RÉPONSE API
// ============================================================

// APIResponse est la structure standard de toutes les réponses JSON
type APIResponse struct {
	Status  string      `json:"status"`          // "success" ou "error"
	Message string      `json:"message"`         // Message lisible
	Data    interface{} `json:"data,omitempty"`  // Données (absent si erreur)
	Error   string      `json:"error,omitempty"` // Détail erreur (absent si succès)
}

// ============================================================
// MODÈLES PARTENAIRE & AUTHENTIFICATION
// ============================================================

// BanquePartenaire représente les credentials d'un partenaire bancaire
type BanquePartenaire struct {
	ID                           int        `json:"id"`
	PartenaireID                 int        `json:"partenaire_id"`
	BankID                       string     `json:"bank_id"`
	APIKey                       string     `json:"-"` // Jamais exposé en JSON
	APISecret                    string     `json:"-"`
	Permissions                  []byte     `json:"permissions,omitempty"`
	LimiteTransactionJournaliere float64    `json:"limite_transaction_journaliere"`
	LimiteTransactionMensuelle   float64    `json:"limite_transaction_mensuelle"`
	MontantMinimum               float64    `json:"montant_minimum"`
	MontantMaximum               float64    `json:"montant_maximum"`
	URLWebhookConfirmation       string     `json:"url_webhook_confirmation"`
	URLWebhookAnnulation         string     `json:"url_webhook_annulation"`
	SecretWebhook                string     `json:"-"`
	DateExpiration               *time.Time `json:"date_expiration"`
	IPAutorisees                 []byte     `json:"-"`
	UserAgentAutorises           []byte     `json:"-"`
	TotalTransactions            int        `json:"total_transactions"`
	TotalMontant                 float64    `json:"total_montant"`
	DernierAcces                 *time.Time `json:"dernier_acces"`
	Actif                        bool       `json:"actif"`
	Suspendu                     bool       `json:"suspendu"`
	RaisonSuspension             string     `json:"raison_suspension,omitempty"`
}

// ============================================================
// MODÈLES DE RÉPONSE PAIEMENT
// ============================================================

// SiteInfo représente le site statique TSC-NPS
type SiteInfo struct {
	ID          int    `json:"id"`
	NomSite     string `json:"nom_site"`
	Fournisseur string `json:"fournisseur"`
}

// AssujettInfo représente le propriétaire du véhicule (particulier)
type AssujettInfo struct {
	ID         int    `json:"id"`
	NomComplet string `json:"nom_complet"`
	Telephone  string `json:"telephone"`
	Adresse    string `json:"adresse"`
	NIF        string `json:"nif"`
	Email      string `json:"email"`
}

// EnginInfo représente le véhicule/engin
type EnginInfo struct {
	ID               int    `json:"id"`
	NumeroPlaque     string `json:"numero_plaque"`
	Marque           string `json:"marque"`
	Modele           string `json:"modele"`
	Couleur          string `json:"couleur"`
	Energie          string `json:"energie"`
	UsageEngin       string `json:"usage_engin"`
	PuissanceFiscal  string `json:"puissance_fiscal"`
	AnneeFabrication string `json:"annee_fabrication"`
	NummeroChassis   string `json:"numero_chassis"`
	NumeroMoteur     string `json:"numero_moteur"`
	TypeEngin        string `json:"type_engin"`
}

// PaiementInfo représente le paiement effectué
type PaiementInfo struct {
	ID                int     `json:"id"`
	Montant           float64 `json:"montant"`
	MontantInitial    float64 `json:"montant_initial"`
	ModePaiement      string  `json:"mode_paiement"`
	Operateur         *string `json:"operateur"`
	NumeroTransaction string  `json:"numero_transaction"`
	DatePaiement      string  `json:"date_paiement"`
	Statut            string  `json:"statut"`
}

// RepartitionDetail représente la part d'un bénéficiaire
type RepartitionDetail struct {
	BeneficiaireID      int     `json:"beneficiaire_id"`
	BeneficiaireNom     string  `json:"beneficiaire_nom"`
	NumeroCompte        string  `json:"numero_compte"`
	TypePart            string  `json:"type_part"`
	ValeurPartOriginale float64 `json:"valeur_part_originale"`
	ValeurPartCalculee  float64 `json:"valeur_part_calculee"`
	Montant             float64 `json:"montant"`
}

// RepartitionInfo représente la répartition globale du paiement
type RepartitionInfo struct {
	TotalMontant        float64             `json:"total_montant"`
	TotalReparti        float64             `json:"total_reparti"`
	Reste               float64             `json:"reste"`
	Details             []RepartitionDetail `json:"details"`
	NombreBeneficiaires int                 `json:"nombre_beneficiaires"`
}

// UtilisateurInfo représente l'agent/caissier qui a enregistré le paiement
type UtilisateurInfo struct {
	ID  int    `json:"id"`
	Nom string `json:"nom"`
}

// PaiementDetailsResponse est la réponse complète pour un paiement
type PaiementDetailsResponse struct {
	Site        SiteInfo        `json:"site"`
	Assujetti   AssujettInfo    `json:"assujetti"`
	Engin       EnginInfo       `json:"engin"`
	Paiement    PaiementInfo    `json:"paiement"`
	Repartition RepartitionInfo `json:"repartition"`
	Utilisateur UtilisateurInfo `json:"utilisateur"`
}

// ============================================================
// MODÈLES RAW (résultat de la requête SQL brute)
// ============================================================

// PaiementRaw est la structure intermédiaire qui stocke le résultat SQL brut
// avant transformation en PaiementDetailsResponse
type PaiementRaw struct {
	// --- Paiement ---
	PaiementID        int
	Montant           float64
	MontantInitial    float64
	ModePaiement      string
	Operateur         *string
	NumeroTransaction string
	DatePaiement      string
	Statut            string

	// --- Site ---
	SiteID  int
	SiteNom string

	// --- Utilisateur ---
	UtilisateurID  int
	UtilisateurNom string

	// --- Engin ---
	EnginID          *int
	NumeroPlaque     string
	MarqueEngin      string
	ModeleEngin      string
	CouleurEngin     string
	EnergieEngin     string
	UsageEngin       string
	PuissanceFiscal  string
	AnneeFabrication string
	NumChassis       string
	NumMoteur        string
	TypeEngin        string

	// --- Particulier (assujetti) ---
	ParticulierID     int
	AssujettNom       string
	AssujettPrenom    string
	AssujettTelephone string
	AssujettAdresse   string
	AssujettNIF       string
	AssujettEmail     string
}
