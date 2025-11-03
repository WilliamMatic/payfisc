// services/auth/userAuthService.ts
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
    const response = await fetch(`${API_BASE_URL}/auth/user_login.php`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ telephone, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de l'authentification",
      };
    }

    return data;
  } catch (error) {
    console.error("User login error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'authentification",
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
    const response = await fetch(`${API_BASE_URL}/auth/user_logout.php`, {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la déconnexion",
      };
    }

    return data;
  } catch (error) {
    console.error("User logout error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la déconnexion",
    };
  }
};

/**
 * Vérifie si une session utilisateur est active
 */
export const checkSessionUtilisateur =
  async (): Promise<UserSessionCheckResponse> => {
    try {
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

      const data = await response.json();

      if (!response.ok) {
        return {
          status: "error",
          message: data.message || "Session invalide",
        };
      }

      return data;
    } catch (error) {
      console.error("User session check error:", error);
      return {
        status: "error",
        message: "Erreur réseau lors de la vérification de session",
      };
    }
  };
