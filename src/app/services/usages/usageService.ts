// services/usages/usageService.ts

/**
 * Service pour la gestion des usages d'engins - Interface avec l'API backend
 */

// Interface pour les données d'un usage
export interface UsageEngin {
  id: number;
  code: string;
  libelle: string;
  description?: string;
  actif: boolean;
  date_creation: string;
}

// Interface pour les réponses de l'API
export interface ApiResponse {
  status: 'success' | 'error';
  message?: string;
  data?: any;
}

// URL de base de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls';

/**
 * Récupère la liste de tous les usages
 */
export const getUsages = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/usages/lister_usages.php`, {
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
        message: data.message || 'Échec de la récupération des usages',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get usages error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des usages',
    };
  }
};

/**
 * Ajoute un nouvel usage
 */
export const addUsage = async (usageData: {
  code: string;
  libelle: string;
  description?: string;
}): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('code', usageData.code);
    formData.append('libelle', usageData.libelle);
    if (usageData.description) {
      formData.append('description', usageData.description);
    }

    const response = await fetch(`${API_BASE_URL}/usages/creer_usage.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout de l\'usage',
      };
    }

    return data;
  } catch (error) {
    console.error('Add usage error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout de l\'usage',
    };
  }
};

/**
 * Modifie un usage existant
 */
export const updateUsage = async (
  id: number,
  usageData: {
    code: string;
    libelle: string;
    description?: string;
  }
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('code', usageData.code);
    formData.append('libelle', usageData.libelle);
    if (usageData.description) {
      formData.append('description', usageData.description);
    }

    const response = await fetch(`${API_BASE_URL}/usages/modifier_usage.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification de l\'usage',
      };
    }

    return data;
  } catch (error) {
    console.error('Update usage error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification de l\'usage',
    };
  }
};

/**
 * Supprime un usage
 */
export const deleteUsage = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/usages/supprimer_usage.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression de l\'usage',
      };
    }

    return data;
  } catch (error) {
    console.error('Delete usage error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression de l\'usage',
    };
  }
};

/**
 * Change le statut d'un usage (actif/inactif)
 */
export const toggleUsageStatus = async (
  id: number,
  actif: boolean
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/usages/changer_statut_usage.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut de l\'usage',
      };
    }

    return data;
  } catch (error) {
    console.error('Toggle usage status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut de l\'usage',
    };
  }
};