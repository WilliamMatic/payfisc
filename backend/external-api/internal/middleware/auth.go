// Package middleware contient les middlewares HTTP de l'application
package middleware

import (
	"context"
	"encoding/json"
	"external-api/internal/database"
	"external-api/internal/models"
	"log"
	"net/http"
	"strings"
	"time"
)

// Clé de contexte pour stocker la banque partenaire authentifiée
type contextKey string

const BanqueContextKey contextKey = "banque_partenaire"

// AuthMiddleware vérifie que le partenaire est authentifié via api_key et bank_id
// Il effectue également les vérifications de sécurité :
// - Existence et validité des credentials
// - Banque active et non suspendue
// - Date d'expiration des credentials
// - IP autorisées (si configurées)
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Récupérer les credentials dans les headers
		bankID := r.Header.Get("X-Bank-ID")
		apiKey := r.Header.Get("X-API-Key")

		// Vérifier la présence des headers obligatoires
		if bankID == "" || apiKey == "" {
			writeError(w, http.StatusUnauthorized,
				"Headers manquants",
				"Les headers X-Bank-ID et X-API-Key sont obligatoires",
			)
			return
		}

		// Requête pour récupérer les informations du partenaire bancaire
		query := `
			SELECT 
				bp.id, bp.partenaire_id, bp.bank_id, bp.api_key,
				bp.limite_transaction_journaliere, bp.limite_transaction_mensuelle,
				bp.montant_minimum, bp.montant_maximum,
				bp.url_webhook_confirmation, bp.url_webhook_annulation,
				bp.secret_webhook, bp.date_expiration,
				bp.ip_autorisees, bp.user_agent_autorises,
				bp.total_transactions, bp.total_montant, bp.dernier_acces,
				bp.actif, bp.suspendu, COALESCE(bp.raison_suspension, '') as raison_suspension
			FROM banques_partenaire bp
			WHERE bp.bank_id = ? AND bp.api_key = ?
			LIMIT 1
		`

		row := database.DB.QueryRow(query, bankID, apiKey)

		var banque models.BanquePartenaire
		var dateExpiration []byte
		var dernierAcces []byte
		var ipAutorisees []byte
		var userAgentAutorises []byte
		// TINYINT(1) MySQL ne se scanne pas directement en bool Go
		// Il faut passer par un int8 intermédiaire
		var actif, suspendu int8

		err := row.Scan(
			&banque.ID, &banque.PartenaireID, &banque.BankID, &banque.APIKey,
			&banque.LimiteTransactionJournaliere, &banque.LimiteTransactionMensuelle,
			&banque.MontantMinimum, &banque.MontantMaximum,
			&banque.URLWebhookConfirmation, &banque.URLWebhookAnnulation,
			&banque.SecretWebhook, &dateExpiration,
			&ipAutorisees, &userAgentAutorises,
			&banque.TotalTransactions, &banque.TotalMontant, &dernierAcces,
			&actif, &suspendu, &banque.RaisonSuspension,
		)

		if err != nil {
			// Logger l'erreur réelle côté serveur pour faciliter le debug
			log.Printf("❌ Erreur scan auth (bank_id=%s): %v", bankID, err)
			writeError(w, http.StatusUnauthorized,
				"Authentification échouée",
				"Credentials invalides",
			)
			return
		}

		// Convertir les int8 en bool après le scan
		banque.Actif = actif == 1
		banque.Suspendu = suspendu == 1

		// ✅ Vérification 1 : La banque doit être active
		if !banque.Actif {
			writeError(w, http.StatusForbidden,
				"Accès refusé",
				"Ce compte partenaire est désactivé",
			)
			return
		}

		// ✅ Vérification 2 : La banque ne doit pas être suspendue
		if banque.Suspendu {
			writeError(w, http.StatusForbidden,
				"Compte suspendu",
				"Raison: "+banque.RaisonSuspension,
			)
			return
		}

		// ✅ Vérification 3 : Date d'expiration des credentials
		if len(dateExpiration) > 0 {
			expDate, parseErr := time.Parse("2006-01-02 15:04:05", string(dateExpiration))
			if parseErr == nil && time.Now().After(expDate) {
				writeError(w, http.StatusForbidden,
					"Credentials expirés",
					"Vos credentials ont expiré le "+expDate.Format("02/01/2006"),
				)
				return
			}
		}

		// ✅ Vérification 4 : IP whitelist (si configurée)
		if len(ipAutorisees) > 0 && string(ipAutorisees) != "null" {
			var allowedIPs []string
			if jsonErr := json.Unmarshal(ipAutorisees, &allowedIPs); jsonErr == nil && len(allowedIPs) > 0 {
				clientIP := getClientIP(r)
				if !isIPAllowed(clientIP, allowedIPs) {
					writeError(w, http.StatusForbidden,
						"IP non autorisée",
						"Votre IP "+clientIP+" n'est pas dans la liste des IPs autorisées",
					)
					return
				}
			}
		}

		// Mettre à jour la date du dernier accès en arrière-plan (non bloquant)
		go updateDernierAcces(banque.ID)

		// Stocker la banque dans le contexte pour les handlers suivants
		ctx := context.WithValue(r.Context(), BanqueContextKey, &banque)

		// Journaliser la connexion (optionnel mais bon pour l'audit)
		log.Printf("🔐 Accès autorisé - BankID: %s, IP: %s, Path: %s",
			bankID, getClientIP(r), r.URL.Path,
		)

		// Passer au handler suivant
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// LoggingMiddleware journalise toutes les requêtes HTTP
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Créer un ResponseWriter personnalisé pour capturer le status code
		rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(rw, r)

		// Journaliser après la réponse
		log.Printf("📋 %s %s %d %v - %s",
			r.Method,
			r.URL.Path,
			rw.statusCode,
			time.Since(start),
			r.RemoteAddr,
		)
	})
}

// CORSMiddleware ajoute les headers CORS pour autoriser les requêtes cross-origin
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Bank-ID, X-API-Key")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")

		// Répondre immédiatement aux requêtes OPTIONS (preflight CORS)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// ============================================================
// FONCTIONS UTILITAIRES INTERNES
// ============================================================

// responseWriter est un wrapper pour capturer le status code HTTP
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// getClientIP extrait l'IP réelle du client (gère les proxies)
func getClientIP(r *http.Request) string {
	// Vérifier les headers de proxy courants
	if ip := r.Header.Get("X-Forwarded-For"); ip != "" {
		// X-Forwarded-For peut contenir plusieurs IPs, prendre la première
		parts := strings.Split(ip, ",")
		return strings.TrimSpace(parts[0])
	}
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}
	// Fallback sur l'adresse directe
	return strings.Split(r.RemoteAddr, ":")[0]
}

// isIPAllowed vérifie si l'IP du client est dans la whitelist
func isIPAllowed(clientIP string, allowedIPs []string) bool {
	for _, ip := range allowedIPs {
		if strings.TrimSpace(ip) == clientIP {
			return true
		}
	}
	return false
}

// updateDernierAcces met à jour la date du dernier accès en base
func updateDernierAcces(banqueID int) {
	_, err := database.DB.Exec(
		"UPDATE banques_partenaire SET dernier_acces = NOW() WHERE id = ?",
		banqueID,
	)
	if err != nil {
		log.Printf("⚠️  Erreur mise à jour dernier_acces pour banque %d: %v", banqueID, err)
	}
}

// writeError écrit une réponse d'erreur JSON standardisée
func writeError(w http.ResponseWriter, statusCode int, message, detail string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(models.APIResponse{
		Status:  "error",
		Message: message,
		Error:   detail,
	})
}
