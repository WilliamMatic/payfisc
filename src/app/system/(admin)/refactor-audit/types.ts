// Types partagés pour l'Audit Refactor

export type ChassisSource = "carte_rose" | "client_simple" | "refactor";
export type CorrectionSource = "locale" | "carte_reprint" | "externe";

export interface ChassisDuplicate {
  id: number;
  numero_chassis: string;
  source: ChassisSource;
  date_creation: string;
  ancien_engin_id: number | null;
  nouveau_engin_id: number;
  utilisateur_id: number | null;
  site_id: number | null;
  ancien_plaque: string | null;
  ancien_chassis: string | null;
  nouveau_plaque: string | null;
  nouveau_chassis: string | null;
  utilisateur_nom: string | null;
  utilisateur_prenom: string | null;
  site_nom: string | null;
}

export interface RefactorCorrection {
  id: number;
  paiement_id: number | null;
  carte_reprint_id: number | null;
  source: CorrectionSource;
  numero_plaque: string | null;
  utilisateur_id: number;
  site_id: number;
  date_correction: string;
  utilisateur_nom: string | null;
  utilisateur_prenom: string | null;
  site_nom: string | null;
  nb_changements: number;
}

export interface RefactorCorrectionDetail {
  id: number;
  entite: string;
  champ: string;
  ancienne_valeur: string | null;
  nouvelle_valeur: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ChassisStats {
  total: number;
  today: number;
  last_7_days: number;
  by_source: Record<ChassisSource, number>;
}

export interface CorrectionStats {
  total: number;
  today: number;
  last_7_days: number;
  by_source: Record<CorrectionSource, number>;
  total_changements: number;
}

export interface AuditFilters {
  source: string;
  site_id: string;
  date_debut: string;
  date_fin: string;
  search: string;
}

export const DEFAULT_FILTERS: AuditFilters = {
  source: "",
  site_id: "",
  date_debut: "",
  date_fin: "",
  search: "",
};
