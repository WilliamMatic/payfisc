export interface Assujetti {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  nif: string;
  email: string | null;
  ville: string | null;
  province: string | null;
}

export interface AchatPlaques {
  id: number;
  assujetti_id: number;
  assujetti: Assujetti;
  date_achat: string;
  nombre_plaques: number;
  type_plaque: "engin" | "voiture" | "camion";
  serie_debut: string;
  serie_fin: string;
  montant_total: number;
  statut: "completé" | "en_cours" | "annulé";
  plaques: string[];
  plaques_detail: Array<{
    numero: string;
    statut: string;
    estDelivree: boolean;
  }>;
  impot_id: string;
  mode_paiement: string;
}

export interface GroupedAchats {
  date: string;
  achats: AchatPlaques[];
  totalPlaques: number;
  totalMontant: number;
}

export interface Statistiques {
  generales: {
    total_achats: number;
    total_grossistes: number;
    total_plaques_vendues: number;
    montant_total: number;
    montant_moyen: number;
  };
  par_type: Array<{
    type_plaque: string;
    nombre_achats: number;
    nombre_plaques: number;
    montant_total: number;
  }>;
  top_grossistes: Array<{
    id: number;
    nom: string;
    prenom: string;
    telephone: string;
    nombre_achats: number;
    total_plaques: number;
    montant_total: number;
  }>;
}

export type ViewMode = "grouped" | "list";