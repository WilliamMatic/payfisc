// Types Assainissement

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
  count?: number;
}

// Axes (anciennement Communes)
export interface Axe {
  id: number;
  nom: string;
  code: string | null;
  province_id: number | null;
  site_id: number;
  actif: number;
  nb_contribuables: number;
  date_creation: string;
}

// Types de Taxe
export interface TypeTaxe {
  id: number;
  nom: string;
  description: string | null;
  montant: number;
  periodicite: "mensuelle" | "trimestrielle" | "semestrielle" | "annuelle";
  site_id: number;
  actif: number;
  date_creation: string;
}

// Types Contribuable (dynamic)
export interface TypeContribuableItem {
  id: number;
  nom: string;
  code: string;
  description: string | null;
  site_id: number;
  actif: number;
  date_creation: string;
}

// Contribuable
export type TypeContribuable = string;

export interface Contribuable {
  id: number;
  reference: string;
  nom: string;
  prenom: string | null;
  telephone: string | null;
  email: string | null;
  type_contribuable: TypeContribuable;
  nom_etablissement: string | null;
  numero_parcelle: string | null;
  commune_id: number | null;
  quartier_id: number | null;
  avenue_id: number | null;
  numero_avenue: string | null;
  latitude: string | null;
  longitude: string | null;
  type_taxe_id: number | null;
  province_id: number | null;
  site_id: number;
  utilisateur_id: number | null;
  actif: number;
  date_creation: string;
  // Joined
  commune_nom?: string;
  quartier_nom?: string;
  avenue_nom?: string;
  type_taxe_nom?: string;
  montant_taxe?: number;
  periodicite?: string;
}

// Facture
export type StatutFacture = "impayee" | "payee" | "annulee" | "en_retard";

export interface Facture {
  id: number;
  reference: string;
  contribuable_id: number;
  type_taxe_id: number;
  montant: number;
  periode_debut: string;
  periode_fin: string;
  date_echeance: string;
  statut: StatutFacture;
  province_id: number | null;
  site_id: number;
  utilisateur_id: number | null;
  date_creation: string;
  // Joined
  contribuable_nom?: string;
  contribuable_prenom?: string;
  contribuable_ref?: string;
  contribuable_tel?: string;
  type_contribuable?: string;
  nom_etablissement?: string;
  numero_parcelle?: string;
  numero_avenue?: string;
  commune_nom?: string;
  quartier_nom?: string;
  avenue_nom?: string;
  type_taxe_nom?: string;
  periodicite?: string;
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
  statut: "valide" | "annule";
  province_id: number | null;
  site_id: number;
  utilisateur_id: number | null;
  date_paiement: string;
  // Joined
  contribuable_nom?: string;
  contribuable_prenom?: string;
  contribuable_ref?: string;
  contribuable_tel?: string;
  type_contribuable?: string;
  nom_etablissement?: string;
  numero_parcelle?: string;
  numero_avenue?: string;
  facture_ref?: string;
  periode_debut?: string;
  periode_fin?: string;
  commune_nom?: string;
  quartier_nom?: string;
  avenue_nom?: string;
  type_taxe_nom?: string;
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
  province_id: number | null;
  site_id: number;
  utilisateur_id: number | null;
  date_controle: string;
  // Joined
  contribuable_nom?: string;
  contribuable_prenom?: string;
  contribuable_ref?: string;
  commune_nom?: string;
  quartier_nom?: string;
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
  commune_nom?: string;
  controle_ref?: string;
}

// Types Service (dynamic)
export interface TypeServiceItem {
  id: number;
  nom: string;
  code: string;
  description: string | null;
  site_id: number;
  actif: number;
  date_creation: string;
}

// Passage
export interface Passage {
  id: number;
  reference: string;
  quartier_id: number | null;
  avenue_id: number | null;
  commune_id: number | null;
  type_service: string;
  vehicule_immatriculation: string | null;
  chauffeur_nom: string | null;
  latitude_depart: string | null;
  longitude_depart: string | null;
  latitude_arrivee: string | null;
  longitude_arrivee: string | null;
  geojson_trajet: string | null;
  date_passage: string;
  heure_debut: string | null;
  heure_fin: string | null;
  observations: string | null;
  statut: "en_cours" | "termine" | "annule";
  province_id: number | null;
  site_id: number;
  utilisateur_id: number | null;
  // Joined
  quartier_nom?: string;
  avenue_nom?: string;
  commune_nom?: string;
}

// Répartition
export interface Repartition {
  id: number;
  paiement_id: number;
  beneficiaire_id: number;
  impot_beneficiaire_id: number | null;
  montant: number;
  type_part: string | null;
  valeur_part: number | null;
  date_repartition: string;
  beneficiaire_nom?: string;
  numero_compte?: string;
}

export interface RepartitionGlobale {
  beneficiaire_id: number;
  beneficiaire_nom: string;
  numero_compte: string | null;
  total_montant: number;
  nb_repartitions: number;
}

// Statistiques Dashboard
export interface Statistiques {
  collecte_aujourdhui: number;
  collecte_semaine: number;
  collecte_mois: number;
  total_collecte: number;
  nb_paiements: number;
  nb_contribuables: number;
  factures_impayees: number;
  montant_impaye: number;
  nb_passages: number;
  passages_termines: number;
  nb_controles: number;
  nb_infractions: number;
  sanctions_actives: number;
  taux_recouvrement: number;
  par_mode: { mode_paiement: string; nb: number; total: number }[];
  par_axe: { commune: string; nb: number; total: number }[];
  par_type_contribuable: { type_contribuable: string; nb: number; total: number }[];
  par_utilisateur: { utilisateur: string; nb: number; total: number }[];
  evolution_journaliere: { jour: string; total: number; nb: number }[];
}

// Revenus mensuels
export interface RevenuMensuel {
  mois: number;
  mois_nom: string;
  annee: number;
  nb_factures: number;
  nb_payees: number;
  total_facture: number;
  total_paye: number;
  reste: number;
  taux: number;
}

// Agent Terrain
export interface AgentTerrain {
  id: number;
  nom_complet: string;
  adresse: string | null;
  telephone: string | null;
  commune_id: number | null;
  province_id: number | null;
  site_id: number;
  actif: number;
  date_creation: string;
  commune_nom?: string;
}
