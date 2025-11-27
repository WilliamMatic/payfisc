// services/taux/tauxService.ts

/**
 * Service pour la gestion des taux - Interface avec l'API backend
 */

// Interface pour les données d'un taux
export interface Taux {
  id: number;
  nom: string;
  valeur: number;
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
 * Récupère la liste de tous les taux
 */
export const getTaux = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/taux/lister_taux.php`, {
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
        message: data.message || 'Échec de la récupération des taux',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get taux error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des taux',
    };
  }
};

/**
 * Ajoute un nouveau taux
 */
export const addTaux = async (tauxData: {
  nom: string;
  valeur: number;
  description: string;
}): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('nom', tauxData.nom);
    formData.append('valeur', tauxData.valeur.toString());
    formData.append('description', tauxData.description);

    const response = await fetch(`${API_BASE_URL}/taux/creer_taux.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout du taux',
      };
    }

    return data;
  } catch (error) {
    console.error('Add taux error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout du taux',
    };
  }
};

/**
 * Modifie un taux existant
 */
export const updateTaux = async (
  id: number,
  tauxData: {
    nom: string;
    valeur: number;
    description: string;
  }
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('nom', tauxData.nom);
    formData.append('valeur', tauxData.valeur.toString());
    formData.append('description', tauxData.description);

    const response = await fetch(`${API_BASE_URL}/taux/modifier_taux.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification du taux',
      };
    }

    return data;
  } catch (error) {
    console.error('Update taux error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification du taux',
    };
  }
};

/**
 * Supprime un taux
 */
export const deleteTaux = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/taux/supprimer_taux.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression du taux',
      };
    }

    return data;
  } catch (error) {
    console.error('Delete taux error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression du taux',
    };
  }
};

/**
 * Active un taux
 */
export const activateTaux = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/taux/activer_taux.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'activation du taux',
      };
    }

    return data;
  } catch (error) {
    console.error('Activate taux error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'activation du taux',
    };
  }
};

/**
 * Désactive un taux
 */
export const deactivateTaux = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/taux/desactiver_taux.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la désactivation du taux',
      };
    }

    return data;
  } catch (error) {
    console.error('Deactivate taux error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la désactivation du taux',
    };
  }
};

/**
 * Récupère le taux actif
 */
export const getTauxActif = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/taux/get_taux_actif.php`, {
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
        message: data.message || 'Échec de la récupération du taux actif',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get taux actif error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération du taux actif',
    };
  }
};