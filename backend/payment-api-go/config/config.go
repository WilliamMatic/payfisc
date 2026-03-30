package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

// Config contient toute la configuration de l'application
type Config struct {
	// Serveur
	Port        string
	Environment string

	// Base de données
	DBHost         string
	DBPort         string
	DBUser         string
	DBPassword     string
	DBName         string
	DBMaxOpenConns int
	DBMaxIdleConns int
	DBConnMaxLife  time.Duration

	// JWT
	JWTSecret     string
	JWTExpiration time.Duration

	// Rate Limiting
	RateLimitMax    int
	RateLimitWindow time.Duration

	// CORS
	AllowedOrigins []string
}

// Load charge la configuration depuis les variables d'environnement
func Load() *Config {
	return &Config{
		Port:            getEnv("PORT", "3000"),
		Environment:     getEnv("ENVIRONMENT", "development"),
		DBHost:          getEnv("DB_HOST", "localhost"),
		DBPort:          getEnv("DB_PORT", "3306"),
		DBUser:          getEnv("DB_USER", "root"),
		DBPassword:      getEnv("DB_PASSWORD", ""),
		DBName:          getEnv("DB_NAME", "payfisc"),
		DBMaxOpenConns:  getEnvInt("DB_MAX_OPEN_CONNS", 25),
		DBMaxIdleConns:  getEnvInt("DB_MAX_IDLE_CONNS", 10),
		DBConnMaxLife:   time.Duration(getEnvInt("DB_CONN_MAX_LIFE_MINUTES", 5)) * time.Minute,
		JWTSecret:       getEnv("JWT_SECRET", ""),
		JWTExpiration:   time.Duration(getEnvInt("JWT_EXPIRATION_MINUTES", 60)) * time.Minute,
		RateLimitMax:    getEnvInt("RATE_LIMIT_MAX", 100),
		RateLimitWindow: time.Duration(getEnvInt("RATE_LIMIT_WINDOW_SECONDS", 60)) * time.Second,
		AllowedOrigins:  getEnvSlice("ALLOWED_ORIGINS", []string{"*"}),
	}
}

// IsProduction retourne true si l'environnement est production
func (c *Config) IsProduction() bool {
	return c.Environment == "production"
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getEnvSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		parts := strings.Split(value, ",")
		result := make([]string, 0, len(parts))
		for _, p := range parts {
			trimmed := strings.TrimSpace(p)
			if trimmed != "" {
				result = append(result, trimmed)
			}
		}
		if len(result) > 0 {
			return result
		}
	}
	return defaultValue
}
