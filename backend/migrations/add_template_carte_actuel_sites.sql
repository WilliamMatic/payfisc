-- Migration: Ajout de la colonne template_carte_actuel à la table sites
-- Date: 2026-04-08
-- Description: Permet d'activer/désactiver l'impression du template carte actuel pour un site
-- 0 = pas de template actuel (par défaut), 1 = template actuel activé

ALTER TABLE sites 
ADD COLUMN template_carte_actuel TINYINT(1) NOT NULL DEFAULT 0 
AFTER formule;
