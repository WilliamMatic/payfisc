// services/dashboard/dashboardService.ts

/**
 * Service pour la gestion du tableau de bord fiscal - Interface avec l'API backend
 */

// Interface pour les statistiques du dashboard
export interface DashboardStats {
  total_declarations: number;
  declarations_payees: number;
  declarations_en_attente: number;
  declarations_rejetees: number;
  total_contribuables: number;
  total_particuliers: number;
  total_entreprises: number;
  total_taxes_payees: number;
  total_taxes_differentes: number;
  echeances_proches: number;
}

// Interface pour les données de vérification
export interface VerificationData {
  reference: string;
  nom_impot: string;
  contribuable: string;
  type_contribuable: string;
  montant_du: number;
  montant_paye: number;
  methode_paiement: string;
  lieu_paiement: string;
  statut: string;
  date_creation: string;
  nif_contribuable: string;
  code_impot: string;
  declaration_id: number;
}

// Interface pour les détails complets d'une déclaration
export interface DeclarationDetails {
  reference: string;
  nom_impot: string;
  contribuable: string;
  type_contribuable: string;
  nif_contribuable: string;
  montant_du: number;
  montant_paye: number;
  solde: number;
  methode_paiement: string;
  lieu_paiement: string;
  statut: string;
  date_creation: string;
  date_echeance: string;
  code_impot: string;
  periode_fiscale: string;
  details_paiements: any[];
}

// Interface pour les filtres
export interface VerificationFilters {
  search?: string;
  status?: string;
  tax_type?: string;
  taxpayer_type?: string;
  payment_method?: string;
  payment_place?: string;
  declaration_status?: string;
  start_date?: string;
  end_date?: string;
}

// Interface pour les réponses de l'API
export interface ApiResponse {
  status: "success" | "error";
  message?: string;
  data?: any;
}

// URL de base de l'API
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls/dashboard";

/**
 * Récupère les statistiques du tableau de bord
 */
export const getDashboardStats = async (
  startDate?: string,
  endDate?: string
): Promise<ApiResponse> => {
  try {
    const params = new URLSearchParams();

    if (startDate) {
      params.append("start_date", startDate);
    }

    if (endDate) {
      params.append("end_date", endDate);
    }

    const url = `${API_BASE_URL}/dashboard/dashboard_stats.php?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des statistiques",
    };
  }
};

/**
 * Récupère les données de vérification avec filtres
 */
export const getVerificationData = async (
  filters: VerificationFilters
): Promise<ApiResponse> => {
  try {
    const params = new URLSearchParams();

    // Ajouter les filtres aux paramètres
    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "all"
      ) {
        params.append(key, value.toString());
      }
    });

    const url = `${API_BASE_URL}/dashboard/verification_data.php?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get verification data error:", error);
    return {
      status: "error",
      message:
        "Erreur réseau lors de la récupération des données de vérification",
    };
  }
};

/**
 * Récupère les noms d'impôts uniques
 */
export const getUniqueTaxNames = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/tax_names.php`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get tax names error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des noms d'impôts",
    };
  }
};

/**
 * Récupère les détails complets d'une déclaration
 */
export const getDeclarationDetails = async (
  declarationId: number
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/declaration_details.php?id=${declarationId}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get declaration details error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des détails",
    };
  }
};

/**
 * Récupère les données complètes pour le rapport d'une déclaration
 */
export const getRapportDeclaration = async (
  declarationId: number
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/dashboard/rapport_declaration.php?id=${declarationId}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get rapport declaration error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération du rapport",
    };
  }
};

/**
 * Récupère les données pour le rapport général
 */
export const getRapportGeneral = async (
  filters: VerificationFilters
): Promise<ApiResponse> => {
  try {
    const params = new URLSearchParams();

    // Ajouter les filtres aux paramètres
    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "all"
      ) {
        params.append(key, value.toString());
      }
    });

    const url = `${API_BASE_URL}/dashboard/rapport_general.php?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get rapport general error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération du rapport général",
    };
  }
};
