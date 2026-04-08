'use server';

// Retirer les imports liés au cache
// import { cacheLife, cacheTag } from 'next/cache';
// import { revalidateTag } from 'next/cache';

/**
 * Server Actions pour la gestion des annulations de commandes de plaques (SANS CACHE - temps réel)
 */

export interface CommandePlaque {
  id: number;
  particulier_id: number;
  montant: number;
  montant_initial: number;
  nombre_plaques: number;
  mode_paiement: string;
  operateur: string;
  numero_transaction: string;
  numero_cheque: string;
  banque: string;
  impot_id: number;
  utilisateur_id: number;
  site_id: number;
  date_paiement: string;
  nom: string;
  prenom: string;
  telephone: string;
  nif: string;
  email: string;
  adresse: string;
  site_nom: string;
  caissier: string;
  reduction_type: string;
  reduction_valeur: number;
  plaques_attribuees?: string[];
}

export interface StatsCommandes {
  total: number;
  montantTotal: number;
  plaquesTotal: number;
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
  commandes: CommandePlaque[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  totaux?: {
    montantTotal: number;
    plaquesTotal: number;
    commandesCount: number;
  };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls";

// Nettoyer les données
export async function cleanCommandeData(data: any): Promise<CommandePlaque> {
  return {
    id: data.id || 0,
    particulier_id: data.particulier_id || 0,
    montant: data.montant || 0,
    montant_initial: data.montant_initial || 0,
    nombre_plaques: data.nombre_plaques || 0,
    mode_paiement: data.mode_paiement || "",
    operateur: data.operateur || "",
    numero_transaction: data.numero_transaction || "",
    numero_cheque: data.numero_cheque || "",
    banque: data.banque || "",
    impot_id: data.impot_id || 0,
    utilisateur_id: data.utilisateur_id || 0,
    site_id: data.site_id || 0,
    date_paiement: data.date_paiement || "",
    nom: data.nom || "",
    prenom: data.prenom || "",
    telephone: data.telephone || "",
    nif: data.nif || "",
    email: data.email || "",
    adresse: data.adresse || "",
    site_nom: data.site_nom || "",
    caissier: data.caissier || "",
    reduction_type: data.reduction_type || "",
    reduction_valeur: data.reduction_valeur || 0,
    plaques_attribuees: data.plaques_attribuees || [],
  };
}

/**
 * 🔄 Récupère les commandes de plaques avec pagination et filtres (SANS CACHE - temps réel)
 */
export async function getCommandesPlaques(
  params: RechercheParams = {}
): Promise<{ status: string; message?: string; data?: PaginationResponse }> {
  // Retirer 'use cache' et cacheTag/cacheLife
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

    const url = `${API_BASE_URL}/commandes/get_commandes_plaques.php`;

    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
      // Ajouter cache: 'no-store' pour éviter tout cache
      cache: 'no-store',
    });

    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Erreur de parsing JSON:", parseError);
      return {
        status: "error",
        message: "Réponse invalide du serveur (JSON malformé)",
      };
    }

    // Nettoyer les données
    if (data.status === "success" && Array.isArray(data.data?.commandes)) {
      data.data.commandes = await Promise.all(
        data.data.commandes.map(async (commande: any) => await cleanCommandeData(commande))
      );
    }
    
    return data;

  } catch (error) {
    console.error("Erreur réseau complète:", error);
    return {
      status: "error",
      message: `Erreur réseau: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
}

/**
 * 🔄 Récupère les statistiques des commandes (SANS CACHE - temps réel)
 */
export async function getStatsCommandes(
  params?: Omit<RechercheParams, "page" | "limit" | "order_by" | "order_dir">
): Promise<{ status: string; message?: string; data?: StatsCommandes }> {
  // Retirer 'use cache' et cacheTag/cacheLife
  try {
    const formData = new FormData();

    if (params?.search) formData.append("search", params.search);
    if (params?.date_debut) formData.append("date_debut", params.date_debut);
    if (params?.date_fin) formData.append("date_fin", params.date_fin);
    if (params?.site_id !== undefined) formData.append("site_id", params.site_id.toString());

    const response = await fetch(
      `${API_BASE_URL}/commandes/get_stats_commandes.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      }
    );

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
 * 🔄 Annule une commande de plaques (TEMPS RÉEL)
 */
export async function annulerCommandePlaques(
  paiementId: number,
  utilisateurId: number,
  raison: string = "Annulation via interface admin"
): Promise<{ status: string; message?: string; data?: any }> {
  try {
    const formData = new FormData();
    formData.append("paiement_id", paiementId.toString());
    formData.append("utilisateur_id", utilisateurId.toString());
    formData.append("raison_suppression", raison);

    const response = await fetch(`${API_BASE_URL}/commandes/annuler_commande.php`, {
      method: "POST",
      credentials: "include",
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await response.json();

    // Pas d'invalidation de cache nécessaire puisque tout est en temps réel
    return data;
  } catch (error) {
    console.error("Annuler commande error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'annulation de la commande",
    };
  }
}

/**
 * 🔄 Exporte les commandes en Excel (SANS CACHE - temps réel)
 */
export async function exporterCommandesExcel(
  params: RechercheParams = {}
): Promise<{
  status: string;
  message?: string;
  data?: { url: string; filename: string };
}> {
  // Retirer 'use cache' et cacheTag/cacheLife
  try {
    const formData = new FormData();

    if (params.search) formData.append("search", params.search);
    if (params.date_debut) formData.append("date_debut", params.date_debut);
    if (params.date_fin) formData.append("date_fin", params.date_fin);
    if (params.site_id !== undefined) formData.append("site_id", params.site_id.toString());

    const response = await fetch(`${API_BASE_URL}/commandes/exporter_excel.php`, {
      method: "POST",
      credentials: "include",
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

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
 * 🔄 Récupère la liste des sites disponibles (SANS CACHE - temps réel)
 */
export async function getSitesDisponibles(): Promise<{
  status: string;
  message?: string;
  data?: { id: number; nom: string; code: string }[];
}> {
  // Retirer 'use cache' et cacheTag/cacheLife
  try {
    const formData = new FormData();

    const url = `${API_BASE_URL}/commandes/get_sites.php`;

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      credentials: "include",
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

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
    console.error("Get sites error:", error);
    return {
      status: "error",
      message: `Erreur réseau lors de la récupération des sites: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
}

/**
 * 🔄 Récupère les détails d'une commande spécifique avec ses plaques (SANS CACHE - temps réel)
 */
export async function getDetailsCommande(
  paiementId: number
): Promise<{ status: string; message?: string; data?: CommandePlaque }> {
  // Retirer 'use cache' et cacheTag/cacheLife
  try {
    const formData = new FormData();
    formData.append("paiement_id", paiementId.toString());

    const response = await fetch(`${API_BASE_URL}/commandes/get_details_commande.php`, {
      method: "POST",
      credentials: "include",
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await response.json();
    
    // Nettoyer les données
    if (data.status === "success" && data.data) {
      data.data = await cleanCommandeData(data.data);
    }

    return data;
  } catch (error) {
    console.error("Get details error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des détails",
    };
  }
}

/**
 * 🔄 Recherche des commandes par mode de paiement (SANS CACHE - temps réel)
 */
export async function searchCommandesByModePaiement(
  modePaiement: string,
  params?: Omit<RechercheParams, "order_by" | "order_dir">
): Promise<{ status: string; message?: string; data?: PaginationResponse }> {
  // Retirer 'use cache' et cacheTag/cacheLife
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
      `${API_BASE_URL}/commandes/rechercher_commandes_par_mode_paiement.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      }
    );

    const data = await response.json();

    // Nettoyer les données
    if (data.status === "success" && Array.isArray(data.data?.commandes)) {
      data.data.commandes = await Promise.all(
        data.data.commandes.map(async (commande: any) => await cleanCommandeData(commande))
      );
    }

    return data;
  } catch (error) {
    console.error("Search commandes by mode paiement error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche par mode de paiement",
    };
  }
}

/**
 * 🔄 Récupère les commandes récentes (SANS CACHE - temps réel)
 */
export async function getCommandesRecent(
  limit: number = 10,
  siteId?: number
): Promise<{ status: string; message?: string; data?: CommandePlaque[] }> {
  // Retirer 'use cache' et cacheTag/cacheLife
  try {
    const formData = new FormData();
    formData.append("limit", limit.toString());
    
    if (siteId !== undefined) {
      formData.append("site_id", siteId.toString());
    }

    const response = await fetch(
      `${API_BASE_URL}/commandes/get_commandes_recentes.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      }
    );

    const data = await response.json();
    
    // Nettoyer les données
    if (data.status === "success" && Array.isArray(data.data)) {
      data.data = await Promise.all(
        data.data.map(async (commande: any) => await cleanCommandeData(commande))
      );
    }

    return data;
  } catch (error) {
    console.error("Get commandes recent error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des commandes récentes",
    };
  }
}

/**
 * 🔄 Recherche des commandes par nombre de plaques (SANS CACHE - temps réel)
 */
export async function searchCommandesByNombrePlaques(
  minPlaques: number,
  maxPlaques: number,
  params?: Omit<RechercheParams, "order_by" | "order_dir">
): Promise<{ status: string; message?: string; data?: PaginationResponse }> {
  // Retirer 'use cache' et cacheTag/cacheLife
  try {
    const formData = new FormData();
    formData.append("min_plaques", minPlaques.toString());
    formData.append("max_plaques", maxPlaques.toString());

    if (params?.page !== undefined) formData.append("page", params.page.toString());
    if (params?.limit !== undefined) formData.append("limit", params.limit.toString());
    if (params?.search) formData.append("search", params.search);
    if (params?.date_debut) formData.append("date_debut", params.date_debut);
    if (params?.date_fin) formData.append("date_fin", params.date_fin);
    if (params?.site_id !== undefined) formData.append("site_id", params.site_id.toString());

    const response = await fetch(
      `${API_BASE_URL}/commandes/rechercher_commandes_par_nombre_plaques.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      }
    );

    const data = await response.json();

    // Nettoyer les données
    if (data.status === "success" && Array.isArray(data.data?.commandes)) {
      data.data.commandes = await Promise.all(
        data.data.commandes.map(async (commande: any) => await cleanCommandeData(commande))
      );
    }

    return data;
  } catch (error) {
    console.error("Search commandes by nombre plaques error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche par nombre de plaques",
    };
  }
}
