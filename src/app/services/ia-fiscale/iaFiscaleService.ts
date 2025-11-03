// services/ia-fiscale/iaFiscaleService.ts

/**
 * Service pour les interactions avec l'IA fiscale
 */

export interface IaQuestion {
  question: string;
}

export interface IaReponse {
  status: 'success' | 'error';
  reponse?: string;
  message?: string;
  donnees_utilisees?: {
    statistiques?: boolean;
    series?: boolean;
    immatriculations?: boolean;
    paiements?: boolean;
  };
}

export interface InteractionHistorique {
  question: string;
  reponse: string;
  date_creation: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/SOCOFIAPP/Impot/backend/calls';

/**
 * Pose une question à l'IA fiscale
 */
export const poserQuestionIa = async (question: string): Promise<IaReponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ia-fiscale/consulter_ia.php`, {
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
        message: data.message || 'Erreur lors de la consultation de l\'IA fiscale',
      };
    }

    return data;
  } catch (error) {
    console.error('Erreur consultation IA fiscale:', error);
    return {
      status: 'error',
      message: 'Erreur réseau lors de la consultation de l\'IA fiscale',
    };
  }
};

/**
 * Récupère l'historique des interactions avec l'IA
 */
export const getHistoriqueInteractions = async (limit: number = 10): Promise<InteractionHistorique[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ia-fiscale/historique_interactions.php?limit=${limit}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erreur récupération historique:', data.message);
      return [];
    }

    return data.data || [];
  } catch (error) {
    console.error('Erreur historique interactions:', error);
    return [];
  }
};

/**
 * Suggestions de questions fréquentes
 */
export const getSuggestionsQuestions = (): string[] => {
  return [
    "Combien de plaques sont disponibles actuellement ?",
    "Quelles sont les séries de plaques disponibles ?",
    "Combien d'immatriculations ce mois-ci ?",
    "Quel est le montant total des paiements récents ?",
    "Comment se répartissent les paiements entre bénéficiaires ?",
    "Quels sont les types d'engins les plus immatriculés ?",
    "Combien de nouveaux particuliers cette semaine ?",
    "Quel est le mode de paiement le plus utilisé ?",
    "Afficher les dernières immatriculations effectuées",
    "Quelles séries ont le plus de plaques attribuées ?"
  ];
};

/**
 * Analyse la question pour fournir un contexte enrichi
 */
export const analyserQuestion = (question: string): { type: string; motsCles: string[] } => {
  const motsCles = question.toLowerCase().split(' ').filter(mot => mot.length > 2);
  
  const categories = {
    statistiques: ['combien', 'total', 'nombre', 'statistique', 'montant', 'revenue'],
    plaques: ['plaque', 'série', 'numéro', 'immatriculation', 'disponible'],
    paiements: ['paiement', 'pay', 'transaction', 'montant', 'banque', 'mobile money'],
    particuliers: ['particulier', 'client', 'assujetti', 'personne', 'nouveau'],
    engins: ['engin', 'véhicule', 'voiture', 'moto', 'marque', 'type'],
    beneficiaires: ['bénéficiaire', 'part', 'répartition', 'pourcentage']
  };

  let type = 'general';
  let scoreMax = 0;

  for (const [categorie, mots] of Object.entries(categories)) {
    const score = mots.filter(mot => motsCles.includes(mot)).length;
    if (score > scoreMax) {
      scoreMax = score;
      type = categorie;
    }
  }

  return { type, motsCles };
};