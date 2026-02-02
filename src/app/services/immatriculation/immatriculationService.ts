"use server";

import { cacheLife, cacheTag } from "next/cache";
import { revalidateTag } from "next/cache";

/**
 * Server Actions pour la gestion de l'immatriculation des plaques avec Cache Components Next.js 16
 */

// Interfaces
export interface ParticulierData {
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  adresse: string;
  nif?: string;
  reduction_type?: "pourcentage" | "montant_fixe";
  reduction_valeur?: number;
}

export interface EnginData {
  typeEngin: string;
  marque: string;
  modele: string;
  energie: string;
  anneeFabrication: string;
  anneeCirculation: string;
  couleur: string;
  puissanceFiscal: string;
  usage: string;
  numeroChassis: string;
  numeroMoteur: string;
}

export interface PaiementData {
  modePaiement: "mobile_money" | "cheque" | "banque" | "espece";
  operateur?: string;
  numeroTransaction?: string;
  numeroCheque?: string;
  banque?: string;
  serie_item_id?: number | null;
}

export interface VerifierParticulierResponse {
  status: "success" | "error";
  message?: string;
  data?: {
    id?: number;
    nom?: string;
    prenom?: string;
    telephone?: string;
    email?: string;
    adresse?: string;
    nif?: string;
    reduction_type?: string;
    reduction_valeur?: number;
    reduction_montant_max?: number;
    date_creation?: string;
  } | null;
}

export interface ImmatriculationResponse {
  status: "success" | "error";
  message?: string;
  data?: {
    numeroPlaque: string;
    serie_item_id?: number;
    particulier: any;
    engin: any;
    paiement: any;
    facture?: any;
    paiement_id: string;
    reduction_appliquee?: {
      type: string;
      valeur: number;
      montant_initial: number;
      montant_final: number;
    };
    repartition?: any;
  };
}

export interface CarteReprintData {
  id_paiement: number;
  numero_plaque: string;
  raison?: string;
}

export interface AnnulerImmatriculationResponse {
  status: "success" | "error";
  message?: string;
  data?: {
    paiement_id: number;
    numero_plaque: string;
    montant_rembourse: number;
    serie_item_id: number;
    raison: string;
  };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls";

// Tags de cache pour invalidation ciblée
const CACHE_TAGS = {
  PARTICULIERS_TELEPHONE: (telephone: string) =>
    `particuliers-tel-${telephone}`,
  MODELES_RECHERCHE: (marqueId: number, searchTerm: string) =>
    `modeles-search-${marqueId}-${searchTerm}`,
  PUISSANCES_RECHERCHE: (typeEngin: string, searchTerm: string) =>
    `puissances-search-${typeEngin}-${searchTerm}`,
  PLAQUES_DISPONIBLES: (utilisateurId: number, siteId: number) =>
    `plaques-disponibles-${utilisateurId}-${siteId}`,
  CHASSIS_VERIFICATION: (numeroChassis: string) =>
    `chassis-verification-${numeroChassis}`,
  COULEURS_RECHERCHE: (searchTerm: string) => `couleurs-search-${searchTerm}`,
  COULEURS_NEW: "couleurs-new", // Tag spécifique pour les nouvelles couleurs
  VENTES_IMMATRICULATION: "ventes-immatriculation", // Tag pour les ventes après immatriculation
};

/**
 * Invalide le cache après une immatriculation réussie
 */
async function invalidateImmatriculationCache() {
  "use server";

  // Invalider les caches liés aux ventes (pour le module des ventes)
  revalidateTag("ventes-list-", "max");
  revalidateTag("ventes-stats-", "max");
  revalidateTag("ventes-export-", "max");
}

/**
 * Invalide le cache des couleurs après ajout/modification
 */
async function invalidateCouleursCache() {
  "use server";

  revalidateTag("couleurs-list", "max");
  revalidateTag("couleurs-actives", "max");
  revalidateTag("couleurs-search", "max");
  revalidateTag(CACHE_TAGS.COULEURS_NEW, "max");
}

/**
 * Vérifie si un particulier existe par son numéro de téléphone (AVEC CACHE - 5 minutes)
 */
export async function verifierParticulierParTelephone(
  telephone?: string,
): Promise<VerifierParticulierResponse> {
  "use cache";

  if (!telephone || telephone.trim() === "" || telephone.trim() === "-") {
    return {
      status: "success",
      message: "Téléphone non renseigné ou invalide, vérification ignorée",
      data: null,
    };
  }

  cacheLife("weeks");
  cacheTag(CACHE_TAGS.PARTICULIERS_TELEPHONE(telephone));

  try {
    const formData = new FormData();
    formData.append("telephone", telephone);

    const response = await fetch(
      `${API_BASE_URL}/immatriculation/verifier_particulier.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la vérification du particulier",
        data: null,
      };
    }

    return data;
  } catch (error) {
    console.error("Verifier particulier error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification du particulier",
      data: null,
    };
  }
}

/**
 * Recherche des modèles par marque et terme (AVEC CACHE - 10 minutes)
 */
export async function rechercherModeles(
  marqueId: number,
  searchTerm: string,
): Promise<ImmatriculationResponse> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.MODELES_RECHERCHE(marqueId, searchTerm));

  try {
    const formData = new FormData();
    formData.append("marque_id", marqueId.toString());
    formData.append("search_term", searchTerm);

    const response = await fetch(
      `${API_BASE_URL}/marques-engins/rechercher_modeles.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la recherche des modèles",
      };
    }

    return data;
  } catch (error) {
    console.error("Rechercher modeles error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des modèles",
    };
  }
}

/**
 * Recherche des puissances fiscales par terme (AVEC CACHE - 10 minutes)
 */
export async function rechercherPuissances(
  typeEngin: string,
  searchTerm: string,
): Promise<ImmatriculationResponse> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.PUISSANCES_RECHERCHE(typeEngin, searchTerm));

  try {
    const formData = new FormData();
    formData.append("type_engin", typeEngin);
    formData.append("search_term", searchTerm);

    const response = await fetch(
      `${API_BASE_URL}/puissances-fiscales/rechercher_puissances.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la recherche des puissances",
      };
    }

    return data;
  } catch (error) {
    console.error("Rechercher puissances error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des puissances",
    };
  }
}

/**
 * Récupère un numéro de plaque disponible (SANS changer le statut) selon la province de l'utilisateur (AVEC CACHE - 5 minutes)
 */
export async function getNumeroPlaqueDisponible(
  utilisateur: any,
): Promise<ImmatriculationResponse> {
  "use cache";
  cacheLife("minutes");
  cacheTag(
    CACHE_TAGS.PLAQUES_DISPONIBLES(utilisateur.id, utilisateur.site_id || 1),
  );

  try {
    const formData = new FormData();
    formData.append("utilisateur_id", utilisateur.id.toString());
    formData.append("site_id", utilisateur.site_id?.toString() || "1");

    const response = await fetch(
      `${API_BASE_URL}/immatriculation/get_numero_plaque.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la récupération du numéro de plaque",
      };
    }

    return data;
  } catch (error) {
    console.error("Get numero plaque error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération du numéro de plaque",
    };
  }
}

/**
 * Vérifie la disponibilité d'un numéro de chassis (AVEC CACHE - 10 minutes)
 */
export async function verifierNumeroChassis(
  numeroChassis: string,
): Promise<ImmatriculationResponse> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.CHASSIS_VERIFICATION(numeroChassis));

  try {
    const formData = new FormData();
    formData.append("numero_chassis", numeroChassis);

    const response = await fetch(
      `${API_BASE_URL}/immatriculation/verifier_chassis.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message:
          data.message || "Échec de la vérification du numéro de chassis",
      };
    }

    return data;
  } catch (error) {
    console.error("Verifier chassis error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification du numéro de chassis",
    };
  }
}

/**
 * Soumet une demande d'immatriculation complète (INVALIDE LE CACHE)
 * Mutation qui invalide les caches liés aux ventes et particuliers
 */
export async function soumettreImmatriculation(
  impotId: string,
  particulierData: ParticulierData,
  enginData: EnginData,
  paiementData: PaiementData,
  utilisateur: any,
): Promise<ImmatriculationResponse> {
  try {
    const formData = new FormData();

    // Données de base
    formData.append("impot_id", impotId);
    formData.append("utilisateur_id", utilisateur.id.toString());
    formData.append("site_id", utilisateur.site_id?.toString() || "1");

    // Données du particulier
    formData.append("nom", particulierData.nom);
    formData.append("prenom", particulierData.prenom);
    formData.append("telephone", particulierData.telephone || "-");
    formData.append("email", particulierData.email || "");
    formData.append("adresse", particulierData.adresse);
    formData.append("nif", particulierData.nif || "");

    // Données de réduction
    if (particulierData.reduction_type && particulierData.reduction_valeur) {
      formData.append("reduction_type", particulierData.reduction_type);
      formData.append(
        "reduction_valeur",
        particulierData.reduction_valeur.toString(),
      );
    }

    // Données de l'engin
    formData.append("type_engin", enginData.typeEngin);
    formData.append("marque", enginData.marque);
    formData.append("modele", enginData.modele);
    formData.append("energie", enginData.energie);
    formData.append("annee_fabrication", enginData.anneeFabrication);
    formData.append("annee_circulation", enginData.anneeCirculation);
    formData.append("couleur", enginData.couleur);
    formData.append("puissance_fiscal", enginData.puissanceFiscal);
    formData.append("usage", enginData.usage);
    formData.append("numero_chassis", enginData.numeroChassis);
    formData.append("numero_moteur", enginData.numeroMoteur);

    // Données de paiement
    formData.append("mode_paiement", paiementData.modePaiement);
    formData.append("operateur", paiementData.operateur || "");
    formData.append("numero_transaction", paiementData.numeroTransaction || "");
    formData.append("numero_cheque", paiementData.numeroCheque || "");
    formData.append("banque", paiementData.banque || "");
    formData.append("montant", utilisateur.formule || "32");

    // Inclure le serie_item_id pour marquer la plaque comme utilisée
    if (paiementData.serie_item_id) {
      formData.append("serie_item_id", paiementData.serie_item_id.toString());
    }

    const response = await fetch(
      `${API_BASE_URL}/immatriculation/soumettre_immatriculation.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la soumission de l'immatriculation",
      };
    }

    // ⚡ Invalider les caches après une immatriculation réussie
    if (data.status === "success") {
      // revalidateTag() est synchrone, pas besoin de await
      if (particulierData?.telephone?.trim()) {
        revalidateTag(
          CACHE_TAGS.PARTICULIERS_TELEPHONE(particulierData.telephone.trim()),
          "max",
        );
      }

      await invalidateImmatriculationCache();
    }

    return data;
  } catch (error) {
    console.error("Soumettre immatriculation error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la soumission de l'immatriculation",
    };
  }
}

/**
 * Annule complètement une immatriculation (INVALIDE LE CACHE)
 */
export async function annulerImmatriculation(
  paiementId: number,
  utilisateurId: number,
  raison?: string,
): Promise<AnnulerImmatriculationResponse> {
  try {
    const formData = new FormData();
    formData.append("paiement_id", paiementId.toString());
    formData.append("utilisateur_id", utilisateurId.toString());
    if (raison) {
      formData.append("raison", raison);
    }

    const response = await fetch(
      `${API_BASE_URL}/immatriculation/annuler_immatriculation.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de l'annulation de l'immatriculation",
      };
    }

    // ⚡ Invalider les caches après annulation
    if (data.status === "success") {
      await invalidateImmatriculationCache();
    }

    return data;
  } catch (error) {
    console.error("Annuler immatriculation error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'annulation de l'immatriculation",
    };
  }
}

/**
 * Recherche une couleur par nom (SANS CACHE - temps réel)
 */
export async function rechercherCouleur(searchTerm: string): Promise<any> {
  try {
    const formData = new FormData();
    formData.append("search_term", searchTerm);

    const response = await fetch(
      `${API_BASE_URL}/immatriculation/rechercher_couleurs.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
        // Pas de cache pour les recherches en temps réel
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la recherche des couleurs",
      };
    }

    return data;
  } catch (error) {
    console.error("Rechercher couleurs error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des couleurs",
    };
  }
}

/**
 * Ajoute une nouvelle couleur (INVALIDE LE CACHE)
 * Mutation qui invalide les caches des couleurs
 */
export async function ajouterCouleur(
  nom: string,
  codeHex: string,
): Promise<any> {
  try {
    const formData = new FormData();
    formData.append("nom", nom);
    formData.append("code_hex", codeHex);

    const response = await fetch(
      `${API_BASE_URL}/immatriculation/ajouter_couleur.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de l'ajout de la couleur",
      };
    }

    // ⚡ Invalider les caches des couleurs après ajout
    if (data.status === "success") {
      await invalidateCouleursCache();
    }

    return data;
  } catch (error) {
    console.error("Ajouter couleur error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'ajout de la couleur",
    };
  }
}
