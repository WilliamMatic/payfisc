// services/ia/iaFiscaleService.ts
import { analyzeTaxDataWithGemini, askGemini, ApiResponse } from './geminiService';

export interface DonneesFiscales {
  series: any[];
  particuliers: any[];
  paiements: any[];
  beneficiaires: any[];
  impots: any[];
  metadata: {
    timestamp: string;
    total_particuliers: number;
    total_engins: number;
    total_paiements: number;
  };
}

export interface RechercheResultat {
  status: 'success' | 'error';
  data?: any;
  termes_recherche?: string;
  message?: string;
}

export interface MessageIA {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  donneesContexte?: any;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls';

/**
 * Récupère toutes les données fiscales pour l'IA
 */
export const getDonneesFiscalesCompletes = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ia-fiscale/get_donnees_fiscales.php`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la récupération des données fiscales',
      };
    }

    return data;
  } catch (error) {
    console.error('Get donnees fiscales error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la récupération des données fiscales',
    };
  }
};

/**
 * Recherche des données spécifiques pour une question
 */
export const rechercherDonneesPourQuestion = async (question: string): Promise<RechercheResultat> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ia-fiscale/rechercher_donnees.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        message: data.message || 'Échec de la recherche',
      };
    }

    return data;
  } catch (error) {
    console.error('Rechercher donnees error:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la recherche',
    };
  }
};

/**
 * Pose une question à l'IA fiscale avec contexte des données
 */
export const poserQuestionIAFiscale = async (
  question: string,
  donneesContexte?: any
): Promise<ApiResponse> => {
  try {
    // Si pas de données de contexte fournies, on les récupère
    let donneesFiscales = donneesContexte;
    if (!donneesFiscales) {
      const donneesResult = await getDonneesFiscalesCompletes();
      if (donneesResult.status === 'success') {
        donneesFiscales = donneesResult.data;
      }
    }

    // Recherche de données spécifiques pour la question
    const rechercheResult = await rechercherDonneesPourQuestion(question);
    
    // Construction du prompt contextuel pour l'IA
    const promptContextuel = construirePromptContextuel(question, donneesFiscales, rechercheResult);

    // Appel à Gemini avec le contexte
    const resultatIA = await analyzeTaxDataWithGemini(promptContextuel, {
      donnees_fiscales: donneesFiscales,
      recherche_specifique: rechercheResult,
      question_utilisateur: question
    });

    return resultatIA;
  } catch (error) {
    console.error('Poser question IA fiscale error:', error);
    return {
      status: 'error',
      message: 'Erreur lors du traitement par l\'IA fiscale',
    };
  }
};

/**
 * Construit un prompt contextuel pour l'IA
 */
const construirePromptContextuel = (
  question: string,
  donneesFiscales: DonneesFiscales,
  rechercheResult: RechercheResultat
): string => {
  let contexte = `Vous êtes un expert fiscal assistant pour un système de gestion des immatriculations de véhicules.

CONTEXTE DU SYSTÈME:
- Gestion des séries de plaques d'immatriculation
- Suivi des particuliers et de leurs véhicules
- Traitement des paiements et répartitions
- Gestion des bénéficiaires des paiements

DONNÉES DISPONIBLES:
`;

  // Ajout des statistiques générales
  if (donneesFiscales?.metadata) {
    contexte += `
Statistiques générales:
- ${donneesFiscales.metadata.total_particuliers} particuliers enregistrés
- ${donneesFiscales.metadata.total_engins} véhicules immatriculés
- ${donneesFiscales.metadata.total_paiements} paiements traités
- Dernière mise à jour: ${donneesFiscales.metadata.timestamp}
`;
  }

  // Ajout des données de recherche spécifiques si disponibles
  if (rechercheResult.status === 'success' && rechercheResult.data) {
    contexte += '\nDONNÉS SPÉCIFIQUES PERTINENTES:\n';
    
    if (rechercheResult.data.par_nif && rechercheResult.data.par_nif.length > 0) {
      contexte += `- Données trouvées par NIF: ${JSON.stringify(rechercheResult.data.par_nif, null, 2)}\n`;
    }
    
    if (rechercheResult.data.par_plaque && rechercheResult.data.par_plaque.length > 0) {
      contexte += `- Données trouvées par plaque: ${JSON.stringify(rechercheResult.data.par_plaque, null, 2)}\n`;
    }
    
    if (rechercheResult.data.par_nom && rechercheResult.data.par_nom.length > 0) {
      contexte += `- Données trouvées par nom: ${JSON.stringify(rechercheResult.data.par_nom, null, 2)}\n`;
    }
  }

  contexte += `

QUESTION DE L'UTILISATEUR: ${question}

INSTRUCTIONS POUR VOTRE RÉPONSE:
1. Soyez précis et technique dans vos réponses fiscales
2. Référez-vous aux données disponibles quand c'est pertinent
3. Si les données sont insuffisantes, demandez des précisions
4. Structurez votre réponse de manière claire
5. Utilisez des termes fiscaux appropriés
6. Si c'est une question sur un particulier spécifique, utilisez les données trouvées
7. Pour les questions statistiques, utilisez les métadonnées disponibles

RÉPONSE (en français, soyez concis mais complet):`;

  return contexte;
};

/**
 * Génère une analyse fiscale complète
 */
export const genererAnalyseFiscale = async (): Promise<ApiResponse> => {
  try {
    const donneesResult = await getDonneesFiscalesCompletes();
    
    if (donneesResult.status === 'error') {
      return donneesResult;
    }

    const promptAnalyse = `
En tant qu'expert fiscal senior, analysez les données suivantes du système d'immatriculation et fournissez une analyse complète:

DONNÉES DU SYSTÈME:
${JSON.stringify(donneesResult.data, null, 2)}

Veuillez fournir une analyse incluant:
1. Aperçu général de l'activité
2. Points forts et points d'amélioration
3. Recommandations pour l'optimisation fiscale
4. Alertes sur d'éventuels problèmes
5. Perspectives d'évolution

Structurez votre réponse de manière professionnelle.
`;

    return await askGemini(promptAnalyse);
  } catch (error) {
    console.error('Generer analyse fiscale error:', error);
    return {
      status: 'error',
      message: 'Erreur lors de la génération de l\'analyse fiscale',
    };
  }
};

/**
 * Vérifie la conformité fiscale d'un particulier
 */
export const verifierConformiteFiscale = async (nif: string): Promise<ApiResponse> => {
  try {
    const donneesResult = await getDonneesFiscalesCompletes();
    
    if (donneesResult.status === 'error') {
      return donneesResult;
    }

    // Trouver le particulier par NIF
    const particulier = donneesResult.data.particuliers.find((p: any) => p.nif === nif);
    
    if (!particulier) {
      return {
        status: 'error',
        message: 'Aucun particulier trouvé avec ce NIF',
      };
    }

    const promptConformite = `
Analysez la conformité fiscale de ce particulier:

DONNÉES DU PARTICULIER:
${JSON.stringify(particulier, null, 2)}

Vérifiez:
1. Complétude des informations
2. Cohérence des données
3. Conformité réglementaire
4. Points d'attention
5. Recommandations spécifiques

Fournissez une analyse détaillée de la conformité.
`;

    return await askGemini(promptConformite);
  } catch (error) {
    console.error('Verifier conformite fiscale error:', error);
    return {
      status: 'error',
      message: 'Erreur lors de la vérification de conformité',
    };
  }
};

export default {
  getDonneesFiscalesCompletes,
  rechercherDonneesPourQuestion,
  poserQuestionIAFiscale,
  genererAnalyseFiscale,
  verifierConformiteFiscale,
};