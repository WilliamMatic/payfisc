Pas de souci, je vais t'expliquer tout pas à pas, comme si c'était la première fois. L'objectif est clair : **déployer l'API Go sans toucher à ce qui existe déjà sur mpako.net**.

---

## 🖥️ PHASE 1 — Se connecter au VPS

Tu as besoin d'un terminal SSH. Selon ton OS :

- **Windows** → télécharge et ouvre **PuTTY** (putty.org) ou utilise **Windows Terminal** (déjà installé sur Windows 10/11)
- **Mac/Linux** → ouvre simplement le **Terminal**

**Connexion :**
```bash
ssh root@78.138.58.121
```
Il te demande le mot de passe root de ton VPS → saisis-le (les caractères n'apparaissent pas, c'est normal) puis Entrée.

Tu devrais voir quelque chose comme `root@vps-115284:~#` — tu es connecté.

---

## 🔧 PHASE 2 — Installer Go (sans rien casser)

Go s'installe dans `/usr/local/go`, **totalement isolé** de ton site mpako.net. Copie-colle ces commandes une par une :

```bash
wget https://go.dev/dl/go1.22.4.linux-amd64.tar.gz
```
```bash
rm -rf /usr/local/go && tar -C /usr/local -xzf go1.22.4.linux-amd64.tar.gz
```
```bash
rm go1.22.4.linux-amd64.tar.gz
```
```bash
echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile
```
```bash
source /etc/profile
```
```bash
go version
```
→ Tu dois voir `go version go1.22.4 linux/amd64`. Si oui, Go est installé ✅

---

## 📦 PHASE 3 — Envoyer le projet sur le VPS

**Sur ta machine locale** (pas sur le VPS), ouvre un nouveau terminal et positionne-toi dans le dossier parent de ton projet :

```bash
# Mac/Linux
cd ~/chemin/vers/le/dossier/qui/contient/external-api
tar -czf external-api.tar.gz external-api/
scp external-api.tar.gz root@78.138.58.121:/opt/
```

**Windows (PowerShell) :**
```powershell
cd C:\chemin\vers\le\dossier
tar -czf external-api.tar.gz external-api/
scp external-api.tar.gz root@78.138.58.121:/opt/
```

Ensuite **retourne sur le terminal SSH (VPS)** :
```bash
cd /opt
tar -xzf external-api.tar.gz
rm external-api.tar.gz
ls /opt/external-api/
```
→ Tu dois voir les dossiers `cmd/`, `internal/`, `pkg/`, `go.mod`, etc.

---

## ⚙️ PHASE 4 — Compiler le projet

```bash
cd /opt/external-api
go mod tidy
```
```bash
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
  -ldflags="-s -w" \
  -o /opt/external-api/external-api-server \
  ./cmd/server/main.go
```
```bash
ls -lh /opt/external-api/external-api-server
```
→ Tu dois voir le fichier `external-api-server` listé avec sa taille. ✅

---

## 🔐 PHASE 5 — Créer le service Systemd

Le service va faire tourner l'API **en arrière-plan automatiquement**, même après un reboot. Il tourne sur le port **8090** (interne, pas exposé directement sur internet — Nginx fera le pont).

```bash
cat > /etc/systemd/system/external-api.service << 'EOF'
[Unit]
Description=TSC-NPS External API (Go)
After=network.target mysql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/external-api
Environment="DB_HOST=localhost"
Environment="DB_PORT=3306"
Environment="DB_USER=c0willyam"
Environment="DB_PASSWORD=acmilan poli"
Environment="DB_NAME=c0mpako"
Environment="SERVER_PORT=:8090"
ExecStart=/opt/external-api/external-api-server
Restart=always
RestartSec=5s
StandardOutput=journal
StandardError=journal
SyslogIdentifier=external-api

[Install]
WantedBy=multi-user.target
EOF
```

```bash
chown -R www-data:www-data /opt/external-api
chmod +x /opt/external-api/external-api-server
systemctl daemon-reload
systemctl enable external-api
systemctl start external-api
```

**Vérifier que l'API tourne :**
```bash
systemctl status external-api
```
→ Tu dois voir `Active: active (running)` en vert ✅

**Vérifier qu'elle écoute bien sur 8090 :**
```bash
ss -tlnp | grep 8090
```
→ Tu dois voir une ligne avec `0.0.0.0:8090`

---

## 🌐 PHASE 6 — Configurer Nginx dans ISPConfig

C'est ici qu'on fait attention à **ne pas toucher mpako.net**. On va créer un **nouveau sous-domaine** dédié à l'API.

### 6a. Créer un sous-domaine dans ISPConfig

1. Ouvre ISPConfig dans ton navigateur : `http://78.138.58.121:8080` (ou le port de ton ISPConfig)
2. Va dans **"Sites"** → **"Sites Web"**
3. Clique sur **"Ajouter un nouveau site web"**
4. Remplis :
   - **Domaine** : `api.mpako.net` (ou `api-tsc.mpako.net`)
   - **Répertoire** : laisse par défaut (ex: `/var/www/api.mpako.net`)
   - **Activé** : coché ✅
5. Onglet **"Options"** → cherche le champ **"Directives Nginx supplémentaires"** et colle ceci :

```nginx
location / {
    proxy_pass http://127.0.0.1:8090;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_pass_request_headers on;
    proxy_connect_timeout 10s;
    proxy_read_timeout 30s;
}
```

6. Clique **"Sauvegarder"**. ISPConfig va régénérer la config Nginx automatiquement.

### 6b. Pointer le DNS (si tu n'as pas encore le sous-domaine)

Dans la gestion DNS de mpako.net (chez ton registrar ou dans ISPConfig → DNS), ajoute un enregistrement :
- **Type** : A
- **Nom** : `api` (ou `api-tsc`)
- **Valeur** : `78.138.58.121`

---

## 🧪 PHASE 7 — Insérer les données de test

```bash
mysql -u c0willyam -p c0mpako < /opt/external-api/setup_test_data.sql
```
→ Saisis le mot de passe `acmilan poli` quand demandé.

---

## ✅ PHASE 8 — Tester

```bash
# Test depuis le VPS lui-même (port direct)
curl http://127.0.0.1:8090/api/v1/health
```

Une fois le DNS propagé (quelques minutes à quelques heures) :
```bash
# Test via le sous-domaine
curl http://api.mpako.net/api/v1/health

# Test avec authentification
curl -X GET "http://api.mpako.net/api/v1/paiement/plaque/SP222" \
  -H "X-Bank-ID: BANK-TSC-TEST-001" \
  -H "X-API-Key: tsc-api-key-test-2024-abcdef123456"
```

---

## ⚠️ Résumé de ce qu'on ne touche PAS

| Élément | Statut |
|---|---|
| Site mpako.net | ✅ Intouché |
| Base de données existante | ✅ Intouchée (on ajoute juste 2 lignes dans des tables déjà existantes) |
| Config Nginx de mpako.net | ✅ Intouchée (on crée un nouveau vhost séparé) |
| PHP et les autres applis | ✅ Intouchés |

Dis-moi où tu en es à chaque phase — à quelle étape tu bloques ou si tu as une question sur un point précis !