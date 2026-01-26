'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { revalidateTag } from 'next/cache';

/**
 * Server Actions pour la gestion des commandes de plaques pour clients spéciaux avec Cache Components Next.js 16
 */

export interface ParticulierData {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  adresse: string;
  nif?: string;
  reduction_type?: string;
  reduction_valeur?: number;
  date_mouvement?: string;
}

export interface CommandeData {
  nombrePlaques: number;
  numeroPlaqueDebut?: string;
}

export interface PaiementData {
  modePaiement: "mobile_money" | "cheque" | "banque" | "espece";
  operateur?: string;
  numeroTransaction?: string;
  numeroCheque?: string;
  banque?: string;
}

export interface AssujettiInfo {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  rue: string;
  nif: string;
  reduction_type: "pourcentage" | "montant_fixe" | null;
  reduction_valeur: number;
}

export interface ClientSimpleResponse {
  status: "success" | "error";
  message?: string;
  data?: {
    numeroPlaques?: string[];
    particulier?: any;
    commande?: any;
    paiement?: any;
    facture?: any;
    reduction_appliquee?: {
      type: string;
      valeur: number;
      montant_initial: number;
      montant_final: number;
    };
    repartition?: any;
    // Propriétés pour la vérification de stock
    suffisant?: boolean;
    stock_disponible?: number;
    // Propriétés pour la recherche de plaques
    suggestions?: Array<{
      numero_plaque: string;
      disponible: boolean;
    }>;
    sequence_valide?: boolean;
    sequence_plaques?: string[];
    // Propriété pour la recherche d'assujetti
    assujetti?: AssujettiInfo;
  };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:80/Impot/backend/calls";

// Tags de cache pour invalidation ciblée
const CACHE_TAGS = {
  ASSUJETTI_TELEPHONE: (telephone: string) => `assujetti-tel-${telephone}`,
  STOCK_VERIFICATION: (utilisateurId: number, siteId: number, nombrePlaques: number) => 
    `stock-verification-${utilisateurId}-${siteId}-${nombrePlaques}`,
  NUMEROS_PLAQUES_DISPONIBLES: (utilisateurId: number, siteId: number, quantite: number) => 
    `numeros-plaques-disponibles-${utilisateurId}-${siteId}-${quantite}`,
  SEQUENCE_PLAQUES: (plaqueDebut: string, quantite: number, utilisateurId: number, siteId: number) => 
    `sequence-plaques-${plaqueDebut}-${quantite}-${utilisateurId}-${siteId}`,
  COMMANDES_CLIENT_SIMPLE: 'commandes-client-simple',
};

/**
 * Invalide le cache après une commande réussie
 */
async function invalidateCommandesCache() {
  'use server';
  
  // Invalider les caches liés aux commandes (pour le module des commandes)
  revalidateTag('commandes-list-', "max");
  revalidateTag('commandes-stats-', "max");
  revalidateTag('commandes-export-', "max");
  
  // Invalider les caches de stock
  revalidateTag('stock-verification-', "max");
  
  // Invalider le cache spécifique aux commandes client simple
  revalidateTag(CACHE_TAGS.COMMANDES_CLIENT_SIMPLE, "max");
}

/**
 * Recherche un assujetti par numéro de téléphone (AVEC CACHE - 5 minutes)
 */
export async function rechercherAssujettiParTelephone(
  telephone: string,
  utilisateur: any
): Promise<ClientSimpleResponse> {
  'use cache';
  cacheLife('minutes');
  cacheTag(CACHE_TAGS.ASSUJETTI_TELEPHONE(telephone));

  try {
    const formData = new FormData();
    formData.append("telephone", telephone);
    formData.append("utilisateur_id", utilisateur.id.toString());
    formData.append("site_id", utilisateur.site_id?.toString() || "1");

    const response = await fetch(
      `${API_BASE_URL}/client-simple/rechercher_assujetti.php`,
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
        message: data.message || "Échec de la recherche de l'assujetti",
      };
    }

    return data;
  } catch (error) {
    console.error("Rechercher assujetti error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche de l'assujetti",
    };
  }
}

/**
 * Soumet une commande de plaques complète (INVALIDE LE CACHE)
 */
export async function soumettreCommandePlaques(
  impotId: string,
  particulierData: ParticulierData,
  commandeData: CommandeData,
  paiementData: PaiementData,
  utilisateur: any
): Promise<ClientSimpleResponse> {
  try {
    const formData = new FormData();

    // Données de base
    formData.append("impot_id", impotId);
    formData.append("utilisateur_id", utilisateur.id.toString());
    formData.append("site_id", utilisateur.site_id?.toString() || "1");

    // Données du particulier (avec réduction)
    formData.append("nom", particulierData.nom);
    formData.append("prenom", particulierData.prenom);
    formData.append("telephone", particulierData.telephone);
    formData.append("email", particulierData.email || "");
    formData.append("adresse", particulierData.adresse);
    formData.append("nif", particulierData.nif || "");

    // Ajouter la date de mouvement si fournie
    if (particulierData.date_mouvement) {
      formData.append("date_mouvement", particulierData.date_mouvement);
    }

    // Ajouter les données de réduction si présentes
    if (particulierData.reduction_type) {
      formData.append("reduction_type", particulierData.reduction_type);
    }
    if (particulierData.reduction_valeur !== undefined) {
      formData.append(
        "reduction_valeur",
        particulierData.reduction_valeur.toString()
      );
    }

    // Données de la commande
    formData.append("nombre_plaques", commandeData.nombrePlaques.toString());
    if (commandeData.numeroPlaqueDebut) {
      formData.append("numero_plaque_debut", commandeData.numeroPlaqueDebut);
    }

    // Données de paiement
    formData.append("mode_paiement", paiementData.modePaiement);
    formData.append("operateur", paiementData.operateur || "");
    formData.append("numero_transaction", paiementData.numeroTransaction || "");
    formData.append("numero_cheque", paiementData.numeroCheque || "");
    formData.append("banque", paiementData.banque || "");
    formData.append("montant_unitaire", utilisateur.formule || "32");

    const response = await fetch(
      `${API_BASE_URL}/client-simple/soumettre_commande.php`,
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
        message: data.message || "Échec de la soumission de la commande",
      };
    }

    // ⚡ Invalider les caches après une commande réussie
    if (data.status === "success") {
      await invalidateCommandesCache();
    }

    return data;
  } catch (error) {
    console.error("Soumettre commande error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la soumission de la commande",
    };
  }
}

/**
 * Vérifie le stock disponible selon la province de l'utilisateur (AVEC CACHE - 5 minutes)
 */
export async function verifierStockDisponible(
  nombrePlaques: number,
  utilisateur: any
): Promise<ClientSimpleResponse> {
  'use cache';
  cacheLife('minutes');
  cacheTag(CACHE_TAGS.STOCK_VERIFICATION(utilisateur.id, utilisateur.site_id || 1, nombrePlaques));

  try {
    const formData = new FormData();
    formData.append("nombre_plaques", nombrePlaques.toString());
    formData.append("utilisateur_id", utilisateur.id.toString());
    formData.append("site_id", utilisateur.site_id?.toString() || "1");

    const response = await fetch(
      `${API_BASE_URL}/client-simple/verifier_stock.php`,
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
        message: data.message || "Échec de la vérification du stock",
      };
    }

    return data;
  } catch (error) {
    console.error("Verifier stock error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification du stock",
    };
  }
}

/**
 * Recherche des plaques disponibles avec autocomplétion (SANS CACHE - temps réel)
 * NE PAS METTRE EN CACHE pour avoir des résultats en temps réel
 */
export async function rechercherPlaquesDisponibles(
  recherche: string,
  utilisateur: any
): Promise<ClientSimpleResponse> {
  // Note: PAS de 'use cache' ici pour avoir des résultats frais
  try {
    const formData = new FormData();
    formData.append("recherche", recherche);
    formData.append("utilisateur_id", utilisateur.id.toString());
    formData.append("site_id", utilisateur.site_id?.toString() || "1");

    const response = await fetch(
      `${API_BASE_URL}/client-simple/rechercher_plaques.php`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
        // Pas de cache pour les recherches en temps réel
        cache: 'no-store'
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la recherche des plaques",
      };
    }

    return data;
  } catch (error) {
    console.error("Rechercher plaques error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la recherche des plaques",
    };
  }
}

/**
 * Vérifie si une séquence de plaques est disponible (AVEC CACHE - 5 minutes)
 */
export async function verifierSequencePlaques(
  plaqueDebut: string,
  quantite: number,
  utilisateur: any
): Promise<ClientSimpleResponse> {
  'use cache';
  cacheLife('minutes');
  cacheTag(CACHE_TAGS.SEQUENCE_PLAQUES(plaqueDebut, quantite, utilisateur.id, utilisateur.site_id || 1));

  try {
    const formData = new FormData();
    formData.append("plaque_debut", plaqueDebut);
    formData.append("quantite", quantite.toString());
    formData.append("utilisateur_id", utilisateur.id.toString());
    formData.append("site_id", utilisateur.site_id?.toString() || "1");

    const response = await fetch(
      `${API_BASE_URL}/client-simple/verifier_sequence.php`,
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
        message: data.message || "Échec de la vérification de la séquence",
      };
    }

    return data;
  } catch (error) {
    console.error("Verifier sequence error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification de la séquence",
    };
  }
}

/**
 * Récupère les numéros de plaques disponibles selon la province de l'utilisateur (AVEC CACHE - 5 minutes)
 */
export async function getNumerosPlaquesDisponibles(
  quantite: number,
  utilisateur: any
): Promise<ClientSimpleResponse> {
  'use cache';
  cacheLife('minutes');
  cacheTag(CACHE_TAGS.NUMEROS_PLAQUES_DISPONIBLES(utilisateur.id, utilisateur.site_id || 1, quantite));

  try {
    const formData = new FormData();
    formData.append("quantite", quantite.toString());
    formData.append("utilisateur_id", utilisateur.id.toString());
    formData.append("site_id", utilisateur.site_id?.toString() || "1");

    const response = await fetch(
      `${API_BASE_URL}/client-simple/get_numeros_plaques.php`,
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
          data.message || "Échec de la récupération des numéros de plaques",
      };
    }

    return data;
  } catch (error) {
    console.error("Get numeros plaques error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la récupération des numéros de plaques",
    };
  }
}

/**
 * Invalide le cache spécifique après une annulation de commande
 */
export async function invalidateClientSimpleCache(paiementId?: number) {
  'use server';
  
  // Invalider le cache des commandes client simple
  revalidateTag(CACHE_TAGS.COMMANDES_CLIENT_SIMPLE, "max");
  
  // Invalider les caches de stock
  revalidateTag('stock-verification-', "max");
  
  if (paiementId) {
    // Invalider les caches spécifiques si nécessaire
    revalidateTag(`commande-details-${paiementId}`, "max");
  }
}

/**
 * Annule une commande de plaques client simple (INVALIDE LE CACHE)
 */
export async function annulerCommandeClientSimple(
  paiementId: number,
  utilisateurId: number,
  raison: string = "Annulation via interface admin"
): Promise<ClientSimpleResponse> {
  try {
    const formData = new FormData();
    formData.append("paiement_id", paiementId.toString());
    formData.append("utilisateur_id", utilisateurId.toString());
    formData.append("raison_annulation", raison);

    const response = await fetch(
      `${API_BASE_URL}/client-simple/annuler_commande.php`,
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
        message: data.message || "Échec de l'annulation de la commande",
      };
    }

    // ⚡ Invalider les caches après annulation
    if (data.status === "success") {
      await invalidateClientSimpleCache(paiementId);
    }

    return data;
  } catch (error) {
    console.error("Annuler commande client simple error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de l'annulation de la commande",
    };
  }
}