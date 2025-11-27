// services/utilisateurs/utilisateurService.ts

/**
 * Service pour la gestion des utilisateurs - Interface avec l'API backend
 */

// Interface pour les privilèges d'un utilisateur
export interface Privileges {
  simple: boolean;
  special: boolean;
  delivrance: boolean;
  plaque: boolean;
  reproduction: boolean;
}

// Interface pour les données d'un utilisateur
export interface Utilisateur {
  id: number;
  nom_complet: string;
  telephone: string;
  adresse: string;
  actif: boolean;
  site_nom: string;
  site_code: string;
  site_affecte_id: number;
  date_creation: string;
  privileges: Privileges;
}

// Interface pour les sites
export interface Site {
  id: number;
  nom: string;
  code: string;
}

// Interface pour les données de formulaire utilisateur
export interface UtilisateurFormData {
  nom_complet: string;
  telephone: string;
  adresse: string;
  site_affecte_id: number;
  privileges: Privileges;
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
 * Récupère la liste de tous les utilisateurs
 */
export const getUtilisateurs = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/utilisateurs/lister_utilisateurs.php`, {
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
        message: data.message || 'Échec de la récupération des utilisateurs',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get utilisateurs error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des utilisateurs',
    };
  }
};

/**
 * Ajoute un nouvel utilisateur
 */
export const addUtilisateur = async (utilisateurData: UtilisateurFormData): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('nom_complet', utilisateurData.nom_complet);
    formData.append('telephone', utilisateurData.telephone);
    formData.append('adresse', utilisateurData.adresse);
    formData.append('site_affecte_id', utilisateurData.site_affecte_id.toString());
    formData.append('privileges', JSON.stringify(utilisateurData.privileges));

    const response = await fetch(`${API_BASE_URL}/utilisateurs/creer_utilisateur.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout de l\'utilisateur',
      };
    }

    return data;
  } catch (error) {
    console.error('Add utilisateur error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout de l\'utilisateur',
    };
  }
};

/**
 * Modifie un utilisateur existant
 */
export const updateUtilisateur = async (
  id: number,
  utilisateurData: UtilisateurFormData
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('nom_complet', utilisateurData.nom_complet);
    formData.append('telephone', utilisateurData.telephone);
    formData.append('adresse', utilisateurData.adresse);
    formData.append('site_affecte_id', utilisateurData.site_affecte_id.toString());
    formData.append('privileges', JSON.stringify(utilisateurData.privileges));

    const response = await fetch(`${API_BASE_URL}/utilisateurs/modifier_utilisateur.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification de l\'utilisateur',
      };
    }

    return data;
  } catch (error) {
    console.error('Update utilisateur error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification de l\'utilisateur',
    };
  }
};

/**
 * Supprime un utilisateur
 */
export const deleteUtilisateur = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/utilisateurs/supprimer_utilisateur.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression de l\'utilisateur',
      };
    }

    return data;
  } catch (error) {
    console.error('Delete utilisateur error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression de l\'utilisateur',
    };
  }
};

/**
 * Change le statut d'un utilisateur (actif/inactif)
 */
export const toggleUtilisateurStatus = async (
  id: number,
  actif: boolean
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/utilisateurs/changer_statut_utilisateur.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut de l\'utilisateur',
      };
    }

    return data;
  } catch (error) {
    console.error('Toggle utilisateur status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut de l\'utilisateur',
    };
  }
};

/**
 * Recherche des utilisateurs
 */
export const searchUtilisateurs = async (searchTerm: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/utilisateurs/rechercher_utilisateurs.php?search=${encodeURIComponent(searchTerm)}`,
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
        message: data.message || 'Échec de la recherche des utilisateurs',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Search utilisateurs error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des utilisateurs',
    };
  }
};

/**
 * Récupère la liste des sites actifs
 */
export const getSitesActifs = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/utilisateurs/lister_sites_actifs.php`, {
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