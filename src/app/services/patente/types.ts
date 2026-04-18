// Types pour le module Patente (Taxes Commerciales)

export type TypePersonne = 'physique' | 'morale';
export type SecteurActivite = 'commerce' | 'service' | 'industrie' | 'artisanat' | 'transport' | 'restauration' | 'autre';
export type CategoriePatente = 'petite' | 'moyenne' | 'grande';
export type StatutDeclaration = 'brouillon' | 'soumise' | 'en_classification' | 'classifiee' | 'validee' | 'rejetee';
export type StatutPatente = 'active' | 'expiree' | 'suspendue' | 'annulee' | 'en_attente_paiement';
export type ModePaiement = 'especes' | 'mobile_money' | 'banque';
export type StatutPaiement = 'en_attente' | 'confirme' | 'annule' | 'rembourse';
export type ResultatControle = 'conforme' | 'non_conforme' | 'sans_patente' | 'patente_expiree';

export interface ContribuablePatente {
  id: number;
  numero_fiscal: string;
  nom_complet: string;
  raison_sociale: string | null;
  type_personne: TypePersonne;
  telephone: string;
  email: string | null;
  adresse: string;
  latitude: number | null;
  longitude: number | null;
  nif: string | null;
  rccm: string | null;
  id_nat: string | null;
  forme_juridique: string | null;
  representant_legal: string | null;
  cnss: string | null;
  secteur_activite: string | null;
  pieces_justificatives: string[] | null;
  site_id: number;
  actif: number;
  date_creation: string;
}

export interface DeclarationPatente {
  id: number;
  contribuable_id: number;
  type_activite: string;
  secteur_activite: SecteurActivite;
  description_activite: string | null;
  adresse_activite: string;
  latitude_activite: number | null;
  longitude_activite: number | null;
  chiffre_affaires_estime: number;
  nombre_employes: number;
  surface_local_m2: number | null;
  pieces_justificatives: string[] | null;
  annee_fiscale: number;
  statut: StatutDeclaration;
  site_id: number;
  date_soumission: string | null;
  date_creation: string;
  // Joined fields
  nom_complet?: string;
  numero_fiscal?: string;
  telephone?: string;
  raison_sociale?: string;
  date_soumission_fmt?: string;
  date_creation_fmt?: string;
  // Classification joined
  categorie?: CategoriePatente;
  montant_final?: number;
  agent_classification?: string;
}

export interface ClassificationPatente {
  id: number;
  declaration_id: number;
  categorie: CategoriePatente;
  criteres_json: Record<string, any>;
  montant_calcule: number;
  montant_final: number;
  motif_ajustement: string | null;
  agent_id: number;
  agent_nom: string;
  date_classification: string;
  valide: number;
  validee_par: number | null;
  date_validation: string | null;
}

export interface PatenteDoc {
  id: number;
  numero_patente: string;
  contribuable_id: number;
  declaration_id: number;
  classification_id: number;
  montant: number;
  annee_fiscale: number;
  date_emission: string;
  date_debut_validite: string;
  date_fin_validite: string;
  statut: StatutPatente;
  qr_code_data: string | null;
  site_id: number;
  emise_par: number;
  emise_par_nom: string;
  motif_suspension: string | null;
  // Joined fields
  nom_complet?: string;
  numero_fiscal?: string;
  telephone?: string;
  raison_sociale?: string;
  email?: string;
  adresse?: string;
  type_activite?: string;
  secteur_activite?: SecteurActivite;
  chiffre_affaires_estime?: number;
  adresse_activite?: string;
  categorie?: CategoriePatente;
  montant_calcule?: number;
  agent_classification?: string;
  date_emission_fmt?: string;
  debut_validite_fmt?: string;
  fin_validite_fmt?: string;
  // Payment aggregate (from backend joins)
  montant_total?: number;
  montant_paye?: number;
  reste_a_payer?: number;
}

export interface PaiementPatente {
  id: number;
  reference: string;
  patente_id: number;
  contribuable_id: number;
  montant_total: number;
  montant_paye: number;
  reste_a_payer: number;
  mode_paiement: ModePaiement;
  details_paiement: Record<string, any> | null;
  est_fractionne: number;
  numero_tranche: number | null;
  total_tranches: number | null;
  statut: StatutPaiement;
  recu_numero: string;
  site_id: number;
  encaisse_par: number;
  encaisse_par_nom: string;
  date_paiement: string;
  note: string | null;
  // Joined
  nom_complet?: string;
  numero_fiscal?: string;
  numero_patente?: string;
  annee_fiscale?: number;
  montant_patente?: number;
  type_activite?: string;
  secteur_activite?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  date_paiement_fmt?: string;
}

export interface ControlePatente {
  id: number;
  contribuable_id: number | null;
  patente_id: number | null;
  nom_commerce: string;
  adresse_commerce: string;
  latitude: number | null;
  longitude: number | null;
  photo_path: string | null;
  resultat: ResultatControle;
  observations: string | null;
  pv_genere: number;
  pv_numero: string | null;
  agent_id: number;
  agent_nom: string;
  site_id: number;
  date_controle: string;
  // Joined
  nom_complet?: string;
  numero_patente?: string;
  date_controle_fmt?: string;
}

export interface BaremePatente {
  id: number;
  secteur_activite: SecteurActivite;
  categorie: CategoriePatente;
  ca_min: number;
  ca_max: number | null;
  montant_patente: number;
  actif: number;
}

export interface StatistiquesPatente {
  patentes_actives: number;
  total_patentes: number;
  montant_collecte: number;
  montant_attendu: number;
  taux_recouvrement: number;
  declarations_en_attente: number;
  paiements_par_mois: { mois: number; total: number }[];
  par_categorie: { categorie: CategoriePatente; total: number; montant_total: number }[];
  par_secteur: { secteur_activite: SecteurActivite; total: number; montant_total: number }[];
  top_contribuables: { nom_complet: string; numero_fiscal: string; montant: number; numero_patente: string; type_activite: string }[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export interface TypeActivitePatente {
  id: number;
  libelle: string;
}

export interface SecteurActivitePatente {
  id: number;
  code: string;
  libelle: string;
  icone: string;
}
