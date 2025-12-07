/**
 * Service pour les statistiques d'immatriculation
 */

export interface StatistiquesBase {
  total_immatriculations: number;
  total_revenus: number;
  immatriculations_mois: number;
  revenus_mois: number;
}

export interface StatistiquesDetails {
  statistiques_generales: {
    total_immatriculations: number;
    total_revenus: number;
    moyenne_revenus: number;
    taux_croissance: number;
  };
  statistiques_periodiques: {
    immatriculations_jour: number;
    revenus_jour: number;
    immatriculations_semaine: number;
    revenus_semaine: number;
    immatriculations_mois: number;
    revenus_mois: number;
  };
  statistiques_par_type: Array<{
    type_engin: string;
    count: number;
    pourcentage: number;
    revenus: number;
  }>;
  statistiques_par_mode_paiement: Array<{
    mode_paiement: string;
    count: number;
    pourcentage: number;
    montant_total: number;
  }>;
  statistiques_par_site: Array<{
    site_nom: string;
    count: number;
    pourcentage: number;
    revenus: number;
  }>;
  tendances: Array<{
    periode: string;
    immatriculations: number;
    revenus: number;
  }>;
}

export interface EnginDetails {
  id: number;
  numero_plaque: string;
  type_engin: string;
  marque: string;
  annee_fabrication: string;
  couleur: string;
  particulier_nom: string;
  particulier_prenom: string;
  date_immatriculation: string;
  montant_paiement: number;
  mode_paiement: string;
  site_nom: string;
}

export interface FiltresStatistiques {
  date_debut?: string;
  date_fin?: string;
  type_engin?: string;
  mode_paiement?: string;
  site_id?: number;
  limit?: number;
  offset?: number;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls";

/**
 * Récupère les statistiques de base
 */
export const getStatistiquesBase = async (
  utilisateur: any
): Promise<{ status: string; data?: StatistiquesBase; message?: string }> => {
  try {
    const formData = new FormData();
    formData.append("utilisateur_id", utilisateur?.id?.toString() || "");
    formData.append("site_id", utilisateur?.site_affecte_id?.toString() || "");

    const response = await fetch(
      `${API_BASE_URL}/statistiques/get_statistiques_base.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des statistiques",
      };
    }

    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des statistiques",
    };
  }
};

/**
 * Récupère les statistiques détaillées
 */
export const getStatistiquesDetails = async (
  filtres: FiltresStatistiques,
  utilisateur: any
): Promise<{ status: string; data?: StatistiquesDetails; message?: string }> => {
  try {
    const formData = new FormData();
    formData.append("utilisateur_id", utilisateur?.id?.toString() || "");
    formData.append("site_id", utilisateur?.site_affecte_id?.toString() || "");

    if (filtres.date_debut) {
      formData.append("date_debut", filtres.date_debut);
    }
    if (filtres.date_fin) {
      formData.append("date_fin", filtres.date_fin);
    }
    if (filtres.type_engin) {
      formData.append("type_engin", filtres.type_engin);
    }
    if (filtres.mode_paiement) {
      formData.append("mode_paiement", filtres.mode_paiement);
    }
    if (filtres.site_id) {
      formData.append("site_id_filtre", filtres.site_id.toString());
    }

    const response = await fetch(
      `${API_BASE_URL}/statistiques/get_statistiques_details.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des détails",
      };
    }

    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération des détails:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des détails",
    };
  }
};

/**
 * Récupère la liste des engins avec filtres
 */
export const getEnginsListe = async (
  filtres: FiltresStatistiques,
  utilisateur: any
): Promise<{ status: string; data?: EnginDetails[]; total?: number; message?: string }> => {
  try {
    const formData = new FormData();
    formData.append("utilisateur_id", utilisateur?.id?.toString() || "");
    formData.append("site_id", utilisateur?.site_affecte_id?.toString() || "");
    formData.append("limit", (filtres.limit || 10).toString());
    formData.append("offset", (filtres.offset || 0).toString());

    if (filtres.date_debut) {
      formData.append("date_debut", filtres.date_debut);
    }
    if (filtres.date_fin) {
      formData.append("date_fin", filtres.date_fin);
    }
    if (filtres.type_engin) {
      formData.append("type_engin", filtres.type_engin);
    }
    if (filtres.mode_paiement) {
      formData.append("mode_paiement", filtres.mode_paiement);
    }
    if (filtres.site_id) {
      formData.append("site_id_filtre", filtres.site_id.toString());
    }

    const response = await fetch(
      `${API_BASE_URL}/statistiques/get_engins_liste.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des engins",
      };
    }

    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération des engins:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des engins",
    };
  }
};

/**
 * Exporte les statistiques en Excel
 */
export const exporterStatistiquesExcel = async (
  filtres: FiltresStatistiques,
  utilisateur: any
): Promise<{ status: string; data?: { url: string }; message?: string }> => {
  try {
    const formData = new FormData();
    formData.append("utilisateur_id", utilisateur?.id?.toString() || "");
    formData.append("site_id", utilisateur?.site_affecte_id?.toString() || "");

    if (filtres.date_debut) {
      formData.append("date_debut", filtres.date_debut);
    }
    if (filtres.date_fin) {
      formData.append("date_fin", filtres.date_fin);
    }
    if (filtres.type_engin) {
      formData.append("type_engin", filtres.type_engin);
    }

    const response = await fetch(
      `${API_BASE_URL}/statistiques/exporter_excel.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de l'exportation",
      };
    }

    return data;
  } catch (error) {
    console.error("Erreur lors de l'exportation:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'exportation",
    };
  }
};

/**
 * Récupère les tendances sur une période
 */
export const getTendancesPeriodiques = async (
  periode: "jour" | "semaine" | "mois" | "annee",
  utilisateur: any
): Promise<{ status: string; data?: Array<{ date: string; count: number; revenus: number }>; message?: string }> => {
  try {
    const formData = new FormData();
    formData.append("utilisateur_id", utilisateur?.id?.toString() || "");
    formData.append("site_id", utilisateur?.site_affecte_id?.toString() || "");
    formData.append("periode", periode);

    const response = await fetch(
      `${API_BASE_URL}/statistiques/get_tendances.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des tendances",
      };
    }

    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération des tendances:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des tendances",
    };
  }
};