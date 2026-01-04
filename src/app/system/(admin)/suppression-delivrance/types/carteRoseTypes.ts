export interface CarteRose {
  paiement_id: number;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  adresse?: string;
  nif?: string;
  particulier_id: number;
  numero_plaque: string;
  type_engin: string;
  marque: string;
  energie?: string;
  annee_fabrication?: string;
  annee_circulation?: string;
  couleur?: string;
  puissance_fiscal?: string;
  usage_engin?: string;
  numero_chassis?: string;
  numero_moteur?: string;
  engin_id: number;
  date_attribution: string;
  site_nom: string;
  caissier: string;
  impot_id: number;
  plaque_attribuee_id?: number;
  reprint_id?: number;
}

export interface StatsCartesRoses {
  total: number;
  clientsUniques: number;
  datePremiere: string | undefined; // Changé ici
  dateDerniere: string | undefined; // Changé ici
  typesVehicules: Record<string, number>;
}

export interface RechercheParamsCartesRoses {
  page?: number;
  limit?: number;
  search?: string;
  date_debut?: string;
  date_fin?: string;
  site_id?: number;
  type_engin?: string;
  order_by?: string;
  order_dir?: "ASC" | "DESC";
}

export interface PaginationResponseCartesRoses {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Site {
  id: number;
  nom: string;
  code: string;
}

export interface TypeVehicule {
  type: string;
  count: number;
}

export interface FilterState {
  date_debut: string;
  date_fin: string;
  site_id: number;
  type_engin: string;
  order_by: string;
  order_dir: "ASC" | "DESC";
}
