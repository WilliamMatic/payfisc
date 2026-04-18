// Types pour le module Stationnement (Taxe de stationnement)

export type ModePaiement = 'especes' | 'mobile_money' | 'banque';
export type StatutPaiement = 'en_attente' | 'confirme' | 'annule';
export type StatutStationnement = 'actif' | 'termine' | 'paye';
export type TypeZone = string;
export type ModeTarification = 'horaire' | 'journalier' | 'forfait';
export type TypeVehicule = 'taxi' | 'bus' | 'moto' | 'voiture_privee' | 'camion';
export type StatutControle = 'ok' | 'infraction';
export type StatutAmende = 'impayee' | 'payee';
export type Sexe = 'M' | 'F';

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

// Zone de stationnement
export interface ZoneStationnement {
  id: number;
  nom: string;
  type: TypeZone;
  description: string | null;
  tarif: number;
  mode_tarification: ModeTarification;
  capacite: number | null;
  latitude: number | null;
  longitude: number | null;
  geojson: string | null;
  occupation: number;
  actif: number;
  province_id: number | null;
  site_id: number;
  utilisateur_id: number | null;
  date_creation: string;
  date_modification: string | null;
}

// Propriétaire
export interface ProprietaireStationnement {
  id: number;
  nom: string;
  postnom: string | null;
  prenom: string | null;
  sexe: Sexe;
  adresse: string | null;
  telephone: string | null;
  province_id: number | null;
  site_id: number;
  utilisateur_id: number | null;
  date_creation: string;
  date_modification: string | null;
}

// Véhicule
export interface VehiculeStationnement {
  id: number;
  plaque: string;
  type: TypeVehicule;
  marque_modele: string | null;
  couleur: string | null;
  proprietaire_id: number | null;
  actif: number;
  province_id: number | null;
  site_id: number;
  utilisateur_id: number | null;
  date_creation: string;
  date_modification: string | null;
  proprietaire_nom?: string;
  proprietaire_telephone?: string;
}

// Session de stationnement
export interface SessionStationnement {
  id: number;
  reference: string;
  vehicule_id: number;
  zone_id: number;
  heure_entree: string;
  heure_sortie: string | null;
  duree_heures: number | null;
  montant: number;
  statut: StatutStationnement;
  province_id: number | null;
  site_id: number;
  utilisateur_id: number | null;
  date_creation: string;
  date_modification: string | null;
  // Joined
  plaque?: string;
  vehicule_type?: string;
  marque_modele?: string;
  couleur?: string;
  zone_nom?: string;
  zone_type?: string;
  zone_tarif?: number;
  mode_tarification?: string;
  proprietaire_nom?: string;
}

// Paiement
export interface PaiementStationnement {
  id: number;
  reference: string;
  recu_numero: string | null;
  stationnement_id: number;
  montant: number;
  mode_paiement: ModePaiement;
  numero_mobile: string | null;
  nom_banque: string | null;
  numero_carte: string | null;
  titulaire_carte: string | null;
  statut: StatutPaiement;
  note: string | null;
  province_id: number | null;
  site_id: number;
  utilisateur_id: number | null;
  encaisse_par: number | null;
  date_paiement: string;
  // Joined
  stationnement_ref?: string;
  heure_entree?: string;
  heure_sortie?: string;
  duree_heures?: number;
  plaque?: string;
  vehicule_type?: string;
  marque_modele?: string;
  zone_nom?: string;
  zone_type?: string;
  proprietaire_nom?: string;
}

// Contrôle
export interface ControleStationnement {
  id: number;
  vehicule_id: number;
  zone_id: number | null;
  agent_id: number;
  statut: StatutControle;
  observation: string | null;
  province_id: number | null;
  site_id: number;
  date_controle: string;
  plaque?: string;
  vehicule_type?: string;
  marque_modele?: string;
  zone_nom?: string;
  agent_nom?: string;
}

// Amende
export interface AmendeStationnement {
  id: number;
  reference: string;
  vehicule_id: number;
  controle_id: number | null;
  montant: number;
  motif: string;
  statut: StatutAmende;
  mode_paiement: string | null;
  numero_mobile: string | null;
  nom_banque: string | null;
  numero_carte: string | null;
  titulaire_carte: string | null;
  date_amende: string;
  date_paiement: string | null;
  province_id: number | null;
  site_id: number;
  utilisateur_id: number | null;
  plaque?: string;
  vehicule_type?: string;
  marque_modele?: string;
}

// Répartition
export interface RepartitionStationnement {
  id: number;
  paiement_id: number;
  beneficiaire_id: number;
  province_id: number | null;
  type_part: string;
  valeur_part_originale: number;
  valeur_part_calculee: number;
  montant: number;
  date_creation: string;
  beneficiaire_nom?: string;
  numero_compte?: string;
}

export interface RepartitionGlobale {
  beneficiaire_nom: string;
  numero_compte: string;
  type_part: string;
  total_montant: number;
  nb_repartitions: number;
}

// Statistiques
export interface StatistiquesStationnement {
  total_collecte: number;
  nb_paiements: number;
  collecte_aujourdhui: number;
  collecte_semaine: number;
  collecte_mois: number;
  par_zone: { zone_nom: string; zone_type: string; nb: number; total: number }[];
  par_type_vehicule: { vehicule_type: string; nb: number; total: number }[];
  par_mode_paiement: { mode_paiement: string; nb: number; total: number }[];
  evolution_journaliere: { jour: string; nb: number; total: number }[];
  nb_stationnements_aujourdhui: number;
  nb_stationnements_semaine: number;
  nb_stationnements_periode: number;
  duree_moyenne: number;
  nb_controles: number;
  nb_infractions: number;
  taux_fraude: number;
  total_amendes: number;
  nb_amendes: number;
  nb_vehicules: number;
  nb_zones: number;
  heures_pointe: { heure: number; nb: number }[];
  top_agents: { agent_nom: string; nb_paiements: number; total_collecte: number }[];
}
