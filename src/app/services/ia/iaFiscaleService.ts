// services/ia/iaFiscaleService.ts
import { analyzeTaxDataWithGemini, askGemini, ApiResponse } from './geminiService';

export interface DonneesFiscales {
  series: any[];
  particuliers: any[];
  paiements: any[];
  beneficiaires: any[];
  impots: any[];
  sites: {
    sites: any[];
    provinces: any[];
  };
  audits: any[];
  metadata: {
    timestamp: string;
    total_particuliers: number;
    total_engins: number;
    total_paiements: number;
    total_sites: number;
    total_provinces: number;
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
 * Construit un prompt contextuel pour l'IA avec toutes les données
 */
const construirePromptContextuel = (
  question: string,
  donneesFiscales: DonneesFiscales,
  rechercheResult: RechercheResultat
): string => {
  let contexte = `Vous êtes un expert fiscal assistant pour un système de gestion des immatriculations de véhicules.

CONTEXTE DU SYSTÈME:
- Gestion des séries de plaques d'immatriculation par province
- Suivi des particuliers et de leurs véhicules avec localisation
- Traitement des paiements et répartitions par site
- Gestion des bénéficiaires des paiements
- Suivi des sites d'enregistrement et des provinces
- Audit complet des activités du système

DONNÉES DISPONIBLES:
`;

  // Ajout des statistiques générales
  if (donneesFiscales?.metadata) {
    contexte += `
Statistiques générales:
- ${donneesFiscales.metadata.total_particuliers} particuliers enregistrés
- ${donneesFiscales.metadata.total_engins} véhicules immatriculés
- ${donneesFiscales.metadata.total_paiements} paiements traités
- ${donneesFiscales.metadata.total_sites} sites d'enregistrement
- ${donneesFiscales.metadata.total_provinces} provinces couvertes
- Dernière mise à jour: ${donneesFiscales.metadata.timestamp}
`;
  }

  // Ajout des informations sur les sites et provinces
  if (donneesFiscales?.sites) {
    contexte += '\nSITES ET PROVINCES:\n';
    
    if (donneesFiscales.sites.provinces && donneesFiscales.sites.provinces.length > 0) {
      contexte += `- Provinces: ${donneesFiscales.sites.provinces.map((p: any) => `${p.nom} (${p.code})`).join(', ')}\n`;
    }
    
    if (donneesFiscales.sites.sites && donneesFiscales.sites.sites.length > 0) {
      contexte += `- Sites d'enregistrement: ${donneesFiscales.sites.sites.map((s: any) => `${s.nom} (${s.code})`).join(', ')}\n`;
    }
  }

  // Ajout des données de recherche spécifiques si disponibles
  if (rechercheResult.status === 'success' && rechercheResult.data) {
    contexte += '\nDONNÉES SPÉCIFIQUES PERTINENTES:\n';
    
    if (rechercheResult.data.par_nif && rechercheResult.data.par_nif.length > 0) {
      const particulier = rechercheResult.data.par_nif[0];
      contexte += `- Données trouvées par NIF: ${particulier.nom} ${particulier.prenom} (${particulier.nif})\n`;
      contexte += `  Localité: ${particulier.ville}, ${particulier.province}\n`;
      contexte += `  Site: ${particulier.site_nom || 'Non spécifié'}\n`;
      contexte += `  Nombre d'engins: ${particulier.nombre_engins || 0}\n`;
    }
    
    if (rechercheResult.data.par_plaque && rechercheResult.data.par_plaque.length > 0) {
      const engin = rechercheResult.data.par_plaque[0];
      contexte += `- Données trouvées par plaque: ${engin.numero_plaque}\n`;
      contexte += `  Propriétaire: ${engin.nom} ${engin.prenom}\n`;
      contexte += `  Site d'immatriculation: ${engin.engin_site_nom || 'Non spécifié'}\n`;
      contexte += `  Type: ${engin.type_engin || 'Non spécifié'}\n`;
    }
    
    if (rechercheResult.data.par_nom && rechercheResult.data.par_nom.length > 0) {
      const particulier = rechercheResult.data.par_nom[0];
      contexte += `- Données trouvées par nom: ${particulier.nom} ${particulier.prenom}\n`;
      contexte += `  Localité: ${particulier.ville}, ${particulier.province}\n`;
      contexte += `  Engins: ${particulier.nombre_engins || 0} véhicule(s)\n`;
    }

    if (rechercheResult.data.par_localite && rechercheResult.data.par_localite.length > 0) {
      contexte += `- Données trouvées par localité: ${rechercheResult.data.par_localite.length} particulier(s) trouvé(s)\n`;
    }

    if (rechercheResult.data.par_type_engin && rechercheResult.data.par_type_engin.length > 0) {
      contexte += `- Données trouvées par type d'engin: ${rechercheResult.data.par_type_engin.length} engin(s) trouvé(s)\n`;
    }
  }

  // Ajout des informations sur les audits récents
  if (donneesFiscales?.audits && donneesFiscales.audits.length > 0) {
    contexte += '\nAUDITS RÉCENTS (activités du système):\n';
    const auditsRecents = donneesFiscales.audits.slice(0, 5); // 5 derniers audits
    auditsRecents.forEach((audit: any) => {
      contexte += `- [${audit.timestamp}] ${audit.action}\n`;
    });
  }

  contexte += `

QUESTION DE L'UTILISATEUR: ${question}

INSTRUCTIONS POUR VOTRE RÉPONSE:
1. Soyez précis et technique dans vos réponses fiscales
2. Référez-vous aux données disponibles quand c'est pertinent
3. Si les données sont insuffisantes, demandez des précisions
4. Structurez votre réponse de manière claire
5. Utilisez des termes fiscaux appropriés
6. Pour les questions de localisation, utilisez les données de sites et provinces
7. Pour les questions sur les engins, précisez le type et le site d'immatriculation
8. Pour les questions temporelles, utilisez les dates de création et modification
9. Mentionnez les audits récents si pertinents pour la question

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
1. Aperçu général de l'activité par province et site
2. Répartition géographique des immatriculations
3. Analyse des types d'engins par localité
4. Performance des sites d'enregistrement
5. Points forts et points d'amélioration
6. Recommandations pour l'optimisation fiscale
7. Alertes sur d'éventuels problèmes
8. Perspectives d'évolution basées sur les audits

Structurez votre réponse de manière professionnelle avec des sections claires.
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

    // Recherche du particulier par NIF
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
1. Complétude des informations personnelles et de localisation
2. Cohérence des données avec le site d'enregistrement
3. Conformité réglementaire des engins immatriculés
4. Historique des paiements et répartitions
5. Points d'attention sur les dates de modification
6. Recommandations spécifiques par rapport à la localité

Fournissez une analyse détaillée de la conformité incluant les aspects géographiques et temporels.
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