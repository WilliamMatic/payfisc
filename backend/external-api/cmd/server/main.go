// Package main est le point d'entrée de l'API externe TSC-NPS
// Cette API permet aux partenaires bancaires de consulter les données
// de paiements d'immatriculation via numéro de plaque ou de transaction
package main

import (
	"context"
	"external-api/internal/config"
	"external-api/internal/database"
	"external-api/internal/handlers"
	"external-api/internal/middleware"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gorilla/mux"
)

func main() {
	// ── 1. Charger la configuration ──────────────────────────────────────────
	cfg := config.Load()

	log.Println("🚀 Démarrage de l'API externe TSC-NPS...")
	log.Printf("   DB: %s@%s:%s/%s", cfg.DB.User, cfg.DB.Host, cfg.DB.Port, cfg.DB.Name)

	// ── 2. Initialiser la base de données ────────────────────────────────────
	if err := database.InitDB(&cfg.DB); err != nil {
		log.Fatalf("❌ Impossible de se connecter à MySQL: %v", err)
	}
	defer database.Close()

	// ── 3. Créer le routeur principal ─────────────────────────────────────────
	router := mux.NewRouter()

	// ── 4. Appliquer les middlewares globaux (dans l'ordre d'exécution) ───────
	router.Use(middleware.LoggingMiddleware) // Journalisation des requêtes
	router.Use(middleware.CORSMiddleware)    // Headers CORS & sécurité

	// ── 5. Définir les routes ─────────────────────────────────────────────────
	// Créer le handler paiement
	paiementHandler := handlers.NewPaiementHandler(database.DB)

	// Route publique : vérification de santé (sans authentification)
	router.HandleFunc("/api/v1/health", handlers.HealthCheck).Methods(http.MethodGet)

	// Sous-routeur pour les routes protégées (avec authentification)
	api := router.PathPrefix("/api/v1").Subrouter()
	api.Use(middleware.AuthMiddleware) // Authentification par X-Bank-ID + X-API-Key

	// Routes de consultation des paiements
	// Recherche par numéro de plaque d'immatriculation
	api.HandleFunc(
		"/paiement/plaque/{numero_plaque}",
		paiementHandler.GetPaiementByPlaque,
	).Methods(http.MethodGet)

	// Recherche par numéro de transaction de paiement
	api.HandleFunc(
		"/paiement/transaction/{numero_transaction}",
		paiementHandler.GetPaiementByTransaction,
	).Methods(http.MethodGet)

	// ── 6. Configurer et démarrer le serveur HTTP ─────────────────────────────
	server := &http.Server{
		Addr:         cfg.Server.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second, // Temps max pour lire la requête
		WriteTimeout: 15 * time.Second, // Temps max pour écrire la réponse
		IdleTimeout:  60 * time.Second, // Temps max pour les connexions inactives
	}

	// Démarrer le serveur dans une goroutine (non-bloquant)
	go func() {
		log.Printf("✅ Serveur démarré sur http://localhost%s", cfg.Server.Port)
		log.Println("📌 Routes disponibles :")
		log.Println("   GET /api/v1/health                                    → Santé de l'API")
		log.Println("   GET /api/v1/paiement/plaque/{plaque}                  → Par numéro de plaque")
		log.Println("   GET /api/v1/paiement/transaction/{num_transaction}    → Par référence de paiement")

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Erreur serveur: %v", err)
		}
	}()

	// ── 7. Gestion de l'arrêt propre (Graceful Shutdown) ─────────────────────
	// Attendre un signal d'arrêt (Ctrl+C ou SIGTERM)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("\n⏳ Arrêt du serveur en cours...")

	// Donner 10 secondes aux requêtes en cours pour se terminer
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("⚠️  Arrêt forcé: %v", err)
	}

	log.Println("👋 Serveur arrêté proprement.")
}
