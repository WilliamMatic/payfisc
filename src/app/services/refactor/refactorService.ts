/**
 * Service pour la gestion du refactor des cartes
 */

export interface DonneesRefactor {
  id: number;
  engin_id: number;
  particulier_id: number;
  numero_plaque: string;
  type_engin: string;
  marque: string;
  energie: string;
  annee_fabrication: string;
  annee_circulation: string;
  couleur: string;
  puissance_fiscal: string;
  usage_engin: string;
  numero_chassis: string;
  numero_moteur: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  nif: string;
  montant: number;
  mode_paiement: string;
  date_paiement: string;
  site_nom: string;
  caissier: string;
}

export interface RefactorResponse {
  status: "success" | "error";
  message?: string;
  data?: DonneesRefactor;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls/refactor";

/**
 * Vérifie un ID DGRK et récupère les données associées
 */
export const verifierIdDGRK = async (
  idDGRK: string
): Promise<RefactorResponse> => {
  try {
    const formData = new FormData();
    formData.append("id_dgrk", idDGRK);

    const response = await fetch(`${API_BASE_URL}/refactor/verifier_dgrk.php`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Identifiant DGRK non trouvé",
      };
    }

    return data;
  } catch (error) {
    console.error("Verifier DGRK error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification",
    };
  }
};

/**
 * Traite une demande de refactor
 */
export const traiterRefactor = async (
  idDGRK: string,
  donneesEngin: any,
  donneesParticulier: any
): Promise<RefactorResponse> => {
  try {
    const formData = new FormData();
    formData.append("id_dgrk", idDGRK);
    formData.append("donnees_engin", JSON.stringify(donneesEngin));
    formData.append("donnees_particulier", JSON.stringify(donneesParticulier));

    const response = await fetch(
      `${API_BASE_URL}/refactor/traiter_refactor.php`,
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
        message: data.message || "Échec du traitement du refactor",
      };
    }

    return data;
  } catch (error) {
    console.error("Traiter refactor error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors du traitement",
    };
  }
};
