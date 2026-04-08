'use server';

import { cacheLife, cacheTag, updateTag } from "next/cache";

// ============================================================
// INTERFACES
// ============================================================

export interface Taxe {
  id: number;
  nom: string;
  description: string;
  formule_json: any;
  actif: boolean;
  date_creation: string;
  date_modification: string | null;
  periode:
    | "journalier"
    | "hebdomadaire"
    | "mensuel"
    | "trimestriel"
    | "semestriel"
    | "annuel";
  delai_accord: number;
  prix: number;
  penalites: string;
}

export interface SiteTaxe {
  id: number;
  site_id: number;
  taxe_id: number;
  prix: number;
  status: boolean;
  date_create: string;

  // Champs joints
  taxe_nom?: string;
  taxe_description?: string;
  taxe_periode?: string;
  taxe_penalites?: string;
  taxe_actif?: boolean;

  site_nom?: string;
  site_code?: string;
  site_actif?: boolean;
  province_nom?: string;
}

export interface ApiResponse {
  status: "success" | "error";
  message?: string;
  data?: any;
}

// ============================================================
// CONFIGURATION
// ============================================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls";

const CACHE_TAGS = {
  SITE_TAXES:        (siteId: number) => `site-taxes-${siteId}`,
  TAXE_SITES:        (taxeId: number) => `taxe-sites-${taxeId}`,
  TAXES_DISPONIBLES: (siteId: number) => `taxes-disponibles-${siteId}`,
};

// ============================================================
// HELPERS
// ============================================================

/**
 * Invalide tous les tags liés à un couple site/taxe.
 * siteId et taxeId sont TOUJOURS requis pour garantir une invalidation précise.
 */
function invalidateSiteTaxeCache(siteId: number, taxeId: number): void {
  updateTag(CACHE_TAGS.SITE_TAXES(siteId));
  updateTag(CACHE_TAGS.TAXES_DISPONIBLES(siteId));
  updateTag(CACHE_TAGS.TAXE_SITES(taxeId));
}

export async function cleanSiteTaxeData(data: any): Promise<SiteTaxe> {
  return {
    id:          data.id        || 0,
    site_id:     data.site_id   || 0,
    taxe_id:     data.taxe_id   || 0,
    prix:        parseFloat(data.prix) || 0,
    status:      Boolean(data.status),
    date_create: data.date_create || "",

    taxe_nom:         data.taxe_nom         || "",
    taxe_description: data.taxe_description || "",
    taxe_periode:     data.periode          || data.taxe_periode || "",
    taxe_penalites:   data.penalites        || data.taxe_penalites || "",
    taxe_actif:       data.taxe_actif !== undefined ? Boolean(data.taxe_actif) : undefined,

    site_nom:     data.site_nom  || "",
    site_code:    data.site_code || "",
    site_actif:   data.site_actif !== undefined ? Boolean(data.site_actif) : undefined,
    province_nom: data.province_nom || "",
  };
}

export async function cleanTaxeData(data: any): Promise<Taxe> {
  return {
    id:                data.id               || 0,
    nom:               data.nom              || "",
    description:       data.description      || "",
    formule_json:      data.formulaire_json  || null,
    actif:             Boolean(data.actif),
    date_creation:     data.date_creation    || "",
    date_modification: data.date_modification || null,
    periode:           data.periode          || "annuel",
    delai_accord:      data.delai_accord     || 0,
    prix:              parseFloat(data.prix) || 0,
    penalites:         data.penalites        || "",
  };
}

// ============================================================
// LECTURES (avec cache)
// ============================================================

/**
 * 💾 Récupère toutes les taxes associées à un site.
 * Cache : stale 2j / revalidate 3j / expire 5j
 * Invalidé dès qu'une mutation touche ce siteId.
 */
export async function getTaxesBySite(siteId: number): Promise<ApiResponse> {
  "use cache";
  cacheLife({ stale: 172800, revalidate: 259200, expire: 432000 });
  cacheTag(CACHE_TAGS.SITE_TAXES(siteId));

  try {
    const response = await fetch(
      `${API_BASE_URL}/site_taxe/lister_taxes_site.php?site_id=${siteId}`,
      {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      },
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des taxes du site",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map((item: any) => cleanSiteTaxeData(item)))
      : [];

    return { status: "success", data: cleanedData };
  } catch (error) {
    console.error("getTaxesBySite error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des taxes du site",
    };
  }
}

/**
 * 💾 Récupère les taxes disponibles pour un site (non encore associées).
 * Cache : stale 2j / revalidate 3j / expire 5j
 * Invalidé dès qu'une mutation touche ce siteId.
 */
export async function getTaxesDisponibles(siteId: number): Promise<ApiResponse> {
  "use cache";
  cacheLife({ stale: 172800, revalidate: 259200, expire: 432000 });
  cacheTag(CACHE_TAGS.TAXES_DISPONIBLES(siteId));

  try {
    const response = await fetch(
      `${API_BASE_URL}/site_taxe/lister_taxes_disponibles.php?site_id=${siteId}`,
      {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      },
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des taxes disponibles",
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map((item: any) => cleanTaxeData(item)))
      : [];

    return { status: "success", data: cleanedData };
  } catch (error) {
    console.error("getTaxesDisponibles error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des taxes disponibles",
    };
  }
}

/**
 * 🌊 Récupère une association site-taxe par son ID.
 * Sans cache — utilisé ponctuellement.
 */
export async function getSiteTaxeById(id: number): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/site_taxe/get_taxe_site.php?id=${id}`,
      {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      },
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec de la récupération de l'association",
      };
    }

    return {
      status: "success",
      data: await cleanSiteTaxeData(data.data),
    };
  } catch (error) {
    console.error("getSiteTaxeById error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération de l'association",
    };
  }
}

/**
 * 🌊 Vérifie si une association site-taxe existe déjà.
 * Sans cache — vérification ponctuelle.
 */
export async function checkSiteTaxeExists(
  siteId: number,
  taxeId: number,
): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/site_taxe/verifier_site_taxe.php?site_id=${siteId}&taxe_id=${taxeId}`,
      {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      },
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec de la vérification de l'association",
      };
    }

    return { status: "success", data: data.data };
  } catch (error) {
    console.error("checkSiteTaxeExists error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification de l'association",
    };
  }
}

// ============================================================
// MUTATIONS (invalidation précise du cache)
//
// Règle : siteId et taxeId sont toujours passés par le composant
// appelant — il les possède déjà via l'objet SiteTaxe affiché.
// Cela évite tout re-fetch inutile avant la mutation.
//
// Usage côté composant :
//   await addTaxeToSite(siteId, taxeId, prix)
//   await updateSiteTaxe(row.id, prix, status, row.site_id, row.taxe_id)
//   await deleteSiteTaxe(row.id, row.site_id, row.taxe_id)
//   await toggleSiteTaxeStatus(row.id, newStatus, row.site_id, row.taxe_id)
// ============================================================

/**
 * 🔄 Ajoute une taxe à un site.
 */
export async function addTaxeToSite(
  siteId: number,
  taxeId: number,
  prix: number,
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("site_id", siteId.toString());
    formData.append("taxe_id", taxeId.toString());
    formData.append("prix", prix.toString());

    const response = await fetch(
      `${API_BASE_URL}/site_taxe/ajouter_taxe_site.php`,
      { method: "POST", credentials: "include", body: formData },
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec de l'ajout de la taxe au site",
      };
    }

    invalidateSiteTaxeCache(siteId, taxeId);
    return data;
  } catch (error) {
    console.error("addTaxeToSite error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'ajout de la taxe au site",
    };
  }
}

/**
 * 🔄 Modifie le prix et le statut d'une taxe associée à un site.
 */
export async function updateSiteTaxe(
  id: number,
  prix: number,
  status: boolean,
  siteId: number,
  taxeId: number,
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("prix", prix.toString());
    formData.append("status", status ? "1" : "0");

    const response = await fetch(
      `${API_BASE_URL}/site_taxe/modifier_taxe_site.php`,
      { method: "POST", credentials: "include", body: formData },
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec de la modification de la taxe",
      };
    }

    invalidateSiteTaxeCache(siteId, taxeId);
    return data;
  } catch (error) {
    console.error("updateSiteTaxe error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la modification de la taxe",
    };
  }
}

/**
 * 🔄 Supprime une taxe d'un site.
 */
export async function deleteSiteTaxe(
  id: number,
  siteId: number,
  taxeId: number,
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());

    const response = await fetch(
      `${API_BASE_URL}/site_taxe/supprimer_taxe_site.php`,
      { method: "POST", credentials: "include", body: formData },
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec de la suppression de la taxe",
      };
    }

    invalidateSiteTaxeCache(siteId, taxeId);
    return data;
  } catch (error) {
    console.error("deleteSiteTaxe error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la suppression de la taxe",
    };
  }
}

/**
 * 🔄 Change le statut actif/inactif d'une taxe associée.
 */
export async function toggleSiteTaxeStatus(
  id: number,
  status: boolean,
  siteId: number,
  taxeId: number,
): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("status", status ? "1" : "0");

    const response = await fetch(
      `${API_BASE_URL}/site_taxe/changer_statut_taxe_site.php`,
      { method: "POST", credentials: "include", body: formData },
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec du changement de statut de la taxe",
      };
    }

    invalidateSiteTaxeCache(siteId, taxeId);
    return data;
  } catch (error) {
    console.error("toggleSiteTaxeStatus error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors du changement de statut de la taxe",
    };
  }
}