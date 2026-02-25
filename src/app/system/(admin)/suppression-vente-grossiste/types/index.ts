export interface FilterState {
  date_debut: string;
  date_fin: string;
  site_id: number;
  order_by: string;
  order_dir: "ASC" | "DESC";
}

export interface Site {
  id: number;
  nom: string;
  code: string;
}

export interface StatsCommandes {
  total: number;
  montantTotal: number;
  plaquesTotal: number;
  clientsUniques: number;
}

// Fonctions utilitaires
export const formatMontant = (montant: number): string => {
  return `${montant} $`;
};