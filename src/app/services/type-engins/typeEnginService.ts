'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Server Actions pour la gestion des types d'engins avec Cache Components Next.js 16
 */

// Interface pour les données d'un type d'engin
export interface TypeEngin {
  id: number;
  libelle: string;
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

// URL de base de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls';

// Tags de cache pour invalidation ciblée
const CACHE_TAGS = {
  TYPE_ENGINS_LIST: 'type-engins-list',
  TYPE_ENGINS_ACTIFS: 'type-engins-actifs',
  TYPE_ENGIN_DETAILS: (id: number) => `type-engin-${id}`,
  TYPE_ENGINS_SEARCH: 'type-engins-search',
};

/**
 * Invalide le cache après une mutation avec stale-while-revalidate
 */
async function invalidateTypeEnginsCache(typeEnginId?: number) {
  'use server';
  
  revalidateTag(CACHE_TAGS.TYPE_ENGINS_LIST, "max");
  revalidateTag(CACHE_TAGS.TYPE_ENGINS_ACTIFS, "max");
  revalidateTag(CACHE_TAGS.TYPE_ENGINS_SEARCH, "max");
  
  if (typeEnginId) {
    revalidateTag(CACHE_TAGS.TYPE_ENGIN_DETAILS(typeEnginId), "max");
  }
}

// Nettoyer les données
export async function cleanTypeEnginData(data: any): Promise<TypeEngin> {
  return {
    id: data.id || 0,
    libelle: data.libelle || "",
    description: data.description || "",
    actif: Boolean(data.actif),
    date_creation: data.date_creation || "",
  };
}

/**
 * 💾 Récupère la liste de tous les types d'engins (AVEC CACHE - 2 heures)
 */
export async function getTypeEngins(): Promise<ApiResponse> {
  'use cache';
  cacheLife('weeks');
  cacheTag(CACHE_TAGS.TYPE_ENGINS_LIST);

  try {
    const response = await fetch(`${API_BASE_URL}/type-engins/lister_type_engins.php`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: 'error',
        message: data.message || 'Échec de la récupération des types d\'engins',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanTypeEnginData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get type engins error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des types d\'engins',
    };
  }
}

/**
 * 💾 Récupère la liste des types d'engins actifs (AVEC CACHE - 2 heures)
 */
export async function getTypeEnginsActifs(): Promise<ApiResponse> {
  'use cache';
  cacheLife('weeks');
  cacheTag(CACHE_TAGS.TYPE_ENGINS_ACTIFS);

  try {
    const response = await fetch(`${API_BASE_URL}/type-engins/lister_type_engins_actifs.php`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: 'error',
        message: data.message || 'Échec de la récupération des types d\'engins actifs',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanTypeEnginData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get type engins actifs error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des types d\'engins actifs',
    };
  }
}

/**
 * 🔄 Ajoute un nouveau type d'engin (INVALIDE LE CACHE)
 */
export async function addTypeEngin(typeEnginData: {
  libelle: string;
  description?: string;
}): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('libelle', typeEnginData.libelle);
    if (typeEnginData.description) {
      formData.append('description', typeEnginData.description);
    }

    const response = await fetch(`${API_BASE_URL}/type-engins/creer_type_engin.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout du type d\'engin',
      };
    }

    // ⚡ Invalider le cache
    await invalidateTypeEnginsCache();

    return data;
  } catch (error) {
    console.error('Add type engin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout du type d\'engin',
    };
  }
}

/**
 * 🔄 Modifie un type d'engin existant (INVALIDE LE CACHE)
 */
export async function updateTypeEngin(
  id: number,
  typeEnginData: {
    libelle: string;
    description?: string;
  }
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('libelle', typeEnginData.libelle);
    if (typeEnginData.description) {
      formData.append('description', typeEnginData.description);
    }

    const response = await fetch(`${API_BASE_URL}/type-engins/modifier_type_engin.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification du type d\'engin',
      };
    }

    // ⚡ Invalider le cache
    await invalidateTypeEnginsCache(id);

    return data;
  } catch (error) {
    console.error('Update type engin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification du type d\'engin',
    };
  }
}

/**
 * 🔄 Supprime un type d'engin (INVALIDE LE CACHE)
 */
export async function deleteTypeEngin(id: number): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/type-engins/supprimer_type_engin.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression du type d\'engin',
      };
    }

    // ⚡ Invalider le cache
    await invalidateTypeEnginsCache(id);

    return data;
  } catch (error) {
    console.error('Delete type engin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression du type d\'engin',
    };
  }
}

/**
 * 🔄 Change le statut d'un type d'engin (INVALIDE LE CACHE)
 */
export async function toggleTypeEnginStatus(
  id: number,
  actif: boolean
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/type-engins/changer_statut_type_engin.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut du type d\'engin',
      };
    }

    // ⚡ Invalider le cache
    await invalidateTypeEnginsCache(id);

    return data;
  } catch (error) {
    console.error('Toggle type engin status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut du type d\'engin',
    };
  }
}

/**
 * 💾 Recherche des types d'engins par terme (AVEC CACHE - 2 heures)
 */
export async function searchTypeEngins(searchTerm: string): Promise<ApiResponse> {
  'use cache';
  cacheLife('weeks');
  cacheTag(CACHE_TAGS.TYPE_ENGINS_SEARCH, `search-${searchTerm}`);

  try {
    const response = await fetch(
      `${API_BASE_URL}/type-engins/rechercher_type_engins.php?search=${encodeURIComponent(searchTerm)}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: 'error',
        message: data.message || 'Échec de la recherche des types d\'engins',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanTypeEnginData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Search type engins error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des types d\'engins',
    };
  }
}

/**
 * 🌊 Vérifie si un type d'engin existe déjà par son libellé (PAS DE CACHE)
 */
export async function checkTypeEnginExists(libelle: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/type-engins/verifier_type_engin.php?libelle=${encodeURIComponent(libelle)}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: 'error',
        message: data.message || 'Échec de la vérification du type d\'engin',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Check type engin exists error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification du type d\'engin',
    };
  }
}

/**
 * 💾 Récupère un type d'engin par son ID (AVEC CACHE - 2 heures)
 */
export async function getTypeEnginById(id: number): Promise<ApiResponse> {
  'use cache';
  cacheLife('weeks');
  cacheTag(CACHE_TAGS.TYPE_ENGIN_DETAILS(id));

  try {
    const response = await fetch(
      `${API_BASE_URL}/type-engins/get_type_engin.php?id=${id}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: 'error',
        message: data.message || 'Échec de la récupération du type d\'engin',
      };
    }

    return {
      status: 'success',
      data: await cleanTypeEnginData(data.data),
    };
  } catch (error) {
    console.error('Get type engin by ID error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération du type d\'engin',
    };
  }
}