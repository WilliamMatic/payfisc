package utils

import (
	"fmt"
	"math/rand"
	"time"
)

func init() {
	rand.Seed(time.Now().UnixNano())
}

func GeneratePaymentReference() string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 5)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return "IMP" + time.Now().Format("20060102150405") + string(b)
}

func GenerateBankReference() string {
	return fmt.Sprintf("BANK%s%04d", time.Now().Format("20060102150405"), rand.Intn(10000))
}
