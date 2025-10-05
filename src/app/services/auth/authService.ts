/**
 * Service d'authentification - Interface avec l'API backend
 */

// Interface pour les données d'un agent connecté
export interface AgentSession {
  id: number;
  nom: string;
  prenom: string;
  email: string;
}

// Interface pour les privilèges
export interface Privilege {
  id: number;
  module: string;
  action: string;
  description: string;
  selected: boolean;
}

// Interface pour la réponse de login
export interface LoginResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    agent: AgentSession;
    privileges: Privilege[];
  };
}

// Interface pour la vérification de session
export interface SessionCheckResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    agent: AgentSession;
    privileges: Privilege[];
  };
}

// Interface pour la réponse de réinitialisation de mot de passe
export interface PasswordResetResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    agent_id?: number;
  };
}

// Interface pour la réponse de vérification de code
export interface VerifyCodeResponse {
  status: 'success' | 'error';
  message?: string;
  agent_id?: number; // Changé ici
}

// URL de base de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls';

/**
 * Authentifie un agent
 */
export const loginAgent = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'authentification',
      };
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'authentification',
    };
  }
};

/**
 * Déconnecte l'agent
 */
export const logoutAgent = async (): Promise<{ status: 'success' | 'error'; message?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout.php`, {
      method: 'POST',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la déconnexion',
      };
    }

    return data;
  } catch (error) {
    console.error('Logout error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la déconnexion',
    };
  }
};

/**
 * Vérifie si une session est active
 */
export const checkSession = async (): Promise<SessionCheckResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/check_session.php`, {
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
        message: data.message || 'Session invalide',
      };
    }

    return data;
  } catch (error) {
    console.error('Session check error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification de session',
    };
  }
};

/**
 * Demande l'envoi d'un code de réinitialisation
 */
export const requestPasswordReset = async (email: string): Promise<PasswordResetResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/request_reset.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la demande de réinitialisation',
      };
    }

    return data;
  } catch (error) {
    console.error('Password reset request error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la demande de réinitialisation',
    };
  }
};

/**
 * Vérifie un code de réinitialisation
 */
// Dans verifyResetCode, modifiez le type de retour
export const verifyResetCode = async (email: string, code: string): Promise<VerifyCodeResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify_code.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Code invalide',
      };
    }

    return data;
  } catch (error) {
    console.error('Code verification error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification du code',
    };
  }
};

/**
 * Réinitialise le mot de passe
 */
export const resetPassword = async (agentId: number, code: string, newPassword: string): Promise<PasswordResetResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset_password.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agent_id: agentId, code, new_password: newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la réinitialisation',
      };
    }

    return data;
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la réinitialisation',
    };
  }
};