package utils

import (
	"crypto/rand"
	"crypto/subtle"
	"fmt"
	"math/big"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// ============================================================================
// Erreurs API structurées
// ============================================================================

// APIError représente une erreur métier avec code HTTP et code interne
type APIError struct {
	StatusCode int    `json:"-"`
	Code       string `json:"code"`
	Message    string `json:"message"`
}

func (e *APIError) Error() string {
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// NewAPIError crée une nouvelle erreur API
func NewAPIError(statusCode int, code, message string) *APIError {
	return &APIError{
		StatusCode: statusCode,
		Code:       code,
		Message:    message,
	}
}

// ============================================================================
// JWT Token Management
// ============================================================================

// JWTClaims contient les données du token JWT
type JWTClaims struct {
	BankID      string   `json:"bank_id"`
	BankName    string   `json:"bank_name"`
	BankDBID    int      `json:"bank_db_id"`
	Permissions []string `json:"permissions"`
	jwt.RegisteredClaims
}

// GenerateJWT crée un nouveau token JWT signé
func GenerateJWT(secret string, bankID, bankName string, bankDBID int, permissions []string, expiration time.Duration) (string, time.Time, error) {
	expiresAt := time.Now().Add(expiration)

	claims := &JWTClaims{
		BankID:      bankID,
		BankName:    bankName,
		BankDBID:    bankDBID,
		Permissions: permissions,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "payfisc-api",
			Subject:   bankID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", time.Time{}, fmt.Errorf("impossible de signer le token: %w", err)
	}

	return tokenString, expiresAt, nil
}

// ValidateJWT valide et parse un token JWT
func ValidateJWT(tokenString, secret string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Vérifier que l'algorithme de signature est bien HMAC
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("algorithme de signature inattendu: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("claims de token invalides")
	}

	return claims, nil
}

// ============================================================================
// Cryptographie & sécurité
// ============================================================================

// SecureCompare effectue une comparaison à temps constant (anti timing-attack)
func SecureCompare(a, b string) bool {
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}

// GenerateReference génère une référence unique avec préfixe
// Format: PREFIX + YYYYMMDDHHmmss + 5 caractères aléatoires
func GenerateReference(prefix string) (string, error) {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	suffix := make([]byte, 5)
	for i := range suffix {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", fmt.Errorf("impossible de générer la référence: %w", err)
		}
		suffix[i] = charset[num.Int64()]
	}
	return prefix + time.Now().Format("20060102150405") + string(suffix), nil
}

// GenerateBankReference génère une référence bancaire unique
// Format: BANK + YYYYMMDDHHmmss + 4 chiffres aléatoires
func GenerateBankReference() (string, error) {
	num := make([]byte, 2)
	if _, err := rand.Read(num); err != nil {
		return "", fmt.Errorf("impossible de générer la référence bancaire: %w", err)
	}
	randNum := int(num[0])<<8 | int(num[1])
	return fmt.Sprintf("BANK%s%04d", time.Now().Format("20060102150405"), randNum%10000), nil
}
