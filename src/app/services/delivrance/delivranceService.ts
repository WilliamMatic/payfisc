// services/delivrance/delivranceService.ts

/**
 * Service pour la gestion de la délivrance plaque + carte
 */

export interface ParticulierData {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  rue: string;
  ville: string;
  code_postal: string;
  province: string;
  nif: string;
  id_national: string;
}

export interface EnginData {
  id: number;
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
}

export interface PaiementData {
  id: number;
  impot_id: string;
  montant: string;
  mode_paiement: string;
  statut: string;
  etat: number;
  date_paiement: string;
}

export interface DelivranceData {
  paiement: PaiementData;
  particulier: ParticulierData;
  engin: EnginData;
}

export interface DelivranceResponse {
  status: 'success' | 'error';
  message?: string;
  data?: DelivranceData;
}

export interface PrintData {
  nom: string;
  prenom: string;
  adresse: string;
  nif: string;
  numero_plaque: string;
  annee_circulation: string;
  marque: string;
  type_engin: string;
  usage_engin: string;
  numero_chassis: string;
  numero_moteur: string;
  annee_fabrication: string;
  couleur: string;
  puissance_fiscal: string;
  energie: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls';

/**
 * Vérifie la délivrance avec référence et numéro de plaque
 */
export const verifierDelivrance = async (
  reference: string,
  numeroPlaque: string
): Promise<DelivranceResponse> => {
  try {
    const formData = new FormData();
    formData.append('reference', reference);
    formData.append('numero_plaque', numeroPlaque);

    const response = await fetch(`${API_BASE_URL}/delivrance/verifier_delivrance.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la vérification',
      };
    }

    return data;
  } catch (error) {
    console.error('Verifier delivrance error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification',
    };
  }
};

/**
 * Marque la délivrance comme complétée
 */
export const completerDelivrance = async (paiementId: number): Promise<DelivranceResponse> => {
  try {
    const formData = new FormData();
    formData.append('paiement_id', paiementId.toString());

    const response = await fetch(`${API_BASE_URL}/delivrance/completer_delivrance.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la complétion',
      };
    }

    return data;
  } catch (error) {
    console.error('Completer delivrance error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la complétion',
    };
  }
};

/**
 * Récupère les données pour l'impression
 */
export const getDonneesImpression = async (paiementId: number): Promise<{status: string; data?: PrintData; message?: string}> => {
  try {
    const formData = new FormData();
    formData.append('paiement_id', paiementId.toString());

    const response = await fetch(`${API_BASE_URL}/delivrance/get_donnees_impression.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la récupération des données',
      };
    }

    return data;
  } catch (error) {
    console.error('Get donnees impression error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des données',
    };
  }
};