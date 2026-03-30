package handlers

import (
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v3"

	"payfisc-api/config"
	"payfisc-api/models"
	"payfisc-api/services"
	"payfisc-api/utils"
)

// PaymentHandler gère les endpoints de paiement
type PaymentHandler struct {
	cfg       *config.Config
	service   *services.PaymentService
	validator *validator.Validate
}

// NewPaymentHandler crée un nouveau handler de paiement
func NewPaymentHandler(cfg *config.Config) *PaymentHandler {
	return &PaymentHandler{
		cfg:       cfg,
		service:   services.NewPaymentService(),
		validator: validator.New(),
	}
}

// InitialiserPaiement initialise un paiement d'impôt
// POST /api/paiement/initialiser-paiement
// Body: { "impot_id": 1, "nombre_declarations": 5 }
// Headers: Authorization: Bearer <token>
func (h *PaymentHandler) InitialiserPaiement(c fiber.Ctx) error {
	// Parser le corps de la requête
	var req models.InitPaymentRequest
	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIResponse{
			Status:  "error",
			Code:    "INVALID_REQUEST",
			Message: "Corps de requête invalide. Format attendu: JSON avec impot_id et nombre_declarations",
		})
	}

	// Valider les champs
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIResponse{
			Status:  "error",
			Code:    "MISSING_PARAMETERS",
			Message: "Paramètres invalides: impot_id (entier > 0) et nombre_declarations (entier > 0) sont requis",
		})
	}

	// Récupérer le bank_id depuis le contexte JWT
	bankID, ok := c.Locals("bank_id").(string)
	if !ok || bankID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIResponse{
			Status:  "error",
			Code:    "INVALID_SESSION",
			Message: "Session invalide. Veuillez vous reconnecter.",
		})
	}

	// Appeler le service
	result, err := h.service.InitialiserPaiement(c.Context(), bankID, req.ImpotID, req.NombreDeclarations)
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
			Code:    "SYSTEM_ERROR",
			Message: "Erreur système lors de l'initialisation du paiement",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(models.APIResponse{
		Status:  "success",
		Message: "Paiement initialisé avec succès",
		Data:    result,
	})
}

// TraiterPaiement traite un paiement précédemment initialisé
// POST /api/paiement/traiter-paiement-impot
// Body: { "reference_paiement": "IMP...", "methode_paiement": "mobile_money" }
// Headers: Authorization: Bearer <token>
func (h *PaymentHandler) TraiterPaiement(c fiber.Ctx) error {
	// Parser le corps de la requête
	var req models.ProcessPaymentRequest
	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIResponse{
			Status:  "error",
			Code:    "INVALID_REQUEST",
			Message: "Corps de requête invalide. Format attendu: JSON avec reference_paiement et methode_paiement",
		})
	}

	// Valider les champs
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIResponse{
			Status:  "error",
			Code:    "MISSING_PARAMETERS",
			Message: "Paramètres invalides: reference_paiement et methode_paiement (mobile_money|carte|virement|especes) sont requis",
		})
	}

	// Récupérer le bank_id depuis le contexte JWT
	bankID, ok := c.Locals("bank_id").(string)
	if !ok || bankID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIResponse{
			Status:  "error",
			Code:    "INVALID_SESSION",
			Message: "Session invalide. Veuillez vous reconnecter.",
		})
	}

	// Appeler le service
	result, err := h.service.TraiterPaiement(c.Context(), bankID, req.ReferencePaiement, req.MethodePaiement)
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
			Code:    "PAYMENT_PROCESSING_ERROR",
			Message: "Erreur système lors du traitement du paiement",
		})
	}

	return c.Status(fiber.StatusOK).JSON(models.APIResponse{
		Status:  "success",
		Message: "Paiement traité avec succès",
		Data:    result,
	})
}

// AnnulerPaiement annule un paiement traité
// POST /api/paiement/annuler-paiement-impot
// Body: { "reference_paiement": "BANK..." }
// Headers: Authorization: Bearer <token>
func (h *PaymentHandler) AnnulerPaiement(c fiber.Ctx) error {
	// Parser le corps de la requête
	var req models.CancelPaymentRequest
	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIResponse{
			Status:  "error",
			Code:    "INVALID_REQUEST",
			Message: "Corps de requête invalide. Format attendu: JSON avec reference_paiement",
		})
	}

	// Valider les champs
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(models.APIResponse{
			Status:  "error",
			Code:    "MISSING_PARAMETERS",
			Message: "Paramètre requis manquant: reference_paiement (référence bancaire)",
		})
	}

	// Récupérer le bank_id depuis le contexte JWT
	bankID, ok := c.Locals("bank_id").(string)
	if !ok || bankID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(models.APIResponse{
			Status:  "error",
			Code:    "INVALID_SESSION",
			Message: "Session invalide. Veuillez vous reconnecter.",
		})
	}

	// Appeler le service
	result, err := h.service.AnnulerPaiement(c.Context(), bankID, req.ReferencePaiement)
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
			Code:    "CANCELLATION_ERROR",
			Message: "Erreur système lors de l'annulation du paiement",
		})
	}

	return c.Status(fiber.StatusOK).JSON(models.APIResponse{
		Status:  "success",
		Message: "Paiement annulé avec succès",
		Data:    result,
	})
}
