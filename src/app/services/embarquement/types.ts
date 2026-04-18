// Types pour le module Embarquement (Taxe d'Embarquement)

export type ModePaiement = 'especes' | 'mobile_money' | 'banque';
export type StatutPaiement = 'en_attente' | 'confirme' | 'annule';
export type Sexe = 'M' | 'F';
export type RoleContribuable = 'chauffeur' | 'proprietaire';

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

// Type d'engin (Moto, Bateau, etc.)
export interface TypeEnginEmbarquement {
  id: number;
  nom: string;
  description: string | null;
  prix: number;
  actif: number;
  province_id: number | null;
  site_id: number;
  utilisateur_id: number | null;
  date_creation: string;
  date_modification: string | null;
}

// Engin
export interface EnginEmbarquement {
  id: number;
  type_engin_id: number;
  numero_plaque: string;
  marque_modele: string | null;
  numero_chassis: string | null;
  numero_moteur: string | null;
  annee_circulation: number | null;
  annee_fabrication: number | null;
  couleur: string | null;
  puissance_fiscale: string | null;
  actif: number;
  province_id: number | null;
  site_id: number;
  utilisateur_id: number | null;
  date_creation: string;
  date_modification: string | null;
  // Joined
  type_engin_nom?: string;
  type_engin_prix?: number;
}

// Contribuable (Chauffeur / Propriétaire)
export interface ContribuableEmbarquement {
  id: number;
  nom: string;
  postnom: string | null;
  prenom: string | null;
  sexe: Sexe;
  role: RoleContribuable;
  adresse: string | null;
  telephone: string | null;
  actif: number;
  province_id: number | null;
  site_id: number;
  utilisateur_id: number | null;
  date_creation: string;
  date_modification: string | null;
}

// Paiement
export interface PaiementEmbarquement {
  id: number;
  reference: string;
  contribuable_id: number;
  engin_id: number | null;
  type_engin_id: number;
  montant: number;
  mode_paiement: ModePaiement;
  statut: StatutPaiement;
  recu_numero: string | null;
  note: string | null;
  province_id: number | null;
  site_id: number;
  utilisateur_id: number | null;
  encaisse_par: number | null;
  encaisse_par_nom: string | null;
  date_paiement: string;
  date_annulation: string | null;
  // Joined
  contribuable_nom?: string;
  contribuable_postnom?: string;
  contribuable_prenom?: string;
  contribuable_telephone?: string;
  contribuable_role?: string;
  contribuable_sexe?: string;
  contribuable_adresse?: string;
  numero_plaque?: string;
  marque_modele?: string;
  numero_chassis?: string;
  numero_moteur?: string;
  annee_circulation?: number;
  annee_fabrication?: number;
  couleur?: string;
  puissance_fiscale?: string;
  type_engin_nom?: string;
  type_engin_prix?: number;
}

// Répartition
export interface RepartitionEmbarquement {
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

// Statistiques
export interface StatistiquesEmbarquement {
  total_collecte: number;
  nb_paiements: number;
  collecte_aujourdhui: number;
  collecte_semaine: number;
  collecte_mois: number;
  par_type_vehicule: { type_nom: string; nb: number; total: number }[];
  par_mode_paiement: { mode_paiement: string; nb: number; total: number }[];
  evolution_journaliere: { jour: string; nb: number; total: number }[];
  taux_annulation: number;
  nb_annulations: number;
  nb_contribuables: number;
  nb_engins: number;
}

// Répartition globale
export interface RepartitionGlobale {
  beneficiaire_nom: string;
  numero_compte: string;
  type_part: string;
  total_montant: number;
  nb_repartitions: number;
}
