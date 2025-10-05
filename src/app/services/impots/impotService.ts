// services/impots/impotService.ts

/**
 * Service pour la gestion des impôts - Interface avec l'API backend
 */

// Interface pour les données d'un impôt
export interface Impot {
  id: number;
  nom: string;
  description: string;
  periode: string;
  delai_accord: number;
  penalites: {
    type: string;
    valeur: number;
  };
  actif: boolean;
  date_creation: string;
}

// Interface pour les réponses de l'API
export interface ApiResponse {
  status: 'success' | 'error';
  message?: string;
  data?: any;
}

// URL de base de l'API (à définir dans les variables d'environnement)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls';

/**
 * Récupère la liste de tous les impôts
 */
export const getImpots = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/impots/lister_impots.php`, {
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
        message: data.message || 'Échec de la récupération des impôts',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get impots error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des impôts',
    };
  }
};

/**
 * Ajoute un nouvel impôt
 */
export const addImpot = async (impotData: {
  nom: string;
  description: string;
  jsonData: string;
}): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('nom', impotData.nom);
    formData.append('description', impotData.description);
    formData.append('jsonData', impotData.jsonData);

    const response = await fetch(`${API_BASE_URL}/impots/creer_impot.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout de l\'impôt',
      };
    }

    return data;
  } catch (error) {
    console.error('Add impot error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout de l\'impôt',
    };
  }
};

/**
 * Modifie un impôt existant
 */
export const updateImpot = async (
  id: number,
  impotData: {
    nom: string;
    description: string;
    jsonData: string;
  }
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('nom', impotData.nom);
    formData.append('description', impotData.description);
    formData.append('jsonData', impotData.jsonData);

    const response = await fetch(`${API_BASE_URL}/impots/modifier_impot.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification de l\'impôt',
      };
    }

    return data;
  } catch (error) {
    console.error('Update impot error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification de l\'impôt',
    };
  }
};

/**
 * Supprime un impôt
 */
export const deleteImpot = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/impots/supprimer_impot.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression de l\'impôt',
      };
    }

    return data;
  } catch (error) {
    console.error('Delete impot error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression de l\'impôt',
    };
  }
};

/**
 * Change le statut d'un impôt (actif/inactif)
 */
export const toggleImpotStatus = async (
  id: number,
  actif: boolean
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/impots/changer_statut_impot.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut de l\'impôt',
      };
    }

    return data;
  } catch (error) {
    console.error('Toggle impot status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut de l\'impôt',
    };
  }
};

/**
 * Recherche des impôts par terme
 */
export const searchImpots = async (searchTerm: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/impots/rechercher_impots.php?search=${encodeURIComponent(searchTerm)}`,
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
        message: data.message || 'Échec de la recherche des impôts',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Search impots error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des impôts',
    };
  }
};