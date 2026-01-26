'use server';

/**
 * Server Actions pour l'authentification - Interface avec l'API backend
 */

// Interface pour les données d'un agent connecté
export interface AgentSession {
  id: number;
  nom: string;
  prenom: string;
  email: string;
}

// Interface pour les données d'un utilisateur connecté
export interface UtilisateurSession {
  id: number;
  nom_complet: string;
  telephone: string;
  adresse: string;
  site_nom: string;
  site_code: string;
  formule: string;
  privileges: any;
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
    agent?: AgentSession;
    utilisateur?: UtilisateurSession;
    privileges?: Privilege[];
  };
}

// Interface pour la vérification de session
export interface SessionCheckResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    agent?: AgentSession;
    utilisateur?: UtilisateurSession;
    privileges?: Privilege[];
  };
}

// Interface pour la réponse de réinitialisation de mot de passe
export interface PasswordResetResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    agent_id?: number;
    utilisateur_id?: number;
    user_type?: 'agent' | 'utilisateur';
  };
}

// Interface pour la réponse de vérification de code
export interface VerifyCodeResponse {
  status: 'success' | 'error';
  message?: string;
  agent_id?: number;
  utilisateur_id?: number;
  user_type?: 'agent' | 'utilisateur';
}

// URL de base de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls';

/**
 * Authentifie un agent
 */
export const loginAgent = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    console.log("=== DEBUT AUTHENTIFICATION AGENT ===");
    console.log("Email:", email);
    
    const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log("Statut HTTP:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP login agent:", errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: 'Échec de l\'authentification' };
      }
      
      return {
        status: 'error',
        message: errorData.message || 'Échec de l\'authentification',
      };
    }

    const data = await response.json();
    console.log("Réponse login agent:", data);
    console.log("=== FIN AUTHENTIFICATION AGENT ===");
    
    return data;
  } catch (error) {
    console.error('Login agent error complet:', error);
    return {
      status: 'error',
      message: `Erreur réseau lors de l'authentification: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
};

/**
 * Authentifie un utilisateur
 */
export const loginUtilisateur = async (telephone: string, password: string): Promise<LoginResponse> => {
  try {
    console.log("=== DEBUT AUTHENTIFICATION UTILISATEUR ===");
    console.log("Téléphone:", telephone);
    
    const response = await fetch(`${API_BASE_URL}/auth/login_utilisateur.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telephone, password }),
    });

    console.log("Statut HTTP:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP login utilisateur:", errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: 'Échec de l\'authentification' };
      }
      
      return {
        status: 'error',
        message: errorData.message || 'Échec de l\'authentification',
      };
    }

    const data = await response.json();
    console.log("Réponse login utilisateur:", data);
    console.log("=== FIN AUTHENTIFICATION UTILISATEUR ===");
    
    return data;
  } catch (error) {
    console.error('Login utilisateur error complet:', error);
    return {
      status: 'error',
      message: `Erreur réseau lors de l'authentification: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
};

/**
 * Déconnecte l'utilisateur/agent
 */
export const logoutUser = async (): Promise<{ status: 'success' | 'error'; message?: string }> => {
  try {
    console.log("=== DEBUT DÉCONNEXION ===");
    
    const response = await fetch(`${API_BASE_URL}/auth/logout.php`, {
      method: 'POST',
      credentials: 'include',
    });

    console.log("Statut HTTP déconnexion:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP déconnexion:", errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: 'Échec de la déconnexion' };
      }
      
      return {
        status: 'error',
        message: errorData.message || 'Échec de la déconnexion',
      };
    }

    const data = await response.json();
    console.log("Réponse déconnexion:", data);
    console.log("=== FIN DÉCONNEXION ===");
    
    return data;
  } catch (error) {
    console.error('Logout error complet:', error);
    return {
      status: 'error',
      message: `Erreur réseau lors de la déconnexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
};

/**
 * Vérifie si une session est active
 */
export const checkSession = async (): Promise<SessionCheckResponse> => {
  try {
    console.log("=== DEBUT VÉRIFICATION SESSION ===");
    
    const response = await fetch(`${API_BASE_URL}/auth/check_session.php`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log("Statut HTTP check session:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP check session:", errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: 'Session invalide' };
      }
      
      return {
        status: 'error',
        message: errorData.message || 'Session invalide',
      };
    }

    const data = await response.json();
    console.log("Réponse check session:", data);
    console.log("=== FIN VÉRIFICATION SESSION ===");
    
    return data;
  } catch (error) {
    console.error('Session check error complet:', error);
    return {
      status: 'error',
      message: `Erreur réseau lors de la vérification de session: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
};

/**
 * Demande l'envoi d'un code de réinitialisation (pour agents ET utilisateurs)
 */
export const requestPasswordReset = async (identifiant: string): Promise<PasswordResetResponse> => {
  try {
    console.log("=== DEBUT DEMANDE RÉINITIALISATION ===");
    console.log("Identifiant:", identifiant);
    
    const response = await fetch(`${API_BASE_URL}/auth/request_reset.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifiant }),
    });

    console.log("Statut HTTP demande reset:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP demande reset:", errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: 'Échec de la demande de réinitialisation' };
      }
      
      return {
        status: 'error',
        message: errorData.message || 'Échec de la demande de réinitialisation',
      };
    }

    const data = await response.json();
    console.log("Réponse demande reset:", data);
    console.log("=== FIN DEMANDE RÉINITIALISATION ===");
    
    return data;
  } catch (error) {
    console.error('Password reset request error complet:', error);
    return {
      status: 'error',
      message: `Erreur réseau lors de la demande de réinitialisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
};

/**
 * Vérifie toute session active (agent ou utilisateur)
 */
export const checkAnySession = async (): Promise<{
  status: 'success' | 'error';
  message?: string;
  userType?: 'agent' | 'utilisateur';
  data?: {
    agent?: AgentSession;
    utilisateur?: UtilisateurSession;
    privileges?: Privilege[];
  };
}> => {
  try {
    console.log("=== DEBUT VÉRIFICATION ANY SESSION ===");
    
    const response = await fetch(`${API_BASE_URL}/auth/check_any_session.php`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Statut HTTP check any session:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP check any session:", errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: 'Session invalide' };
      }
      
      return {
        status: "error",
        message: errorData.message || "Session invalide",
      };
    }

    const data = await response.json();
    console.log("Réponse check any session:", data);
    console.log("=== FIN VÉRIFICATION ANY SESSION ===");
    
    return data;
  } catch (error) {
    console.error('Session check error complet:', error);
    return {
      status: "error",
      message: `Erreur réseau lors de la vérification de session: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
};

/**
 * Vérifie un code de réinitialisation (pour agents ET utilisateurs)
 */
export const verifyResetCode = async (identifiant: string, code: string): Promise<VerifyCodeResponse> => {
  try {
    console.log("=== DEBUT VÉRIFICATION CODE ===");
    console.log("Identifiant:", identifiant);
    console.log("Code:", code);
    
    const response = await fetch(`${API_BASE_URL}/auth/verify_code.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifiant, code }),
    });

    console.log("Statut HTTP vérification code:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP vérification code:", errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: 'Code invalide' };
      }
      
      return {
        status: 'error',
        message: errorData.message || 'Code invalide',
      };
    }

    const data = await response.json();
    console.log("Réponse vérification code:", data);
    console.log("=== FIN VÉRIFICATION CODE ===");
    
    return data;
  } catch (error) {
    console.error('Code verification error complet:', error);
    return {
      status: 'error',
      message: `Erreur réseau lors de la vérification du code: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
};

/**
 * Réinitialise le mot de passe (pour agents ET utilisateurs)
 */
export const resetPassword = async (
  userId: number, 
  userType: 'agent' | 'utilisateur', 
  code: string, 
  newPassword: string
): Promise<PasswordResetResponse> => {
  try {
    console.log("=== DEBUT RÉINITIALISATION MOT DE PASSE ===");
    console.log("User ID:", userId);
    console.log("User Type:", userType);
    console.log("Code:", code);
    
    const response = await fetch(`${API_BASE_URL}/auth/reset_password.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        user_id: userId, 
        user_type: userType, 
        code, 
        new_password: newPassword 
      }),
    });

    console.log("Statut HTTP reset password:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP reset password:", errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: 'Échec de la réinitialisation' };
      }
      
      return {
        status: 'error',
        message: errorData.message || 'Échec de la réinitialisation',
      };
    }

    const data = await response.json();
    console.log("Réponse reset password:", data);
    console.log("=== FIN RÉINITIALISATION MOT DE PASSE ===");
    
    return data;
  } catch (error) {
    console.error('Password reset error complet:', error);
    return {
      status: 'error',
      message: `Erreur réseau lors de la réinitialisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
};

/**
 * Déconnecte l'agent (alias pour logoutUser)
 */
export const logoutAgent = async (): Promise<{ status: 'success' | 'error'; message?: string }> => {
  return logoutUser();
};