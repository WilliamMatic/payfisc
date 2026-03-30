package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v3"

	"payfisc-api/config"
	"payfisc-api/models"
	"payfisc-api/utils"
)

// JWTAuth est le middleware d'authentification JWT
// Il vérifie la présence et la validité du token Bearer dans le header Authorization
func JWTAuth(cfg *config.Config) fiber.Handler {
	return func(c fiber.Ctx) error {
		// Récupérer le header Authorization
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(models.APIResponse{
				Status:  "error",
				Code:    "MISSING_AUTH_HEADERS",
				Message: "En-tête d'authentification manquant. Utilisez: Authorization: Bearer <token>",
			})
		}

		// Extraire le token du format "Bearer <token>"
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			return c.Status(fiber.StatusUnauthorized).JSON(models.APIResponse{
				Status:  "error",
				Code:    "INVALID_TOKEN_FORMAT",
				Message: "Format de token invalide. Utilisez: Bearer <token>",
			})
		}

		tokenString = strings.TrimSpace(tokenString)
		if tokenString == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(models.APIResponse{
				Status:  "error",
				Code:    "EMPTY_TOKEN",
				Message: "Le token est vide",
			})
		}

		// Valider le token JWT
		claims, err := utils.ValidateJWT(tokenString, cfg.JWTSecret)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(models.APIResponse{
				Status:  "error",
				Code:    "INVALID_TOKEN",
				Message: "Token invalide ou expiré",
			})
		}

		// Stocker les informations de la banque dans le contexte
		c.Locals("bank_id", claims.BankID)
		c.Locals("bank_name", claims.BankName)
		c.Locals("bank_db_id", claims.BankDBID)
		c.Locals("permissions", claims.Permissions)

		return c.Next()
	}
}

// RequirePermission vérifie qu'une permission spécifique est présente
func RequirePermission(permission string) fiber.Handler {
	return func(c fiber.Ctx) error {
		permissions, ok := c.Locals("permissions").([]string)
		if !ok {
			return c.Status(fiber.StatusForbidden).JSON(models.APIResponse{
				Status:  "error",
				Code:    "INSUFFICIENT_PERMISSIONS",
				Message: "Permissions insuffisantes",
			})
		}

		for _, p := range permissions {
			if p == permission {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(models.APIResponse{
			Status:  "error",
			Code:    "INSUFFICIENT_PERMISSIONS",
			Message: "Permission requise: " + permission,
		})
	}
}
