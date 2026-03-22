// components/types.ts
export interface Assujetti {
  id: number;
  nom_complet: string;
  telephone: string;
  adresse: string;
  nif?: string;
  email?: string;
  particulier_id?: number;
}

export interface Engin {
  id: number;
  numero_plaque: string;
  marque: string;
  modele: string;
  couleur: string;
  energie: string;
  usage_engin: string;
  puissance_fiscal: string;
  annee_fabrication: string;
  annee_circulation?: string;
  numero_chassis: string;
  numero_moteur: string;
  type_engin: string;
}

export interface RechercheResponse {
  existe: boolean;
  assujetti?: Assujetti;
  engin?: Engin;
  message?: string;
}