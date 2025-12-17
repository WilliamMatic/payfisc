/**
 * Service pour la gestion du refactor des cartes
 */

export interface DonneesRefactor {
  id: number;
  engin_id: number;
  particulier_id: number;
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
  source?: "locale" | "externe";
}

export interface RefactorResponse {
  status: "success" | "error";
  message?: string;
  data?: DonneesRefactor;
  source?: "locale" | "externe";
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost/SOCOFIAPP/Impot/backend/calls";

/**
 * Vérifie un ID DGRK et récupère les données associées
 */
export const verifierIdDGRK = async (
  identifiant: string,
  siteCode: string,
  extension?: number | null
): Promise<RefactorResponse & { source?: string }> => {
  try {
    // D'abord, essayer avec la base locale
    const formData = new FormData();
    formData.append("id_dgrk", identifiant);
    formData.append("site_code", siteCode);

    // Convertir extension en nombre avec 0 comme valeur par défaut
    const extensionNumber = extension || 0;
    formData.append("extension", extensionNumber.toString());

    const response = await fetch(`${API_BASE_URL}/refactor/verifier_dgrk.php`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();

    if (response.ok && data.status === "success") {
      return {
        ...data,
        source: "locale",
      };
    } else {
      // Si erreur ou non trouvé localement, essayer avec la base externe
      // Passer extensionNumber (qui est toujours un nombre) à verifierPlaqueExterne
      const resultExterne = await verifierPlaqueExterne(
        identifiant,
        extensionNumber
      );
      return resultExterne;
    }
  } catch (error) {
    console.error("Verifier DGRK error:", error);
    // En cas d'erreur, essayer quand même l'externe
    try {
      // Utiliser 0 comme valeur par défaut si extension est undefined/null
      const extensionNumber = extension || 0;
      return await verifierPlaqueExterne(identifiant, extensionNumber);
    } catch (externeError) {
      return {
        status: "error",
        message: "Erreur réseau lors de la vérification",
      };
    }
  }
};

/**
 * Traite une demande de refactor
 */
export const traiterRefactor = async (
  idDGRK: string,
  donneesEngin: any,
  donneesParticulier: any,
  source?: "locale" | "externe",
  siteCode?: string // Ajouter le site_code comme paramètre
): Promise<RefactorResponse> => {
  try {
    const bodyData = {
      id_dgrk: idDGRK,
      donnees_engin: donneesEngin,
      donnees_particulier: donneesParticulier,
      source: source || "locale",
      site_code: siteCode || "", // Ajouter le site_code ici
    };

    const response = await fetch(
      `${API_BASE_URL}/refactor/traiter_refactor.php`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
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

// Ajouter une nouvelle fonction pour vérifier dans la base externe
export const verifierPlaqueExterne = async (
  plaque: string,
  extension?: number | null // Accepter le même type que verifierIdDGRK
): Promise<RefactorResponse> => {
  try {
    const formData = new FormData();
    formData.append("plaque", plaque);

    // Convertir extension en nombre avec 0 comme valeur par défaut
    const extensionNumber = extension || 0;
    formData.append("extension", extensionNumber.toString());

    console.log("Vérification plaque externe:", {
      plaque,
      extension: extensionNumber,
    });

    const response = await fetch(
      `${API_BASE_URL}/refactor/rechercher_plaque.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok || data.status === "error") {
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
