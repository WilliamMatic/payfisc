'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Server Actions pour la gestion des puissances fiscales avec Cache Components Next.js 16
 */

// Interface pour les données d'une puissance fiscale
export interface PuissanceFiscale {
  id: number;
  libelle: string;
  valeur: number;
  description: string;
  type_engin_id: number;
  type_engin_libelle: string;
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
  PUISSANCES_LIST: 'puissances-list',
  PUISSANCES_ACTIVES: 'puissances-actives',
  PUISSANCE_DETAILS: (id: number) => `puissance-${id}`,
  PUISSANCES_SEARCH: 'puissances-search',
  PUISSANCES_BY_TYPE: (typeId: number) => `puissances-type-${typeId}`,
};

/**
 * Invalide le cache après une mutation
 */
async function invalidatePuissancesCache(puissanceId?: number) {
  'use server';
  
  revalidateTag(CACHE_TAGS.PUISSANCES_LIST, "max");
  revalidateTag(CACHE_TAGS.PUISSANCES_ACTIVES, "max");
  revalidateTag(CACHE_TAGS.PUISSANCES_SEARCH, "max");
  
  if (puissanceId) {
    revalidateTag(CACHE_TAGS.PUISSANCE_DETAILS(puissanceId), "max");
  }
}

// Nettoyer les données
export async function cleanPuissanceData(data: any): Promise<PuissanceFiscale> {
  return {
    id: data.id || 0,
    libelle: data.libelle || "",
    valeur: data.valeur || 0,
    description: data.description || "",
    type_engin_id: data.type_engin_id || 0,
    type_engin_libelle: data.type_engin_libelle || "",
    actif: Boolean(data.actif),
    date_creation: data.date_creation || "",
  };
}

/**
 * 💾 Récupère la liste de toutes les puissances fiscales (AVEC CACHE - 2 heures)
 */
export async function getPuissancesFiscales(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.PUISSANCES_LIST);

  try {
    const response = await fetch(`${API_BASE_URL}/puissances-fiscales/lister_puissances_fiscales.php`, {
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
        message: data.message || 'Échec de la récupération des puissances fiscales',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanPuissanceData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get puissances fiscales error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des puissances fiscales',
    };
  }
}

/**
 * 💾 Récupère la liste des puissances fiscales actives (AVEC CACHE - 2 heures)
 */
export async function getPuissancesFiscalesActives(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.PUISSANCES_ACTIVES);

  try {
    const response = await fetch(`${API_BASE_URL}/puissances-fiscales/lister_puissances_fiscales_actives.php`, {
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
        message: data.message || 'Échec de la récupération des puissances fiscales actives',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanPuissanceData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get puissances fiscales actives error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des puissances fiscales actives',
    };
  }
}

/**
 * 🔄 Ajoute une nouvelle puissance fiscale (INVALIDE LE CACHE)
 */
export async function addPuissanceFiscale(puissanceFiscaleData: {
  libelle: string;
  valeur: number;
  type_engin_id: number;
  description?: string;
}): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('libelle', puissanceFiscaleData.libelle);
    formData.append('valeur', puissanceFiscaleData.valeur.toString());
    formData.append('type_engin_id', puissanceFiscaleData.type_engin_id.toString());
    if (puissanceFiscaleData.description) {
      formData.append('description', puissanceFiscaleData.description);
    }

    const response = await fetch(`${API_BASE_URL}/puissances-fiscales/creer_puissance_fiscale.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout de la puissance fiscale',
      };
    }

    // ⚡ Invalider le cache
    await invalidatePuissancesCache();

    return data;
  } catch (error) {
    console.error('Add puissance fiscale error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout de la puissance fiscale',
    };
  }
}

/**
 * 🔄 Modifie une puissance fiscale existante (INVALIDE LE CACHE)
 */
export async function updatePuissanceFiscale(
  id: number,
  puissanceFiscaleData: {
    libelle: string;
    valeur: number;
    type_engin_id: number;
    description?: string;
  }
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('libelle', puissanceFiscaleData.libelle);
    formData.append('valeur', puissanceFiscaleData.valeur.toString());
    formData.append('type_engin_id', puissanceFiscaleData.type_engin_id.toString());
    if (puissanceFiscaleData.description) {
      formData.append('description', puissanceFiscaleData.description);
    }

    const response = await fetch(`${API_BASE_URL}/puissances-fiscales/modifier_puissance_fiscale.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification de la puissance fiscale',
      };
    }

    // ⚡ Invalider le cache
    await invalidatePuissancesCache(id);

    return data;
  } catch (error) {
    console.error('Update puissance fiscale error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification de la puissance fiscale',
    };
  }
}

/**
 * 🔄 Supprime une puissance fiscale (INVALIDE LE CACHE)
 */
export async function deletePuissanceFiscale(id: number): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/puissances-fiscales/supprimer_puissance_fiscale.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression de la puissance fiscale',
      };
    }

    // ⚡ Invalider le cache
    await invalidatePuissancesCache(id);

    return data;
  } catch (error) {
    console.error('Delete puissance fiscale error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression de la puissance fiscale',
    };
  }
}

/**
 * 🔄 Change le statut d'une puissance fiscale (INVALIDE LE CACHE)
 */
export async function togglePuissanceFiscaleStatus(
  id: number,
  actif: boolean
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/puissances-fiscales/changer_statut_puissance_fiscale.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut de la puissance fiscale',
      };
    }

    // ⚡ Invalider le cache
    await invalidatePuissancesCache(id);

    return data;
  } catch (error) {
    console.error('Toggle puissance fiscale status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut de la puissance fiscale',
    };
  }
}

/**
 * 💾 Recherche des puissances fiscales par terme (AVEC CACHE - 2 heures)
 */
export async function searchPuissancesFiscales(searchTerm: string): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.PUISSANCES_SEARCH, `search-${searchTerm}`);

  try {
    const response = await fetch(
      `${API_BASE_URL}/puissances-fiscales/rechercher_puissances_fiscales.php?search=${encodeURIComponent(searchTerm)}`,
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
        message: data.message || 'Échec de la recherche des puissances fiscales',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanPuissanceData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Search puissances fiscales error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des puissances fiscales',
    };
  }
}