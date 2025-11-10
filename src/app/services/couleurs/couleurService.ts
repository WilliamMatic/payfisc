// services/couleurs/couleurService.ts

/**
 * Service pour la gestion des couleurs d'engins - Interface avec l'API backend
 */

// Interface pour les données d'une couleur
export interface EnginCouleur {
  id: number;
  nom: string;
  code_hex: string;
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
 * Récupère la liste de toutes les couleurs
 */
export const getCouleurs = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/couleurs/lister_couleurs.php`, {
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
        message: data.message || 'Échec de la récupération des couleurs',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get couleurs error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des couleurs',
    };
  }
};

/**
 * Ajoute une nouvelle couleur
 */
export const addCouleur = async (couleurData: {
  nom: string;
  code_hex: string;
}): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('nom', couleurData.nom);
    formData.append('code_hex', couleurData.code_hex);

    const response = await fetch(`${API_BASE_URL}/couleurs/creer_couleur.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout de la couleur',
      };
    }

    return data;
  } catch (error) {
    console.error('Add couleur error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout de la couleur',
    };
  }
};

/**
 * Modifie une couleur existante
 */
export const updateCouleur = async (
  id: number,
  couleurData: {
    nom: string;
    code_hex: string;
  }
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('nom', couleurData.nom);
    formData.append('code_hex', couleurData.code_hex);

    const response = await fetch(`${API_BASE_URL}/couleurs/modifier_couleur.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification de la couleur',
      };
    }

    return data;
  } catch (error) {
    console.error('Update couleur error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification de la couleur',
    };
  }
};

/**
 * Supprime une couleur
 */
export const deleteCouleur = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/couleurs/supprimer_couleur.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression de la couleur',
      };
    }

    return data;
  } catch (error) {
    console.error('Delete couleur error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression de la couleur',
    };
  }
};

/**
 * Change le statut d'une couleur (actif/inactif)
 */
export const toggleCouleurStatus = async (
  id: number,
  actif: boolean
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/couleurs/changer_statut_couleur.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut de la couleur',
      };
    }

    return data;
  } catch (error) {
    console.error('Toggle couleur status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut de la couleur',
    };
  }
};