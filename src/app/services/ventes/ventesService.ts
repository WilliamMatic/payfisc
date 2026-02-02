'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Server Actions pour la gestion des ventes non-grossistes avec Cache Components Next.js 16
 */

export interface VenteNonGrossiste {
  paiement_id: number;
  engin_id: number;
  particulier_id: number;
  montant: number;
  serie_item_id: number;
  serie_id: number;
  numero_plaque: string;
  createur_engin: number;
  site_id: number;
  telephone: string;
  nom: string;
  prenom: string;
  nb_engins_particulier: number;
  date_paiement?: string;
  mode_paiement?: string;
  operateur?: string;
  site_nom?: string;
  utilisateur_nom?: string;
  nif?: string;
  montant_initial?: number;
  numero_transaction?: string;
  email?: string;
  adresse?: string;
  type_engin?: string;
  marque?: string;
}

export interface Stats {
  total: number;
  montantTotal: number;
  clientsUniques: number;
  montantMoyen: number;
  datePremiere?: string;
  dateDerniere?: string;
}

export interface RechercheParams {
  page?: number;
  limit?: number;
  search?: string;
  date_debut?: string;
  date_fin?: string;
  site_id?: number;
  order_by?: string;
  order_dir?: "ASC" | "DESC";
}

export interface PaginationResponse {
  ventes: VenteNonGrossiste[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  totaux?: {
    montantTotal: number;
    ventesCount: number;
  };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls";

// Tags de cache pour invalidation ciblée
const CACHE_TAGS = {
  VENTES_LIST: (paramsHash: string) => `ventes-list-${paramsHash}`,
  VENTES_STATS: (paramsHash: string) => `ventes-stats-${paramsHash}`,
  VENTES_EXPORT: (paramsHash: string) => `ventes-export-${paramsHash}`,
  VENTES_DETAILS: (paiementId: number) => `ventes-details-${paiementId}`,
  VENTES_MODE_PAIEMENT: (modePaiement: string, paramsHash: string) => 
    `ventes-mode-${modePaiement}-${paramsHash}`,
  SITES_LIST: 'sites-ventes-list',
};

/**
 * Invalide le cache après une mutation
 */
async function invalidateVentesCache(venteId?: number) {
  
  // Invalider tous les caches de listes de ventes (pattern général)
  revalidateTag(CACHE_TAGS.VENTES_LIST(''), "max");
  
  if (venteId) {
    revalidateTag(CACHE_TAGS.VENTES_DETAILS(venteId), "max");
  }
}

// Nettoyer les données
export async function cleanVenteData(data: any): Promise<VenteNonGrossiste> {
  return {
    paiement_id: data.paiement_id || 0,
    engin_id: data.engin_id || 0,
    particulier_id: data.particulier_id || 0,
    montant: data.montant || 0,
    serie_item_id: data.serie_item_id || 0,
    serie_id: data.serie_id || 0,
    numero_plaque: data.numero_plaque || "",
    createur_engin: data.createur_engin || 0,
    site_id: data.site_id || 0,
    telephone: data.telephone || "",
    nom: data.nom || "",
    prenom: data.prenom || "",
    nb_engins_particulier: data.nb_engins_particulier || 0,
    date_paiement: data.date_paiement || "",
    mode_paiement: data.mode_paiement || "",
    operateur: data.operateur || "",
    site_nom: data.site_nom || "",
    utilisateur_nom: data.utilisateur_nom || "",
    nif: data.nif || "",
    montant_initial: data.montant_initial || 0,
    numero_transaction: data.numero_transaction || "",
    email: data.email || "",
    adresse: data.adresse || "",
    type_engin: data.type_engin || "",
    marque: data.marque || "",
  };
}

/**
 * 💾 Récupère les ventes non-grossistes avec pagination et filtres (AVEC CACHE - 30 minutes)
 */
export async function getVentesNonGrossistes(
  params: RechercheParams = {}
): Promise<{ status: string; message?: string; data?: PaginationResponse }> {

  try {

    const formData = new FormData();

    // Ajouter les paramètres au FormData
    if (params.page !== undefined) formData.append("page", params.page.toString());
    if (params.limit !== undefined) formData.append("limit", params.limit.toString());
    if (params.search) formData.append("search", params.search);
    if (params.date_debut) formData.append("date_debut", params.date_debut);
    if (params.date_fin) formData.append("date_fin", params.date_fin);
    if (params.site_id !== undefined) formData.append("site_id", params.site_id.toString());
    if (params.order_by) formData.append("order_by", params.order_by);
    if (params.order_dir) formData.append("order_dir", params.order_dir);

    const url = `${API_BASE_URL}/ventes/get_ventes_non_grossistes.php`;

    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP détaillée:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return {
        status: "error",
        message: `Erreur HTTP ${response.status}: ${response.statusText || 'Pas de réponse'}`,
      };
    }

    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Erreur de parsing JSON:", parseError);
      console.error("Réponse reçue:", responseText);
      return {
        status: "error",
        message: "Réponse invalide du serveur (JSON malformé)",
      };
    }

    // Nettoyer les données
    if (data.status === "success" && Array.isArray(data.data?.ventes)) {
      data.data.ventes = await Promise.all(
        data.data.ventes.map(async (vente: any) => await cleanVenteData(vente))
      );
    }

    return data;

  } catch (error) {
    console.error("Erreur réseau complète:", error);
    if (error instanceof TypeError) {
      console.error("TypeError - Problème probable de CORS ou réseau");
    }
    return {
      status: "error",
      message: `Erreur réseau: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
}

/**
 * 💾 Récupère les statistiques des ventes non-grossistes (AVEC CACHE - 30 minutes)
 */
export async function getStatsVentes(
  params?: Omit<RechercheParams, "page" | "limit" | "order_by" | "order_dir">
): Promise<{ status: string; message?: string; data?: Stats }> {

  try {
    const formData = new FormData();

    // Ajouter les paramètres au FormData
    if (params?.search) formData.append("search", params.search);
    if (params?.date_debut) formData.append("date_debut", params.date_debut);
    if (params?.date_fin) formData.append("date_fin", params.date_fin);
    if (params?.site_id !== undefined) formData.append("site_id", params.site_id.toString());

    const response = await fetch(
      `${API_BASE_URL}/ventes/get_stats_ventes.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP stats:", response.status, errorText);
      return {
        status: "error",
        message: `Échec de la récupération des statistiques (${response.status})`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get stats error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des statistiques",
    };
  }
}

/**
 * 🔄 Supprime une vente non-grossiste (INVALIDE LE CACHE)
 */
export async function supprimerVenteNonGrossiste(
  paiementId: number,
  utilisateurId: number,
  raison: string = "Suppression via interface admin"
): Promise<{ status: string; message?: string; data?: any }> {
  try {
    const formData = new FormData();
    formData.append("paiement_id", paiementId.toString());
    formData.append("utilisateur_id", utilisateurId.toString());
    formData.append("raison", raison);

    const response = await fetch(`${API_BASE_URL}/ventes/supprimer_vente.php`, {
      method: "POST",
      credentials: "include",
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP suppression:", response.status, errorText);
      return {
        status: "error",
        message: `Échec de la suppression de la vente (${response.status})`,
      };
    }

    const data = await response.json();

    // ⚡ Invalider le cache
    await invalidateVentesCache(paiementId);

    return data;
  } catch (error) {
    console.error("Supprimer vente error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la suppression de la vente",
    };
  }
}

/**
 * 💾 Exporte les ventes non-grossistes en Excel (AVEC CACHE - 10 minutes)
 */
export async function exporterVentesExcel(
  params: RechercheParams = {}
): Promise<{
  status: string;
  message?: string;
  data?: { url: string; filename: string };
}> {

  try {
    const formData = new FormData();

    // Ajouter les paramètres au FormData
    if (params.search) formData.append("search", params.search);
    if (params.date_debut) formData.append("date_debut", params.date_debut);
    if (params.date_fin) formData.append("date_fin", params.date_fin);
    if (params.site_id !== undefined) formData.append("site_id", params.site_id.toString());

    const response = await fetch(`${API_BASE_URL}/ventes/exporter_excel.php`, {
      method: "POST",
      credentials: "include",
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP export:", response.status, errorText);
      return {
        status: "error",
        message: `Échec de l'exportation Excel (${response.status})`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Export Excel error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'exportation Excel",
    };
  }
}

/**
 * 💾 Récupère la liste des sites disponibles (AVEC CACHE - 1 heure)
 */
export async function getSitesDisponibles(): Promise<{
  status: string;
  message?: string;
  data?: { id: number; nom: string; code: string }[];
}> {

  try {
    const formData = new FormData();

    const url = `${API_BASE_URL}/ventes/get_sites.php`;

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      credentials: "include",
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP sites:", response.status, errorText);
      return {
        status: "error",
        message: `Échec de la récupération des sites (${response.status})`,
      };
    }

    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Erreur parsing sites:", parseError);
      return {
        status: "error",
        message: "Réponse invalide du serveur pour les sites",
      };
    }
    
    return data;
  } catch (error) {
    console.error("Get sites error complet:", error);
    return {
      status: "error",
      message: `Erreur réseau lors de la récupération des sites: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
}

/**
 * 💾 Récupère les détails d'une vente spécifique (AVEC CACHE - 1 heure)
 */
export async function getDetailsVente(
  paiementId: number
): Promise<{ status: string; message?: string; data?: VenteNonGrossiste }> {

  try {
    const formData = new FormData();
    formData.append("paiement_id", paiementId.toString());

    const response = await fetch(
      `${API_BASE_URL}/ventes/get_details_vente.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP détails:", response.status, errorText);
      return {
        status: "error",
        message: `Échec de la récupération des détails (${response.status})`,
      };
    }

    const data = await response.json();
    
    // Nettoyer les données
    if (data.status === "success" && data.data) {
      data.data = await cleanVenteData(data.data);
    }

    return data;
  } catch (error) {
    console.error("Get details vente error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des détails",
    };
  }
}

/**
 * 💾 Recherche des ventes par mode de paiement (AVEC CACHE - 30 minutes)
 */
export async function searchVentesByModePaiement(
  modePaiement: string,
  params?: Omit<RechercheParams, "order_by" | "order_dir">
): Promise<{ status: string; message?: string; data?: PaginationResponse }> {

  try {
    const formData = new FormData();
    formData.append("mode_paiement", modePaiement);

    if (params?.page !== undefined) formData.append("page", params.page.toString());
    if (params?.limit !== undefined) formData.append("limit", params.limit.toString());
    if (params?.search) formData.append("search", params.search);
    if (params?.date_debut) formData.append("date_debut", params.date_debut);
    if (params?.date_fin) formData.append("date_fin", params.date_fin);
    if (params?.site_id !== undefined) formData.append("site_id", params.site_id.toString());

    const response = await fetch(
      `${API_BASE_URL}/ventes/rechercher_ventes_par_mode_paiement.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP recherche par mode paiement:", response.status, errorText);
      return {
        status: "error",
        message: `Échec de la recherche par mode de paiement (${response.status})`,
      };
    }

    const data = await response.json();

    // Nettoyer les données
    if (data.status === "success" && Array.isArray(data.data?.ventes)) {
      data.data.ventes = await Promise.all(
        data.data.ventes.map(async (vente: any) => await cleanVenteData(vente))
      );
    }

    return data;
  } catch (error) {
    console.error("Search ventes by mode paiement error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche par mode de paiement",
    };
  }
}