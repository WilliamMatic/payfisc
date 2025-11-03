// services/entreprises/entrepriseService.ts

/**
 * Service pour la gestion des entreprises - Interface avec l'API backend
 */

// Interface pour les données d'une entreprise
export interface Entreprise {
  id: number;
  raison_sociale: string;
  forme_juridique: string;
  nif: string;
  registre_commerce: string;
  date_creation: string;
  adresse_siege: string;
  telephone: string;
  email: string;
  representant_legal: string;
  actif: boolean;
  date_creation_enregistrement: string;
  reduction_type: 'pourcentage' | 'fixe' | null;
  reduction_valeur: number;
}

// Interface pour les réponses de l'API
export interface ApiResponse {
  status: "success" | "error";
  message?: string;
  data?: any;
}

// URL de base de l'API (à définir dans les variables d'environnement)
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls/entreprises";

/**
 * Récupère la liste de toutes les entreprises
 */
export const getEntreprises = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/entreprises/lister_entreprises.php`,
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
        message: data.message || "Échec de la récupération des entreprises",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Get entreprises error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des entreprises",
    };
  }
};

/**
 * Recherche des entreprises selon un terme
 */
export const searchEntreprises = async (
  searchTerm: string
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/entreprises/rechercher_entreprises.php?search=${encodeURIComponent(
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
        message: data.message || "Échec de la recherche des entreprises",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Search entreprises error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des entreprises",
    };
  }
};

/**
 * Ajoute une nouvelle entreprise
 */
export const addEntreprise = async (entrepriseData: {
  raison_sociale: string;
  forme_juridique: string;
  nif: string;
  registre_commerce: string;
  date_creation: string;
  adresse_siege: string;
  telephone: string;
  email: string;
  representant_legal: string;
  reduction_type?: 'pourcentage' | 'fixe' | null;
  reduction_valeur?: number;
  utilisateur_id?: number;
  site_code?: string;
}): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("raison_sociale", entrepriseData.raison_sociale);
    formData.append("forme_juridique", entrepriseData.forme_juridique);
    formData.append("nif", entrepriseData.nif);
    formData.append("registre_commerce", entrepriseData.registre_commerce);
    formData.append("date_creation", entrepriseData.date_creation);
    formData.append("adresse_siege", entrepriseData.adresse_siege);
    formData.append("telephone", entrepriseData.telephone);
    formData.append("email", entrepriseData.email);
    formData.append("representant_legal", entrepriseData.representant_legal);

    // Ajouter les champs de réduction
    if (entrepriseData.reduction_type !== undefined)
      formData.append("reduction_type", entrepriseData.reduction_type || '');
    if (entrepriseData.reduction_valeur !== undefined)
      formData.append("reduction_valeur", entrepriseData.reduction_valeur.toString());

    // Ajouter les nouveaux champs s'ils existent
    if (entrepriseData.utilisateur_id) {
      formData.append(
        "utilisateur_id",
        entrepriseData.utilisateur_id.toString()
      );
    }
    if (entrepriseData.site_code) {
      formData.append("site_code", entrepriseData.site_code);
    }

    const response = await fetch(
      `${API_BASE_URL}/entreprises/creer_entreprise.php`,
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
        message: data.message || "Échec de l'ajout de l'entreprise",
      };
    }

    return data;
  } catch (error) {
    console.error("Add entreprise error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'ajout de l'entreprise",
    };
  }
};

/**
 * Modifie une entreprise existante
 */
export const updateEntreprise = async (
  id: number,
  entrepriseData: {
    raison_sociale: string;
    forme_juridique: string;
    nif: string;
    registre_commerce: string;
    date_creation: string;
    adresse_siege: string;
    telephone: string;
    email: string;
    representant_legal: string;
    reduction_type?: 'pourcentage' | 'fixe' | null;
    reduction_valeur?: number;
  }
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("raison_sociale", entrepriseData.raison_sociale);
    formData.append("forme_juridique", entrepriseData.forme_juridique);
    formData.append("nif", entrepriseData.nif);
    formData.append("registre_commerce", entrepriseData.registre_commerce);
    formData.append("date_creation", entrepriseData.date_creation);
    formData.append("adresse_siege", entrepriseData.adresse_siege);
    formData.append("telephone", entrepriseData.telephone);
    formData.append("email", entrepriseData.email);
    formData.append("representant_legal", entrepriseData.representant_legal);

    // Ajouter les champs de réduction
    if (entrepriseData.reduction_type !== undefined)
      formData.append("reduction_type", entrepriseData.reduction_type || '');
    if (entrepriseData.reduction_valeur !== undefined)
      formData.append("reduction_valeur", entrepriseData.reduction_valeur.toString());

    const response = await fetch(
      `${API_BASE_URL}/entreprises/modifier_entreprise.php`,
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
        message: data.message || "Échec de la modification de l'entreprise",
      };
    }

    return data;
  } catch (error) {
    console.error("Update entreprise error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la modification de l'entreprise",
    };
  }
};

/**
 * Supprime une entreprise
 */
export const deleteEntreprise = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());

    const response = await fetch(
      `${API_BASE_URL}/entreprises/supprimer_entreprise.php`,
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
        message: data.message || "Échec de la suppression de l'entreprise",
      };
    }

    return data;
  } catch (error) {
    console.error("Delete entreprise error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la suppression de l'entreprise",
    };
  }
};

/**
 * Change le statut d'une entreprise (actif/inactif)
 */
export const toggleEntrepriseStatus = async (
  id: number,
  actif: boolean
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("actif", actif.toString());

    const response = await fetch(
      `${API_BASE_URL}/entreprises/changer_statut_entreprise.php`,
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
          data.message || "Échec du changement de statut de l'entreprise",
      };
    }

    return data;
  } catch (error) {
    console.error("Toggle entreprise status error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors du changement de statut de l'entreprise",
    };
  }
};