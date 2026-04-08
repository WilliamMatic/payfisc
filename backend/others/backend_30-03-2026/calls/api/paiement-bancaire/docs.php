<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>API Paiement Impôts - Connexion Banque</title>
    <link href="https://fonts.googleapis.com/css2?family=Saira:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    <style>
        :root {
            --primary: #4361ee;
            --secondary: #3a0ca3;
            --accent: #7209b7;
            --light: #f8f9fa;
            --dark: #212529;
            --success: #4cc9f0;
            --warning: #f72585;
            --green: #2ec4b6;
            --orange: #ff9f1c;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: "Saira", sans-serif;
            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
            color: var(--light);
            line-height: 1.6;
            overflow-x: hidden;
            min-height: 100vh;
            position: relative;
        }

        .stars {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
        }

        .star {
            position: absolute;
            background-color: white;
            border-radius: 50%;
            animation: twinkle 5s infinite;
        }

        @keyframes twinkle {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 1; }
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        /* Styles pour la page de login */
        .login-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 2rem;
        }

        .login-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 3rem;
            width: 100%;
            max-width: 500px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.8s ease-out;
        }

        .login-header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .login-logo {
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        .login-title {
            font-size: 2rem;
            margin-bottom: 0.5rem;
            background: linear-gradient(to right, var(--success), var(--accent));
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }

        .login-subtitle {
            color: rgba(255, 255, 255, 0.7);
            font-size: 1rem;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: var(--light);
        }

        .form-input {
            width: 100%;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            color: white;
            font-size: 1rem;
            transition: all 0.3s ease;
        }

        .form-input:focus {
            outline: none;
            border-color: var(--success);
            box-shadow: 0 0 0 3px rgba(76, 201, 240, 0.1);
        }

        .form-input::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }

        .login-btn {
            width: 100%;
            padding: 1rem;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 1rem;
        }

        .login-btn:hover {
            background: var(--secondary);
            transform: translateY(-2px);
        }

        .login-btn:disabled {
            background: rgba(255, 255, 255, 0.2);
            cursor: not-allowed;
            transform: none;
        }

        .error-message {
            background: rgba(247, 37, 133, 0.2);
            border: 1px solid var(--warning);
            border-radius: 10px;
            padding: 1rem;
            margin: 1rem 0;
            color: var(--light);
            text-align: center;
        }

        .success-message {
            background: rgba(76, 201, 240, 0.2);
            border: 1px solid var(--success);
            border-radius: 10px;
            padding: 1rem;
            margin: 1rem 0;
            color: var(--light);
            text-align: center;
        }

        .hidden {
            display: none;
        }

        /* Styles pour la documentation (identique aux précédents) */
        header {
            text-align: center;
            margin-bottom: 3rem;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            animation: fadeIn 1s ease-out;
        }

        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            background: linear-gradient(to right, var(--success), var(--accent));
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            text-shadow: 0 0 10px rgba(76, 201, 240, 0.3);
        }

        .subtitle {
            font-size: 1.2rem;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 1.5rem;
        }

        .section {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 2rem;
            margin-bottom: 2rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.8s ease-out;
        }

        h2 {
            font-size: 2rem;
            margin-bottom: 1.5rem;
            color: var(--success);
            display: flex;
            align-items: center;
        }

        h2 i {
            margin-right: 10px;
            font-size: 1.5rem;
        }

        h3 {
            font-size: 1.5rem;
            margin: 1.5rem 0 1rem;
            color: var(--accent);
        }

        .card {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 15px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            border-left: 4px solid var(--primary);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
        }

        .endpoint {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
            padding: 0.8rem 1rem;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            font-family: monospace;
        }

        .method {
            padding: 0.3rem 0.8rem;
            border-radius: 5px;
            font-weight: bold;
            margin-right: 1rem;
            font-size: 0.9rem;
        }

        .post { background: var(--primary); }
        .get { background: var(--success); }

        .code-block {
            background: rgba(0, 0, 0, 0.4);
            border-radius: 10px;
            padding: 1.5rem;
            margin: 1rem 0;
            overflow-x: auto;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        pre {
            font-family: "Courier New", monospace;
            font-size: 0.95rem;
            white-space: pre-wrap;
            color: #e9ecef;
        }

        .code-key { color: #4cc9f0; }
        .code-string { color: #f72585; }
        .code-number { color: #9d4edd; }
        .code-comment { color: #6c757d; }
        .code-function { color: #ff9f1c; }

        .badge {
            display: inline-block;
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
        }

        .badge-primary { background: var(--primary); }
        .badge-secondary { background: var(--secondary); }
        .badge-accent { background: var(--accent); }
        .badge-success { background: var(--green); }

        .method-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
        }

        .method-item {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 15px;
            padding: 1.5rem;
            text-align: center;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .method-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
            border-color: var(--success);
        }

        .method-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            color: var(--success);
        }

        .method-name {
            font-weight: bold;
            margin-bottom: 0.5rem;
            color: var(--light);
        }

        .method-desc {
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.7);
        }

        .error-code {
            background: rgba(247, 37, 133, 0.2);
            padding: 0.5rem 1rem;
            border-radius: 5px;
            margin: 0.5rem 0;
            border-left: 3px solid var(--warning);
        }

        .logout-btn {
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: rgba(247, 37, 133, 0.2);
            color: var(--light);
            border: 1px solid var(--warning);
            padding: 0.8rem 1.5rem;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
            z-index: 1000;
        }

        .logout-btn:hover {
            background: var(--warning);
            transform: translateY(-2px);
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .pulse {
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(76, 201, 240, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(76, 201, 240, 0); }
            100% { box-shadow: 0 0 0 0 rgba(76, 201, 240, 0); }
        }

        @media (max-width: 768px) {
            h1 { font-size: 2.2rem; }
            .container { padding: 1rem; }
            .section { padding: 1.5rem; }
            .method-list { grid-template-columns: 1fr; }
            .login-card { padding: 2rem; margin: 1rem; }
            .logout-btn { top: 1rem; right: 1rem; padding: 0.6rem 1rem; }
        }
    </style>
</head>
<body>
    <div class="stars" id="stars"></div>

    <!-- Page de Login -->
    <div id="loginPage" class="login-container">
        <div class="login-card">
            <div class="login-header">
                <div class="login-logo">🏦</div>
                <h1 class="login-title">API Paiement Impôts</h1>
                <p class="login-subtitle">Connexion Partenaire Bancaire</p>
            </div>

            <form id="loginForm">
                <div class="form-group">
                    <label class="form-label" for="bankId">Bank ID</label>
                    <input type="text" id="bankId" class="form-input" placeholder="Entrez votre Bank ID" required>
                </div>

                <div class="form-group">
                    <label class="form-label" for="apiKey">Clé API</label>
                    <input type="password" id="apiKey" class="form-input" placeholder="Entrez votre clé API" required>
                </div>

                <div id="errorMessage" class="error-message hidden"></div>
                <div id="successMessage" class="success-message hidden"></div>

                <button type="submit" class="login-btn" id="loginBtn">
                    <span id="loginText">Se connecter</span>
                    <span id="loadingText" class="hidden">Connexion...</span>
                </button>
            </form>

            <div style="margin-top: 2rem; text-align: center; color: rgba(255, 255, 255, 0.5); font-size: 0.9rem;">
                <p>⚠️ Authentification requise pour accéder à la documentation</p>
                <p style="margin-top: 0.5rem;">Headers requis: X-API-Key & X-Bank-ID</p>
            </div>
        </div>
    </div>

    <!-- Page Documentation (cachée par défaut) -->
    <div id="docPage" class="container hidden">
        <button class="logout-btn" onclick="logout()">🚪 Déconnexion</button>

        <header>
            <h1>API Paiement Impôts v1.0</h1>
            <p class="subtitle">Documentation complète pour l'intégration des services de paiement des impôts</p>
            <div class="pulse" style="display: inline-block; padding: 0.8rem 1.5rem; background: rgba(76, 201, 240, 0.2); border-radius: 30px; margin-top: 1rem;">
                Authentification requise: X-API-Key & X-Bank-ID
            </div>
        </header>

        <section class="section">
            <h2><i>🔐</i> Authentification</h2>
            <div class="card">
                <p>Toutes les requêtes à l'API nécessitent les en-têtes suivants :</p>
                <div class="code-block">
                    <pre><span class="code-key">X-API-Key</span>: <span class="code-string">votre_cle_api_secrete</span>
<span class="code-key">X-Bank-ID</span>: <span class="code-string">votre_bank_id</span>
<span class="code-key">Content-Type</span>: <span class="code-string">application/json</span></pre>
                </div>
                
                <p><strong>Nouveaux codes d'erreur d'authentification :</strong></p>
                <div class="error-code">
                    <strong>IP_NOT_AUTHORIZED</strong> (403) - Adresse IP non autorisée
                </div>
                <div class="error-code">
                    <strong>USER_AGENT_NOT_AUTHORIZED</strong> (403) - User-Agent non autorisé
                </div>
                <div class="error-code">
                    <strong>PARTNER_MAINTENANCE</strong> (503) - Partenaire en maintenance
                </div>
            </div>
        </section>

        <section class="section">
            <h2><i>🌐</i> Endpoints Principaux</h2>

            <!-- Initialiser Paiement -->
            <div class="card">
                <h3>1. Initialiser un Paiement</h3>
                <div class="endpoint">
                    <span class="method post">POST</span>
                    <span>/api/paiement/initialiser-paiement.php</span>
                </div>

                <p><strong>Body :</strong></p>
                <div class="code-block">
                    <pre>{
  <span class="code-key">"impot_id"</span>: <span class="code-number">1</span>,
  <span class="code-key">"nombre_declarations"</span>: <span class="code-number">5</span>
}</pre>
                </div>

                <p><strong>Réponse Succès (201) :</strong></p>
                <div class="code-block">
                    <pre>{
  <span class="code-key">"status"</span>: <span class="code-string">"success"</span>,
  <span class="code-key">"message"</span>: <span class="code-string">"Paiement initialisé avec succès"</span>,
  <span class="code-key">"data"</span>: {
    <span class="code-key">"reference_paiement"</span>: <span class="code-string">"IMP20241201143012ABC12"</span>,
    <span class="code-key">"impot"</span>: {
      <span class="code-key">"id"</span>: <span class="code-number">1</span>,
      <span class="code-key">"nom"</span>: <span class="code-string">"Taxe Professionnelle"</span>,
      <span class="code-key">"description"</span>: <span class="code-string">"Taxe annuelle sur les activités professionnelles"</span>,
      <span class="code-key">"prix_unitaire"</span>: <span class="code-number">5000.00</span>,
      <span class="code-key">"periode"</span>: <span class="code-string">"annuel"</span>
    },
    <span class="code-key">"details"</span>: {
      <span class="code-key">"nombre_declarations"</span>: <span class="code-number">5</span>,
      <span class="code-key">"montant_total"</span>: <span class="code-number">25000.00</span>,
      <span class="code-key">"montant_unitaire"</span>: <span class="code-number">5000.00</span>
    },
    <span class="code-key">"repartition"</span>: [
      {
        <span class="code-key">"beneficiaire_id"</span>: <span class="code-number">1</span>,
        <span class="code-key">"nom"</span>: <span class="code-string">"Trésor Public"</span>,
        <span class="code-key">"telephone"</span>: <span class="code-string">"+243781234567"</span>,
        <span class="code-key">"numero_compte"</span>: <span class="code-string">"SN00123456789"</span>,
        <span class="code-key">"type_part"</span>: <span class="code-string">"pourcentage"</span>,
        <span class="code-key">"valeur_part_originale"</span>: <span class="code-number">70.00</span>,
        <span class="code-key">"montant"</span>: <span class="code-number">17500.00</span>
      }
    ],
    <span class="code-key">"callback_url"</span>: <span class="code-string">"https://api.banque.com/webhook?ref=IMP20241201143012ABC12"</span>,
    <span class="code-key">"date_expiration"</span>: <span class="code-string">"2024-12-01 15:30:12"</span>
  }
}</pre>
                </div>

                <p><strong>Codes d'erreur :</strong></p>
                <div class="error-code">
                    <strong>MISSING_AUTH_HEADERS</strong> (401) - En-têtes d'authentification manquants
                </div>
                <div class="error-code">
                    <strong>MISSING_PARAMETERS</strong> (400) - Paramètres requis manquants
                </div>
                <div class="error-code">
                    <strong>INVALID_NUMBER</strong> (400) - Nombre de déclarations invalide
                </div>
                <div class="error-code">
                    <strong>IMPOT_NOT_FOUND</strong> (400) - Impôt non trouvé
                </div>
                <div class="error-code">
                    <strong>NO_BENEFICIARIES</strong> (400) - Aucun bénéficiaire configuré
                </div>
                <div class="error-code">
                    <strong>AMOUNT_TOO_LOW</strong> (400) - Montant inférieur au minimum
                </div>
                <div class="error-code">
                    <strong>AMOUNT_TOO_HIGH</strong> (400) - Montant supérieur au maximum
                </div>
                <div class="error-code">
                    <strong>SYSTEM_ERROR</strong> (500) - Erreur système
                </div>
            </div>

            <!-- Traiter Paiement -->
            <div class="card">
                <h3>2. Traiter un Paiement</h3>
                <div class="endpoint">
                    <span class="method post">POST</span>
                    <span>/api/paiement/traiter-paiement-impot.php</span>
                </div>

                <p><strong>Body :</strong></p>
                <div class="code-block">
                    <pre>{
  <span class="code-key">"reference_paiement"</span>: <span class="code-string">"IMP20241201143012ABC12"</span>,
  <span class="code-key">"methode_paiement"</span>: <span class="code-string">"mobile_money"</span>
}</pre>
                </div>

                <p><strong>Réponse Succès (200) :</strong></p>
                <div class="code-block">
                    <pre>{
  <span class="code-key">"status"</span>: <span class="code-string">"success"</span>,
      <span class="code-key">"message"</span>: <span class="code-string">"Paiement traité avec succès"</span>,
      <span class="code-key">"data"</span>: {
        <span class="code-key">"paiement_id"</span>: <span class="code-string">"459"</span>,
        <span class="code-key">"paiement_bancaire_id"</span>: <span class="code-string">"13"</span>,
        <span class="code-key">"reference_bancaire"</span>: <span class="code-string">"BANK202601191509115060"</span>,
        <span class="code-key">"reference_paiement"</span>: <span class="code-string">"IMP202601191506077JJH7"</span>,
        <span class="code-key">"montant"</span>: <span class="code-string">"1040.00"</span>,
        <span class="code-key">"nombre_declarations"</span>: <span class="code-number">52</span>,
        <span class="code-key">"methode_paiement"</span>: <span class="code-string">"mobile_money"</span>,
        <span class="code-key">"date_paiement"</span>: <span class="code-string">"2026-01-19 15:09:11"</span>
  }
}</pre>
                </div>

                <p><strong>Codes d'erreur :</strong></p>
                <div class="error-code">
                    <strong>PAYMENT_NOT_FOUND</strong> (400) - Paiement temporaire non trouvé
                </div>
                <div class="error-code">
                    <strong>PAYMENT_EXPIRED</strong> (400) - Paiement expiré
                </div>
                <div class="error-code">
                    <strong>INVALID_PAYMENT_METHOD</strong> (400) - Méthode de paiement invalide
                </div>
                <div class="error-code">
                    <strong>DAILY_LIMIT_EXCEEDED</strong> (429) - Limite journalière atteinte
                </div>
                <div class="error-code">
                    <strong>MONTHLY_LIMIT_EXCEEDED</strong> (429) - Limite mensuelle atteinte
                </div>
            </div>

            <!-- Annuler Paiement -->
            <div class="card">
                <h3>3. Annuler un Paiement</h3>
                <div class="endpoint">
                    <span class="method post">POST</span>
                    <span>/api/paiement/annuler-paiement-impot.php</span>
                </div>

                <p><strong>Body :</strong></p>
                <div class="code-block">
                    <pre>{
  <span class="code-key">"reference_paiement"</span>: <span class="code-string">"IMP20241201143012ABC12"</span>
}</pre>
                </div>

                <p><strong>Réponse Succès (200) :</strong></p>
                <div class="code-block">
                    <pre>{
  <span class="code-key">"status"</span>: <span class="code-string">"success"</span>,
  <span class="code-key">"message"</span>: <span class="code-string">"Paiement annulé avec succès"</span>,
  <span class="code-key">"data"</span>: {
    <span class="code-key">"reference"</span>: <span class="code-string">"BANK202601191509115060"</span>,
    <span class="code-key">"type"</span>: <span class="code-string">"definitif"</span>
  }
}</pre>
                </div>

                <p><strong>Codes d'erreur :</strong></p>
                <div class="error-code">
                    <strong>PAYMENT_NOT_FOUND</strong> (400) - Paiement non trouvé
                </div>
                <div class="error-code">
                    <strong>PAYMENT_ALREADY_SERVED</strong> (400) - Paiement déjà servi
                </div>
                <div class="error-code">
                    <strong>CANCELLATION_ERROR</strong> (500) - Erreur lors de l'annulation
                </div>
            </div>
        </section>

        <section class="section">
            <h2><i>⚙️</i> Fonctionnalités Implémentées</h2>
            <div class="method-list">
                <div class="method-item">
                    <div class="method-icon">📋</div>
                    <div class="method-name">Initialisation Paiement</div>
                    <div class="method-desc">Calcul montant + répartition bénéficiaires</div>
                </div>
                <div class="method-item">
                    <div class="method-icon">💰</div>
                    <div class="method-name">Traitement Paiement</div>
                    <div class="method-desc">Insertion tables définitives</div>
                </div>
                <div class="method-item">
                    <div class="method-icon">❌</div>
                    <div class="method-name">Annulation Paiement</div>
                    <div class="method-desc">Gestion temporaire et définitive</div>
                </div>
                <div class="method-item">
                    <div class="method-icon">🔐</div>
                    <div class="method-name">Authentification</div>
                    <div class="method-desc">API Key + Bank ID sécurisés</div>
                </div>
                <div class="method-item">
                    <div class="method-icon">📊</div>
                    <div class="method-name">Répartition Automatique</div>
                    <div class="method-desc">Calcul parts bénéficiaires</div>
                </div>
                <div class="method-item">
                    <div class="method-icon">⏰</div>
                    <div class="method-name">Expiration</div>
                    <div class="method-desc">Paiements temporaires (1h)</div>
                </div>
            </div>

            <div class="method-list">
                <div class="method-item">
                    <div class="method-icon">🛡️</div>
                    <div class="method-name">Sécurité IP/User-Agent</div>
                    <div class="method-desc">Vérifications de sécurité renforcées</div>
                </div>
                <div class="method-item">
                    <div class="method-icon">💰</div>
                    <div class="method-name">Frais Dynamiques</div>
                    <div class="method-desc">Gestion des frais depuis table dédiée</div>
                </div>
                <div class="method-item">
                    <div class="method-icon">🔍</div>
                    <div class="method-name">Vérifications Complètes</div>
                    <div class="method-desc">Maintenance, expiration, limites</div>
                </div>
            </div>
        </section>
        <footer>
            <p>Documentation API Paiement Impôts v1.0 - Sécurité et fonctionnalités étendues</p>
            <p style="margin-top: 0.5rem;">URL de production: <strong>https://mpako.net/Backend/models/calls</strong></p>
        </footer>
    </div>

    <script>
        // Création des étoiles animées
        function createStars() {
            const starsContainer = document.getElementById("stars");
            const starsCount = 150;

            for (let i = 0; i < starsCount; i++) {
                const star = document.createElement("div");
                star.classList.add("star");

                const x = Math.random() * 100;
                const y = Math.random() * 100;
                const size = Math.random() * 3;
                const delay = Math.random() * 5;

                star.style.left = `${x}%`;
                star.style.top = `${y}%`;
                star.style.width = `${size}px`;
                star.style.height = `${size}px`;
                star.style.animationDelay = `${delay}s`;

                starsContainer.appendChild(star);
            }
        }

        // Gestion du login
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const bankId = document.getElementById('bankId').value;
            const apiKey = document.getElementById('apiKey').value;
            const loginBtn = document.getElementById('loginBtn');
            const loginText = document.getElementById('loginText');
            const loadingText = document.getElementById('loadingText');
            const errorMessage = document.getElementById('errorMessage');
            const successMessage = document.getElementById('successMessage');

            // Reset messages
            errorMessage.classList.add('hidden');
            successMessage.classList.add('hidden');

            // Show loading
            loginBtn.disabled = true;
            loginText.classList.add('hidden');
            loadingText.classList.remove('hidden');

            try {
                const response = await fetch('../authentifier-partenaire.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        bank_id: bankId,
                        api_key: apiKey
                    })
                });

                const data = await response.json();

                if (data.status === 'success') {
                    // Stocker les informations d'authentification
                    localStorage.setItem('bank_auth', JSON.stringify({
                        bankId: bankId,
                        apiKey: apiKey,
                        partenaire: data.data
                    }));

                    successMessage.textContent = 'Connexion réussie! Redirection...';
                    successMessage.classList.remove('hidden');

                    // Rediriger vers la documentation après 1 seconde
                    setTimeout(() => {
                        showDocumentation();
                    }, 1000);
                } else {
                    errorMessage.textContent = data.message || 'Erreur d\'authentification';
                    errorMessage.classList.remove('hidden');
                }
            } catch (error) {
                errorMessage.textContent = 'Erreur de connexion au serveur';
                errorMessage.classList.remove('hidden');
            } finally {
                // Reset button
                loginBtn.disabled = false;
                loginText.classList.remove('hidden');
                loadingText.classList.add('hidden');
            }
        });

        // Afficher la documentation
        function showDocumentation() {
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('docPage').classList.remove('hidden');
        }

        // Déconnexion
        function logout() {
            localStorage.removeItem('bank_auth');
            document.getElementById('loginPage').classList.remove('hidden');
            document.getElementById('docPage').classList.add('hidden');
            document.getElementById('loginForm').reset();
        }

        // Vérifier si l'utilisateur est déjà connecté au chargement
        document.addEventListener('DOMContentLoaded', function() {
            createStars();
            
            const auth = localStorage.getItem('bank_auth');
            if (auth) {
                showDocumentation();
            }
        });
    </script>
</body>
</html>