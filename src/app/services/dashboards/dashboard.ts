/**
 * Service pour la gestion des rapports de ventes de plaques motos
 */

export interface FilterState {
  startDate: string;
  endDate: string;
  plateNumber: string;
  saleType: "all" | "retail" | "wholesale" | "reproduction";
}

export interface DashboardStats {
  retail: {
    amount: number;
    transactions: number;
  };
  wholesale: {
    amount: number;
    transactions: number;
    total_plates: number;
  };
  reproduction: {
    amount: number;
    transactions: number;
  };
  total: {
    amount: number;
    transactions: number;
  };
  trends: {
    retail: string;
    wholesale: string;
    reproduction: string;
    total: string;
  };
}

export interface DetailSale {
  id: string;
  fullName: string;
  address: string;
  phone: string;
  totalAmount: number;
  purchases: {
    plateNumber: string;
    brand: string;
    model: string;
    energy: string;
    manufactureYear: string;
    circulationYear: string;
    color: string;
    fiscalPower: string;
    usage: string;
    engineNumber: string;
    chassisNumber: string;
  }[];
}

export interface WholesaleSale {
  id: string;
  companyName: string;
  registrationNumber: string;
  address: string;
  phone: string;
  platesPurchased: number;
  totalAmount: number;
  plates: string[];
  allPlates?: string[];
}

export interface ReproductionSale {
  id: string;
  fullName: string;
  oldPlateNumber: string;
  address: string;
  phone: string;
  reason: string;
  amount: number;
  vehicle: {
    plateNumber: string;
    oldPlateNumber: string;
    brand: string;
    model: string;
    energy: string;
    manufactureYear: string;
    circulationYear: string;
    color: string;
    fiscalPower: string;
    usage: string;
    engineNumber: string;
    chassisNumber: string;
  };
}

export interface DashboardData {
  stats: DashboardStats;
  detailSales: DetailSale[];
  wholesaleSales: WholesaleSale[];
  reproductionSales: ReproductionSale[];
  counts: {
    retail: number;
    wholesale: number;
    reproduction: number;
  };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls";

/**
 * Récupère les données du dashboard
 */
export const getDashboardData = async (
  siteId: number,
  filters: FilterState = {
    startDate: "",
    endDate: "",
    plateNumber: "",
    saleType: "all",
  }
): Promise<{ status: string; message?: string; data?: DashboardData }> => {
  try {
    console.log("=== DEBUT APPEL API DASHBOARD ===");
    console.log("Paramètres reçus:", { siteId, filters });

    const formData = new FormData();
    formData.append("site_id", siteId.toString());

    if (filters.startDate) formData.append("start_date", filters.startDate);
    if (filters.endDate) formData.append("end_date", filters.endDate);
    if (filters.plateNumber)
      formData.append("plate_number", filters.plateNumber);
    if (filters.saleType && filters.saleType !== "all") {
      formData.append("sale_type", filters.saleType);
    }

    const url = `${API_BASE_URL}/dashboards/get_dashboard_data.php`;
    console.log("URL complète:", url);

    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    console.log("Statut HTTP:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP détaillée:", errorText);
      return {
        status: "error",
        message: `Erreur HTTP ${response.status}: ${
          response.statusText || "Pas de réponse"
        }`,
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

    console.log("=== FIN APPEL API DASHBOARD ===");
    return data;
  } catch (error) {
    console.error("Erreur réseau complète:", error);
    return {
      status: "error",
      message: `Erreur réseau: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`,
    };
  }
};

/**
 * Récupère uniquement les statistiques pour les cartes
 */
export const getDashboardStats = async (
  siteId: number,
  startDate?: string,
  endDate?: string,
  saleType?: "retail" | "wholesale" | "reproduction"
): Promise<{ status: string; message?: string; data?: DashboardStats }> => {
  try {
    const formData = new FormData();
    formData.append("site_id", siteId.toString());

    if (startDate) formData.append("start_date", startDate);
    if (endDate) formData.append("end_date", endDate);
    if (saleType) formData.append("sale_type", saleType); // Ajouter le type de vente

    const response = await fetch(
      `${API_BASE_URL}/dashboards/get_dashboard_stats.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
        headers: {
          Accept: "application/json",
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
 * Exporte les données du dashboard en Excel
 */
export const exportDashboardExcel = async (
  siteId: number,
  filters: FilterState,
  exportType: "all" | "retail" | "wholesale" | "reproduction"
): Promise<{
  status: string;
  message?: string;
  data?: { url: string; filename: string };
}> => {
  try {
    const formData = new FormData();
    formData.append("site_id", siteId.toString());
    formData.append("export_type", exportType);

    if (filters.startDate) formData.append("start_date", filters.startDate);
    if (filters.endDate) formData.append("end_date", filters.endDate);
    if (filters.plateNumber)
      formData.append("plate_number", filters.plateNumber);

    const response = await fetch(
      `${API_BASE_URL}/dashboards/export_excel.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      }
    );

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
 * Récupère l'historique des ventes pour les graphiques
 */
export const getSalesHistory = async (
  siteId: number,
  period: "day" | "week" | "month" = "week",
  saleType?: "retail" | "wholesale" | "reproduction"
): Promise<{
  status: string;
  message?: string;
  data?: Array<{
    period: string;
    sale_type: string;
    amount: number;
    transactions: number;
  }>;
}> => {
  try {
    const formData = new FormData();
    formData.append("site_id", siteId.toString());
    formData.append("period", period);

    if (saleType) formData.append("sale_type", saleType);

    const response = await fetch(
      `${API_BASE_URL}/dashboards/get_sales_history.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP history:", errorText);
      return {
        status: "error",
        message: `Échec de la récupération de l'historique (${response.status})`,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get history error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération de l'historique",
    };
  }
};
