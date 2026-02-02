'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Server Actions pour la gestion des marques et modèles d'engins avec Cache Components Next.js 16
 */

// Interface pour les données d'une marque d'engin
export interface MarqueEngin {
  id: number;
  libelle: string;
  description: string;
  type_engin_id: number;
  type_engin_libelle: string;
  actif: boolean;
  date_creation: string;
  modeles_count?: number;
}

// Interface pour les données d'un modèle d'engin
export interface ModeleEngin {
  id: number;
  libelle: string;
  description: string;
  marque_engin_id: number;
  marque_libelle: string;
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

// Tags de cache pour les marques
const CACHE_TAGS_MARQUES = {
  MARQUES_LIST: 'marques-list',
  MARQUES_ACTIVES: 'marques-actives',
  MARQUE_DETAILS: (id: number) => `marque-${id}`,
  MARQUES_SEARCH: 'marques-search',
  MARQUES_BY_TYPE: (typeId: number) => `marques-type-${typeId}`,
};

// Tags de cache pour les modèles
const CACHE_TAGS_MODELES = {
  MODELES_LIST: 'modeles-list',
  MODELES_ACTIFS: 'modeles-actifs',
  MODELE_DETAILS: (id: number) => `modele-${id}`,
  MODELES_SEARCH: 'modeles-search',
  MODELES_BY_MARQUE: (marqueId: number) => `modeles-marque-${marqueId}`,
};

// ============================================================================
// FONCTIONS D'INVALIDATION DE CACHE
// ============================================================================

async function invalidateMarquesCache(marqueId?: number) {
  'use server';
  
  revalidateTag(CACHE_TAGS_MARQUES.MARQUES_LIST, "max");
  revalidateTag(CACHE_TAGS_MARQUES.MARQUES_ACTIVES, "max");
  revalidateTag(CACHE_TAGS_MARQUES.MARQUES_SEARCH, "max");
  
  if (marqueId) {
    revalidateTag(CACHE_TAGS_MARQUES.MARQUE_DETAILS(marqueId), "max");
  }
}

async function invalidateModelesCache(modeleId?: number, marqueId?: number) {
  'use server';
  
  revalidateTag(CACHE_TAGS_MODELES.MODELES_LIST, "max");
  revalidateTag(CACHE_TAGS_MODELES.MODELES_ACTIFS, "max");
  revalidateTag(CACHE_TAGS_MODELES.MODELES_SEARCH, "max");
  
  if (modeleId) {
    revalidateTag(CACHE_TAGS_MODELES.MODELE_DETAILS(modeleId), "max");
  }
  
  if (marqueId) {
    revalidateTag(CACHE_TAGS_MODELES.MODELES_BY_MARQUE(marqueId), "max");
  }
}

// ============================================================================
// FONCTIONS DE NETTOYAGE DE DONNÉES
// ============================================================================

export async function cleanMarqueData(data: any): Promise<MarqueEngin> {
  return {
    id: data.id || 0,
    libelle: data.libelle || "",
    description: data.description || "",
    type_engin_id: data.type_engin_id || 0,
    type_engin_libelle: data.type_engin_libelle || "",
    actif: Boolean(data.actif),
    date_creation: data.date_creation || "",
    modeles_count: data.modeles_count || 0,
  };
}

export async function cleanModeleData(data: any): Promise<ModeleEngin> {
  return {
    id: data.id || 0,
    libelle: data.libelle || "",
    description: data.description || "",
    marque_engin_id: data.marque_engin_id || 0,
    marque_libelle: data.marque_libelle || "",
    type_engin_id: data.type_engin_id || 0,
    type_engin_libelle: data.type_engin_libelle || "",
    actif: Boolean(data.actif),
    date_creation: data.date_creation || "",
  };
}

// ============================================================================
// SERVICES POUR LES MARQUES
// ============================================================================

/**
 * 💾 Récupère la liste de toutes les marques d'engins (AVEC CACHE - 2 heures)
 */
export async function getMarquesEngins(): Promise<ApiResponse> {
  'use cache';
  cacheLife('weeks');
  cacheTag(CACHE_TAGS_MARQUES.MARQUES_LIST);

  try {
    const response = await fetch(`${API_BASE_URL}/marques-engins/lister_marques.php`, {
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
        message: data.message || 'Échec de la récupération des marques d\'engins',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanMarqueData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get marques engins error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des marques d\'engins',
    };
  }
}

/**
 * 💾 Récupère la liste des marques d'engins actives (AVEC CACHE - 2 heures)
 */
export async function getMarquesEnginsActives(): Promise<ApiResponse> {
  'use cache';
  cacheLife('weeks');
  cacheTag(CACHE_TAGS_MARQUES.MARQUES_ACTIVES);

  try {
    const response = await fetch(`${API_BASE_URL}/marques-engins/lister_marques_actives.php`, {
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
        message: data.message || 'Échec de la récupération des marques d\'engins actives',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanMarqueData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get marques engins actives error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des marques d\'engins actives',
    };
  }
}

/**
 * 💾 Recherche des marques par type d'engin et terme de recherche (AVEC CACHE - 2 heures)
 */
export async function rechercherMarques(
  typeEngin: string,
  searchTerm: string
): Promise<ApiResponse> {
  'use cache';
  cacheLife('days');
  cacheTag(CACHE_TAGS_MARQUES.MARQUES_SEARCH, `search-${typeEngin}-${searchTerm}`);

  try {
    const formData = new FormData();
    formData.append("type_engin", typeEngin);
    formData.append("search_term", searchTerm);

    const response = await fetch(
      `${API_BASE_URL}/marques-engins/rechercher__marques.php`,
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
        message: data.message || "Échec de la recherche des marques",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanMarqueData(item)))
      : [];

    return {
      status: "success",
      data: cleanedData,
    };
  } catch (error) {
    console.error("Rechercher marques error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des marques",
    };
  }
}

/**
 * 🔄 Ajoute une nouvelle marque d'engin (INVALIDE LE CACHE)
 */
export async function addMarqueEngin(marqueData: {
  libelle: string;
  description: string;
  type_engin_id: number;
}): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('libelle', marqueData.libelle);
    formData.append('description', marqueData.description);
    formData.append('type_engin_id', marqueData.type_engin_id.toString());

    const response = await fetch(`${API_BASE_URL}/marques-engins/creer_marque.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout de la marque',
      };
    }

    // ⚡ Invalider le cache
    await invalidateMarquesCache();

    return data;
  } catch (error) {
    console.error('Add marque engin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout de la marque',
    };
  }
}

/**
 * 🔄 Modifie une marque d'engin existante (INVALIDE LE CACHE)
 */
export async function updateMarqueEngin(
  id: number,
  marqueData: {
    libelle: string;
    description: string;
    type_engin_id: number;
  }
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('libelle', marqueData.libelle);
    formData.append('description', marqueData.description);
    formData.append('type_engin_id', marqueData.type_engin_id.toString());

    const response = await fetch(`${API_BASE_URL}/marques-engins/modifier_marque.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification de la marque',
      };
    }

    // ⚡ Invalider le cache
    await invalidateMarquesCache(id);

    return data;
  } catch (error) {
    console.error('Update marque engin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification de la marque',
    };
  }
}

/**
 * 🔄 Supprime une marque d'engin (INVALIDE LE CACHE)
 */
export async function deleteMarqueEngin(id: number): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/marques-engins/supprimer_marque.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression de la marque',
      };
    }

    // ⚡ Invalider le cache des marques et des modèles
    await invalidateMarquesCache(id);
    await invalidateModelesCache(undefined, id);

    return data;
  } catch (error) {
    console.error('Delete marque engin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression de la marque',
    };
  }
}

/**
 * 🔄 Change le statut d'une marque d'engin (INVALIDE LE CACHE)
 */
export async function toggleMarqueEnginStatus(
  id: number,
  actif: boolean
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/marques-engins/changer_statut_marque.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut de la marque',
      };
    }

    // ⚡ Invalider le cache
    await invalidateMarquesCache(id);

    return data;
  } catch (error) {
    console.error('Toggle marque engin status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut de la marque',
    };
  }
}

/**
 * 💾 Récupère une marque d'engin par son ID (AVEC CACHE - 2 heures)
 */
export async function getMarqueEnginById(id: number): Promise<ApiResponse> {
  'use cache';
  cacheLife('weeks');
  cacheTag(CACHE_TAGS_MARQUES.MARQUE_DETAILS(id));

  try {
    const response = await fetch(
      `${API_BASE_URL}/marques-engins/get_marque.php?id=${id}`,
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
        message: data.message || 'Échec de la récupération de la marque',
      };
    }

    return {
      status: 'success',
      data: await cleanMarqueData(data.data),
    };
  } catch (error) {
    console.error('Get marque engin by ID error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération de la marque',
    };
  }
}

/**
 * 🌊 Vérifie si une marque d'engin existe déjà (PAS DE CACHE)
 */
export async function checkMarqueEnginExists(libelle: string, typeEnginId: number): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/marques-engins/verifier_marque.php?libelle=${encodeURIComponent(libelle)}&type_engin_id=${typeEnginId}`,
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
        message: data.message || 'Échec de la vérification de la marque',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Check marque engin exists error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification de la marque',
    };
  }
}

// ============================================================================
// SERVICES POUR LES MODÈLES
// ============================================================================

/**
 * 💾 Récupère la liste de tous les modèles d'engins (AVEC CACHE - 2 heures)
 */
export async function getModelesEngins(marqueId?: number): Promise<ApiResponse> {
  'use cache';
  cacheLife('weeks');
  
  if (marqueId) {
    cacheTag(CACHE_TAGS_MODELES.MODELES_BY_MARQUE(marqueId));
  } else {
    cacheTag(CACHE_TAGS_MODELES.MODELES_LIST);
  }

  try {
    const url = marqueId 
      ? `${API_BASE_URL}/marques-engins/lister_modeles.php?marque_id=${marqueId}`
      : `${API_BASE_URL}/marques-engins/lister_modeles.php`;

    const response = await fetch(url, {
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
        message: data.message || 'Échec de la récupération des modèles d\'engins',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanModeleData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get modeles engins error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des modèles d\'engins',
    };
  }
}

/**
 * 💾 Récupère la liste des modèles d'engins actifs (AVEC CACHE - 2 heures)
 */
export async function getModelesEnginsActifs(marqueId?: number): Promise<ApiResponse> {
  'use cache';
  cacheLife('weeks');
  
  if (marqueId) {
    cacheTag(CACHE_TAGS_MODELES.MODELES_BY_MARQUE(marqueId), `actifs-${marqueId}`);
  } else {
    cacheTag(CACHE_TAGS_MODELES.MODELES_ACTIFS);
  }

  try {
    const url = marqueId 
      ? `${API_BASE_URL}/marques-engins/lister_modeles_actifs.php?marque_id=${marqueId}`
      : `${API_BASE_URL}/marques-engins/lister_modeles_actifs.php`;

    const response = await fetch(url, {
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
        message: data.message || 'Échec de la récupération des modèles d\'engins actifs',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanModeleData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get modeles engins actifs error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des modèles d\'engins actifs',
    };
  }
}

/**
 * 🔄 Ajoute un nouveau modèle d'engin (INVALIDE LE CACHE)
 */
export async function addModeleEngin(modeleData: {
  libelle: string;
  description: string;
  marque_engin_id: number;
}): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('libelle', modeleData.libelle);
    formData.append('description', modeleData.description);
    formData.append('marque_engin_id', modeleData.marque_engin_id.toString());

    const response = await fetch(`${API_BASE_URL}/marques-engins/creer_modele.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout du modèle',
      };
    }

    // ⚡ Invalider le cache des modèles et de la marque associée
    await invalidateModelesCache(undefined, modeleData.marque_engin_id);

    return data;
  } catch (error) {
    console.error('Add modele engin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout du modèle',
    };
  }
}

/**
 * 🔄 Modifie un modèle d'engin existant (INVALIDE LE CACHE)
 */
export async function updateModeleEngin(
  id: number,
  modeleData: {
    libelle: string;
    description: string;
    marque_engin_id: number;
  }
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('libelle', modeleData.libelle);
    formData.append('description', modeleData.description);
    formData.append('marque_engin_id', modeleData.marque_engin_id.toString());

    const response = await fetch(`${API_BASE_URL}/marques-engins/modifier_modele.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification du modèle',
      };
    }

    // ⚡ Invalider le cache
    await invalidateModelesCache(id, modeleData.marque_engin_id);

    return data;
  } catch (error) {
    console.error('Update modele engin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification du modèle',
    };
  }
}

/**
 * 🔄 Supprime un modèle d'engin (INVALIDE LE CACHE)
 */
export async function deleteModeleEngin(id: number): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/marques-engins/supprimer_modele.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression du modèle',
      };
    }

    // ⚡ Invalider le cache
    await invalidateModelesCache(id);

    return data;
  } catch (error) {
    console.error('Delete modele engin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression du modèle',
    };
  }
}

/**
 * 🔄 Change le statut d'un modèle d'engin (INVALIDE LE CACHE)
 */
export async function toggleModeleEnginStatus(
  id: number,
  actif: boolean
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/marques-engins/changer_statut_modele.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut du modèle',
      };
    }

    // ⚡ Invalider le cache
    await invalidateModelesCache(id);

    return data;
  } catch (error) {
    console.error('Toggle modele engin status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut du modèle',
    };
  }
}

/**
 * 💾 Récupère un modèle d'engin par son ID (AVEC CACHE - 2 heures)
 */
export async function getModeleEnginById(id: number): Promise<ApiResponse> {
  'use cache';
  cacheLife('weeks');
  cacheTag(CACHE_TAGS_MODELES.MODELE_DETAILS(id));

  try {
    const response = await fetch(
      `${API_BASE_URL}/marques-engins/get_modele.php?id=${id}`,
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
        message: data.message || 'Échec de la récupération du modèle',
      };
    }

    return {
      status: 'success',
      data: await cleanModeleData(data.data),
    };
  } catch (error) {
    console.error('Get modele engin by ID error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération du modèle',
    };
  }
}

/**
 * 🌊 Vérifie si un modèle d'engin existe déjà (PAS DE CACHE)
 */
export async function checkModeleEnginExists(libelle: string, marqueEnginId: number): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/marques-engins/verifier_modele.php?libelle=${encodeURIComponent(libelle)}&marque_engin_id=${marqueEnginId}`,
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
        message: data.message || 'Échec de la vérification du modèle',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Check modele engin exists error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification du modèle',
    };
  }
}

/**
 * 💾 Recherche des modèles par terme (AVEC CACHE - 2 heures)
 */
export async function searchModelesEngins(searchTerm: string, marqueId?: number): Promise<ApiResponse> {
  'use cache';
  cacheLife('weeks');
  
  const cacheKey = marqueId ? `search-${searchTerm}-marque-${marqueId}` : `search-${searchTerm}`;
  cacheTag(CACHE_TAGS_MODELES.MODELES_SEARCH, cacheKey);

  try {
    const params = new URLSearchParams();
    params.append('search', searchTerm);
    if (marqueId) {
      params.append('marque_id', marqueId.toString());
    }

    const response = await fetch(
      `${API_BASE_URL}/marques-engins/rechercher_modeles.php?${params.toString()}`,
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
        message: data.message || 'Échec de la recherche des modèles',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanModeleData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Search modeles engins error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des modèles',
    };
  }
}