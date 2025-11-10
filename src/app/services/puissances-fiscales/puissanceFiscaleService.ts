/**
 * Service pour la gestion des puissances fiscales - Interface avec l'API backend
 */

// Interface pour les données d'une puissance fiscale
export interface PuissanceFiscale {
  id: number;
  libelle: string;
  valeur: number;
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
 * Récupère la liste de toutes les puissances fiscales
 */
export const getPuissancesFiscales = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/puissances-fiscales/lister_puissances_fiscales.php`, {
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
        message: data.message || 'Échec de la récupération des puissances fiscales',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get puissances fiscales error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des puissances fiscales',
    };
  }
};

/**
 * Récupère la liste des puissances fiscales actives
 */
export const getPuissancesFiscalesActives = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/puissances-fiscales/lister_puissances_fiscales_actives.php`, {
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
        message: data.message || 'Échec de la récupération des puissances fiscales actives',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get puissances fiscales actives error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des puissances fiscales actives',
    };
  }
};

/**
 * Ajoute une nouvelle puissance fiscale
 */
export const addPuissanceFiscale = async (puissanceFiscaleData: {
  libelle: string;
  valeur: number;
  type_engin_id: number;
  description?: string;
}): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('libelle', puissanceFiscaleData.libelle);
    formData.append('valeur', puissanceFiscaleData.valeur.toString());
    formData.append('type_engin_id', puissanceFiscaleData.type_engin_id.toString());
    if (puissanceFiscaleData.description) {
      formData.append('description', puissanceFiscaleData.description);
    }

    const response = await fetch(`${API_BASE_URL}/puissances-fiscales/creer_puissance_fiscale.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout de la puissance fiscale',
      };
    }

    return data;
  } catch (error) {
    console.error('Add puissance fiscale error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout de la puissance fiscale',
    };
  }
};

/**
 * Modifie une puissance fiscale existante
 */
export const updatePuissanceFiscale = async (
  id: number,
  puissanceFiscaleData: {
    libelle: string;
    valeur: number;
    type_engin_id: number;
    description?: string;
  }
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('libelle', puissanceFiscaleData.libelle);
    formData.append('valeur', puissanceFiscaleData.valeur.toString());
    formData.append('type_engin_id', puissanceFiscaleData.type_engin_id.toString());
    if (puissanceFiscaleData.description) {
      formData.append('description', puissanceFiscaleData.description);
    }

    const response = await fetch(`${API_BASE_URL}/puissances-fiscales/modifier_puissance_fiscale.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification de la puissance fiscale',
      };
    }

    return data;
  } catch (error) {
    console.error('Update puissance fiscale error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification de la puissance fiscale',
    };
  }
};

/**
 * Supprime une puissance fiscale
 */
export const deletePuissanceFiscale = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/puissances-fiscales/supprimer_puissance_fiscale.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression de la puissance fiscale',
      };
    }

    return data;
  } catch (error) {
    console.error('Delete puissance fiscale error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression de la puissance fiscale',
    };
  }
};

/**
 * Change le statut d'une puissance fiscale (actif/inactif)
 */
export const togglePuissanceFiscaleStatus = async (
  id: number,
  actif: boolean
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/puissances-fiscales/changer_statut_puissance_fiscale.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut de la puissance fiscale',
      };
    }

    return data;
  } catch (error) {
    console.error('Toggle puissance fiscale status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut de la puissance fiscale',
    };
  }
};

/**
 * Recherche des puissances fiscales par terme
 */
export const searchPuissancesFiscales = async (searchTerm: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/puissances-fiscales/rechercher_puissances_fiscales.php?search=${encodeURIComponent(searchTerm)}`,
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
        message: data.message || 'Échec de la recherche des puissances fiscales',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Search puissances fiscales error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des puissances fiscales',
    };
  }
};