'use server';

/**
 * Server Actions pour l'authentification utilisateur (particuliers/entreprises)
 */

export interface UtilisateurSession {
  id: number;
  nom_complet: string;
  telephone: string;
  adresse: string;
  site_nom: string;
  site_code: string;
  formule?: string;
}

export interface UserLoginResponse {
  status: "success" | "error";
  message?: string;
  data?: {
    utilisateur: UtilisateurSession;
  };
}

export interface UserSessionCheckResponse {
  status: "success" | "error";
  message?: string;
  data?: {
    utilisateur: UtilisateurSession;
  };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls";

/**
 * Authentifie un utilisateur (particulier/entreprise)
 */
export const loginUtilisateur = async (
  telephone: string,
  password: string
): Promise<UserLoginResponse> => {
  try {
    console.log("=== DEBUT AUTHENTIFICATION UTILISATEUR ===");
    console.log("Téléphone:", telephone);
    
    const response = await fetch(`${API_BASE_URL}/auth/user_login.php`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ telephone, password }),
    });

    console.log("Statut HTTP login utilisateur:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP login utilisateur:", errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: "Échec de l'authentification" };
      }
      
      return {
        status: "error",
        message: errorData.message || "Échec de l'authentification",
      };
    }

    const data = await response.json();
    console.log("Réponse login utilisateur:", data);
    console.log("=== FIN AUTHENTIFICATION UTILISATEUR ===");
    
    return data;
  } catch (error) {
    console.error("User login error complet:", error);
    return {
      status: "error",
      message: `Erreur réseau lors de l'authentification: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
};

/**
 * Déconnecte l'utilisateur
 */
export const logoutUtilisateur = async (): Promise<{
  status: "success" | "error";
  message?: string;
}> => {
  try {
    console.log("=== DEBUT DÉCONNEXION UTILISATEUR ===");
    
    const response = await fetch(`${API_BASE_URL}/auth/user_logout.php`, {
      method: "POST",
      credentials: "include",
    });

    console.log("Statut HTTP déconnexion utilisateur:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP déconnexion utilisateur:", errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: "Échec de la déconnexion" };
      }
      
      return {
        status: "error",
        message: errorData.message || "Échec de la déconnexion",
      };
    }

    const data = await response.json();
    console.log("Réponse déconnexion utilisateur:", data);
    console.log("=== FIN DÉCONNEXION UTILISATEUR ===");
    
    return data;
  } catch (error) {
    console.error("User logout error complet:", error);
    return {
      status: "error",
      message: `Erreur réseau lors de la déconnexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
};

/**
 * Vérifie si une session utilisateur est active
 */
export const checkSessionUtilisateur = async (): Promise<UserSessionCheckResponse> => {
  try {
    console.log("=== DEBUT VÉRIFICATION SESSION UTILISATEUR ===");
    
    const response = await fetch(
      `${API_BASE_URL}/auth/check_user_session.php`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Statut HTTP check session utilisateur:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur HTTP check session utilisateur:", errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: "Session invalide" };
      }
      
      return {
        status: "error",
        message: errorData.message || "Session invalide",
      };
    }

    const data = await response.json();
    console.log("Réponse check session utilisateur:", data);
    console.log("=== FIN VÉRIFICATION SESSION UTILISATEUR ===");
    
    return data;
  } catch (error) {
    console.error("User session check error complet:", error);
    return {
      status: "error",
      message: `Erreur réseau lors de la vérification de session: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
};

/**
 * Fonction pour vérifier si un utilisateur est connecté
 * (utilitaire pour les composants client)
 */
export const isUserLoggedIn = async (): Promise<boolean> => {
  try {
    const session = await checkSessionUtilisateur();
    return session.status === "success" && !!session.data?.utilisateur;
  } catch (error) {
    console.error("Erreur lors de la vérification de connexion:", error);
    return false;
  }
};

/**
 * Récupère les informations de session de l'utilisateur
 */
export const getUserSession = async (): Promise<UtilisateurSession | null> => {
  try {
    const session = await checkSessionUtilisateur();
    if (session.status === "success" && session.data?.utilisateur) {
      return session.data.utilisateur;
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération de session:", error);
    return null;
  }
};

/**
 * Vérifie les permissions d'accès (si besoin futur)
 */
export const checkUserAccess = async (): Promise<{
  hasAccess: boolean;
  message?: string;
  user?: UtilisateurSession;
}> => {
  try {
    const session = await checkSessionUtilisateur();
    
    if (session.status !== "success" || !session.data?.utilisateur) {
      return {
        hasAccess: false,
        message: "Session utilisateur invalide ou expirée",
      };
    }

    return {
      hasAccess: true,
      user: session.data.utilisateur,
    };
  } catch (error) {
    console.error("Erreur lors de la vérification d'accès:", error);
    return {
      hasAccess: false,
      message: "Erreur lors de la vérification d'accès",
    };
  }
};