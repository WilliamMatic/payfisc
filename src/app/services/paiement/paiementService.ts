// services/paiement/paiementService.ts

/**
 * Service pour la gestion du processus de paiement - Interface avec l'API backend
 */

// Interface pour les données d'un contribuable
export interface Contribuable {
  id: number;
  nom: string;
  prenom?: string;
  nif: string;
  actif: boolean;
  adresse_siege?: string;
}

// Interface pour un impôt
export interface Impot {
  id: number;
  nom: string;
  description: string;
  formulaire_json: any;
  periode: string;
  delai_accord: number;
  penalites: any;
}

// Interface pour les données de formulaire
export interface FormulaireData {
  [key: string]: string | number;
}

// Interface pour les réponses de l'API
export interface ApiResponse {
  status: "success" | "error";
  message?: string;
  data?: any;
}

// URL de base de l'API
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls/paiement";

/**
 * Vérifie l'existence d'un NIF
 */
export const verifierNif = async (nif: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/paiements/verifier_nif.php`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nif }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la vérification du NIF",
      };
    }

    return data;
  } catch (error) {
    console.error("Verifier NIF error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification du NIF",
    };
  }
};

/**
 * Récupère la liste des impôts disponibles
 */
export const getImpots = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/paiements/get_impots.php`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des impôts",
      };
    }

    return data;
  } catch (error) {
    console.error("Get impots error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des impôts",
    };
  }
};

/**
 * Enregistre une déclaration
 */
export const enregistrerDeclaration = async (
  idImpot: number,
  montant: number,
  donneesFormulaire: FormulaireData[]
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/paiements/enregistrer_declaration.php`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_impot: idImpot,
          montant: montant,
          donnees_formulaire: donneesFormulaire,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de l'enregistrement de la déclaration",
      };
    }

    return data;
  } catch (error) {
    console.error("Enregistrer declaration error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'enregistrement de la déclaration",
    };
  }
};

/**
 * Supprime une déclaration
 */
export const supprimerDeclaration = async (
  idDeclaration: number
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/paiements/supprimer_declaration.php`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_declaration: idDeclaration }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la suppression de la déclaration",
      };
    }

    return data;
  } catch (error) {
    console.error("Supprimer declaration error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la suppression de la déclaration",
    };
  }
};

/**
 * Traite un paiement avec pénalités
 */
export const traiterPaiement = async (
  idDeclaration: number,
  idMethodePaiement: number,
  montantPenalites: number = 0
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/paiements/traiter_paiement.php`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_declaration: idDeclaration,
          methode_paiement: idMethodePaiement,
          montant_penalites: montantPenalites,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec du traitement du paiement",
      };
    }

    return data;
  } catch (error) {
    console.error("Traiter paiement error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors du traitement du paiement",
    };
  }
};

/**
 * Recherche une déclaration par son numéro et vérifie qu'elle est en attente
 */
export const rechercherDeclaration = async (
  numeroDeclaration: string
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/paiements/rechercher_declaration.php`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ numero_declaration: numeroDeclaration }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la recherche de déclaration",
      };
    }

    return data;
  } catch (error) {
    console.error("Rechercher declaration error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche de déclaration",
    };
  }
};
