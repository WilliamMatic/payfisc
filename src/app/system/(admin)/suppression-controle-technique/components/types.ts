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

export interface ResultatElement {
  id: number;
  controle_id: number;
  element_id: number;
  nom_element: string;
  statut: "bon" | "mauvais" | "non-commence";
  date_verification: string;
}

export interface ControleTechnique {
  id: number;
  reference: string;
  assujetti: Assujetti;
  engin: Engin;
  date_controle: string | null;
  date_creation: string;
  statut: "termine" | "en-cours";
  decision_finale: "favorable" | "defavorable" | null;
  pv_generated: number;
  agent_id: number | null;
  paiement_id: number | null;
  resultats: ResultatElement[];
}

export interface SuppressionData {
  controle_supprime: {
    id: number;
    reference: string;
    date_controle: string | null;
    decision_finale: string | null;
    statut: string;
    nombre_elements: number;
    elements_bons: number;
    elements_mauvais: number;
  };
  assujetti_nom: string;
  numero_plaque: string;
  date_suppression: string;
}

export interface Stats {
  total: number;
  favorables: number;
  defavorables: number;
  en_cours: number;
}
