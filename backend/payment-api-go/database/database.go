package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"payfisc-api/config"

	_ "github.com/go-sql-driver/mysql"
)

// DB est le pool de connexions global
var DB *sql.DB

// Connect initialise le pool de connexions MySQL
func Connect(cfg *config.Config) error {
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4&collation=utf8mb4_unicode_ci&loc=Local&timeout=10s&readTimeout=30s&writeTimeout=30s",
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
	)

	var err error
	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		return fmt.Errorf("impossible d'ouvrir la base de données: %w", err)
	}

	// Configuration du pool de connexions
	DB.SetMaxOpenConns(cfg.DBMaxOpenConns)
	DB.SetMaxIdleConns(cfg.DBMaxIdleConns)
	DB.SetConnMaxLifetime(cfg.DBConnMaxLife)
	DB.SetConnMaxIdleTime(3 * time.Minute)

	// Vérifier la connexion
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := DB.PingContext(ctx); err != nil {
		return fmt.Errorf("impossible de contacter la base de données: %w", err)
	}

	// Créer les tables nécessaires
	if err := ensureTables(); err != nil {
		return fmt.Errorf("impossible de créer les tables: %w", err)
	}

	log.Println("✅ Connexion à la base de données établie")
	return nil
}

// Close ferme proprement le pool de connexions
func Close() {
	if DB != nil {
		if err := DB.Close(); err != nil {
			log.Printf("Erreur lors de la fermeture de la base de données: %v", err)
		}
	}
}

// Health vérifie l'état de la connexion
func Health() error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	return DB.PingContext(ctx)
}

// ensureTables crée les tables nécessaires si elles n'existent pas
func ensureTables() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS paiements_immatriculation_temp (
			id INT AUTO_INCREMENT PRIMARY KEY,
			reference VARCHAR(50) UNIQUE NOT NULL,
			impot_id INT NOT NULL,
			nombre_declarations INT NOT NULL,
			montant_total DECIMAL(15,2) NOT NULL,
			repartition_json JSON NOT NULL,
			bank_id VARCHAR(100) NOT NULL,
			date_creation DATETIME NOT NULL,
			INDEX idx_reference (reference),
			INDEX idx_date_creation (date_creation),
			INDEX idx_bank_id (bank_id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

		`CREATE TABLE IF NOT EXISTS connexions_bancaires (
			id INT AUTO_INCREMENT PRIMARY KEY,
			banque_id INT NOT NULL,
			ip VARCHAR(45) NOT NULL,
			user_agent TEXT,
			date_connexion DATETIME NOT NULL,
			INDEX idx_banque_id (banque_id),
			INDEX idx_date_connexion (date_connexion)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
	}

	for _, q := range queries {
		if _, err := DB.Exec(q); err != nil {
			return fmt.Errorf("erreur création table: %w", err)
		}
	}

	return nil
}
