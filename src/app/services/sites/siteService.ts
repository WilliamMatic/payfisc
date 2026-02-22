'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Server Actions pour la gestion des sites avec Cache Components Next.js 16
 */

// Interface pour les données d'un site
export interface Site {
  id: number;
  nom: string;
  code: string;
  description: string;
  formule: string;
  province_id: number;
  province_nom: string;
  actif: boolean;
  date_creation: string;
}

// Interface pour les données d'une province
export interface Province {
  id: number;
  nom: string;
  code: string;
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
    sites: Site[];
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
  SITES_LIST: 'sites-list',
  SITES_ACTIFS: 'sites-actifs',
  SITE_DETAILS: (id: number) => `site-${id}`,
  SITES_SEARCH: 'sites-search',
  PROVINCES_LIST: 'provinces-list-sites',
};

/**
 * Invalide le cache après une mutation avec stale-while-revalidate
 */
async function invalidateSitesCache(siteId?: number) {
  'use server';
  
  revalidateTag(CACHE_TAGS.SITES_LIST, "max");
  revalidateTag(CACHE_TAGS.SITES_ACTIFS, "max");
  revalidateTag(CACHE_TAGS.SITES_SEARCH, "max");
  
  if (siteId) {
    revalidateTag(CACHE_TAGS.SITE_DETAILS(siteId), "max");
  }
}

// Nettoyer les données
export async function cleanSiteData(data: any): Promise<Site> {
  return {
    id: data.id || 0,
    nom: data.nom || "",
    code: data.code || "",
    description: data.description || "",
    formule: data.formule || "",
    province_id: data.province_id || 0,
    province_nom: data.province_nom || "",
    actif: Boolean(data.actif),
    date_creation: data.date_creation || "",
  };
}

export async function cleanProvinceData(data: any): Promise<Province> {
  return {
    id: data.id || 0,
    nom: data.nom || "",
    code: data.code || "",
  };
}

/**
 * 💾 Récupère la liste de tous les sites (AVEC CACHE - 2 heures)
 */
export async function getSites(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.SITES_LIST);

  try {
    const response = await fetch(`${API_BASE_URL}/sites/lister_sites.php`, {
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
        message: data.message || 'Échec de la récupération des sites',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanSiteData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get sites error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des sites',
    };
  }
}

/**
 * 💾 Récupère la liste des sites actifs (AVEC CACHE - 2 heures)
 */
export async function getSitesActifs(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.SITES_ACTIFS);

  try {
    const response = await fetch(`${API_BASE_URL}/sites/lister_sites_actifs.php`, {
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
        message: data.message || 'Échec de la récupération des sites actifs',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanSiteData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get sites actifs error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des sites actifs',
    };
  }
}

/**
 * 💾 Récupère la liste de toutes les provinces actives (PAS DE CACHE)
 */
export async function getProvinces(): Promise<ApiResponse> {

  try {
    const response = await fetch(`${API_BASE_URL}/sites/lister_provinces.php`, {
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
 * 🔄 Ajoute un nouveau site (INVALIDE LE CACHE)
 */
export async function addSite(siteData: {
  nom: string;
  code: string;
  description: string;
  formule: string;
  province_id: number;
}): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('nom', siteData.nom);
    formData.append('code', siteData.code);
    formData.append('description', siteData.description);
    formData.append('formule', siteData.formule);
    formData.append('province_id', siteData.province_id.toString());

    const response = await fetch(`${API_BASE_URL}/sites/creer_site.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout du site',
      };
    }

    await invalidateSitesCache();

    return data;
  } catch (error) {
    console.error('Add site error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout du site',
    };
  }
}

/**
 * 🔄 Modifie un site existant (INVALIDE LE CACHE)
 */
export async function updateSite(
  id: number,
  siteData: {
    nom: string;
    code: string;
    description: string;
    formule: string;
    province_id: number;
  }
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('nom', siteData.nom);
    formData.append('code', siteData.code);
    formData.append('description', siteData.description);
    formData.append('formule', siteData.formule);
    formData.append('province_id', siteData.province_id.toString());

    const response = await fetch(`${API_BASE_URL}/sites/modifier_site.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification du site',
      };
    }

    await invalidateSitesCache(id);

    return data;
  } catch (error) {
    console.error('Update site error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification du site',
    };
  }
}

/**
 * 🔄 Supprime un site (INVALIDE LE CACHE)
 */
export async function deleteSite(id: number): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/sites/supprimer_site.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression du site',
      };
    }

    await invalidateSitesCache(id);

    return data;
  } catch (error) {
    console.error('Delete site error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression du site',
    };
  }
}

/**
 * 🔄 Change le statut d'un site (actif/inactif) (INVALIDE LE CACHE)
 */
export async function toggleSiteStatus(
  id: number,
  actif: boolean
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/sites/changer_statut_site.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut du site',
      };
    }

    await invalidateSitesCache(id);

    return data;
  } catch (error) {
    console.error('Toggle site status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut du site',
    };
  }
}

/**
 * 💾 Recherche des sites par terme (AVEC CACHE - 2 heures)
 */
export async function searchSites(searchTerm: string): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.SITES_SEARCH, `search-${searchTerm}`);

  try {
    const response = await fetch(
      `${API_BASE_URL}/sites/rechercher_sites.php?search=${encodeURIComponent(searchTerm)}`,
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
        message: data.message || 'Échec de la recherche des sites',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanSiteData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Search sites error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des sites',
    };
  }
}

/**
 * 🌊 Vérifie si un site existe déjà par son code (PAS DE CACHE)
 */
export async function checkSiteByCode(code: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sites/verifier_site.php?code=${encodeURIComponent(code)}`,
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
        message: data.message || 'Échec de la vérification du site',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Check site by code error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification du site',
    };
  }
}

/**
 * 🌊 Vérifie si un site existe déjà par son nom (PAS DE CACHE)
 */
export async function checkSiteByNom(nom: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sites/verifier_site_nom.php?nom=${encodeURIComponent(nom)}`,
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
        message: data.message || 'Échec de la vérification du site par nom',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Check site by nom error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification du site par nom',
    };
  }
}

/**
 * 💾 Récupère un site par son ID (AVEC CACHE - 2 heures)
 */
export async function getSiteById(id: number): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.SITE_DETAILS(id));

  try {
    const response = await fetch(
      `${API_BASE_URL}/sites/get_site.php?id=${id}`,
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
        message: data.message || 'Échec de la récupération du site',
      };
    }

    return {
      status: 'success',
      data: await cleanSiteData(data.data),
    };
  } catch (error) {
    console.error('Get site by ID error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération du site',
    };
  }
}

/**
 * 💾 Recherche des sites par province (AVEC CACHE - 2 heures)
 */
export async function searchSitesByProvince(provinceId: number, searchTerm?: string): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.SITES_SEARCH, `province-${provinceId}-search-${searchTerm || ''}`);

  try {
    const params = new URLSearchParams({
      province_id: provinceId.toString(),
    });
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }

    const response = await fetch(
      `${API_BASE_URL}/sites/rechercher_sites_par_province.php?${params.toString()}`,
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
        message: data.message || 'Échec de la recherche des sites par province',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanSiteData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Search sites by province error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des sites par province',
    };
  }
}

/**
 * 💾 Récupère les sites avec pagination (AVEC CACHE - 2 heures)
 */
export async function getSitesPaginees(page: number = 1, limit: number = 10, searchTerm: string = ''): Promise<PaginationResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.SITES_LIST, `page-${page}-search-${searchTerm}`);

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }

    const response = await fetch(
      `${API_BASE_URL}/sites/lister_sites_paginees.php?${params.toString()}`,
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
        message: data.message || 'Échec de la récupération des sites paginés',
      };
    }

    const cleanedData = Array.isArray(data.data?.sites)
      ? await Promise.all(data.data.sites.map(async (item: any) => await cleanSiteData(item)))
      : [];

    return {
      status: 'success',
      data: {
        sites: cleanedData,
        pagination: data.data?.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    };
  } catch (error) {
    console.error('Get sites paginees error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des sites paginés',
    };
  }
}