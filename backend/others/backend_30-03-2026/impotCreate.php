<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Créateur d'Impôts Dynamiques</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            line-height: 1.6;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
        }
        
        .container {
            width: 95%;
            max-width: 1400px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
            padding: 40px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 2px solid rgba(102, 126, 234, 0.2);
        }
        
        h1 {
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 15px;
            font-size: 32px;
            font-weight: 700;
        }
        
        h2 {
            font-size: 24px;
            margin-bottom: 25px;
            color: #2c3e50;
            font-weight: 600;
        }
        
        h3 {
            font-size: 18px;
            margin-bottom: 15px;
            color: #2c3e50;
            font-weight: 600;
        }
        
        .description {
            color: #64748b;
            font-size: 16px;
            max-width: 700px;
            margin: 0 auto;
            font-weight: 500;
        }
        
        .form-section {
            margin-bottom: 40px;
            padding: 30px;
            background: rgba(248, 250, 252, 0.8);
            border-radius: 16px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.08);
            border: 1px solid rgba(226, 232, 240, 0.5);
            transition: all 0.3s ease;
        }
        
        .form-section:hover {
            box-shadow: 0 12px 35px rgba(0,0,0,0.12);
            transform: translateY(-2px);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 10px;
            font-weight: 600;
            color: #374151;
            font-size: 15px;
        }
        
        input, select, textarea {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            font-size: 15px;
            transition: all 0.3s ease;
            background: rgba(255, 255, 255, 0.9);
        }
        
        input:focus, select:focus, textarea:focus {
            border-color: #667eea;
            outline: none;
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
            background: white;
        }
        
        button {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }
        
        button:hover::before {
            left: 100%;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }
        
        .btn-danger {
            background: linear-gradient(135deg, #ef4444, #dc2626);
        }
        
        .btn-danger:hover {
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
        }
        
        .btn-success {
            background: linear-gradient(135deg, #10b981, #059669);
        }
        
        .btn-success:hover {
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
        }
        
        .btn-primary:hover {
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }
        
        .btn-small {
            padding: 8px 14px;
            font-size: 13px;
        }
        
        .rubrique {
            border: 2px solid rgba(226, 232, 240, 0.6);
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 25px;
            background: rgba(255, 255, 255, 0.9);
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            transition: all 0.3s ease;
            position: relative;
        }
        
        .rubrique:hover {
            border-color: #667eea;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        
        .rubrique-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .rubrique-title-input {
            flex: 1;
            min-width: 200px;
            font-size: 15px;
            font-weight: 500;
        }
        
        .rubrique-type-select {
            width: 160px;
            font-size: 14px;
        }
        
        .sous-rubriques {
            margin-left: 30px;
            margin-top: 25px;
            padding-left: 25px;
            border-left: 4px solid #667eea;
            position: relative;
        }
        
        .sous-rubriques::before {
            content: '';
            position: absolute;
            left: -2px;
            top: 0;
            bottom: 0;
            width: 4px;
            background: linear-gradient(to bottom, #667eea, #764ba2);
            border-radius: 2px;
        }
        
        .actions {
            margin-top: 40px;
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .json-output {
            margin-top: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #1e293b, #334155);
            color: #e2e8f0;
            border-radius: 16px;
            white-space: pre-wrap;
            font-family: 'Fira Code', 'Consolas', monospace;
            font-size: 14px;
            max-height: 600px;
            overflow-y: auto;
            line-height: 1.6;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #94a3b8;
            font-style: italic;
            font-size: 16px;
            border: 2px dashed #cbd5e1;
            border-radius: 16px;
            background: rgba(248, 250, 252, 0.5);
        }
        
        .option-item {
            display: flex;
            margin-bottom: 15px;
            gap: 12px;
            align-items: flex-start;
            padding: 15px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 12px;
            border: 1px solid rgba(226, 232, 240, 0.5);
        }
        
        .option-item input {
            flex: 1;
            min-width: 150px;
        }
        
        .rubrique-actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }
        
        .options-container {
            margin-top: 20px;
            padding: 20px;
            background: rgba(16, 185, 129, 0.05);
            border-radius: 12px;
            border-left: 4px solid #10b981;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }
        
        .param-group {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            align-items: center;
            padding: 15px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 12px;
            border: 1px solid rgba(226, 232, 240, 0.5);
        }
        
        .param-group input {
            flex: 1;
        }
        
        .option-value-container {
            width: 100%;
            margin-top: 15px;
            padding: 15px;
            background: rgba(248, 250, 252, 0.8);
            border-radius: 12px;
            border: 1px solid rgba(226, 232, 240, 0.5);
        }
        
        .option-actions {
            display: flex;
            align-items: center;
        }
        
        .error-message {
            color: #ef4444;
            font-size: 14px;
            margin-top: 5px;
            padding: 8px 12px;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 6px;
            border: 1px solid rgba(239, 68, 68, 0.2);
        }
        
        .success-message {
            color: #10b981;
            font-size: 14px;
            margin-top: 10px;
            padding: 8px 12px;
            background: rgba(16, 185, 129, 0.1);
            border-radius: 6px;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .option-subrubriques-actions {
            margin-top: 15px;
            text-align: center;
            padding-top: 15px;
            border-top: 1px solid rgba(226, 232, 240, 0.5);
        }
        
        .periode-penalite-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 20px;
                width: 100%;
                margin: 10px;
            }
            
            .form-section {
                padding: 20px;
            }
            
            .rubrique-header {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .rubrique-type-select {
                width: 100%;
            }
            
            .sous-rubriques {
                margin-left: 15px;
                padding-left: 15px;
            }
            
            .actions {
                flex-direction: column;
            }
            
            .option-item {
                flex-direction: column;
            }
            
            .param-group {
                flex-direction: column;
                align-items: stretch;
            }
            
            .periode-penalite-container {
                grid-template-columns: 1fr;
            }
        }
        
        /* Animations */
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .rubrique, .option-item, .param-group {
            animation: slideIn 0.3s ease-out;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Créateur d'Impôts Dynamiques</h1>
            <p class="description">Créez des structures d'impôts avec des rubriques et sous-rubriques hiérarchiques</p>
        </header>
        
        <div class="form-section">
            <h2>Informations de base</h2>
            <div class="form-group">
                <label for="nom">Nom de l'impôt *</label>
                <input type="text" id="nom" placeholder="Ex: Impôt foncier" required>
                <div class="error-message" id="nom-error" style="display: none;">Le nom est requis</div>
            </div>
            <div class="form-group">
                <label for="description">Description</label>
                <textarea id="description" rows="3" placeholder="Description de l'impôt"></textarea>
            </div>
        </div>
        
        <div class="form-section">
            <h2>Période de paiement et pénalités</h2>
            <div class="periode-penalite-container">
                <div class="form-group">
                    <label for="periode">Période de paiement *</label>
                    <select id="periode" required>
                        <option value="">Sélectionnez une période</option>
                        <option value="journalier">Journalier</option>
                        <option value="hebdomadaire">Hebdomadaire</option>
                        <option value="mensuel">Mensuel</option>
                        <option value="trimestriel">Trimestriel</option>
                        <option value="semestriel">Semestriel</option>
                        <option value="annuel">Annuel</option>
                    </select>
                    <div class="error-message" id="periode-error" style="display: none;">La période est requise</div>
                </div>
                
                <div class="form-group">
                    <label for="penalite-type">Type de pénalité</label>
                    <select id="penalite-type">
                        <option value="aucune">Aucune pénalité</option>
                        <option value="pourcentage">Pourcentage par période</option>
                        <option value="fixe">Montant fixe</option>
                    </select>
                </div>
                
                <div class="form-group" id="penalite-valeur-container" style="display: none;">
                    <label for="penalite-valeur">Valeur de la pénalité</label>
                    <input type="number" id="penalite-valeur" min="0" step="0.01" placeholder="Ex: 5 pour 5% ou 10000 pour un montant fixe">
                </div>
                
                <div class="form-group">
                    <label for="delai-accord">Délai accordé (jours) *</label>
                    <input type="number" id="delai-accord" min="0" value="0" required>
                    <div class="error-message" id="delai-error" style="display: none;">Le délai accordé est requis</div>
                </div>
            </div>
        </div>
        
        <div class="form-section">
            <h2>Rubriques du formulaire</h2>
            <div id="rubriques-container">
                <div class="empty-state">Aucune rubrique ajoutée. Cliquez sur "Ajouter une rubrique" pour commencer.</div>
            </div>
            <div style="text-align: center; margin-top: 25px;">
                <button id="ajouter-rubrique" class="btn-success">✨ Ajouter une rubrique</button>
            </div>
        </div>
        
        <div class="form-section">
            <h2>Configuration du calcul</h2>
            <div class="form-group">
                <label for="formule">Formule de calcul</label>
                <input type="text" id="formule" placeholder="Ex: Montant = Superficie * taux_province">
            </div>
            <div id="parametres-calcul">
                <h3>Paramètres de calcul</h3>
                <div class="param-group" data-param-id="1">
                    <input type="text" placeholder="Nom du paramètre" class="param-name">
                    <input type="text" placeholder="Valeur" class="param-value">
                    <button type="button" class="btn-danger btn-small remove-param">×</button>
                </div>
            </div>
            <div style="text-align: center; margin-top: 25px;">
                <button id="ajouter-parametre" class="btn-success">➕ Ajouter un paramètre</button>
            </div>
        </div>
        
        <div class="actions">
            <button id="generer-json" class="btn-success">🚀 Générer JSON</button>
            <button id="enregistrer-bdd" class="btn-primary" style="display: none;">💾 Enregistrer en base</button>
            <button id="reinitialiser" class="btn-danger">🔄 Réinitialiser</button>
        </div>
        
        <div id="resultat-json" class="json-output" style="display: none;">
            <!-- Le JSON généré apparaîtra ici -->
        </div>
        
        <div id="message-container"></div>
    </div>

    <script>
        class TaxCreator {
            constructor() {
                this.rubriqueCount = 0;
                this.paramCount = 1;
                this.jsonData = null;
                this.initializeElements();
                this.bindEvents();
                this.initializeFirstParam();
            }
            
            initializeElements() {
                this.rubriquesContainer = document.getElementById('rubriques-container');
                this.ajouterRubriqueBtn = document.getElementById('ajouter-rubrique');
                this.genererJsonBtn = document.getElementById('generer-json');
                this.enregistrerBddBtn = document.getElementById('enregistrer-bdd');
                this.reinitialiserBtn = document.getElementById('reinitialiser');
                this.ajouterParametreBtn = document.getElementById('ajouter-parametre');
                this.parametresContainer = document.getElementById('parametres-calcul');
                this.messageContainer = document.getElementById('message-container');
                this.penaliteTypeSelect = document.getElementById('penalite-type');
                this.penaliteValeurContainer = document.getElementById('penalite-valeur-container');
                this.penaliteValeurInput = document.getElementById('penalite-valeur');
            }
            
            bindEvents() {
                this.ajouterRubriqueBtn.addEventListener('click', () => this.ajouterRubrique());
                this.ajouterParametreBtn.addEventListener('click', () => this.ajouterParametre());
                this.genererJsonBtn.addEventListener('click', () => this.genererJson());
                this.enregistrerBddBtn.addEventListener('click', () => this.enregistrerEnBase());
                this.reinitialiserBtn.addEventListener('click', () => this.reinitialiser());
                
                // Gestion de l'affichage conditionnel pour les pénalités
                this.penaliteTypeSelect.addEventListener('change', () => {
                    if (this.penaliteTypeSelect.value === 'aucune') {
                        this.penaliteValeurContainer.style.display = 'none';
                        this.penaliteValeurInput.removeAttribute('required');
                    } else {
                        this.penaliteValeurContainer.style.display = 'block';
                        this.penaliteValeurInput.setAttribute('required', 'true');
                    }
                });
            }
            
            initializeFirstParam() {
                const firstParam = this.parametresContainer.querySelector('.param-group');
                if (firstParam) {
                    const removeBtn = firstParam.querySelector('.remove-param');
                    if (removeBtn) {
                        removeBtn.addEventListener('click', () => this.supprimerParametre(firstParam));
                    }
                }
            }
            
            showMessage(message, type = 'success') {
                const messageDiv = document.createElement('div');
                messageDiv.className = `${type}-message`;
                messageDiv.textContent = message;
                messageDiv.style.marginTop = '20px';
                messageDiv.style.textAlign = 'center';
                
                this.messageContainer.innerHTML = '';
                this.messageContainer.appendChild(messageDiv);
                
                setTimeout(() => {
                    if (this.messageContainer.contains(messageDiv)) {
                        this.messageContainer.removeChild(messageDiv);
                    }
                }, 3000);
            }
            
            sanitizeInput(input) {
                if (typeof input !== 'string') return input;
                return input.trim().replace(/[<>]/g, '');
            }
            
            validateInput(value, fieldName) {
                if (!value || value.trim() === '') {
                    return `${fieldName} est requis`;
                }
                if (value.length > 100) {
                    return `${fieldName} ne peut pas dépasser 100 caractères`;
                }
                return null;
            }
            
            createRubriqueElement(parentContainer = null, level = 0) {
                this.rubriqueCount++;
                const rubriqueId = `rubrique-${this.rubriqueCount}`;
                
                const rubriqueDiv = document.createElement('div');
                rubriqueDiv.className = 'rubrique';
                rubriqueDiv.dataset.level = level;
                rubriqueDiv.dataset.rubriqueId = rubriqueId;
                
                const rubriqueHeader = document.createElement('div');
                rubriqueHeader.className = 'rubrique-header';
                
                const titleInput = document.createElement('input');
                titleInput.type = 'text';
                titleInput.placeholder = 'Nom de la rubrique';
                titleInput.className = 'rubrique-title-input';
                titleInput.setAttribute('data-field', 'title');
                
                const typeSelect = document.createElement('select');
                typeSelect.className = 'rubrique-type-select';
                typeSelect.innerHTML = `
                    <option value="texte">📝 Texte</option>
                    <option value="nombre">🔢 Nombre</option>
                    <option value="liste">📋 Liste</option>
                    <option value="fichier">📎 Fichier</option>
                `;
                
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'rubrique-actions';
                
                const addSubBtn = document.createElement('button');
                addSubBtn.textContent = '➕ Sous-rubrique';
                addSubBtn.className = 'btn-success btn-small';
                addSubBtn.type = 'button';
                
                const removeBtn = document.createElement('button');
                removeBtn.textContent = '🗑️ Supprimer';
                removeBtn.className = 'btn-danger btn-small';
                removeBtn.type = 'button';
                
                actionsDiv.appendChild(addSubBtn);
                actionsDiv.appendChild(removeBtn);
                
                rubriqueHeader.appendChild(titleInput);
                rubriqueHeader.appendChild(typeSelect);
                rubriqueHeader.appendChild(actionsDiv);
                
                rubriqueDiv.appendChild(rubriqueHeader);
                
                // Options container pour les listes
                const optionsContainer = this.createOptionsContainer();
                rubriqueDiv.appendChild(optionsContainer);
                
                // Event listeners
                addSubBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.ajouterSousRubrique(rubriqueDiv, level);
                });
                
                removeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.supprimerRubrique(rubriqueDiv, parentContainer);
                });
                
                typeSelect.addEventListener('change', () => {
                    if (typeSelect.value === 'liste') {
                        optionsContainer.style.display = 'block';
                    } else {
                        optionsContainer.style.display = 'none';
                    }
                });
                
                return rubriqueDiv;
            }
            
            createOptionsContainer() {
                const optionsContainer = document.createElement('div');
                optionsContainer.className = 'options-container';
                optionsContainer.style.display = 'none';
                
                const optionsLabel = document.createElement('label');
                optionsLabel.textContent = 'Options de la liste';
                optionsLabel.style.fontWeight = 'bold';
                optionsLabel.style.marginBottom = '15px';
                optionsLabel.style.display = 'block';
                
                const optionsList = document.createElement('div');
                optionsList.className = 'options-list';
                
                const addOptionBtn = document.createElement('button');
                addOptionBtn.type = 'button';
                addOptionBtn.textContent = '➕ Ajouter une option';
                addOptionBtn.className = 'add-option btn-success btn-small';
                
                optionsContainer.appendChild(optionsLabel);
                optionsContainer.appendChild(optionsList);
                optionsContainer.appendChild(addOptionBtn);
                
                addOptionBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.ajouterOption(optionsList, optionsContainer);
                });
                
                return optionsContainer;
            }
            
            ajouterOption(optionsList, optionsContainer) {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'option-item';
                
                const optionInput = document.createElement('input');
                optionInput.type = 'text';
                optionInput.placeholder = 'Nom de l\'option';
                
                const optionTypeSelect = document.createElement('select');
                optionTypeSelect.innerHTML = `
                    <option value="valeur">💭 Valeur simple</option>
                    <option value="sous-rubrique">📋 Sous-rubrique</option>
                `;
                optionTypeSelect.style.width = '180px';
                
                const optionValueContainer = document.createElement('div');
                optionValueContainer.className = 'option-value-container';
                optionValueContainer.style.display = 'none';
                
                const optionActions = document.createElement('div');
                optionActions.className = 'option-actions';
                
                const removeOptionBtn = document.createElement('button');
                removeOptionBtn.textContent = '❌';
                removeOptionBtn.className = 'btn-danger btn-small';
                removeOptionBtn.type = 'button';
                
                optionActions.appendChild(removeOptionBtn);
                
                optionDiv.appendChild(optionInput);
                optionDiv.appendChild(optionTypeSelect);
                optionDiv.appendChild(optionValueContainer);
                optionDiv.appendChild(optionActions);
                
                // Event listeners
                removeOptionBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (optionsList.contains(optionDiv)) {
                        optionsList.removeChild(optionDiv);
                    }
                });
                
                optionTypeSelect.addEventListener('change', () => {
                    if (optionTypeSelect.value === 'sous-rubrique') {
                        optionValueContainer.innerHTML = '';
                        optionValueContainer.style.display = 'block';
                        
                        const parentRubrique = optionsContainer.closest('.rubrique');
                        const currentLevel = parseInt(parentRubrique.dataset.level) || 0;
                        
                        // Créer un container pour les sous-rubriques avec les mêmes fonctionnalités que les rubriques normales
                        const sousRubriquesContainer = document.createElement('div');
                        sousRubriquesContainer.className = 'sous-rubriques';
                        sousRubriquesContainer.style.marginLeft = '0';
                        sousRubriquesContainer.style.paddingLeft = '0';
                        sousRubriquesContainer.style.borderLeft = 'none';
                        
                        // Ajouter la première sous-rubrique
                        const premiereSousRubrique = this.createRubriqueElement(sousRubriquesContainer, currentLevel + 1);
                        sousRubriquesContainer.appendChild(premiereSousRubrique);
                        
                        // Ajouter le bouton pour ajouter d'autres sous-rubriques
                        const actionsContainer = document.createElement('div');
                        actionsContainer.className = 'option-subrubriques-actions';
                        
                        const addSousRubriqueBtn = document.createElement('button');
                        addSousRubriqueBtn.textContent = '➕ Ajouter une sous-rubrique';
                        addSousRubriqueBtn.className = 'btn-success btn-small';
                        addSousRubriqueBtn.type = 'button';
                        
                        addSousRubriqueBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            const nouvelleSousRubrique = this.createRubriqueElement(sousRubriquesContainer, currentLevel + 1);
                            sousRubriquesContainer.appendChild(nouvelleSousRubrique);
                        });
                        
                        actionsContainer.appendChild(addSousRubriqueBtn);
                        
                        optionValueContainer.appendChild(sousRubriquesContainer);
                        optionValueContainer.appendChild(actionsContainer);
                        
                    } else {
                        optionValueContainer.style.display = 'none';
                        optionValueContainer.innerHTML = '';
                    }
                });
                
                optionsList.appendChild(optionDiv);
            }
            
            ajouterRubrique() {
                const emptyState = this.rubriquesContainer.querySelector('.empty-state');
                if (emptyState && this.rubriquesContainer.contains(emptyState)) {
                    this.rubriquesContainer.removeChild(emptyState);
                }
                this.rubriquesContainer.appendChild(this.createRubriqueElement());
            }
            
            ajouterSousRubrique(rubriqueDiv, level) {
                let sousRubriquesContainer = rubriqueDiv.querySelector('.sous-rubriques');
                if (!sousRubriquesContainer) {
                    sousRubriquesContainer = document.createElement('div');
                    sousRubriquesContainer.className = 'sous-rubriques';
                    rubriqueDiv.appendChild(sousRubriquesContainer);
                }
                sousRubriquesContainer.appendChild(this.createRubriqueElement(sousRubriquesContainer, level + 1));
            }
            
            supprimerRubrique(rubriqueDiv, parentContainer) {
                if (parentContainer && parentContainer.contains(rubriqueDiv)) {
                    parentContainer.removeChild(rubriqueDiv);
                    
                    // Si le container parent est vide et c'est un container de sous-rubriques
                    if (parentContainer.classList.contains('sous-rubriques') && parentContainer.children.length === 0) {
                        const grandParent = parentContainer.parentNode;
                        if (grandParent && grandParent.contains(parentContainer)) {
                            grandParent.removeChild(parentContainer);
                        }
                    }
                    
                    // Si c'est un container d'option et qu'il devient vide
                    if (parentContainer.classList.contains('option-value-container') && parentContainer.querySelector('.sous-rubriques').children.length === 0) {
                        parentContainer.style.display = 'none';
                        parentContainer.innerHTML = '';
                        // Remettre le select sur "valeur"
                        const optionItem = parentContainer.closest('.option-item');
                        if (optionItem) {
                            const typeSelect = optionItem.querySelector('select');
                            if (typeSelect) {
                                typeSelect.value = 'valeur';
                            }
                        }
                    }
                } else if (this.rubriquesContainer.contains(rubriqueDiv)) {
                    this.rubriquesContainer.removeChild(rubriqueDiv);
                    
                    // Vérifier si le container principal est vide
                    if (this.rubriquesContainer.children.length === 0) {
                        const emptyState = document.createElement('div');
                        emptyState.className = 'empty-state';
                        emptyState.textContent = 'Aucune rubrique ajoutée. Cliquez sur "Ajouter une rubrique" pour commencer.';
                        this.rubriquesContainer.appendChild(emptyState);
                    }
                }
            }
            
            ajouterParametre() {
                this.paramCount++;
                const newParam = document.createElement('div');
                newParam.className = 'param-group';
                newParam.dataset.paramId = this.paramCount;
                newParam.innerHTML = `
                    <input type="text" placeholder="Nom du paramètre" class="param-name">
                    <input type="text" placeholder="Valeur" class="param-value">
                    <button type="button" class="btn-danger btn-small remove-param">❌</button>
                `;
                
                const removeBtn = newParam.querySelector('.remove-param');
                removeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.supprimerParametre(newParam);
                });
                
                this.parametresContainer.appendChild(newParam);
            }
            
            supprimerParametre(paramElement) {
                if (this.parametresContainer.contains(paramElement)) {
                    this.parametresContainer.removeChild(paramElement);
                }
            }
            
            processRubrique(rubriqueEl) {
                const titleInput = rubriqueEl.querySelector('.rubrique-title-input');
                const typeSelect = rubriqueEl.querySelector('.rubrique-type-select');
                
                if (!titleInput || !typeSelect) return null;
                
                const champ = this.sanitizeInput(titleInput.value) || 'Sans nom';
                const type = typeSelect.value;
                
                const rubriqueData = {
                    champ: champ,
                    type: type
                };
                
                // Traiter les options si c'est une liste
                if (type === 'liste') {
                    rubriqueData.options = [];
                    const optionItems = rubriqueEl.querySelectorAll('.options-list > .option-item');
                    
                    optionItems.forEach(optionItem => {
                        const optionInput = optionItem.querySelector('input');
                        const optionTypeSelect = optionItem.querySelector('select');
                        
                        if (!optionInput || !optionTypeSelect) return;
                        
                        if (optionTypeSelect.value === 'valeur') {
                            const optionValue = this.sanitizeInput(optionInput.value);
                            if (optionValue) {
                                rubriqueData.options.push(optionValue);
                            }
                        } else if (optionTypeSelect.value === 'sous-rubrique') {
                            const sousRubriqueContainer = optionItem.querySelector('.option-value-container .sous-rubriques');
                            if (sousRubriqueContainer && sousRubriqueContainer.children.length > 0) {
                                const optionData = {
                                    valeur: this.sanitizeInput(optionInput.value) || 'Sans nom',
                                    sousRubriques: []
                                };
                                
                                // Traiter toutes les sous-rubriques de cette option
                                Array.from(sousRubriqueContainer.children).forEach(sousRubrique => {
                                    const sousRubriqueData = this.processRubrique(sousRubrique);
                                    if (sousRubriqueData) {
                                        optionData.sousRubriques.push(sousRubriqueData);
                                    }
                                });
                                
                                rubriqueData.options.push(optionData);
                            }
                        }
                    });
                }
                
                // Traiter les sous-rubriques normales
                const sousRubriquesContainer = rubriqueEl.querySelector(':scope > .sous-rubriques');
                if (sousRubriquesContainer && sousRubriquesContainer.children.length > 0) {
                    rubriqueData.sousRubriques = [];
                    
                    Array.from(sousRubriquesContainer.children).forEach(sousRubrique => {
                        const sousRubriqueData = this.processRubrique(sousRubrique);
                        if (sousRubriqueData) {
                            rubriqueData.sousRubriques.push(sousRubriqueData);
                        }
                    });
                }
                
                return rubriqueData;
            }
            
            validateForm() {
                const errors = [];
                const nom = document.getElementById('nom').value;
                const periode = document.getElementById('periode').value;
                const delaiAccord = document.getElementById('delai-accord').value;
                const penaliteType = document.getElementById('penalite-type').value;
                const penaliteValeur = document.getElementById('penalite-valeur').value;
                
                if (!nom || nom.trim() === '') {
                    errors.push('Le nom de l\'impôt est requis');
                    document.getElementById('nom-error').style.display = 'block';
                } else {
                    document.getElementById('nom-error').style.display = 'none';
                }
                
                if (!periode || periode.trim() === '') {
                    errors.push('La période de paiement est requise');
                    document.getElementById('periode-error').style.display = 'block';
                } else {
                    document.getElementById('periode-error').style.display = 'none';
                }
                
                if (!delaiAccord || delaiAccord.trim() === '' || parseInt(delaiAccord) < 0) {
                    errors.push('Le délai accordé est requis et doit être un nombre positif');
                    document.getElementById('delai-error').style.display = 'block';
                } else {
                    document.getElementById('delai-error').style.display = 'none';
                }
                
                if (penaliteType !== 'aucune' && (!penaliteValeur || penaliteValeur.trim() === '' || parseFloat(penaliteValeur) <= 0)) {
                    errors.push('La valeur de la pénalité est requise et doit être supérieure à 0');
                }
                
                // Vérifier qu'il y a au moins une rubrique
                const rubriques = this.rubriquesContainer.querySelectorAll('.rubrique');
                if (rubriques.length === 0) {
                    errors.push('Au moins une rubrique est requise');
                }
                
                return errors;
            }
            
            genererJson() {
                try {
                    const errors = this.validateForm();
                    if (errors.length > 0) {
                        this.showMessage(errors.join(', '), 'error');
                        return;
                    }
                    
                    const nom = this.sanitizeInput(document.getElementById('nom').value) || 'Nouvel impôt';
                    const description = this.sanitizeInput(document.getElementById('description').value) || '';
                    const formule = this.sanitizeInput(document.getElementById('formule').value) || '';
                    const periode = document.getElementById('periode').value;
                    const delaiAccord = parseInt(document.getElementById('delai-accord').value) || 0;
                    const penaliteType = document.getElementById('penalite-type').value;
                    
                    // Configuration des pénalités
                    let penalites = { type: 'aucune', valeur: 0 };
                    
                    if (penaliteType !== 'aucune') {
                        const penaliteValeur = parseFloat(document.getElementById('penalite-valeur').value) || 0;
                        penalites = {
                            type: penaliteType,
                            valeur: penaliteValeur
                        };
                    }
                    
                    // Récupérer les paramètres de calcul
                    const calculParams = {};
                    const paramElements = this.parametresContainer.querySelectorAll('.param-group');
                    
                    paramElements.forEach(param => {
                        const nameInput = param.querySelector('.param-name');
                        const valueInput = param.querySelector('.param-value');
                        
                        if (nameInput && valueInput) {
                            const name = this.sanitizeInput(nameInput.value);
                            const value = this.sanitizeInput(valueInput.value);
                            
                            if (name && value) {
                                // Essayer de convertir en nombre si possible
                                const numValue = parseFloat(value);
                                calculParams[name] = isNaN(numValue) ? value : numValue;
                            }
                        }
                    });
                    
                    // Récupérer les rubriques
                    const formulaire = [];
                    const rubriques = this.rubriquesContainer.querySelectorAll(':scope > .rubrique');
                    
                    rubriques.forEach(rubrique => {
                        const rubriqueData = this.processRubrique(rubrique);
                        if (rubriqueData) {
                            formulaire.push(rubriqueData);
                        }
                    });
                    
                    // Construire l'objet final
                    const impotsData = {
                        id: Date.now(),
                        nom: nom,
                        description: description,
                        periode: periode,
                        delaiAccord: delaiAccord,
                        penalites: penalites,
                        formulaire: formulaire,
                        calcul: {
                            formule: formule,
                            ...calculParams
                        },
                        dateCreation: new Date().toISOString(),
                        version: "1.0"
                    };
                    
                    // Stocker les données JSON pour l'enregistrement
                    this.jsonData = impotsData;
                    
                    // Afficher le JSON
                    const jsonOutput = document.getElementById('resultat-json');
                    jsonOutput.textContent = JSON.stringify(impotsData, null, 2);
                    jsonOutput.style.display = 'block';
                    
                    // Afficher le bouton d'enregistrement
                    this.enregistrerBddBtn.style.display = 'block';
                    
                    // Scroll vers le JSON avec animation
                    setTimeout(() => {
                        jsonOutput.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }, 100);
                    
                    this.showMessage('JSON généré avec succès !', 'success');
                    
                } catch (error) {
                    console.error('Erreur lors de la génération JSON:', error);
                    this.showMessage('Erreur lors de la génération du JSON: ' + error.message, 'error');
                }
            }
            
            async enregistrerEnBase() {
                if (!this.jsonData) {
                    this.showMessage('Veuillez d\'abord générer le JSON', 'error');
                    return;
                }
                
                try {
                    const nom = this.sanitizeInput(document.getElementById('nom').value) || 'Nouvel impôt';
                    const description = this.sanitizeInput(document.getElementById('description').value) || '';
                    
                    const response = await fetch('calls/impots/ajouter.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            nom: nom,
                            description: description,
                            jsonData: this.jsonData
                        })
                    });
                    
                    const result = await response.json();
                    
                    if (result.status === 'success') {
                        this.showMessage('Impôt enregistré avec succès en base de données !', 'success');
                    } else {
                        this.showMessage('Erreur lors de l\'enregistrement: ' + result.message, 'error');
                    }
                    
                } catch (error) {
                    console.error('Erreur lors de l\'enregistrement:', error);
                    this.showMessage('Erreur lors de l\'enregistrement en base de données: ' + error.message, 'error');
                }
            }
            
            reinitialiser() {
                if (!confirm('Êtes-vous sûr de vouloir réinitialiser le formulaire ? Toutes les données seront perdues.')) {
                    return;
                }
                
                try {
                    // Réinitialiser les champs de base
                    document.getElementById('nom').value = '';
                    document.getElementById('description').value = '';
                    document.getElementById('formule').value = '';
                    document.getElementById('periode').value = '';
                    document.getElementById('penalite-type').value = 'aucune';
                    document.getElementById('penalite-valeur').value = '';
                    document.getElementById('delai-accord').value = '0';
                    
                    // Masquer le conteneur de valeur de pénalité
                    this.penaliteValeurContainer.style.display = 'none';
                    
                    // Cacher les messages d'erreur
                    document.getElementById('nom-error').style.display = 'none';
                    document.getElementById('periode-error').style.display = 'none';
                    document.getElementById('delai-error').style.display = 'none';
                    
                    // Réinitialiser les paramètres
                    this.parametresContainer.innerHTML = `
                        <h3>Paramètres de calcul</h3>
                        <div class="param-group" data-param-id="1">
                            <input type="text" placeholder="Nom du paramètre" class="param-name">
                            <input type="text" placeholder="Valeur" class="param-value">
                            <button type="button" class="btn-danger btn-small remove-param">❌</button>
                        </div>
                    `;
                    
                    // Réinitialiser le compteur et réattacher l'événement
                    this.paramCount = 1;
                    this.initializeFirstParam();
                    
                    // Réinitialiser les rubriques
                    this.rubriquesContainer.innerHTML = '<div class="empty-state">Aucune rubrique ajoutée. Cliquez sur "Ajouter une rubrique" pour commencer.</div>';
                    this.rubriqueCount = 0;
                    
                    // Cacher le JSON
                    document.getElementById('resultat-json').style.display = 'none';
                    
                    // Cacher le bouton d'enregistrement
                    this.enregistrerBddBtn.style.display = 'none';
                    
                    // Effacer les données JSON
                    this.jsonData = null;
                    
                    // Effacer les messages
                    this.messageContainer.innerHTML = '';
                    
                    this.showMessage('Formulaire réinitialisé avec succès !', 'success');
                    
                } catch (error) {
                    console.error('Erreur lors de la réinitialisation:', error);
                    this.showMessage('Erreur lors de la réinitialisation: ' + error.message, 'error');
                }
            }
        }
        
        // Initialisation sécurisée
        document.addEventListener('DOMContentLoaded', function() {
            try {
                const taxCreator = new TaxCreator();
                console.log('Créateur d\'impôts initialisé avec succès');
            } catch (error) {
                console.error('Erreur lors de l\'initialisation:', error);
                
                // Affichage d'un message d'erreur à l'utilisateur
                const container = document.querySelector('.container');
                if (container) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message';
                    errorDiv.textContent = 'Erreur lors du chargement de l\'application. Veuillez recharger la page.';
                    errorDiv.style.position = 'fixed';
                    errorDiv.style.top = '20px';
                    errorDiv.style.left = '50%';
                    errorDiv.style.transform = 'translateX(-50%)';
                    errorDiv.style.zIndex = '9999';
                    errorDiv.style.padding = '15px 25px';
                    errorDiv.style.borderRadius = '8px';
                    errorDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    document.body.appendChild(errorDiv);
                    
                    setTimeout(() => {
                        if (document.body.contains(errorDiv)) {
                            document.body.removeChild(errorDiv);
                        }
                    }, 5000);
                }
            }
        });
        
        // Gestion des erreurs globales
        window.addEventListener('error', function(e) {
            console.error('Erreur globale capturée:', e.error);
        });
        
        window.addEventListener('unhandledrejection', function(e) {
            console.error('Promesse rejetée non gérée:', e.reason);
        });
    </script>
</body>
</html>