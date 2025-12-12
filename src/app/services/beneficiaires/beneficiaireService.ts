/**
 * Service pour la gestion des bénéficiaires - Interface avec l'API backend
 */

// Interface pour les données d'un bénéficiaire

export interface BeneficiaireImpot {
  id: number;
  impot_id: number;
  beneficiaire_id: number;
  province_id: number | null;
  province_nom: string | null;
  province_code: string | null;
  type_part: "pourcentage" | "montant_fixe";
  valeur_part: number;
  nom: string;
  telephone: string;
  numero_compte: string;
}

export interface Province {
  id: number;
  nom: string;
  code: string;
}

export interface BeneficiaireParProvince {
  province_id: number | null;
  province_nom: string;
  province_code: string | null;
  beneficiaires: BeneficiaireImpot[];
}

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

/**
 * Récupère les bénéficiaires d'un impôt groupés par province
 */
export const getBeneficiairesImpot = async (
  impotId: number
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/lister_beneficiaires_impot.php?impot_id=${impotId}`,
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
      data: data.data as BeneficiaireParProvince[],
    };
  } catch (error) {
    console.error("Get beneficiaires impot error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des bénéficiaires",
    };
  }
};

/**
 * Récupère toutes les provinces
 */
export const getProvinces = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/get_provinces.php`,
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
        message: data.message || "Échec de la récupération des provinces",
      };
    }

    return {
      status: "success",
      data: data.data as Province[],
    };
  } catch (error) {
    console.error("Get provinces error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des provinces",
    };
  }
};


/**
 * Récupère les bénéficiaires disponibles pour un impôt et une province
 */
export const getBeneficiairesDisponibles = async (
  impotId: number,
  provinceId?: number
): Promise<ApiResponse> => {
  try {
    const url = provinceId !== undefined
      ? `${API_BASE_URL}/beneficiaires/get_beneficiaires_disponibles.php?impot_id=${impotId}&province_id=${provinceId}`
      : `${API_BASE_URL}/beneficiaires/get_beneficiaires_disponibles.php?impot_id=${impotId}`;

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
        message: data.message || "Échec de la récupération des bénéficiaires disponibles",
      };
    }

    return {
      status: "success",
      data: data.data as Beneficiaire[],
    };
  } catch (error) {
    console.error("Get beneficiaires disponibles error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des bénéficiaires disponibles",
    };
  }
};


/**
 * Ajoute un bénéficiaire à un impôt pour une province spécifique
 */
export const addBeneficiaireImpot = async (beneficiaireData: {
  impot_id: number;
  beneficiaire_id: number;
  province_id?: number | null;
  type_part: "pourcentage" | "montant_fixe";
  valeur_part: number;
}): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/beneficiaires/ajouter_beneficiaire_impot.php`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(beneficiaireData),
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
    console.error("Add beneficiaire impot error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'ajout du bénéficiaire",
    };
  }
};


/**
 * Supprime un bénéficiaire d'un impôt pour une province spécifique
 */
export const removeBeneficiaireImpot = async (
  impotId: number,
  beneficiaireId: number,
  provinceId?: number | null
): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/impots/beneficiaires/supprimer_beneficiaire_impot.php`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          impot_id: impotId,
          beneficiaire_id: beneficiaireId,
          province_id: provinceId
        }),
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
    console.error("Remove beneficiaire impot error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la suppression du bénéficiaire",
    };
  }
};