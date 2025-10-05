// services/particuliers/particulierService.ts

/**
 * Service pour la gestion des particuliers - Interface avec l'API backend
 */

// Interface pour les données d'un particulier
export interface Particulier {
  id: number;
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  sexe: string;
  rue: string;
  ville: string;
  code_postal: string;
  province: string;
  id_national: string;
  telephone: string;
  email: string;
  nif: string;
  situation_familiale: string;
  dependants: number;
  actif: boolean;
  date_creation: string;
  date_modification?: string; // Ajouté
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
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls/particuliers";

// Nettoyer les données
export const cleanParticulierData = (data: any): Particulier => {
  return {
    id: data.id || 0,
    nom: data.nom || "",
    prenom: data.prenom || "",
    date_naissance: data.date_naissance || "",
    lieu_naissance: data.lieu_naissance || "",
    sexe: data.sexe || "",
    rue: data.rue || "",
    ville: data.ville || "",
    code_postal: data.code_postal || "",
    province: data.province || "",
    id_national: data.id_national || "",
    telephone: data.telephone || "",
    email: data.email || "",
    nif: data.nif || "",
    situation_familiale: data.situation_familiale || "",
    dependants: data.dependants || 0,
    actif: Boolean(data.actif),
    date_creation: data.date_creation || "",
    date_modification: data.date_modification || "",
  };
};

/**
 * Récupère la liste de tous les particuliers
 */
export const getParticuliers = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/particuliers/lister_particuliers.php`,
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
        message: data.message || "Échec de la récupération des particuliers",
      };
    }

    // Nettoyer les données
    const cleanedData = Array.isArray(data.data)
      ? data.data.map((item: any) => cleanParticulierData(item))
      : [];

    return {
      status: "success",
      data: cleanedData,
    };
  } catch (error) {
    console.error("Get particuliers error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des particuliers",
    };
  }
};

// Ajouter une fonction pour récupérer les détails complets
export const getParticulierDetails = async (
  id: number
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());

    const response = await fetch(
      `${API_BASE_URL}/particuliers/get_details_particulier.php`,
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
        message: data.message || "Échec de la récupération des détails",
      };
    }

    return {
      status: "success",
      data: cleanParticulierData(data.data),
    };
  } catch (error) {
    console.error("Get particulier details error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des détails",
    };
  }
};

/**
 * Ajoute un nouveau particulier
 */
export const addParticulier = async (particulierData: {
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance?: string;
  sexe?: string;
  rue?: string;
  ville?: string;
  code_postal?: string;
  province?: string;
  id_national?: string;
  telephone?: string;
  email?: string;
  nif: string;
  situation_familiale?: string;
  dependants?: number;
}): Promise<ApiResponse> => {
  try {
    const formData = new FormData();

    // Ajout des champs obligatoires
    formData.append("nom", particulierData.nom);
    formData.append("prenom", particulierData.prenom);
    formData.append("date_naissance", particulierData.date_naissance);
    formData.append("nif", particulierData.nif);

    // Ajout des champs optionnels
    if (particulierData.lieu_naissance)
      formData.append("lieu_naissance", particulierData.lieu_naissance);
    if (particulierData.sexe) formData.append("sexe", particulierData.sexe);
    if (particulierData.rue) formData.append("rue", particulierData.rue);
    if (particulierData.ville) formData.append("ville", particulierData.ville);
    if (particulierData.code_postal)
      formData.append("code_postal", particulierData.code_postal);
    if (particulierData.province)
      formData.append("province", particulierData.province);
    if (particulierData.id_national)
      formData.append("id_national", particulierData.id_national);
    if (particulierData.telephone)
      formData.append("telephone", particulierData.telephone);
    if (particulierData.email) formData.append("email", particulierData.email);
    if (particulierData.situation_familiale)
      formData.append(
        "situation_familiale",
        particulierData.situation_familiale
      );
    if (particulierData.dependants !== undefined)
      formData.append("dependants", particulierData.dependants.toString());

    const response = await fetch(
      `${API_BASE_URL}/particuliers/creer_particulier.php`,
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
        message: data.message || "Échec de l'ajout du particulier",
      };
    }

    return data;
  } catch (error) {
    console.error("Add particulier error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'ajout du particulier",
    };
  }
};

/**
 * Modifie un particulier existant
 */
export const updateParticulier = async (
  id: number,
  particulierData: {
    nom: string;
    prenom: string;
    date_naissance: string;
    lieu_naissance?: string;
    sexe?: string;
    rue?: string;
    ville?: string;
    code_postal?: string;
    province?: string;
    id_national?: string;
    telephone?: string;
    email?: string;
    nif: string;
    situation_familiale?: string;
    dependants?: number;
  }
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();

    // Ajout de l'ID
    formData.append("id", id.toString());

    // Ajout des champs obligatoires
    formData.append("nom", particulierData.nom);
    formData.append("prenom", particulierData.prenom);
    formData.append("date_naissance", particulierData.date_naissance);
    formData.append("nif", particulierData.nif);

    // Ajout des champs optionnels
    if (particulierData.lieu_naissance)
      formData.append("lieu_naissance", particulierData.lieu_naissance);
    if (particulierData.sexe) formData.append("sexe", particulierData.sexe);
    if (particulierData.rue) formData.append("rue", particulierData.rue);
    if (particulierData.ville) formData.append("ville", particulierData.ville);
    if (particulierData.code_postal)
      formData.append("code_postal", particulierData.code_postal);
    if (particulierData.province)
      formData.append("province", particulierData.province);
    if (particulierData.id_national)
      formData.append("id_national", particulierData.id_national);
    if (particulierData.telephone)
      formData.append("telephone", particulierData.telephone);
    if (particulierData.email) formData.append("email", particulierData.email);
    if (particulierData.situation_familiale)
      formData.append(
        "situation_familiale",
        particulierData.situation_familiale
      );
    if (particulierData.dependants !== undefined)
      formData.append("dependants", particulierData.dependants.toString());

    const response = await fetch(
      `${API_BASE_URL}/particuliers/modifier_particulier.php`,
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
        message: data.message || "Échec de la modification du particulier",
      };
    }

    return data;
  } catch (error) {
    console.error("Update particulier error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la modification du particulier",
    };
  }
};

/**
 * Supprime un particulier
 */
export const deleteParticulier = async (id: number): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());

    const response = await fetch(
      `${API_BASE_URL}/particuliers/supprimer_particulier.php`,
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
        message: data.message || "Échec de la suppression du particulier",
      };
    }

    return data;
  } catch (error) {
    console.error("Delete particulier error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la suppression du particulier",
    };
  }
};

/**
 * Change le statut d'un particulier (actif/inactif)
 */
export const toggleParticulierStatus = async (
  id: number,
  actif: boolean
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();
    formData.append("id", id.toString());
    formData.append("actif", actif.toString());

    const response = await fetch(
      `${API_BASE_URL}/particuliers/changer_statut_particulier.php`,
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
        message: data.message || "Échec du changement de statut du particulier",
      };
    }

    return data;
  } catch (error) {
    console.error("Toggle particulier status error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors du changement de statut du particulier",
    };
  }
};

/**
 * Recherche des particuliers
 */
export const searchParticuliers = async (
  searchTerm: string
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/particuliers/rechercher_particuliers.php?search=${encodeURIComponent(
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
        message: data.message || "Échec de la recherche des particuliers",
      };
    }

    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Search particuliers error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des particuliers",
    };
  }
};
