// app/actions/achats-grossistes.ts
"use server";

import {
  getAchatsGrossistes,
  getStatistiquesAchats,
  exporterAchats,
  getDetailAchat,
  type FiltreAchats,
  type AchatGrossiste,
} from "@/services/achats/grossisteAchatService";

export interface ServerActionResponse {
  success: boolean;
  message?: string;
  data?: any;
  total?: number;
  page?: number;
  totalPages?: number;
}

/**
 * Récupère les achats des grossistes avec filtres
 */
export async function fetchAchatsGrossistes(
  filtres?: FiltreAchats
): Promise<ServerActionResponse> {
  try {
    const response = await getAchatsGrossistes(filtres);

    if (response.status === "error") {
      return {
        success: false,
        message: response.message || "Échec de la récupération des achats",
      };
    }

    return {
      success: true,
      data: response.data as AchatGrossiste[],
      total: response.total,
      page: response.page,
      totalPages: response.totalPages,
    };
  } catch (error) {
    console.error("Server Action - fetchAchatsGrossistes error:", error);
    return {
      success: false,
      message: "Erreur lors de la récupération des achats",
    };
  }
}

/**
 * Récupère les statistiques des achats
 */
export async function fetchStatistiquesAchats(
  dateDebut?: string,
  dateFin?: string
): Promise<ServerActionResponse> {
  try {
    const response = await getStatistiquesAchats(dateDebut, dateFin);

    if (response.status === "error") {
      return {
        success: false,
        message:
          response.message || "Échec de la récupération des statistiques",
      };
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Server Action - fetchStatistiquesAchats error:", error);
    return {
      success: false,
      message: "Erreur lors de la récupération des statistiques",
    };
  }
}

/**
 * Exporte les achats
 */
export async function exportAchats(
  filtres?: FiltreAchats,
  format: "csv" | "excel" = "csv"
): Promise<ServerActionResponse> {
  try {
    const response = await exporterAchats(filtres, format);

    if (response.status === "error") {
      return {
        success: false,
        message: response.message || "Échec de l'exportation",
      };
    }

    return {
      success: true,
      message: response.message || "Exportation réussie",
    };
  } catch (error) {
    console.error("Server Action - exportAchats error:", error);
    return {
      success: false,
      message: "Erreur lors de l'exportation",
    };
  }
}

/**
 * Récupère les détails d'un achat spécifique
 */
export async function fetchDetailAchat(
  achatId: number
): Promise<ServerActionResponse> {
  try {
    const response = await getDetailAchat(achatId);

    if (response.status === "error") {
      return {
        success: false,
        message: response.message || "Échec de la récupération des détails",
      };
    }

    return {
      success: true,
      data: response.data as AchatGrossiste,
    };
  } catch (error) {
    console.error("Server Action - fetchDetailAchat error:", error);
    return {
      success: false,
      message: "Erreur lors de la récupération des détails",
    };
  }
}

/**
 * Applique les filtres de recherche
 */
export async function applyAchatsFilters(
  formData: FormData
): Promise<ServerActionResponse> {
  try {
    const filtres: FiltreAchats = {};

    const dateDebut = formData.get("dateDebut") as string;
    const dateFin = formData.get("dateFin") as string;
    const recherche = formData.get("recherche") as string;
    const plaque = formData.get("plaque") as string;

    if (dateDebut) filtres.dateDebut = dateDebut;
    if (dateFin) filtres.dateFin = dateFin;
    if (recherche) filtres.recherche = recherche;
    if (plaque) filtres.plaque = plaque;

    const response = await getAchatsGrossistes(filtres);

    if (response.status === "error") {
      return {
        success: false,
        message: response.message || "Échec de l'application des filtres",
      };
    }

    return {
      success: true,
      data: response.data as AchatGrossiste[],
      total: response.total,
      page: response.page,
      totalPages: response.totalPages,
    };
  } catch (error) {
    console.error("Server Action - applyAchatsFilters error:", error);
    return {
      success: false,
      message: "Erreur lors de l'application des filtres",
    };
  }
}

/**
 * Réinitialise les filtres (retour aux achats du jour)
 */
export async function resetAchatsFilters(): Promise<ServerActionResponse> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const filtres: FiltreAchats = {
      dateDebut: today,
      dateFin: today,
    };

    const response = await getAchatsGrossistes(filtres);

    if (response.status === "error") {
      return {
        success: false,
        message: response.message || "Échec de la réinitialisation",
      };
    }

    return {
      success: true,
      data: response.data as AchatGrossiste[],
      total: response.total,
      page: response.page,
      totalPages: response.totalPages,
    };
  } catch (error) {
    console.error("Server Action - resetAchatsFilters error:", error);
    return {
      success: false,
      message: "Erreur lors de la réinitialisation des filtres",
    };
  }
}
