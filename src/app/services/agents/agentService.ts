'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Server Actions pour la gestion des agents avec Cache Components Next.js 16
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
  moduleName: string;
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

// Interface pour la pagination
export interface PaginationResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    agents: Agent[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

// URL de base de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls';

// Tags de cache pour invalidation ciblée
const CACHE_TAGS = {
  AGENTS_LIST: 'agents-list',
  AGENTS_ACTIFS: 'agents-actifs',
  AGENT_DETAILS: (id: number) => `agent-${id}`,
  AGENTS_SEARCH: 'agents-search',
  AGENT_PRIVILEGES: (id: number) => `agent-privileges-${id}`,
  ALL_PRIVILEGES: 'all-privileges',
};

/**
 * Invalide le cache après une mutation avec stale-while-revalidate
 */
async function invalidateAgentsCache(agentId?: number) {
  'use server';
  
  revalidateTag(CACHE_TAGS.AGENTS_LIST, "max");
  revalidateTag(CACHE_TAGS.AGENTS_ACTIFS, "max");
  revalidateTag(CACHE_TAGS.AGENTS_SEARCH, "max");
  revalidateTag(CACHE_TAGS.ALL_PRIVILEGES, "max");
  
  if (agentId) {
    revalidateTag(CACHE_TAGS.AGENT_DETAILS(agentId), "max");
    revalidateTag(CACHE_TAGS.AGENT_PRIVILEGES(agentId), "max");
  }
}

// Nettoyer les données
export async function cleanAgentData(data: any): Promise<Agent> {
  return {
    id: data.id || 0,
    nom: data.nom || "",
    prenom: data.prenom || "",
    email: data.email || "",
    actif: Boolean(data.actif),
    date_creation: data.date_creation || "",
  };
}

/**
 * 💾 Récupère la liste de tous les agents (AVEC CACHE - 2 heures)
 */
export async function getAgents(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.AGENTS_LIST);

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

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanAgentData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get agents error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des agents',
    };
  }
}

/**
 * 💾 Récupère la liste des agents actifs (AVEC CACHE - 2 heures)
 */
export async function getAgentsActifs(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.AGENTS_ACTIFS);

  try {
    const response = await fetch(`${API_BASE_URL}/agents/lister_agents_actifs.php`, {
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
        message: data.message || 'Échec de la récupération des agents actifs',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanAgentData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Get agents actifs error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des agents actifs',
    };
  }
}

/**
 * 🔄 Ajoute un nouvel agent (INVALIDE LE CACHE)
 */
export async function addAgent(agentData: {
  nom: string;
  prenom: string;
  email: string;
}): Promise<ApiResponse> {
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

    await invalidateAgentsCache();

    return data;
  } catch (error) {
    console.error('Add agent error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'ajout de l\'agent',
    };
  }
}

/**
 * 🔄 Modifie un agent existant (INVALIDE LE CACHE)
 */
export async function updateAgent(
  id: number,
  agentData: {
    nom: string;
    prenom: string;
    email: string;
  }
): Promise<ApiResponse> {
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

    await invalidateAgentsCache(id);

    return data;
  } catch (error) {
    console.error('Update agent error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la modification de l\'agent',
    };
  }
}

/**
 * 🔄 Supprime un agent (INVALIDE LE CACHE)
 */
export async function deleteAgent(id: number): Promise<ApiResponse> {
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

    await invalidateAgentsCache(id);

    return data;
  } catch (error) {
    console.error('Delete agent error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression de l\'agent',
    };
  }
}

/**
 * 🔄 Change le statut d'un agent (actif/inactif) (INVALIDE LE CACHE)
 */
export async function toggleAgentStatus(
  id: number,
  actif: boolean
): Promise<ApiResponse> {
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

    await invalidateAgentsCache(id);

    return data;
  } catch (error) {
    console.error('Toggle agent status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du changement de statut de l\'agent',
    };
  }
}

/**
 * 💾 Récupère les privilèges d'un agent (AVEC CACHE - 2 heures)
 */
export async function getAgentPrivileges(agentId: number): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.AGENT_PRIVILEGES(agentId));

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
}

/**
 * 🔄 Met à jour les privilèges d'un agent (INVALIDE LE CACHE)
 */
export async function updateAgentPrivileges(
  agentId: number,
  privileges: Privilege[]
): Promise<ApiResponse> {
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

    await invalidateAgentsCache(agentId);

    return data;
  } catch (error) {
    console.error('Update agent privileges error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la mise à jour des privilèges',
    };
  }
}

/**
 * 💾 Recherche des agents par terme (AVEC CACHE - 2 heures)
 */
export async function searchAgents(searchTerm: string): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.AGENTS_SEARCH, `search-${searchTerm}`);

  try {
    const response = await fetch(
      `${API_BASE_URL}/agents/rechercher_agents.php?search=${encodeURIComponent(searchTerm)}`,
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
        message: data.message || 'Échec de la recherche des agents',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanAgentData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Search agents error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des agents',
    };
  }
}

/**
 * 🌊 Vérifie si un agent existe déjà par son email (PAS DE CACHE)
 */
export async function checkAgentByEmail(email: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/agents/verifier_agent.php?email=${encodeURIComponent(email)}`,
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
        message: data.message || 'Échec de la vérification de l\'agent',
      };
    }

    return {
      status: 'success',
      data: data.data,
    };
  } catch (error) {
    console.error('Check agent by email error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification de l\'agent',
    };
  }
}

/**
 * 💾 Récupère un agent par son ID (AVEC CACHE - 2 heures)
 */
export async function getAgentById(id: number): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.AGENT_DETAILS(id));

  try {
    const response = await fetch(
      `${API_BASE_URL}/agents/get_agent.php?id=${id}`,
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
        message: data.message || 'Échec de la récupération de l\'agent',
      };
    }

    return {
      status: 'success',
      data: await cleanAgentData(data.data),
    };
  } catch (error) {
    console.error('Get agent by ID error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération de l\'agent',
    };
  }
}

/**
 * 💾 Récupère tous les privilèges disponibles (AVEC CACHE - 2 heures)
 */
export async function getAllPrivileges(): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.ALL_PRIVILEGES);

  try {
    const response = await fetch(
      `${API_BASE_URL}/agents/get_all_privileges.php`,
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
    console.error('Get all privileges error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des privilèges',
    };
  }
}

/**
 * 💾 Récupère les agents avec pagination (AVEC CACHE - 2 heures)
 */
export async function getAgentsPaginees(page: number = 1, limit: number = 10, searchTerm: string = ''): Promise<PaginationResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.AGENTS_LIST, `page-${page}-search-${searchTerm}`);

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }

    const response = await fetch(
      `${API_BASE_URL}/agents/lister_agents_paginees.php?${params.toString()}`,
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
        message: data.message || 'Échec de la récupération des agents paginés',
      };
    }

    const cleanedData = Array.isArray(data.data?.agents)
      ? await Promise.all(data.data.agents.map(async (item: any) => await cleanAgentData(item)))
      : [];

    return {
      status: 'success',
      data: {
        agents: cleanedData,
        pagination: data.data?.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    };
  } catch (error) {
    console.error('Get agents paginees error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des agents paginés',
    };
  }
}

/**
 * 💾 Recherche des agents par statut (AVEC CACHE - 2 heures)
 */
export async function searchAgentsByStatus(actif: boolean, searchTerm?: string): Promise<ApiResponse> {
  'use cache';
  cacheLife('hours');
  cacheTag(CACHE_TAGS.AGENTS_SEARCH, `status-${actif}-search-${searchTerm || ''}`);

  try {
    const params = new URLSearchParams({
      actif: actif.toString(),
    });
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }

    const response = await fetch(
      `${API_BASE_URL}/agents/rechercher_agents_par_statut.php?${params.toString()}`,
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
        message: data.message || 'Échec de la recherche des agents par statut',
      };
    }

    const cleanedData = Array.isArray(data.data)
      ? await Promise.all(data.data.map(async (item: any) => await cleanAgentData(item)))
      : [];

    return {
      status: 'success',
      data: cleanedData,
    };
  } catch (error) {
    console.error('Search agents by status error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des agents par statut',
    };
  }
}