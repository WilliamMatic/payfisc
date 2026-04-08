"use server";

import { cacheLife, cacheTag } from "next/cache";
import { revalidateTag } from "next/cache";

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
  IMPOTS_LIST: "impots-list",
  IMPOTS_ACTIFS: "impots-actifs",
  IMPOT_DETAILS: (id: number) => `impot-${id}`,
  IMPOTS_SEARCH: "impots-search",
  IMPOTS_PAGINES: (page: number, search?: string) =>
    `impots-page-${page}-${search || ""}`,
  IMPOTS_STATUT: (actif: boolean) => `impots-statut-${actif}`,
  BENEFICIAIRES_IMPOT: (impotId: number) => `beneficiaires-impot-${impotId}`,
};

/**
 * Invalide le cache après une mutation avec stale-while-revalidate
 */
async function invalidateImpotsCache(impotId?: number) {
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

export async function cleanBeneficiaireData(
  data: any,
): Promise<BeneficiaireImpot> {
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
 * 💾 Récupère la liste de tous les impôts (AVEC CACHE - 2 jours)
 */
export async function getImpots(): Promise<ApiResponse> {
  "use cache";
  cacheLife("days");
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

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des impôts",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(
          data.data.map(async (item: any) => await cleanImpotData(item)),
        )
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
 * Récupère la liste des impôts actifs pour un site donné.
 * ⚠️ PAS de "use cache" global ici car le résultat dépend du site_code utilisateur.
 * On utilise revalidate HTTP côté fetch pour un cache léger.
 */
export async function getImpotsActifs(site_code: string): Promise<ApiResponse> {
  try {
    const url = `${API_BASE_URL}/impots/lister_impots_actifs.php?site_code=${encodeURIComponent(site_code)}`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (data.status === "error") {
      const data = await response.json().catch(() => ({}));
      return {
        status: "error",
        message: data.message || "Échec de la récupération des impôts actifs",
      };
    }


    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Erreur retournée par le serveur",
      };
    }

    const cleanedData: Impot[] = Array.isArray(data.data)
      ? data.data.map((item: any) => ({
          id: Number(item.id),
          nom: item.nom ?? "",
          description: item.description ?? "",
          periode: item.periode ?? "",
          delai_accord: Number(item.delai_accord ?? 0),
          prix: item.prix ?? "0",
          penalites: item.penalites ?? null,
          actif: Number(item.actif ?? 0),
          date_creation: item.date_creation ?? "",
          site_taxe_id: Number(item.site_taxe_id ?? 0),
          site_id: Number(item.site_id ?? 0),
          prix_site: item.prix_site ?? "0",
          site_taxe_status: Number(item.site_taxe_status ?? 0),
          site_taxe_date: item.site_taxe_date ?? "",
          site_nom: item.site_nom ?? "",
          site_code: item.site_code ?? "",
        }))
      : [];

    return {
      status: "success",
      data: cleanedData,
    };
  } catch (error) {
    console.error("getImpotsActifs error:", error);
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

    if (data.status === "error") {
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
  },
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

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec de la modification de l'impôt",
      };
    }

    // ⚡ Invalider le cache
    await invalidateImpotsCache();

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

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec de la suppression de l'impôt",
      };
    }

    // ⚡ Invalider le cache
    await invalidateImpotsCache();

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
  actif: boolean,
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
      },
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec du changement de statut de l'impôt",
      };
    }

    // ⚡ Invalider le cache
    await invalidateImpotsCache();

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
 * 💾 Recherche des impôts par terme (PAS DE CACHE)
 */
export async function searchImpots(searchTerm: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/impots/rechercher_impots.php?search=${encodeURIComponent(
        searchTerm,
      )}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec de la recherche des impôts",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(
          data.data.map(async (item: any) => await cleanImpotData(item)),
        )
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
 * 💾 Récupère les bénéficiaires d'un impôt (PAS DE CACHE)
 */
export async function getBeneficiairesImpot(
  impotId: number,
): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/impots/beneficiaires/lister_beneficiaires_impot.php?impot_id=${impotId}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des bénéficiaires",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(
          data.data.map(async (item: any) => await cleanBeneficiaireData(item)),
        )
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
      },
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec de l'ajout du bénéficiaire",
      };
    }

    // ⚡ Invalider le cache des bénéficiaires de cet impôt
    await invalidateImpotsCache();

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
  beneficiaireId: number,
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
      },
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec de la suppression du bénéficiaire",
      };
    }

    // ⚡ Invalider le cache des bénéficiaires de cet impôt
    await invalidateImpotsCache();

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
  try {
    const response = await fetch(`${API_BASE_URL}/impots/get_impot_by_id.php`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Erreur lors de la récupération de l'impôt",
      };
    }

    return {
      status: "success",
      data: await cleanImpotData(data.data),
    };
  } catch (error) {
    console.error("Get impot by id error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération de l'impôt",
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
      },
    );

    const data = await response.json();

    if (data.status === "error") {
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
export async function searchImpotsByStatus(
  actif: boolean,
  searchTerm?: string,
): Promise<ApiResponse> {
  try {
    const params = new URLSearchParams({
      actif: actif.toString(),
    });

    if (searchTerm) {
      params.append("search", searchTerm);
    }

    const response = await fetch(
      `${API_BASE_URL}/impots/rechercher_impots_par_statut.php?${params.toString()}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec de la recherche des impôts par statut",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(
          data.data.map(async (item: any) => await cleanImpotData(item)),
        )
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
export async function getImpotsPaginees(
  page: number = 1,
  limit: number = 10,
  searchTerm: string = "",
): Promise<PaginationResponse> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (searchTerm) {
      params.append("search", searchTerm);
    }

    const response = await fetch(
      `${API_BASE_URL}/impots/lister_impots_paginees.php?${params.toString()}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des impôts paginés",
      };
    }

    const cleanedData = Array.isArray(data.data?.impots)
      ? await Promise.all(
          data.data.impots.map(async (item: any) => await cleanImpotData(item)),
        )
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

/**
 * 🔄 Revalide manuellement tous les caches des impôts
 * Cette fonction est une Server Action qui peut être appelée depuis le client
 */
/**
 * 🔄 Revalide manuellement tous les caches des impôts et recharge les données
 * Cette fonction est une Server Action qui peut être appelée depuis le client
 */
export async function revalidateImpotsCache(): Promise<ApiResponse> {
  "use server";

  try {
    // Invalider tous les tags de cache liés aux impôts
    await invalidateImpotsCache();

    // Recharger les données pour les remettre en cache
    const [impotsResult, impotsActifsResult] = await Promise.all([
      getImpots(),
      getImpotsActifs("default_site_code"), // Remplacer par le site_code approprié
    ]);

    // Vérifier si les rechargements ont réussi
    const hasErrors =
      impotsResult.status === "error" || impotsActifsResult.status === "error";

    if (hasErrors) {
      return {
        status: "error", // Changé de "warning" à "error"
        message: "Cache revalidé mais certains rechargements ont échoué",
        data: {
          impots: impotsResult.status === "success" ? impotsResult.data : null,
          impotsActifs:
            impotsActifsResult.status === "success"
              ? impotsActifsResult.data
              : null,
        },
      };
    }

    return {
      status: "success",
      message: "Cache revalidé et données rechargées avec succès",
      data: {
        impots: impotsResult.data,
        impotsActifs: impotsActifsResult.data,
      },
    };
  } catch (error) {
    console.error("Revalidate cache error:", error);
    return {
      status: "error",
      message: "Erreur lors de la revalidation du cache",
    };
  }
}
