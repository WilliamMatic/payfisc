package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"payment-api/internal/service"
)

type contextKey string

const BankContextKey contextKey = "bankContext"

func Auth(authService *service.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			apiKey := r.Header.Get("X-API-Key")
			bankID := r.Header.Get("X-Bank-ID")

			if apiKey == "" || bankID == "" {
				respondError(w, http.StatusUnauthorized, "MISSING_AUTH_HEADERS", "En-têtes X-API-Key et X-Bank-ID requis")
				return
			}

			bankCtx, err := authService.AuthenticateBank(r, bankID, apiKey)
			if err != nil {
				respondError(w, http.StatusUnauthorized, "AUTH_FAILED", err.Error())
				return
			}

			ctx := context.WithValue(r.Context(), BankContextKey, bankCtx)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func respondError(w http.ResponseWriter, code int, errCode, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "error",
		"code":    errCode,
		"message": message,
	})
}
