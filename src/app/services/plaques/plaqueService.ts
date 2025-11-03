/**
 * Service pour la gestion des plaques - Interface avec l'API backend
 */

// Interfaces pour les données
export interface Serie {
  id: number;
  nom_serie: string;
  description: string | null;
  actif: boolean;
  total_items: number;
  items_disponibles: number;
  items_utilises: number;
  date_creation: string;
  date_creation_formatted?: string;
}

export interface SerieItem {
  id: number;
  serie_id: number;
  value: number;
  statut: "0" | "1";
  nom_serie: string;
  date_creation: string;
}

// Interface pour les réponses de l'API
export interface ApiResponse {
  status: "success" | "error";
  message?: string;
  data?: any;
}

// URL de base de l'API
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls";

/**
 * Récupère la liste de toutes les séries
 */
export const getSeries = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/plaques/lister_series.php`, {
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
        message: data.message || "Échec de la récupération des séries",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Get series error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des séries",
    };
  }
};

/**
 * Récupère les items d'une série spécifique
 */
export const getSerieItems = async (serieId: number): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/plaques/lister_items_serie.php?serie_id=${serieId}`,
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
        message: data.message || "Échec de la récupération des items",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Get serie items error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des items",
    };
  }
};

/**
 * Ajoute une nouvelle série
 */
export const addSerie = async (serieData: {
  nom_serie: string;
  description?: string;
}): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("nom_serie", serieData.nom_serie);
    if (serieData.description) {
      formData.append("description", serieData.description);
    }

    const response = await fetch(`${API_BASE_URL}/plaques/creer_serie.php`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de l'ajout de la série",
      };
    }

    return data;
  } catch (error) {
    console.error("Add serie error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'ajout de la série",
    };
  }
};

/**
 * Modifie une série existante
 */
export const updateSerie = async (
  id: number,
  serieData: {
    nom_serie: string;
    description?: string;
  }
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("nom_serie", serieData.nom_serie);
    if (serieData.description) {
      formData.append("description", serieData.description);
    }

    const response = await fetch(`${API_BASE_URL}/plaques/modifier_serie.php`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la modification de la série",
      };
    }

    return data;
  } catch (error) {
    console.error("Update serie error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la modification de la série",
    };
  }
};

/**
 * Supprime une série
 */
export const deleteSerie = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());

    const response = await fetch(
      `${API_BASE_URL}/plaques/supprimer_serie.php`,
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
        message: data.message || "Échec de la suppression de la série",
      };
    }

    return data;
  } catch (error) {
    console.error("Delete serie error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la suppression de la série",
    };
  }
};

/**
 * Change le statut d'une série (actif/inactif)
 */
export const toggleSerieStatus = async (
  id: number,
  actif: boolean
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("actif", actif.toString());

    const response = await fetch(
      `${API_BASE_URL}/plaques/changer_statut_serie.php`,
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
        message: data.message || "Échec du changement de statut de la série",
      };
    }

    return data;
  } catch (error) {
    console.error("Toggle serie status error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors du changement de statut de la série",
    };
  }
};

/**
 * Recherche des séries par terme
 */
export const searchSeries = async (
  searchTerm: string
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/plaques/rechercher_series.php?search=${encodeURIComponent(
        searchTerm
      )}`,
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
        message: data.message || "Échec de la recherche des séries",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Search series error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des séries",
    };
  }
};
