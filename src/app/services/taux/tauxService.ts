'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Server Actions pour la gestion des taux avec Cache Components Next.js 16
 * Nouvelle version avec support multi-province/impôt
 */

// Interface pour les données d'un taux
export interface Taux {
  id: number;
  nom: string;
  valeur: number;
  description: string;
  est_par_defaut: boolean;
  date_creation: string;
  attributions?: AttributionTaux[];
  taux_defaut?: TauxDefaut[];
}

// Interface pour les attributions taux-province-impôt
export interface AttributionTaux {
  id: number;
  taux_id: number;
  province_id: number | null;
  impot_id: number;
  actif: boolean;
  date_creation: string;
  date_modification: string;
  province_nom?: string;
  impot_nom?: string;
}

// Interface pour les taux par défaut
export interface TauxDefaut {
  id: number;
  taux_id: number;
  impot_id: number;
  date_creation: string;
  impot_nom?: string;
}

// Interface pour les provinces
export interface Province {
  id: number;
  nom: string;
  code: string;
}

// Interface pour les impôts
export interface Impot {
  id: number;
  nom: string;
  description: string;
}

// Interface pour les réponses de l'API
export interface ApiResponse {
  status: 'success' | 'error';
  message?: string;
  data?: any;
}

// URL de base de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls';

// Tags de cache pour invalidation ciblée
const CACHE_TAGS = {
  TAUX_LIST: 'taux-list',
  TAUX_ACTIFS: 'taux-actifs',
  TAUX_DETAILS: (id: number) => `taux-${id}`,
  TAUX_SEARCH: 'taux-search',
  TAUX_PAGINES: (page: number, search?: string) => `taux-page-${page}-${search || ''}`,
  TAUX_ACTIF: (provinceId: number | null, impotId: number) => `taux-actif-${provinceId}-${impotId}`,
  IMPOTS_LIST: 'impots-taux-list',
  PROVINCES_LIST: 'provinces-taux-list',
  ATTRIBUTIONS_TAUX: (tauxId: number) => `attributions-taux-${tauxId}`,
};

/**
 * Invalide le cache après une mutation
 */
async function invalidateTauxCache(tauxId?: number) {
  'use server';
  
  revalidateTag(CACHE_TAGS.TAUX_LIST, "max");
  revalidateTag(CACHE_TAGS.TAUX_ACTIFS, "max");
  revalidateTag(CACHE_TAGS.TAUX_SEARCH, "max");
  
  if (tauxId) {
    revalidateTag(CACHE_TAGS.TAUX_DETAILS(tauxId), "max");
    revalidateTag(CACHE_TAGS.ATTRIBUTIONS_TAUX(tauxId), "max");
  }
  
  // Invalider tous les caches de taux actifs
  revalidateTag(CACHE_TAGS.TAUX_ACTIF(0, 0), "max"); // Pattern général
}

// Nettoyer les données
export async function cleanTauxData(data: any): Promise<Taux> {
  return {
    id: data.id || 0,
    nom: data.nom || "",
    valeur: data.valeur || 0,
    description: data.description || "",
    est_par_defaut: Boolean(data.est_par_defaut),
    date_creation: data.date_creation || "",
    attributions: data.attributions || [],
    taux_defaut: data.taux_defaut || [],
  };
}

export async function cleanAttributionData(data: any): Promise<AttributionTaux> {
  return {
    id: data.id || 0,
    taux_id: data.taux_id || 0,
    province_id: data.province_id || null,
    impot_id: data.impot_id || 0,
    actif: Boolean(data.actif),
    date_creation: data.date_creation || "",
    date_modification: data.date_modification || "",
    province_nom: data.province_nom || "",
    impot_nom: data.impot_nom || "",
  };
}

/**
 * 💾 Récupère la liste de tous les taux avec leurs attributions (AVEC CACHE - 2 heures)
 */
export async function getTaux(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.TAUX_LIST);

  try {
    const response = await fetch(`${API_BASE_URL}/taux/lister_taux.php`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la récupération des taux',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanTauxData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get taux error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des taux',
    };
  }
}

/**
 * 💾 Récupère la liste des taux actifs (AVEC CACHE - 2 heures)
 */
export async function getTauxActifs(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.TAUX_ACTIFS);

  try {
    const response = await fetch(`${API_BASE_URL}/taux/lister_taux_actifs.php`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la récupération des taux actifs',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanTauxData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get taux actifs error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des taux actifs',
    };
  }
}

/**
 * 🔄 Ajoute un nouveau taux (INVALIDE LE CACHE)
 */
export async function addTaux(tauxData: {
  nom: string;
  valeur: number;
  description: string;
  est_par_defaut?: boolean;
}): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('nom', tauxData.nom);
    formData.append('valeur', tauxData.valeur.toString());
    formData.append('description', tauxData.description);
    if (tauxData.est_par_defaut !== undefined) {
      formData.append('est_par_defaut', tauxData.est_par_defaut.toString());
    }

    const response = await fetch(`${API_BASE_URL}/taux/creer_taux.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout du taux',
      };
    }

    // ⚡ Invalider le cache
    await invalidateTauxCache();

    return data;
  } catch (error) {
    console.error('Add taux error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout du taux',
    };
  }
}

/**
 * 🔄 Modifie un taux existant (INVALIDE LE CACHE)
 */
export async function updateTaux(
  id: number,
  tauxData: {
    nom: string;
    valeur: number;
    description: string;
    est_par_defaut?: boolean;
  }
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('nom', tauxData.nom);
    formData.append('valeur', tauxData.valeur.toString());
    formData.append('description', tauxData.description);
    if (tauxData.est_par_defaut !== undefined) {
      formData.append('est_par_defaut', tauxData.est_par_defaut.toString());
    }

    const response = await fetch(`${API_BASE_URL}/taux/modifier_taux.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification du taux',
      };
    }

    // ⚡ Invalider le cache
    await invalidateTauxCache(id);

    return data;
  } catch (error) {
    console.error('Update taux error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification du taux',
    };
  }
}

/**
 * 🔄 Supprime un taux (INVALIDE LE CACHE)
 */
export async function deleteTaux(id: number): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/taux/supprimer_taux.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression du taux',
      };
    }

    // ⚡ Invalider le cache
    await invalidateTauxCache(id);

    return data;
  } catch (error) {
    console.error('Delete taux error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression du taux',
    };
  }
}

/**
 * 🔄 Attribue un taux à une province et un impôt (INVALIDE LE CACHE)
 */
export async function attribuerTaux(attributionData: {
  taux_id: number;
  province_id: number | null;
  impot_id: number;
  actif?: boolean;
}): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('taux_id', attributionData.taux_id.toString());
    formData.append('impot_id', attributionData.impot_id.toString());
    
    if (attributionData.province_id !== null) {
      formData.append('province_id', attributionData.province_id.toString());
    }
    
    if (attributionData.actif !== undefined) {
      formData.append('actif', attributionData.actif.toString());
    }

    const response = await fetch(`${API_BASE_URL}/taux/attribuer_taux.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'attribution du taux',
      };
    }

    // ⚡ Invalider le cache
    await invalidateTauxCache(attributionData.taux_id);

    return data;
  } catch (error) {
    console.error('Attribuer taux error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'attribution du taux',
    };
  }
}

/**
 * 🔄 Définit un taux comme taux par défaut pour un impôt (INVALIDE LE CACHE)
 */
export async function definirTauxDefaut(defautData: {
  taux_id: number;
  impot_id: number;
}): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('taux_id', defautData.taux_id.toString());
    formData.append('impot_id', defautData.impot_id.toString());

    const response = await fetch(`${API_BASE_URL}/taux/definir_taux_defaut.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la définition du taux par défaut',
      };
    }

    // ⚡ Invalider le cache
    await invalidateTauxCache(defautData.taux_id);

    return data;
  } catch (error) {
    console.error('Définir taux défaut error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la définition du taux par défaut',
    };
  }
}

/**
 * 💾 Récupère le taux actif pour une province et un impôt (AVEC CACHE - 2 heures)
 */
export async function getTauxActif(params: {
  province_id?: number | null;
  impot_id: number;
}): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  const provinceId = params.province_id !== undefined ? params.province_id : null;
  cacheTag(CACHE_TAGS.TAUX_ACTIF(provinceId, params.impot_id));

  try {
    const url = new URL(`${API_BASE_URL}/taux/get_taux_actif.php`);
    url.searchParams.append('impot_id', params.impot_id.toString());
    
    if (params.province_id !== undefined && params.province_id !== null) {
      url.searchParams.append('province_id', params.province_id.toString());
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la récupération du taux actif',
      };
    }

    return {
      status: 'success',
      data: await cleanTauxData(data.data),
    };
  } catch (error) {
    console.error('Get taux actif error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération du taux actif',
    };
  }
}

/**
 * 💾 Récupère la liste des impôts (AVEC CACHE - 2 heures)
 */
export async function getImpots(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.IMPOTS_LIST);

  try {
    const response = await fetch(`${API_BASE_URL}/taux/get_impots.php`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la récupération des impôts',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get impots error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des impôts',
    };
  }
}

/**
 * 💾 Récupère la liste des provinces (AVEC CACHE - 2 heures)
 */
export async function getProvinces(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.PROVINCES_LIST);

  try {
    const response = await fetch(`${API_BASE_URL}/taux/get_provinces.php`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la récupération des provinces',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get provinces error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des provinces',
    };
  }
}

/**
 * 🔄 Retire l'attribution d'un taux (INVALIDE LE CACHE)
 */
export async function retirerAttributionTaux(retraitData: {
  taux_id: number;
  province_id: number | null;
  impot_id: number;
}): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('taux_id', retraitData.taux_id.toString());
    formData.append('impot_id', retraitData.impot_id.toString());
    
    if (retraitData.province_id !== null) {
      formData.append('province_id', retraitData.province_id.toString());
    }

    const response = await fetch(`${API_BASE_URL}/taux/retirer_attribution.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du retrait de l\'attribution',
      };
    }

    // ⚡ Invalider le cache
    await invalidateTauxCache(retraitData.taux_id);

    return data;
  } catch (error) {
    console.error('Retirer attribution error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du retrait de l\'attribution',
    };
  }
}

/**
 * 💾 Récupère un taux par son ID (AVEC CACHE - 2 heures)
 */
export async function getTauxById(id: number): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.TAUX_DETAILS(id));

  try {
    const response = await fetch(
      `${API_BASE_URL}/taux/get_taux.php?id=${id}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la récupération du taux',
      };
    }

    return {
      status: 'success',
      data: await cleanTauxData(data.data),
    };
  } catch (error) {
    console.error('Get taux by ID error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération du taux',
    };
  }
}

/**
 * 🌊 Vérifie si un taux existe déjà par son nom (PAS DE CACHE)
 */
export async function checkTauxByNom(nom: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/taux/verifier_taux.php?nom=${encodeURIComponent(nom)}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la vérification du taux',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Check taux by nom error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification du taux',
    };
  }
}

/**
 * 💾 Recherche des taux par terme (AVEC CACHE - 2 heures)
 */
export async function searchTaux(searchTerm: string): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.TAUX_SEARCH, `search-${searchTerm}`);

  try {
    const response = await fetch(
      `${API_BASE_URL}/taux/rechercher_taux.php?search=${encodeURIComponent(searchTerm)}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la recherche des taux',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanTauxData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Search taux error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des taux',
    };
  }
}

/**
 * 💾 Récupère les taux avec pagination (AVEC CACHE - 2 heures)
 */
export async function getTauxPaginees(page: number = 1, limit: number = 10, searchTerm: string = ''): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.TAUX_PAGINES(page, searchTerm));

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }

    const response = await fetch(
      `${API_BASE_URL}/taux/lister_taux_paginees.php?${params.toString()}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la récupération des taux paginés',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanTauxData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get taux paginees error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des taux paginés',
    };
  }
}