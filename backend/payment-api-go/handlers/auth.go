package handlers

import (
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v3"

	"payfisc-api/config"
	"payfisc-api/models"
	"payfisc-api/services"
	"payfisc-api/utils"
)

// AuthHandler gère les endpoints d'authentification
type AuthHandler struct {
	cfg       *config.Config
	service   *services.PaymentService
	validator *validator.Validate
}

// NewAuthHandler crée un nouveau handler d'authentification
func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		cfg:       cfg,
		service:   services.NewPaymentService(),
		validator: validator.New(),
	}
}

// Login authentifie une banque partenaire et retourne un token JWT
// POST /api/auth/login
// Body: { "bank_id": "...", "api_key": "..." }
func (h *AuthHandler) Login(c fiber.Ctx) error {
	// Parser le corps de la requête
	var req models.LoginRequest
	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIResponse{
			Status:  "error",
			Code:    "INVALID_REQUEST",
			Message: "Corps de requête invalide. Format attendu: JSON avec bank_id et api_key",
		})
	}

	// Valider les champs
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIResponse{
			Status:  "error",
			Code:    "MISSING_PARAMETERS",
			Message: "Paramètres requis manquants: bank_id et api_key sont obligatoires",
		})
	}

	// Récupérer l'IP et le User-Agent du client
	clientIP := c.IP()
	userAgent := c.Get("User-Agent")

	// Authentifier la banque
	bank, permissions, err := h.service.AuthenticateBank(c.Context(), req.BankID, req.APIKey, clientIP, userAgent)
	if err != nil {
		if apiErr, ok := err.(*utils.APIError); ok {
			return c.Status(apiErr.StatusCode).JSON(models.APIResponse{
				Status:  "error",
				Code:    apiErr.Code,
				Message: apiErr.Message,
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIResponse{
			Status:  "error",
			Code:    "AUTH_ERROR",
			Message: "Erreur technique lors de l'authentification",
		})
	}

	// Générer le token JWT
	token, expiresAt, err := utils.GenerateJWT(
		h.cfg.JWTSecret,
		bank.BankID,
		bank.PartenaireName,
		bank.ID,
		permissions,
		h.cfg.JWTExpiration,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(models.APIResponse{
			Status:  "error",
			Code:    "TOKEN_GENERATION_ERROR",
			Message: "Erreur lors de la génération du token",
		})
	}

	// Construire les limites
	limiteJournaliere := 10000000.0
	if bank.LimiteJournaliere.Valid {
		limiteJournaliere = bank.LimiteJournaliere.Float64
	}
	limiteMensuelle := 100000000.0
	if bank.LimiteMensuelle.Valid {
		limiteMensuelle = bank.LimiteMensuelle.Float64
	}
	montantMinimum := 100.0
	if bank.MontantMinimum.Valid {
		montantMinimum = bank.MontantMinimum.Float64
	}
	montantMaximum := 5000000.0
	if bank.MontantMaximum.Valid {
		montantMaximum = bank.MontantMaximum.Float64
	}

	return c.Status(fiber.StatusOK).JSON(models.APIResponse{
		Status:  "success",
		Message: "Authentification réussie",
		Data: models.AuthResponse{
			Token:       token,
			ExpiresAt:   expiresAt.Format("2006-01-02 15:04:05"),
			BankName:    bank.PartenaireName,
			BankID:      bank.BankID,
			Permissions: permissions,
			Limits: models.Limits{
				Daily:     limiteJournaliere,
				Monthly:   limiteMensuelle,
				MinAmount: montantMinimum,
				MaxAmount: montantMaximum,
			},
		},
	})
}
