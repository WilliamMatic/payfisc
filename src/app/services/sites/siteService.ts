/**
 * Service pour la gestion des sites - Interface avec l'API backend
 */

// Interface pour les données d'un site
export interface Site {
  id: number;
  nom: string;
  code: string;
  description: string;
  formule: string;
  province_id: number;
  province_nom: string;
  actif: boolean;
  date_creation: string;
}

// Interface pour les données d'une province
export interface Province {
  id: number;
  nom: string;
  code: string;
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
 * Récupère la liste de tous les sites
 */
export const getSites = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/sites/lister_sites.php`, {
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
        message: data.message || 'Échec de la récupération des sites',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get sites error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des sites',
    };
  }
};

/**
 * Récupère la liste de toutes les provinces actives
 */
export const getProvinces = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/sites/lister_provinces.php`, {
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
 * Ajoute un nouveau site
 */
export const addSite = async (siteData: {
  nom: string;
  code: string;
  description: string;
  formule: string;
  province_id: number;
}): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('nom', siteData.nom);
    formData.append('code', siteData.code);
    formData.append('description', siteData.description);
    formData.append('formule', siteData.formule);
    formData.append('province_id', siteData.province_id.toString());

    const response = await fetch(`${API_BASE_URL}/sites/creer_site.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout du site',
      };
    }

    return data;
  } catch (error) {
    console.error('Add site error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout du site',
    };
  }
};

/**
 * Modifie un site existant
 */
export const updateSite = async (
  id: number,
  siteData: {
    nom: string;
    code: string;
    description: string;
    formule: string;
    province_id: number;
  }
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('nom', siteData.nom);
    formData.append('code', siteData.code);
    formData.append('description', siteData.description);
    formData.append('formule', siteData.formule);
    formData.append('province_id', siteData.province_id.toString());

    const response = await fetch(`${API_BASE_URL}/sites/modifier_site.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification du site',
      };
    }

    return data;
  } catch (error) {
    console.error('Update site error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification du site',
    };
  }
};

/**
 * Supprime un site
 */
export const deleteSite = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/sites/supprimer_site.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression du site',
      };
    }

    return data;
  } catch (error) {
    console.error('Delete site error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression du site',
    };
  }
};

/**
 * Change le statut d'un site (actif/inactif)
 */
export const toggleSiteStatus = async (
  id: number,
  actif: boolean
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/sites/changer_statut_site.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut du site',
      };
    }

    return data;
  } catch (error) {
    console.error('Toggle site status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut du site',
    };
  }
};

/**
 * Recherche des sites par terme
 */
export const searchSites = async (searchTerm: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sites/rechercher_sites.php?search=${encodeURIComponent(searchTerm)}`,
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
        message: data.message || 'Échec de la recherche des sites',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Search sites error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des sites',
    };
  }
};