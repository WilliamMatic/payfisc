package middleware

import (
	"log"
	"sync"
	"time"

	"github.com/gofiber/fiber/v3"

	"payfisc-api/models"
)

// SecurityHeaders ajoute les en-têtes de sécurité à chaque réponse
func SecurityHeaders() fiber.Handler {
	return func(c fiber.Ctx) error {
		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("X-Frame-Options", "DENY")
		c.Set("X-XSS-Protection", "1; mode=block")
		c.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		c.Set("Cache-Control", "no-store, no-cache, must-revalidate")
		c.Set("Pragma", "no-cache")
		return c.Next()
	}
}

// RequestLogger enregistre les requêtes avec des informations utiles
func RequestLogger() fiber.Handler {
	return func(c fiber.Ctx) error {
		start := time.Now()

		err := c.Next()

		duration := time.Since(start)
		statusCode := c.Response().StatusCode()

		// Format de log structuré
		log.Printf("[%s] %s %s | %d | %s | IP: %s | UA: %.50s",
			c.Method(),
			c.Path(),
			c.IP(),
			statusCode,
			duration.String(),
			c.IP(),
			c.Get("User-Agent"),
		)

		return err
	}
}

// ============================================================================
// Rate Limiter personnalisé par IP avec fenêtre glissante
// ============================================================================

type ipEntry struct {
	count   int
	resetAt time.Time
}

type rateLimiter struct {
	mu      sync.RWMutex
	entries map[string]*ipEntry
	max     int
	window  time.Duration
}

func newRateLimiter(max int, window time.Duration) *rateLimiter {
	rl := &rateLimiter{
		entries: make(map[string]*ipEntry),
		max:     max,
		window:  window,
	}

	// Nettoyage périodique des entrées expirées
	go func() {
		ticker := time.NewTicker(window)
		defer ticker.Stop()
		for range ticker.C {
			rl.cleanup()
		}
	}()

	return rl
}

func (rl *rateLimiter) allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	entry, exists := rl.entries[ip]

	if !exists || now.After(entry.resetAt) {
		rl.entries[ip] = &ipEntry{
			count:   1,
			resetAt: now.Add(rl.window),
		}
		return true
	}

	if entry.count >= rl.max {
		return false
	}

	entry.count++
	return true
}

func (rl *rateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	for ip, entry := range rl.entries {
		if now.After(entry.resetAt) {
			delete(rl.entries, ip)
		}
	}
}

// RateLimiter crée un middleware de limitation de débit par IP
func RateLimiter(max int, window time.Duration) fiber.Handler {
	limiter := newRateLimiter(max, window)

	return func(c fiber.Ctx) error {
		ip := c.IP()
		if !limiter.allow(ip) {
			return c.Status(fiber.StatusTooManyRequests).JSON(models.APIResponse{
				Status:  "error",
				Code:    "RATE_LIMIT_EXCEEDED",
				Message: "Trop de requêtes. Veuillez réessayer plus tard.",
			})
		}
		return c.Next()
	}
}
