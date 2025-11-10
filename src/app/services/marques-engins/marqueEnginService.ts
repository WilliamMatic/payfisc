// services/marques-engins/marqueEnginService.ts

/**
 * Service pour la gestion des marques d'engins - Interface avec l'API backend
 */

// Interface pour les données d'une marque d'engin
export interface MarqueEngin {
  id: number;
  libelle: string;
  description: string;
  type_engin_id: number;
  type_engin_libelle: string;
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
 * Récupère la liste de toutes les marques d'engins
 */
export const getMarquesEngins = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/marques-engins/lister_marques.php`, {
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
        message: data.message || 'Échec de la récupération des marques d\'engins',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get marques engins error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des marques d\'engins',
    };
  }
};

/**
 * Ajoute une nouvelle marque d'engin
 */
export const addMarqueEngin = async (marqueData: {
  libelle: string;
  description: string;
  type_engin_id: number;
}): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('libelle', marqueData.libelle);
    formData.append('description', marqueData.description);
    formData.append('type_engin_id', marqueData.type_engin_id.toString());

    const response = await fetch(`${API_BASE_URL}/marques-engins/creer_marque.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout de la marque',
      };
    }

    return data;
  } catch (error) {
    console.error('Add marque engin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout de la marque',
    };
  }
};

/**
 * Modifie une marque d'engin existante
 */
export const updateMarqueEngin = async (
  id: number,
  marqueData: {
    libelle: string;
    description: string;
    type_engin_id: number;
  }
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('libelle', marqueData.libelle);
    formData.append('description', marqueData.description);
    formData.append('type_engin_id', marqueData.type_engin_id.toString());

    const response = await fetch(`${API_BASE_URL}/marques-engins/modifier_marque.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification de la marque',
      };
    }

    return data;
  } catch (error) {
    console.error('Update marque engin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification de la marque',
    };
  }
};

/**
 * Supprime une marque d'engin
 */
export const deleteMarqueEngin = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/marques-engins/supprimer_marque.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression de la marque',
      };
    }

    return data;
  } catch (error) {
    console.error('Delete marque engin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression de la marque',
    };
  }
};

/**
 * Change le statut d'une marque d'engin (actif/inactif)
 */
export const toggleMarqueEnginStatus = async (
  id: number,
  actif: boolean
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/marques-engins/changer_statut_marque.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut de la marque',
      };
    }

    return data;
  } catch (error) {
    console.error('Toggle marque engin status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut de la marque',
    };
  }
};

/**
 * Recherche des marques d'engins par terme
 */
export const searchMarquesEngins = async (searchTerm: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/marques-engins/rechercher_marques.php?search=${encodeURIComponent(searchTerm)}`,
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
        message: data.message || 'Échec de la recherche des marques',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Search marques engins error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des marques',
    };
  }
};