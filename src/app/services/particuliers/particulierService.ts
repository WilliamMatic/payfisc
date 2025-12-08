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
  date_modification?: string;
  reduction_type: "pourcentage" | "montant_fixe" | null;
  reduction_valeur: number;
}

// Interface pour les réponses de l'API
export interface ApiResponse {
  status: "success" | "error";
  message?: string;
  data?: any;
}

// Interface pour la pagination
export interface PaginationResponse {
  status: "success" | "error";
  message?: string;
  data?: {
    particuliers: Particulier[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

// URL de base de l'API
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
    reduction_type: data.reduction_type || null,
    reduction_valeur: data.reduction_valeur || 0,
  };
};

/**
 * Récupère la liste des particuliers avec pagination (10 derniers par défaut)
 */
export const getParticuliers = async (
  page: number = 1,
  limit: number = 10,
  utilisateurId?: number
): Promise<PaginationResponse> => {
  try {
    let url = `${API_BASE_URL}/particuliers/lister_particuliers.php?page=${page}&limit=${limit}`;
    if (utilisateurId !== undefined) {
      url += `&utilisateur=${utilisateurId}`;
    }

    const response = await fetch(url, {
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
        message: data.message || "Échec de la récupération des particuliers",
      };
    }

    // Nettoyer les données
    const cleanedData = Array.isArray(data.data?.particuliers)
      ? data.data.particuliers.map((item: any) => cleanParticulierData(item))
      : [];

    return {
      status: "success",
      data: {
        particuliers: cleanedData,
        pagination: data.data?.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    };
  } catch (error) {
    console.error("Get particuliers error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des particuliers",
    };
  }
};

/**
 * Récupère les détails complets d'un particulier
 */
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
  date_naissance?: string;
  lieu_naissance?: string;
  sexe?: string;
  rue: string;
  ville?: string;
  code_postal?: string;
  province?: string;
  id_national?: string;
  telephone: string;
  email?: string;
  nif?: string;
  situation_familiale?: string;
  dependants?: number;
  reduction_type?: "pourcentage" | "montant_fixe" | null;
  reduction_valeur?: number;
  site?: string;
  utilisateur?: number;
}): Promise<ApiResponse> => {
  try {
    const formData = new FormData();

    // Ajout des champs obligatoires
    formData.append("nom", particulierData.nom);
    formData.append("prenom", particulierData.prenom);
    formData.append("telephone", particulierData.telephone);
    formData.append("rue", particulierData.rue);

    // Ajout des champs optionnels
    if (particulierData.nif) formData.append("nif", particulierData.nif);
    if (particulierData.date_naissance)
      formData.append("date_naissance", particulierData.date_naissance);
    if (particulierData.lieu_naissance)
      formData.append("lieu_naissance", particulierData.lieu_naissance);
    if (particulierData.sexe) formData.append("sexe", particulierData.sexe);
    if (particulierData.ville) formData.append("ville", particulierData.ville);
    if (particulierData.code_postal)
      formData.append("code_postal", particulierData.code_postal);
    if (particulierData.province)
      formData.append("province", particulierData.province);
    if (particulierData.id_national)
      formData.append("id_national", particulierData.id_national);
    if (particulierData.email) formData.append("email", particulierData.email);
    if (particulierData.situation_familiale)
      formData.append(
        "situation_familiale",
        particulierData.situation_familiale
      );
    if (particulierData.dependants !== undefined)
      formData.append("dependants", particulierData.dependants.toString());

    // Ajout des champs de réduction
    if (
      particulierData.reduction_type !== undefined &&
      particulierData.reduction_type !== null
    )
      formData.append("reduction_type", particulierData.reduction_type);
    if (particulierData.reduction_valeur !== undefined)
      formData.append(
        "reduction_valeur",
        particulierData.reduction_valeur.toString()
      );

    // Champs système
    if (particulierData.utilisateur !== undefined)
      formData.append("utilisateur", String(particulierData.utilisateur));
    if (particulierData.site !== undefined)
      formData.append("site", String(particulierData.site));

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
    date_naissance?: string;
    lieu_naissance?: string;
    sexe?: string;
    rue: string;
    ville?: string;
    code_postal?: string;
    province?: string;
    id_national?: string;
    telephone: string;
    email?: string;
    nif?: string;
    situation_familiale?: string;
    dependants?: number;
    reduction_type?: "pourcentage" | "montant_fixe" | null;
    reduction_valeur?: number;
  }
): Promise<ApiResponse> => {
  try {
    const formData = new FormData();

    // Ajout de l'ID
    formData.append("id", id.toString());

    // Ajout des champs obligatoires
    formData.append("nom", particulierData.nom);
    formData.append("prenom", particulierData.prenom);
    formData.append("telephone", particulierData.telephone);
    formData.append("rue", particulierData.rue);

    // Ajout des champs optionnels
    if (particulierData.nif !== undefined)
      formData.append("nif", particulierData.nif || "");
    if (particulierData.date_naissance !== undefined)
      formData.append("date_naissance", particulierData.date_naissance || "");
    if (particulierData.lieu_naissance !== undefined)
      formData.append("lieu_naissance", particulierData.lieu_naissance || "");
    if (particulierData.sexe !== undefined)
      formData.append("sexe", particulierData.sexe || "");
    if (particulierData.ville !== undefined)
      formData.append("ville", particulierData.ville || "");
    if (particulierData.code_postal !== undefined)
      formData.append("code_postal", particulierData.code_postal || "");
    if (particulierData.province !== undefined)
      formData.append("province", particulierData.province || "");
    if (particulierData.id_national !== undefined)
      formData.append("id_national", particulierData.id_national || "");
    if (particulierData.email !== undefined)
      formData.append("email", particulierData.email || "");
    if (particulierData.situation_familiale !== undefined)
      formData.append(
        "situation_familiale",
        particulierData.situation_familiale || ""
      );
    if (particulierData.dependants !== undefined)
      formData.append("dependants", particulierData.dependants.toString());

    // Ajout des champs de réduction
    if (particulierData.reduction_type !== undefined)
      formData.append("reduction_type", particulierData.reduction_type || "");
    if (particulierData.reduction_valeur !== undefined)
      formData.append(
        "reduction_valeur",
        particulierData.reduction_valeur.toString()
      );

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
 * Recherche des particuliers dans la base de données
 */
export const searchParticuliers = async (
  searchTerm: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginationResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/particuliers/rechercher_particuliers.php`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          search: searchTerm,
          page: page,
          limit: limit,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la recherche des particuliers",
      };
    }

    // Nettoyer les données
    const cleanedData = Array.isArray(data.data?.particuliers)
      ? data.data.particuliers.map((item: any) => cleanParticulierData(item))
      : [];

    return {
      status: "success",
      data: {
        particuliers: cleanedData,
        pagination: data.data?.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    };
  } catch (error) {
    console.error("Search particuliers error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des particuliers",
    };
  }
};
