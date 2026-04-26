// Types — Module Foncier

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
  skipped?: number;
}

export interface Ville {
  id: number;
  nom: string;
  province_id: number | null;
  province_nom?: string;
  site_id: number;
  actif: number;
  date_creation: string;
}

export interface Commune {
  id: number;
  nom: string;
  ville_id: number;
  ville_nom?: string;
  site_id: number;
  actif: number;
}

export interface Quartier {
  id: number;
  nom: string;
  commune_id: number;
  commune_nom?: string;
  rang_fiscal_id: number | null;
  rang_fiscal_nom?: string;
  site_id: number;
  actif: number;
}

export interface Avenue {
  id: number;
  nom: string;
  quartier_id: number;
  quartier_nom?: string;
  site_id: number;
  actif: number;
}

export interface RangFiscal {
  id: number;
  nom: string;
  description: string | null;
  ordre: number;
  site_id: number;
  actif: number;
}

export interface TypeConcession {
  id: number;
  nom: string;
  code: string;
  description: string | null;
  site_id: number;
  actif: number;
}

export interface Affectation {
  id: number;
  nom: string;
  code: string;
  description: string | null;
  site_id: number;
  actif: number;
}

export interface Tarif {
  id: number;
  rang_fiscal_id: number;
  rang_nom?: string;
  type_concession_id: number;
  type_nom?: string;
  affectation_id: number;
  affectation_nom?: string;
  prix_m2: number;
  devise: string;
  site_id: number;
  actif: number;
}

export interface Penalite {
  id: number;
  nom: string;
  taux_pourcentage: number;
  delai_jours: number;
  site_id: number;
  actif: number;
}

export interface AgentTerrain {
  id: number;
  matricule: string;
  nom: string;
  prenom: string | null;
  telephone: string | null;
  email: string | null;
  province_id: number | null;
  site_id: number;
  actif: number;
  date_creation: string;
}

export type StatutBien = "en_attente" | "valide" | "rejete";

export interface Bien {
  id: number;
  reference: string;
  proprietaire_nom: string | null;
  proprietaire_telephone: string | null;
  proprietaire_email: string | null;
  proprietaire_inconnu: number;
  ville_id: number | null;
  ville_nom?: string;
  commune_id: number | null;
  commune_nom?: string;
  quartier_id: number | null;
  quartier_nom?: string;
  avenue_id: number | null;
  avenue_nom?: string;
  numero_avenue: string | null;
  numero_parcelle: string | null;
  superficie: number;
  type_concession_id: number | null;
  type_concession_nom?: string;
  affectation_id: number | null;
  affectation_nom?: string;
  rang_fiscal_id: number | null;
  rang_fiscal_nom?: string;
  latitude: string | null;
  longitude: string | null;
  photo_url: string | null;
  statut: StatutBien;
  motif_rejet: string | null;
  date_validation: string | null;
  valide_par: number | null;
  agent_terrain_id: number | null;
  agent_nom?: string;
  agent_prenom?: string;
  utilisateur_id: number | null;
  province_id: number | null;
  site_id: number;
  actif: number;
  date_creation: string;
}

export type StatutFacture = "impayee" | "payee" | "annulee" | "en_retard";

export interface Facture {
  id: number;
  reference: string;
  qr_code: string | null;
  bien_id: number;
  bien_ref?: string;
  proprietaire_nom?: string;
  proprietaire_telephone?: string;
  numero_parcelle?: string;
  bien_superficie?: number;
  commune_nom?: string;
  quartier_nom?: string;
  annee: number;
  superficie: number;
  prix_m2: number;
  montant_base: number;
  montant_penalite: number;
  montant_total: number;
  devise: string;
  date_emission: string;
  date_echeance: string;
  statut: StatutFacture;
  province_id: number | null;
  site_id: number;
  utilisateur_id: number | null;
  date_creation: string;
  // Extra for detail
  ville_nom?: string;
  avenue_nom?: string;
  type_concession_nom?: string;
  affectation_nom?: string;
  rang_fiscal_nom?: string;
  proprietaire_email?: string;
}

export type ModePaiement = "mobile_money" | "banque" | "especes";

export interface Paiement {
  id: number;
  reference: string;
  facture_id: number;
  facture_ref?: string;
  annee?: number;
  facture_total?: number;
  bien_id: number;
  bien_ref?: string;
  proprietaire_nom?: string;
  proprietaire_telephone?: string;
  numero_parcelle?: string;
  commune_nom?: string;
  quartier_nom?: string;
  montant: number;
  mode_paiement: ModePaiement;
  operateur_mobile: string | null;
  numero_mobile: string | null;
  nom_banque: string | null;
  numero_transaction: string | null;
  titulaire_compte: string | null;
  statut: "valide" | "annule" | "en_attente";
  province_id: number | null;
  site_id: number;
  utilisateur_id: number | null;
  date_paiement: string;
}

export interface Repartition {
  id: number;
  paiement_id: number;
  beneficiaire_id: number;
  beneficiaire_nom?: string;
  numero_compte?: string;
  impot_beneficiaire_id: number | null;
  montant: number;
  type_part: string;
  valeur_part: number;
  date_creation: string;
}

export interface RepartitionGlobale {
  beneficiaire_id: number;
  beneficiaire_nom: string;
  numero_compte: string | null;
  nb_paiements: number;
  total_recu: number;
}

export interface CalculImpot {
  bien_id: number;
  superficie: number;
  prix_m2: number;
  montant_base: number;
  devise: string;
}

export interface StatistiquesFoncier {
  annee: number;
  total_biens: number;
  biens_en_attente: number;
  biens_valides: number;
  total_factures: number;
  montant_facture: number;
  total_paiements: number;
  montant_recouvre: number;
  total_impayes: number;
  montant_impaye: number;
  taux_recouvrement: number;
  par_commune: {
    commune_nom: string | null;
    nb_biens: number;
    total_paye: number;
  }[];
  repartition_beneficiaires: RepartitionGlobale[];
}

export interface RevenuMensuel {
  mois: number;
  total: number;
}

export interface AuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  description: string | null;
  utilisateur_id: number | null;
  utilisateur_nom?: string;
  agent_terrain_id: number | null;
  site_id: number;
  date_creation: string;
}
