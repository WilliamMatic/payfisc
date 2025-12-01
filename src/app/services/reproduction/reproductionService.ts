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
}

export interface PaiementReproductionData {
  modePaiement: 'mobile_money' | 'cheque' | 'banque' | 'espece';
  operateur?: string;
  numeroTransaction?: string;
  numeroCheque?: string;
  banque?: string;
  codePromo?: string;
}

export interface ReproductionResponse {
  status: 'success' | 'error';
  message?: string;
  data?: any;
}

// URL de base de l'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls/reproduction';

/**
 * Vérifie une plaque et récupère les données associées
 */
export const verifierPlaque = async (numeroPlaque: string): Promise<ReproductionResponse> => {
  try {
    const formData = new FormData();
    formData.append('numero_plaque', numeroPlaque);

    const response = await fetch(`${API_BASE_URL}/reproduction/verifier_plaque.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Plaque non trouvée',
      };
    }

    return data;
  } catch (error) {
    console.error('Verifier plaque error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification de la plaque',
    };
  }
};

/**
 * Traite une demande de reproduction de carte
 */
export const traiterReproduction = async (
  impotId: string,
  numeroPlaque: string,
  paiementData: PaiementReproductionData,
  utilisateur: any
): Promise<ReproductionResponse> => {
  try {
    const formData = new FormData();
    
    // Données de base
    formData.append('impot_id', impotId);
    formData.append('numero_plaque', numeroPlaque);
    formData.append('utilisateur_id', utilisateur.id.toString());
    formData.append('site_id', utilisateur.site_id?.toString() || '1');
    
    // Données de paiement
    formData.append('mode_paiement', paiementData.modePaiement);
    formData.append('operateur', paiementData.operateur || '');
    formData.append('numero_transaction', paiementData.numeroTransaction || '');
    formData.append('numero_cheque', paiementData.numeroCheque || '');
    formData.append('banque', paiementData.banque || '');
    formData.append('code_promo', paiementData.codePromo || '');

    const response = await fetch(`${API_BASE_URL}/reproduction/traiter_reproduction.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec du traitement de la reproduction',
      };
    }

    return data;
  } catch (error) {
    console.error('Traiter reproduction error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du traitement de la reproduction',
    };
  }
};