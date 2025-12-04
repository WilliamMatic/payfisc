/**
 * Service pour la gestion de l'immatriculation des plaques
 */

export interface ParticulierData {
  nom: string;
  prenom: string;
  telephone?: string; // Changé de string à string? (optionnel)
  email?: string;
  adresse: string;
  nif?: string;
  reduction_type?: 'pourcentage' | 'montant_fixe';
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

// Interface pour la réponse de vérification de particulier
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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:80/SOCOFIAPP/Impot/backend/calls";

/**
 * Vérifie si un particulier existe par son numéro de téléphone
 */
export const verifierParticulierParTelephone = async (
  telephone?: string // Changé pour accepter undefined
): Promise<VerifierParticulierResponse> => {
  try {
    // Si le téléphone est vide, null, undefined ou juste un tiret, on ne procède pas à la vérification
    if (!telephone || telephone.trim() === '' || telephone.trim() === '-') {
      return {
        status: "success",
        message: "Téléphone non renseigné ou invalide, vérification ignorée",
        data: null
      };
    }

    const formData = new FormData();
    formData.append("telephone", telephone);

    const response = await fetch(
      `${API_BASE_URL}/immatriculation/verifier_particulier.php`,
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
        message: data.message || "Échec de la vérification du particulier",
        data: null
      };
    }

    return data;
  } catch (error) {
    console.error("Verifier particulier error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la vérification du particulier",
      data: null
    };
  }
};

/**
 * Recherche des modèles par marque et terme
 */
export const rechercherModeles = async (
  marqueId: number,
  searchTerm: string
): Promise<ImmatriculationResponse> => {
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
      }
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
};

/**
 * Recherche des puissances fiscales par terme
 */
export const rechercherPuissances = async (
  typeEngin: string,
  searchTerm: string
): Promise<ImmatriculationResponse> => {
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
      }
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
};

/**
 * Soumet une demande d'immatriculation complète
 */
export const soumettreImmatriculation = async (
  impotId: string,
  particulierData: ParticulierData,
  enginData: EnginData,
  paiementData: PaiementData,
  utilisateur: any
): Promise<ImmatriculationResponse> => {
  try {
    const formData = new FormData();

    // Données de base
    formData.append("impot_id", impotId);
    formData.append("utilisateur_id", utilisateur.id.toString());
    formData.append("site_id", utilisateur.site_id?.toString() || "1");

    // Données du particulier (téléphone peut être vide ou "-")
    formData.append("nom", particulierData.nom);
    formData.append("prenom", particulierData.prenom);
    formData.append("telephone", particulierData.telephone || "-"); // Utiliser "-" si vide
    formData.append("email", particulierData.email || "");
    formData.append("adresse", particulierData.adresse);
    formData.append("nif", particulierData.nif || "");
    
    // Données de réduction
    if (particulierData.reduction_type && particulierData.reduction_valeur) {
      formData.append("reduction_type", particulierData.reduction_type);
      formData.append("reduction_valeur", particulierData.reduction_valeur.toString());
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
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "Échec de la soumission de l'immatriculation",
      };
    }

    return data;
  } catch (error) {
    console.error("Soumettre immatriculation error:", error);
    return {
      status: "error",
      message: "Erreur réseau lors de la soumission de l'immatriculation",
    };
  }
};

/**
 * Récupère un numéro de plaque disponible (SANS changer le statut) selon la province de l'utilisateur
 */
export const getNumeroPlaqueDisponible = async (
  utilisateur: any
): Promise<ImmatriculationResponse> => {
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
      }
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
};

/**
 * Vérifie la disponibilité d'un numéro de chassis
 */
export const verifierNumeroChassis = async (
  numeroChassis: string
): Promise<ImmatriculationResponse> => {
  try {
    const formData = new FormData();
    formData.append("numero_chassis", numeroChassis);

    const response = await fetch(
      `${API_BASE_URL}/immatriculation/verifier_chassis.php`,
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
};