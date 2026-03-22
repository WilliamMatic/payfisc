-- ============================================================
-- SCRIPT SQL DE CONFIGURATION — API Externe TSC-NPS
-- ============================================================
-- Exécuter ce script pour créer les données de test nécessaires
-- Prérequis : Les tables mentionnées doivent déjà exister en base
-- ============================================================


-- ============================================================
-- ÉTAPE 1 : Insérer un partenaire de test (banque)
-- ============================================================

INSERT INTO partenaires (
    type_partenaire,
    nom,
    code_banque,
    pays,
    ville,
    adresse,
    telephone,
    email,
    site_web,
    contact_principal,
    raison_sociale,
    actif,
    en_maintenance
) VALUES (
    'banque',
    'BANQUE TEST PARTENAIRE',
    'BTP001',
    'République Démocratique du Congo',
    'Kinshasa',
    'Avenue du Commerce, Gombe, Kinshasa',
    '+243810000001',
    'api@banquetestpartenaire.cd',
    'https://banquetestpartenaire.cd',
    'Jean MUKENDI',
    'BANQUE TEST PARTENAIRE SARL',
    1,
    0
);

-- ============================================================
-- ÉTAPE 2 : Insérer les credentials API de la banque de test
-- ============================================================
-- ⚠️  IMPORTANT : En production, générer des valeurs aléatoires sécurisées
--               pour api_key et api_secret
-- 
-- Credentials de test pour les appels API :
--   Header X-Bank-ID  : BANK-TSC-TEST-001
--   Header X-API-Key  : tsc-api-key-test-2024-abcdef123456
-- ============================================================

INSERT INTO banques_partenaire (
    partenaire_id,
    bank_id,
    api_key,
    api_secret,
    permissions,
    limite_transaction_journaliere,
    limite_transaction_mensuelle,
    montant_minimum,
    montant_maximum,
    url_webhook_confirmation,
    url_webhook_annulation,
    secret_webhook,
    date_expiration,
    ip_autorisees,
    user_agent_autorises,
    actif,
    suspendu
) VALUES (
    LAST_INSERT_ID(),                          -- ID du partenaire créé ci-dessus
    'BANK-TSC-TEST-001',                       -- bank_id unique (à passer en header X-Bank-ID)
    'tsc-api-key-test-2024-abcdef123456',      -- api_key (à passer en header X-API-Key)
    'tsc-secret-XXXXXXXXXXXXXXXXXXXXXXXXXXX',  -- api_secret (non utilisé en auth basique)
    JSON_ARRAY('read_paiements'),              -- Permissions accordées
    10000000.00,                               -- Limite journalière : 10 millions
    100000000.00,                              -- Limite mensuelle  : 100 millions
    1.00,                                      -- Montant minimum   : 1 FC
    5000000.00,                                -- Montant maximum   : 5 millions FC
    'https://banquetestpartenaire.cd/webhook/confirmation',
    'https://banquetestpartenaire.cd/webhook/annulation',
    'webhook-secret-XXXXXXXXXXX',              -- Secret pour signer les webhooks
    '2027-12-31 23:59:59',                     -- Expiration des credentials
    NULL,                                       -- Pas de restriction IP (NULL = toutes les IPs)
    NULL,                                       -- Pas de restriction User-Agent
    1,                                          -- Actif : OUI
    0                                           -- Suspendu : NON
);

-- ============================================================
-- VÉRIFICATION : Afficher les credentials créés
-- ============================================================
SELECT 
    bp.id,
    p.nom AS partenaire,
    bp.bank_id,
    bp.api_key,
    bp.actif,
    bp.suspendu,
    bp.date_expiration,
    bp.limite_transaction_journaliere,
    bp.montant_minimum,
    bp.montant_maximum
FROM banques_partenaire bp
INNER JOIN partenaires p ON bp.partenaire_id = p.id
WHERE bp.bank_id = 'BANK-TSC-TEST-001';
