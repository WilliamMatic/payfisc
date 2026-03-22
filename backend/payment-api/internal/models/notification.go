package models

import (
	"database/sql"
	"time"
)

type Notification struct {
	ID               int            `db:"id" json:"id"`
	TypeNotification string         `db:"type_notification" json:"type_notification"`
	NIFContribuable  sql.NullString `db:"nif_contribuable" json:"nif_contribuable"`
	IDDeclaration    sql.NullInt64  `db:"id_declaration" json:"id_declaration"`
	IDPaiement       sql.NullInt64  `db:"id_paiement" json:"id_paiement"`
	Titre            string         `db:"titre" json:"titre"`
	Message          string         `db:"message" json:"message"`
	DateCreation     time.Time      `db:"date_creation" json:"date_creation"`
}
