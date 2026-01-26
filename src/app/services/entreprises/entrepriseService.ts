'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Server Actions pour la gestion des entreprises avec Cache Components Next.js 16
 */

// Interface pour les données d'une entreprise
export interface Entreprise {
  id: number;
  raison_sociale: string;
  forme_juridique: string;
  nif: string;
  registre_commerce: string;
  date_creation: string;
  adresse_siege: string;
  telephone: string;
  email: string;
  representant_legal: string;
  actif: boolean;
  date_creation_enregistrement: string;
  reduction_type: 'pourcentage' | 'fixe' | null;
  reduction_valeur: number;
}

// Interface pour les réponses de l'API
export interface ApiResponse {
  status: "success" | "error";
  message?: string;
  data?: any;
}

// URL de base de l'API
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls/entreprises";

// Tags de cache pour invalidation ciblée
const CACHE_TAGS = {
  ENTREPRISES_LIST: 'entreprises-list',
  ENTREPRISES_ACTIVES: 'entreprises-actives',
  ENTREPRISE_DETAILS: (id: number) => `entreprise-${id}`,
  ENTREPRISES_SEARCH: (searchTerm: string) => `entreprises-search-${searchTerm}`,
  ENTREPRISES_NIF: (nif: string) => `entreprises-nif-${nif}`,
  ENTREPRISES_REGISTRE: (registre: string) => `entreprises-registre-${registre}`,
};

/**
 * Invalide le cache après une mutation avec stale-while-revalidate
 */
async function invalidateEntreprisesCache(entrepriseId?: number) {
  'use server';
  
  // Utilisation de profile="max" pour stale-while-revalidate
  revalidateTag(CACHE_TAGS.ENTREPRISES_LIST, "max");
  revalidateTag(CACHE_TAGS.ENTREPRISES_ACTIVES, "max");
  revalidateTag(CACHE_TAGS.ENTREPRISES_SEARCH(''), "max"); // Pattern général pour les recherches
  
  if (entrepriseId) {
    revalidateTag(CACHE_TAGS.ENTREPRISE_DETAILS(entrepriseId), "max");
  }
}

// Nettoyer les données
export async function cleanEntrepriseData(data: any): Promise<Entreprise> {
  return {
    id: data.id || 0,
    raison_sociale: data.raison_sociale || "",
    forme_juridique: data.forme_juridique || "",
    nif: data.nif || "",
    registre_commerce: data.registre_commerce || "",
    date_creation: data.date_creation || "",
    adresse_siege: data.adresse_siege || "",
    telephone: data.telephone || "",
    email: data.email || "",
    representant_legal: data.representant_legal || "",
    actif: Boolean(data.actif),
    date_creation_enregistrement: data.date_creation_enregistrement || "",
    reduction_type: data.reduction_type || null,
    reduction_valeur: data.reduction_valeur || 0,
  };
}

/**
 * 💾 Récupère la liste de toutes les entreprises (AVEC CACHE - 2 heures)
 * Cache Component avec revalidation toutes les 2 heures
 */
export async function getEntreprises(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.ENTREPRISES_LIST);

  try {
    const response = await fetch(
      `${API_BASE_URL}/entreprises/lister_entreprises.php`,
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
        message: data.message || "Échec de la récupération des entreprises",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanEntrepriseData(item)))
      : [];

    return {
      status: "success",
      data: cleanedData,
    };
  } catch (error) {
    console.error("Get entreprises error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des entreprises",
    };
  }
}

/**
 * 💾 Récupère la liste des entreprises actives (AVEC CACHE - 2 heures)
 * Cache Component avec tag spécifique pour les actives
 */
export async function getEntreprisesActives(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.ENTREPRISES_ACTIVES);

  try {
    const response = await fetch(
      `${API_BASE_URL}/entreprises/lister_entreprises_actives.php`,
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
        message: data.message || "Échec de la récupération des entreprises actives",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanEntrepriseData(item)))
      : [];

    return {
      status: "success",
      data: cleanedData,
    };
  } catch (error) {
    console.error("Get entreprises actives error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des entreprises actives",
    };
  }
}

/**
 * 💾 Recherche des entreprises selon un terme (AVEC CACHE - 2 heures)
 * Cache Component avec tag de recherche
 */
export async function searchEntreprises(
  searchTerm: string
): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.ENTREPRISES_SEARCH(searchTerm));

  try {
    const response = await fetch(
      `${API_BASE_URL}/entreprises/rechercher_entreprises.php?search=${encodeURIComponent(
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
        message: data.message || "Échec de la recherche des entreprises",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanEntrepriseData(item)))
      : [];

    return {
      status: "success",
      data: cleanedData,
    };
  } catch (error) {
    console.error("Search entreprises error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des entreprises",
    };
  }
}

/**
 * 🔄 Ajoute une nouvelle entreprise (INVALIDE LE CACHE)
 * Mutation qui invalide tous les caches de listes
 */
export async function addEntreprise(entrepriseData: {
  raison_sociale: string;
  forme_juridique: string;
  nif: string;
  registre_commerce: string;
  date_creation: string;
  adresse_siege: string;
  telephone: string;
  email: string;
  representant_legal: string;
  reduction_type?: 'pourcentage' | 'fixe' | null;
  reduction_valeur?: number;
  utilisateur_id?: number;
  site_code?: string;
}): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("raison_sociale", entrepriseData.raison_sociale);
    formData.append("forme_juridique", entrepriseData.forme_juridique);
    formData.append("nif", entrepriseData.nif);
    formData.append("registre_commerce", entrepriseData.registre_commerce);
    formData.append("date_creation", entrepriseData.date_creation);
    formData.append("adresse_siege", entrepriseData.adresse_siege);
    formData.append("telephone", entrepriseData.telephone);
    formData.append("email", entrepriseData.email);
    formData.append("representant_legal", entrepriseData.representant_legal);

    // Ajouter les champs de réduction
    if (entrepriseData.reduction_type !== undefined)
      formData.append("reduction_type", entrepriseData.reduction_type || '');
    if (entrepriseData.reduction_valeur !== undefined)
      formData.append("reduction_valeur", entrepriseData.reduction_valeur.toString());

    // Ajouter les nouveaux champs s'ils existent
    if (entrepriseData.utilisateur_id) {
      formData.append(
        "utilisateur_id",
        entrepriseData.utilisateur_id.toString()
      );
    }
    if (entrepriseData.site_code) {
      formData.append("site_code", entrepriseData.site_code);
    }

    const response = await fetch(
      `${API_BASE_URL}/entreprises/creer_entreprise.php`,
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
        message: data.message || "Échec de l'ajout de l'entreprise",
      };
    }

    // ⚡ Invalider tous les caches de listes après ajout
    await invalidateEntreprisesCache();

    return data;
  } catch (error) {
    console.error("Add entreprise error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'ajout de l'entreprise",
    };
  }
}

/**
 * 🔄 Modifie une entreprise existante (INVALIDE LE CACHE)
 * Mutation qui invalide le cache spécifique et les listes
 */
export async function updateEntreprise(
  id: number,
  entrepriseData: {
    raison_sociale: string;
    forme_juridique: string;
    nif: string;
    registre_commerce: string;
    date_creation: string;
    adresse_siege: string;
    telephone: string;
    email: string;
    representant_legal: string;
    reduction_type?: 'pourcentage' | 'fixe' | null;
    reduction_valeur?: number;
  }
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("raison_sociale", entrepriseData.raison_sociale);
    formData.append("forme_juridique", entrepriseData.forme_juridique);
    formData.append("nif", entrepriseData.nif);
    formData.append("registre_commerce", entrepriseData.registre_commerce);
    formData.append("date_creation", entrepriseData.date_creation);
    formData.append("adresse_siege", entrepriseData.adresse_siege);
    formData.append("telephone", entrepriseData.telephone);
    formData.append("email", entrepriseData.email);
    formData.append("representant_legal", entrepriseData.representant_legal);

    // Ajouter les champs de réduction
    if (entrepriseData.reduction_type !== undefined)
      formData.append("reduction_type", entrepriseData.reduction_type || '');
    if (entrepriseData.reduction_valeur !== undefined)
      formData.append("reduction_valeur", entrepriseData.reduction_valeur.toString());

    const response = await fetch(
      `${API_BASE_URL}/entreprises/modifier_entreprise.php`,
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
        message: data.message || "Échec de la modification de l'entreprise",
      };
    }

    // ⚡ Invalider le cache de cette entreprise spécifique + les listes
    await invalidateEntreprisesCache(id);

    return data;
  } catch (error) {
    console.error("Update entreprise error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la modification de l'entreprise",
    };
  }
}

/**
 * 🔄 Supprime une entreprise (INVALIDE LE CACHE)
 * Mutation qui invalide le cache spécifique et les listes
 */
export async function deleteEntreprise(id: number): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());

    const response = await fetch(
      `${API_BASE_URL}/entreprises/supprimer_entreprise.php`,
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
        message: data.message || "Échec de la suppression de l'entreprise",
      };
    }

    // ⚡ Invalider le cache de cette entreprise + les listes
    await invalidateEntreprisesCache(id);

    return data;
  } catch (error) {
    console.error("Delete entreprise error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la suppression de l'entreprise",
    };
  }
}

/**
 * 🔄 Change le statut d'une entreprise (INVALIDE LE CACHE)
 * Mutation qui invalide le cache spécifique et les listes actifs/inactifs
 */
export async function toggleEntrepriseStatus(
  id: number,
  actif: boolean
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("actif", actif.toString());

    const response = await fetch(
      `${API_BASE_URL}/entreprises/changer_statut_entreprise.php`,
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
          data.message || "Échec du changement de statut de l'entreprise",
      };
    }

    // ⚡ Invalider le cache (important car affecte la liste actifs)
    await invalidateEntreprisesCache(id);

    return data;
  } catch (error) {
    console.error("Toggle entreprise status error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors du changement de statut de l'entreprise",
    };
  }
}

/**
 * 🌊 Vérifie si une entreprise existe déjà par son NIF (PAS DE CACHE)
 * Fonction de vérification sans cache pour avoir des données toujours à jour
 */
export async function checkEntrepriseByNIF(nif: string): Promise<ApiResponse> {
  // Pas de cache pour les vérifications d'existence
  // Les données doivent être fraîches pour éviter les doublons
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/entreprises/verifier_nif.php?nif=${encodeURIComponent(nif)}`,
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
        message: data.message || "Échec de la vérification du NIF",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Check entreprise by NIF error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification du NIF",
    };
  }
}

/**
 * 💾 Récupère une entreprise par son ID (AVEC CACHE - 2 heures)
 * Cache Component avec tag spécifique par ID
 */
export async function getEntrepriseById(id: number): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.ENTREPRISE_DETAILS(id));

  try {
    const response = await fetch(
      `${API_BASE_URL}/entreprises/get_entreprise.php?id=${id}`,
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
        message: data.message || "Échec de la récupération de l'entreprise",
      };
    }

    return {
      status: "success",
      data: await cleanEntrepriseData(data.data),
    };
  } catch (error) {
    console.error("Get entreprise by ID error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération de l'entreprise",
    };
  }
}

/**
 * 🌊 Vérifie si une entreprise existe déjà par son registre de commerce (PAS DE CACHE)
 * Fonction de vérification sans cache pour avoir des données toujours à jour
 */
export async function checkEntrepriseByRegistreCommerce(registre: string): Promise<ApiResponse> {
  // Pas de cache pour les vérifications d'existence
  // Les données doivent être fraîches pour éviter les doublons
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/entreprises/verifier_registre.php?registre=${encodeURIComponent(registre)}`,
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
        message: data.message || "Échec de la vérification du registre de commerce",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Check entreprise by registre commerce error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification du registre de commerce",
    };
  }
}

/**
 * 💾 Recherche des entreprises par téléphone (AVEC CACHE - 2 heures)
 * Extension possible pour des recherches spécifiques
 */
export async function searchEntreprisesByTelephone(
  telephone: string
): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.ENTREPRISES_SEARCH(`tel-${telephone}`));

  try {
    const response = await fetch(
      `${API_BASE_URL}/entreprises/rechercher_entreprises_par_telephone.php?telephone=${encodeURIComponent(
        telephone
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
        message: data.message || "Échec de la recherche par téléphone",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanEntrepriseData(item)))
      : [];

    return {
      status: "success",
      data: cleanedData,
    };
  } catch (error) {
    console.error("Search entreprises by telephone error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche par téléphone",
    };
  }
}

/**
 * 💾 Récupère les entreprises avec pagination (AVEC CACHE - 2 heures)
 * Extension pour support de pagination
 */
export async function getEntreprisesPaginees(
  page: number = 1,
  limit: number = 10,
  searchTerm: string = ''
): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.ENTREPRISES_LIST, `page-${page}-limit-${limit}-search-${searchTerm}`);

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }

    const response = await fetch(
      `${API_BASE_URL}/entreprises/lister_entreprises_paginees.php?${params.toString()}`,
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
        message: data.message || "Échec de la récupération des entreprises paginées",
      };
    }

    // Structure de réponse paginée
    if (data.data && data.data.entreprises) {
      data.data.entreprises = await Promise.all(
        data.data.entreprises.map(async (item: any) => await cleanEntrepriseData(item))
      );
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Get entreprises paginees error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des entreprises paginées",
    };
  }
}