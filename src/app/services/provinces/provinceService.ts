'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Server Actions pour la gestion des provinces avec Cache Components Next.js 16
 */

// Interface pour les données d'une province
export interface Province {
  id: number;
  nom: string;
  code: string;
  description: string;
  actif: boolean;
  date_creation: string;
}

// Interface pour les réponses de l'API
export interface ApiResponse {
  status: 'success' | 'error';
  message?: string;
  data?: any;
}

// Interface pour la pagination
export interface PaginationResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    provinces: Province[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

// URL de base de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls';

// Tags de cache pour invalidation ciblée
const CACHE_TAGS = {
  PROVINCES_LIST: 'provinces-list',
  PROVINCES_ACTIVES: 'provinces-actives',
  PROVINCE_DETAILS: (id: number) => `province-${id}`,
  PROVINCES_SEARCH: 'provinces-search',
};

/**
 * Invalide le cache après une mutation avec stale-while-revalidate
 */
async function invalidateProvincesCache(provinceId?: number) {
  'use server';
  
  revalidateTag(CACHE_TAGS.PROVINCES_LIST, "max");
  revalidateTag(CACHE_TAGS.PROVINCES_ACTIVES, "max");
  revalidateTag(CACHE_TAGS.PROVINCES_SEARCH, "max");
  
  if (provinceId) {
    revalidateTag(CACHE_TAGS.PROVINCE_DETAILS(provinceId), "max");
  }
}

// Nettoyer les données
export async function cleanProvinceData(data: any): Promise<Province> {
  return {
    id: data.id || 0,
    nom: data.nom || "",
    code: data.code || "",
    description: data.description || "",
    actif: Boolean(data.actif),
    date_creation: data.date_creation || "",
  };
}

/**
 * 💾 Récupère la liste de toutes les provinces (AVEC CACHE - 2 heures)
 */
export async function getProvinces(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.PROVINCES_LIST);

  try {
    const response = await fetch(`${API_BASE_URL}/provinces/lister_provinces.php`, {
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

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanProvinceData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
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
 * 💾 Récupère la liste des provinces actives (AVEC CACHE - 2 heures)
 */
export async function getProvincesActives(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.PROVINCES_ACTIVES);

  try {
    const response = await fetch(`${API_BASE_URL}/provinces/lister_provinces_actives.php`, {
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
        message: data.message || 'Échec de la récupération des provinces actives',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanProvinceData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get provinces actives error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des provinces actives',
    };
  }
}

/**
 * 🔄 Ajoute une nouvelle province (INVALIDE LE CACHE)
 */
export async function addProvince(provinceData: {
  nom: string;
  code: string;
  description: string;
}): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('nom', provinceData.nom);
    formData.append('code', provinceData.code);
    formData.append('description', provinceData.description);

    const response = await fetch(`${API_BASE_URL}/provinces/creer_province.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout de la province',
      };
    }

    await invalidateProvincesCache();

    return data;
  } catch (error) {
    console.error('Add province error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout de la province',
    };
  }
}

/**
 * 🔄 Modifie une province existante (INVALIDE LE CACHE)
 */
export async function updateProvince(
  id: number,
  provinceData: {
    nom: string;
    code: string;
    description: string;
  }
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('nom', provinceData.nom);
    formData.append('code', provinceData.code);
    formData.append('description', provinceData.description);

    const response = await fetch(`${API_BASE_URL}/provinces/modifier_province.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification de la province',
      };
    }

    await invalidateProvincesCache(id);

    return data;
  } catch (error) {
    console.error('Update province error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification de la province',
    };
  }
}

/**
 * 🔄 Supprime une province (INVALIDE LE CACHE)
 */
export async function deleteProvince(id: number): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/provinces/supprimer_province.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression de la province',
      };
    }

    await invalidateProvincesCache(id);

    return data;
  } catch (error) {
    console.error('Delete province error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression de la province',
    };
  }
}

/**
 * 🔄 Change le statut d'une province (actif/inactif) (INVALIDE LE CACHE)
 */
export async function toggleProvinceStatus(
  id: number,
  actif: boolean
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/provinces/changer_statut_province.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut de la province',
      };
    }

    await invalidateProvincesCache(id);

    return data;
  } catch (error) {
    console.error('Toggle province status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut de la province',
    };
  }
}

/**
 * 💾 Recherche des provinces par terme de recherche (AVEC CACHE - 2 heures)
 */
export async function searchProvinces(searchTerm: string): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.PROVINCES_SEARCH, `search-${searchTerm}`);

  try {
    const response = await fetch(
      `${API_BASE_URL}/provinces/rechercher_provinces.php?search=${encodeURIComponent(searchTerm)}`,
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
        message: data.message || 'Échec de la recherche des provinces',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanProvinceData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Search provinces error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des provinces',
    };
  }
}

/**
 * 🌊 Vérifie si une province existe déjà par son nom (PAS DE CACHE)
 */
export async function checkProvinceByNom(nom: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/provinces/verifier_province.php?nom=${encodeURIComponent(nom)}`,
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
        message: data.message || 'Échec de la vérification de la province',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Check province by nom error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification de la province',
    };
  }
}

/**
 * 🌊 Vérifie si une province existe déjà par son code (PAS DE CACHE)
 */
export async function checkProvinceByCode(code: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/provinces/verifier_province_code.php?code=${encodeURIComponent(code)}`,
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
        message: data.message || 'Échec de la vérification du code de province',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Check province by code error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification du code de province',
    };
  }
}

/**
 * 💾 Récupère une province par son ID (AVEC CACHE - 2 heures)
 */
export async function getProvinceById(id: number): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.PROVINCE_DETAILS(id));

  try {
    const response = await fetch(
      `${API_BASE_URL}/provinces/get_province.php?id=${id}`,
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
        message: data.message || 'Échec de la récupération de la province',
      };
    }

    return {
      status: 'success',
      data: await cleanProvinceData(data.data),
    };
  } catch (error) {
    console.error('Get province by ID error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération de la province',
    };
  }
}

/**
 * 💾 Recherche des provinces avec pagination (AVEC CACHE - 2 heures)
 */
export async function getProvincesPaginees(page: number = 1, limit: number = 10, searchTerm: string = ''): Promise<PaginationResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.PROVINCES_LIST, `page-${page}-search-${searchTerm}`);

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }

    const response = await fetch(
      `${API_BASE_URL}/provinces/lister_provinces_paginees.php?${params.toString()}`,
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
        message: data.message || 'Échec de la récupération des provinces paginées',
      };
    }

    const cleanedData = Array.isArray(data.data?.provinces)
      ? await Promise.all(data.data.provinces.map(async (item: any) => await cleanProvinceData(item)))
      : [];

    return {
      status: 'success',
      data: {
        provinces: cleanedData,
        pagination: data.data?.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    };
  } catch (error) {
    console.error('Get provinces paginees error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des provinces paginées',
    };
  }
}