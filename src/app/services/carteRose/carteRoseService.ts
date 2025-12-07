/**
 * Service pour la gestion des annulations de cartes roses
 */

export interface CarteRose {
  id: number;
  engin_id: number;
  particulier_id: number;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  nif: string;
  numero_plaque: string;
  type_engin: string;
  marque: string;
  energie: string;
  annee_fabrication: string;
  annee_circulation: string;
  couleur: string;
  puissance_fiscal: string;
  usage_engin: string;
  numero_chassis: string;
  numero_moteur: string;
  date_attribution: string;
  site_nom: string;
  caissier: string;
  site_id: number;
  utilisateur_id: number;
  impot_id: number;
  paiement_id: number;
  reprint_id: number;
  plaque_attribuee_id: number;
}

export interface StatsCartesRoses {
  total: number;
  clientsUniques: number;
  datePremiere?: string;
  dateDerniere?: string;
  typesVehicules: Record<string, number>;
}

export interface RechercheParamsCartesRoses {
  page?: number;
  limit?: number;
  search?: string;
  date_debut?: string;
  date_fin?: string;
  site_id?: number;
  type_engin?: string;
  order_by?: string;
  order_dir?: "ASC" | "DESC";
}

export interface PaginationResponseCartesRoses {
  cartesRoses: CarteRose[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls";

/**
 * Récupère les cartes roses avec pagination et filtres
 */
export const getCartesRoses = async (
  params: RechercheParamsCartesRoses = {}
): Promise<{ status: string; message?: string; data?: PaginationResponseCartesRoses }> => {
  try {
    console.log("=== DEBUT APPEL API CARTES ROSES ===");
    console.log("Paramètres reçus:", params);

    const formData = new FormData();

    // Ajouter les paramètres au FormData
    if (params.page !== undefined) formData.append("page", params.page.toString());
    if (params.limit !== undefined) formData.append("limit", params.limit.toString());
    if (params.search) formData.append("search", params.search);
    if (params.date_debut) formData.append("date_debut", params.date_debut);
    if (params.date_fin) formData.append("date_fin", params.date_fin);
    if (params.site_id !== undefined) formData.append("site_id", params.site_id.toString());
    if (params.type_engin) formData.append("type_engin", params.type_engin);
    if (params.order_by) formData.append("order_by", params.order_by);
    if (params.order_dir) formData.append("order_dir", params.order_dir);

    const url = `${API_BASE_URL}/cartesRoses/get_cartes_roses.php`;
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

    console.log("=== FIN APPEL API CARTES ROSES ===");
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
 * Récupère les statistiques des cartes roses
 */
export const getStatsCartesRoses = async (
  params?: Omit<RechercheParamsCartesRoses, "page" | "limit" | "order_by" | "order_dir">
): Promise<{ status: string; message?: string; data?: StatsCartesRoses }> => {
  try {
    const formData = new FormData();

    if (params?.search) formData.append("search", params.search);
    if (params?.date_debut) formData.append("date_debut", params.date_debut);
    if (params?.date_fin) formData.append("date_fin", params.date_fin);
    if (params?.site_id !== undefined) formData.append("site_id", params.site_id.toString());
    if (params?.type_engin) formData.append("type_engin", params.type_engin);

    const response = await fetch(
      `${API_BASE_URL}/cartesRoses/get_stats_cartes_roses.php`,
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
 * Annule une carte rose
 */
export const annulerCarteRose = async (
  paiementId: number,
  utilisateurId: number,
  raison: string = "Annulation via interface admin"
): Promise<{ status: string; message?: string; data?: any }> => {
  try {
    const formData = new FormData();
    formData.append("paiement_id", paiementId.toString());
    formData.append("utilisateur_id", utilisateurId.toString());
    formData.append("raison_suppression", raison);

    const response = await fetch(`${API_BASE_URL}/cartesRoses/annuler_carte_rose.php`, {
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
        message: `Échec de l'annulation de la carte rose (${response.status})`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Annuler carte rose error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'annulation de la carte rose",
    };
  }
};

/**
 * Exporte les cartes roses en Excel
 */
export const exporterCartesRosesExcel = async (
  params: RechercheParamsCartesRoses = {}
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
    if (params.type_engin) formData.append("type_engin", params.type_engin);

    const response = await fetch(`${API_BASE_URL}/cartesRoses/exporter_excel.php`, {
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

    const url = `${API_BASE_URL}/cartesRoses/get_sites.php`;

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
 * Récupère les détails d'une carte rose spécifique
 */
export const getDetailsCarteRose = async (
  paiementId: number
): Promise<{ status: string; message?: string; data?: CarteRose }> => {
  try {
    const formData = new FormData();
    formData.append("paiement_id", paiementId.toString());

    const response = await fetch(`${API_BASE_URL}/cartesRoses/get_details_carte_rose.php`, {
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

/**
 * Récupère les types de véhicules disponibles
 */
export const getTypesVehicules = async (): Promise<{
  status: string;
  message?: string;
  data?: { type: string; count: number }[];
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/cartesRoses/get_types_vehicules.php`, {
      method: "POST",
      credentials: "include",
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP types véhicules:", errorText);
      return {
        status: "error",
        message: `Échec de la récupération des types de véhicules (${response.status})`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get types véhicules error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des types de véhicules",
    };
  }
};