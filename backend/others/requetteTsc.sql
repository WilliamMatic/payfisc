SELECT 
    -- Informations client
    finance_gclient.id AS client_id,
    CONCAT(finance_gclient.nom, ' ', COALESCE(finance_gclient.postnom, ''), ' ', COALESCE(finance_gclient.prenom, '')) AS nom_complet,
    finance_gclient.impot,
    finance_gclient.telephone,
    finance_gclient.adresse,
    finance_gclient.email,
    finance_gclient.idprovince,
    finance_gclient.idville,
    
    -- Informations véhicule
    finance_gvehicule.id AS vehicule_id,
    finance_gvehicule.chassis,
    finance_gvehicule.moteur,
    finance_gvehicule.anneefabr AS annee_fabrication,
    finance_gvehicule.anneecirc AS annee_circulation,
    
    -- Marque
    finance_marquev.code AS marque_code,
    finance_marquev.libelle AS marque,
    
    -- Modèle
    finance_modelev.code AS modele_code,
    finance_modelev.libelle AS modele,
    
    -- Énergie
    finance_energiev.code AS energie_code,
    finance_energiev.libelle AS energie,
    
    -- Couleur
    finance_couleurv.code AS couleur_code,
    finance_couleurv.libelle AS couleur,
    
    -- Usage
    finance_gusage.code AS usage_code,
    finance_gusage.libelle AS usage_vehicule,
    
    -- Auto
    finance_autov.code AS auto_code,
    finance_autov.libelle AS type_auto,
    
    -- Puissance
    finance_gpuissance.code AS puissance_code,
    finance_gpuissance.libelle AS puissance,
    
    -- Informations plaque
    finance_gplaque.id AS plaque_id,
    finance_gplaque.plaque AS numero_plaque,
    finance_gplaque.status AS statut_plaque,
    
    -- Information de suivi
    finance_gsuivi.id AS suivi_id,
    finance_gsuivi.statuspaiement,
    finance_gsuivi.statusvisalivraison,
    finance_gsuivi.statuslivraisonplaque,
    finance_gsuivi.statusimpresioncarte,
    finance_gsuivi.montant AS montant_suivi,
    
    -- Information plaque sortie
    finance_gplaquesortie.datecreation AS date_achat_plaque
    
FROM finance_gclient

-- Jointure véhicule (client → véhicule)
LEFT JOIN finance_gvehicule ON finance_gclient.id = finance_gvehicule.idclient

-- Jointures pour les détails du véhicule
LEFT JOIN finance_marquev ON finance_gvehicule.idmarque = finance_marquev.id
LEFT JOIN finance_modelev ON finance_gvehicule.idmodele = finance_modelev.id
LEFT JOIN finance_energiev ON finance_gvehicule.idenergie = finance_energiev.id
LEFT JOIN finance_couleurv ON finance_gvehicule.idcouleur = finance_couleurv.id
LEFT JOIN finance_gusage ON finance_gvehicule.idusage = finance_gusage.id
LEFT JOIN finance_autov ON finance_gvehicule.idtypeauto = finance_autov.id
LEFT JOIN finance_gpuissance ON finance_gvehicule.idpuissance = finance_gpuissance.id

-- Jointure suivi (véhicule → suivi)
LEFT JOIN finance_gsuivi ON finance_gvehicule.id = finance_gsuivi.idvehicule

-- Jointure plaque sortie (suivi → plaque_sortie)
LEFT JOIN finance_gplaquesortie ON finance_gsuivi.id = finance_gplaquesortie.idsuivi

-- Jointure plaque (plaque_sortie → plaque)
LEFT JOIN finance_gplaque ON finance_gplaquesortie.idplaque = finance_gplaque.id

WHERE finance_gplaque.plaque IS NOT NULL

ORDER BY finance_gclient.nom, finance_gclient.postnom, finance_gclient.prenom, finance_gvehicule.anneefabr DESC;
















SELECT * FROM finance_gclient;
SELECT * FROM finance_gplaque;
SELECT * FROM finance_produit;
SELECT * FROM finance_gvehicule;
SELECT * FROM finance_gsuivi;
SELECT * FROM finance_gplaquesortie;
