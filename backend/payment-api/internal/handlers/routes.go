package handlers

import (
	"encoding/json"
	"net/http"
	"payment-api/internal/middleware"
	"payment-api/internal/service"

	"github.com/gorilla/mux"
)

func SetupRoutes(
	r *mux.Router,
	authService *service.AuthService,
	paiementService *service.PaiementService,
) {
	// Middleware global
	r.Use(middleware.CORS)
	r.Use(middleware.Logging)
	r.Use(middleware.Recovery)

	// ✅ ROUTE RACINE - Message de bienvenue
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  "success",
			"message": "API Paiement - Payfisc",
			"version": "1.0.0",
			"endpoints": []string{
				"POST /api/authentifier-partenaire",
				"POST /api/paiement/initialiser-paiement",
				"POST /api/paiement/traiter-paiement-impot",
				"POST /api/paiement/annuler-paiement-impot",
			},
			"documentation": "https://github.com/votre-repo/payment-api",
		})
	}).Methods("GET", "OPTIONS")

	// Route d'authentification (pour la documentation)
	authHandler := NewAuthHandler(authService)
	r.HandleFunc("/api/authentifier-partenaire", authHandler.Authenticate).Methods("POST", "OPTIONS")

	// Routes de paiement (protégées par le middleware d'auth)
	paiementHandler := NewPaiementHandler(paiementService)
	api := r.PathPrefix("/api/paiement").Subrouter()
	api.Use(middleware.Auth(authService))
	api.HandleFunc("/initialiser-paiement", paiementHandler.InitPaiement).Methods("POST", "OPTIONS")
	api.HandleFunc("/traiter-paiement-impot", paiementHandler.TraiterPaiement).Methods("POST", "OPTIONS")
	api.HandleFunc("/annuler-paiement-impot", paiementHandler.AnnulerPaiement).Methods("POST", "OPTIONS")
}
