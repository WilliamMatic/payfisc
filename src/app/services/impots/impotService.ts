'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Server Actions pour la gestion des impôts avec Cache Components Next.js 16
 */

// Interface pour les données d'un impôt
export interface Impot {
  id: number;
  nom: string;
  description: string;
  periode: string;
  delai_accord: number;
  prix: number;
  penalites: {
    type: string;
    valeur: number;
  };
  actif: boolean;
  date_creation: string;
}

// Interface pour les réponses de l'API
export interface ApiResponse {
  status: "success" | "error";
  message?: string;
  data?: any;
}

// Interfaces pour la gestion des bénéficiaires d'impôt
export interface BeneficiaireImpot {
  id: number;
  impot_id: number;
  beneficiaire_id: number;
  type_part: "pourcentage" | "montant_fixe";
  valeur_part: number;
  nom: string;
  telephone: string;
  numero_compte: string;
}

// Interface pour la pagination
export interface PaginationResponse {
  status: "success" | "error";
  message?: string;
  data?: {
    impots: Impot[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

// URL de base de l'API
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls";

// Tags de cache pour invalidation ciblée
const CACHE_TAGS = {
  IMPOTS_LIST: 'impots-list',
  IMPOTS_ACTIFS: 'impots-actifs',
  IMPOT_DETAILS: (id: number) => `impot-${id}`,
  IMPOTS_SEARCH: 'impots-search',
  IMPOTS_PAGINES: (page: number, search?: string) => `impots-page-${page}-${search || ''}`,
  IMPOTS_STATUT: (actif: boolean) => `impots-statut-${actif}`,
  BENEFICIAIRES_IMPOT: (impotId: number) => `beneficiaires-impot-${impotId}`,
};

/**
 * Invalide le cache après une mutation avec stale-while-revalidate
 */
async function invalidateImpotsCache(impotId?: number) {
  'use server';
  
  revalidateTag(CACHE_TAGS.IMPOTS_LIST, "max");
  revalidateTag(CACHE_TAGS.IMPOTS_ACTIFS, "max");
  revalidateTag(CACHE_TAGS.IMPOTS_SEARCH, "max");
  revalidateTag(CACHE_TAGS.IMPOTS_STATUT(true), "max");
  revalidateTag(CACHE_TAGS.IMPOTS_STATUT(false), "max");
  
  if (impotId) {
    revalidateTag(CACHE_TAGS.IMPOT_DETAILS(impotId), "max");
    revalidateTag(CACHE_TAGS.BENEFICIAIRES_IMPOT(impotId), "max");
  }
}

// Nettoyer les données
export async function cleanImpotData(data: any): Promise<Impot> {
  return {
    id: data.id || 0,
    nom: data.nom || "",
    description: data.description || "",
    periode: data.periode || "",
    delai_accord: data.delai_accord || 0,
    prix: data.prix || 0,
    penalites: data.penalites || { type: "", valeur: 0 },
    actif: Boolean(data.actif),
    date_creation: data.date_creation || "",
  };
}

export async function cleanBeneficiaireData(data: any): Promise<BeneficiaireImpot> {
  return {
    id: data.id || 0,
    impot_id: data.impot_id || 0,
    beneficiaire_id: data.beneficiaire_id || 0,
    type_part: data.type_part || "pourcentage",
    valeur_part: data.valeur_part || 0,
    nom: data.nom || "",
    telephone: data.telephone || "",
    numero_compte: data.numero_compte || "",
  };
}

/**
 * 💾 Récupère la liste de tous les impôts (AVEC CACHE - 2 heures)
 */
export async function getImpots(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.IMPOTS_LIST);

  try {
    const response = await fetch(`${API_BASE_URL}/impots/lister_impots.php`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des impôts",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanImpotData(item)))
      : [];

    return {
      status: "success",
      data: cleanedData,
    };
  } catch (error) {
    console.error("Get impots error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des impôts",
    };
  }
}

/**
 * 💾 Récupère la liste des impôts actifs (AVEC CACHE - 2 heures)
 */
export async function getImpotsActifs(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.IMPOTS_ACTIFS);

  try {
    const response = await fetch(`${API_BASE_URL}/impots/lister_impots_actifs.php`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des impôts actifs",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanImpotData(item)))
      : [];

    return {
      status: "success",
      data: cleanedData,
    };
  } catch (error) {
    console.error("Get impots actifs error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des impôts actifs",
    };
  }
}

/**
 * 🔄 Ajoute un nouvel impôt (INVALIDE LE CACHE)
 */
export async function addImpot(impotData: {
  nom: string;
  description: string;
  jsonData: string;
}): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("nom", impotData.nom);
    formData.append("description", impotData.description);
    formData.append("jsonData", impotData.jsonData);

    const response = await fetch(`${API_BASE_URL}/impots/creer_impot.php`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de l'ajout de l'impôt",
      };
    }

    // ⚡ Invalider le cache
    await invalidateImpotsCache();

    return data;
  } catch (error) {
    console.error("Add impot error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'ajout de l'impôt",
    };
  }
}

/**
 * 🔄 Modifie un impôt existant (INVALIDE LE CACHE)
 */
export async function updateImpot(
  id: number,
  impotData: {
    nom: string;
    description: string;
    jsonData: string;
  }
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("nom", impotData.nom);
    formData.append("description", impotData.description);
    formData.append("jsonData", impotData.jsonData);

    const response = await fetch(`${API_BASE_URL}/impots/modifier_impot.php`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la modification de l'impôt",
      };
    }

    // ⚡ Invalider le cache
    await invalidateImpotsCache(id);

    return data;
  } catch (error) {
    console.error("Update impot error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la modification de l'impôt",
    };
  }
}

/**
 * 🔄 Supprime un impôt (INVALIDE LE CACHE)
 */
export async function deleteImpot(id: number): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());

    const response = await fetch(`${API_BASE_URL}/impots/supprimer_impot.php`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la suppression de l'impôt",
      };
    }

    // ⚡ Invalider le cache
    await invalidateImpotsCache(id);

    return data;
  } catch (error) {
    console.error("Delete impot error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la suppression de l'impôt",
    };
  }
}

/**
 * 🔄 Change le statut d'un impôt (INVALIDE LE CACHE)
 */
export async function toggleImpotStatus(
  id: number,
  actif: boolean
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("actif", actif.toString());

    const response = await fetch(
      `${API_BASE_URL}/impots/changer_statut_impot.php`,
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
        message: data.message || "Échec du changement de statut de l'impôt",
      };
    }

    // ⚡ Invalider le cache
    await invalidateImpotsCache(id);

    return data;
  } catch (error) {
    console.error("Toggle impot status error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors du changement de statut de l'impôt",
    };
  }
}

/**
 * 💾 Recherche des impôts par terme (AVEC CACHE - 2 heures)
 */
export async function searchImpots(
  searchTerm: string
): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.IMPOTS_SEARCH, `search-${searchTerm}`);

  try {
    const response = await fetch(
      `${API_BASE_URL}/impots/rechercher_impots.php?search=${encodeURIComponent(
        searchTerm
      )}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la recherche des impôts",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanImpotData(item)))
      : [];

    return {
      status: "success",
      data: cleanedData,
    };
  } catch (error) {
    console.error("Search impots error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des impôts",
    };
  }
}

/**
 * 💾 Récupère les bénéficiaires d'un impôt (AVEC CACHE - 2 heures)
 */
export async function getBeneficiairesImpot(
  impotId: number
): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.BENEFICIAIRES_IMPOT(impotId));

  try {
    const response = await fetch(
      `${API_BASE_URL}/impots/beneficiaires/lister_beneficiaires_impot.php?impot_id=${impotId}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des bénéficiaires",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanBeneficiaireData(item)))
      : [];

    return {
      status: "success",
      data: cleanedData,
    };
  } catch (error) {
    console.error("Get beneficiaires impot error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des bénéficiaires",
    };
  }
}

/**
 * 🔄 Ajoute un bénéficiaire à un impôt (INVALIDE LE CACHE)
 */
export async function addBeneficiaireImpot(beneficiaireData: {
  impot_id: number;
  beneficiaire_id: number;
  type_part: "pourcentage" | "montant_fixe";
  valeur_part: number;
}): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/impots/beneficiaires/ajouter_beneficiaire_impot.php`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(beneficiaireData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de l'ajout du bénéficiaire",
      };
    }

    // ⚡ Invalider le cache des bénéficiaires de cet impôt
    await invalidateImpotsCache(beneficiaireData.impot_id);

    return data;
  } catch (error) {
    console.error("Add beneficiaire impot error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'ajout du bénéficiaire",
    };
  }
}

/**
 * 🔄 Retire un bénéficiaire d'un impôt (INVALIDE LE CACHE)
 */
export async function removeBeneficiaireImpot(
  impotId: number,
  beneficiaireId: number
): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/impots/beneficiaires/supprimer_beneficiaire_impot.php`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          impot_id: impotId,
          beneficiaire_id: beneficiaireId,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la suppression du bénéficiaire",
      };
    }

    // ⚡ Invalider le cache des bénéficiaires de cet impôt
    await invalidateImpotsCache(impotId);

    return data;
  } catch (error) {
    console.error("Remove beneficiaire impot error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la suppression du bénéficiaire",
    };
  }
}

/**
 * 💾 Récupère un impôt par son ID (AVEC CACHE - 2 heures)
 */
export async function getImpotById(id: string): Promise<ApiResponse> {
  'use cache';
  const impotId = parseInt(id);
  cacheLife('hours');
  cacheTag(CACHE_TAGS.IMPOT_DETAILS(impotId));

  try {
    const response = await fetch(`${API_BASE_URL}/impots/get_impot_by_id.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Erreur lors de la récupération de l\'impôt',
      };
    }

    return {
      status: "success",
      data: await cleanImpotData(data.data),
    };
  } catch (error) {
    console.error('Get impot by id error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération de l\'impôt',
    };
  }
}

/**
 * 🌊 Vérifie si un impôt existe déjà par son nom (PAS DE CACHE)
 */
export async function checkImpotByNom(nom: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/impots/verifier_impot.php?nom=${encodeURIComponent(nom)}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la vérification de l'impôt",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Check impot by nom error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification de l'impôt",
    };
  }
}

/**
 * 💾 Recherche des impôts par statut (AVEC CACHE - 2 heures)
 */
export async function searchImpotsByStatus(actif: boolean, searchTerm?: string): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  const cacheKey = searchTerm ? `search-${searchTerm}` : 'all';
  cacheTag(CACHE_TAGS.IMPOTS_STATUT(actif), cacheKey);

  try {
    const params = new URLSearchParams({
      actif: actif.toString(),
    });
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }

    const response = await fetch(
      `${API_BASE_URL}/impots/rechercher_impots_par_statut.php?${params.toString()}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la recherche des impôts par statut",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanImpotData(item)))
      : [];

    return {
      status: "success",
      data: cleanedData,
    };
  } catch (error) {
    console.error("Search impots by status error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des impôts par statut",
    };
  }
}

/**
 * 💾 Récupère les impôts avec pagination (AVEC CACHE - 2 heures)
 */
export async function getImpotsPaginees(page: number = 1, limit: number = 10, searchTerm: string = ''): Promise<PaginationResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.IMPOTS_PAGINES(page, searchTerm));

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }

    const response = await fetch(
      `${API_BASE_URL}/impots/lister_impots_paginees.php?${params.toString()}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des impôts paginés",
      };
    }

    const cleanedData = Array.isArray(data.data?.impots)
      ? await Promise.all(data.data.impots.map(async (item: any) => await cleanImpotData(item)))
      : [];

    return {
      status: "success",
      data: {
        impots: cleanedData,
        pagination: data.data?.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    };
  } catch (error) {
    console.error("Get impots paginees error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des impôts paginés",
    };
  }
}