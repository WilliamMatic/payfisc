// services/energies/energieService.ts

export interface Energie {
  id: number;
  nom: string;
  description: string;
  couleur: string;
  actif: boolean;
  date_creation: string;
}

export interface ApiResponse {
  status: 'success' | 'error';
  message?: string;
  data?: any;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls';

export const getEnergies = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/energies/lister_energies.php`, {
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
        message: data.message || 'Échec de la récupération des énergies',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get energies error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des énergies',
    };
  }
};

export const addEnergie = async (energieData: {
  nom: string;
  description?: string;
  couleur?: string;
}): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('nom', energieData.nom);
    if (energieData.description) formData.append('description', energieData.description);
    if (energieData.couleur) formData.append('couleur', energieData.couleur);

    const response = await fetch(`${API_BASE_URL}/energies/creer_energie.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout de l\'énergie',
      };
    }

    return data;
  } catch (error) {
    console.error('Add energie error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout de l\'énergie',
    };
  }
};

export const updateEnergie = async (
  id: number,
  energieData: {
    nom: string;
    description?: string;
    couleur?: string;
  }
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('nom', energieData.nom);
    if (energieData.description) formData.append('description', energieData.description);
    if (energieData.couleur) formData.append('couleur', energieData.couleur);

    const response = await fetch(`${API_BASE_URL}/energies/modifier_energie.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification de l\'énergie',
      };
    }

    return data;
  } catch (error) {
    console.error('Update energie error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification de l\'énergie',
    };
  }
};

export const deleteEnergie = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/energies/supprimer_energie.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression de l\'énergie',
      };
    }

    return data;
  } catch (error) {
    console.error('Delete energie error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression de l\'énergie',
    };
  }
};

export const toggleEnergieStatus = async (
  id: number,
  actif: boolean
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/energies/changer_statut_energie.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut de l\'énergie',
      };
    }

    return data;
  } catch (error) {
    console.error('Toggle energie status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut de l\'énergie',
    };
  }
};