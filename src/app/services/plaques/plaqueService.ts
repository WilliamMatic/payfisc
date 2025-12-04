/**
 * Service pour la gestion des plaques - Interface avec l'API backend
 */

// Interfaces pour les données
export interface Province {
  id: number;
  nom: string;
  code: string;
  actif: boolean;
}

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
  province_id: number;
  province_nom: string;
  province_code: string;
  debut_numeros: number;
  fin_numeros: number;
}

export interface SerieItem {
  id: number;
  serie_id: number;
  value: number;
  statut: "0" | "1";
  nom_serie: string;
  province_nom: string;
  date_creation: string;
}

export interface RapportSeries {
  periode_debut: string;
  periode_fin: string;
  province_id?: number;
  province_nom?: string;
  total_series: number;
  series_actives: number;
  series_inactives: number;
  total_plaques: number;
  plaques_disponibles: number;
  plaques_utilisees: number;
  series_par_province: Array<{
    province_nom: string;
    province_code: string;
    total_series: number;
    total_plaques: number;
  }>;
  details_series: Array<{
    id: number;
    nom_serie: string;
    province_nom: string;
    date_creation: string;
    actif: boolean;
    total_items: number;
    items_disponibles: number;
    items_utilises: number;
    createur_nom?: string;
    createur_prenom?: string;
  }>;
}

// Interfaces pour la pagination
export interface PaginationResponse {
  status: "success" | "error";
  message?: string;
  data?: {
    series: Serie[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
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
 * Récupère la liste des séries avec pagination (5 derniers par défaut)
 */
export const getSeries = async (
  page: number = 1,
  limit: number = 5
): Promise<PaginationResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/plaques/lister_series.php?page=${page}&limit=${limit}`,
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
        message: data.message || "Échec de la récupération des séries",
      };
    }

    return {
      status: "success",
      data: {
        series: data.data?.series || [],
        pagination: data.data?.pagination || {
          total: 0,
          page: 1,
          limit: 5,
          totalPages: 1,
        },
      },
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
 * Récupère la liste des provinces actives
 */
export const getProvinces = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/plaques/lister_provinces.php`,
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
        message: data.message || "Échec de la récupération des provinces",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Get provinces error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des provinces",
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
  province_id: number;
  debut_numeros: number;
  fin_numeros: number;
  description?: string;
}): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("nom_serie", serieData.nom_serie);
    formData.append("province_id", serieData.province_id.toString());
    formData.append("debut_numeros", serieData.debut_numeros.toString());
    formData.append("fin_numeros", serieData.fin_numeros.toString());
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
    province_id: number;
    description?: string;
  }
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("nom_serie", serieData.nom_serie);
    formData.append("province_id", serieData.province_id.toString());
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
 * Recherche des séries dans la base de données avec pagination
 */
export const searchSeries = async (
  searchTerm: string,
  page: number = 1,
  limit: number = 5
): Promise<PaginationResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/plaques/rechercher_series.php`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          search: searchTerm,
          page: page,
          limit: limit,
        }),
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
      data: {
        series: data.data?.series || [],
        pagination: data.data?.pagination || {
          total: 0,
          page: 1,
          limit: 5,
          totalPages: 1,
        },
      },
    };
  } catch (error) {
    console.error("Search series error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des séries",
    };
  }
};

/**
 * Génère un rapport des séries
 */
export const genererRapportSeries = async (params: {
  date_debut: string;
  date_fin: string;
  province_id?: number;
}): Promise<ApiResponse> => {
  try {
    const queryParams = new URLSearchParams({
      date_debut: params.date_debut,
      date_fin: params.date_fin,
      ...(params.province_id && { province_id: params.province_id.toString() }),
    });

    const response = await fetch(
      `${API_BASE_URL}/plaques/generer_rapport_series.php?${queryParams}`,
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
        message: data.message || "Échec de la génération du rapport",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Generate report error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la génération du rapport",
    };
  }
};
