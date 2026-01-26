'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Server Actions pour la gestion des administrateurs avec Cache Components Next.js 16
 */

// Interface pour les données d'un administrateur
export interface Admin {
  id: number;
  nom_complet: string;
  email: string;
  telephone: string;
  role: 'super' | 'partenaire';
  province_id: number | null;
  province_nom: string | null;
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
  password?: string;
}

// Interface pour la pagination
export interface PaginationResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    admins: Admin[];
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
  ADMINS_LIST: 'admins-list',
  ADMINS_ACTIFS: 'admins-actifs',
  ADMIN_DETAILS: (id: number) => `admin-${id}`,
  ADMINS_SEARCH: 'admins-search',
  PROVINCES_LIST: 'provinces-list-admins',
};

/**
 * Invalide le cache après une mutation avec stale-while-revalidate
 */
async function invalidateAdminsCache(adminId?: number) {
  'use server';
  
  revalidateTag(CACHE_TAGS.ADMINS_LIST, "max");
  revalidateTag(CACHE_TAGS.ADMINS_ACTIFS, "max");
  revalidateTag(CACHE_TAGS.ADMINS_SEARCH, "max");
  
  if (adminId) {
    revalidateTag(CACHE_TAGS.ADMIN_DETAILS(adminId), "max");
  }
}

// Nettoyer les données
export async function cleanAdminData(data: any): Promise<Admin> {
  return {
    id: data.id || 0,
    nom_complet: data.nom_complet || "",
    email: data.email || "",
    telephone: data.telephone || "",
    role: data.role || "partenaire",
    province_id: data.province_id || null,
    province_nom: data.province_nom || null,
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
 * 💾 Récupère la liste de tous les administrateurs (AVEC CACHE - 2 heures)
 */
export async function getAdmins(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.ADMINS_LIST);

  try {
    const response = await fetch(`${API_BASE_URL}/admins/lister_admins.php`, {
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
        message: data.message || 'Échec de la récupération des administrateurs',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanAdminData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get admins error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des administrateurs',
    };
  }
}

/**
 * 💾 Récupère la liste des administrateurs actifs (AVEC CACHE - 2 heures)
 */
export async function getAdminsActifs(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.ADMINS_ACTIFS);

  try {
    const response = await fetch(`${API_BASE_URL}/admins/lister_admins_actifs.php`, {
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
        message: data.message || 'Échec de la récupération des administrateurs actifs',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanAdminData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get admins actifs error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des administrateurs actifs',
    };
  }
}

/**
 * 💾 Récupère la liste de toutes les provinces actives (AVEC CACHE - 2 heures)
 */
export async function getProvinces(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.PROVINCES_LIST);

  try {
    const response = await fetch(`${API_BASE_URL}/admins/lister_provinces.php`, {
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
 * 🔄 Ajoute un nouvel administrateur (INVALIDE LE CACHE)
 */
export async function addAdmin(adminData: {
  nom_complet: string;
  email: string;
  telephone: string;
  role: 'super' | 'partenaire';
  province_id: number | null;
}): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('nom_complet', adminData.nom_complet);
    formData.append('email', adminData.email);
    formData.append('telephone', adminData.telephone);
    formData.append('role', adminData.role);
    if (adminData.province_id) {
      formData.append('province_id', adminData.province_id.toString());
    }

    const response = await fetch(`${API_BASE_URL}/admins/creer_admin.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout de l\'administrateur',
      };
    }

    await invalidateAdminsCache();

    return data;
  } catch (error) {
    console.error('Add admin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout de l\'administrateur',
    };
  }
}

/**
 * 🔄 Modifie un administrateur existant (INVALIDE LE CACHE)
 */
export async function updateAdmin(
  id: number,
  adminData: {
    nom_complet: string;
    email: string;
    telephone: string;
    role: 'super' | 'partenaire';
    province_id: number | null;
  }
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('nom_complet', adminData.nom_complet);
    formData.append('email', adminData.email);
    formData.append('telephone', adminData.telephone);
    formData.append('role', adminData.role);
    if (adminData.province_id) {
      formData.append('province_id', adminData.province_id.toString());
    } else {
      formData.append('province_id', '');
    }

    const response = await fetch(`${API_BASE_URL}/admins/modifier_admin.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification de l\'administrateur',
      };
    }

    await invalidateAdminsCache(id);

    return data;
  } catch (error) {
    console.error('Update admin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification de l\'administrateur',
    };
  }
}

/**
 * 🔄 Réinitialise le mot de passe d'un administrateur (INVALIDE LE CACHE)
 */
export async function resetAdminPassword(id: number): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/admins/reinitialiser_mot_de_passe.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la réinitialisation du mot de passe',
      };
    }

    // Note: Ne pas invalider le cache pour cette action spécifique
    // car cela n'affecte pas les données affichées des administrateurs

    return data;
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la réinitialisation du mot de passe',
    };
  }
}

/**
 * 🔄 Supprime un administrateur (INVALIDE LE CACHE)
 */
export async function deleteAdmin(id: number): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/admins/supprimer_admin.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression de l\'administrateur',
      };
    }

    await invalidateAdminsCache(id);

    return data;
  } catch (error) {
    console.error('Delete admin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression de l\'administrateur',
    };
  }
}

/**
 * 🔄 Change le statut d'un administrateur (actif/inactif) (INVALIDE LE CACHE)
 */
export async function toggleAdminStatus(
  id: number,
  actif: boolean
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/admins/changer_statut_admin.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut de l\'administrateur',
      };
    }

    await invalidateAdminsCache(id);

    return data;
  } catch (error) {
    console.error('Toggle admin status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut de l\'administrateur',
    };
  }
}

/**
 * 💾 Recherche des administrateurs par terme (AVEC CACHE - 2 heures)
 */
export async function searchAdmins(searchTerm: string): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.ADMINS_SEARCH, `search-${searchTerm}`);

  try {
    const response = await fetch(
      `${API_BASE_URL}/admins/rechercher_admins.php?search=${encodeURIComponent(searchTerm)}`,
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
        message: data.message || 'Échec de la recherche des administrateurs',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanAdminData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Search admins error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des administrateurs',
    };
  }
}

/**
 * 🌊 Vérifie si un administrateur existe déjà par son email (PAS DE CACHE)
 */
export async function checkAdminByEmail(email: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admins/verifier_admin.php?email=${encodeURIComponent(email)}`,
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
        message: data.message || 'Échec de la vérification de l\'administrateur',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Check admin by email error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification de l\'administrateur',
    };
  }
}

/**
 * 💾 Récupère un administrateur par son ID (AVEC CACHE - 2 heures)
 */
export async function getAdminById(id: number): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.ADMIN_DETAILS(id));

  try {
    const response = await fetch(
      `${API_BASE_URL}/admins/get_admin.php?id=${id}`,
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
        message: data.message || 'Échec de la récupération de l\'administrateur',
      };
    }

    return {
      status: 'success',
      data: await cleanAdminData(data.data),
    };
  } catch (error) {
    console.error('Get admin by ID error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération de l\'administrateur',
    };
  }
}

/**
 * 💾 Recherche des administrateurs par rôle (AVEC CACHE - 2 heures)
 */
export async function searchAdminsByRole(role: string, searchTerm?: string): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.ADMINS_SEARCH, `role-${role}-search-${searchTerm || ''}`);

  try {
    const params = new URLSearchParams({
      role: role,
    });
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }

    const response = await fetch(
      `${API_BASE_URL}/admins/rechercher_admins_par_role.php?${params.toString()}`,
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
        message: data.message || 'Échec de la recherche des administrateurs par rôle',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanAdminData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Search admins by role error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des administrateurs par rôle',
    };
  }
}

/**
 * 💾 Récupère les administrateurs avec pagination (AVEC CACHE - 2 heures)
 */
export async function getAdminsPaginees(page: number = 1, limit: number = 10, searchTerm: string = ''): Promise<PaginationResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.ADMINS_LIST, `page-${page}-search-${searchTerm}`);

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }

    const response = await fetch(
      `${API_BASE_URL}/admins/lister_admins_paginees.php?${params.toString()}`,
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
        message: data.message || 'Échec de la récupération des administrateurs paginés',
      };
    }

    const cleanedData = Array.isArray(data.data?.admins)
      ? await Promise.all(data.data.admins.map(async (item: any) => await cleanAdminData(item)))
      : [];

    return {
      status: 'success',
      data: {
        admins: cleanedData,
        pagination: data.data?.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    };
  } catch (error) {
    console.error('Get admins paginees error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des administrateurs paginés',
    };
  }
}