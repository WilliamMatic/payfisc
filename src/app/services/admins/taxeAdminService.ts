"use server";

import { cacheLife, cacheTag } from "next/cache";
import { revalidateTag } from "next/cache";
import { updateTag } from "next/cache";

/**
 * Server Actions pour la gestion des liens entre administrateurs et taxes
 */

// Interface pour les données d'une taxe
export interface Taxe {
  id: number;
  nom: string;
  description: string | null;
  taux: number;
  actif: boolean;
  date_creation: string;
}

// Interface pour le lien admin-taxe
export interface AdminTaxe {
  id: number;
  admin_id: number;
  taxe_id: number;
  taxe_nom: string;
  taxe_taux: number;
  date_creation: string;
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
  TAXES_LIST: "taxes-list",
  TAXES_ACTIFS: "taxes-actifs",
  ADMIN_TAXES: (adminId: number) => `admin-taxes-${adminId}`,
  ALL_ADMIN_TAXES: "admin-taxes-all",
};

/**
 * Invalide le cache après une mutation avec updateTag (pour rafraîchissement immédiat)
 */
async function invalidateAdminTaxesCache(adminId?: number) {
  "use server";

  // Invalidation immédiate avec updateTag
  updateTag(CACHE_TAGS.ALL_ADMIN_TAXES);

  if (adminId) {
    updateTag(CACHE_TAGS.ADMIN_TAXES(adminId));
  }
}

// Nettoyer les données d'une taxe
export async function cleanTaxeData(data: any): Promise<Taxe> {
  return {
    id: data.id || 0,
    nom: data.nom || "",
    description: data.description || null,
    taux: parseFloat(data.taux) || 0,
    actif: Boolean(data.actif),
    date_creation: data.date_creation || "",
  };
}

// Nettoyer les données d'un lien admin-taxe
export async function cleanAdminTaxeData(data: any): Promise<AdminTaxe> {
  return {
    id: data.id || 0,
    admin_id: data.admin_id || 0,
    taxe_id: data.taxe_id || 0,
    taxe_nom: data.taxe_nom || "",
    taxe_taux: parseFloat(data.taxe_taux) || 0,
    date_creation: data.date_creation || "",
  };
}

/**
 * 💾 Récupère la liste de toutes les taxes actives (AVEC CACHE - 2 heures)
 */
export async function getTaxesActives(): Promise<ApiResponse> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.TAXES_ACTIFS);

  try {
    const response = await fetch(
      `${API_BASE_URL}/taxes/lister_taxes_actives.php`,
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
        message: data.message || "Échec de la récupération des taxes actives",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(
          data.data.map(async (item: any) => await cleanTaxeData(item)),
        )
      : [];

    return {
      status: "success",
      data: cleanedData,
    };
  } catch (error) {
    console.error("Get taxes actives error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des taxes actives",
    };
  }
}

/**
 * 💾 Récupère la liste de toutes les taxes (AVEC CACHE - 2 heures)
 */
export async function getTaxes(): Promise<ApiResponse> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.TAXES_LIST);

  try {
    const response = await fetch(`${API_BASE_URL}/taxes/lister_taxes.php`, {
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
        message: data.message || "Échec de la récupération des taxes",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(
          data.data.map(async (item: any) => await cleanTaxeData(item)),
        )
      : [];

    return {
      status: "success",
      data: cleanedData,
    };
  } catch (error) {
    console.error("Get taxes error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des taxes",
    };
  }
}

/**
 * 💾 Récupère les taxes liées à un administrateur (AVEC CACHE - 2 heures)
 */
export async function getTaxesByAdmin(adminId: number): Promise<ApiResponse> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.ADMIN_TAXES(adminId));

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin_taxe/lister_taxes_par_admin.php?admin_id=${adminId}`,
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
        message:
          data.message ||
          "Échec de la récupération des taxes de l'administrateur",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(
          data.data.map(async (item: any) => await cleanAdminTaxeData(item)),
        )
      : [];

    return {
      status: "success",
      data: cleanedData,
    };
  } catch (error) {
    console.error("Get taxes by admin error:", error);
    return {
      status: "error",
      message:
        "Erreur réseau lors de la récupération des taxes de l'administrateur",
    };
  }
}

/**
 * 🔄 Ajoute un lien entre un administrateur et une taxe (INVALIDE LE CACHE AVEC updateTag)
 */
export async function addTaxeToAdmin(
  adminId: number,
  taxeId: number,
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("admin_id", adminId.toString());
    formData.append("taxe_id", taxeId.toString());

    const response = await fetch(
      `${API_BASE_URL}/admin_taxe/ajouter_lien.php`,
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
        message: data.message || "Échec de l'ajout du lien admin-taxe",
      };
    }

    // Invalidation immédiate du cache
    await invalidateAdminTaxesCache(adminId);

    return data;
  } catch (error) {
    console.error("Add taxe to admin error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'ajout du lien admin-taxe",
    };
  }
}

/**
 * 🔄 Supprime un lien entre un administrateur et une taxe (INVALIDE LE CACHE AVEC updateTag)
 */
export async function removeTaxeFromAdmin(
  adminId: number,
  taxeId: number,
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("admin_id", adminId.toString());
    formData.append("taxe_id", taxeId.toString());

    const response = await fetch(
      `${API_BASE_URL}/admin_taxe/supprimer_lien.php`,
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
        message: data.message || "Échec de la suppression du lien admin-taxe",
      };
    }

    // Invalidation immédiate du cache
    await invalidateAdminTaxesCache(adminId);

    return data;
  } catch (error) {
    console.error("Remove taxe from admin error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la suppression du lien admin-taxe",
    };
  }
}

/**
 * 🔄 Supprime tous les liens d'un administrateur (INVALIDE LE CACHE AVEC updateTag)
 */
export async function removeAllTaxesFromAdmin(
  adminId: number,
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("admin_id", adminId.toString());

    const response = await fetch(
      `${API_BASE_URL}/admin_taxe/supprimer_tous_liens.php`,
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
        message: data.message || "Échec de la suppression des liens admin-taxe",
      };
    }

    // Invalidation immédiate du cache
    await invalidateAdminTaxesCache(adminId);

    return data;
  } catch (error) {
    console.error("Remove all taxes from admin error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la suppression des liens admin-taxe",
    };
  }
}

/**
 * 💾 Vérifie si un administrateur est lié à une taxe (AVEC CACHE - 2 heures)
 */
export async function checkAdminHasTaxe(
  adminId: number,
  taxeId: number,
): Promise<ApiResponse> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.ADMIN_TAXES(adminId), `check-${taxeId}`);

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin_taxe/verifier_lien.php?admin_id=${adminId}&taxe_id=${taxeId}`,
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
        message: data.message || "Échec de la vérification du lien admin-taxe",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Check admin has taxe error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification du lien admin-taxe",
    };
  }
}
