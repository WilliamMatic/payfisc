/**
 * Service pour la gestion de l'immatriculation des plaques
 */

export interface ParticulierData {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  adresse: string;
}

export interface EnginData {
  typeEngin: string;
  marque: string;
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
  modePaiement: 'mobile_money' | 'cheque' | 'banque' | 'espece';
  operateur?: string;
  numeroTransaction?: string;
  numeroCheque?: string;
  banque?: string;
  serie_item_id?: number | null; // Accepter null
}

export interface ImmatriculationResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    numeroPlaque: string;
    serie_item_id?: number;
    particulier: any;
    engin: any;
    paiement: any;
    facture?: any;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls';

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
    formData.append('impot_id', impotId);
    formData.append('utilisateur_id', utilisateur.id.toString());
    formData.append('site_id', utilisateur.site_id?.toString() || '1');
    
    // Données du particulier
    formData.append('nom', particulierData.nom);
    formData.append('prenom', particulierData.prenom);
    formData.append('telephone', particulierData.telephone);
    formData.append('email', particulierData.email || '');
    formData.append('adresse', particulierData.adresse);
    
    // Données de l'engin
    formData.append('type_engin', enginData.typeEngin);
    formData.append('marque', enginData.marque);
    formData.append('energie', enginData.energie);
    formData.append('annee_fabrication', enginData.anneeFabrication);
    formData.append('annee_circulation', enginData.anneeCirculation);
    formData.append('couleur', enginData.couleur);
    formData.append('puissance_fiscal', enginData.puissanceFiscal);
    formData.append('usage', enginData.usage);
    formData.append('numero_chassis', enginData.numeroChassis);
    formData.append('numero_moteur', enginData.numeroMoteur);
    
    // Données de paiement
    formData.append('mode_paiement', paiementData.modePaiement);
    formData.append('operateur', paiementData.operateur || '');
    formData.append('numero_transaction', paiementData.numeroTransaction || '');
    formData.append('numero_cheque', paiementData.numeroCheque || '');
    formData.append('banque', paiementData.banque || '');
    formData.append('montant', utilisateur.formule || '32');
    
    // Inclure le serie_item_id pour marquer la plaque comme utilisée
    if (paiementData.serie_item_id) {
      formData.append('serie_item_id', paiementData.serie_item_id.toString());
    }

    const response = await fetch(`${API_BASE_URL}/immatriculation/soumettre_immatriculation.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la soumission de l\'immatriculation',
      };
    }

    return data;
  } catch (error) {
    console.error('Soumettre immatriculation error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la soumission de l\'immatriculation',
    };
  }
};

/**
 * Récupère un numéro de plaque disponible (SANS changer le statut) selon la province de l'utilisateur
 */
export const getNumeroPlaqueDisponible = async (utilisateur: any): Promise<ImmatriculationResponse> => {
  try {
    const formData = new FormData();
    formData.append('utilisateur_id', utilisateur.id.toString());
    formData.append('site_id', utilisateur.site_id?.toString() || '1');

    const response = await fetch(`${API_BASE_URL}/immatriculation/get_numero_plaque.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la récupération du numéro de plaque',
      };
    }

    return data;
  } catch (error) {
    console.error('Get numero plaque error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération du numéro de plaque',
    };
  }
};

/**
 * Vérifie la disponibilité d'un numéro de chassis
 */
export const verifierNumeroChassis = async (numeroChassis: string): Promise<ImmatriculationResponse> => {
  try {
    const formData = new FormData();
    formData.append('numero_chassis', numeroChassis);

    const response = await fetch(`${API_BASE_URL}/immatriculation/verifier_chassis.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la vérification du numéro de chassis',
      };
    }

    return data;
  } catch (error) {
    console.error('Verifier chassis error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification du numéro de chassis',
    };
  }
};