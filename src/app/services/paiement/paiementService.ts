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

    if (data.status === "error") {
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

    if (data.status === "error") {
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
  donneesFormulaire: FormulaireData[],
  utilisateurId?: number,
  siteCode?: string
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
          utilisateur_id: utilisateurId,
          site_code: siteCode,
        }),
      }
    );

    const data = await response.json();

    if (data.status === "error") {
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

    if (data.status === "error") {
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
 * Traite un paiement avec données supplémentaires
 */
export const traiterPaiement = async (
  idDeclaration: number,
  idMethodePaiement: number,
  montantPenalites: number = 0,
  donneesPaiement: any = {}
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
          donnees_paiement: donneesPaiement, // Nouvelles données de paiement
        }),
      }
    );

    const data = await response.json();

    if (data.status === "error") {
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

    if (data.status === "error") {
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

/**
 * Calcule et enregistre la répartition pour les bénéficiaires
 */
export const calculerEtEnregistrerRepartition = async (
  idDeclaration: number,
  montantTotal: number,
  nombreDeclarations: number
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/paiements/calculer_repartition.php`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_declaration: idDeclaration,
          montant_total: montantTotal,
          nombre_declarations: nombreDeclarations,
        }),
      }
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec du calcul de la répartition",
      };
    }

    return data;
  } catch (error) {
    console.error("Calcul repartition error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors du calcul de la répartition",
    };
  }
};

/**
 * Traite un paiement avec pénalités ET répartition des bénéficiaires
 */
export const traiterPaiementAvecRepartition = async (
  idDeclaration: number,
  idMethodePaiement: number,
  montantTotal: number,
  nombreDeclarations: number,
  montantPenalites: number = 0
): Promise<ApiResponse> => {
  try {
    console.log("🔄 Début traitement paiement avec répartition:", {
      idDeclaration,
      montantTotal,
      nombreDeclarations,
      montantPenalites,
    });

    // 1. D'abord calculer la répartition
    const resultRepartition = await calculerEtEnregistrerRepartition(
      idDeclaration,
      montantTotal,
      nombreDeclarations
    );

    if (resultRepartition.status !== "success") {
      console.error("❌ Échec calcul répartition:", resultRepartition.message);
      return {
        status: "error",
        message:
          "Erreur lors du calcul de la répartition: " +
          resultRepartition.message,
      };
    }

    console.log("✅ Répartition calculée:", resultRepartition.data);

    // 2. Ensuite traiter le paiement
    const resultPaiement = await traiterPaiement(
      idDeclaration,
      idMethodePaiement,
      montantPenalites
    );

    if (resultPaiement.status !== "success") {
      console.error("❌ Échec traitement paiement:", resultPaiement.message);
      return resultPaiement;
    }

    console.log("✅ Paiement traité avec succès");

    // 3. Retourner les deux résultats
    return {
      status: "success",
      message: "Paiement et répartition traités avec succès",
      data: {
        ...resultPaiement.data,
        repartition: resultRepartition.data,
      },
    };
  } catch (error) {
    console.error("❌ Erreur traitement paiement avec répartition:", error);
    return {
      status: "error",
      message: "Erreur lors du traitement du paiement avec répartition",
    };
  }
};

/**
 * NOUVELLE FONCTION : Récupère les déclarations existantes par NIF
 */
export const getDeclarationsByNif = async (nif: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/paiements/get_declarations_by_nif.php`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nif }),
    });

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec de la récupération des déclarations",
      };
    }

    return data;
  } catch (error) {
    console.error("Get declarations by NIF error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des déclarations",
    };
  }
};