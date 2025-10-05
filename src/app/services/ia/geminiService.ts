// services/ia/geminiService.ts

/**
 * Service pour interagir avec Google Gemini via l'API officielle
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export type FieldType =
  | "texte"
  | "nombre"
  | "date"
  | "email"
  | "select"
  | "checkbox";

export interface FormField {
  type: FieldType;
  champ: string; // correspond à ton usage actuel { type: "texte", champ: "Nom..." }
  label?: string; // optionnel — étiquette lisible
  required?: boolean;
  options?: string[]; // pour select
  [key: string]: any; // permet d'accepter d'autres props si nécessaire
}

// Interface pour la réponse standardisée
export interface ApiResponse {
  status: "success" | "error";
  message?: string;
  data?: any;
}

// Récupération de la clé API depuis les variables d'environnement
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error(
    "La clé GEMINI_API_KEY n'est pas définie dans les variables d'environnement"
  );
}

// Initialisation du client Gemini
const ai = new GoogleGenerativeAI(GEMINI_API_KEY);

// Modèle par défaut (modifiable si besoin)
const DEFAULT_MODEL = "gemini-2.0-flash";

/**
 * Envoie une requête à Gemini avec un prompt texte
 */
export const askGemini = async (prompt: string): Promise<ApiResponse> => {
  try {
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

    const res = await model.generateContent(prompt);
    const output = res.response.text();

    return {
      status: "success",
      data: output,
    };
  } catch (error: any) {
    console.error("AskGemini error:", error);

    return {
      status: "error",
      message: error.message || "Erreur lors de la génération avec Gemini",
    };
  }
};

/**
 * Analyse les données fiscales avec Gemini
 */
export const analyzeTaxDataWithGemini = async (
  userQuery: string,
  taxData: any
): Promise<ApiResponse> => {
  try {
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

    // Préparer le prompt avec les données et la question de l'utilisateur
    const prompt = `
      Vous êtes un assistant expert en fiscalité. Analysez les données fiscales suivantes et répondez à la question de l'utilisateur de manière précise et concise.
      
      DONNÉES FISCALES:
      ${JSON.stringify(taxData, null, 2)}
      
      QUESTION DE L'UTILISATEUR: ${userQuery}
      
      RÉPONSE:
    `;

    const res = await model.generateContent(prompt);
    const output = res.response.text();

    return {
      status: "success",
      data: output,
    };
  } catch (error: any) {
    console.error("AnalyzeTaxDataWithGemini error:", error);

    return {
      status: "error",
      message:
        error.message ||
        "Erreur lors de l'analyse des données fiscales avec Gemini",
    };
  }
};

/**
 * Exemple : génération avec options avancées (temperature, maxTokens, etc.)
 */
export const askGeminiAdvanced = async (
  prompt: string,
  options?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  }
): Promise<ApiResponse> => {
  try {
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

    const res = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxOutputTokens ?? 512,
        topP: options?.topP ?? 0.8,
        topK: options?.topK ?? 40,
      },
    });

    const output = res.response.text();

    return {
      status: "success",
      data: output,
    };
  } catch (error: any) {
    console.error("AskGeminiAdvanced error:", error);

    return {
      status: "error",
      message:
        error.message || "Erreur lors de la génération avancée avec Gemini",
    };
  }
};

/**
 * Analyse les données du contribuable et pré-remplit les champs du formulaire
 */
export const preRemplirFormulaireAvecIA = async (
  donneesContribuable: any,
  formulaireStructure: FormField[]
): Promise<ApiResponse> => {
  try {
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

    const prompt = `
      Vous êtes un assistant expert en fiscalité. Analysez les données du contribuable et la structure du formulaire pour pré-remplir automatiquement les champs correspondants.

      DONNÉES DU CONTRIBUABLE:
      ${JSON.stringify(donneesContribuable, null, 2)}

      STRUCTURE DU FORMULAIRE:
      ${JSON.stringify(formulaireStructure, null, 2)}

      INSTRUCTIONS:
      1. Identifiez les champs du formulaire qui correspondent aux informations du contribuable
      2. Pour chaque champ correspondant, suggérez la valeur à pré-remplir
      3. Retournez uniquement un objet JSON avec la structure: { [nom_du_champ]: valeur }
      4. Ne pré-remplissez que les champs où la correspondance est évidente
      5. Respectez le format des champs (texte, nombre, etc.)

      RÉPONSE (uniquement le JSON, sans autre texte):
    `;

    const res = await model.generateContent(prompt);
    const output = res.response.text();

    // Nettoyer la réponse pour extraire uniquement le JSON
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const donneesPreRemplies = JSON.parse(jsonMatch[0]);
      return {
        status: "success",
        data: donneesPreRemplies,
      };
    } else {
      throw new Error("Format de réponse invalide");
    }
  } catch (error: any) {
    console.error("PreRemplirFormulaireAvecIA error:", error);
    return {
      status: "error",
      message: error.message || "Erreur lors du pré-remplissage avec l'IA",
    };
  }
};


/**
 * Calcule le montant de l'impôt en fonction de la formule et des données
 */
export const calculerMontantAvecIA = async (
  formuleCalcul: string,
  donneesFormulaire: any[],
  nombreDeclarations: number = 1
): Promise<ApiResponse> => {
  try {
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

    // Préparer les données de manière structurée
    const donneesStructurees = donneesFormulaire.map((declaration, index) => ({
      declaration: index + 1,
      donnees: declaration,
    }));

    const prompt = `
      Vous êtes un expert-comptable. Calculez le montant total de l'impôt pour ${nombreDeclarations} déclaration(s) en utilisant la formule fournie.

      FORMULE DE CALCUL: ${formuleCalcul}

      DONNÉES DES DÉCLARATIONS:
      ${JSON.stringify(donneesStructurees, null, 2)}

      INSTRUCTIONS TRÈS IMPORTANTES:
      1. Calculez d'abord le montant pour CHAQUE déclaration individuellement en appliquant la formule
      2. Ensuite, SOMMEZ les montants de toutes les déclarations pour obtenir le TOTAL
      3. Retournez UNIQUEMENT le montant total final (nombre uniquement)
      4. Ne retournez pas les calculs intermédiaires
      5. Si certaines données manquent, utilisez des valeurs par défaut raisonnables (0)
      6. Le résultat final doit être en dollars (USD)

      EXEMPLE:
      - Si formule: "base * taux"
      - Déclaration 1: base=1000, taux=0.1 → montant=100
      - Déclaration 2: base=2000, taux=0.1 → montant=200
      - TOTAL = 100 + 200 = 300

      RÉPONSE (uniquement le nombre final, sans devise ni texte):
    `;

    const res = await model.generateContent(prompt);
    const output = res.response.text();

    console.log("Réponse IA brute:", output); // Pour debug

    // Extraire le nombre de la réponse (gère différents formats)
    const montantMatch = output.match(/(\d+[.,]?\d*)/);
    if (montantMatch) {
      // Remplacer la virgule par un point pour le parsing
      const montantString = montantMatch[1].replace(",", ".");
      const montant = parseFloat(montantString);

      if (isNaN(montant)) {
        throw new Error("Le montant calculé n'est pas un nombre valide");
      }

      return {
        status: "success",
        data: montant,
      };
    } else {
      throw new Error("Impossible d'extraire le montant de la réponse de l'IA");
    }
  } catch (error: any) {
    console.error("CalculerMontantAvecIA error:", error);
    return {
      status: "error",
      message: error.message || "Erreur lors du calcul avec l'IA",
    };
  }
};


/**
 * Calcule les pénalités pour une déclaration en retard
 * Chaque délai accordé écoulé déclenche une pénalité
 */
export const calculerPenalitesAvecIA = async (
  dateCreation: string,
  montantInitial: number,
  parametresImpot: any
): Promise<ApiResponse> => {
  try {
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

    // Calcul du nombre de délais accordés écoulés
    const dateCreationObj = new Date(dateCreation);
    const aujourdHui = new Date();
    
    // Calcul de la différence en jours
    const diffTemps = aujourdHui.getTime() - dateCreationObj.getTime();
    const joursEcoules = Math.ceil(diffTemps / (1000 * 3600 * 24));
    const delaiAccorde = parametresImpot.delai_accord || 30;
    
    // Nombre de délais accordés COMPLÈTEMENT écoulés
    const nombreDelaisEcoules = Math.floor(joursEcoules / delaiAccorde);
    
    let montantPenalites = 0;
    let detailsCalcul = `Aucun délai complet écoulé - ${joursEcoules} jours sur ${delaiAccorde} jours accordés`;

    if (nombreDelaisEcoules > 0) {
      const penalitesConfig = parametresImpot.penalites || { type: "pourcentage", valeur: 10 };
      
      if (penalitesConfig.type === "pourcentage") {
        // Appliquer le pourcentage pour CHAQUE délai écoulé
        const tauxPenalite = penalitesConfig.valeur / 100;
        montantPenalites = montantInitial * tauxPenalite * nombreDelaisEcoules;
        detailsCalcul = `${joursEcoules} jours écoulés = ${nombreDelaisEcoules} délai(s) de ${delaiAccorde} jours COMPLÈTEMENT écoulé(s) - Pénalités: ${penalitesConfig.valeur}% par délai = ${montantPenalites.toFixed(2)} USD`;
      
      } else if (penalitesConfig.type === "fixe") {
        // Appliquer le montant fixe pour CHAQUE délai écoulé
        montantPenalites = penalitesConfig.valeur * nombreDelaisEcoules;
        detailsCalcul = `${joursEcoules} jours écoulés = ${nombreDelaisEcoules} délai(s) de ${delaiAccorde} jours COMPLÈTEMENT écoulé(s) - Pénalités: ${penalitesConfig.valeur} USD fixe par délai = ${montantPenalites.toFixed(2)} USD`;
      }
    }

    const montantTotal = montantInitial + montantPenalites;

    const prompt = `
      Vous êtes un expert-comptable spécialisé en fiscalité. Calculez les pénalités selon cette règle:
      "Chaque délai accordé COMPLÈTEMENT écoulé déclenche une pénalité"

      DONNÉES:
      - Date de création: ${dateCreation}
      - Date actuelle: ${aujourdHui.toISOString().split('T')[0]}
      - Jours écoulés: ${joursEcoules} jours
      - Délai accordé: ${delaiAccorde} jours
      - Nombre de délais écoulés: ${nombreDelaisEcoules} (${joursEcoules} ÷ ${delaiAccorde})
      - Montant initial: ${montantInitial} USD
      - Paramètres de pénalités: ${JSON.stringify(parametresImpot.penalites)}

      RÈGLE DE CALCUL:
      Chaque fois que le nombre de jours écoulés contient un multiple COMPLET du délai accordé,
      on applique une pénalité.

      EXEMPLE:
      - Délai accordé: 30 jours
      - Jours écoulés: 62 jours
      - Calcul: 62 ÷ 30 = 2 délais complets écoulés
      - Donc: 2 pénalités à appliquer

      RÉPONSE (uniquement le JSON, sans autre texte):
      {
        "jours_ecoules": ${joursEcoules},
        "delai_accorde": ${delaiAccorde},
        "nombre_delais_ecoules": ${nombreDelaisEcoules},
        "montant_penalites": ${montantPenalites},
        "montant_total": ${montantTotal},
        "details_calcul": "${detailsCalcul}",
        "calcul_automatique": true
      }
    `;

    const res = await model.generateContent(prompt);
    const output = res.response.text();

    // Nettoyer la réponse pour extraire uniquement le JSON
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const penalites = JSON.parse(jsonMatch[0]);
      return {
        status: "success",
        data: penalites,
      };
    } else {
      throw new Error("Format de réponse invalide pour les pénalités");
    }
  } catch (error: any) {
    console.error("CalculerPenalitesAvecIA error:", error);
    
    // Fallback vers le calcul manuel
    return {
      status: "success",
      data: calculerPenalitesManuellesDirect(
        dateCreation,
        montantInitial,
        parametresImpot
      ),
    };
  }
};

// Fonction de calcul manuel direct
const calculerPenalitesManuellesDirect = (
  dateCreation: string,
  montantInitial: number,
  parametresImpot: any
) => {
  const dateCreationObj = new Date(dateCreation);
  const aujourdHui = new Date();
  const diffTemps = aujourdHui.getTime() - dateCreationObj.getTime();
  const joursEcoules = Math.ceil(diffTemps / (1000 * 3600 * 24));
  const delaiAccorde = parametresImpot.delai_accord || 30;
  
  // Nombre de délais accordés COMPLÈTEMENT écoulés
  const nombreDelaisEcoules = Math.floor(joursEcoules / delaiAccorde);
  
  let montantPenalites = 0;
  const penalitesConfig = parametresImpot.penalites || { type: "pourcentage", valeur: 10 };
  
  if (nombreDelaisEcoules > 0) {
    if (penalitesConfig.type === "pourcentage") {
      const tauxPenalite = penalitesConfig.valeur / 100;
      montantPenalites = montantInitial * tauxPenalite * nombreDelaisEcoules;
    } else if (penalitesConfig.type === "fixe") {
      montantPenalites = penalitesConfig.valeur * nombreDelaisEcoules;
    }
  }
  
  const montantTotal = montantInitial + montantPenalites;

  return {
    jours_ecoules: joursEcoules,
    delai_accorde: delaiAccorde,
    nombre_delais_ecoules: nombreDelaisEcoules,
    montant_penalites: montantPenalites,
    montant_total: montantTotal,
    details_calcul: `${joursEcoules} jours écoulés = ${nombreDelaisEcoules} délai(s) de ${delaiAccorde} jours écoulé(s)`,
    calcul_automatique: true,
  };
};