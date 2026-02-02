'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Server Actions pour la gestion des usages d'engins avec Cache Components Next.js 16
 */

// Interface pour les données d'un usage
export interface UsageEngin {
  id: number;
  code: string;
  libelle: string;
  description?: string;
  actif: boolean;
  date_creation: string;
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
  USAGES_LIST: 'usages-list',
  USAGES_ACTIFS: 'usages-actifs',
  USAGE_DETAILS: (id: number) => `usage-${id}`,
  USAGES_SEARCH: 'usages-search',
};

/**
 * Invalide le cache après une mutation
 */
async function invalidateUsagesCache(usageId?: number) {
  'use server';
  
  revalidateTag(CACHE_TAGS.USAGES_LIST, "max");
  revalidateTag(CACHE_TAGS.USAGES_ACTIFS, "max");
  revalidateTag(CACHE_TAGS.USAGES_SEARCH, "max");
  
  if (usageId) {
    revalidateTag(CACHE_TAGS.USAGE_DETAILS(usageId), "max");
  }
}

// Nettoyer les données
export async function cleanUsageData(data: any): Promise<UsageEngin> {
  return {
    id: data.id || 0,
    code: data.code || "",
    libelle: data.libelle || "",
    description: data.description || "",
    actif: Boolean(data.actif),
    date_creation: data.date_creation || "",
  };
}

/**
 * 💾 Récupère la liste de tous les usages (AVEC CACHE)
 */
export async function getUsages(): Promise<ApiResponse> {
  'use cache';
  cacheLife('weeks'); // ✅ Changé de 'weeks' à 'hours'
  cacheTag(CACHE_TAGS.USAGES_LIST);
  
  try {
    const response = await fetch(`${API_BASE_URL}/usages/lister_usages.php`, { 
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
        message: data.message || 'Échec de la récupération des usages',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanUsageData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get usages error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des usages',
    };
  }
}

/**
 * 💾 Récupère la liste des usages actifs (AVEC CACHE - 2 heures)
 */
export async function getUsagesActifs(): Promise<ApiResponse> {
  'use cache';
  cacheLife('weeks');
  cacheTag(CACHE_TAGS.USAGES_ACTIFS);

  try {
    const response = await fetch(`${API_BASE_URL}/usages/lister_usages_actifs.php`, {
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
        message: data.message || 'Échec de la récupération des usages actifs',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanUsageData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get usages actifs error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des usages actifs',
    };
  }
}

/**
 * 🔄 Ajoute un nouvel usage (INVALIDE LE CACHE)
 */
export async function addUsage(usageData: {
  code: string;
  libelle: string;
  description?: string;
}): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('code', usageData.code);
    formData.append('libelle', usageData.libelle);
    if (usageData.description) {
      formData.append('description', usageData.description);
    }

    const response = await fetch(`${API_BASE_URL}/usages/creer_usage.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout de l\'usage',
      };
    }

    // ⚡ Invalider le cache
    await invalidateUsagesCache();

    return data;
  } catch (error) {
    console.error('Add usage error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout de l\'usage',
    };
  }
}

/**
 * 🔄 Modifie un usage existant (INVALIDE LE CACHE)
 */
export async function updateUsage(
  id: number,
  usageData: {
    code: string;
    libelle: string;
    description?: string;
  }
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('code', usageData.code);
    formData.append('libelle', usageData.libelle);
    if (usageData.description) {
      formData.append('description', usageData.description);
    }

    const response = await fetch(`${API_BASE_URL}/usages/modifier_usage.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification de l\'usage',
      };
    }

    // ⚡ Invalider le cache
    await invalidateUsagesCache(id);

    return data;
  } catch (error) {
    console.error('Update usage error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification de l\'usage',
    };
  }
}

/**
 * 🔄 Supprime un usage (INVALIDE LE CACHE)
 */
export async function deleteUsage(id: number): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/usages/supprimer_usage.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression de l\'usage',
      };
    }

    // ⚡ Invalider le cache
    await invalidateUsagesCache(id);

    return data;
  } catch (error) {
    console.error('Delete usage error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression de l\'usage',
    };
  }
}

/**
 * 🔄 Change le statut d'un usage (INVALIDE LE CACHE)
 */
export async function toggleUsageStatus(
  id: number,
  actif: boolean
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/usages/changer_statut_usage.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut de l\'usage',
      };
    }

    // ⚡ Invalider le cache
    await invalidateUsagesCache(id);

    return data;
  } catch (error) {
    console.error('Toggle usage status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut de l\'usage',
    };
  }
}

/**
 * 💾 Recherche des usages par terme (AVEC CACHE - 2 heures)
 */
export async function searchUsages(searchTerm: string): Promise<ApiResponse> {
  'use cache';
  cacheLife('weeks');
  cacheTag(CACHE_TAGS.USAGES_SEARCH, `search-${searchTerm}`);

  try {
    const response = await fetch(
      `${API_BASE_URL}/usages/rechercher_usages.php?search=${encodeURIComponent(searchTerm)}`,
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
        message: data.message || 'Échec de la recherche des usages',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanUsageData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Search usages error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des usages',
    };
  }
}

/**
 * 🌊 Vérifie si un usage existe déjà par son code (PAS DE CACHE)
 */
export async function checkUsageByCode(code: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/usages/verifier_usage.php?code=${encodeURIComponent(code)}`,
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
        message: data.message || 'Échec de la vérification de l\'usage',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Check usage by code error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification de l\'usage',
    };
  }
}

/**
 * 🌊 Vérifie si un usage existe déjà par son libellé (PAS DE CACHE)
 */
export async function checkUsageByLibelle(libelle: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/usages/verifier_usage_libelle.php?libelle=${encodeURIComponent(libelle)}`,
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
        message: data.message || 'Échec de la vérification de l\'usage par libellé',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Check usage by libelle error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification de l\'usage par libellé',
    };
  }
}

/**
 * 💾 Récupère un usage par son ID (AVEC CACHE - 2 heures)
 */
export async function getUsageById(id: number): Promise<ApiResponse> {
  'use cache';
  cacheLife('weeks');
  cacheTag(CACHE_TAGS.USAGE_DETAILS(id));

  try {
    const response = await fetch(
      `${API_BASE_URL}/usages/get_usage.php?id=${id}`,
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
        message: data.message || 'Échec de la récupération de l\'usage',
      };
    }

    return {
      status: 'success',
      data: await cleanUsageData(data.data),
    };
  } catch (error) {
    console.error('Get usage by ID error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération de l\'usage',
    };
  }
}