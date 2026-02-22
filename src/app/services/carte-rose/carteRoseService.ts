"use server";

import { cacheLife, cacheTag } from "next/cache";
import { revalidateTag } from "next/cache";

/**
 * Server Actions pour la gestion des cartes roses
 */

// Interfaces
export interface VerificationData {
  telephone: string;
  numeroPlaque: string;
  utilisateur: number;
}

export interface ParticulierData {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  adresse: string;
  ville?: string;
  code_postal?: string;
  province?: string;
}

export interface EnginData {
  typeEngin: string;
  marque: string;
  modele: string;
  energie?: string;
  anneeFabrication?: string;
  anneeCirculation?: string;
  couleur?: string;
  puissanceFiscal?: string;
  usage?: string;
  numeroChassis?: string;
  numeroMoteur?: string;
}

export interface CarteRoseResponse {
  status: "success" | "error";
  message?: string;
  type?: string;
  data?: {
    particulier?: {
      id: number;
      nom: string;
      prenom: string;
      telephone: string;
      email?: string;
      adresse: string;
      ville?: string;
      province?: string;
      nif?: string;
    };
    plaque?: {
      id: number;
      numero_plaque: string;
      serie_id: number;
      serie_item_id: number;
      statut: number;
    };
    nom_complet?: string;
    telephone?: string;
    adresse?: string;
    numero_plaque?: string;
    date_attribution?: string;
    particulier_id?: number;
    engin_id?: number;
    nif?: string;
    particulier_existant?: boolean;
    paiement_id?: string;
  } | null;
}

export interface RechercheModeleResponse {
  status: "success" | "error";
  message?: string;
  data?: Array<{
    id: number;
    libelle: string;
    description: string;
    marque_engin_id: number;
    marque_libelle: string;
  }> | null;
}

export interface RecherchePuissanceResponse {
  status: "success" | "error";
  message?: string;
  data?: Array<{
    id: number;
    libelle: string;
    valeur: number;
    description: string;
    type_engin_libelle: string;
  }> | null;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:80/Impot/backend/calls";

// Tags de cache pour invalidation
const CACHE_TAGS = {
  SERIES_LIST: "series-list",
  SERIES_ACTIVES: "series-actives",
  PARTICULIERS_TELEPHONE: (telephone: string) =>
    `particuliers-tel-${telephone}`,
  PUISSANCES_LIST: "puissances-list",
  CARTE_ROSE_SOUMISSION: "carte-rose-soumission",
  CARTE_ROSE_VERIFICATION: "carte-rose-verification",
  PARTICULIERS_CARTE_ROSE: "particuliers-carte-rose",
};

// Tags de cache pour les modèles
const CACHE_TAGS_MODELES = {
  MODELES_LIST: "modeles-list",
  MODELES_ACTIFS: "modeles-actifs",
  MODELE_DETAILS: (id: number) => `modele-${id}`,
  MODELES_SEARCH: "modeles-search",
  MODELES_BY_MARQUE: (marqueId: number) => `modeles-marque-${marqueId}`,
};

async function invalidateModelesCache(modeleId?: number, marqueId?: number) {
  "use server";

  revalidateTag(CACHE_TAGS_MODELES.MODELES_LIST, "max");
  revalidateTag(CACHE_TAGS_MODELES.MODELES_ACTIFS, "max");
  revalidateTag(CACHE_TAGS_MODELES.MODELES_SEARCH, "max");

  if (modeleId) {
    revalidateTag(CACHE_TAGS_MODELES.MODELE_DETAILS(modeleId), "max");
  }

  if (marqueId) {
    revalidateTag(CACHE_TAGS_MODELES.MODELES_BY_MARQUE(marqueId), "max");
  }
}

/**
 * Invalide le cache après une mutation
 */
async function invalidatePuissancesCache(puissanceId?: number) {
  "use server";

  revalidateTag(CACHE_TAGS.PUISSANCES_LIST, "max");
}

/**
 * Invalide le cache après une soumission de carte rose réussie
 */
async function invalidateCarteRoseCache() {
  "use server";

  revalidateTag(CACHE_TAGS.SERIES_LIST, "max");
  revalidateTag(CACHE_TAGS.SERIES_ACTIVES, "max");
  // Invalider les caches des anciens services
  revalidateTag(CACHE_TAGS.CARTE_ROSE_SOUMISSION, "max");
  revalidateTag(CACHE_TAGS.CARTE_ROSE_VERIFICATION, "max");
  revalidateTag(CACHE_TAGS.PARTICULIERS_CARTE_ROSE, "max");

  // ⚡ NOUVEAU : Invalider aussi les caches des services de liste et statistiques
  // Revalider toutes les combinaisons possibles de paramètres pour les listes de cartes roses
  // Nous invalidons les tags génériques (sans hash) pour forcer le rechargement
  revalidateTag("cartes-list-", "max");
  revalidateTag("cartes-stats-", "max");

  // Revalider aussi les tags généraux pour s'assurer que tout est rafraîchi
  revalidateTag("cartes-recent-", "max");
  revalidateTag("cartes-plaque-", "max");
}

/**
 * Vérifie le téléphone et le numéro de plaque
 */
export async function verifierPlaqueTelephone(
  verificationData: VerificationData,
): Promise<CarteRoseResponse> {
  try {
    const formData = new FormData();
    formData.append("telephone", verificationData.telephone);
    formData.append("numero_plaque", verificationData.numeroPlaque);
    formData.append("user", verificationData.utilisateur.toString());

    const response = await fetch(
      `${API_BASE_URL}/carterose/verifier_plaque.php`,
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
        message: data.message || "Échec de la vérification",
        type: data.type,
      };
    }

    return data;
  } catch (error) {
    console.error("Verification plaque error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification",
    };
  }
}

/**
 * Vérifie si un téléphone existe déjà (uniquement si le téléphone n'est pas vide et différent de "-")
 */
export async function verifierTelephoneExistant(
  telephone: string,
): Promise<CarteRoseResponse> {
  "use cache";

  try {
    // Ne pas vérifier si le téléphone est vide ou juste un tiret
    if (!telephone || telephone.trim() === "" || telephone.trim() === "-") {
      return {
        status: "success",
        message: "Téléphone vide ou '-', pas de vérification nécessaire",
        data: null,
      };
    }

    cacheLife("weeks");
    cacheTag(CACHE_TAGS.PARTICULIERS_TELEPHONE(telephone));

    const formData = new FormData();
    formData.append("telephone", telephone);

    const response = await fetch(
      `${API_BASE_URL}/carterose/verifier_telephone.php`,
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
        message: data.message || "Échec de la vérification du téléphone",
      };
    }

    return data;
  } catch (error) {
    console.error("Verification telephone error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification du téléphone",
    };
  }
}

/**
 * Recherche des modèles par marque et terme de recherche
 * PAS DE CACHE - Recherche en temps réel
 */
export async function rechercherModeles(
  marqueId: number,
  searchTerm: string,
): Promise<RechercheModeleResponse> {
  try {
    const formData = new FormData();
    formData.append("marque_id", marqueId.toString());
    formData.append("search", searchTerm);

    const response = await fetch(
      `${API_BASE_URL}/marques-engins/rechercher__modeles.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
        // Pas de cache pour les recherches
        cache: "no-store",
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
    console.error("Recherche modeles error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des modèles",
    };
  }
}

/**
 * Crée un nouveau modèle
 */
export async function creerModele(
  libelle: string,
  marqueEnginId: number,
  description: string = "",
): Promise<RechercheModeleResponse> {
  try {
    const formData = new FormData();
    formData.append("libelle", libelle);
    formData.append("marque_engin_id", marqueEnginId.toString());
    formData.append("description", description);

    const response = await fetch(
      `${API_BASE_URL}/marques-engins/creer_modele.php`,
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
        message: data.message || "Échec de la création du modèle",
      };
    }

    await invalidateModelesCache();

    return data;
  } catch (error) {
    console.error("Creation modele error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la création du modèle",
    };
  }
}

/**
 * Recherche des puissances fiscales par type d'engin et terme
 * PAS DE CACHE - Recherche en temps réel
 */
export async function rechercherPuissancesFiscales(
  typeEnginLibelle: string,
  searchTerm: string,
): Promise<RecherchePuissanceResponse> {
  try {
    const formData = new FormData();
    formData.append("type_engin_libelle", typeEnginLibelle);
    formData.append("search", searchTerm);

    const response = await fetch(
      `${API_BASE_URL}/puissances-fiscales/rechercher__puissances_par_type.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
        // Pas de cache pour les recherches
        cache: "no-store",
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
    console.error("Recherche puissances error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des puissances",
    };
  }
}

/**
 * Crée une nouvelle puissance fiscale
 */
export async function creerPuissanceFiscale(
  libelle: string,
  valeur: number,
  typeEnginLibelle: string,
  description: string = "",
): Promise<RecherchePuissanceResponse> {
  try {
    const formData = new FormData();
    formData.append("libelle", libelle);
    formData.append("valeur", valeur.toString());
    formData.append("type_engin_libelle", typeEnginLibelle);
    formData.append("description", description);

    const response = await fetch(
      `${API_BASE_URL}/puissances-fiscales/creer__puissance_fiscale_type.php`,
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
        message: data.message || "Échec de la création de la puissance",
      };
    }

    // ⚡ Invalider le cache
    await invalidatePuissancesCache();

    return data;
  } catch (error) {
    console.error("Creation puissance error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la création de la puissance",
    };
  }
}

/**
 * Soumet la carte rose complète
 * INVALIDE LE CACHE après soumission réussie
 */
export async function soumettreCarteRose(
  impotId: string,
  particulierData: ParticulierData,
  enginData: EnginData,
  numeroPlaque: string,
  serieId: number,
  serieItemId: number,
  plaqueAttribueeId: number | null,
  utilisateur: any,
): Promise<CarteRoseResponse> {
  try {
    const formData = new FormData();

    // Données de base
    formData.append("impot_id", impotId);
    formData.append("utilisateur_id", utilisateur.id.toString());
    formData.append("site_id", utilisateur.site_id?.toString() || "1");

    // Données du particulier
    formData.append("nom", particulierData.nom);
    formData.append("prenom", particulierData.prenom);
    // Téléphone peut être vide
    formData.append("telephone", particulierData.telephone || "");
    formData.append("email", particulierData.email || "");
    formData.append("adresse", particulierData.adresse);
    formData.append("ville", particulierData.ville || "");
    formData.append("code_postal", particulierData.code_postal || "");
    formData.append("province", particulierData.province || "");

    // Données de l'engin - CORRECTION: concaténation marque + espace + modèle
    formData.append("type_engin", enginData.typeEngin);
    const marqueComplete = `${enginData.marque} ${enginData.modele}`;
    formData.append("marque", marqueComplete);
    formData.append("energie", enginData.energie || "");
    formData.append("annee_fabrication", enginData.anneeFabrication || "");
    formData.append("annee_circulation", enginData.anneeCirculation || "");
    formData.append("couleur", enginData.couleur || "");
    formData.append("puissance_fiscal", enginData.puissanceFiscal || "");
    formData.append("usage_engin", enginData.usage || "");
    formData.append("numero_chassis", enginData.numeroChassis || "");
    formData.append("numero_moteur", enginData.numeroMoteur || "");

    // Données plaque
    formData.append("numero_plaque", numeroPlaque);
    formData.append("serie_id", serieId.toString());
    formData.append("serie_item_id", serieItemId.toString());

    if (plaqueAttribueeId) {
      formData.append("plaque_attribuee_id", plaqueAttribueeId.toString());
    }

    const response = await fetch(
      `${API_BASE_URL}/carterose/soumettre_carte_rose.php`,
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
        message: data.message || "Échec de la soumission de la carte rose",
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

      await invalidateCarteRoseCache();
    }

    return data;
  } catch (error) {
    console.error("Soumettre carte rose error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la soumission de la carte rose",
    };
  }
}
