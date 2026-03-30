package services

import (
	"context"
	"crypto/subtle"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"payfisc-api/database"
	"payfisc-api/models"
	"payfisc-api/utils"
)

// PaymentService gère toute la logique métier des paiements d'impôts
type PaymentService struct {
	db *sql.DB
}

// NewPaymentService crée une nouvelle instance du service
func NewPaymentService() *PaymentService {
	return &PaymentService{db: database.DB}
}

// ============================================================================
// AUTHENTIFICATION
// ============================================================================

// AuthenticateBank valide les identifiants d'une banque partenaire
// avec vérifications de sécurité complètes (IP, User-Agent, maintenance, permissions, limites)
func (s *PaymentService) AuthenticateBank(ctx context.Context, bankID, apiKey, clientIP, userAgent string) (*models.BankPartner, []string, error) {
	// ÉTAPE 1: Vérification IP
	if err := s.checkIPAuthorization(ctx, bankID, clientIP); err != nil {
		return nil, nil, err
	}

	// ÉTAPE 2: Vérification User-Agent
	if err := s.checkUserAgentAuthorization(ctx, bankID, userAgent); err != nil {
		return nil, nil, err
	}

	// ÉTAPE 3: Récupérer les données de la banque (par bank_id uniquement, comparaison API key en Go)
	query := `
		SELECT bp.id, bp.partenaire_id, bp.bank_id, bp.api_key,
		       p.nom AS partenaire_nom, p.raison_sociale,
		       p.email AS contact_email, p.telephone AS contact_telephone,
		       p.base_url_api, p.timeout_api, p.retry_attempts,
		       p.ip_whitelist, p.en_maintenance,
		       bp.url_webhook_confirmation, bp.secret_webhook, bp.date_expiration,
		       bp.ip_autorisees, bp.user_agent_autorises,
		       bp.actif, bp.suspendu, bp.permissions,
		       bp.limite_transaction_journaliere, bp.limite_transaction_mensuelle,
		       bp.montant_minimum, bp.montant_maximum
		FROM banques_partenaire bp
		JOIN partenaires p ON bp.partenaire_id = p.id
		WHERE bp.bank_id = ?
		  AND bp.actif = 1
		  AND bp.suspendu = 0
		  AND p.actif = 1
		  AND (bp.date_expiration IS NULL OR bp.date_expiration > NOW())`

	bank := &models.BankPartner{}
	err := s.db.QueryRowContext(ctx, query, bankID).Scan(
		&bank.ID, &bank.PartenaireID, &bank.BankID, &bank.APIKey,
		&bank.PartenaireName, &bank.RaisonSociale,
		&bank.ContactEmail, &bank.ContactTelephone,
		&bank.BaseURLAPI, &bank.TimeoutAPI, &bank.RetryAttempts,
		&bank.IPWhitelist, &bank.EnMaintenance,
		&bank.WebhookURL, &bank.WebhookSecret, &bank.DateExpiration,
		&bank.IPAutorisees, &bank.UserAgentAutorises,
		&bank.Actif, &bank.Suspendu, &bank.Permissions,
		&bank.LimiteJournaliere, &bank.LimiteMensuelle,
		&bank.MontantMinimum, &bank.MontantMaximum,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil, utils.NewAPIError(401, "AUTH_FAILED",
				"Authentification échouée: identifiants invalides, compte suspendu, expiré ou en maintenance")
		}
		log.Printf("Erreur DB authentification bank %s: %v", bankID, err)
		return nil, nil, utils.NewAPIError(500, "AUTH_ERROR", "Erreur technique lors de l'authentification")
	}

	// ÉTAPE 4: Comparaison à temps constant de la clé API (anti timing-attack)
	if subtle.ConstantTimeCompare([]byte(bank.APIKey), []byte(apiKey)) != 1 {
		return nil, nil, utils.NewAPIError(401, "AUTH_FAILED", "Authentification échouée: identifiants invalides")
	}

	// ÉTAPE 5: Vérifier la maintenance
	if bank.EnMaintenance == 1 {
		return nil, nil, utils.NewAPIError(503, "PARTNER_MAINTENANCE", "Le partenaire est actuellement en maintenance")
	}

	// ÉTAPE 6: Vérifier les permissions
	permissions := s.parsePermissions(bank.Permissions)
	if !s.hasPermission(permissions, "process_payments") {
		return nil, nil, utils.NewAPIError(403, "INSUFFICIENT_PERMISSIONS", "Permissions insuffisantes pour traiter les paiements")
	}

	// ÉTAPE 7: Vérifier les limites de transaction
	if err := s.checkTransactionLimits(ctx, bank); err != nil {
		return nil, nil, err
	}

	// ÉTAPE 8: Enregistrer la connexion (fire-and-forget)
	go s.logConnection(context.Background(), bank.ID, clientIP, userAgent)

	// ÉTAPE 9: Mettre à jour le dernier accès (fire-and-forget)
	go s.updateLastAccess(context.Background(), bank.ID)

	log.Printf("Authentification réussie - Bank: %s (%s)", bank.PartenaireName, bank.BankID)

	return bank, permissions, nil
}

// ============================================================================
// INITIALISATION DE PAIEMENT
// ============================================================================

// InitialiserPaiement crée un paiement temporaire avec calcul de la répartition
func (s *PaymentService) InitialiserPaiement(ctx context.Context, bankID string, impotID, nombreDeclarations int) (*models.InitPaymentResponse, error) {
	// ÉTAPE 1: Récupérer l'impôt
	impot, err := s.getImpot(ctx, impotID)
	if err != nil {
		return nil, err
	}

	// ÉTAPE 2: Calculer le montant total
	montantTotal := impot.Prix * float64(nombreDeclarations)

	// ÉTAPE 3: Vérifier les limites de montant
	if err := s.checkAmountLimits(ctx, bankID, montantTotal); err != nil {
		return nil, err
	}

	// ÉTAPE 4: Récupérer la répartition des bénéficiaires
	repartition, err := s.getRepartitionBeneficiaires(ctx, impotID, montantTotal)
	if err != nil {
		return nil, err
	}
	if len(repartition) == 0 {
		return nil, utils.NewAPIError(400, "NO_BENEFICIARIES", "Aucun bénéficiaire configuré pour cet impôt")
	}

	// ÉTAPE 5: Générer la référence unique
	reference, err := utils.GenerateReference("IMP")
	if err != nil {
		log.Printf("Erreur génération référence: %v", err)
		return nil, utils.NewAPIError(500, "SYSTEM_ERROR", "Erreur lors de la génération de la référence")
	}

	// ÉTAPE 6: Créer le paiement temporaire
	tempID, err := s.createTempPayment(ctx, reference, impotID, nombreDeclarations, montantTotal, repartition, bankID)
	if err != nil {
		return nil, err
	}

	// ÉTAPE 7: Enregistrer la notification (fire-and-forget)
	go s.createNotification(context.Background(),
		"paiement_initialise",
		"Paiement initialisé",
		fmt.Sprintf("Paiement d'impôt initialisé - Référence: %s - Montant: %.2f", reference, montantTotal),
		tempID,
	)

	// ÉTAPE 8: Construire l'URL de callback
	callbackURL := s.getCallbackURL(ctx, bankID, reference)

	// ÉTAPE 9: Construire la réponse
	description := ""
	if impot.Description.Valid {
		description = impot.Description.String
	}
	periode := ""
	if impot.Periode.Valid {
		periode = impot.Periode.String
	}

	return &models.InitPaymentResponse{
		ReferencePaiement: reference,
		Impot: models.ImpotInfo{
			ID:           impot.ID,
			Nom:          impot.Nom,
			Description:  description,
			PrixUnitaire: impot.Prix,
			Periode:      periode,
		},
		Details: models.PaymentDetails{
			NombreDeclarations: nombreDeclarations,
			MontantTotal:       montantTotal,
			MontantUnitaire:    impot.Prix,
		},
		Repartition:    repartition,
		CallbackURL:    callbackURL,
		DateExpiration: time.Now().Add(1 * time.Hour).Format("2006-01-02 15:04:05"),
	}, nil
}

// ============================================================================
// TRAITEMENT DE PAIEMENT
// ============================================================================

// TraiterPaiement confirme et finalise un paiement précédemment initialisé
func (s *PaymentService) TraiterPaiement(ctx context.Context, bankID, referencePaiement, methodePaiement string) (*models.ProcessPaymentResponse, error) {
	// ÉTAPE 1: Récupérer le paiement temporaire
	tempPayment, err := s.getTempPayment(ctx, referencePaiement)
	if err != nil {
		return nil, err
	}

	// Vérifier que le paiement appartient à la banque
	if tempPayment.BankID != bankID {
		return nil, utils.NewAPIError(403, "UNAUTHORIZED_PAYMENT", "Ce paiement n'appartient pas à votre banque")
	}

	// ÉTAPE 2: Vérifier l'expiration (1 heure)
	if time.Since(tempPayment.DateCreation) > 1*time.Hour {
		// Nettoyer le paiement expiré
		go s.deleteTempPayment(context.Background(), referencePaiement)
		return nil, utils.NewAPIError(400, "PAYMENT_EXPIRED", "Le paiement a expiré")
	}

	// ÉTAPE 3: Transaction SQL pour garantir l'intégrité
	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})
	if err != nil {
		log.Printf("Erreur début transaction: %v", err)
		return nil, utils.NewAPIError(500, "SYSTEM_ERROR", "Erreur système lors du traitement")
	}
	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(); rbErr != nil {
				log.Printf("Erreur rollback: %v", rbErr)
			}
		}
	}()

	// ÉTAPE 4: Créer le paiement dans paiements_immatriculation
	idPaiement, err := s.createPaiementImmatriculation(ctx, tx, tempPayment, methodePaiement)
	if err != nil {
		return nil, utils.NewAPIError(500, "PAYMENT_PROCESSING_ERROR", "Erreur lors de la création du paiement")
	}

	// ÉTAPE 5: Générer la référence bancaire
	referenceBancaire, err := utils.GenerateBankReference()
	if err != nil {
		return nil, utils.NewAPIError(500, "SYSTEM_ERROR", "Erreur lors de la génération de la référence bancaire")
	}

	// ÉTAPE 6: Créer le paiement bancaire
	idPaiementBancaire, err := s.createPaiementBancaire(ctx, tx, idPaiement, bankID, tempPayment, methodePaiement, referenceBancaire)
	if err != nil {
		return nil, utils.NewAPIError(500, "PAYMENT_PROCESSING_ERROR", "Erreur lors de la création du paiement bancaire")
	}

	// ÉTAPE 7: Créer la répartition
	if err := s.createRepartition(ctx, tx, idPaiement, tempPayment.RepartitionJSON); err != nil {
		return nil, utils.NewAPIError(500, "PAYMENT_PROCESSING_ERROR", "Erreur lors de la création de la répartition")
	}

	// ÉTAPE 8: Supprimer le paiement temporaire
	if err := s.deleteTempPaymentTx(ctx, tx, referencePaiement); err != nil {
		log.Printf("Avertissement: erreur suppression paiement temporaire: %v", err)
	}

	// ÉTAPE 9: Commit
	if err = tx.Commit(); err != nil {
		log.Printf("Erreur commit: %v", err)
		return nil, utils.NewAPIError(500, "PAYMENT_PROCESSING_ERROR", "Erreur lors de la finalisation du paiement")
	}

	// ÉTAPE 10: Notification (fire-and-forget)
	go s.createNotification(context.Background(),
		"paiement_traite",
		"Paiement traité",
		fmt.Sprintf("Paiement traité - Réf: %s - Montant: %.2f", referencePaiement, tempPayment.MontantTotal),
		idPaiement,
	)

	datePaiement := time.Now().Format("2006-01-02 15:04:05")

	return &models.ProcessPaymentResponse{
		PaiementID:         fmt.Sprintf("%d", idPaiement),
		PaiementBancaireID: fmt.Sprintf("%d", idPaiementBancaire),
		ReferenceBancaire:  referenceBancaire,
		ReferencePaiement:  referencePaiement,
		Montant:            fmt.Sprintf("%.2f", tempPayment.MontantTotal),
		NombreDeclarations: tempPayment.NombreDeclarations,
		MethodePaiement:    methodePaiement,
		DatePaiement:       datePaiement,
	}, nil
}

// ============================================================================
// ANNULATION DE PAIEMENT
// ============================================================================

// AnnulerPaiement annule un paiement déjà traité
func (s *PaymentService) AnnulerPaiement(ctx context.Context, bankID, referencePaiement string) (*models.CancelPaymentResponse, error) {
	// ÉTAPE 1: Chercher le paiement via la référence bancaire
	payment, err := s.getPaymentByBankRef(ctx, referencePaiement)
	if err != nil {
		return nil, err
	}

	// ÉTAPE 2: Vérifier que le paiement peut être annulé (etat=0 signifie déjà servi)
	if payment.Etat == 0 {
		return nil, utils.NewAPIError(400, "PAYMENT_ALREADY_SERVED", "Impossible d'annuler un paiement déjà servi")
	}

	// ÉTAPE 3: Transaction SQL
	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})
	if err != nil {
		log.Printf("Erreur début transaction annulation: %v", err)
		return nil, utils.NewAPIError(500, "CANCELLATION_ERROR", "Erreur lors de l'annulation du paiement")
	}
	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(); rbErr != nil {
				log.Printf("Erreur rollback annulation: %v", rbErr)
			}
		}
	}()

	// ÉTAPE 4: Supprimer le paiement bancaire
	if err = s.deletePaiementBancaire(ctx, tx, payment.IDPaiement); err != nil {
		return nil, utils.NewAPIError(500, "CANCELLATION_ERROR", "Erreur lors de la suppression du paiement bancaire")
	}

	// ÉTAPE 5: Supprimer la répartition
	if err = s.deleteRepartition(ctx, tx, payment.IDPaiement); err != nil {
		return nil, utils.NewAPIError(500, "CANCELLATION_ERROR", "Erreur lors de la suppression de la répartition")
	}

	// ÉTAPE 6: Supprimer le paiement principal
	if err = s.deletePaiementImmatriculation(ctx, tx, payment.IDPaiement); err != nil {
		return nil, utils.NewAPIError(500, "CANCELLATION_ERROR", "Erreur lors de la suppression du paiement")
	}

	// ÉTAPE 7: Commit
	if err = tx.Commit(); err != nil {
		log.Printf("Erreur commit annulation: %v", err)
		return nil, utils.NewAPIError(500, "CANCELLATION_ERROR", "Erreur lors de la finalisation de l'annulation")
	}

	return &models.CancelPaymentResponse{
		Reference: referencePaiement,
		Type:      "definitif",
	}, nil
}

// ============================================================================
// MÉTHODES DE SÉCURITÉ
// ============================================================================

// checkIPAuthorization vérifie que l'IP du client est autorisée
func (s *PaymentService) checkIPAuthorization(ctx context.Context, bankID, clientIP string) error {
	query := `
		SELECT p.ip_whitelist, bp.ip_autorisees
		FROM banques_partenaire bp
		JOIN partenaires p ON bp.partenaire_id = p.id
		WHERE bp.bank_id = ?`

	var ipWhitelist, ipAutorisees sql.NullString
	err := s.db.QueryRowContext(ctx, query, bankID).Scan(&ipWhitelist, &ipAutorisees)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil // Pas de config, autoriser par défaut
		}
		log.Printf("Erreur vérification IP: %v", err)
		return nil
	}

	// Vérifier la whitelist globale du partenaire
	if ipWhitelist.Valid && ipWhitelist.String != "" {
		whitelist := s.parseJSONStringSlice(ipWhitelist)
		if len(whitelist) > 0 && !s.containsString(whitelist, clientIP) {
			return utils.NewAPIError(403, "IP_NOT_AUTHORIZED", "Adresse IP non autorisée")
		}
	}

	// Vérifier les IPs spécifiques à la banque
	if ipAutorisees.Valid && ipAutorisees.String != "" {
		autorisees := s.parseJSONStringSlice(ipAutorisees)
		if len(autorisees) > 0 && !s.containsString(autorisees, clientIP) {
			return utils.NewAPIError(403, "IP_NOT_AUTHORIZED", "Adresse IP non autorisée pour cette banque")
		}
	}

	return nil
}

// checkUserAgentAuthorization vérifie que le User-Agent est autorisé
func (s *PaymentService) checkUserAgentAuthorization(ctx context.Context, bankID, userAgent string) error {
	query := `SELECT user_agent_autorises FROM banques_partenaire WHERE bank_id = ?`

	var uaAutorises sql.NullString
	err := s.db.QueryRowContext(ctx, query, bankID).Scan(&uaAutorises)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil
		}
		log.Printf("Erreur vérification User-Agent: %v", err)
		return nil
	}

	if !uaAutorises.Valid || uaAutorises.String == "" {
		return nil
	}

	autorises := s.parseJSONStringSlice(uaAutorises)
	if len(autorises) > 0 && !s.containsString(autorises, userAgent) {
		return utils.NewAPIError(403, "USER_AGENT_NOT_AUTHORIZED", "User-Agent non autorisé")
	}

	return nil
}

// checkAmountLimits vérifie les limites de montant pour une banque
func (s *PaymentService) checkAmountLimits(ctx context.Context, bankID string, montant float64) error {
	query := `
		SELECT bp.montant_minimum, bp.montant_maximum
		FROM banques_partenaire bp
		WHERE bp.bank_id = ?`

	var minAmount, maxAmount sql.NullFloat64
	if err := s.db.QueryRowContext(ctx, query, bankID).Scan(&minAmount, &maxAmount); err != nil {
		if err != sql.ErrNoRows {
			log.Printf("Erreur vérification limites montant: %v", err)
		}
		return nil
	}

	minimum := 100.0
	if minAmount.Valid {
		minimum = minAmount.Float64
	}
	if montant < minimum {
		return utils.NewAPIError(400, "AMOUNT_TOO_LOW",
			fmt.Sprintf("Le montant (%.2f) est inférieur au minimum autorisé: %.2f", montant, minimum))
	}

	maximum := 5000000.0
	if maxAmount.Valid {
		maximum = maxAmount.Float64
	}
	if montant > maximum {
		return utils.NewAPIError(400, "AMOUNT_TOO_HIGH",
			fmt.Sprintf("Le montant (%.2f) dépasse le maximum autorisé: %.2f", montant, maximum))
	}

	return nil
}

// checkTransactionLimits vérifie les limites journalières et mensuelles
func (s *PaymentService) checkTransactionLimits(ctx context.Context, bank *models.BankPartner) error {
	// Limite journalière
	limiteJournaliere := 10000000.0
	if bank.LimiteJournaliere.Valid {
		limiteJournaliere = bank.LimiteJournaliere.Float64
	}

	queryDaily := `
		SELECT COALESCE(SUM(pi.montant), 0) AS total_journalier
		FROM paiements_bancaires pb
		JOIN paiements_immatriculation pi ON pb.id_paiement = pi.id
		WHERE pb.bank_id = ?
		  AND DATE(pb.date_creation) = CURDATE()
		  AND pb.statut = 'complete'`

	var dailyTotal float64
	if err := s.db.QueryRowContext(ctx, queryDaily, bank.BankID).Scan(&dailyTotal); err != nil {
		log.Printf("Erreur vérification limite journalière: %v", err)
		return nil
	}

	if dailyTotal >= limiteJournaliere {
		return utils.NewAPIError(429, "DAILY_LIMIT_EXCEEDED", "Limite journalière de transactions atteinte")
	}

	// Limite mensuelle
	limiteMensuelle := 100000000.0
	if bank.LimiteMensuelle.Valid {
		limiteMensuelle = bank.LimiteMensuelle.Float64
	}

	queryMonthly := `
		SELECT COALESCE(SUM(pi.montant), 0) AS total_mensuel
		FROM paiements_bancaires pb
		JOIN paiements_immatriculation pi ON pb.id_paiement = pi.id
		WHERE pb.bank_id = ?
		  AND YEAR(pb.date_creation) = YEAR(CURDATE())
		  AND MONTH(pb.date_creation) = MONTH(CURDATE())
		  AND pb.statut = 'complete'`

	var monthlyTotal float64
	if err := s.db.QueryRowContext(ctx, queryMonthly, bank.BankID).Scan(&monthlyTotal); err != nil {
		log.Printf("Erreur vérification limite mensuelle: %v", err)
		return nil
	}

	if monthlyTotal >= limiteMensuelle {
		return utils.NewAPIError(429, "MONTHLY_LIMIT_EXCEEDED", "Limite mensuelle de transactions atteinte")
	}

	return nil
}

// ============================================================================
// OPÉRATIONS SUR LES IMPÔTS
// ============================================================================

// getImpot récupère un impôt actif par son ID
func (s *PaymentService) getImpot(ctx context.Context, impotID int) (*models.Impot, error) {
	query := `SELECT id, nom, description, prix, periode, actif FROM impots WHERE id = ? AND actif = 1`

	impot := &models.Impot{}
	err := s.db.QueryRowContext(ctx, query, impotID).Scan(
		&impot.ID, &impot.Nom, &impot.Description,
		&impot.Prix, &impot.Periode, &impot.Actif,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, utils.NewAPIError(400, "IMPOT_NOT_FOUND", "Impôt non trouvé ou inactif")
		}
		log.Printf("Erreur récupération impôt %d: %v", impotID, err)
		return nil, utils.NewAPIError(500, "SYSTEM_ERROR", "Erreur lors de la récupération de l'impôt")
	}

	return impot, nil
}

// ============================================================================
// OPÉRATIONS SUR LES BÉNÉFICIAIRES
// ============================================================================

// getRepartitionBeneficiaires récupère et calcule la répartition des bénéficiaires
func (s *PaymentService) getRepartitionBeneficiaires(ctx context.Context, impotID int, montantTotal float64) ([]models.BeneficiaireShare, error) {
	query := `
		SELECT ib.beneficiaire_id, b.nom, b.telephone, b.numero_compte,
		       ib.type_part, ib.valeur_part
		FROM impot_beneficiaires ib
		JOIN beneficiaires b ON ib.beneficiaire_id = b.id
		WHERE ib.impot_id = ? AND b.actif = 1
		ORDER BY ib.id`

	rows, err := s.db.QueryContext(ctx, query, impotID)
	if err != nil {
		log.Printf("Erreur récupération bénéficiaires impôt %d: %v", impotID, err)
		return nil, utils.NewAPIError(500, "SYSTEM_ERROR", "Erreur lors de la récupération des bénéficiaires")
	}
	defer rows.Close()

	var repartition []models.BeneficiaireShare
	for rows.Next() {
		var (
			benefID    int
			nom        string
			telephone  sql.NullString
			numCompte  sql.NullString
			typePart   string
			valeurPart float64
		)

		if err := rows.Scan(&benefID, &nom, &telephone, &numCompte, &typePart, &valeurPart); err != nil {
			log.Printf("Erreur scan bénéficiaire: %v", err)
			continue
		}

		var montant float64
		if typePart == "pourcentage" {
			montant = (montantTotal * valeurPart) / 100
		} else {
			montant = valeurPart
		}

		tel := ""
		if telephone.Valid {
			tel = telephone.String
		}
		compte := ""
		if numCompte.Valid {
			compte = numCompte.String
		}

		repartition = append(repartition, models.BeneficiaireShare{
			BeneficiaireID:      benefID,
			Nom:                 nom,
			Telephone:           tel,
			NumeroCompte:        compte,
			TypePart:            typePart,
			ValeurPartOriginale: valeurPart,
			Montant:             montant,
		})
	}

	if err := rows.Err(); err != nil {
		log.Printf("Erreur itération bénéficiaires: %v", err)
		return nil, utils.NewAPIError(500, "SYSTEM_ERROR", "Erreur lors du traitement des bénéficiaires")
	}

	return repartition, nil
}

// ============================================================================
// OPÉRATIONS PAIEMENT TEMPORAIRE
// ============================================================================

// createTempPayment crée un enregistrement de paiement temporaire
func (s *PaymentService) createTempPayment(ctx context.Context, reference string, impotID, nombreDeclarations int, montantTotal float64, repartition []models.BeneficiaireShare, bankID string) (int64, error) {
	repartitionJSON, err := json.Marshal(repartition)
	if err != nil {
		return 0, utils.NewAPIError(500, "SYSTEM_ERROR", "Erreur de sérialisation des données de répartition")
	}

	query := `
		INSERT INTO paiements_immatriculation_temp
		(reference, impot_id, nombre_declarations, montant_total, repartition_json, bank_id, date_creation)
		VALUES (?, ?, ?, ?, ?, ?, NOW())`

	result, err := s.db.ExecContext(ctx, query, reference, impotID, nombreDeclarations, montantTotal, string(repartitionJSON), bankID)
	if err != nil {
		log.Printf("Erreur création paiement temporaire: %v", err)
		return 0, utils.NewAPIError(500, "TEMP_PAYMENT_CREATION_FAILED", "Échec de la création du paiement temporaire")
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, utils.NewAPIError(500, "SYSTEM_ERROR", "Erreur récupération ID du paiement temporaire")
	}

	return id, nil
}

// getTempPayment récupère un paiement temporaire par sa référence
func (s *PaymentService) getTempPayment(ctx context.Context, reference string) (*models.TempPayment, error) {
	query := `SELECT id, reference, impot_id, nombre_declarations, montant_total, repartition_json, bank_id, date_creation
	          FROM paiements_immatriculation_temp WHERE reference = ?`

	tp := &models.TempPayment{}
	err := s.db.QueryRowContext(ctx, query, reference).Scan(
		&tp.ID, &tp.Reference, &tp.ImpotID, &tp.NombreDeclarations,
		&tp.MontantTotal, &tp.RepartitionJSON, &tp.BankID, &tp.DateCreation,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, utils.NewAPIError(400, "PAYMENT_NOT_FOUND", "Paiement temporaire non trouvé")
		}
		log.Printf("Erreur récupération paiement temporaire %s: %v", reference, err)
		return nil, utils.NewAPIError(500, "SYSTEM_ERROR", "Erreur lors de la récupération du paiement temporaire")
	}

	return tp, nil
}

// deleteTempPayment supprime un paiement temporaire (hors transaction)
func (s *PaymentService) deleteTempPayment(ctx context.Context, reference string) {
	query := `DELETE FROM paiements_immatriculation_temp WHERE reference = ?`
	if _, err := s.db.ExecContext(ctx, query, reference); err != nil {
		log.Printf("Erreur suppression paiement temporaire %s: %v", reference, err)
	}
}

// deleteTempPaymentTx supprime un paiement temporaire dans une transaction
func (s *PaymentService) deleteTempPaymentTx(ctx context.Context, tx *sql.Tx, reference string) error {
	query := `DELETE FROM paiements_immatriculation_temp WHERE reference = ?`
	_, err := tx.ExecContext(ctx, query, reference)
	return err
}

// ============================================================================
// OPÉRATIONS PAIEMENT DÉFINITIF
// ============================================================================

// createPaiementImmatriculation crée le paiement permanent
func (s *PaymentService) createPaiementImmatriculation(ctx context.Context, tx *sql.Tx, tp *models.TempPayment, methodePaiement string) (int64, error) {
	query := `
		INSERT INTO paiements_immatriculation
		(montant, montant_initial, impot_id, mode_paiement, statut, date_paiement,
		 utilisateur_id, site_id, nombre_plaques, etat, particulier_id)
		VALUES (?, ?, ?, ?, 'completed', NOW(), 0, 0, ?, 1, 0)`

	result, err := tx.ExecContext(ctx, query,
		tp.MontantTotal, tp.MontantTotal, tp.ImpotID,
		methodePaiement, tp.NombreDeclarations,
	)
	if err != nil {
		log.Printf("Erreur création paiement immatriculation: %v", err)
		return 0, err
	}

	return result.LastInsertId()
}

// createPaiementBancaire crée l'enregistrement dans paiements_bancaires
func (s *PaymentService) createPaiementBancaire(ctx context.Context, tx *sql.Tx, idPaiement int64, bankID string, tp *models.TempPayment, methodePaiement, referenceBancaire string) (int64, error) {
	donneesInitiation, _ := json.Marshal(map[string]interface{}{
		"montant":             tp.MontantTotal,
		"methode_paiement":    methodePaiement,
		"nombre_declarations": tp.NombreDeclarations,
		"impot_id":            tp.ImpotID,
	})

	query := `
		INSERT INTO paiements_bancaires
		(id_paiement, bank_id, reference_bancaire, statut, donnees_initiation, date_creation)
		VALUES (?, ?, ?, 'complete', ?, NOW())`

	result, err := tx.ExecContext(ctx, query,
		idPaiement, bankID, referenceBancaire, string(donneesInitiation),
	)
	if err != nil {
		log.Printf("Erreur création paiement bancaire: %v", err)
		return 0, err
	}

	return result.LastInsertId()
}

// createRepartition crée les enregistrements de répartition des bénéficiaires
func (s *PaymentService) createRepartition(ctx context.Context, tx *sql.Tx, idPaiement int64, repartitionJSON string) error {
	var repartition []models.BeneficiaireShare
	if err := json.Unmarshal([]byte(repartitionJSON), &repartition); err != nil {
		log.Printf("Erreur désérialisation répartition: %v", err)
		return err
	}

	query := `
		INSERT INTO repartition_paiements_immatriculation
		(id_paiement_immatriculation, beneficiaire_id, type_part,
		 valeur_part_originale, valeur_part_calculee, montant, date_creation)
		VALUES (?, ?, ?, ?, ?, ?, NOW())`

	for _, benef := range repartition {
		if _, err := tx.ExecContext(ctx, query,
			idPaiement, benef.BeneficiaireID, benef.TypePart,
			benef.ValeurPartOriginale, benef.Montant, benef.Montant,
		); err != nil {
			log.Printf("Erreur création répartition bénéficiaire %d: %v", benef.BeneficiaireID, err)
			return err
		}
	}

	return nil
}

// getPaymentByBankRef récupère un paiement par sa référence bancaire
func (s *PaymentService) getPaymentByBankRef(ctx context.Context, reference string) (*models.PaymentRecord, error) {
	query := `
		SELECT pb.id, pb.id_paiement, pb.bank_id, pb.reference_bancaire,
		       pb.statut, pb.donnees_initiation, pb.date_creation,
		       pi.etat
		FROM paiements_bancaires pb
		INNER JOIN paiements_immatriculation pi ON pi.id = pb.id_paiement
		WHERE pb.reference_bancaire = ?`

	pr := &models.PaymentRecord{}
	err := s.db.QueryRowContext(ctx, query, reference).Scan(
		&pr.ID, &pr.IDPaiement, &pr.BankID, &pr.ReferenceBancaire,
		&pr.Statut, &pr.DonneesInitiation, &pr.DateCreation,
		&pr.Etat,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, utils.NewAPIError(400, "PAYMENT_NOT_FOUND", "Paiement non trouvé")
		}
		log.Printf("Erreur récupération paiement par ref bancaire %s: %v", reference, err)
		return nil, utils.NewAPIError(500, "SYSTEM_ERROR", "Erreur lors de la récupération du paiement")
	}

	return pr, nil
}

// deletePaiementBancaire supprime un paiement bancaire
func (s *PaymentService) deletePaiementBancaire(ctx context.Context, tx *sql.Tx, idPaiement int) error {
	_, err := tx.ExecContext(ctx, `DELETE FROM paiements_bancaires WHERE id_paiement = ?`, idPaiement)
	if err != nil {
		log.Printf("Erreur suppression paiement bancaire: %v", err)
	}
	return err
}

// deleteRepartition supprime les répartitions d'un paiement
func (s *PaymentService) deleteRepartition(ctx context.Context, tx *sql.Tx, idPaiement int) error {
	_, err := tx.ExecContext(ctx, `DELETE FROM repartition_paiements_immatriculation WHERE id_paiement_immatriculation = ?`, idPaiement)
	if err != nil {
		log.Printf("Erreur suppression répartition: %v", err)
	}
	return err
}

// deletePaiementImmatriculation supprime le paiement principal
func (s *PaymentService) deletePaiementImmatriculation(ctx context.Context, tx *sql.Tx, idPaiement int) error {
	_, err := tx.ExecContext(ctx, `DELETE FROM paiements_immatriculation WHERE id = ?`, idPaiement)
	if err != nil {
		log.Printf("Erreur suppression paiement immatriculation: %v", err)
	}
	return err
}

// ============================================================================
// OPÉRATIONS DE LOGGING ET NOTIFICATIONS
// ============================================================================

// logConnection enregistre une connexion bancaire
func (s *PaymentService) logConnection(ctx context.Context, bankDBID int, ip, userAgent string) {
	query := `INSERT INTO connexions_bancaires (banque_id, ip, user_agent, date_connexion) VALUES (?, ?, ?, NOW())`
	if _, err := s.db.ExecContext(ctx, query, bankDBID, ip, userAgent); err != nil {
		log.Printf("Erreur enregistrement connexion: %v", err)
	}
}

// updateLastAccess met à jour la date du dernier accès
func (s *PaymentService) updateLastAccess(ctx context.Context, bankDBID int) {
	query := `UPDATE banques_partenaire SET dernier_acces = NOW() WHERE id = ?`
	if _, err := s.db.ExecContext(ctx, query, bankDBID); err != nil {
		log.Printf("Erreur mise à jour dernier accès: %v", err)
	}
}

// createNotification enregistre une notification dans la base
func (s *PaymentService) createNotification(ctx context.Context, notifType, titre, message string, idPaiement int64) {
	query := `
		INSERT INTO notifications
		(type_notification, nif_contribuable, id_declaration, id_paiement, titre, message, date_creation)
		VALUES (?, NULL, NULL, ?, ?, ?, NOW())`

	if _, err := s.db.ExecContext(ctx, query, notifType, idPaiement, titre, message); err != nil {
		log.Printf("Erreur création notification: %v", err)
	}
}

// ============================================================================
// OPÉRATIONS SUR LES FRAIS
// ============================================================================

// GetFraisPercentage récupère le pourcentage de frais bancaires
func (s *PaymentService) GetFraisPercentage(ctx context.Context) float64 {
	query := `SELECT valeur FROM frais_bancaires WHERE type = 'pourcentage' AND actif = 1 ORDER BY date_creation DESC LIMIT 1`

	var valeur float64
	if err := s.db.QueryRowContext(ctx, query).Scan(&valeur); err != nil {
		return 0.5 // Valeur par défaut
	}
	return valeur
}

// GetFraisMinimum récupère le montant minimum de frais
func (s *PaymentService) GetFraisMinimum(ctx context.Context) float64 {
	query := `SELECT valeur FROM frais_bancaires WHERE type = 'minimum' AND actif = 1 ORDER BY date_creation DESC LIMIT 1`

	var valeur float64
	if err := s.db.QueryRowContext(ctx, query).Scan(&valeur); err != nil {
		return 100.0 // Valeur par défaut
	}
	return valeur
}

// ============================================================================
// UTILITAIRES
// ============================================================================

// getCallbackURL construit l'URL de callback pour le webhook
func (s *PaymentService) getCallbackURL(ctx context.Context, bankID, reference string) string {
	query := `
		SELECT bp.url_webhook_confirmation
		FROM banques_partenaire bp
		WHERE bp.bank_id = ?`

	var webhookURL sql.NullString
	if err := s.db.QueryRowContext(ctx, query, bankID).Scan(&webhookURL); err != nil || !webhookURL.Valid {
		return ""
	}
	return webhookURL.String + "?ref=" + reference
}

// parsePermissions parse les permissions JSON d'une banque
func (s *PaymentService) parsePermissions(perms sql.NullString) []string {
	if !perms.Valid || perms.String == "" {
		return []string{"process_payments"}
	}
	var permissions []string
	if err := json.Unmarshal([]byte(perms.String), &permissions); err != nil {
		return []string{"process_payments"}
	}
	return permissions
}

// hasPermission vérifie si une permission est présente
func (s *PaymentService) hasPermission(permissions []string, required string) bool {
	for _, p := range permissions {
		if p == required {
			return true
		}
	}
	return false
}

// parseJSONStringSlice parse un champ JSON nullable en slice de strings
func (s *PaymentService) parseJSONStringSlice(ns sql.NullString) []string {
	if !ns.Valid || ns.String == "" {
		return nil
	}
	var result []string
	if err := json.Unmarshal([]byte(ns.String), &result); err != nil {
		return nil
	}
	return result
}

// containsString vérifie si une slice contient une string donnée
func (s *PaymentService) containsString(slice []string, target string) bool {
	for _, item := range slice {
		if item == target {
			return true
		}
	}
	return false
}
