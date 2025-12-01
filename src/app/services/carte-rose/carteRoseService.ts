// services/carte-rose/carteRoseService.ts

export interface VerificationData {
  telephone: string;
  numeroPlaque: string;
}

export interface ParticulierData {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  adresse: string;
  ville?: string;
  code_postal?: string;
  province?: string;
}

export interface EnginData {
  typeEngin: string;
  marque: string;
  modele: string;
  energie?: string;
  anneeFabrication?: string;
  anneeCirculation?: string;
  couleur?: string;
  puissanceFiscal?: string;
  usage?: string;
  numeroChassis?: string;
  numeroMoteur?: string;
}

export interface CarteRoseResponse {
  status: "success" | "error";
  message?: string;
  type?: string;
  data?: {
    particulier?: {
      id: number;
      nom: string;
      prenom: string;
      telephone: string;
      email?: string;
      adresse: string;
      ville?: string;
      province?: string;
      nif?: string;
    };
    plaque?: {
      id: number;
      numero_plaque: string;
      serie_id: number;
      serie_item_id: number;
      statut: number;
    };
    nom_complet?: string;
    telephone?: string;
    adresse?: string;
    numero_plaque?: string;
    date_attribution?: string;
    particulier_id?: number;
    engin_id?: number;
    nif?: string;
    particulier_existant?: boolean;
    paiement_id?: string; // AJOUT
  };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:80/Impot/backend/calls";

/**
 * Vérifie le téléphone et le numéro de plaque
 */
export const verifierPlaqueTelephone = async (
  verificationData: VerificationData
): Promise<CarteRoseResponse> => {
  try {
    const formData = new FormData();
    formData.append("telephone", verificationData.telephone);
    formData.append("numero_plaque", verificationData.numeroPlaque);

    const response = await fetch(
      `${API_BASE_URL}/carterose/verifier_plaque.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la vérification",
        type: data.type,
      };
    }

    return data;
  } catch (error) {
    console.error("Verification plaque error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification",
    };
  }
};

/**
 * Soumet la carte rose complète
 */
export const soumettreCarteRose = async (
  impotId: string,
  particulierData: ParticulierData,
  enginData: EnginData,
  numeroPlaque: string,
  serieId: number,
  serieItemId: number,
  plaqueAttribueeId: number | null,
  utilisateur: any
): Promise<CarteRoseResponse> => {
  try {
    const formData = new FormData();

    // Données de base
    formData.append("impot_id", impotId);
    formData.append("utilisateur_id", utilisateur.id.toString());
    formData.append("site_id", utilisateur.site_id?.toString() || "1");

    // Données du particulier
    formData.append("nom", particulierData.nom);
    formData.append("prenom", particulierData.prenom);
    formData.append("telephone", particulierData.telephone);
    formData.append("email", particulierData.email || "");
    formData.append("adresse", particulierData.adresse);
    formData.append("ville", particulierData.ville || "");
    formData.append("code_postal", particulierData.code_postal || "");
    formData.append("province", particulierData.province || "");

    // Données de l'engin - CORRECTION ICI
    formData.append("type_engin", enginData.typeEngin);
    // Concaténer marque et modèle avec un espace
    const marqueComplete = `${enginData.marque} ${enginData.modele}`;
    formData.append("marque", marqueComplete);
    formData.append("energie", enginData.energie || "");
    formData.append("annee_fabrication", enginData.anneeFabrication || "");
    formData.append("annee_circulation", enginData.anneeCirculation || "");
    formData.append("couleur", enginData.couleur || "");
    formData.append("puissance_fiscal", enginData.puissanceFiscal || "");
    formData.append("usage_engin", enginData.usage || "");
    formData.append("numero_chassis", enginData.numeroChassis || "");
    formData.append("numero_moteur", enginData.numeroMoteur || "");

    // Données plaque
    formData.append("numero_plaque", numeroPlaque);
    formData.append("serie_id", serieId.toString());
    formData.append("serie_item_id", serieItemId.toString());

    if (plaqueAttribueeId) {
      formData.append("plaque_attribuee_id", plaqueAttribueeId.toString());
    }

    const response = await fetch(
      `${API_BASE_URL}/carterose/soumettre_carte_rose.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la soumission de la carte rose",
      };
    }

    return data;
  } catch (error) {
    console.error("Soumettre carte rose error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la soumission de la carte rose",
    };
  }
};
