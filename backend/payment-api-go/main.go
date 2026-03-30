package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"runtime"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/recover"
	"github.com/joho/godotenv"

	"payfisc-api/config"
	"payfisc-api/database"
	"payfisc-api/handlers"
	"payfisc-api/middleware"
	"payfisc-api/models"
)

func main() {
	// Utiliser tous les cœurs CPU disponibles
	runtime.GOMAXPROCS(runtime.NumCPU())

	// Charger le fichier .env (silencieux si absent)
	_ = godotenv.Load()

	// Charger la configuration
	cfg := config.Load()

	// Vérifier que le secret JWT est configuré en production
	if cfg.IsProduction() && (cfg.JWTSecret == "" || cfg.JWTSecret == "CHANGEZ-MOI-EN-PRODUCTION-avec-une-cle-tres-longue-et-aleatoire") {
		log.Fatal("FATAL: JWT_SECRET doit être configuré avec une valeur sécurisée en production")
	}
	if cfg.JWTSecret == "" {
		cfg.JWTSecret = "dev-secret-key-do-not-use-in-production"
		log.Println("⚠️  Utilisation d'un secret JWT de développement. NE PAS utiliser en production!")
	}

	// Connexion à la base de données
	if err := database.Connect(cfg); err != nil {
		log.Fatalf("FATAL: Impossible de se connecter à la base de données: %v", err)
	}
	defer database.Close()

	// Créer l'application Fiber
	app := fiber.New(fiber.Config{
		AppName:                   "PayFisc API v1.0",
		ServerHeader:              "PayFisc",
		BodyLimit:                 1 * 1024 * 1024, // 1 MB max
		ReadBufferSize:            8192,
		DisableDefaultContentType: false,
		DisableHeaderNormalizing:  false,
		DisableDefaultDate:        false,
		StrictRouting:             false,
		CaseSensitive:             false,
		EnableIPValidation:        true,
		ErrorHandler:              globalErrorHandler,
	})

	// =========================================================================
	// MIDDLEWARES GLOBAUX
	// =========================================================================

	// Récupération des panics (empêche les crashs)
	app.Use(recover.New(recover.Config{
		EnableStackTrace: !cfg.IsProduction(),
	}))

	// Logging des requêtes
	app.Use(middleware.RequestLogger())

	// En-têtes de sécurité
	app.Use(middleware.SecurityHeaders())

	// CORS
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
		MaxAge:           3600,
	}))

	// Rate limiter global (par IP)
	app.Use(middleware.RateLimiter(cfg.RateLimitMax, cfg.RateLimitWindow))

	// =========================================================================
	// ROUTES
	// =========================================================================
	setupRoutes(app, cfg)

	// =========================================================================
	// DÉMARRAGE DU SERVEUR avec arrêt gracieux
	// =========================================================================
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	log.Printf("🚀 PayFisc API v1.0 démarré sur le port %s (%s)", cfg.Port, cfg.Environment)
	log.Printf("📊 CPU: %d cœurs | DB Pool: max %d connexions", runtime.NumCPU(), cfg.DBMaxOpenConns)

	if err := app.Listen(":"+cfg.Port, fiber.ListenConfig{
		GracefulContext:       ctx,
		EnablePrintRoutes:     !cfg.IsProduction(),
		EnablePrefork:         false, // Désactivé pour compatibilité — activer en production si nécessaire
		DisableStartupMessage: cfg.IsProduction(),
		ShutdownTimeout:       10 * time.Second,
	}); err != nil {
		log.Printf("Serveur arrêté: %v", err)
	}

	log.Println("👋 Arrêt gracieux terminé")
}

// setupRoutes configure toutes les routes de l'API
func setupRoutes(app *fiber.App, cfg *config.Config) {
	// ---- Health Check ----
	app.Get("/health", func(c fiber.Ctx) error {
		dbErr := database.Health()
		dbStatus := "ok"
		if dbErr != nil {
			dbStatus = "error"
		}

		return c.JSON(fiber.Map{
			"status":   "ok",
			"service":  "PayFisc API",
			"version":  "1.0.0",
			"database": dbStatus,
			"uptime":   time.Now().Format(time.RFC3339),
		})
	})

	// ---- Documentation ----
	app.Get("/docs", func(c fiber.Ctx) error {
		return c.SendFile("./docs/index.html")
	})

	// ---- Authentification (pas de JWT requis) ----
	authHandler := handlers.NewAuthHandler(cfg)
	app.Post("/api/auth/login", authHandler.Login)

	// ---- Paiements (JWT requis) ----
	api := app.Group("/api/paiement", middleware.JWTAuth(cfg))

	paymentHandler := handlers.NewPaymentHandler(cfg)
	api.Post("/initialiser-paiement", paymentHandler.InitialiserPaiement)
	api.Post("/traiter-paiement-impot", paymentHandler.TraiterPaiement)
	api.Post("/annuler-paiement-impot", paymentHandler.AnnulerPaiement)

	// ---- Route 404 ----
	app.Use(func(c fiber.Ctx) error {
		return c.Status(fiber.StatusNotFound).JSON(models.APIResponse{
			Status:  "error",
			Code:    "NOT_FOUND",
			Message: "Endpoint non trouvé: " + c.Method() + " " + c.Path(),
		})
	})
}

// globalErrorHandler gère les erreurs non capturées
func globalErrorHandler(c fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Erreur interne du serveur"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	return c.Status(code).JSON(models.APIResponse{
		Status:  "error",
		Code:    "INTERNAL_ERROR",
		Message: message,
	})
}
