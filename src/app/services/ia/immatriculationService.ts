// services/dashboard/immatriculationService.ts
export interface DashboardStats {
  total_paiements: number;
  total_assujettis: number;
  total_engins: number;
  total_plaques_attribuees: number;
  paiements_completes: number;
  paiements_en_attente: number;
  paiements_echoues: number;
  plaques_avec_carte_rose: number;
  plaques_sans_carte_rose: number;
  total_revenus: number;
  total_plaques_payees: number;
  total_series: number;
  total_series_items: number;
  methodes_paiement: Array<{
    mode_paiement: string;
    nombre_paiements: number;
    total_montant: number;
  }>;
  revenus_par_province: Array<{
    province: string;
    nombre_paiements: number;
    total_revenus: number;
  }>;
}

export interface ApiResponse {
  status: "success" | "error";
  message?: string;
  data?: any;
}

export const getDashboardStats = async (startDate?: string, endDate?: string): Promise<ApiResponse> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await fetch(`/api/dashboard-immatriculation.php?${params}`);
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des statistiques');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur getDashboardStats:', error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Erreur inconnue"
    };
  }
};

export const getPaiementsDetails = async (filters: any): Promise<ApiResponse> => {
  try {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key].toString());
      }
    });

    const response = await fetch(`/api/dashboard-immatriculation.php?type=paiements&${params}`);
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des paiements');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur getPaiementsDetails:', error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Erreur inconnue"
    };
  }
};

export const getSeriesPopulaires = async (limit: number = 10): Promise<ApiResponse> => {
  try {
    const response = await fetch(`/api/dashboard-immatriculation.php?type=series&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des séries');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur getSeriesPopulaires:', error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Erreur inconnue"
    };
  }
};

export const getBeneficiairesStats = async (startDate?: string, endDate?: string): Promise<ApiResponse> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await fetch(`/api/dashboard-immatriculation.php?type=beneficiaires&${params}`);
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des bénéficiaires');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur getBeneficiairesStats:', error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Erreur inconnue"
    };
  }
};

export const getTendances = async (periode: string = 'month', limit: number = 12): Promise<ApiResponse> => {
  try {
    const response = await fetch(`/api/dashboard-immatriculation.php?type=tendances&periode=${periode}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des tendances');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur getTendances:', error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Erreur inconnue"
    };
  }
};

export const getDataForIA = async (startDate?: string, endDate?: string): Promise<ApiResponse> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await fetch(`/api/dashboard-immatriculation.php?type=data-ia&${params}`);
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des données pour IA');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur getDataForIA:', error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Erreur inconnue"
    };
  }
};