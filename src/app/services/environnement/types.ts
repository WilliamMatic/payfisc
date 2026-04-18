// Types Environnement

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  status: "success" | "error";
  message?: string;
  data?: T;
  id?: number;
  reference?: string;
}

// Communes / Quartiers / Avenues
export interface Commune {
  id: number;
  nom: string;
  code: string | null;
  province_id: number | null;
  site_id: number;
  actif: number;
  nb_quartiers: number;
  date_creation: string;
}

export interface Quartier {
  id: number;
  nom: string;
  commune_id: number;
  commune_nom: string;
  site_id: number;
  actif: number;
  date_creation: string;
}

export interface Avenue {
  id: number;
  nom: string;
  quartier_id: number;
  quartier_nom: string;
  commune_nom: string;
  site_id: number;
  actif: number;
  date_creation: string;
}

// Types Activité
export interface TypeActivite {
  id: number;
  nom: string;
  code: string;
  description: string | null;
  site_id: number;
  actif: number;
  date_creation: string;
}

// Types Pollution
export interface TypePollution {
  id: number;
  nom: string;
  code: string;
  description: string | null;
  site_id: number;
  actif: number;
  date_creation: string;
}

// Niveaux Risque
export interface NiveauRisque {
  id: number;
  nom: string;
  code: string;
  coefficient: number;
  couleur: string;
  site_id: number;
  actif: number;
  date_creation: string;
}

// Catégories Taxe
export interface CategorieTaxe {
  id: number;
  nom: string;
  code: string;
  montant: number;
  periodicite: "mensuelle" | "trimestrielle" | "semestrielle" | "annuelle";
  description: string | null;
  site_id: number;
  actif: number;
  date_creation: string;
}

// Contribuable
export interface Contribuable {
  id: number;
  reference: string;
  nom: string;
  prenom: string | null;
  nom_etablissement: string | null;
  telephone: string | null;
  email: string | null;
  type_activite: string;
  description_activite: string | null;
  niveau_risque: string;
  categorie_taxe_id: number | null;
  commune_id: number | null;
  quartier_id: number | null;
  avenue_id: number | null;
  numero_avenue: string | null;
  numero_parcelle: string | null;
  latitude: string | null;
  longitude: string | null;
  province_id: number | null;
  site_id: number;
  actif: number;
  date_creation: string;
  // Joined
  commune_nom?: string;
  quartier_nom?: string;
  avenue_nom?: string;
  categorie_taxe_nom?: string;
  montant_taxe?: number;
}

// Évaluation
export interface Evaluation {
  id: number;
  reference: string;
  contribuable_id: number;
  pollution_visible: number;
  type_dechets: string | null;
  impact_voisinage: string;
  types_pollution: string | null;
  niveau_pollution: string;
  score_environnemental: number;
  observations: string | null;
  classification: string;
  categorie_taxe_recommandee_id: number | null;
  latitude: string | null;
  longitude: string | null;
  agent_id: number | null;
  province_id: number | null;
  site_id: number;
  date_evaluation: string;
  // Joined
  contribuable_nom?: string;
  contribuable_prenom?: string;
  contribuable_ref?: string;
  nom_etablissement?: string;
  type_activite?: string;
  commune_nom?: string;
  categorie_recommandee_nom?: string;
}

// Facture
export type StatutFacture = "impayee" | "payee" | "annulee";

export interface Facture {
  id: number;
  reference: string;
  contribuable_id: number;
  categorie_taxe_id: number | null;
  montant: number;
  periodicite: string;
  periode_debut: string | null;
  periode_fin: string | null;
  statut: StatutFacture;
  province_id: number | null;
  site_id: number;
  date_creation: string;
  // Joined
  contribuable_nom?: string;
  contribuable_prenom?: string;
  contribuable_ref?: string;
  contribuable_tel?: string;
  nom_etablissement?: string;
  commune_nom?: string;
  quartier_nom?: string;
  categorie_taxe_nom?: string;
}

// Paiement
export type ModePaiement = "especes" | "mobile_money" | "banque";

export interface Paiement {
  id: number;
  reference: string;
  facture_id: number;
  contribuable_id: number;
  montant: number;
  mode_paiement: ModePaiement;
  numero_mobile: string | null;
  nom_banque: string | null;
  numero_carte: string | null;
  titulaire_carte: string | null;
  province_id: number | null;
  site_id: number;
  utilisateur_id: number | null;
  date_paiement: string;
  // Joined
  contribuable_nom?: string;
  contribuable_prenom?: string;
  contribuable_ref?: string;
  contribuable_tel?: string;
  nom_etablissement?: string;
  facture_ref?: string;
  periode_debut?: string;
  periode_fin?: string;
  periodicite?: string;
  commune_nom?: string;
  quartier_nom?: string;
  categorie_taxe_nom?: string;
}

// Répartition
export interface Repartition {
  id: number;
  paiement_id: number;
  beneficiaire_id: number;
  montant: number;
  beneficiaire_nom?: string;
  numero_compte?: string;
}

export interface RepartitionGlobale {
  beneficiaire_nom: string;
  numero_compte: string;
  total_montant: number;
  nb_repartitions: number;
}

// Contrôle
export interface Controle {
  id: number;
  reference: string;
  contribuable_id: number;
  type_controle: "verification_paiement" | "inspection_terrain" | "audit";
  resultat: "conforme" | "non_conforme" | "en_infraction";
  observations: string | null;
  latitude: string | null;
  longitude: string | null;
  agent_id: number | null;
  province_id: number | null;
  site_id: number;
  date_controle: string;
  // Joined
  contribuable_nom?: string;
  contribuable_prenom?: string;
  contribuable_ref?: string;
  nom_etablissement?: string;
  type_activite?: string;
  commune_nom?: string;
}

// Sanction
export interface Sanction {
  id: number;
  reference: string;
  contribuable_id: number;
  controle_id: number | null;
  type_sanction: "amende" | "fermeture" | "saisie" | "avertissement";
  montant_amende: number | null;
  motif: string | null;
  statut: "active" | "levee" | "payee";
  date_debut: string | null;
  date_fin: string | null;
  province_id: number | null;
  site_id: number;
  utilisateur_id: number | null;
  date_creation: string;
  // Joined
  contribuable_nom?: string;
  contribuable_prenom?: string;
  contribuable_ref?: string;
  nom_etablissement?: string;
  commune_nom?: string;
  controle_ref?: string;
}

// Statistiques
export interface Statistiques {
  collecte_aujourdhui: number;
  collecte_semaine: number;
  collecte_mois: number;
  total_collecte: number;
  nb_paiements: number;
  nb_contribuables: number;
  factures_impayees: number;
  montant_impaye: number;
  taux_recouvrement: number;
  nb_controles: number;
  nb_infractions: number;
  taux_conformite: number;
  sanctions_actives: number;
  par_niveau_pollution: { classification: string; nb: number }[];
  par_niveau_risque: { niveau_risque: string; nb_contribuables: number; total: number }[];
  par_mode: { mode_paiement: string; nb: number; total: number }[];
  par_commune: { commune: string; nb: number; total: number }[];
  par_type_activite: { type_activite: string; nb: number; total: number }[];
  evolution_journaliere: { jour: string; total: number; nb: number }[];
}
