'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Server Actions pour la gestion des énergies avec Cache Components Next.js 16
 */

// Interface pour les données d'une énergie
export interface Energie {
  id: number;
  nom: string;
  description: string;
  couleur: string;
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
  ENERGIES_LIST: 'energies-list',
  ENERGIES_ACTIVES: 'energies-actives',
  ENERGIE_DETAILS: (id: number) => `energie-${id}`,
  ENERGIES_SEARCH: 'energies-search',
};

/**
 * Invalide le cache après une mutation
 */
async function invalidateEnergiesCache(energieId?: number) {
  'use server';
  
  revalidateTag(CACHE_TAGS.ENERGIES_LIST, "max");
  revalidateTag(CACHE_TAGS.ENERGIES_ACTIVES, "max");
  revalidateTag(CACHE_TAGS.ENERGIES_SEARCH, "max");
  
  if (energieId) {
    revalidateTag(CACHE_TAGS.ENERGIE_DETAILS(energieId), "max");
  }
}

// Nettoyer les données
export async function cleanEnergieData(data: any): Promise<Energie> {
  return {
    id: data.id || 0,
    nom: data.nom || "",
    description: data.description || "",
    couleur: data.couleur || "#000000",
    actif: Boolean(data.actif),
    date_creation: data.date_creation || "",
  };
}

/**
 * 💾 Récupère la liste de toutes les énergies (AVEC CACHE - 2 heures)
 */
export async function getEnergies(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.ENERGIES_LIST);

  try {
    const response = await fetch(`${API_BASE_URL}/energies/lister_energies.php`, {
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
        message: data.message || 'Échec de la récupération des énergies',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanEnergieData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get energies error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des énergies',
    };
  }
}

/**
 * 💾 Récupère la liste des énergies actives (AVEC CACHE - 2 heures)
 */
export async function getEnergiesActives(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.ENERGIES_ACTIVES);

  try {
    const response = await fetch(`${API_BASE_URL}/energies/lister_energies_actives.php`, {
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
        message: data.message || 'Échec de la récupération des énergies actives',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanEnergieData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get energies actives error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des énergies actives',
    };
  }
}

/**
 * 🔄 Ajoute une nouvelle énergie (INVALIDE LE CACHE)
 */
export async function addEnergie(energieData: {
  nom: string;
  description?: string;
  couleur?: string;
}): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('nom', energieData.nom);
    if (energieData.description) formData.append('description', energieData.description);
    if (energieData.couleur) formData.append('couleur', energieData.couleur);

    const response = await fetch(`${API_BASE_URL}/energies/creer_energie.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout de l\'énergie',
      };
    }

    // ⚡ Invalider le cache
    await invalidateEnergiesCache();

    return data;
  } catch (error) {
    console.error('Add energie error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout de l\'énergie',
    };
  }
}

/**
 * 🔄 Modifie une énergie existante (INVALIDE LE CACHE)
 */
export async function updateEnergie(
  id: number,
  energieData: {
    nom: string;
    description?: string;
    couleur?: string;
  }
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('nom', energieData.nom);
    if (energieData.description) formData.append('description', energieData.description);
    if (energieData.couleur) formData.append('couleur', energieData.couleur);

    const response = await fetch(`${API_BASE_URL}/energies/modifier_energie.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification de l\'énergie',
      };
    }

    // ⚡ Invalider le cache
    await invalidateEnergiesCache(id);

    return data;
  } catch (error) {
    console.error('Update energie error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification de l\'énergie',
    };
  }
}

/**
 * 🔄 Supprime une énergie (INVALIDE LE CACHE)
 */
export async function deleteEnergie(id: number): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/energies/supprimer_energie.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression de l\'énergie',
      };
    }

    // ⚡ Invalider le cache
    await invalidateEnergiesCache(id);

    return data;
  } catch (error) {
    console.error('Delete energie error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression de l\'énergie',
    };
  }
}

/**
 * 🔄 Change le statut d'une énergie (INVALIDE LE CACHE)
 */
export async function toggleEnergieStatus(
  id: number,
  actif: boolean
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/energies/changer_statut_energie.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut de l\'énergie',
      };
    }

    // ⚡ Invalider le cache
    await invalidateEnergiesCache(id);

    return data;
  } catch (error) {
    console.error('Toggle energie status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut de l\'énergie',
    };
  }
}

/**
 * 💾 Recherche des énergies par terme (AVEC CACHE - 2 heures)
 */
export async function searchEnergies(searchTerm: string): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.ENERGIES_SEARCH, `search-${searchTerm}`);

  try {
    const response = await fetch(
      `${API_BASE_URL}/energies/rechercher_energies.php?search=${encodeURIComponent(searchTerm)}`,
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
        message: data.message || 'Échec de la recherche des énergies',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanEnergieData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Search energies error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des énergies',
    };
  }
}

/**
 * 🌊 Vérifie si une énergie existe déjà par son nom (PAS DE CACHE)
 */
export async function checkEnergieExists(nom: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/energies/verifier_energie.php?nom=${encodeURIComponent(nom)}`,
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
        message: data.message || 'Échec de la vérification de l\'énergie',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Check energie exists error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification de l\'énergie',
    };
  }
}

/**
 * 💾 Récupère une énergie par son ID (AVEC CACHE - 2 heures)
 */
export async function getEnergieById(id: number): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.ENERGIE_DETAILS(id));

  try {
    const response = await fetch(
      `${API_BASE_URL}/energies/get_energie.php?id=${id}`,
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
        message: data.message || 'Échec de la récupération de l\'énergie',
      };
    }

    return {
      status: 'success',
      data: await cleanEnergieData(data.data),
    };
  } catch (error) {
    console.error('Get energie by ID error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération de l\'énergie',
    };
  }
}