// src/app/activity/(users)/reimpression/types/index.ts

export interface CarteReprint {
  id: number;
  id_primaire: number;
  nom_proprietaire: string;
  adresse_proprietaire?: string;
  nif_proprietaire?: string;
  annee_mise_circulation: string;
  numero_plaque: string;
  marque_vehicule?: string;
  usage_vehicule?: string;
  numero_chassis?: string;
  numero_moteur?: string;
  annee_fabrication?: string;
  couleur_vehicule?: string;
  puissance_vehicule?: string;
  utilisateur_id: number;
  utilisateur_nom?: string;
  site_id: number;
  site_nom?: string;
  status: 0 | 1;
  date_creation: string;
  date_creation_formatted?: string;
}

export interface Stats {
  total: number;
  aImprimer: number;
  dejaImprime: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
