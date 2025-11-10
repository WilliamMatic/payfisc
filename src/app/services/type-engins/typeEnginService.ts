// services/type-engins/typeEnginService.ts

/**
 * Service pour la gestion des types d'engins - Interface avec l'API backend
 */

// Interface pour les données d'un type d'engin
export interface TypeEngin {
  id: number;
  libelle: string;
  description: string;
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
 * Récupère la liste de tous les types d'engins
 */
export const getTypeEngins = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/type-engins/lister_type_engins.php`, {
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
        message: data.message || 'Échec de la récupération des types d\'engins',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get type engins error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des types d\'engins',
    };
  }
};

/**
 * Récupère la liste des types d'engins actifs
 */
export const getTypeEnginsActifs = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/type-engins/lister_type_engins_actifs.php`, {
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
        message: data.message || 'Échec de la récupération des types d\'engins actifs',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get type engins actifs error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des types d\'engins actifs',
    };
  }
};

/**
 * Ajoute un nouveau type d'engin
 */
export const addTypeEngin = async (typeEnginData: {
  libelle: string;
  description?: string;
}): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('libelle', typeEnginData.libelle);
    if (typeEnginData.description) {
      formData.append('description', typeEnginData.description);
    }

    const response = await fetch(`${API_BASE_URL}/type-engins/creer_type_engin.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout du type d\'engin',
      };
    }

    return data;
  } catch (error) {
    console.error('Add type engin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout du type d\'engin',
    };
  }
};

/**
 * Modifie un type d'engin existant
 */
export const updateTypeEngin = async (
  id: number,
  typeEnginData: {
    libelle: string;
    description?: string;
  }
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('libelle', typeEnginData.libelle);
    if (typeEnginData.description) {
      formData.append('description', typeEnginData.description);
    }

    const response = await fetch(`${API_BASE_URL}/type-engins/modifier_type_engin.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification du type d\'engin',
      };
    }

    return data;
  } catch (error) {
    console.error('Update type engin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification du type d\'engin',
    };
  }
};

/**
 * Supprime un type d'engin
 */
export const deleteTypeEngin = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/type-engins/supprimer_type_engin.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression du type d\'engin',
      };
    }

    return data;
  } catch (error) {
    console.error('Delete type engin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression du type d\'engin',
    };
  }
};

/**
 * Change le statut d'un type d'engin (actif/inactif)
 */
export const toggleTypeEnginStatus = async (
  id: number,
  actif: boolean
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/type-engins/changer_statut_type_engin.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut du type d\'engin',
      };
    }

    return data;
  } catch (error) {
    console.error('Toggle type engin status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut du type d\'engin',
    };
  }
};