// services/agents/agentService.ts

/**
 * Service pour la gestion des agents - Interface avec l'API backend
 */

// Interface pour les données d'un agent
export interface Agent {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  actif: boolean;
  date_creation: string;
}

// Interface pour les privilèges d'un agent
export interface Privilege {
  id: number;
  module: string;
  action: string;
  description: string;
  selected: boolean;
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
 * Récupère la liste de tous les agents
 */
export const getAgents = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/agents/lister_agents.php`, {
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
        message: data.message || 'Échec de la récupération des agents',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get agents error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des agents',
    };
  }
};

/**
 * Ajoute un nouvel agent
 */
export const addAgent = async (agentData: {
  nom: string;
  prenom: string;
  email: string;
}): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('nom', agentData.nom);
    formData.append('prenom', agentData.prenom);
    formData.append('email', agentData.email);

    const response = await fetch(`${API_BASE_URL}/agents/creer_agent.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'ajout de l\'agent',
      };
    }

    return data;
  } catch (error) {
    console.error('Add agent error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout de l\'agent',
    };
  }
};

/**
 * Modifie un agent existant
 */
export const updateAgent = async (
  id: number,
  agentData: {
    nom: string;
    prenom: string;
    email: string;
  }
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('nom', agentData.nom);
    formData.append('prenom', agentData.prenom);
    formData.append('email', agentData.email);

    const response = await fetch(`${API_BASE_URL}/agents/modifier_agent.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la modification de l\'agent',
      };
    }

    return data;
  } catch (error) {
    console.error('Update agent error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification de l\'agent',
    };
  }
};

/**
 * Supprime un agent
 */
export const deleteAgent = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());

    const response = await fetch(`${API_BASE_URL}/agents/supprimer_agent.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la suppression de l\'agent',
      };
    }

    return data;
  } catch (error) {
    console.error('Delete agent error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression de l\'agent',
    };
  }
};

/**
 * Change le statut d'un agent (actif/inactif)
 */
export const toggleAgentStatus = async (
  id: number,
  actif: boolean
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('actif', actif.toString());

    const response = await fetch(`${API_BASE_URL}/agents/changer_statut_agent.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du changement de statut de l\'agent',
      };
    }

    return data;
  } catch (error) {
    console.error('Toggle agent status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut de l\'agent',
    };
  }
};

/**
 * Récupère les privilèges d'un agent
 */
export const getAgentPrivileges = async (agentId: number): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/agents/get_privileges.php?agent_id=${agentId}`,
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
        message: data.message || 'Échec de la récupération des privilèges',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Get agent privileges error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des privilèges',
    };
  }
};

/**
 * Met à jour les privilèges d'un agent
 */
export const updateAgentPrivileges = async (
  agentId: number,
  privileges: Privilege[]
): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/agents/gerer_privileges.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        agent_id: agentId.toString(),
        privileges: JSON.stringify(privileges),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la mise à jour des privilèges',
      };
    }

    return data;
  } catch (error) {
    console.error('Update agent privileges error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la mise à jour des privilèges',
    };
  }
};