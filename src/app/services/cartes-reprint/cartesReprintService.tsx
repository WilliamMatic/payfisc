/**
 * Service pour la gestion des cartes à réimprimer
 */

export interface CarteReprintData {
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
  status: 0 | 1; // CHANGÉ de "statut" à "status" (comme l'API)
  date_creation: string;
  date_creation_formatted?: string;
}

export interface CartesReprintResponse {
  status: "success" | "error";
  message?: string;
  data?: CarteReprintData[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats?: {
    total: number;
    aImprimer: number;
    dejaImprime: number;
  };
  site_id?: number;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls";

/**
 * Récupère les cartes à réimprimer avec pagination et filtres
 */
export const getCartesReprint = async (
  utilisateur: any,
  page: number = 1,
  limit: number = 10,
  searchTerm: string = "",
  statusFilter: string = "all"
): Promise<CartesReprintResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search: searchTerm,
      statut: statusFilter, // Envoie "statut" mais API attend "statut"
      site_nom: utilisateur.site_nom || "LIMETE"
    });

    const response = await fetch(
      `${API_BASE_URL}/carte_reprint/get_cartes_reprint.php?${params}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des cartes",
      };
    }

    return data;
  } catch (error) {
    console.error("Get cartes reprint error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des cartes",
    };
  }
};

/**
 * Met à jour le statut d'une carte (marque comme imprimée)
 */
export const mettreAJourStatusCarte = async (
  carteId: number
): Promise<{ status: "success" | "error"; message?: string }> => {
  try {
    const formData = new FormData();
    formData.append("carte_id", carteId.toString());

    const response = await fetch(
      `${API_BASE_URL}/carte_reprint/update_statut.php`,
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
        message: data.message || "Échec de la mise à jour du statut",
      };
    }

    return data;
  } catch (error) {
    console.error("Update statut error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la mise à jour du statut",
    };
  }
};

/**
 * Actualise les données (rafraîchissement)
 */
export const actualiserDonnees = async (
  utilisateur: any,
  page: number = 1,
  limit: number = 10,
  searchTerm: string = "",
  statusFilter: string = "all"
): Promise<CartesReprintResponse> => {
  return getCartesReprint(utilisateur, page, limit, searchTerm, statusFilter);
};