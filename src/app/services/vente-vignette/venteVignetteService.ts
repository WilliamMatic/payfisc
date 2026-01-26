/**
 * Service pour la gestion de la vente de vignettes
 */

export interface AssujettiInfo {
  id: number;
  nom_complet: string;
  telephone: string;
  adresse: string;
  nif?: string;
  email?: string;
  particulier_id?: number;
}

export interface EnginInfo {
  id: number;
  engin_id?: number;
  numero_plaque: string;
  marque: string;
  modele: string;
  numero_chassis: string;
  numero_moteur: string;
  couleur: string;
  annee_fabrication: string;
  annee_circulation: string;
  energie: string;
  puissance_fiscal: string;
  usage: string;
  date_enregistrement: string;
  site_enregistrement: string;
  utilisateur_enregistrement: string;
  type_engin: string;
}

export interface PaiementInfo {
  montant: number;
  montant_initial: number;
  mode_paiement: 'mobile_money' | 'cheque' | 'banque' | 'espece';
  operateur?: string;
  numero_transaction?: string;
  numero_cheque?: string;
  banque?: string;
  statut: 'pending' | 'completed' | 'failed';
  taux_cdf: number;
}

export interface TransactionResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    site: {
      nom_site: string;
      fournisseur: string;
    };
    assujetti: AssujettiInfo;
    engin: EnginInfo;
    paiement: PaiementInfo & {
      date_paiement: string;
      transaction_id?: string;
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
}

export interface RecherchePlaqueResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    assujetti: AssujettiInfo;
    engin: EnginInfo;
    source?: 'tsc' | 'haojue' | 'tvs';
  };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost/SOCOFIAPP/Impot/backend/calls';

/**
 * Recherche une plaque dans les bases TSC/HAOJUE/TVS
 */
export const rechercherPlaque = async (
  plaque: string,
  extension?: number | null
): Promise<RecherchePlaqueResponse> => {
  try {
    const formData = new FormData();
    formData.append('plaque', plaque);
    
    // Convertir extension en nombre avec 0 comme valeur par défaut (TSC)
    const extensionNumber = extension || 0;
    formData.append('extension', extensionNumber.toString());

    console.log('Recherche plaque:', { plaque, extension: extensionNumber });

    const response = await fetch(
      `${API_BASE_URL}/refactor/rechercher_plaque.php`,
      {
        method: 'POST',
        credentials: 'include',
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok || data.status === 'error') {
      return {
        status: 'error',
        message: data.message || 'Plaque non trouvée dans les bases de données',
      };
    }

    // Formater les données de la base TSC pour correspondre à nos interfaces
    const donneesExternes = data.data;

    // Déterminer la source
    let source: 'tsc' | 'haojue' | 'tvs' = 'tsc';
    if (extensionNumber === 439727) source = 'haojue';
    if (extensionNumber === 440071) source = 'tvs';

    // Extraire le nom et prénom du nom complet
    const nomComplet = donneesExternes.client?.nom_complet || '';
    const nomParts = nomComplet.split(' ');
    const nom = nomParts[0] || '';
    const prenom = nomParts.slice(1).join(' ') || '';

    const formattedData = {
      assujetti: {
        id: 0, // À récupérer de la base locale si existe
        nom_complet: nomComplet,
        telephone: donneesExternes.client?.telephone || '',
        adresse: donneesExternes.client?.adresse || '',
        nif: '',
        email: '',
        particulier_id: 0,
      },
      engin: {
        id: 0, // À récupérer de la base locale si existe
        engin_id: 0,
        numero_plaque: donneesExternes.plaque?.numero || plaque,
        marque: donneesExternes.vehicule?.marque || '',
        modele: donneesExternes.vehicule?.modele || '',
        numero_chassis: donneesExternes.vehicule?.chassis || '',
        numero_moteur: donneesExternes.vehicule?.moteur || '',
        couleur: donneesExternes.vehicule?.couleur || '',
        annee_fabrication: donneesExternes.vehicule?.annee_fabrication || '',
        annee_circulation: donneesExternes.vehicule?.annee_circulation || '',
        energie: donneesExternes.vehicule?.energie || '',
        puissance_fiscal: donneesExternes.vehicule?.puissance || '',
        usage: donneesExternes.vehicule?.usage_vehicule || '',
        date_enregistrement: donneesExternes.plaque?.date_achat || new Date().toISOString().split('T')[0],
        site_enregistrement: '',
        utilisateur_enregistrement: '',
        type_engin: donneesExternes.vehicule?.type_auto || '',
      },
      source,
    };

    return {
      status: 'success',
      message: `Données récupérées depuis ${source.toUpperCase()}`,
      data: formattedData,
    };
  } catch (error) {
    console.error('Recherche plaque error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche de plaque',
    };
  }
};

/**
 * Enregistre un paiement de vignette
 */
export const enregistrerPaiementVignette = async (
  paiementData: {
    engin_id: number;
    particulier_id: number;
    montant: number;
    montant_initial: number;
    impot_id: string;
    mode_paiement: 'mobile_money' | 'cheque' | 'banque' | 'espece';
    operateur?: string;
    numero_transaction?: string;
    numero_cheque?: string;
    banque?: string;
    statut?: 'pending' | 'completed' | 'failed';
    utilisateur_id: number;
    site_id: number;
    nombre_plaques?: number;
    taux_cdf: number;
  }
): Promise<TransactionResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/vente-vignette/enregistrer_paiement.php`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paiementData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de l\'enregistrement du paiement',
      };
    }

    return data;
  } catch (error) {
    console.error('Enregistrement paiement error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'enregistrement',
    };
  }
};

/**
 * Vérifie si une plaque a déjà une vignette valide
 */
export const verifierVignetteExistante = async (
  plaque: string
): Promise<{ status: 'success' | 'error'; existe: boolean; message?: string }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/vente-vignette/verifier_vignette.php`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plaque }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        existe: false,
        message: data.message || 'Erreur lors de la vérification',
      };
    }

    return {
      status: 'success',
      existe: data.existe || false,
      message: data.message,
    };
  } catch (error) {
    console.error('Vérification vignette error:', error);
    return {
      status: 'error',
      existe: false,
      message: 'Erreur réseau lors de la vérification',
    };
  }
};