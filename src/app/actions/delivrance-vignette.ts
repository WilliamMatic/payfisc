// actions/delivrance-vignette.ts
"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// Types
interface VerificationPaiementData {
  plaque: string;
  reference: string;
}

interface DelivranceVignetteData {
  id_paiement: number;
  engin_id: number;
  particulier_id: number;
  utilisateur_id: number;
  utilisateur_name: string;
  site_id: number;
}

/**
 * Vérifie un paiement bancaire pour la délivrance (Server Action)
 */
export async function verifierPaiementBancaireAction(
  data: VerificationPaiementData,
): Promise<{
  success: boolean;
  message: string;
  data?: {
    paiement_bancaire: {
      id: number;
      reference_bancaire: string;
      statut: string;
      id_paiement: number;
      date_creation: string;
    };
    paiement: {
      id: number;
      engin_id: number;
      particulier_id: number;
      montant: number;
      mode_paiement: string;
      statut: string;
      date_paiement: string;
      utilisateur_id: number;
      site_id: number;
      impot_id: number;
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
      id: number;
      numero_plaque: string;
      marque: string;
      modele: string;
      couleur: string;
      energie: string;
      usage_engin: string;
      puissance_fiscal: string;
      annee_fabrication: string;
      annee_circulation: string;
      numero_chassis: string;
      numero_moteur: string;
      type_engin: string;
      status_vignette: "pending" | "delivered" | "expired";
      date_derniere_vignette?: string;
    };
    taux?: {
      taux_actif: number;
      date_application: string;
    };
    impot?: {
      id: number;
      nom: string;
      prix: number;
    };
  };
}> {
  try {
    const { plaque, reference } = data;

    if (!plaque.trim() || !reference.trim()) {
      return {
        success: false,
        message: "La plaque et la référence sont requises",
      };
    }

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost/SOCOFIAPP/Impot/backend/calls";

    // Appel au backend pour vérification
    const response = await fetch(
      `${API_BASE_URL}/vente-vignette/verifier_paiement_bancaire.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plaque: plaque.trim().toUpperCase(),
          reference: reference.trim(),
        }),
      },
    );

    const result = await response.json();

    if (!response.ok || result.status === "error") {
      return {
        success: false,
        message: result.message || "Échec de la vérification",
      };
    }

    return {
      success: true,
      message: result.message || "Paiement vérifié avec succès",
      data: result.data,
    };
  } catch (error) {
    console.error("Erreur vérification paiement:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? `Erreur lors de la vérification: ${error.message}`
          : "Erreur serveur lors de la vérification",
    };
  }
}

/**
 * Délivre une vignette après vérification (Server Action)
 */
export async function delivrerVignetteAction(
  data: DelivranceVignetteData,
): Promise<{
  success: boolean;
  message: string;
  data?: {
    delivrance: {
      id: number;
      id_paiement: number;
      date_delivrance: string;
      utilisateur_delivrance: string;
      code_vignette: string;
      date_validite: string;
    };
    paiement: {
      id: number;
      reference: string;
      montant: number;
    };
    engin: {
      numero_plaque: string;
      marque: string;
      modele: string;
    };
    assujetti: {
      nom_complet: string;
      telephone: string;
    };
    site: {
      nom_site: string;
      code_site: string;
    };
  };
}> {
  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost/SOCOFIAPP/Impot/backend/calls";

    // Appel au backend pour délivrance
    const response = await fetch(
      `${API_BASE_URL}/vente-vignette/delivrer_vignette.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

    const result = await response.json();

    if (!response.ok || result.status === "error") {
      return {
        success: false,
        message: result.message || "Échec de la délivrance",
      };
    }

    // Revalider le cache pour la page des délivrances
    revalidatePath("/delivrance-vignette");

    return {
      success: true,
      message: result.message || "Vignette délivrée avec succès",
      data: result.data,
    };
  } catch (error) {
    console.error("Erreur délivrance vignette:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? `Erreur lors de la délivrance: ${error.message}`
          : "Erreur serveur lors de la délivrance",
    };
  }
}

/**
 * Génère un code de vignette unique
 */
export async function genererCodeVignette(): Promise<string> {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const year = new Date().getFullYear();
  return `VGN-${year}-${timestamp.toString().slice(-6)}-${random
    .toString()
    .padStart(4, "0")}`;
}