// services/admins/adminService.ts

/**
 * Service pour la gestion des administrateurs - Interface avec l'API backend
 */

// Interface pour les données d'un administrateur
export interface Admin {
  id: number;
  nom_complet: string;
  email: string;
  telephone: string;
  role: 'super' | 'partenaire';
  province_id: number | null;
  province_nom: string | null;
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
  password?: string; // Pour la réinitialisation de mot de passe
}

// URL de base de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls';

/**
 * Récupère la liste de tous les administrateurs
 */
export const getAdmins = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admins/lister_admins.php`, {
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
        message: data.message || 'Échec de la récupération des administrateurs',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get admins error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des administrateurs',
    };
  }
};

/**
 * Récupère la liste de toutes les provinces actives
 */
export const getProvinces = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admins/lister_provinces.php`, {
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
 * Ajoute un nouvel administrateur
 */
export const addAdmin = async (adminData: {
  nom_complet: string;
  email: string;
  telephone: string;
  role: 'super' | 'partenaire';
  province_id: number | null;
}): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('nom_complet', adminData.nom_complet);
    formData.append('email', adminData.email);
    formData.append('telephone', adminData.telephone);
    formData.append('role', adminData.role);
    if (adminData.province_id) {
      formData.append('province_id', adminData.province_id.toString());
    }

    const response = await fetch(`${API_BASE_URL}/admins/creer_admin.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout de l\'administrateur',
      };
    }

    return data;
  } catch (error) {
    console.error('Add admin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout de l\'administrateur',
    };
  }
};

/**
 * Modifie un administrateur existant
 */
export const updateAdmin = async (
  id: number,
  adminData: {
    nom_complet: string;
    email: string;
    telephone: string;
    role: 'super' | 'partenaire';
    province_id: number | null;
  }
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('nom_complet', adminData.nom_complet);
    formData.append('email', adminData.email);
    formData.append('telephone', adminData.telephone);
    formData.append('role', adminData.role);
    if (adminData.province_id) {
      formData.append('province_id', adminData.province_id.toString());
    } else {
      formData.append('province_id', '');
    }

    const response = await fetch(`${API_BASE_URL}/admins/modifier_admin.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification de l\'administrateur',
      };
    }

    return data;
  } catch (error) {
    console.error('Update admin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification de l\'administrateur',
    };
  }
};

/**
 * Réinitialise le mot de passe d'un administrateur
 */
export const resetAdminPassword = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/admins/reinitialiser_mot_de_passe.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la réinitialisation du mot de passe',
      };
    }

    return data;
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la réinitialisation du mot de passe',
    };
  }
};

/**
 * Supprime un administrateur
 */
export const deleteAdmin = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/admins/supprimer_admin.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression de l\'administrateur',
      };
    }

    return data;
  } catch (error) {
    console.error('Delete admin error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression de l\'administrateur',
    };
  }
};

/**
 * Change le statut d'un administrateur (actif/inactif)
 */
export const toggleAdminStatus = async (
  id: number,
  actif: boolean
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/admins/changer_statut_admin.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut de l\'administrateur',
      };
    }

    return data;
  } catch (error) {
    console.error('Toggle admin status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut de l\'administrateur',
    };
  }
};

/**
 * Recherche des administrateurs par terme
 */
export const searchAdmins = async (searchTerm: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admins/rechercher_admins.php?search=${encodeURIComponent(searchTerm)}`,
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
        message: data.message || 'Échec de la recherche des administrateurs',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Search admins error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des administrateurs',
    };
  }
};