/**
 * Service pour la gestion des annulations de commandes de plaques
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

/**
 * Récupère les commandes de plaques avec pagination et filtres
 */
export const getCommandesPlaques = async (
  params: RechercheParams = {}
): Promise<{ status: string; message?: string; data?: PaginationResponse }> => {
  try {
    console.log("=== DEBUT APPEL API COMMANDES ===");
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

    const url = `${API_BASE_URL}/commandes/get_commandes_plaques.php`;
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP détaillée:", errorText);
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
    } catch (parseError) {
      console.error("Erreur de parsing JSON:", parseError);
      return {
        status: "error",
        message: "Réponse invalide du serveur (JSON malformé)",
      };
    }

    console.log("=== FIN APPEL API COMMANDES ===");
    return data;

  } catch (error) {
    console.error("Erreur réseau complète:", error);
    return {
      status: "error",
      message: `Erreur réseau: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
};

/**
 * Récupère les statistiques des commandes
 */
export const getStatsCommandes = async (
  params?: Omit<RechercheParams, "page" | "limit" | "order_by" | "order_dir">
): Promise<{ status: string; message?: string; data?: StatsCommandes }> => {
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
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP stats:", errorText);
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
 * Annule une commande de plaques
 */
export const annulerCommandePlaques = async (
  paiementId: number,
  utilisateurId: number,
  raison: string = "Annulation via interface admin"
): Promise<{ status: string; message?: string; data?: any }> => {
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP annulation:", errorText);
      return {
        status: "error",
        message: `Échec de l'annulation de la commande (${response.status})`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Annuler commande error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'annulation de la commande",
    };
  }
};

/**
 * Exporte les commandes en Excel
 */
export const exporterCommandesExcel = async (
  params: RechercheParams = {}
): Promise<{
  status: string;
  message?: string;
  data?: { url: string; filename: string };
}> => {
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP export:", errorText);
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
    const formData = new FormData();

    const url = `${API_BASE_URL}/commandes/get_sites.php`;

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
      console.error("Erreur HTTP sites:", errorText);
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
    console.error("Get sites error:", error);
    return {
      status: "error",
      message: `Erreur réseau lors de la récupération des sites: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
};

/**
 * Récupère les détails d'une commande spécifique avec ses plaques
 */
export const getDetailsCommande = async (
  paiementId: number
): Promise<{ status: string; message?: string; data?: CommandePlaque }> => {
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
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP détails:", errorText);
      return {
        status: "error",
        message: `Échec de la récupération des détails (${response.status})`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get details error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des détails",
    };
  }
};