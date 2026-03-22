"use server";

import { cacheLife, cacheTag } from "next/cache";
import { revalidateTag } from "next/cache";

/**
 * Server Actions pour la gestion des plaques avec Cache Components Next.js 16
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

// Tags de cache pour invalidation ciblée
const CACHE_TAGS = {
  SERIES_LIST: "series-list",
  SERIES_ACTIVES: "series-actives",
  SERIE_DETAILS: (id: number) => `serie-${id}`,
  SERIES_SEARCH: "series-search",
  SERIES_PAGINES: (page: number, utilisateurId?: number) =>
    `series-page-${page}-user-${utilisateurId || "all"}`,
  SERIES_SEARCH_PAGINES: (searchTerm: string, page: number) =>
    `series-search-${searchTerm}-page-${page}`,
  SERIES_PROVINCE: (provinceId: number, page: number) =>
    `series-province-${provinceId}-page-${page}`,
  PROVINCES_LIST: "provinces-list",
  SERIE_ITEMS: (serieId: number) => `serie-items-${serieId}`,
  RAPPORT_SERIES: (dateDebut: string, dateFin: string, provinceId?: number) =>
    `rapport-series-${dateDebut}-${dateFin}-${provinceId || "all"}`,
};

/**
 * Invalide le cache après une mutation
 */
async function invalidateSeriesCache(serieId?: number) {
  "use server";

  revalidateTag(CACHE_TAGS.SERIES_LIST, "max");
  revalidateTag(CACHE_TAGS.SERIES_ACTIVES, "max");
  revalidateTag(CACHE_TAGS.SERIES_SEARCH, "max");

  if (serieId) {
    revalidateTag(CACHE_TAGS.SERIE_DETAILS(serieId), "max");
    revalidateTag(CACHE_TAGS.SERIE_ITEMS(serieId), "max");
  }

  // Invalider tous les rapports de séries
  revalidateTag(CACHE_TAGS.RAPPORT_SERIES("", "", 0), "max"); // Pattern général
}

// Nettoyer les données
function cleanSerieData(data: any): Serie {
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

function cleanSerieItemData(data: any): SerieItem {
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

function cleanProvinceData(data: any): Province {
  return {
    id: data.id || 0,
    nom: data.nom || "",
    code: data.code || "",
    actif: Boolean(data.actif),
  };
}

/**
 * 💾 Récupère la liste des séries avec pagination (5 derniers par défaut) (AVEC CACHE - 2 jours)
 */
export async function getSeries(
  page: number = 1,
  limit: number = 5,
  utilisateurId?: number,
): Promise<PaginationResponse> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.SERIES_LIST);

  try {
    let url = `${API_BASE_URL}/plaques/lister_series.php?page=${page}&limit=${limit}`;

    // Ajouter l'ID utilisateur si fourni
    if (utilisateurId !== undefined) {
      url += `&utilisateur_id=${utilisateurId}`;
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
        message: data.message || "Échec de la récupération des séries",
      };
    }

    const cleanedData = Array.isArray(data.data?.series)
      ? data.data.series.map((item: any) => cleanSerieData(item))
      : [];

    return {
      status: "success",
      data: {
        series: cleanedData,
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
}

/**
 * 💾 Récupère la liste des provinces actives (AVEC CACHE - 2 jours)
 */
export async function getProvinces(): Promise<ApiResponse> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.PROVINCES_LIST);

  try {
    const response = await fetch(
      `${API_BASE_URL}/plaques/lister_provinces.php`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des provinces",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? data.data.map((item: any) => cleanProvinceData(item))
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
}

/**
 * 💾 Récupère les items d'une série spécifique (PAS DE CACHE)
 */
export async function getSerieItems(serieId: number): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/plaques/lister_items_serie.php?serie_id=${serieId}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des items",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? data.data.map((item: any) => cleanSerieItemData(item))
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
}

/**
 * 🔄 Ajoute une nouvelle série (INVALIDE LE CACHE)
 */
export async function addSerie(serieData: {
  nom_serie: string;
  province_id: number;
  debut_numeros: number;
  fin_numeros: number;
  description?: string;
}): Promise<ApiResponse> {
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

    // ⚡ Invalider le cache
    await invalidateSeriesCache();

    return data;
  } catch (error) {
    console.error("Add serie error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'ajout de la série",
    };
  }
}

/**
 * 🔄 Modifie une série existante (INVALIDE LE CACHE)
 */
export async function updateSerie(
  id: number,
  serieData: {
    nom_serie: string;
    province_id: number;
    description?: string;
  },
): Promise<ApiResponse> {
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

    // ⚡ Invalider le cache
    await invalidateSeriesCache();

    return data;
  } catch (error) {
    console.error("Update serie error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la modification de la série",
    };
  }
}

/**
 * 🔄 Supprime une série (INVALIDE LE CACHE)
 */
export async function deleteSerie(id: number): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());

    const response = await fetch(
      `${API_BASE_URL}/plaques/supprimer_serie.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la suppression de la série",
      };
    }

    // ⚡ Invalider le cache
    await invalidateSeriesCache();

    return data;
  } catch (error) {
    console.error("Delete serie error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la suppression de la série",
    };
  }
}

/**
 * 🔄 Change le statut d'une série (INVALIDE LE CACHE)
 */
export async function toggleSerieStatus(
  id: number,
  actif: boolean,
): Promise<ApiResponse> {
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
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec du changement de statut de la série",
      };
    }

    // ⚡ Invalider le cache
    await invalidateSeriesCache();

    return data;
  } catch (error) {
    console.error("Toggle serie status error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors du changement de statut de la série",
    };
  }
}

/**
 * 💾 Recherche des séries dans la base de données avec pagination (PAS DE CACHE)
 */
export async function searchSeries(
  searchTerm: string,
  page: number = 1,
  limit: number = 5,
  utilisateurId?: number,
): Promise<PaginationResponse> {
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
          utilisateurId: utilisateurId,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la recherche des séries",
      };
    }

    const cleanedData = Array.isArray(data.data?.series)
      ? data.data.series.map((item: any) => cleanSerieData(item))
      : [];

    return {
      status: "success",
      data: {
        series: cleanedData,
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
}

/**
 * 💾 Génère un rapport des séries (PAS DE CACHE)
 */
export async function genererRapportSeries(params: {
  date_debut: string;
  date_fin: string;
  province_id?: number;
}): Promise<ApiResponse> {
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
      },
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
}

/**
 * 💾 Récupère la liste des séries actives (PAS DE CACHE)
 */
export async function getSeriesActives(
  page: number = 1,
  limit: number = 5,
  utilisateurId?: number,
): Promise<PaginationResponse> {
  try {
    let url = `${API_BASE_URL}/plaques/lister_series_actives.php?page=${page}&limit=${limit}`;
    if (utilisateurId !== undefined) {
      url += `&utilisateur_id=${utilisateurId}`;
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
        message: data.message || "Échec de la récupération des séries actives",
      };
    }

    const cleanedData = Array.isArray(data.data?.series)
      ? data.data.series.map((item: any) => cleanSerieData(item))
      : [];

    return {
      status: "success",
      data: {
        series: cleanedData,
        pagination: data.data?.pagination || {
          total: 0,
          page: 1,
          limit: 5,
          totalPages: 1,
        },
      },
    };
  } catch (error) {
    console.error("Get series actives error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des séries actives",
    };
  }
}

/**
 * 🌊 Vérifie si une série existe déjà par son nom (PAS DE CACHE)
 */
export async function checkSerieByNom(nomSerie: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/plaques/verifier_serie.php?nom_serie=${encodeURIComponent(nomSerie)}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la vérification de la série",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Check serie by nom error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification de la série",
    };
  }
}

/**
 * 💾 Récupère une série par son ID (PAS DE CACHE)
 */
export async function getSerieById(id: number): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/plaques/get_serie.php?id=${id}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la récupération de la série",
      };
    }

    return {
      status: "success",
      data: cleanSerieData(data.data),
    };
  } catch (error) {
    console.error("Get serie by ID error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération de la série",
    };
  }
}

/**
 * 💾 Recherche des séries par province (PAS DE CACHE)
 */
export async function searchSeriesByProvince(
  provinceId: number,
  page: number = 1,
  limit: number = 5,
  searchTerm?: string,
): Promise<PaginationResponse> {
  try {
    const body: any = {
      province_id: provinceId,
      page: page,
      limit: limit,
    };

    if (searchTerm) {
      body.search = searchTerm;
    }

    const response = await fetch(
      `${API_BASE_URL}/plaques/rechercher_series_par_province.php`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message:
          data.message || "Échec de la recherche des séries par province",
      };
    }

    const cleanedData = Array.isArray(data.data?.series)
      ? data.data.series.map((item: any) => cleanSerieData(item))
      : [];

    return {
      status: "success",
      data: {
        series: cleanedData,
        pagination: data.data?.pagination || {
          total: 0,
          page: 1,
          limit: 5,
          totalPages: 1,
        },
      },
    };
  } catch (error) {
    console.error("Search series by province error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des séries par province",
    };
  }
}

/**
 * 🔄 Revalide manuellement le cache des séries et le rafraîchit
 * Utile pour forcer une mise à jour du cache après des opérations complexes
 */
export async function refreshSeriesCache(
  page: number = 1,
  limit: number = 5,
  utilisateurId?: number,
): Promise<PaginationResponse> {
  "use server";

  try {
    // Invalider d'abord le cache spécifique à cette page
    revalidateTag(CACHE_TAGS.SERIES_LIST, "max");
    revalidateTag(CACHE_TAGS.SERIES_PAGINES(page, utilisateurId), "max");

    // Re-fetch les données pour les remettre en cache
    const result = await getSeries(page, limit, utilisateurId);

    // Si la requête a réussi, on retourne les données fraîches
    if (result.status === "success") {
      console.log(`✅ Cache des séries revalidé pour la page ${page}`);
    }

    return result;
  } catch (error) {
    console.error("Refresh series cache error:", error);
    return {
      status: "error",
      message: "Erreur lors du rafraîchissement du cache des séries",
    };
  }
}

/**
 * 🔄 Revalide TOUS les caches de séries (toutes pages confondues)
 * Utile après une opération de masse qui affecte plusieurs pages
 */
export async function refreshAllSeriesCache(): Promise<void> {
  "use server";

  try {
    // Invalider tous les tags liés aux séries
    revalidateTag(CACHE_TAGS.SERIES_LIST, "max");
    revalidateTag(CACHE_TAGS.SERIES_ACTIVES, "max");
    revalidateTag(CACHE_TAGS.SERIES_SEARCH, "max");
    revalidateTag(CACHE_TAGS.SERIES_SEARCH_PAGINES("", 0), "max"); // Pattern général

    console.log("✅ Tous les caches des séries ont été invalidés");
  } catch (error) {
    console.error("Refresh all series cache error:", error);
  }
}
