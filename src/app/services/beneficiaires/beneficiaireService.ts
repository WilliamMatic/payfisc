/**
 * Service pour la gestion des bénéficiaires - Interface avec l'API backend
 */

// Interface pour les données d'un bénéficiaire
export interface Beneficiaire {
  id: number;
  nom: string;
  telephone: string;
  numero_compte: string;
  actif: boolean;
  date_creation: string;
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
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls";

/**
 * Récupère la liste de tous les bénéficiaires
 */
export const getBeneficiaires = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/lister_beneficiaires.php`,
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
        message: data.message || "Échec de la récupération des bénéficiaires",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Get bénéficiaires error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des bénéficiaires",
    };
  }
};

/**
 * Ajoute un nouveau bénéficiaire
 */
export const addBeneficiaire = async (beneficiaireData: {
  nom: string;
  telephone: string;
  numero_compte: string;
}): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("nom", beneficiaireData.nom);
    formData.append("telephone", beneficiaireData.telephone);
    formData.append("numero_compte", beneficiaireData.numero_compte);

    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/creer_beneficiaire.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de l'ajout du bénéficiaire",
      };
    }

    return data;
  } catch (error) {
    console.error("Add bénéficiaire error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'ajout du bénéficiaire",
    };
  }
};

/**
 * Modifie un bénéficiaire existant
 */
export const updateBeneficiaire = async (
  id: number,
  beneficiaireData: {
    nom: string;
    telephone: string;
    numero_compte: string;
  }
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("nom", beneficiaireData.nom);
    formData.append("telephone", beneficiaireData.telephone);
    formData.append("numero_compte", beneficiaireData.numero_compte);

    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/modifier_beneficiaire.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la modification du bénéficiaire",
      };
    }

    return data;
  } catch (error) {
    console.error("Update bénéficiaire error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la modification du bénéficiaire",
    };
  }
};

/**
 * Supprime un bénéficiaire
 */
export const deleteBeneficiaire = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());

    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/supprimer_beneficiaire.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la suppression du bénéficiaire",
      };
    }

    return data;
  } catch (error) {
    console.error("Delete bénéficiaire error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la suppression du bénéficiaire",
    };
  }
};

/**
 * Change le statut d'un bénéficiaire (actif/inactif)
 */
export const toggleBeneficiaireStatus = async (
  id: number,
  actif: boolean
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("actif", actif.toString());

    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/changer_statut_beneficiaire.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message:
          data.message || "Échec du changement de statut du bénéficiaire",
      };
    }

    return data;
  } catch (error) {
    console.error("Toggle bénéficiaire status error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors du changement de statut du bénéficiaire",
    };
  }
};

/**
 * Recherche des bénéficiaires
 */
export const searchBeneficiaires = async (
  searchTerm: string
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/rechercher_beneficiaires.php?search=${encodeURIComponent(
        searchTerm
      )}`,
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
        message: data.message || "Échec de la recherche des bénéficiaires",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Search bénéficiaires error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des bénéficiaires",
    };
  }
};
