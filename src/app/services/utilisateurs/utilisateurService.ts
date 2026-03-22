'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Server Actions pour la gestion des utilisateurs avec Cache Components Next.js 16
 */

// Interface pour les privilèges d'un utilisateur
export interface Privileges {
  simple: boolean;
  special: boolean;
  delivrance: boolean;
  plaque: boolean;
  reproduction: boolean;
  series: boolean;
  autresTaxes: boolean;
}

// Interface pour les données d'un utilisateur
export interface Utilisateur {
  id: number;
  nom_complet: string;
  telephone: string;
  adresse: string;
  actif: boolean;
  site_nom: string;
  site_code: string;
  site_affecte_id: number;
  date_creation: string;
  privileges: Privileges;
}

// Interface pour les sites
export interface Site {
  id: number;
  nom: string;
  code: string;
}

// Interface pour les données de formulaire utilisateur
export interface UtilisateurFormData {
  nom_complet: string;
  telephone: string;
  adresse: string;
  site_affecte_id: number;
  privileges: Privileges;
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
    utilisateurs: Utilisateur[];
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
  UTILISATEURS_LIST: 'utilisateurs-list',
  UTILISATEURS_ACTIFS: 'utilisateurs-actifs',
  UTILISATEUR_DETAILS: (id: number) => `utilisateur-${id}`,
  UTILISATEURS_SEARCH: 'utilisateurs-search',
  SITES_LIST: 'sites-list-utilisateurs',
};

/**
 * Invalide le cache après une mutation avec stale-while-revalidate
 */
async function invalidateUtilisateursCache(utilisateurId?: number) {
  'use server';
  
  revalidateTag(CACHE_TAGS.UTILISATEURS_LIST, "max");
  revalidateTag(CACHE_TAGS.UTILISATEURS_ACTIFS, "max");
  revalidateTag(CACHE_TAGS.UTILISATEURS_SEARCH, "max");
  
  if (utilisateurId) {
    revalidateTag(CACHE_TAGS.UTILISATEUR_DETAILS(utilisateurId), "max");
  }
}

// Nettoyer les données (synchrone — pas de I/O)
function cleanUtilisateurData(data: any): Utilisateur {
  return {
    id: data.id || 0,
    nom_complet: data.nom_complet || "",
    telephone: data.telephone || "",
    adresse: data.adresse || "",
    actif: Boolean(data.actif),
    site_nom: data.site_nom || "",
    site_code: data.site_code || "",
    site_affecte_id: data.site_affecte_id || 0,
    date_creation: data.date_creation || "",
    privileges: data.privileges || {
      simple: false,
      special: false,
      delivrance: false,
      plaque: false,
      reproduction: false,
      series: false,
      autresTaxes: false,
    },
  };
}

function cleanSiteData(data: any): Site {
  return {
    id: data.id || 0,
    nom: data.nom || "",
    code: data.code || "",
  };
}

/**
 * 💾 Récupère la liste de tous les utilisateurs (AVEC CACHE - 2 heures)
 */
export async function getUtilisateurs(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.UTILISATEURS_LIST);

  try {
    const response = await fetch(`${API_BASE_URL}/utilisateurs/lister_utilisateurs.php`, {
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
        message: data.message || 'Échec de la récupération des utilisateurs',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? data.data.map((item: any) => cleanUtilisateurData(item))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get utilisateurs error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des utilisateurs',
    };
  }
}

/**
 * 💾 Récupère la liste des utilisateurs actifs (AVEC CACHE - 2 heures)
 */
export async function getUtilisateursActifs(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.UTILISATEURS_ACTIFS);

  try {
    const response = await fetch(`${API_BASE_URL}/utilisateurs/lister_utilisateurs_actifs.php`, {
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
        message: data.message || 'Échec de la récupération des utilisateurs actifs',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? data.data.map((item: any) => cleanUtilisateurData(item))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get utilisateurs actifs error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des utilisateurs actifs',
    };
  }
}

/**
 * 🔄 Ajoute un nouvel utilisateur (INVALIDE LE CACHE)
 */
export async function addUtilisateur(utilisateurData: UtilisateurFormData): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('nom_complet', utilisateurData.nom_complet);
    formData.append('telephone', utilisateurData.telephone);
    formData.append('adresse', utilisateurData.adresse);
    formData.append('site_affecte_id', utilisateurData.site_affecte_id.toString());
    formData.append('privileges', JSON.stringify(utilisateurData.privileges));

    const response = await fetch(`${API_BASE_URL}/utilisateurs/creer_utilisateur.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout de l\'utilisateur',
      };
    }

    await invalidateUtilisateursCache();

    return data;
  } catch (error) {
    console.error('Add utilisateur error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout de l\'utilisateur',
    };
  }
}

/**
 * 🔄 Modifie un utilisateur existant (INVALIDE LE CACHE)
 */
export async function updateUtilisateur(
  id: number,
  utilisateurData: UtilisateurFormData
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('nom_complet', utilisateurData.nom_complet);
    formData.append('telephone', utilisateurData.telephone);
    formData.append('adresse', utilisateurData.adresse);
    formData.append('site_affecte_id', utilisateurData.site_affecte_id.toString());
    formData.append('privileges', JSON.stringify(utilisateurData.privileges));

    const response = await fetch(`${API_BASE_URL}/utilisateurs/modifier_utilisateur.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification de l\'utilisateur',
      };
    }

    await invalidateUtilisateursCache();

    return data;
  } catch (error) {
    console.error('Update utilisateur error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification de l\'utilisateur',
    };
  }
}

/**
 * 🔄 Supprime un utilisateur (INVALIDE LE CACHE)
 */
export async function deleteUtilisateur(id: number): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/utilisateurs/supprimer_utilisateur.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression de l\'utilisateur',
      };
    }

    await invalidateUtilisateursCache();

    return data;
  } catch (error) {
    console.error('Delete utilisateur error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression de l\'utilisateur',
    };
  }
}

/**
 * 🔄 Change le statut d'un utilisateur (actif/inactif) (INVALIDE LE CACHE)
 */
export async function toggleUtilisateurStatus(
  id: number,
  actif: boolean
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/utilisateurs/changer_statut_utilisateur.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut de l\'utilisateur',
      };
    }

    await invalidateUtilisateursCache();

    return data;
  } catch (error) {
    console.error('Toggle utilisateur status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut de l\'utilisateur',
    };
  }
}

/**
 * 💾 Recherche des utilisateurs (AVEC CACHE - 2 heures)
 */
export async function searchUtilisateurs(searchTerm: string): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.UTILISATEURS_SEARCH, `search-${searchTerm}`);

  try {
    const response = await fetch(
      `${API_BASE_URL}/utilisateurs/rechercher_utilisateurs.php?search=${encodeURIComponent(searchTerm)}`,
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
        message: data.message || 'Échec de la recherche des utilisateurs',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanUtilisateurData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Search utilisateurs error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des utilisateurs',
    };
  }
}

/**
 * 💾 Récupère la liste des sites actifs (CACHED 2h)
 */
export async function getSitesActifs(): Promise<ApiResponse> {
  'use cache';
  cacheTag(CACHE_TAGS.SITES_LIST);
  cacheLife('hours');

  try {
    const response = await fetch(`${API_BASE_URL}/utilisateurs/lister_sites_actifs.php`, {
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
      ? data.data.map((item: any) => cleanSiteData(item))
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
 * 🌊 Vérifie si un utilisateur existe déjà par son numéro de téléphone (PAS DE CACHE)
 */
export async function checkUtilisateurByTelephone(telephone: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/utilisateurs/verifier_utilisateur.php?telephone=${encodeURIComponent(telephone)}`,
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
        message: data.message || 'Échec de la vérification de l\'utilisateur',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Check utilisateur by telephone error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification de l\'utilisateur',
    };
  }
}

/**
 * 💾 Récupère un utilisateur par son ID (AVEC CACHE - 2 heures)
 */
export async function getUtilisateurById(id: number): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.UTILISATEUR_DETAILS(id));

  try {
    const response = await fetch(
      `${API_BASE_URL}/utilisateurs/get_utilisateur.php?id=${id}`,
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
        message: data.message || 'Échec de la récupération de l\'utilisateur',
      };
    }

    return {
      status: 'success',
      data: await cleanUtilisateurData(data.data),
    };
  } catch (error) {
    console.error('Get utilisateur by ID error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération de l\'utilisateur',
    };
  }
}

/**
 * 💾 Recherche des utilisateurs par site (AVEC CACHE - 2 heures)
 */
export async function searchUtilisateursBySite(siteId: number, searchTerm?: string): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.UTILISATEURS_SEARCH, `site-${siteId}-search-${searchTerm || ''}`);

  try {
    const params = new URLSearchParams({
      site_id: siteId.toString(),
    });
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }

    const response = await fetch(
      `${API_BASE_URL}/utilisateurs/rechercher_utilisateurs_par_site.php?${params.toString()}`,
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
        message: data.message || 'Échec de la recherche des utilisateurs par site',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanUtilisateurData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Search utilisateurs by site error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des utilisateurs par site',
    };
  }
}

/**
 * 💾 Récupère les utilisateurs avec pagination (AVEC CACHE - 2 heures)
 */
export async function getUtilisateursPaginees(page: number = 1, limit: number = 10, searchTerm: string = ''): Promise<PaginationResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.UTILISATEURS_LIST, `page-${page}-search-${searchTerm}`);

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }

    const response = await fetch(
      `${API_BASE_URL}/utilisateurs/lister_utilisateurs_paginees.php?${params.toString()}`,
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
        message: data.message || 'Échec de la récupération des utilisateurs paginés',
      };
    }

    const cleanedData = Array.isArray(data.data?.utilisateurs)
      ? await Promise.all(data.data.utilisateurs.map(async (item: any) => await cleanUtilisateurData(item)))
      : [];

    return {
      status: 'success',
      data: {
        utilisateurs: cleanedData,
        pagination: data.data?.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    };
  } catch (error) {
    console.error('Get utilisateurs paginees error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des utilisateurs paginés',
    };
  }
}

/**
 * 🔄 Met à jour les privilèges d'un utilisateur (INVALIDE LE CACHE)
 */
export async function updatePrivilegesUtilisateur(
  id: number,
  privileges: Privileges
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('privileges', JSON.stringify(privileges));

    const response = await fetch(`${API_BASE_URL}/utilisateurs/modifier_privileges_utilisateur.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification des privilèges',
      };
    }

    await invalidateUtilisateursCache();

    return data;
  } catch (error) {
    console.error('Update privileges utilisateur error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification des privilèges',
    };
  }
}