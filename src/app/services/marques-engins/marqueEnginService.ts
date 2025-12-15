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
  modeles_count?: number;
}

// Interface pour les données d'un modèle d'engin
export interface ModeleEngin {
  id: number;
  libelle: string;
  description: string;
  marque_engin_id: number;
  marque_libelle: string;
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

// ============================================================================
// SERVICES POUR LES MARQUES
// ============================================================================

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
 * Recherche des marques par type d'engin et terme de recherche
 */
export const rechercherMarques = async (
  typeEngin: string,
  searchTerm: string
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("type_engin", typeEngin);
    formData.append("search_term", searchTerm);

    const response = await fetch(
      `${API_BASE_URL}/marques-engins/rechercher__marques.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la recherche des marques",
      };
    }

    return data;
  } catch (error) {
    console.error("Rechercher marques error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des marques",
    };
  }
};

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

// ============================================================================
// SERVICES POUR LES MODÈLES
// ============================================================================

export const getModelesEngins = async (marqueId?: number): Promise<ApiResponse> => {
  try {
    const url = marqueId 
      ? `${API_BASE_URL}/marques-engins/lister_modeles.php?marque_id=${marqueId}`
      : `${API_BASE_URL}/marques-engins/lister_modeles.php`;

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
        message: data.message || 'Échec de la récupération des modèles d\'engins',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get modeles engins error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des modèles d\'engins',
    };
  }
};

export const addModeleEngin = async (modeleData: {
  libelle: string;
  description: string;
  marque_engin_id: number;
}): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('libelle', modeleData.libelle);
    formData.append('description', modeleData.description);
    formData.append('marque_engin_id', modeleData.marque_engin_id.toString());

    const response = await fetch(`${API_BASE_URL}/marques-engins/creer_modele.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout du modèle',
      };
    }

    return data;
  } catch (error) {
    console.error('Add modele engin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout du modèle',
    };
  }
};

export const updateModeleEngin = async (
  id: number,
  modeleData: {
    libelle: string;
    description: string;
    marque_engin_id: number;
  }
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('libelle', modeleData.libelle);
    formData.append('description', modeleData.description);
    formData.append('marque_engin_id', modeleData.marque_engin_id.toString());

    const response = await fetch(`${API_BASE_URL}/marques-engins/modifier_modele.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification du modèle',
      };
    }

    return data;
  } catch (error) {
    console.error('Update modele engin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification du modèle',
    };
  }
};

export const deleteModeleEngin = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/marques-engins/supprimer_modele.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression du modèle',
      };
    }

    return data;
  } catch (error) {
    console.error('Delete modele engin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression du modèle',
    };
  }
};

export const toggleModeleEnginStatus = async (
  id: number,
  actif: boolean
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/marques-engins/changer_statut_modele.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut du modèle',
      };
    }

    return data;
  } catch (error) {
    console.error('Toggle modele engin status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut du modèle',
    };
  }
};