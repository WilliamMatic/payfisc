# 🚀 API Externe TSC-NPS — Documentation

API Go permettant aux partenaires bancaires de consulter les données de paiements d'immatriculation.

---

## 📁 Structure du projet

```
external-api/
├── cmd/
│   └── server/
│       └── main.go                  ← Point d'entrée principal
├── internal/
│   ├── config/
│   │   └── config.go                ← Configuration (env vars)
│   ├── database/
│   │   └── db.go                    ← Pool de connexions MySQL
│   ├── handlers/
│   │   └── paiement.go              ← Handlers HTTP des routes
│   ├── middleware/
│   │   └── auth.go                  ← Auth, CORS, Logging
│   └── models/
│       └── models.go                ← Structures de données
├── pkg/
│   └── utils/
│       └── response.go              ← Helpers réponse JSON
├── setup_test_data.sql              ← Script SQL données de test
├── go.mod
└── README.md
```

---

## ⚙️ Installation & Lancement

### 1. Prérequis
- Go 1.22+
- MySQL (base de données avec les tables existantes)

### 2. Variables d'environnement

```bash
export DB_HOST=127.0.0.1
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=ton_mot_de_passe
export DB_NAME=tsc_nps_db
export SERVER_PORT=:8090
```

### 3. Insérer les données de test

```bash
mysql -u root -p tsc_nps_db < setup_test_data.sql
```

### 4. Lancer l'API

```bash
cd external-api
go mod tidy
go run cmd/server/main.go
```

---

## 🔐 Authentification

Chaque requête doit inclure ces deux headers :

| Header      | Description                          |
|-------------|--------------------------------------|
| `X-Bank-ID` | Identifiant unique de la banque      |
| `X-API-Key` | Clé API secrète de la banque         |

**Credentials de test :**
```
X-Bank-ID : BANK-TSC-TEST-001
X-API-Key : tsc-api-key-test-2024-abcdef123456
```

---

## 📡 Endpoints

### `GET /api/v1/health`
Vérification de santé de l'API *(pas d'authentification requise)*

```bash
curl http://localhost:8090/api/v1/health
```

---

### `GET /api/v1/paiement/plaque/{numero_plaque}`
Récupère le dernier paiement d'immatriculation pour une plaque donnée.

```bash
curl -X GET "http://localhost:8090/api/v1/paiement/plaque/SP222" \
  -H "X-Bank-ID: BANK-TSC-TEST-001" \
  -H "X-API-Key: tsc-api-key-test-2024-abcdef123456"
```

---

### `GET /api/v1/paiement/transaction/{numero_transaction}`
Récupère un paiement via son numéro de référence de transaction.

```bash
curl -X GET "http://localhost:8090/api/v1/paiement/transaction/VIGN-1768822573481-3014" \
  -H "X-Bank-ID: BANK-TSC-TEST-001" \
  -H "X-API-Key: tsc-api-key-test-2024-abcdef123456"
```

---

## 📦 Format de réponse

### Succès (200)

```json
{
  "status": "success",
  "message": "Paiement récupéré avec succès",
  "data": {
    "site": {
      "id": 358,
      "nom_site": "LIMETE",
      "fournisseur": "TSC-NPS"
    },
    "assujetti": {
      "id": 462774,
      "nom_complet": "OSONGA - ANDRE",
      "telephone": "",
      "adresse": "A-038 AV. KILOSA Q. MOZINDO",
      "nif": "",
      "email": ""
    },
    "engin": {
      "id": 191,
      "numero_plaque": "SP222",
      "marque": "TVS HLX125",
      "modele": "",
      "couleur": "",
      "energie": "1",
      "usage_engin": "1",
      "puissance_fiscal": "",
      "annee_fabrication": "2024",
      "numero_chassis": "09971",
      "numero_moteur": "*******",
      "type_engin": "5"
    },
    "paiement": {
      "id": 444,
      "montant": 20.0,
      "montant_initial": 20.0,
      "mode_paiement": "espece",
      "operateur": null,
      "numero_transaction": "VIGN-1768822573481-3014",
      "date_paiement": "2026-01-19 12:36:13",
      "statut": "completed"
    },
    "repartition": {
      "total_montant": 20,
      "total_reparti": 20,
      "reste": 0,
      "details": [
        {
          "beneficiaire_id": 10,
          "beneficiaire_nom": "PROV",
          "numero_compte": "xxx",
          "type_part": "pourcentage",
          "valeur_part_originale": 70,
          "valeur_part_calculee": 70,
          "montant": 14
        }
      ],
      "nombre_beneficiaires": 2
    },
    "utilisateur": {
      "id": 20,
      "nom": "Bekeya"
    }
  }
}
```

### Erreur

```json
{
  "status": "error",
  "message": "Paiement introuvable",
  "error": "Aucun paiement complété trouvé pour la plaque 'XYZ999'"
}
```

---

## 🔒 Vérifications de sécurité (middleware)

| Contrôle                  | Description                                        |
|---------------------------|----------------------------------------------------|
| Headers obligatoires      | `X-Bank-ID` + `X-API-Key` présents                |
| Credentials valides       | Vérification en base de données                    |
| Compte actif              | `actif = 1` dans `banques_partenaire`              |
| Compte non suspendu       | `suspendu = 0`                                     |
| Date d'expiration         | Credentials non expirés                            |
| IP whitelist              | Si configurée dans `ip_autorisees`                 |
| Montant minimum/maximum   | Vérifié par rapport aux limites du partenaire      |

---

## 🏗️ Concepts Go illustrés

- **Goroutines** : Les requêtes SQL `paiement` + `répartition` s'exécutent en parallèle (concurrence)
- **Channels** : Communication entre goroutines pour assembler le résultat
- **Context** : Propagation du timeout et annulation des requêtes SQL
- **Middleware** : Chaîne de traitement HTTP (logging → CORS → auth → handler)
- **Pool de connexions** : `SetMaxOpenConns`, `SetMaxIdleConns` pour la performance
- **Graceful Shutdown** : Arrêt propre du serveur avec `signal.Notify`
- **Interfaces** : `http.Handler` et `http.ResponseWriter`
