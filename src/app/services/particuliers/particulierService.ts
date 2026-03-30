'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Server Actions pour la gestion des particuliers avec Cache Components Next.js 16
 */

// Interface pour les données d'un particulier
export interface Particulier {
  id: number;
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  sexe: string;
  rue: string;
  ville: string;
  code_postal: string;
  province: string;
  id_national: string;
  telephone: string;
  email: string;
  nif: string;
  situation_familiale: string;
  dependants: number;
  actif: boolean;
  date_creation: string;
  date_modification?: string;
  reduction_type: "pourcentage" | "montant_fixe" | null;
  reduction_valeur: number;
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
    particuliers: Particulier[];
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
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls/particuliers";

// Tags de cache pour invalidation ciblée
const CACHE_TAGS = {
  PARTICULIERS_LIST: 'particuliers-list',
  PARTICULIERS_ACTIFS: 'particuliers-actifs',
  PARTICULIER_DETAILS: (id: number) => `particulier-${id}`,
  PARTICULIERS_SEARCH: 'particuliers-search',
};

/**
 * Invalide le cache après une mutation avec stale-while-revalidate
 * profile="max" = contenu stale servi immédiatement, frais chargé en arrière-plan
 */
async function invalidateParticuliersCache(particulierId?: number) {
  'use server';
  
  // ⚡ Utilisation de profile="max" pour stale-while-revalidate
  revalidateTag(CACHE_TAGS.PARTICULIERS_LIST, "max");
  revalidateTag(CACHE_TAGS.PARTICULIERS_ACTIFS, "max");
  revalidateTag(CACHE_TAGS.PARTICULIERS_SEARCH, "max");
  
  if (particulierId) {
    revalidateTag(CACHE_TAGS.PARTICULIER_DETAILS(particulierId), "max");
  }
}

// Nettoyer les données
export async function cleanParticulierData(data: any): Promise<Particulier> {
  return {
    id: data.id || 0,
    nom: data.nom || "",
    prenom: data.prenom || "",
    date_naissance: data.date_naissance || "",
    lieu_naissance: data.lieu_naissance || "",
    sexe: data.sexe || "",
    rue: data.rue || "",
    ville: data.ville || "",
    code_postal: data.code_postal || "",
    province: data.province || "",
    id_national: data.id_national || "",
    telephone: data.telephone || "",
    email: data.email || "",
    nif: data.nif || "",
    situation_familiale: data.situation_familiale || "",
    dependants: data.dependants || 0,
    actif: Boolean(data.actif),
    date_creation: data.date_creation || "",
    date_modification: data.date_modification || "",
    reduction_type: data.reduction_type || null,
    reduction_valeur: data.reduction_valeur || 0,
  };
}

/**
 * 💾 Récupère la liste des particuliers avec pagination (AVEC CACHE - 2 heures)
 * Cache Component avec revalidation toutes les 2 heures
 */
export async function getParticuliers(
  page: number = 1,
  limit: number = 10,
  utilisateurId?: number
): Promise<PaginationResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.PARTICULIERS_LIST, `particuliers-page-${page}`);

  try {
    let url = `${API_BASE_URL}/particuliers/lister_particuliers.php?page=${page}&limit=${limit}`;
    if (utilisateurId !== undefined) {
      url += `&utilisateur=${utilisateurId}`;
    }

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
        message: data.message || "Échec de la récupération des particuliers",
      };
    }

    const cleanedData = Array.isArray(data.data?.particuliers)
      ? await Promise.all(data.data.particuliers.map(async (item: any) => await cleanParticulierData(item)))
      : [];

    return {
      status: "success",
      data: {
        particuliers: cleanedData,
        pagination: data.data?.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    };
  } catch (error) {
    console.error("Get particuliers error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des particuliers",
    };
  }
}

/**
 * 💾 Récupère les détails complets d'un particulier (AVEC CACHE - 2 heures)
 * Cache Component avec tag spécifique par ID
 */
export async function getParticulierDetails(
  id: number
): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.PARTICULIER_DETAILS(id));

  try {
    const formData = new FormData();
    formData.append("id", id.toString());

    const response = await fetch(
      `${API_BASE_URL}/particuliers/get_details_particulier.php`,
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
        message: data.message || "Échec de la récupération des détails",
      };
    }

    return {
      status: "success",
      data: await cleanParticulierData(data.data),
    };
  } catch (error) {
    console.error("Get particulier details error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des détails",
    };
  }
}

/**
 * 🔄 Ajoute un nouveau particulier (INVALIDE LE CACHE)
 * Mutation qui invalide tous les caches de listes
 */
export async function addParticulier(particulierData: {
  nom: string;
  prenom: string;
  date_naissance?: string;
  lieu_naissance?: string;
  sexe?: string;
  rue: string;
  ville?: string;
  code_postal?: string;
  province?: string;
  id_national?: string;
  telephone: string;
  email?: string;
  nif?: string;
  situation_familiale?: string;
  dependants?: number;
  reduction_type?: "pourcentage" | "montant_fixe" | null;
  reduction_valeur?: number;
  site?: string;
  utilisateur?: number;
}): Promise<ApiResponse> {
  try {
    const formData = new FormData();

    formData.append("nom", particulierData.nom);
    formData.append("prenom", particulierData.prenom);
    formData.append("telephone", particulierData.telephone);
    formData.append("rue", particulierData.rue);

    if (particulierData.nif) formData.append("nif", particulierData.nif);
    if (particulierData.date_naissance)
      formData.append("date_naissance", particulierData.date_naissance);
    if (particulierData.lieu_naissance)
      formData.append("lieu_naissance", particulierData.lieu_naissance);
    if (particulierData.sexe) formData.append("sexe", particulierData.sexe);
    if (particulierData.ville) formData.append("ville", particulierData.ville);
    if (particulierData.code_postal)
      formData.append("code_postal", particulierData.code_postal);
    if (particulierData.province)
      formData.append("province", particulierData.province);
    if (particulierData.id_national)
      formData.append("id_national", particulierData.id_national);
    if (particulierData.email) formData.append("email", particulierData.email);
    if (particulierData.situation_familiale)
      formData.append("situation_familiale", particulierData.situation_familiale);
    if (particulierData.dependants !== undefined)
      formData.append("dependants", particulierData.dependants.toString());

    if (particulierData.reduction_type !== undefined && particulierData.reduction_type !== null)
      formData.append("reduction_type", particulierData.reduction_type);
    if (particulierData.reduction_valeur !== undefined)
      formData.append("reduction_valeur", particulierData.reduction_valeur.toString());

    if (particulierData.utilisateur !== undefined)
      formData.append("utilisateur", String(particulierData.utilisateur));
    if (particulierData.site !== undefined)
      formData.append("site", String(particulierData.site));

    const response = await fetch(
      `${API_BASE_URL}/particuliers/creer_particulier.php`,
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
        message: data.message || "Échec de l'ajout du particulier",
      };
    }

    // ⚡ Invalider tous les caches de listes après ajout
    await invalidateParticuliersCache();

    return data;
  } catch (error) {
    console.error("Add particulier error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'ajout du particulier",
    };
  }
}

/**
 * 🔄 Modifie un particulier existant (INVALIDE LE CACHE)
 * Mutation qui invalide le cache spécifique et les listes
 */
export async function updateParticulier(
  id: number,
  particulierData: {
    nom: string;
    prenom: string;
    date_naissance?: string;
    lieu_naissance?: string;
    sexe?: string;
    rue: string;
    ville?: string;
    code_postal?: string;
    province?: string;
    id_national?: string;
    telephone: string;
    email?: string;
    nif?: string;
    situation_familiale?: string;
    dependants?: number;
    reduction_type?: "pourcentage" | "montant_fixe" | null;
    reduction_valeur?: number;
  }
): Promise<ApiResponse> {
  try {
    const formData = new FormData();

    formData.append("id", id.toString());
    formData.append("nom", particulierData.nom);
    formData.append("prenom", particulierData.prenom);
    formData.append("telephone", particulierData.telephone);
    formData.append("rue", particulierData.rue);

    if (particulierData.nif !== undefined)
      formData.append("nif", particulierData.nif || "");
    if (particulierData.date_naissance !== undefined)
      formData.append("date_naissance", particulierData.date_naissance || "");
    if (particulierData.lieu_naissance !== undefined)
      formData.append("lieu_naissance", particulierData.lieu_naissance || "");
    if (particulierData.sexe !== undefined)
      formData.append("sexe", particulierData.sexe || "");
    if (particulierData.ville !== undefined)
      formData.append("ville", particulierData.ville || "");
    if (particulierData.code_postal !== undefined)
      formData.append("code_postal", particulierData.code_postal || "");
    if (particulierData.province !== undefined)
      formData.append("province", particulierData.province || "");
    if (particulierData.id_national !== undefined)
      formData.append("id_national", particulierData.id_national || "");
    if (particulierData.email !== undefined)
      formData.append("email", particulierData.email || "");
    if (particulierData.situation_familiale !== undefined)
      formData.append("situation_familiale", particulierData.situation_familiale || "");
    if (particulierData.dependants !== undefined)
      formData.append("dependants", particulierData.dependants.toString());

    if (particulierData.reduction_type !== undefined)
      formData.append("reduction_type", particulierData.reduction_type || "");
    if (particulierData.reduction_valeur !== undefined)
      formData.append("reduction_valeur", particulierData.reduction_valeur.toString());

    const response = await fetch(
      `${API_BASE_URL}/particuliers/modifier_particulier.php`,
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
        message: data.message || "Échec de la modification du particulier",
      };
    }

    // ⚡ Invalider le cache de ce particulier spécifique + les listes
    await invalidateParticuliersCache(id);

    return data;
  } catch (error) {
    console.error("Update particulier error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la modification du particulier",
    };
  }
}

/**
 * 🔄 Supprime un particulier (INVALIDE LE CACHE)
 * Mutation qui invalide le cache spécifique et les listes
 */
export async function deleteParticulier(id: number): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());

    const response = await fetch(
      `${API_BASE_URL}/particuliers/supprimer_particulier.php`,
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
        message: data.message || "Échec de la suppression du particulier",
      };
    }

    // ⚡ Invalider le cache de ce particulier + les listes
    await invalidateParticuliersCache(id);

    return data;
  } catch (error) {
    console.error("Delete particulier error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la suppression du particulier",
    };
  }
}

/**
 * 🔄 Change le statut d'un particulier (INVALIDE LE CACHE)
 * Mutation qui invalide le cache spécifique et les listes actifs/inactifs
 */
export async function toggleParticulierStatus(
  id: number,
  actif: boolean
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("actif", actif.toString());

    const response = await fetch(
      `${API_BASE_URL}/particuliers/changer_statut_particulier.php`,
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
        message: data.message || "Échec du changement de statut du particulier",
      };
    }

    // ⚡ Invalider le cache (important car affecte la liste actifs)
    await invalidateParticuliersCache(id);

    return data;
  } catch (error) {
    console.error("Toggle particulier status error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors du changement de statut du particulier",
    };
  }
}

/**
 * 💾 Recherche des particuliers (AVEC CACHE - 2 heures)
 * Cache Component avec tag de recherche
 */
export async function searchParticuliers(
  searchTerm: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginationResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.PARTICULIERS_SEARCH, `search-${searchTerm}-page-${page}`);

  try {
    const response = await fetch(
      `${API_BASE_URL}/particuliers/rechercher_particuliers.php`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          search: searchTerm,
          page: page,
          limit: limit,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la recherche des particuliers",
      };
    }

    const cleanedData = Array.isArray(data.data?.particuliers)
      ? await Promise.all(data.data.particuliers.map(async (item: any) => await cleanParticulierData(item)))
      : [];

    return {
      status: "success",
      data: {
        particuliers: cleanedData,
        pagination: data.data?.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    };
  } catch (error) {
    console.error("Search particuliers error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des particuliers",
    };
  }
}

/**
 * 💾 Récupère la liste des particuliers actifs (AVEC CACHE - 2 heures)
 * Cache Component avec tag spécifique pour les actifs
 */
export async function getParticuliersActifs(
  page: number = 1,
  limit: number = 10,
  utilisateurId?: number
): Promise<PaginationResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.PARTICULIERS_ACTIFS, `particuliers-actifs-page-${page}`);

  try {
    let url = `${API_BASE_URL}/particuliers/lister_particuliers_actifs.php?page=${page}&limit=${limit}`;
    if (utilisateurId !== undefined) {
      url += `&utilisateur=${utilisateurId}`;
    }

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
        message: data.message || "Échec de la récupération des particuliers actifs",
      };
    }

    const cleanedData = Array.isArray(data.data?.particuliers)
      ? await Promise.all(data.data.particuliers.map(async (item: any) => await cleanParticulierData(item)))
      : [];

    return {
      status: "success",
      data: {
        particuliers: cleanedData,
        pagination: data.data?.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    };
  } catch (error) {
    console.error("Get particuliers actifs error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des particuliers actifs",
    };
  }
}

/**
 * 🌊 Vérifie si un particulier existe par NIF (PAS DE CACHE - données fraîches)
 * Fonction de vérification sans cache pour avoir des données toujours à jour
 */
export async function checkParticulierByNIF(nif: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/particuliers/verifier_particulier.php?nif=${encodeURIComponent(nif)}`,
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
        message: data.message || "Échec de la vérification du particulier",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Check particulier by NIF error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification du particulier",
    };
  }
}

/**
 * 🌊 Vérifie si un particulier existe par ID national (PAS DE CACHE - données fraîches)
 * Fonction de vérification sans cache pour avoir des données toujours à jour
 */
export async function checkParticulierByIdNational(idNational: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/particuliers/verifier_particulier_id_national.php?id_national=${encodeURIComponent(idNational)}`,
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
        message: data.message || "Échec de la vérification de l'ID national",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Check particulier by ID national error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification de l'ID national",
    };
  }
}

/**
 * 💾 Recherche par téléphone (AVEC CACHE - 2 heures)
 * Cache Component avec tag de recherche par téléphone
 */
export async function searchParticuliersByTelephone(
  telephone: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginationResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.PARTICULIERS_SEARCH, `search-tel-${telephone}-page-${page}`);

  try {
    const response = await fetch(
      `${API_BASE_URL}/particuliers/rechercher_particuliers_par_telephone.php`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telephone: telephone,
          page: page,
          limit: limit,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la recherche par téléphone",
      };
    }

    const cleanedData = Array.isArray(data.data?.particuliers)
      ? await Promise.all(data.data.particuliers.map(async (item: any) => await cleanParticulierData(item)))
      : [];

    return {
      status: "success",
      data: {
        particuliers: cleanedData,
        pagination: data.data?.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    };
  } catch (error) {
    console.error("Search particuliers by telephone error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche par téléphone",
    };
  }
}

/**
 * Modification simplifiée d'un assujetti (nom_complet, telephone, adresse, nif, email)
 * Utilisé depuis les modals de détails (suppression-vignette, suppression-controle-technique)
 */
export async function updateAssujettiSimple(
  id: number,
  data: {
    nom_complet: string;
    telephone: string;
    adresse: string;
    nif?: string;
    email?: string;
  }
): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/particuliers/modifier_assujetti_simple.php`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: result.message || "Échec de la modification",
      };
    }

    return result;
  } catch (error) {
    console.error("Update assujetti simple error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la modification",
    };
  }
}