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

// Extensions des bases externes
const BASES_EXTERNES: { extension: number; nom: 'tsc' | 'haojue' | 'tvs' }[] = [
  { extension: 0, nom: 'tsc' },
  { extension: 439727, nom: 'haojue' },
  { extension: 440071, nom: 'tvs' },
];

/**
 * 1. Vérifie la plaque dans la base locale (verifier_dgrk.php)
 */
export const verifierDGRK = async (
  plaque: string,
  siteCode: string,
  extension?: number | null
): Promise<RecherchePlaqueResponse> => {
  try {
    const formData = new FormData();
    formData.append('id_dgrk', plaque);
    formData.append('site_code', siteCode);
    formData.append('extension', (extension || 0).toString());

    const response = await fetch(`${API_BASE_URL}/refactor/verifier_dgrk.php`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Réponse non-JSON de verifier_dgrk:', text.substring(0, 200));
      return { status: 'error' as const, message: 'Erreur serveur (réponse invalide)' };
    }

    if (!response.ok || data.status !== 'success' || !data.data) {
      return {
        status: 'error',
        message: data.message || 'Plaque non trouvée localement',
      };
    }

    const d = data.data;
    return {
      status: 'success',
      message: 'Données trouvées localement',
      data: {
        assujetti: {
          id: d.particulier_id || 0,
          nom_complet: [d.nom, d.prenom].filter(Boolean).join(' '),
          telephone: d.telephone || '',
          adresse: d.adresse || '',
          nif: d.nif || '',
          email: d.email || '',
          particulier_id: d.particulier_id || 0,
        },
        engin: {
          id: d.engin_id || 0,
          engin_id: d.engin_id || 0,
          numero_plaque: d.numero_plaque || plaque,
          marque: d.marque || '',
          modele: '',
          numero_chassis: d.numero_chassis || '',
          numero_moteur: d.numero_moteur || '',
          couleur: d.couleur || '',
          annee_fabrication: d.annee_fabrication || '',
          annee_circulation: d.annee_circulation || '',
          energie: d.energie || '',
          puissance_fiscal: d.puissance_fiscal || '',
          usage: d.usage_engin || '',
          date_enregistrement: d.date_paiement || '',
          site_enregistrement: d.site_nom || '',
          utilisateur_enregistrement: d.caissier || '',
          type_engin: d.type_engin || '',
        },
        source: 'tsc',
      },
    };
  } catch (error) {
    console.error('Vérification DGRK error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification locale',
    };
  }
};

/**
 * 2. Recherche une plaque dans une base externe spécifique (TSC/HAOJUE/TVS)
 */
export const rechercherPlaque = async (
  plaque: string,
  extension?: number | null
): Promise<RecherchePlaqueResponse> => {
  try {
    const formData = new FormData();
    formData.append('plaque', plaque);
    
    const extensionNumber = extension || 0;
    formData.append('extension', extensionNumber.toString());

    const response = await fetch(
      `${API_BASE_URL}/refactor/rechercher_plaque.php`,
      {
        method: 'POST',
        credentials: 'include',
        body: formData,
      }
    );

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Réponse non-JSON de rechercher_plaque:', text.substring(0, 200));
      return { status: 'error' as const, message: 'Erreur de connexion à la base externe' };
    }

    if (!response.ok || data.status === 'error') {
      return {
        status: 'error',
        message: data.message || 'Plaque non trouvée',
      };
    }

    const donneesExternes = data.data;

    let source: 'tsc' | 'haojue' | 'tvs' = 'tsc';
    if (extensionNumber === 439727) source = 'haojue';
    if (extensionNumber === 440071) source = 'tvs';

    const nomComplet = donneesExternes.client?.nom_complet || '';

    return {
      status: 'success',
      message: `Données récupérées depuis ${source.toUpperCase()}`,
      data: {
        assujetti: {
          id: 0,
          nom_complet: nomComplet,
          telephone: donneesExternes.client?.telephone || '',
          adresse: donneesExternes.client?.adresse || '',
          nif: '',
          email: '',
          particulier_id: 0,
        },
        engin: {
          id: 0,
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
      },
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
 * 3. Recherche dans TOUTES les bases externes une par une (TSC → HAOJUE → TVS)
 *    Retourne le premier résultat trouvé.
 */
export const rechercherToutesBasesExternes = async (
  plaque: string,
  onProgress?: (nomBase: string) => void
): Promise<RecherchePlaqueResponse> => {
  for (const base of BASES_EXTERNES) {
    onProgress?.(base.nom.toUpperCase());
    const result = await rechercherPlaque(plaque, base.extension);
    if (result.status === 'success' && result.data) {
      return result;
    }
  }
  return {
    status: 'error',
    message: 'Plaque non trouvée dans aucune base de données externe',
  };
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
    numero_vignette: string;
    reference_bancaire?: string;
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
): Promise<{
  status: 'success' | 'error';
  existe: boolean;
  vignette_active?: boolean;
  date_validite?: string;
  code_vignette?: string;
  numero_vignette?: string;
  message?: string;
}> => {
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
      vignette_active: data.vignette_active || false,
      date_validite: data.date_validite,
      code_vignette: data.code_vignette,
      numero_vignette: data.numero_vignette,
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

/**
 * Inscrit un nouvel assujetti et engin pour la vente de vignette
 */
export const inscrireAssujetti = async (
  data: {
    nom_complet: string;
    telephone: string;
    adresse: string;
    nif?: string;
    email?: string;
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
    utilisateur_id: number;
    impot_id?: string;
  }
): Promise<{
  status: 'success' | 'error';
  message?: string;
  data?: {
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
    };
  };
}> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/vente-vignette/inscrire_assujetti.php`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: result.message || 'Erreur lors de l\'inscription',
      };
    }

    return result;
  } catch (error) {
    console.error('Inscription assujetti error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de l\'inscription',
    };
  }
};

/**
 * Vérifie un paiement bancaire par référence + plaque (pour la délivrance)
 */
export const verifierPaiementBancaire = async (
  reference: string,
  plaque: string
): Promise<{
  status: 'success' | 'error' | 'inscription_required';
  message?: string;
  data?: {
    paiement_bancaire?: {
      id: number;
      reference_bancaire: string;
      statut: string;
      id_paiement: number;
    };
    paiement?: {
      id: number;
      engin_id?: number;
      particulier_id?: number;
      montant: number;
      mode_paiement: string;
      statut: string;
      date_paiement: string;
      utilisateur_id: number;
      site_id: number;
      impot_id: number;
    };
    assujetti?: {
      id: number;
      nom_complet: string;
      telephone: string;
      adresse: string;
      nif?: string;
      email?: string;
    };
    engin?: {
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
    site?: {
      nom_site: string;
      code_site: string;
    };
  };
}> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/vente-vignette/verifier_paiement_bancaire.php`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, plaque }),
      }
    );

    const data = await response.json();

    if (data.status === 'inscription_required') {
      return data;
    }

    if (!response.ok || data.status !== 'success') {
      return {
        status: 'error',
        message: data.message || 'Erreur lors de la vérification',
      };
    }

    return data;
  } catch (error) {
    console.error('Vérification paiement bancaire error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification',
    };
  }
};

/**
 * Délivre une vignette après vérification du paiement bancaire
 */
export const delivrerVignetteBancaire = async (
  data: {
    id_paiement: number;
    engin_id: number;
    particulier_id: number;
    utilisateur_id: number;
    utilisateur_name: string;
    site_id: number;
    impot_id?: number;
    type_mouvement?: string;
    duree_mois?: number;
  }
): Promise<{
  status: 'success' | 'error';
  message?: string;
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
}> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/vente-vignette/delivrer_vignette.php`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok || result.status !== 'success') {
      return {
        status: 'error',
        message: result.message || 'Erreur lors de la délivrance',
      };
    }

    return result;
  } catch (error) {
    console.error('Délivrance vignette error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la délivrance',
    };
  }
};

/**
 * Liste les vignettes avec filtres (pour la suppression)
 */
export const listerVignettes = async (
  filtres?: {
    site_id?: number;
    type_mouvement?: string;
    date_debut?: string;
    date_fin?: string;
    recherche?: string;
  }
): Promise<{
  status: 'success' | 'error';
  message?: string;
  data?: {
    vignettes: VignetteListItem[];
    sites: { id: number; nom: string; code: string }[];
  };
}> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/vente-vignette/lister_vignettes.php`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filtres || {}),
      }
    );

    const data = await response.json();

    if (!response.ok || data.status !== 'success') {
      return {
        status: 'error',
        message: data.message || 'Erreur lors du chargement',
      };
    }

    return data;
  } catch (error) {
    console.error('Lister vignettes error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du chargement',
    };
  }
};

export interface VignetteListItem {
  id: number;
  id_paiement: number;
  impot_id: number;
  type_mouvement: 'achat' | 'delivrance' | 'renouvellement';
  duree_mois: number;
  code_vignette: string;
  date_delivrance: string;
  date_validite: string;
  date_creation: string;
  engin_id: number;
  numero_plaque: string;
  marque: string;
  modele: string;
  couleur: string;
  energie: string;
  usage_engin: string;
  puissance_fiscal: string;
  annee_fabrication: string;
  numero_chassis: string;
  numero_moteur: string;
  type_engin: string;
  particulier_id: number;
  nom_complet: string;
  telephone: string;
  adresse: string;
  nif: string;
  email: string;
  montant: number;
  mode_paiement: string;
  date_paiement: string;
  site_nom: string;
  site_code: string;
  utilisateur_delivrance_nom: string;
}

/**
 * Supprime une vignette (soft-delete)
 */
export const supprimerVignette = async (
  id: number,
  motif: string
): Promise<{
  status: 'success' | 'error';
  message?: string;
  data?: {
    id: number;
    code_vignette: string;
    date_suppression: string;
    motif: string;
  };
}> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/vente-vignette/supprimer_vignette.php`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, motif }),
      }
    );

    const data = await response.json();

    if (!response.ok || data.status !== 'success') {
      return {
        status: 'error',
        message: data.message || 'Erreur lors de la suppression',
      };
    }

    return data;
  } catch (error) {
    console.error('Suppression vignette error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la suppression',
    };
  }
};

/**
 * Récupère les vignettes à renouveler
 */
export const getVignettesARenouveler = async (
  filtres?: {
    seuil_jours?: number;
    statut_expiration?: 'expire' | 'proche';
    site_id?: number;
    recherche?: string;
  }
): Promise<{
  status: 'success' | 'error';
  message?: string;
  data?: {
    id: number;
    id_paiement: number;
    impot_id: number;
    type_mouvement: string;
    duree_mois: number;
    code_vignette: string;
    date_delivrance: string;
    date_validite: string;
    jours_restants: number;
    engin_id: number;
    numero_plaque: string;
    marque: string;
    modele: string;
    particulier_id: number;
    nom_complet: string;
    telephone: string;
    montant: number;
    site_nom: string;
  }[];
}> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/vente-vignette/vignettes_a_renouveler.php`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filtres || {}),
      }
    );

    const data = await response.json();

    if (!response.ok || data.status !== 'success') {
      return {
        status: 'error',
        message: data.message || 'Erreur lors du chargement',
      };
    }

    return data;
  } catch (error) {
    console.error('Vignettes à renouveler error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du chargement',
    };
  }
};

/**
 * Renouvelle une vignette
 */
export const renouvelerVignette = async (
  data: {
    vignette_id: number;
    utilisateur_id: number;
    utilisateur_name: string;
    site_id: number;
    impot_id?: number;
    montant?: number;
    duree_mois?: number;
  }
): Promise<{
  status: 'success' | 'error';
  message?: string;
  data?: {
    id: number;
    paiement_id: number;
    code_vignette: string;
    date_validite: string;
    duree_mois: number;
    montant: number;
    ancienne_vignette_id: number;
  };
}> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/vente-vignette/renouveler_vignette.php`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok || result.status !== 'success') {
      return {
        status: 'error',
        message: result.message || 'Erreur lors du renouvellement',
      };
    }

    return result;
  } catch (error) {
    console.error('Renouvellement vignette error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors du renouvellement',
    };
  }
};

/**
 * Vérifie une référence bancaire pour la délivrance groupée
 * Retourne le nombre total, livré, et restant
 */
export const verifierReferenceBancaire = async (
  reference: string,
  impotId?: number
): Promise<{
  status: 'success' | 'error';
  message?: string;
  data?: {
    paiement_bancaire_id: number;
    reference_bancaire: string;
    id_paiement: number;
    statut: string;
    nombre_declarations: number;
    livres: number;
    restant: number;
    impot_id: number | null;
    montant_total: number;
    date_creation: string;
  };
}> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/vente-vignette/verifier_reference.php`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, impot_id: impotId }),
      }
    );

    const data = await response.json();

    if (!response.ok || data.status !== 'success') {
      return {
        status: 'error',
        message: data.message || 'Référence non trouvée',
      };
    }

    return data;
  } catch (error) {
    console.error('Vérification référence bancaire error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la vérification',
    };
  }
};

/**
 * Délivre une vignette dans le cadre d'une délivrance groupée (paiement bancaire)
 */
export const delivrerVignetteGroupee = async (
  data: {
    reference_bancaire: string;
    numero_vignette: string;
    engin_id: number;
    particulier_id: number;
    utilisateur_id: number;
    utilisateur_name: string;
    impot_id?: number | null;
  }
): Promise<{
  status: 'success' | 'error';
  message?: string;
  data?: {
    delivrance: {
      id: number;
      code_vignette: string;
      numero_vignette: string;
      date_delivrance: string;
      date_validite: string;
      utilisateur_delivrance: string;
    };
    compteur: {
      total: number;
      livres: number;
      restant: number;
    };
    engin: {
      numero_plaque: string;
      marque: string;
    };
    assujetti: {
      nom_complet: string;
      telephone: string;
    };
    reference_bancaire: string;
    tout_livre: boolean;
  };
}> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/vente-vignette/delivrer_vignette_groupee.php`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok || result.status !== 'success') {
      return {
        status: 'error',
        message: result.message || 'Erreur lors de la délivrance',
      };
    }

    return result;
  } catch (error) {
    console.error('Délivrance vignette groupée error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la délivrance',
    };
  }
};