// Package config gère la configuration globale de l'application
package config

import (
	"fmt"
	"os"
)

// Config contient toutes les configurations de l'application
type Config struct {
	DB     DatabaseConfig
	Server ServerConfig
}

// DatabaseConfig contient la configuration de la base de données
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
}

// ServerConfig contient la configuration du serveur HTTP
type ServerConfig struct {
	Port string
}

// Load charge la configuration depuis les variables d'environnement
// avec des valeurs par défaut pour le développement
func Load() *Config {
	return &Config{
		DB: DatabaseConfig{
			Host:     getEnv("DB_HOST", "127.0.0.1"),
			Port:     getEnv("DB_PORT", "3306"),
			User:     getEnv("DB_USER", "root"),
			Password: getEnv("DB_PASSWORD", ""),
			Name:     getEnv("DB_NAME", "payfisc"),
		},
		Server: ServerConfig{
			Port: getEnv("SERVER_PORT", ":8090"),
		},
	}
}

// DSN retourne la chaîne de connexion MySQL
func (c *DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4&loc=Local",
		c.User, c.Password, c.Host, c.Port, c.Name,
	)
}

// getEnv récupère une variable d'environnement ou retourne la valeur par défaut
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
