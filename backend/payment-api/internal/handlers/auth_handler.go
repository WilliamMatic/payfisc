package handlers

import (
	"encoding/json"
	"net/http"
	"payment-api/internal/service"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(as *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: as}
}

type authRequest struct {
	BankID string `json:"bank_id"`
	APIKey string `json:"api_key"`
}

func (h *AuthHandler) Authenticate(w http.ResponseWriter, r *http.Request) {
	var req authRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "INVALID_JSON", "Corps de la requête invalide")
		return
	}

	bankCtx, err := h.authService.AuthenticateBank(r, req.BankID, req.APIKey)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "AUTH_FAILED", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "success",
		"message": "Authentification réussie",
		"data":    bankCtx.Config,
	})
}
