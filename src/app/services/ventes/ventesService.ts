/**
 * Service pour la gestion des ventes non-grossistes
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

/**
 * Récupère les ventes non-grossistes avec pagination et filtres
 */
export const getVentesNonGrossistes = async (
  params: RechercheParams = {}
): Promise<{ status: string; message?: string; data?: PaginationResponse }> => {
  try {
    console.log("=== DEBUT APPEL API VENTES ===");
    console.log("URL de base:", API_BASE_URL);
    console.log("Paramètres reçus:", params);

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

    // Afficher le contenu du FormData pour debug
    console.log("FormData content:");
    for (const [key, value] of (formData as any).entries()) {
      console.log(`${key}: ${value}`);
    }

    const url = `${API_BASE_URL}/ventes/get_ventes_non_grossistes.php`;
    console.log("URL complète:", url);

    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log("Statut HTTP:", response.status);
    console.log("Statut OK?", response.ok);

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
    console.log("Réponse brute:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
      console.log("Données parsées:", data);
    } catch (parseError) {
      console.error("Erreur de parsing JSON:", parseError);
      console.error("Réponse reçue:", responseText);
      return {
        status: "error",
        message: "Réponse invalide du serveur (JSON malformé)",
      };
    }

    console.log("=== FIN APPEL API VENTES ===");
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
};

/**
 * Récupère les statistiques des ventes non-grossistes
 */
export const getStatsVentes = async (
  params?: Omit<RechercheParams, "page" | "limit" | "order_by" | "order_dir">
): Promise<{ status: string; message?: string; data?: Stats }> => {
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
};

/**
 * Supprime une vente non-grossiste
 */
export const supprimerVenteNonGrossiste = async (
  paiementId: number,
  utilisateurId: number,
  raison: string = "Suppression via interface admin"
): Promise<{ status: string; message?: string; data?: any }> => {
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
    return data;
  } catch (error) {
    console.error("Supprimer vente error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la suppression de la vente",
    };
  }
};

/**
 * Exporte les ventes non-grossistes en Excel
 */
export const exporterVentesExcel = async (
  params: RechercheParams = {}
): Promise<{
  status: string;
  message?: string;
  data?: { url: string; filename: string };
}> => {
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
};

/**
 * Récupère la liste des sites disponibles
 */
export const getSitesDisponibles = async (): Promise<{
  status: string;
  message?: string;
  data?: { id: number; nom: string; code: string }[];
}> => {
  try {
    console.log("=== DEBUT CHARGEMENT SITES ===");
    const formData = new FormData();

    const url = `${API_BASE_URL}/ventes/get_sites.php`;
    console.log("URL sites:", url);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      credentials: "include",
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log("Statut réponse sites:", response.status);
    console.log("OK?", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP sites:", response.status, errorText);
      return {
        status: "error",
        message: `Échec de la récupération des sites (${response.status})`,
      };
    }

    const responseText = await response.text();
    console.log("Réponse sites brute:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
      console.log("Sites parsés:", data);
    } catch (parseError) {
      console.error("Erreur parsing sites:", parseError);
      return {
        status: "error",
        message: "Réponse invalide du serveur pour les sites",
      };
    }

    console.log("=== FIN CHARGEMENT SITES ===");
    return data;
  } catch (error) {
    console.error("Get sites error complet:", error);
    return {
      status: "error",
      message: `Erreur réseau lors de la récupération des sites: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
};