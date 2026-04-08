-- Migration: Convert flat privilege_json to nested structure
-- Run this once to migrate existing users

UPDATE utilisateurs 
SET privilege_json = JSON_OBJECT(
    'ventePlaque', JSON_OBJECT(
        'simple', COALESCE(JSON_EXTRACT(privilege_json, '$.simple'), false),
        'special', COALESCE(JSON_EXTRACT(privilege_json, '$.special'), false),
        'delivrance', COALESCE(JSON_EXTRACT(privilege_json, '$.delivrance'), false),
        'correctionErreur', false,
        'plaque', COALESCE(JSON_EXTRACT(privilege_json, '$.plaque'), false),
        'reproduction', COALESCE(JSON_EXTRACT(privilege_json, '$.reproduction'), false),
        'series', COALESCE(JSON_EXTRACT(privilege_json, '$.series'), false),
        'autresTaxes', COALESCE(JSON_EXTRACT(privilege_json, '$.autresTaxes'), false)
    ),
    'vignette', JSON_OBJECT(
        'venteDirecte', false,
        'delivrance', false,
        'renouvellement', false
    ),
    'assurance', JSON_OBJECT(
        'venteDirecte', false,
        'delivrance', false,
        'renouvellement', false
    )
)
WHERE privilege_json IS NOT NULL 
  AND JSON_EXTRACT(privilege_json, '$.ventePlaque') IS NULL;
