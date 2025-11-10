/**
 * Service pour la gestion des commandes de plaques pour clients spéciaux
 */

export interface ParticulierData {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  adresse: string;
}

export interface CommandeData {
  nombrePlaques: number;
  numeroPlaqueDebut?: string;
}

export interface PaiementData {
  modePaiement: 'mobile_money' | 'cheque' | 'banque' | 'espece';
  operateur?: string;
  numeroTransaction?: string;
  numeroCheque?: string;
  banque?: string;
}

export interface ClientSimpleResponse {
  status: 'success' | 'error';
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
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/Impot/backend/calls';

/**
 * Soumet une commande de plaques complète
 */
export const soumettreCommandePlaques = async (
  impotId: string,
  particulierData: ParticulierData,
  commandeData: CommandeData,
  paiementData: PaiementData,
  utilisateur: any
): Promise<ClientSimpleResponse> => {
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
    
    // Données de la commande
    formData.append('nombre_plaques', commandeData.nombrePlaques.toString());
    if (commandeData.numeroPlaqueDebut) {
      formData.append('numero_plaque_debut', commandeData.numeroPlaqueDebut);
    }
    
    // Données de paiement
    formData.append('mode_paiement', paiementData.modePaiement);
    formData.append('operateur', paiementData.operateur || '');
    formData.append('numero_transaction', paiementData.numeroTransaction || '');
    formData.append('numero_cheque', paiementData.numeroCheque || '');
    formData.append('banque', paiementData.banque || '');
    formData.append('montant_unitaire', utilisateur.formule || '32');

    const response = await fetch(`${API_BASE_URL}/client-simple/soumettre_commande.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la soumission de la commande',
      };
    }

    return data;
  } catch (error) {
    console.error('Soumettre commande error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la soumission de la commande',
    };
  }
};

/**
 * Vérifie le stock disponible selon la province de l'utilisateur
 */
export const verifierStockDisponible = async (nombrePlaques: number, utilisateur: any): Promise<ClientSimpleResponse> => {
  try {
    const formData = new FormData();
    formData.append('nombre_plaques', nombrePlaques.toString());
    formData.append('utilisateur_id', utilisateur.id.toString());
    formData.append('site_id', utilisateur.site_id?.toString() || '1');

    const response = await fetch(`${API_BASE_URL}/client-simple/verifier_stock.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la vérification du stock',
      };
    }

    return data;
  } catch (error) {
    console.error('Verifier stock error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification du stock',
    };
  }
};

/**
 * Recherche des plaques disponibles avec autocomplétion
 */
export const rechercherPlaquesDisponibles = async (recherche: string, utilisateur: any): Promise<ClientSimpleResponse> => {
  try {
    const formData = new FormData();
    formData.append('recherche', recherche);
    formData.append('utilisateur_id', utilisateur.id.toString());
    formData.append('site_id', utilisateur.site_id?.toString() || '1');

    const response = await fetch(`${API_BASE_URL}/client-simple/rechercher_plaques.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la recherche des plaques',
      };
    }

    return data;
  } catch (error) {
    console.error('Rechercher plaques error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche des plaques',
    };
  }
};

/**
 * Vérifie si une séquence de plaques est disponible
 */
export const verifierSequencePlaques = async (plaqueDebut: string, quantite: number, utilisateur: any): Promise<ClientSimpleResponse> => {
  try {
    const formData = new FormData();
    formData.append('plaque_debut', plaqueDebut);
    formData.append('quantite', quantite.toString());
    formData.append('utilisateur_id', utilisateur.id.toString());
    formData.append('site_id', utilisateur.site_id?.toString() || '1');

    const response = await fetch(`${API_BASE_URL}/client-simple/verifier_sequence.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la vérification de la séquence',
      };
    }

    return data;
  } catch (error) {
    console.error('Verifier sequence error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification de la séquence',
    };
  }
};

/**
 * Récupère les numéros de plaques disponibles selon la province de l'utilisateur
 */
export const getNumerosPlaquesDisponibles = async (quantite: number, utilisateur: any): Promise<ClientSimpleResponse> => {
  try {
    const formData = new FormData();
    formData.append('quantite', quantite.toString());
    formData.append('utilisateur_id', utilisateur.id.toString());
    formData.append('site_id', utilisateur.site_id?.toString() || '1');

    const response = await fetch(`${API_BASE_URL}/client-simple/get_numeros_plaques.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la récupération des numéros de plaques',
      };
    }

    return data;
  } catch (error) {
    console.error('Get numeros plaques error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des numéros de plaques',
    };
  }
};