// services/provinces/provinceService.ts

/**
 * Service pour la gestion des provinces - Interface avec l'API backend
 */

// Interface pour les données d'une province
export interface Province {
  id: number;
  nom: string;
  code: string;
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

// URL de base de l'API (à définir dans les variables d'environnement)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls';

/**
 * Récupère la liste de toutes les provinces
 */
export const getProvinces = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/provinces/lister_provinces.php`, {
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
        message: data.message || 'Échec de la récupération des provinces',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get provinces error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des provinces',
    };
  }
};

/**
 * Ajoute une nouvelle province
 */
export const addProvince = async (provinceData: {
  nom: string;
  code: string;
  description: string;
}): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('nom', provinceData.nom);
    formData.append('code', provinceData.code);
    formData.append('description', provinceData.description);

    const response = await fetch(`${API_BASE_URL}/provinces/creer_province.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout de la province',
      };
    }

    return data;
  } catch (error) {
    console.error('Add province error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout de la province',
    };
  }
};

/**
 * Modifie une province existante
 */
export const updateProvince = async (
  id: number,
  provinceData: {
    nom: string;
    code: string;
    description: string;
  }
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('nom', provinceData.nom);
    formData.append('code', provinceData.code);
    formData.append('description', provinceData.description);

    const response = await fetch(`${API_BASE_URL}/provinces/modifier_province.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification de la province',
      };
    }

    return data;
  } catch (error) {
    console.error('Update province error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification de la province',
    };
  }
};

/**
 * Supprime une province
 */
export const deleteProvince = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/provinces/supprimer_province.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression de la province',
      };
    }

    return data;
  } catch (error) {
    console.error('Delete province error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression de la province',
    };
  }
};

/**
 * Change le statut d'une province (actif/inactif)
 */
export const toggleProvinceStatus = async (
  id: number,
  actif: boolean
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/provinces/changer_statut_province.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut de la province',
      };
    }

    return data;
  } catch (error) {
    console.error('Toggle province status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut de la province',
    };
  }
};

/**
 * Recherche des provinces par terme de recherche
 */
export const searchProvinces = async (searchTerm: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/provinces/rechercher_provinces.php?search=${encodeURIComponent(searchTerm)}`,
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
        message: data.message || 'Échec de la recherche des provinces',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Search provinces error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des provinces',
    };
  }
};