'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Service pour la gestion des plaques - Interface avec l'API backend avec Cache Components Next.js 16
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

// Tags de cache pour invalidation ciblée
const CACHE_TAGS = {
  SERIES_UTILISATEUR: (utilisateurId: number) => `series-utilisateur-${utilisateurId}`,
  PROVINCES_LIST: 'provinces-site-list',
  SERIE_ITEMS_UTILISATEUR: (serieId: number, utilisateurId: number) => 
    `serie-items-${serieId}-utilisateur-${utilisateurId}`,
  SERIES_SEARCH_UTILISATEUR: (utilisateurId: number, searchTerm: string) => 
    `series-search-utilisateur-${utilisateurId}-${searchTerm}`,
  SERIE_DETAILS_UTILISATEUR: (serieId: number, utilisateurId: number) => 
    `serie-details-${serieId}-utilisateur-${utilisateurId}`,
};

/**
 * Invalide le cache après une mutation
 */
async function invalidateSeriesUtilisateurCache(utilisateurId: number, serieId?: number) {
  'use server';
  
  // Pattern général pour invalider toutes les séries de cet utilisateur
  revalidateTag(CACHE_TAGS.SERIES_UTILISATEUR(utilisateurId), "max");
  revalidateTag(CACHE_TAGS.SERIES_SEARCH_UTILISATEUR(utilisateurId, ''), "max");
  
  if (serieId) {
    revalidateTag(CACHE_TAGS.SERIE_ITEMS_UTILISATEUR(serieId, utilisateurId), "max");
    revalidateTag(CACHE_TAGS.SERIE_DETAILS_UTILISATEUR(serieId, utilisateurId), "max");
  }
}

// Nettoyer les données
export async function cleanSerieData(data: any): Promise<Serie> {
  return {
    id: data.id || 0,
    nom_serie: data.nom_serie || "",
    description: data.description || null,
    actif: Boolean(data.actif),
    total_items: data.total_items || 0,
    items_disponibles: data.items_disponibles || 0,
    items_utilises: data.items_utilises || 0,
    date_creation: data.date_creation || "",
    date_creation_formatted: data.date_creation_formatted || "",
    province_id: data.province_id || 0,
    province_nom: data.province_nom || "",
    province_code: data.province_code || "",
    debut_numeros: data.debut_numeros || 0,
    fin_numeros: data.fin_numeros || 0,
  };
}

export async function cleanSerieItemData(data: any): Promise<SerieItem> {
  return {
    id: data.id || 0,
    serie_id: data.serie_id || 0,
    value: data.value || 0,
    statut: data.statut || "0",
    nom_serie: data.nom_serie || "",
    province_nom: data.province_nom || "",
    date_creation: data.date_creation || "",
  };
}

export async function cleanProvinceData(data: any): Promise<Province> {
  return {
    id: data.id || 0,
    nom: data.nom || "",
    code: data.code || "",
    actif: Boolean(data.actif),
  };
}

/**
 * 💾 Récupère la liste des séries selon la province de l'utilisateur (AVEC CACHE - 2 heures)
 */
export const getSeries = async (utilisateurId: number): Promise<ApiResponse> => {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.SERIES_UTILISATEUR(utilisateurId));

  try {
    const formData = new FormData();
    formData.append("utilisateur_id", utilisateurId.toString());

    const response = await fetch(`${API_BASE_URL}/plaques/lister__series.php`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des séries",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanSerieData(item)))
      : [];

    return {
      status: "success",
      data: cleanedData,
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
 * 💾 Récupère la liste des provinces actives (AVEC CACHE - 2 heures)
 */
export const getProvinces = async (): Promise<ApiResponse> => {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.PROVINCES_LIST);

  try {
    const response = await fetch(`${API_BASE_URL}/plaques/lister_provinces.php`, {
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
        message: data.message || "Échec de la récupération des provinces",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanProvinceData(item)))
      : [];

    return {
      status: "success",
      data: cleanedData,
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
 * 💾 Récupère les items d'une série spécifique selon la province de l'utilisateur (AVEC CACHE - 2 heures)
 */
export const getSerieItems = async (serieId: number, utilisateurId: number): Promise<ApiResponse> => {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.SERIE_ITEMS_UTILISATEUR(serieId, utilisateurId));

  try {
    const formData = new FormData();
    formData.append("serie_id", serieId.toString());
    formData.append("utilisateur_id", utilisateurId.toString());

    const response = await fetch(
      `${API_BASE_URL}/plaques/lister_items__serie.php`,
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
        message: data.message || "Échec de la récupération des items",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanSerieItemData(item)))
      : [];

    return {
      status: "success",
      data: cleanedData,
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
 * 🔄 Ajoute une nouvelle série (INVALIDE LE CACHE)
 */
export const addSerie = async (serieData: {
  nom_serie: string;
  province_id: number;
  debut_numeros: number;
  fin_numeros: number;
  description?: string;
}, utilisateurId: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("nom_serie", serieData.nom_serie);
    formData.append("province_id", serieData.province_id.toString());
    formData.append("debut_numeros", serieData.debut_numeros.toString());
    formData.append("fin_numeros", serieData.fin_numeros.toString());
    formData.append("utilisateur_id", utilisateurId.toString());
    if (serieData.description) {
      formData.append("description", serieData.description);
    }

    const response = await fetch(`${API_BASE_URL}/plaques/creer__serie.php`, {
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

    // ⚡ Invalider le cache des séries de cet utilisateur
    await invalidateSeriesUtilisateurCache(utilisateurId);

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
 * 🔄 Modifie une série existante (INVALIDE LE CACHE)
 */
export const updateSerie = async (
  id: number,
  serieData: {
    nom_serie: string;
    province_id: number;
    description?: string;
  },
  utilisateurId: number
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("nom_serie", serieData.nom_serie);
    formData.append("province_id", serieData.province_id.toString());
    formData.append("utilisateur_id", utilisateurId.toString());
    if (serieData.description) {
      formData.append("description", serieData.description);
    }

    const response = await fetch(`${API_BASE_URL}/plaques/modifier__serie.php`, {
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

    // ⚡ Invalider le cache de cette série spécifique
    await invalidateSeriesUtilisateurCache(utilisateurId, id);

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
 * 🔄 Supprime une série (INVALIDE LE CACHE)
 */
export const deleteSerie = async (id: number, utilisateurId: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("utilisateur_id", utilisateurId.toString());

    const response = await fetch(
      `${API_BASE_URL}/plaques/supprimer__serie.php`,
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

    // ⚡ Invalider le cache de cette série spécifique
    await invalidateSeriesUtilisateurCache(utilisateurId, id);

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
 * 🔄 Change le statut d'une série (INVALIDE LE CACHE)
 */
export const toggleSerieStatus = async (
  id: number,
  actif: boolean,
  utilisateurId: number
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("actif", actif.toString());
    formData.append("utilisateur_id", utilisateurId.toString());

    const response = await fetch(
      `${API_BASE_URL}/plaques/changer_statut__serie.php`,
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

    // ⚡ Invalider le cache de cette série spécifique
    await invalidateSeriesUtilisateurCache(utilisateurId, id);

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
 * 💾 Recherche des séries par terme selon la province de l'utilisateur (AVEC CACHE - 2 heures)
 */
export const searchSeries = async (
  searchTerm: string,
  utilisateurId: number
): Promise<ApiResponse> => {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.SERIES_SEARCH_UTILISATEUR(utilisateurId, searchTerm));

  try {
    const formData = new FormData();
    formData.append("search", searchTerm);
    formData.append("utilisateur_id", utilisateurId.toString());

    const response = await fetch(
      `${API_BASE_URL}/plaques/rechercher__series.php`,
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
        message: data.message || "Échec de la recherche des séries",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanSerieData(item)))
      : [];

    return {
      status: "success",
      data: cleanedData,
    };
  } catch (error) {
    console.error("Search series error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des séries",
    };
  }
};