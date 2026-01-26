"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// Types
interface PaiementVignetteData {
  engin_id: number;
  particulier_id: number;
  montant: number;
  montant_initial: number;
  impot_id: string | number;
  mode_paiement: "mobile_money" | "cheque" | "banque" | "espece";
  operateur?: string;
  numero_transaction?: string;
  numero_cheque?: string;
  banque?: string;
  statut?: "pending" | "completed" | "failed";
  utilisateur_id: number;
  utilisateur_name: string;
  site_id: number;
  nombre_plaques?: number;
  taux_cdf: number;
}

/**
 * Enregistre un paiement de vignette (Server Action)
 */
export async function enregistrerPaiementAction(
  paiementData: PaiementVignetteData,
): Promise<{
  success: boolean;
  message: string;
  data?: {
    site: {
      nom_site: string;
      fournisseur: string;
    };
    assujetti: {
      id: number;
      nom_complet: string;
      telephone: string;
      adresse: string;
      nif: string;
      email: string;
    };
    engin: {
      id: number | null;
      numero_plaque: string;
      marque: string;
      couleur: string;
      energie: string;
      usage_engin: string;
      puissance_fiscal: string;
      annee_fabrication: string;
      annee_circulation: string;
      numero_chassis: string;
      numero_moteur: string;
      modele: string;
      type_engin: string;
    };
    paiement: {
      id?: number;
      montant: number;
      montant_initial: number;
      mode_paiement: string;
      operateur?: string | null;
      numero_transaction?: string | null;
      date_paiement: string;
      statut: string;
    };
    taux: {
      taux_actif: number;
      date_application: string;
    };
    utilisateur: {
      id: number;
      nom: string;
    };
  };
}> {
  try {
    // URL de l'API backend
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost/SOCOFIAPP/Impot/backend/calls";

    // Préparer les données complètes
    const completeData = {
      ...paiementData,
      statut: paiementData.statut || "completed",
      date_paiement: new Date().toISOString().slice(0, 19).replace("T", " "),
      nombre_plaques: paiementData.nombre_plaques || 1,
      etat: 1,
    };

    // Appel à l'API backend pour enregistrement
    const response = await fetch(
      `${API_BASE_URL}/vente-vignette/enregistrer_paiement.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(completeData),
      },
    );

    const result = await response.json();

    if (!response.ok || result.status === "error") {
      console.error("Erreur du serveur:", result);
      return {
        success: false,
        message: result.message || "Échec de l'enregistrement du paiement",
      };
    }

    // Vérifier si le backend a retourné des données valides
    if (!result.data) {
      console.warn("Le backend n'a pas retourné de données 'data'");
      return {
        success: false,
        message: "Données de paiement non retournées par le serveur",
      };
    }

    // S'assurer que les données sont dans le format attendu
    let formattedResponse;

    // Cas 1: Le backend a déjà retourné le bon format (avec site, assujetti, engin, etc.)
    if (
      result.data.site &&
      result.data.assujetti &&
      result.data.engin &&
      result.data.paiement &&
      result.data.taux &&
      result.data.utilisateur
    ) {
      console.log("Format 1: Données déjà structurées");
      formattedResponse = result.data;
    }
    // Cas 2: Le backend retourne des données brutes (ancien format)
    else if (result.data.site_nom || result.data.engin_plaque) {
      console.log("Format 2: Données brutes à structurer");
      formattedResponse = {
        site: {
          nom_site: result.data.site_nom || "Site non spécifié",
          fournisseur: "TSC-NPS",
        },
        assujetti: {
          id: paiementData.particulier_id,
          nom_complet:
            result.data.assujetti_nom ||
            (result.data.assujetti_prenom
              ? `${result.data.assujetti_prenom || ""} ${result.data.assujetti_nom || ""}`.trim()
              : "Non spécifié"),
          telephone: result.data.assujetti_telephone || "",
          adresse: result.data.assujetti_adresse || "",
          nif: result.data.assujetti_nif || "",
          email: result.data.assujetti_email || "",
        },
        engin: {
          id: paiementData.engin_id || null,
          numero_plaque: result.data.engin_plaque || "Non spécifié",
          marque: result.data.engin_marque || "",
          modele: result.data.engin_modele || "",
          couleur: result.data.couleur || "",
          energie: result.data.energie || "",
          usage_engin: result.data.usage_engin || "",
          puissance_fiscal: result.data.puissance_fiscal || "",
          annee_fabrication: result.data.annee_fabrication || "",
          annee_circulation: result.data.annee_circulation || "",
          numero_chassis: result.data.numero_chassis || "",
          numero_moteur: result.data.numero_moteur || "",
          type_engin: result.data.engin_type || "Véhicule",
        },
        paiement: {
          id: result.data.id || result.data.paiement_id,
          montant: paiementData.montant,
          montant_initial: paiementData.montant_initial,
          mode_paiement: paiementData.mode_paiement,
          operateur: paiementData.operateur || null,
          numero_transaction: paiementData.numero_transaction || null,
          date_paiement: result.data.date_paiement || new Date().toISOString(),
          statut: paiementData.statut || "completed",
        },
        taux: {
          taux_actif: paiementData.taux_cdf,
          date_application: new Date().toISOString(),
        },
        utilisateur: {
          id: paiementData.utilisateur_id,
          nom: result.data.caissier_nom || paiementData.utilisateur_name || "Caissier",
        },
      };
    }
    // Cas 3: Format inconnu, créer une réponse de base
    else {
      console.warn("Format 3: Format inconnu, création d'une réponse de base");
      formattedResponse = {
        site: {
          nom_site: "Site non spécifié",
          fournisseur: "TSC-NPS",
        },
        assujetti: {
          id: paiementData.particulier_id,
          nom_complet: "Non spécifié",
          telephone: "",
          adresse: "",
          nif: "",
          email: "",
        },
        engin: {
          id: paiementData.engin_id || null,
          numero_plaque: "Non spécifié",
          marque: "",
          modele: "",
          type_engin: "Véhicule",
        },
        paiement: {
          montant: paiementData.montant,
          montant_initial: paiementData.montant_initial,
          mode_paiement: paiementData.mode_paiement,
          operateur: paiementData.operateur || null,
          numero_transaction: paiementData.numero_transaction || null,
          date_paiement: new Date().toISOString(),
          statut: "completed",
        },
        taux: {
          taux_actif: paiementData.taux_cdf,
          date_application: new Date().toISOString(),
        },
        utilisateur: {
          id: paiementData.utilisateur_id,
          nom: paiementData.utilisateur_name || "Caissier",
        },
      };
    }

    console.log("Réponse formatée pour le frontend:", formattedResponse);

    // Revalider le cache pour la page des vignettes
    revalidatePath("/vente-vignette");

    return {
      success: true,
      message: "Paiement enregistré avec succès",
      data: formattedResponse,
    };
  } catch (error) {
    console.error("Erreur enregistrement paiement:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? `Erreur lors de l'enregistrement: ${error.message}`
          : "Erreur serveur lors de l'enregistrement",
    };
  }
}

/**
 * Recherche une plaque dans les bases TSC/HAOJUE/TVS (Server Action)
 */
export async function rechercherPlaqueAction(formData: FormData): Promise<{
  success: boolean;
  message: string;
  data?: {
    assujetti: any;
    engin: any;
    source?: string;
  };
}> {
  try {
    const plaque = formData.get("plaque") as string;
    const extension = formData.get("extension")
      ? parseInt(formData.get("extension") as string)
      : 0;

    if (!plaque || !plaque.trim()) {
      return {
        success: false,
        message: "Le numéro de plaque est requis",
      };
    }

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost/SOCOFIAPP/Impot/backend/calls";

    // Appel à l'API backend
    const response = await fetch(
      `${API_BASE_URL}/refactor/rechercher_plaque.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          plaque: plaque.trim().toUpperCase(),
          extension: extension.toString(),
        }),
      },
    );

    const result = await response.json();

    if (!response.ok || result.status === "error") {
      return {
        success: false,
        message: result.message || "Plaque non trouvée",
      };
    }

    // Formater les données pour le frontend
    const donneesExternes = result.data;

    // Déterminer la source
    let source = "TSC-NPS";
    if (extension === 439727) source = "HAOJUE";
    if (extension === 440071) source = "TVS";

    const formattedData = {
      assujetti: {
        id: 0,
        nom_complet: donneesExternes.client?.nom_complet || "",
        telephone: donneesExternes.client?.telephone || "",
        adresse: donneesExternes.client?.adresse || "",
        nif: "",
        email: "",
        particulier_id: 0,
      },
      engin: {
        id: 0,
        engin_id: 0,
        numero_plaque: donneesExternes.plaque?.numero || plaque.toUpperCase(),
        marque: donneesExternes.vehicule?.marque || "",
        modele: donneesExternes.vehicule?.modele || "",
        numero_chassis: donneesExternes.vehicule?.chassis || "",
        numero_moteur: donneesExternes.vehicule?.moteur || "",
        couleur: donneesExternes.vehicule?.couleur || "",
        annee_fabrication: donneesExternes.vehicule?.annee_fabrication || "",
        annee_circulation: donneesExternes.vehicule?.annee_circulation || "",
        energie: donneesExternes.vehicule?.energie || "",
        puissance_fiscal: donneesExternes.vehicule?.puissance || "",
        usage: donneesExternes.vehicule?.usage_vehicule || "",
        date_enregistrement:
          donneesExternes.plaque?.date_achat ||
          new Date().toISOString().split("T")[0],
        site_enregistrement: source,
        utilisateur_enregistrement: "Système TSC",
        type_engin: donneesExternes.vehicule?.type_auto || "Véhicule",
      },
      source,
    };

    return {
      success: true,
      message: `Véhicule trouvé dans la base ${source}`,
      data: formattedData,
    };
  } catch (error) {
    console.error("Erreur recherche plaque:", error);
    return {
      success: false,
      message: "Erreur serveur lors de la recherche",
    };
  }
}

/**
 * Vérifie si une plaque a déjà une vignette valide (Server Action)
 */
export async function verifierVignetteExistanteAction(plaque: string): Promise<{
  success: boolean;
  existe: boolean;
  message: string;
}> {
  try {
    if (!plaque || !plaque.trim()) {
      return {
        success: false,
        existe: false,
        message: "Numéro de plaque invalide",
      };
    }

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost/SOCOFIAPP/Impot/backend/calls";

    const response = await fetch(
      `${API_BASE_URL}/vente-vignette/verifier_vignette.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plaque: plaque.trim().toUpperCase() }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        existe: false,
        message: result.message || "Erreur lors de la vérification",
      };
    }

    return {
      success: true,
      existe: result.existe || false,
      message:
        result.message ||
        (result.existe
          ? "Vignette existante trouvée"
          : "Pas de vignette existante"),
    };
  } catch (error) {
    console.error("Erreur vérification vignette:", error);
    return {
      success: false,
      existe: false,
      message: "Erreur serveur lors de la vérification",
    };
  }
}

/**
 * Génère un numéro de transaction unique
 */
export async function genererNumeroTransaction(): Promise<string> {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `VIGN-${timestamp}-${random.toString().padStart(4, "0")}`;
}

/**
 * Récupère les informations du site actuel
 */
export async function getSiteInfo(): Promise<{
  success: boolean;
  data?: {
    site_id: number;
    site_nom: string;
    site_code: string;
  };
  message?: string;
}> {
  try {
    const cookieStore = await cookies();
    const siteData = cookieStore.get("site")?.value;

    if (siteData) {
      const site = JSON.parse(siteData);
      return {
        success: true,
        data: {
          site_id: site.id || 1,
          site_nom: site.nom || "Centre Principal",
          site_code: site.code || "CP01",
        },
      };
    }

    // Valeurs par défaut si pas de cookie
    return {
      success: true,
      data: {
        site_id: 1,
        site_nom: "Centre Principal",
        site_code: "CP01",
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Erreur lors de la récupération des infos du site",
    };
  }
}