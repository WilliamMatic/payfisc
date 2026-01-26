'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Server Actions pour la gestion des bénéficiaires avec Cache Components Next.js 16
 */

// Interface pour les données d'un bénéficiaire
export interface BeneficiaireImpot {
  id: number;
  impot_id: number;
  beneficiaire_id: number;
  province_id: number | null;
  province_nom: string | null;
  province_code: string | null;
  type_part: "pourcentage" | "montant_fixe";
  valeur_part: number;
  nom: string;
  telephone: string;
  numero_compte: string;
}

export interface Province {
  id: number;
  nom: string;
  code: string;
}

export interface BeneficiaireParProvince {
  province_id: number | null;
  province_nom: string;
  province_code: string | null;
  beneficiaires: BeneficiaireImpot[];
}

export interface Beneficiaire {
  id: number;
  nom: string;
  telephone: string;
  numero_compte: string;
  actif: boolean;
  date_creation: string;
}

// Interface pour les réponses de l'API
export interface ApiResponse {
  status: "success" | "error";
  message?: string;
  data?: any;
}

// Interface pour la pagination
export interface PaginationResponse {
  status: "success" | "error";
  message?: string;
  data?: {
    beneficiaires: Beneficiaire[];
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
  BENEFICIAIRES_LIST: 'beneficiaires-list',
  BENEFICIAIRES_ACTIFS: 'beneficiaires-actifs',
  BENEFICIAIRE_DETAILS: (id: number) => `beneficiaire-${id}`,
  BENEFICIAIRES_SEARCH: 'beneficiaires-search',
  PROVINCES_LIST: 'provinces-list-beneficiaires',
  BENEFICIAIRES_IMPOT: (impotId: number) => `beneficiaires-impot-${impotId}`,
  BENEFICIAIRES_DISPONIBLES: (impotId: number, provinceId?: number) => 
    `beneficiaires-disponibles-${impotId}-${provinceId || 'all'}`,
};

/**
 * Invalide le cache après une mutation avec stale-while-revalidate
 */
async function invalidateBeneficiairesCache(beneficiaireId?: number) {
  'use server';
  
  revalidateTag(CACHE_TAGS.BENEFICIAIRES_LIST, "max");
  revalidateTag(CACHE_TAGS.BENEFICIAIRES_ACTIFS, "max");
  revalidateTag(CACHE_TAGS.BENEFICIAIRES_SEARCH, "max");
  
  if (beneficiaireId) {
    revalidateTag(CACHE_TAGS.BENEFICIAIRE_DETAILS(beneficiaireId), "max");
  }
}

// Nettoyer les données
export async function cleanBeneficiaireData(data: any): Promise<Beneficiaire> {
  return {
    id: data.id || 0,
    nom: data.nom || "",
    telephone: data.telephone || "",
    numero_compte: data.numero_compte || "",
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
 * 💾 Récupère la liste de tous les bénéficiaires (AVEC CACHE - 2 heures)
 */
export async function getBeneficiaires(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.BENEFICIAIRES_LIST);

  try {
    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/lister_beneficiaires.php`,
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
    console.error("Get bénéficiaires error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des bénéficiaires",
    };
  }
}

/**
 * 💾 Récupère la liste des bénéficiaires actifs (AVEC CACHE - 2 heures)
 */
export async function getBeneficiairesActifs(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.BENEFICIAIRES_ACTIFS);

  try {
    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/lister_beneficiaires_actifs.php`,
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
        message: data.message || "Échec de la récupération des bénéficiaires actifs",
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
    console.error("Get bénéficiaires actifs error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des bénéficiaires actifs",
    };
  }
}

/**
 * 🔄 Ajoute un nouveau bénéficiaire (INVALIDE LE CACHE)
 */
export async function addBeneficiaire(beneficiaireData: {
  nom: string;
  telephone: string;
  numero_compte: string;
}): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("nom", beneficiaireData.nom);
    formData.append("telephone", beneficiaireData.telephone);
    formData.append("numero_compte", beneficiaireData.numero_compte);

    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/creer_beneficiaire.php`,
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
        message: data.message || "Échec de l'ajout du bénéficiaire",
      };
    }

    await invalidateBeneficiairesCache();

    return data;
  } catch (error) {
    console.error("Add bénéficiaire error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'ajout du bénéficiaire",
    };
  }
}

/**
 * 🔄 Modifie un bénéficiaire existant (INVALIDE LE CACHE)
 */
export async function updateBeneficiaire(
  id: number,
  beneficiaireData: {
    nom: string;
    telephone: string;
    numero_compte: string;
  }
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("nom", beneficiaireData.nom);
    formData.append("telephone", beneficiaireData.telephone);
    formData.append("numero_compte", beneficiaireData.numero_compte);

    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/modifier_beneficiaire.php`,
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
        message: data.message || "Échec de la modification du bénéficiaire",
      };
    }

    await invalidateBeneficiairesCache(id);

    return data;
  } catch (error) {
    console.error("Update bénéficiaire error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la modification du bénéficiaire",
    };
  }
}

/**
 * 🔄 Supprime un bénéficiaire (INVALIDE LE CACHE)
 */
export async function deleteBeneficiaire(id: number): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());

    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/supprimer_beneficiaire.php`,
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
        message: data.message || "Échec de la suppression du bénéficiaire",
      };
    }

    await invalidateBeneficiairesCache(id);

    return data;
  } catch (error) {
    console.error("Delete bénéficiaire error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la suppression du bénéficiaire",
    };
  }
}

/**
 * 🔄 Change le statut d'un bénéficiaire (actif/inactif) (INVALIDE LE CACHE)
 */
export async function toggleBeneficiaireStatus(
  id: number,
  actif: boolean
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("actif", actif.toString());

    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/changer_statut_beneficiaire.php`,
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
        message:
          data.message || "Échec du changement de statut du bénéficiaire",
      };
    }

    await invalidateBeneficiairesCache(id);

    return data;
  } catch (error) {
    console.error("Toggle bénéficiaire status error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors du changement de statut du bénéficiaire",
    };
  }
}

/**
 * 💾 Recherche des bénéficiaires (AVEC CACHE - 2 heures)
 */
export async function searchBeneficiaires(
  searchTerm: string
): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.BENEFICIAIRES_SEARCH, `search-${searchTerm}`);

  try {
    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/rechercher_beneficiaires.php?search=${encodeURIComponent(
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
        message: data.message || "Échec de la recherche des bénéficiaires",
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
    console.error("Search bénéficiaires error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des bénéficiaires",
    };
  }
}

/**
 * 💾 Récupère les bénéficiaires d'un impôt groupés par province (AVEC CACHE - 2 heures)
 */
export async function getBeneficiairesImpot(
  impotId: number
): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.BENEFICIAIRES_IMPOT(impotId));

  try {
    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/lister_beneficiaires_impot.php?impot_id=${impotId}`,
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

    return {
      status: "success",
      data: data.data as BeneficiaireParProvince[],
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
 * 💾 Récupère toutes les provinces (AVEC CACHE - 2 heures)
 */
export async function getProvinces(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.PROVINCES_LIST);

  try {
    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/get_provinces.php`,
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
        message: data.message || "Échec de la récupération des provinces",
      };
    }

    return {
      status: "success",
      data: data.data as Province[],
    };
  } catch (error) {
    console.error("Get provinces error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des provinces",
    };
  }
}

/**
 * 💾 Récupère les bénéficiaires disponibles pour un impôt et une province (AVEC CACHE - 2 heures)
 */
export async function getBeneficiairesDisponibles(
  impotId: number,
  provinceId?: number
): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.BENEFICIAIRES_DISPONIBLES(impotId, provinceId));

  try {
    const url = provinceId !== undefined
      ? `${API_BASE_URL}/beneficiaires/get_beneficiaires_disponibles.php?impot_id=${impotId}&province_id=${provinceId}`
      : `${API_BASE_URL}/beneficiaires/get_beneficiaires_disponibles.php?impot_id=${impotId}`;

    const response = await fetch(url, {
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
        message: data.message || "Échec de la récupération des bénéficiaires disponibles",
      };
    }

    return {
      status: "success",
      data: data.data as Beneficiaire[],
    };
  } catch (error) {
    console.error("Get beneficiaires disponibles error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des bénéficiaires disponibles",
    };
  }
}

/**
 * 🔄 Ajoute un bénéficiaire à un impôt pour une province spécifique (INVALIDE LE CACHE)
 */
export async function addBeneficiaireImpot(beneficiaireData: {
  impot_id: number;
  beneficiaire_id: number;
  province_id?: number | null;
  type_part: "pourcentage" | "montant_fixe";
  valeur_part: number;
}): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/ajouter_beneficiaire_impot.php`,
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

    // Invalider les caches spécifiques à cet impôt
    revalidateTag(CACHE_TAGS.BENEFICIAIRES_IMPOT(beneficiaireData.impot_id), "max");
    revalidateTag(CACHE_TAGS.BENEFICIAIRES_DISPONIBLES(beneficiaireData.impot_id, beneficiaireData.province_id || undefined), "max");

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
 * 🔄 Supprime un bénéficiaire d'un impôt pour une province spécifique (INVALIDE LE CACHE)
 */
export async function removeBeneficiaireImpot(
  impotId: number,
  beneficiaireId: number,
  provinceId?: number | null
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
          province_id: provinceId
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

    // Invalider les caches spécifiques à cet impôt
    revalidateTag(CACHE_TAGS.BENEFICIAIRES_IMPOT(impotId), "max");
    revalidateTag(CACHE_TAGS.BENEFICIAIRES_DISPONIBLES(impotId, provinceId || undefined), "max");

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
 * 💾 Récupère un bénéficiaire par son ID (AVEC CACHE - 2 heures)
 */
export async function getBeneficiaireById(id: number): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.BENEFICIAIRE_DETAILS(id));

  try {
    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/get_beneficiaire.php?id=${id}`,
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
        message: data.message || "Échec de la récupération du bénéficiaire",
      };
    }

    return {
      status: "success",
      data: await cleanBeneficiaireData(data.data),
    };
  } catch (error) {
    console.error("Get bénéficiaire by ID error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération du bénéficiaire",
    };
  }
}

/**
 * 🌊 Vérifie si un bénéficiaire existe déjà par son numéro de compte (PAS DE CACHE)
 */
export async function checkBeneficiaireByNumeroCompte(numeroCompte: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/verifier_beneficiaire.php?numero_compte=${encodeURIComponent(numeroCompte)}`,
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
        message: data.message || "Échec de la vérification du bénéficiaire",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Check bénéficiaire by numero compte error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification du bénéficiaire",
    };
  }
}

/**
 * 💾 Récupère les bénéficiaires avec pagination (AVEC CACHE - 2 heures)
 */
export async function getBeneficiairesPaginees(page: number = 1, limit: number = 10, searchTerm: string = ''): Promise<PaginationResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.BENEFICIAIRES_LIST, `page-${page}-search-${searchTerm}`);

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }

    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/lister_beneficiaires_paginees.php?${params.toString()}`,
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
        message: data.message || "Échec de la récupération des bénéficiaires paginés",
      };
    }

    const cleanedData = Array.isArray(data.data?.beneficiaires)
      ? await Promise.all(data.data.beneficiaires.map(async (item: any) => await cleanBeneficiaireData(item)))
      : [];

    return {
      status: "success",
      data: {
        beneficiaires: cleanedData,
        pagination: data.data?.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    };
  } catch (error) {
    console.error("Get bénéficiaires paginees error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des bénéficiaires paginés",
    };
  }
}