export interface PaiementAssainissement {
  id: number;
  reference: string;
  facture_id: number;
  contribuable_id: number;
  montant: number;
  mode_paiement: string;
  numero_mobile: string | null;
  nom_banque: string | null;
  statut: string;
  date_paiement: string;
  province_id: number;
  site_id: number;
  contribuable_nom: string;
  contribuable_prenom: string | null;
  contribuable_ref: string;
  contribuable_tel: string | null;
  nom_etablissement: string | null;
  facture_ref: string;
  periode_debut: string;
  periode_fin: string;
  facture_statut: string;
  commune_nom: string | null;
  type_taxe_nom: string | null;
  site_nom: string | null;
  site_code: string | null;
  province_nom: string | null;
}

export interface SuppressionData {
  paiement: {
    id: number;
    reference: string;
    montant: number;
    date_paiement: string;
  };
  contribuable: {
    nom: string;
    reference: string;
    etablissement: string | null;
  };
  suppression: {
    date_suppression: string;
  };
}
