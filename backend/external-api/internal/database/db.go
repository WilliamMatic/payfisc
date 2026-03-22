// Package database gère la connexion et le pool de connexions MySQL
package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"external-api/internal/config"

	_ "github.com/go-sql-driver/mysql" // Driver MySQL
)

// DB est le pool de connexions global à la base de données
var DB *sql.DB

// InitDB initialise et configure le pool de connexions MySQL
func InitDB(cfg *config.DatabaseConfig) error {
	var err error

	// Ouvrir la connexion (ne teste pas encore la connexion)
	DB, err = sql.Open("mysql", cfg.DSN())
	if err != nil {
		return fmt.Errorf("erreur ouverture connexion MySQL: %w", err)
	}

	// Configuration du pool de connexions pour la performance
	DB.SetMaxOpenConns(25)                 // Maximum 25 connexions ouvertes simultanément
	DB.SetMaxIdleConns(10)                 // 10 connexions inactives conservées
	DB.SetConnMaxLifetime(5 * time.Minute) // Durée de vie max d'une connexion

	// Vérifier que la connexion fonctionne réellement
	if err = DB.Ping(); err != nil {
		return fmt.Errorf("MySQL ne répond pas: %w", err)
	}

	log.Println("✅ Connecté à MySQL avec succès")
	return nil
}

// Close ferme proprement le pool de connexions
func Close() {
	if DB != nil {
		if err := DB.Close(); err != nil {
			log.Printf("⚠️  Erreur fermeture MySQL: %v", err)
		}
	}
}
