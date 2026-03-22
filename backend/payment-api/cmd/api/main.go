package main

import (
	"log"
	"net/http"
	"payment-api/internal/config"
	"payment-api/internal/database"
	"payment-api/internal/handlers"
	"payment-api/internal/repository"
	"payment-api/internal/service"

	"github.com/gorilla/mux"
)

func main() {
	// Charger la configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Erreur chargement config:", err)
	}

	// Connexion DB
	db, err := database.NewDB(cfg)
	if err != nil {
		log.Fatal("Erreur connexion DB:", err)
	}
	defer db.Close()

	// Initialisation des repositories
	banqueRepo := repository.NewBanqueRepository(db)
	impotRepo := repository.NewImpotRepository(db)
	benefRepo := repository.NewBeneficiaireRepository(db)
	paiementRepo := repository.NewPaiementRepository(db)
	notifRepo := repository.NewNotificationRepository(db)
	fraisRepo := repository.NewFraisRepository(db)
	// particulierRepo n'est pas utilisé dans le service de paiement

	// Initialisation des services
	authService := service.NewAuthService(banqueRepo, fraisRepo)
	paiementService := service.NewPaiementService(
		db, impotRepo, benefRepo, paiementRepo, notifRepo, fraisRepo, banqueRepo,
	)

	// Router
	router := mux.NewRouter()
	handlers.SetupRoutes(router, authService, paiementService)

	// Démarrage serveur
	port := cfg.ServerPort
	log.Printf("🚀 Serveur démarré sur http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}
