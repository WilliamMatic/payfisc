package service

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"payment-api/internal/models"
	"payment-api/internal/repository"
	"payment-api/pkg/utils"
	"strings"
)

// contextKey est un type local pour éviter les collisions
type contextKey string

// BankContextKey est la clé utilisée pour stocker le contexte bancaire dans la requête
const BankContextKey contextKey = "bankContext"

// GetBankContext extrait le BankContext du contexte HTTP
func GetBankContext(ctx context.Context) *BankContext {
	if val := ctx.Value(BankContextKey); val != nil {
		if bc, ok := val.(*BankContext); ok {
			return bc
		}
	}
	return nil
}

type AuthService struct {
	banqueRepo *repository.BanqueRepository
	fraisRepo  *repository.FraisRepository
}

func NewAuthService(br *repository.BanqueRepository, fr *repository.FraisRepository) *AuthService {
	return &AuthService{
		banqueRepo: br,
		fraisRepo:  fr,
	}
}

// BankContext représente les informations d'authentification chargées dans le contexte
type BankContext struct {
	BanqueID      int
	BankID        string
	PartenaireNom string
	Config        *models.BankAuthResult
	RawBanque     *models.BanquePartenaire
}

// AuthenticateBank effectue toutes les vérifications de sécurité et retourne le contexte bancaire
func (s *AuthService) AuthenticateBank(r *http.Request, bankID, apiKey string) (*BankContext, error) {
	// 1. Vérifications IP et User-Agent
	if err := s.checkIPAuthorization(bankID, r); err != nil {
		return nil, err
	}
	if err := s.checkUserAgentAuthorization(bankID, r); err != nil {
		return nil, err
	}

	// 2. Authentification DB
	banque, err := s.banqueRepo.GetBanqueWithPartenaireByBankIDAndKey(bankID, apiKey)
	if err != nil {
		return nil, errors.New("authentification échouée: identifiants invalides, compte suspendu, expiré ou en maintenance: " + err.Error())
	}

	// 3. Permissions
	perms := []string{"process_payments"}
	if banque.Permissions.Valid {
		var permsFromDB []string
		if err := json.Unmarshal([]byte(banque.Permissions.String), &permsFromDB); err == nil {
			perms = permsFromDB
		}
	}
	if !s.checkPermissions(perms, []string{"process_payments"}) {
		return nil, errors.New("permissions insuffisantes")
	}

	// 4. Limites de transaction
	if err := s.checkTransactionLimits(banque.BankID); err != nil {
		return nil, err
	}

	// 5. Construction de la config (sans frais, car non utilisés ici)
	limits := struct {
		DailyLimit   float64 `json:"daily"`
		MonthlyLimit float64 `json:"monthly"`
		MinAmount    float64 `json:"min_amount"`
		MaxAmount    float64 `json:"max_amount"`
	}{
		DailyLimit:   banque.LimiteTransactionJournaliere.Float64,
		MonthlyLimit: banque.LimiteTransactionMensuelle.Float64,
		MinAmount:    banque.MontantMinimum.Float64,
		MaxAmount:    banque.MontantMaximum.Float64,
	}
	if limits.DailyLimit == 0 {
		limits.DailyLimit = 10000000
	}
	if limits.MonthlyLimit == 0 {
		limits.MonthlyLimit = 100000000
	}
	if limits.MinAmount == 0 {
		limits.MinAmount = 100
	}
	if limits.MaxAmount == 0 {
		limits.MaxAmount = 5000000
	}

	authResult := &models.BankAuthResult{
		BankName:      banque.Partenaire.Nom,
		BankID:        banque.BankID,
		Permissions:   perms,
		Timeout:       banque.Partenaire.TimeoutAPI.Int32,
		RetryAttempts: banque.Partenaire.RetryAttempts.Int32,
	}
	authResult.Limits = limits

	// 6. Enregistrer la connexion et dernier accès
	_ = s.banqueRepo.UpdateLastAccess(banque.ID)
	_ = s.banqueRepo.InsertConnexion(banque.ID, utils.GetClientIP(r), r.UserAgent())

	return &BankContext{
		BanqueID:      banque.ID,
		BankID:        banque.BankID,
		PartenaireNom: banque.Partenaire.Nom,
		Config:        authResult,
		RawBanque:     banque,
	}, nil
}

func (s *AuthService) checkIPAuthorization(bankID string, r *http.Request) error {
	banque, err := s.banqueRepo.GetBanqueByBankID(bankID)
	if err != nil {
		return nil
	}

	clientIP := utils.GetClientIP(r)
	if clientIP == "" {
		return nil
	}

	if banque.IPAutorisees.Valid && banque.IPAutorisees.String != "" {
		var ips []string
		if err := json.Unmarshal([]byte(banque.IPAutorisees.String), &ips); err == nil && len(ips) > 0 {
			allowed := false
			for _, ip := range ips {
				if ip == clientIP {
					allowed = true
					break
				}
			}
			if !allowed {
				return errors.New("adresse IP non autorisée pour cette banque")
			}
		}
	}
	return nil
}

func (s *AuthService) checkUserAgentAuthorization(bankID string, r *http.Request) error {
	banque, err := s.banqueRepo.GetBanqueByBankID(bankID)
	if err != nil {
		return nil
	}
	if banque.UserAgentAutorises.Valid && banque.UserAgentAutorises.String != "" {
		var uas []string
		if err := json.Unmarshal([]byte(banque.UserAgentAutorises.String), &uas); err == nil && len(uas) > 0 {
			clientUA := r.UserAgent()
			allowed := false
			for _, ua := range uas {
				if strings.Contains(clientUA, ua) || clientUA == ua {
					allowed = true
					break
				}
			}
			if !allowed {
				return errors.New("user-agent non autorisé")
			}
		}
	}
	return nil
}

func (s *AuthService) checkPermissions(available, required []string) bool {
	for _, req := range required {
		found := false
		for _, perm := range available {
			if perm == req {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}
	return true
}

func (s *AuthService) checkTransactionLimits(bankID string) error {
	daily, _ := s.banqueRepo.GetDailyTotal(bankID)
	if daily >= 10000000 {
		return errors.New("limite journalière de transactions atteinte")
	}
	monthly, _ := s.banqueRepo.GetMonthlyTotal(bankID)
	if monthly >= 100000000 {
		return errors.New("limite mensuelle de transactions atteinte")
	}
	return nil
}
