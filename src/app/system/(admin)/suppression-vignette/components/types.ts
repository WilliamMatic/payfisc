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

export interface Vignette {
  id: number;
  type: "achat" | "delivrance" | "renouvellement";
  assujetti: Assujetti;
  engin: Engin;
  paiement?: Paiement;
  site_achat: string;
  date_achat: string;
  date_expiration: string;
  montant_paye: number;
  mode_paiement: string;
  reference_paiement: string;
}

export interface SuppressionData {
  site: {
    id: number;
    nom_site: string;
  };
  vignette_supprimee: {
    id: number;
    numero_plaque: string;
    type: string;
    date_achat: string;
    date_expiration: string;
    montant: number;
  };
  assujetti: Assujetti;
  engin: Engin;
  suppression: {
    id: number;
    date_suppression: string;
    operateur: string;
    motif: string;
  };
  utilisateur: {
    id: number;
    nom: string;
  };
}
