package handlers

import (
	"encoding/json"
	"net/http"
	"payment-api/internal/service"
)

type PaiementHandler struct {
	paiementService *service.PaiementService
}

func NewPaiementHandler(ps *service.PaiementService) *PaiementHandler {
	return &PaiementHandler{paiementService: ps}
}

type initRequest struct {
	ImpotID            int `json:"impot_id"`
	NombreDeclarations int `json:"nombre_declarations"`
}

func (h *PaiementHandler) InitPaiement(w http.ResponseWriter, r *http.Request) {
	bankCtx := service.GetBankContext(r.Context())
	if bankCtx == nil {
		respondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentification requise")
		return
	}

	var req initRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "INVALID_JSON", "Corps de la requête invalide")
		return
	}
	if req.ImpotID <= 0 || req.NombreDeclarations <= 0 {
		respondError(w, http.StatusBadRequest, "MISSING_PARAMETERS", "Paramètres 'impot_id' et 'nombre_declarations' requis et >0")
		return
	}

	result, err := h.paiementService.InitPaiement(bankCtx, req.ImpotID, req.NombreDeclarations)
	if err != nil {
		respondError(w, http.StatusBadRequest, "INIT_PAYMENT_ERROR", err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"status":  "success",
		"message": "Paiement initialisé avec succès",
		"data":    result,
	})
}

type traiterRequest struct {
	ReferencePaiement string `json:"reference_paiement"`
	MethodePaiement   string `json:"methode_paiement"`
}

func (h *PaiementHandler) TraiterPaiement(w http.ResponseWriter, r *http.Request) {
	bankCtx := service.GetBankContext(r.Context())
	if bankCtx == nil {
		respondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentification requise")
		return
	}

	var req traiterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "INVALID_JSON", "Corps de la requête invalide")
		return
	}
	if req.ReferencePaiement == "" || req.MethodePaiement == "" {
		respondError(w, http.StatusBadRequest, "MISSING_PARAMETERS", "Paramètres 'reference_paiement' et 'methode_paiement' requis")
		return
	}

	validMethods := map[string]bool{"mobile_money": true, "cheque": true, "banque": true, "espece": true}
	if !validMethods[req.MethodePaiement] {
		respondError(w, http.StatusBadRequest, "INVALID_PAYMENT_METHOD", "Méthode de paiement invalide")
		return
	}

	result, err := h.paiementService.TraiterPaiement(bankCtx, req.ReferencePaiement, req.MethodePaiement)
	if err != nil {
		respondError(w, http.StatusBadRequest, "PAYMENT_PROCESSING_ERROR", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "success",
		"message": "Paiement traité avec succès",
		"data":    result,
	})
}

type annulerRequest struct {
	ReferencePaiement string `json:"reference_paiement"`
}

func (h *PaiementHandler) AnnulerPaiement(w http.ResponseWriter, r *http.Request) {
	bankCtx := service.GetBankContext(r.Context())
	if bankCtx == nil {
		respondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentification requise")
		return
	}

	var req annulerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "INVALID_JSON", "Corps de la requête invalide")
		return
	}
	if req.ReferencePaiement == "" {
		respondError(w, http.StatusBadRequest, "MISSING_PARAMETERS", "Paramètre 'reference_paiement' requis")
		return
	}

	result, err := h.paiementService.AnnulerPaiement(bankCtx, req.ReferencePaiement)
	if err != nil {
		respondError(w, http.StatusBadRequest, "CANCELLATION_ERROR", err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "success",
		"message": "Paiement annulé avec succès",
		"data":    result,
	})
}

// Utilitaires JSON
func respondJSON(w http.ResponseWriter, code int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(payload)
}

func respondError(w http.ResponseWriter, code int, errCode, message string) {
	respondJSON(w, code, map[string]interface{}{
		"status":  "error",
		"code":    errCode,
		"message": message,
	})
}
