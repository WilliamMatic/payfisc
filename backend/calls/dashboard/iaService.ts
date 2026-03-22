// services/dashboard/iaService.ts

/**
 * Service pour récupérer les données pour l'IA
 */

export interface IADataResponse {
  status: "success" | "error";
  message?: string;
  data?: any;
}

/**
 * Récupère toutes les données pour l'analyse IA
 */
export const getIAData = async (): Promise<IADataResponse> => {
  try {
    const response = await fetch('/api/ia-data.php', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Erreur lors de la récupération des données pour l'IA:", error);
    return {
      status: "error",
      message: error.message || "Erreur lors de la récupération des données pour l'IA"
    };
  }
};