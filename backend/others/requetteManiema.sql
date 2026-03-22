SELECT 
    p.first_name AS 'Prénom',
    p.last_name AS 'Nom',
    p.phone_number AS 'Téléphone',
    p.address_line1 AS 'Adresse',
    v.vehicle_make_name AS 'Marque',
    v.vehicle_model_name AS 'Modèle',
    v.local_provider_number AS 'Numéro fournisseur',
    ia.reference AS 'Plaque',
    py.amount AS 'Montant payé',
    py.currency AS 'Devise',
    py.payment_date AS 'Date paiement',
    f.name AS 'Numéro formulaire'
FROM people p
INNER JOIN forms f ON p.id = f.person_id
INNER JOIN vehicles v ON f.vehicle_id = v.id
INNER JOIN inventory_articles ia ON f.id = ia.form_id
INNER JOIN payments py ON f.id = py.form_id
WHERE p.type = 'customer'
  AND f.form_state = 3
  AND f.status = 1
  AND f.is_deleted = 0
  AND p.is_deleted = 0
  AND ia.type = 'article'
  AND ia.status = 3
  AND ia.is_deleted = 0
ORDER BY py.payment_date DESC, p.last_name, p.first_name;



Explication des jointures et filtres :

people p : Tbale des personnes (clients)

forms f : Table des formulaires (liens entre clients, véhicules et paiements)

vehicles v : Table des véhicules/engins

inventory_articles ia : Table des plaques d'immatriculation

payments py : Table des paiements

Filtres appliqués :

p.type = 'customer' : Seulement les clients (pas les admins)

f.form_state = 3 : Formulaires complétés/validés

f.status = 1 : Formulaires actifs

ia.type = 'article' et ia.status = 3 : Articles de type plaque livrés

is_deleted = 0 : Éléments non supprimés

Colonnes retournées :

Informations client (nom, prénom, téléphone)

Détails du véhicule (marque, modèle)

Numéro de plaque

Montant et devise du paiement

Date de paiement

Numéro de formulaire




NB : J'ai crée un view qui stock la requêtte. Pour l'afficher : SELECT * FROM view_transactions_clients;