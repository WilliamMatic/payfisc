'use server';

/**
 * Server Actions pour la gestion du refactor des cartes (SANS CACHE - temps réel)
 */

export interface DonneesRefactor {
  id: number;
  engin_id: number | null;
  particulier_id: number | null;
  numero_plaque: string;
  type_engin: string;
  marque: string;
  energie: string;
  annee_fabrication: string;
  annee_circulation: string;
  couleur: string;
  puissance_fiscal: string;
  usage_engin: string;
  numero_chassis: string;
  numero_moteur: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  nif: string;
  montant: number;
  mode_paiement: string;
  date_paiement: string;
  site_nom: string;
  caissier: string;
  source?: "locale" | "carte_reprint" | "externe";
  // Champs spécifiques carte_reprint
  carte_reprint_id?: number;
  date_creation?: string;
  site_id?: number;
  id_paiement?: number | null;
}

export interface RefactorResponse {
  status: "success" | "error";
  message?: string;
  data?: DonneesRefactor;
  source?: "locale" | "carte_reprint" | "externe";
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost/SOCOFIAPP/Impot/backend/calls";

/**
 * 🔄 Vérifie un ID DGRK ou un numéro de plaque et récupère les données associées (TEMPS RÉEL)
 */
export const verifierIdDGRK = async (
  identifiant: string,
  siteCode: string
): Promise<RefactorResponse & { source?: string }> => {
  'use server';
  
  try {
    // D'abord, essayer avec la base locale
    const formData = new FormData();
    formData.append("id_dgrk", identifiant);
    formData.append("site_code", siteCode);

    const response = await fetch(`${API_BASE_URL}/refactor/verifier_dgrk.php`, {
      method: "POST",
      credentials: "include",
      body: formData,
      cache: 'no-store',
    });

    const data = await response.json();

    if (response.ok && data.status === "success") {
      return {
        ...data,
        source: "locale",
      };
    }

    // 2) Tenter dans la table carte_reprint (filtrée par province de l'agent)
    const resultReprint = await verifierPlaqueCarteReprint(identifiant, siteCode);
    if (resultReprint.status === "success") {
      return resultReprint;
    }

    // 3) Sinon, tenter dans la base externe
    return await verifierPlaqueExterne(identifiant);
  } catch (error) {
    console.error("Verifier DGRK error:", error);
    // En cas d'erreur réseau sur la base locale, on tente la chaîne carte_reprint -> externe
    try {
      const resultReprint = await verifierPlaqueCarteReprint(identifiant, siteCode);
      if (resultReprint.status === "success") {
        return resultReprint;
      }
      return await verifierPlaqueExterne(identifiant);
    } catch (externeError) {
      return {
        status: "error",
        message: "Erreur réseau lors de la vérification",
      };
    }
  }
};

/**
 * 🔄 Vérifie un numéro de plaque dans la table carte_reprint
 *    (filtrée sur les sites de la province de l'agent)
 */
export const verifierPlaqueCarteReprint = async (
  numeroPlaque: string,
  siteCode: string
): Promise<RefactorResponse> => {
  'use server';

  try {
    const formData = new FormData();
    formData.append("numero_plaque", numeroPlaque);
    formData.append("site_code", siteCode);

    const response = await fetch(
      `${API_BASE_URL}/refactor/verifier_carte_reprint.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
        cache: 'no-store',
      }
    );

    const data = await response.json();

    if (response.ok && data.status === "success") {
      return {
        ...data,
        source: "carte_reprint",
      };
    }

    return {
      status: "error",
      message: data?.message || "Aucune donnée trouvée dans carte_reprint",
    };
  } catch (error) {
    console.error("Verifier carte_reprint error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification carte_reprint",
    };
  }
};

/**
 * 🔄 Traite une demande de refactor (TEMPS RÉEL)
 */
export const traiterRefactor = async (
  idDGRK: string,
  donneesEngin: any,
  donneesParticulier: any,
  source?: "locale" | "carte_reprint" | "externe",
  siteCode?: string,
  carteReprintId?: number
): Promise<RefactorResponse> => {
  'use server';
  
  try {
    const bodyData: Record<string, any> = {
      id_dgrk: idDGRK,
      donnees_engin: donneesEngin,
      donnees_particulier: donneesParticulier,
      source: source || "locale",
      site_code: siteCode || "",
    };

    if (source === "carte_reprint" && carteReprintId) {
      bodyData.carte_reprint_id = carteReprintId;
    }

    const response = await fetch(
      `${API_BASE_URL}/refactor/traiter_refactor.php`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
        cache: 'no-store',
      }
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Échec du traitement du refactor",
      };
    }

    return data;
  } catch (error) {
    console.error("Traiter refactor error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors du traitement",
    };
  }
};

/**
 * 🔄 Vérifie dans la base externe (TEMPS RÉEL)
 */
export const verifierPlaqueExterne = async (
  plaque: string
): Promise<RefactorResponse> => {
  'use server';
  
  try {
    const formData = new FormData();
    formData.append("plaque", plaque);

    const response = await fetch(
      `${API_BASE_URL}/refactor/rechercher_plaque.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
        cache: 'no-store',
      }
    );

    const data = await response.json();

    if (data.status === "error") {
      return {
        status: "error",
        message: data.message || "Plaque non trouvée dans la base externe",
      };
    }

    // Formater les données de la base externe pour correspondre à l'interface DonneesRefactor
    const donneesExternes = data.data;

    const formattedData: DonneesRefactor = {
      id: 0, // Nouvel enregistrement, pas d'ID DGRK
      engin_id: 0,
      particulier_id: 0,
      numero_plaque: donneesExternes.plaque?.numero || plaque,
      type_engin: donneesExternes.vehicule?.type_auto || "",
      marque: donneesExternes.vehicule?.marque || "",
      energie: donneesExternes.vehicule?.energie || "",
      annee_fabrication: donneesExternes.vehicule?.annee_fabrication || "",
      annee_circulation: donneesExternes.vehicule?.annee_circulation || "",
      couleur: donneesExternes.vehicule?.couleur || "",
      puissance_fiscal: donneesExternes.vehicule?.puissance || "",
      usage_engin: donneesExternes.vehicule?.usage || "",
      numero_chassis: donneesExternes.vehicule?.chassis || "",
      numero_moteur: donneesExternes.vehicule?.moteur || "",
      nom: donneesExternes.client?.nom_complet?.split(" ")[0] || "",
      prenom:
        donneesExternes.client?.nom_complet?.split(" ").slice(1).join(" ") ||
        "",
      telephone: donneesExternes.client?.telephone || "",
      email: "",
      adresse: donneesExternes.client?.adresse || "",
      nif: "",
      montant: 0, // Montant à 0 pour les données externes
      mode_paiement: "",
      date_paiement: "",
      site_nom: "",
      caissier: "",
    };

    return {
      status: "success",
      message: "Données récupérées depuis la base externe",
      data: formattedData,
      source: "externe", // Ajouter cette propriété pour identifier la source
    };
  } catch (error) {
    console.error("Verifier plaque externe error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification de la plaque externe",
    };
  }
};