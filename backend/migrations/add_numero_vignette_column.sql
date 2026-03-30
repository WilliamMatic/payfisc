-- Migration: Ajout de la colonne numero_vignette à la table vignettes_delivrees
-- Date: 2026-03-26
-- Description: Permet de stocker le numéro physique de la vignette (facultatif)

ALTER TABLE vignettes_delivrees 
ADD COLUMN numero_vignette VARCHAR(100) NULL DEFAULT NULL 
AFTER code_vignette;
