package repository

import (
	"database/sql"
	"payment-api/internal/models"
)

type NotificationRepository struct {
	db *sql.DB
}

func NewNotificationRepository(db *sql.DB) *NotificationRepository {
	return &NotificationRepository{db: db}
}

func (r *NotificationRepository) Create(n *models.Notification) error {
	query := `
        INSERT INTO notifications
        (type_notification, nif_contribuable, id_declaration, id_paiement, titre, message, date_creation)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    `
	_, err := r.db.Exec(query,
		n.TypeNotification, n.NIFContribuable, n.IDDeclaration, n.IDPaiement,
		n.Titre, n.Message,
	)
	return err
}
