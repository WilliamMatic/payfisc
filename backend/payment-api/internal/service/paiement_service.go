package service

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"payment-api/internal/models"
	"payment-api/internal/repository"
	"payment-api/pkg/utils"
	"time"
)

type PaiementService struct {
	impotRepo    *repository.ImpotRepository
	benefRepo    *repository.BeneficiaireRepository
	paiementRepo *repository.PaiementRepository
	notifRepo    *repository.NotificationRepository
	fraisRepo    *repository.FraisRepository
	banqueRepo   *repository.BanqueRepository
	db           *sql.DB
}

func NewPaiementService(
	db *sql.DB,
	ir *repository.ImpotRepository,
	br *repository.BeneficiaireRepository,
	pr *repository.PaiementRepository,
	nr *repository.NotificationRepository,
	fr *repository.FraisRepository,
	bqr *repository.BanqueRepository,
) *PaiementService {
	return &PaiementService{
		impotRepo:    ir,
		benefRepo:    br,
		paiementRepo: pr,
		notifRepo:    nr,
		fraisRepo:    fr,
		banqueRepo:   bqr,
		db:           db,
	}
}

// InitPaiement correspond à initialiserPaiement()
func (s *PaiementService) InitPaiement(bankCtx *BankContext, impotID int, nbDeclarations int) (map[string]interface{}, error) {
	// 1. Vérifier l'impôt
	impot, err := s.impotRepo.GetByID(impotID)
	if err != nil {
		return nil, errors.New("impôt non trouvé ou inactif")
	}

	// 2. Calcul montant total
	montantTotal := impot.Prix * float64(nbDeclarations)

	// 3. Vérifier limites de montant
	if montantTotal < bankCtx.Config.Limits.MinAmount {
		return nil, fmt.Errorf("le montant est inférieur au minimum autorisé: %.2f", bankCtx.Config.Limits.MinAmount)
	}
	if montantTotal > bankCtx.Config.Limits.MaxAmount {
		return nil, fmt.Errorf("le montant dépasse le maximum autorisé: %.2f", bankCtx.Config.Limits.MaxAmount)
	}

	// 4. Récupérer la répartition des bénéficiaires
	repartition, err := s.buildRepartition(impotID, montantTotal)
	if err != nil {
		return nil, err
	}
	if len(repartition) == 0 {
		return nil, errors.New("aucun bénéficiaire configuré pour cet impôt")
	}

	// 5. Générer référence unique
	ref := utils.GeneratePaymentReference()

	// 6. Créer le paiement temporaire
	repartitionJSON, _ := json.Marshal(repartition)
	tempPaiement := &models.PaiementTemp{
		Reference:          ref,
		ImpotID:            impotID,
		NombreDeclarations: nbDeclarations,
		MontantTotal:       montantTotal,
		RepartitionJSON:    repartitionJSON,
	}
	tempID, err := s.paiementRepo.CreateTemp(tempPaiement)
	if err != nil {
		return nil, errors.New("échec de la création du paiement temporaire")
	}
	tempPaiement.ID = int(tempID)

	// 7. Enregistrer notification
	notif := &models.Notification{
		TypeNotification: "paiement_initialise",
		Titre:            "Paiement initialisé",
		Message:          fmt.Sprintf("Paiement d'impôt initialisé - Référence: %s - Montant: %.2f", ref, montantTotal),
		IDPaiement:       sql.NullInt64{Int64: int64(tempID), Valid: true},
	}
	_ = s.notifRepo.Create(notif)

	// 8. Construire la réponse
	callbackURL := ""
	if bankCtx.RawBanque.URLWebhookConfirmation.Valid {
		callbackURL = bankCtx.RawBanque.URLWebhookConfirmation.String + "?ref=" + ref
	}

	response := map[string]interface{}{
		"reference_paiement": ref,
		"impot": map[string]interface{}{
			"id":            impot.ID,
			"nom":           impot.Nom,
			"description":   impot.Description,
			"prix_unitaire": impot.Prix,
			"periode":       impot.Periode,
		},
		"details": map[string]interface{}{
			"nombre_declarations": nbDeclarations,
			"montant_total":       montantTotal,
			"montant_unitaire":    impot.Prix,
		},
		"repartition":     repartition,
		"callback_url":    callbackURL,
		"date_expiration": time.Now().Add(1 * time.Hour).Format("2006-01-02 15:04:05"),
	}
	return response, nil
}

// TraiterPaiement correspond à traiterPaiementImpot()
func (s *PaiementService) TraiterPaiement(bankCtx *BankContext, refPaiement, methodePaiement string) (map[string]interface{}, error) {
	// 1. Récupérer le paiement temporaire
	temp, err := s.paiementRepo.GetTempByReference(refPaiement)
	if err != nil {
		return nil, errors.New("paiement temporaire non trouvé")
	}

	// 2. Vérifier expiration (1 heure)
	if time.Since(temp.DateCreation) > 1*time.Hour {
		return nil, errors.New("le paiement a expiré")
	}

	// 3. Démarrer transaction
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// 4. Créer des repositories avec la transaction
	paiementRepo := repository.NewPaiementRepositoryWithTx(tx)

	// 5. Insertion paiement immatriculation
	pi := &models.PaiementImmatriculation{
		Montant:        temp.MontantTotal,
		MontantInitial: temp.MontantTotal,
		ImpotID:        fmt.Sprintf("%d", temp.ImpotID),
		ModePaiement:   methodePaiement,
		Statut:         "completed",
		UtilisateurID:  0,
		SiteID:         0,
		NombrePlaques:  temp.NombreDeclarations,
		Etat:           1,
		ParticulierID:  0,
	}
	paiementID, err := paiementRepo.CreatePaiementImmatriculation(pi)
	if err != nil {
		return nil, fmt.Errorf("échec création paiement immatriculation: %v", err)
	}

	// 6. Générer référence bancaire
	refBancaire := utils.GenerateBankReference()

	// 7. Données d'initiation
	initData := map[string]interface{}{
		"montant":             temp.MontantTotal,
		"methode_paiement":    methodePaiement,
		"nombre_declarations": temp.NombreDeclarations,
		"impot_id":            temp.ImpotID,
	}
	initJSON, _ := json.Marshal(initData)

	// 8. Créer paiement bancaire
	pb := &models.PaiementBancaire{
		IDPaiement:        int(paiementID),
		BankID:            bankCtx.BankID,
		ReferenceBancaire: refBancaire,
		Statut:            "complete",
		DonneesInitiation: initJSON,
	}
	paiementBancaireID, err := paiementRepo.CreatePaiementBancaire(pb)
	if err != nil {
		return nil, fmt.Errorf("échec création paiement bancaire: %v", err)
	}

	// 9. Créer répartition
	var repartData []models.RepartitionBeneficiaire
	if err := json.Unmarshal(temp.RepartitionJSON, &repartData); err != nil {
		return nil, err
	}

	var repartitions []models.RepartitionPaiement
	for _, rb := range repartData {
		rep := models.RepartitionPaiement{
			IDPaiementImmatriculation: int(paiementID),
			BeneficiaireID:            rb.BeneficiaireID,
			TypePart:                  rb.TypePart,
			ValeurPartOriginale:       rb.ValeurPartOriginale,
			ValeurPartCalculee:        rb.Montant,
			Montant:                   rb.Montant,
		}
		repartitions = append(repartitions, rep)
	}
	if err := paiementRepo.CreateRepartition(repartitions); err != nil {
		return nil, fmt.Errorf("échec création répartition: %v", err)
	}

	// 10. Supprimer le temporaire
	_ = paiementRepo.DeleteTempByReference(refPaiement)

	// 11. Commit transaction
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	// 12. Notification (hors transaction)
	notif := &models.Notification{
		TypeNotification: "paiement_traite",
		Titre:            "Paiement traité",
		Message:          fmt.Sprintf("Paiement d'impôt traité - Référence: %s - Montant: %.2f", refPaiement, temp.MontantTotal),
		IDPaiement:       sql.NullInt64{Int64: int64(paiementID), Valid: true},
	}
	_ = s.notifRepo.Create(notif)

	// 13. Réponse
	return map[string]interface{}{
		"paiement_id":          fmt.Sprintf("%d", paiementID),
		"paiement_bancaire_id": fmt.Sprintf("%d", paiementBancaireID),
		"reference_bancaire":   refBancaire,
		"reference_paiement":   refPaiement,
		"montant":              temp.MontantTotal,
		"nombre_declarations":  temp.NombreDeclarations,
		"methode_paiement":     methodePaiement,
		"date_paiement":        time.Now().Format("2006-01-02 15:04:05"),
	}, nil
}

// AnnulerPaiement correspond à annulerPaiementImpot()
func (s *PaiementService) AnnulerPaiement(bankCtx *BankContext, referenceBancaire string) (map[string]interface{}, error) {
	// 1. Récupérer le paiement bancaire et le paiement associé
	pb, pi, err := s.paiementRepo.GetPaiementBancaireByReference(referenceBancaire)
	if err != nil {
		return nil, errors.New("paiement non trouvé")
	}

	// 2. Vérifier si déjà servi (etat = 0 = déjà servi)
	if pi.Etat == 0 {
		return nil, errors.New("impossible d'annuler un paiement déjà servi")
	}

	// 3. Démarrer transaction
	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// 4. Repository avec transaction
	paiementRepo := repository.NewPaiementRepositoryWithTx(tx)

	// 5. Supprimer paiement bancaire
	if err := paiementRepo.DeletePaiementBancaireByPaiementID(pb.IDPaiement); err != nil {
		return nil, err
	}

	// 6. Supprimer répartition
	if err := paiementRepo.DeleteRepartitionByPaiementID(pb.IDPaiement); err != nil {
		return nil, err
	}

	// 7. Supprimer paiement immatriculation
	if err := paiementRepo.DeletePaiementImmatriculation(pb.IDPaiement); err != nil {
		return nil, err
	}

	// 8. Commit
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"reference": referenceBancaire,
		"type":      "definitif",
	}, nil
}

// buildRepartition calcule les montants pour chaque bénéficiaire
func (s *PaiementService) buildRepartition(impotID int, montantTotal float64) ([]models.RepartitionBeneficiaire, error) {
	list, err := s.benefRepo.GetRepartitionByImpotID(impotID)
	if err != nil {
		return nil, err
	}

	var result []models.RepartitionBeneficiaire
	for _, ib := range list {
		benef, err := s.benefRepo.GetBeneficiaireByID(ib.BeneficiaireID)
		if err != nil {
			continue
		}

		var montant float64
		if ib.TypePart == "pourcentage" {
			montant = (montantTotal * ib.ValeurPart) / 100
		} else {
			montant = ib.ValeurPart
		}

		result = append(result, models.RepartitionBeneficiaire{
			BeneficiaireID:      ib.BeneficiaireID,
			Nom:                 benef.Nom,
			Telephone:           benef.Telephone,
			NumeroCompte:        benef.NumeroCompte,
			TypePart:            ib.TypePart,
			ValeurPartOriginale: ib.ValeurPart,
			Montant:             montant,
		})
	}
	return result, nil
}
