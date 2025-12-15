/**
 * Service pour la gestion des plaques
 */

// Interfaces
export interface Plaque {
  id: number;
  numero: string;
  statut: "non-livre" | "livre";
  date_attribution?: string;
  assujetti?: {
    nom: string;
    prenom: string;
    adresse: string;
  };
  moto?: {
    marque: string;
    modele: string;
    energie: string;
    anneeFabrication: number;
    anneeCirculation: number;
    couleur: string;
    puissanceFiscale: number;
    usage: string;
    numeroChassis: string;
    numeroMoteur: string;
    typeEngin?: string;
  };
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PlaquesResponse {
  plaques: Plaque[];
  pagination: PaginationData;
}

export interface Statistiques {
  nonLivrees: number;
  livrees: number;
  total: number;
}

export interface ApiResponse {
  status: "success" | "error";
  message?: string;
  data?: any;
}

// URL de base
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls";

/**
 * Récupère les plaques avec pagination
 */
export const getPlaques = async (
  particulierId: number,
  page: number = 1,
  limit: number = 20,
  statut?: "non-livre" | "livre",
  searchTerm?: string
): Promise<ApiResponse> => {
  try {
    let url = `${API_BASE_URL}/series/lister_plaques.php?particulier_id=${particulierId}&page=${page}&limit=${limit}`;
    
    if (statut) {
      url += `&statut=${statut === 'livre' ? 1 : 0}`;
    }
    
    if (searchTerm) {
      url += `&search=${encodeURIComponent(searchTerm)}`;
    }
    
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des plaques",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Get plaques error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des plaques",
    };
  }
};

/**
 * Récupère les statistiques des plaques
 */
export const getStatistiques = async (particulierId: number): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/series/get_statistiques.php?particulier_id=${particulierId}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des statistiques",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Get statistiques error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des statistiques",
    };
  }
};

/**
 * Recherche des plaques
 */
export const searchPlaques = async (
  particulierId: number,
  searchTerm: string,
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/series/lister_plaques.php?particulier_id=${particulierId}&search=${encodeURIComponent(
        searchTerm
      )}&page=${page}&limit=${limit}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la recherche des plaques",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Search plaques error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des plaques",
    };
  }
};