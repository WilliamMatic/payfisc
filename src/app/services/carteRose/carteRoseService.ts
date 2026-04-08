'use server';
/**
 * Server Actions pour la gestion des annulations de cartes roses (SANS CACHE - temps réel)
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
  datePremiere: string;
  dateDerniere: string;
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

// Nettoyer les données
export async function cleanCarteRoseData(data: any): Promise<CarteRose> {
  return {
    id: data.id || 0,
    engin_id: data.engin_id || 0,
    particulier_id: data.particulier_id || 0,
    nom: data.nom || "",
    prenom: data.prenom || "",
    telephone: data.telephone || "",
    email: data.email || "",
    adresse: data.adresse || "",
    nif: data.nif || "",
    numero_plaque: data.numero_plaque || "",
    type_engin: data.type_engin || "",
    marque: data.marque || "",
    energie: data.energie || "",
    annee_fabrication: data.annee_fabrication || "",
    annee_circulation: data.annee_circulation || "",
    couleur: data.couleur || "",
    puissance_fiscal: data.puissance_fiscal || "",
    usage_engin: data.usage_engin || "",
    numero_chassis: data.numero_chassis || "",
    numero_moteur: data.numero_moteur || "",
    date_attribution: data.date_attribution || "",
    site_nom: data.site_nom || "",
    caissier: data.caissier || "",
    site_id: data.site_id || 0,
    utilisateur_id: data.utilisateur_id || 0,
    impot_id: data.impot_id || 0,
    paiement_id: data.paiement_id || 0,
    reprint_id: data.reprint_id || 0,
    plaque_attribuee_id: data.plaque_attribuee_id || 0,
  };
}

/**
 * 🔄 Récupère les cartes roses avec pagination et filtres (SANS CACHE - temps réel)
 */
export async function getCartesRoses(
  params: RechercheParamsCartesRoses = {}
): Promise<{ status: string; message?: string; data?: PaginationResponseCartesRoses }> {
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
    if (params.type_engin) formData.append("type_engin", params.type_engin);
    if (params.order_by) formData.append("order_by", params.order_by);
    if (params.order_dir) formData.append("order_dir", params.order_dir);

    const url = `${API_BASE_URL}/cartesRoses/get_cartes_roses.php`;

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
    if (data.status === "success" && Array.isArray(data.data?.cartesRoses)) {
      data.data.cartesRoses = await Promise.all(
        data.data.cartesRoses.map(async (carte: any) => await cleanCarteRoseData(carte))
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
 * 🔄 Récupère les statistiques des cartes roses (SANS CACHE - temps réel)
 */
export async function getStatsCartesRoses(
  params?: Omit<RechercheParamsCartesRoses, "page" | "limit" | "order_by" | "order_dir">
): Promise<{ status: string; message?: string; data?: StatsCartesRoses }> {
  // Retirer 'use cache' et cacheTag/cacheLife
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
        cache: 'no-store',
      }
    );

    const data = await response.json();
    if (data.status === "error") {
      const errorText = await response.text();
      console.error("Erreur HTTP stats:", errorText);
      return {
        status: "error",
        message: `Échec de la récupération des statistiques (${response.status})`,
      };
    }

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
 * 🔄 Annule une carte rose (MET À JOUR LES DONNÉES EN TEMPS RÉEL)
 */
export async function annulerCarteRose(
  paiementId: number,
  utilisateurId: number,
  raison: string = "Annulation via interface admin"
): Promise<{ status: string; message?: string; data?: any }> {
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
      cache: 'no-store',
    });

    const data = await response.json();
    if (data.status === "error") {
      const errorText = await response.text();
      console.error("Erreur HTTP annulation:", errorText);
      return {
        status: "error",
        message: `Échec de l'annulation de la carte rose (${response.status})`,
      };
    }


    // Pas d'invalidation de cache nécessaire puisque tout est en temps réel
    return data;
  } catch (error) {
    console.error("Annuler carte rose error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'annulation de la carte rose",
    };
  }
}

/**
 * 🔄 Exporte les cartes roses en Excel (SANS CACHE - temps réel)
 */
export async function exporterCartesRosesExcel(
  params: RechercheParamsCartesRoses = {}
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
    if (params.type_engin) formData.append("type_engin", params.type_engin);

    const response = await fetch(`${API_BASE_URL}/cartesRoses/exporter_excel.php`, {
      method: "POST",
      credentials: "include",
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await response.json();
    if (data.status === "error") {
      const errorText = await response.text();
      console.error("Erreur HTTP export:", errorText);
      return {
        status: "error",
        message: `Échec de l'exportation Excel (${response.status})`,
      };
    }

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

    const url = `${API_BASE_URL}/cartesRoses/get_sites.php`;

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
 * 🔄 Récupère les détails d'une carte rose spécifique (SANS CACHE - temps réel)
 */
export async function getDetailsCarteRose(
  paiementId: number
): Promise<{ status: string; message?: string; data?: CarteRose }> {
  // Retirer 'use cache' et cacheTag/cacheLife
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
      cache: 'no-store',
    });

    const data = await response.json();
    if (data.status === "error") {
      const errorText = await response.text();
      console.error("Erreur HTTP détails:", errorText);
      return {
        status: "error",
        message: `Échec de la récupération des détails (${response.status})`,
      };
    }

    
    // Nettoyer les données
    if (data.status === "success" && data.data) {
      data.data = await cleanCarteRoseData(data.data);
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
 * 🔄 Récupère les types de véhicules disponibles (SANS CACHE - temps réel)
 */
export async function getTypesVehicules(): Promise<{
  status: string;
  message?: string;
  data?: { type: string; count: number }[];
}> {
  // Retirer 'use cache' et cacheTag/cacheLife
  try {
    const response = await fetch(`${API_BASE_URL}/cartesRoses/get_types_vehicules.php`, {
      method: "POST",
      credentials: "include",
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await response.json();
    if (data.status === "error") {
      const errorText = await response.text();
      console.error("Erreur HTTP types véhicules:", errorText);
      return {
        status: "error",
        message: `Échec de la récupération des types de véhicules (${response.status})`,
      };
    }

    return data;
  } catch (error) {
    console.error("Get types véhicules error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des types de véhicules",
    };
  }
}

/**
 * 🔄 Recherche des cartes roses par énergie (SANS CACHE - temps réel)
 */
export async function searchCartesRosesByEnergie(
  energie: string,
  params?: Omit<RechercheParamsCartesRoses, "type_engin" | "order_by" | "order_dir">
): Promise<{ status: string; message?: string; data?: PaginationResponseCartesRoses }> {
  // Retirer 'use cache' et cacheTag/cacheLife
  try {
    const formData = new FormData();
    formData.append("energie", energie);

    if (params?.page !== undefined) formData.append("page", params.page.toString());
    if (params?.limit !== undefined) formData.append("limit", params.limit.toString());
    if (params?.search) formData.append("search", params.search);
    if (params?.date_debut) formData.append("date_debut", params.date_debut);
    if (params?.date_fin) formData.append("date_fin", params.date_fin);
    if (params?.site_id !== undefined) formData.append("site_id", params.site_id.toString());

    const response = await fetch(
      `${API_BASE_URL}/cartesRoses/rechercher_cartes_roses_par_energie.php`,
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
    if (data.status === "error") {
      const errorText = await response.text();
      console.error("Erreur HTTP recherche par énergie:", errorText);
      return {
        status: "error",
        message: `Échec de la recherche par énergie (${response.status})`,
      };
    }


    // Nettoyer les données
    if (data.status === "success" && Array.isArray(data.data?.cartesRoses)) {
      data.data.cartesRoses = await Promise.all(
        data.data.cartesRoses.map(async (carte: any) => await cleanCarteRoseData(carte))
      );
    }

    return data;
  } catch (error) {
    console.error("Search cartes roses by energie error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche par énergie",
    };
  }
}

/**
 * 🔄 Récupère les cartes roses récentes (SANS CACHE - temps réel)
 */
export async function getCartesRosesRecent(
  limit: number = 10,
  siteId?: number
): Promise<{ status: string; message?: string; data?: CarteRose[] }> {
  // Retirer 'use cache' et cacheTag/cacheLife
  try {
    const formData = new FormData();
    formData.append("limit", limit.toString());
    
    if (siteId !== undefined) {
      formData.append("site_id", siteId.toString());
    }

    const response = await fetch(
      `${API_BASE_URL}/cartesRoses/get_cartes_roses_recentes.php`,
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
    if (data.status === "error") {
      const errorText = await response.text();
      console.error("Erreur HTTP cartes roses récentes:", errorText);
      return {
        status: "error",
        message: `Échec de la récupération des cartes roses récentes (${response.status})`,
      };
    }

    
    // Nettoyer les données
    if (data.status === "success" && Array.isArray(data.data)) {
      data.data = await Promise.all(
        data.data.map(async (carte: any) => await cleanCarteRoseData(carte))
      );
    }

    return data;
  } catch (error) {
    console.error("Get cartes roses recent error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des cartes roses récentes",
    };
  }
}

/**
 * 🔄 Recherche des cartes roses par plaque (SANS CACHE - temps réel)
 */
export async function searchCartesRosesByPlaque(
  plaque: string,
  page: number = 1,
  limit: number = 10
): Promise<{ status: string; message?: string; data?: PaginationResponseCartesRoses }> {
  // Retirer 'use cache' et cacheTag/cacheLife
  try {
    const formData = new FormData();
    formData.append("plaque", plaque);
    formData.append("page", page.toString());
    formData.append("limit", limit.toString());

    const response = await fetch(
      `${API_BASE_URL}/cartesRoses/rechercher_cartes_roses_par_plaque.php`,
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
    if (data.status === "error") {
      const errorText = await response.text();
      console.error("Erreur HTTP recherche par plaque:", errorText);
      return {
        status: "error",
        message: `Échec de la recherche par plaque (${response.status})`,
      };
    }


    // Nettoyer les données
    if (data.status === "success" && Array.isArray(data.data?.cartesRoses)) {
      data.data.cartesRoses = await Promise.all(
        data.data.cartesRoses.map(async (carte: any) => await cleanCarteRoseData(carte))
      );
    }

    return data;
  } catch (error) {
    console.error("Search cartes roses by plaque error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche par plaque",
    };
  }
}
