"use server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls";

export interface FetchControlesParams {
  page: number;
  limit: number;
  search?: string;
  decision?: string;
  statut?: string;
  date_debut?: string;
  date_fin?: string;
}

export async function fetchControles(params: FetchControlesParams) {
  try {
    const formData = new FormData();
    formData.append("page", params.page.toString());
    formData.append("limit", params.limit.toString());
    if (params.search) formData.append("search", params.search);
    if (params.decision) formData.append("decision", params.decision);
    if (params.statut) formData.append("statut", params.statut);
    if (params.date_debut) formData.append("date_debut", params.date_debut);
    if (params.date_fin) formData.append("date_fin", params.date_fin);

    const response = await fetch(
      `${API_BASE_URL}/controle-technique/get_controles.php`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error" as const,
        message: data.message || "Erreur lors de la récupération des contrôles",
      };
    }

    return data;
  } catch (error) {
    console.error("fetchControles error:", error);
    return {
      status: "error" as const,
      message: "Erreur réseau lors de la récupération des contrôles",
    };
  }
}

export async function supprimerControleTechnique(controleId: number) {
  try {
    const formData = new FormData();
    formData.append("id", controleId.toString());

    const response = await fetch(
      `${API_BASE_URL}/controle-technique/supprimer_controle.php`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error" as const,
        message: data.message || "Erreur lors de la suppression",
      };
    }

    return data;
  } catch (error) {
    console.error("supprimerControleTechnique error:", error);
    return {
      status: "error" as const,
      message: "Erreur réseau lors de la suppression",
    };
  }
}

export async function modifierResultatsControle(
  controleId: number,
  resultats: Array<{ id: number; statut: string }>,
) {
  try {
    const formData = new FormData();
    formData.append("controle_id", controleId.toString());
    formData.append("resultats", JSON.stringify(resultats));

    const response = await fetch(
      `${API_BASE_URL}/controle-technique/modifier_resultats.php`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error" as const,
        message: data.message || "Erreur lors de la modification des résultats",
      };
    }

    return data;
  } catch (error) {
    console.error("modifierResultatsControle error:", error);
    return {
      status: "error" as const,
      message: "Erreur réseau lors de la modification des résultats",
    };
  }
}
