"use server";

import { cacheLife, cacheTag } from "next/cache";
import { revalidateTag } from "next/cache";

/**
 * Server Actions pour la gestion des couleurs d'engins avec Cache Components Next.js 16
 */

// Interface pour les données d'une couleur
export interface EnginCouleur {
  id: number;
  nom: string;
  code_hex: string;
  created_at?: string;
  updated_at?: string;
  statut?: string;
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
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls";

// Tags de cache pour invalidation ciblée
const CACHE_TAGS = {
  COULEURS_LIST: "couleurs-list",
  COULEURS_ACTIVES: "couleurs-actives",
  COULEUR_DETAILS: (id: number) => `couleur-${id}`,
  COULEURS_SEARCH: "couleurs-search",
};

/**
 * Invalide le cache après une mutation
 */
async function invalidateCouleursCache(couleurId?: number) {
  "use server";

  revalidateTag(CACHE_TAGS.COULEURS_LIST, "max");
  revalidateTag(CACHE_TAGS.COULEURS_ACTIVES, "max");
  revalidateTag(CACHE_TAGS.COULEURS_SEARCH, "max");

  if (couleurId) {
    revalidateTag(CACHE_TAGS.COULEUR_DETAILS(couleurId), "max");
  }
}

// Nettoyer les données
export async function cleanCouleurData(data: any): Promise<EnginCouleur> {
  return {
    id: data.id || 0,
    nom: data.nom || "",
    code_hex: data.code_hex || "#000000",
  };
}

/**
 * 💾 Récupère la liste de toutes les couleurs (AVEC CACHE - 2 heures)
 */
export async function getCouleurs(): Promise<ApiResponse> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.COULEURS_LIST);

  try {
    const response = await fetch(
      `${API_BASE_URL}/couleurs/lister_couleurs.php`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des couleurs",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(
          data.data.map(async (item: any) => await cleanCouleurData(item)),
        )
      : [];

    return {
      status: "success",
      data: cleanedData,
    };
  } catch (error) {
    console.error("Get couleurs error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des couleurs",
    };
  }
}

/**
 * 💾 Récupère la liste des couleurs actives (AVEC CACHE - 2 heures)
 */
export async function getCouleursActives(): Promise<ApiResponse> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.COULEURS_ACTIVES);

  try {
    const response = await fetch(
      `${API_BASE_URL}/couleurs/lister_couleurs_actives.php`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message:
          data.message || "Échec de la récupération des couleurs actives",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(
          data.data.map(async (item: any) => await cleanCouleurData(item)),
        )
      : [];

    return {
      status: "success",
      data: cleanedData,
    };
  } catch (error) {
    console.error("Get couleurs actives error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des couleurs actives",
    };
  }
}

/**
 * 🔄 Ajoute une nouvelle couleur (INVALIDE LE CACHE)
 */
export async function addCouleur(couleurData: {
  nom: string;
  code_hex: string;
}): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("nom", couleurData.nom);
    formData.append("code_hex", couleurData.code_hex);

    const response = await fetch(`${API_BASE_URL}/couleurs/creer_couleur.php`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de l'ajout de la couleur",
      };
    }

    // ⚡ Invalider le cache
    await invalidateCouleursCache();

    return data;
  } catch (error) {
    console.error("Add couleur error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'ajout de la couleur",
    };
  }
}

/**
 * 🔄 Modifie une couleur existante (INVALIDE LE CACHE)
 */
export async function updateCouleur(
  id: number,
  couleurData: {
    nom: string;
    code_hex: string;
  },
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("nom", couleurData.nom);
    formData.append("code_hex", couleurData.code_hex);

    const response = await fetch(
      `${API_BASE_URL}/couleurs/modifier_couleur.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la modification de la couleur",
      };
    }

    // ⚡ Invalider le cache
    await invalidateCouleursCache(id);

    return data;
  } catch (error) {
    console.error("Update couleur error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la modification de la couleur",
    };
  }
}

/**
 * 🔄 Supprime une couleur (INVALIDE LE CACHE)
 */
export async function deleteCouleur(id: number): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());

    const response = await fetch(
      `${API_BASE_URL}/couleurs/supprimer_couleur.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la suppression de la couleur",
      };
    }

    // ⚡ Invalider le cache
    await invalidateCouleursCache(id);

    return data;
  } catch (error) {
    console.error("Delete couleur error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la suppression de la couleur",
    };
  }
}

/**
 * 🔄 Change le statut d'une couleur (INVALIDE LE CACHE)
 */
export async function toggleCouleurStatus(
  id: number,
  actif: boolean,
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("actif", actif.toString());

    const response = await fetch(
      `${API_BASE_URL}/couleurs/changer_statut_couleur.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec du changement de statut de la couleur",
      };
    }

    // ⚡ Invalider le cache
    await invalidateCouleursCache(id);

    return data;
  } catch (error) {
    console.error("Toggle couleur status error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors du changement de statut de la couleur",
    };
  }
}

/**
 * 💾 Recherche des couleurs par terme (AVEC CACHE - 2 heures)
 */
export async function searchCouleurs(searchTerm: string): Promise<ApiResponse> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.COULEURS_SEARCH, `search-${searchTerm}`);

  try {
    const response = await fetch(
      `${API_BASE_URL}/couleurs/rechercher_couleurs.php?search=${encodeURIComponent(searchTerm)}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la recherche des couleurs",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(
          data.data.map(async (item: any) => await cleanCouleurData(item)),
        )
      : [];

    return {
      status: "success",
      data: cleanedData,
    };
  } catch (error) {
    console.error("Search couleurs error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des couleurs",
    };
  }
}

/**
 * 🌊 Vérifie si une couleur existe déjà par son nom (PAS DE CACHE)
 */
export async function checkCouleurExists(nom: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/couleurs/verifier_couleur.php?nom=${encodeURIComponent(nom)}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la vérification de la couleur",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Check couleur exists error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification de la couleur",
    };
  }
}

/**
 * 💾 Récupère une couleur par son ID (AVEC CACHE - 2 heures)
 */
export async function getCouleurById(id: number): Promise<ApiResponse> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.COULEUR_DETAILS(id));

  try {
    const response = await fetch(
      `${API_BASE_URL}/couleurs/get_couleur.php?id=${id}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la récupération de la couleur",
      };
    }

    return {
      status: "success",
      data: await cleanCouleurData(data.data),
    };
  } catch (error) {
    console.error("Get couleur by ID error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération de la couleur",
    };
  }
}
