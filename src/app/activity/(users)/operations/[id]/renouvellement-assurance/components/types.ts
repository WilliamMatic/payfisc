export interface Assujetti {
  id: number;
  nom_complet: string;
  telephone: string;
  adresse: string;
  nif?: string;
  email?: string;
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

export interface Paiement {
  id: number;
  montant: number;
  mode_paiement: string;
  operateur: string | null;
  numero_transaction: string;
  date_paiement: string;
}

export interface Assurance {
  id: number;
  assujetti: Assujetti;
  engin: Engin;
  paiement: Paiement;
  site_achat: string;
  date_souscription: string;
  date_expiration: string;
  montant_paye: number;
  mode_paiement: string;
  reference_paiement: string;
  jours_restants?: number;
}

export interface Impot {
  id: number;
  nom: string;
  description: string;
  actif: boolean;
  prix?: string | number;
  [key: string]: any;
}
