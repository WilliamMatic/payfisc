// services/achats/grossisteAchatService.ts
/**
 * Service pour la gestion des achats des grossistes - Interface avec l'API backend
 */

// Interfaces pour les données
export interface Grossiste {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  nif: string;
  email: string | null;
  ville: string | null;
  province: string | null;
}

export interface SeriePlaque {
  id: number;
  nom_serie: string;
  debut_numeros: number;
  fin_numeros: number;
}

export interface SerieItem {
  id: number;
  serie_id: number;
  value: string;
  statut: string;
}

export interface PaiementImmatriculation {
  id: number;
  particulier_id: number;
  montant: number;
  impot_id: string;
  mode_paiement: string;
  statut: string;
  date_paiement: string;
  nombre_plaques: number;
  utilisateur_id: number;
  site_id: number;
}

export interface PlaqueAttribuee {
  id: number;
  paiement_id: number;
  particulier_id: number;
  numero_plaque: string;
  serie_id: number;
  serie_item_id: number;
  date_attribution: string;
  statut: number; // 0 = non délivrée, 1 = délivrée
}

export interface AchatGrossiste {
  id: number;
  particulier_id: number;
  grossiste: Grossiste;
  date_achat: string;
  nombre_plaques: number;
  type_plaque: "engin" | "voiture" | "camion";
  serie_debut: string;
  serie_fin: string;
  montant_total: number;
  statut: "completé" | "en_cours" | "annulé";
  plaques: string[];
  plaques_detail: Array<{
    numero: string;
    statut: string;
    estDelivree: boolean;
  }>;
  impot_id: string;
  mode_paiement: string;
}

export interface FiltreAchats {
  dateDebut?: string;
  dateFin?: string;
  recherche?: string;
  telephone?: string;
  plaque?: string;
  page?: number;
  limit?: number;
}

export interface StatistiquesAchats {
  generales: {
    total_achats: number;
    total_grossistes: number;
    total_plaques_vendues: number;
    montant_total: number;
    montant_moyen: number;
  };
  par_type: Array<{
    type_plaque: string;
    nombre_achats: number;
    nombre_plaques: number;
    montant_total: number;
  }>;
  top_grossistes: Array<{
    id: number;
    nom: string;
    prenom: string;
    telephone: string;
    nombre_achats: number;
    total_plaques: number;
    montant_total: number;
  }>;
}

// Interface pour les réponses de l'API
export interface ApiResponse {
  status: 'success' | 'error';
  message?: string;
  data?: any;
  total?: number;
  page?: number;
  totalPages?: number;
}

// URL de base de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls';

/**
 * Récupère les achats des grossistes avec filtres
 */
export const getAchatsGrossistes = async (filtres?: FiltreAchats): Promise<ApiResponse> => {
  try {
    // Construire les paramètres de requête
    const params = new URLSearchParams();
    
    if (filtres?.dateDebut) params.append('date_debut', filtres.dateDebut);
    if (filtres?.dateFin) params.append('date_fin', filtres.dateFin);
    if (filtres?.recherche) params.append('recherche', filtres.recherche);
    if (filtres?.telephone) params.append('telephone', filtres.telephone);
    if (filtres?.plaque) params.append('plaque', filtres.plaque);
    if (filtres?.page) params.append('page', filtres.page.toString());
    if (filtres?.limit) params.append('limit', filtres.limit.toString());

    const queryString = params.toString();
    const url = `${API_BASE_URL}/achats-grossistes/lister_achats.php${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la récupération des achats',
      };
    }

    return {
      status: 'success',
      data: data.data,
      total: data.total,
      page: data.page,
      totalPages: data.totalPages,
    };
  } catch (error) {
    console.error('Get achats grossistes error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des achats',
    };
  }
};

/**
 * Récupère les statistiques des achats
 */
export const getStatistiquesAchats = async (dateDebut?: string, dateFin?: string): Promise<ApiResponse> => {
  try {
    const params = new URLSearchParams();
    if (dateDebut) params.append('date_debut', dateDebut);
    if (dateFin) params.append('date_fin', dateFin);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/achats-grossistes/statistiques.php${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la récupération des statistiques',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get statistiques achats error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des statistiques',
    };
  }
};

/**
 * Exporte les achats au format CSV ou Excel
 */
export const exporterAchats = async (filtres?: FiltreAchats, format: 'csv' | 'excel' = 'csv'): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    
    if (filtres?.dateDebut) formData.append('date_debut', filtres.dateDebut);
    if (filtres?.dateFin) formData.append('date_fin', filtres.dateFin);
    if (filtres?.recherche) formData.append('recherche', filtres.recherche);
    if (filtres?.telephone) formData.append('telephone', filtres.telephone);
    if (filtres?.plaque) formData.append('plaque', filtres.plaque);
    formData.append('format', format);

    const response = await fetch(`${API_BASE_URL}/achats-grossistes/exporter.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        status: 'error',
        message: error.message || 'Échec de l\'exportation des données',
      };
    }

    // Pour l'export, on retourne généralement un blob
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `achats-grossistes_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return {
      status: 'success',
      message: 'Exportation réussie',
    };
  } catch (error) {
    console.error('Export achats error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'exportation',
    };
  }
};

/**
 * Récupère les détails d'un achat spécifique
 */
export const getDetailAchat = async (achatId: number): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/achats-grossistes/detail.php?id=${achatId}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la récupération des détails',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get detail achat error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des détails',
    };
  }
};