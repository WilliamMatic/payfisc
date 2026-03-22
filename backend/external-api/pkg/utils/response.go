// Package utils contient les fonctions utilitaires partagées
package utils

import (
	"encoding/json"
	"external-api/internal/models"
	"net/http"
)

// WriteSuccess écrit une réponse JSON de succès standardisée
func WriteSuccess(w http.ResponseWriter, statusCode int, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(models.APIResponse{
		Status:  "success",
		Message: message,
		Data:    data,
	})
}

// WriteError écrit une réponse JSON d'erreur standardisée
func WriteError(w http.ResponseWriter, statusCode int, message, detail string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(models.APIResponse{
		Status:  "error",
		Message: message,
		Error:   detail,
	})
}

// NullableString retourne une string ou vide si nil
func NullableString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
