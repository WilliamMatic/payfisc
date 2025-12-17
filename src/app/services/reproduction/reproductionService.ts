/**
 * Service pour la gestion de la reproduction de cartes
 */

// Interfaces pour les données
export interface DonneesPlaque {
  id: number;
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
  reduction_type: string;
  reduction_valeur: number;
  nif: string;
  source?: "locale" | "externe";
}

export interface PaiementReproductionData {
  modePaiement: "mobile_money" | "cheque" | "banque" | "espece";
  operateur?: string;
  numeroTransaction?: string;
  numeroCheque?: string;
  banque?: string;
  codePromo?: string;
}

export interface ReproductionResponse {
  status: "success" | "error";
  message?: string;
  data?: any;
  source?: "locale" | "externe";
}

// URL de base de l'API
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls";

/**
 * Vérifie une plaque et récupère les données associées (locale OU externe)
 */
export const verifierPlaque = async (
  numeroPlaque: string,
  siteCode: string,
  extension?: number | null
): Promise<ReproductionResponse & { source?: string }> => {
  try {
    // D'abord, essayer avec la base locale
    const formData = new FormData();
    formData.append("numero_plaque", numeroPlaque);
    formData.append("site_code", siteCode);
    // Convertir extension en nombre avec 0 comme valeur par défaut
    const extensionNumber = extension || 0;
    formData.append("extension", extensionNumber.toString());

    const response = await fetch(
      `${API_BASE_URL}/reproduction/verifier_plaque.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      }
    );

    const data = await response.json();

    if (response.ok && data.status === "success") {
      return {
        ...data,
        source: "locale",
      };
    } else {
      // Si erreur ou non trouvé localement, essayer avec la base externe
      const resultExterne = await verifierPlaqueExterne(
        numeroPlaque,
        extensionNumber
      );
      return resultExterne;
    }
  } catch (error) {
    console.error("Verifier plaque error:", error);
    // En cas d'erreur, essayer quand même l'externe
    try {
      // Utiliser 0 comme valeur par défaut si extension est undefined/null
      const extensionNumber = extension || 0;
      return await verifierPlaqueExterne(numeroPlaque, extensionNumber);
    } catch (externeError) {
      return {
        status: "error",
        message: "Erreur réseau lors de la vérification",
      };
    }
  }
};

/**
 * Traite une demande de reproduction de carte
 */
export const traiterReproduction = async (
  impotId: string,
  numeroPlaque: string,
  paiementData: PaiementReproductionData,
  source?: "locale" | "externe",
  utilisateur?: any,
  extension?: number | null
): Promise<ReproductionResponse> => {
  try {
    const formData = new FormData();

    // Données de base
    formData.append("impot_id", impotId);
    formData.append("numero_plaque", numeroPlaque);
    formData.append("utilisateur_id", utilisateur?.id?.toString() || "1");
    formData.append("site_id", utilisateur?.site_id?.toString() || "1");
    formData.append("site_code", utilisateur?.site_code || "");
    formData.append("source", source || "locale");

    // Données de paiement
    formData.append("mode_paiement", paiementData.modePaiement);
    formData.append("operateur", paiementData.operateur || "");
    formData.append("numero_transaction", paiementData.numeroTransaction || "");
    formData.append("numero_cheque", paiementData.numeroCheque || "");
    formData.append("banque", paiementData.banque || "");
    formData.append("code_promo", paiementData.codePromo || "");
    // Convertir extension en nombre avec 0 comme valeur par défaut
    const extensionNumber = extension || 0;
    formData.append("extension", extensionNumber.toString());

    const response = await fetch(
      `${API_BASE_URL}/reproduction/traiter_reproduction.php`,
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
        message: data.message || "Échec du traitement de la reproduction",
      };
    }

    return data;
  } catch (error) {
    console.error("Traiter reproduction error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors du traitement de la reproduction",
    };
  }
};

/**
 * Vérifie une plaque dans la base externe
 */
export const verifierPlaqueExterne = async (
  plaque: string,
  extension?: number | null
): Promise<ReproductionResponse> => {
  try {
    const formData = new FormData();
    formData.append("plaque", plaque);

    // Convertir extension en nombre avec 0 comme valeur par défaut
    const extensionNumber = extension || 0;
    formData.append("extension", extensionNumber.toString());

    const response = await fetch(
      `${API_BASE_URL}/reproduction/rechercher_plaque.php`,
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

    // Formater les données de la base externe
    const donneesExternes = data.data;

    const formattedData: DonneesPlaque = {
      id: 0,
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
      reduction_type: "",
      reduction_valeur: 0,
      nif: "",
    };

    return {
      status: "success",
      message: "Données récupérées depuis la base externe",
      data: formattedData,
      source: "externe",
    };
  } catch (error) {
    console.error("Verifier plaque externe error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification de la plaque externe",
    };
  }
};
