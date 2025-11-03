// services/ia/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

export type FieldType =
  | "texte"
  | "nombre"
  | "date"
  | "email"
  | "select"
  | "checkbox"
  | "liste"
  | "fichier"
  | "telephone";

export interface FormField {
  type: FieldType;
  champ: string;
  label?: string;
  required?: boolean;
  options?: string[];
  sousRubriques?: FormField[];
  requis?: boolean;
  [key: string]: any;
}

export interface ApiResponse {
  status: "success" | "error";
  message?: string;
  data?: any;
}

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error(
    "La clé GEMINI_API_KEY n'est pas définie dans les variables d'environnement"
  );
}

const ai = new GoogleGenerativeAI(GEMINI_API_KEY);
const DEFAULT_MODEL = "gemini-2.0-flash";

// Fonction utilitaire réutilisable pour parser les réponses JSON de l'IA
const parseAIJsonResponse = (output: string): any => {
  console.log("Tentative de parsing de la réponse IA:", output);

  // Méthode 1: Essayer de parser directement
  try {
    const directParse = JSON.parse(output);
    console.log("Parsing direct réussi");
    return directParse;
  } catch (e) {
    console.log("Échec parsing direct, tentative de nettoyage...");
  }

  // Méthode 2: Nettoyer et réessayer
  const cleaned = output
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .replace(/^[^{[]*/, '')
    .replace(/[^}\]]*$/, '')
    .trim();

  try {
    const cleanedParse = JSON.parse(cleaned);
    console.log("Parsing après nettoyage réussi");
    return cleanedParse;
  } catch (e) {
    console.log("Échec parsing nettoyé, tentative d'extraction regex...");
  }

  // Méthode 3: Extraire avec regex améliorée
  const jsonRegex = /(\{[\s\S]*\}|\[[\s\S]*\])/;
  const jsonMatch = output.match(jsonRegex);
  
  if (jsonMatch) {
    try {
      const regexParse = JSON.parse(jsonMatch[0]);
      console.log("Parsing regex réussi");
      return regexParse;
    } catch (e) {
      console.log("Échec parsing regex");
    }
  }

  // Méthode 4: Chercher le premier { et le dernier }
  const firstBrace = output.indexOf('{');
  const lastBrace = output.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const potentialJson = output.substring(firstBrace, lastBrace + 1);
    try {
      const braceParse = JSON.parse(potentialJson);
      console.log("Parsing par délimiteurs réussi");
      return braceParse;
    } catch (e) {
      console.log("Échec parsing par délimiteurs");
    }
  }

  throw new Error(`Impossible de parser la réponse JSON de l'IA: ${output.substring(0, 100)}...`);
};

// Fonction de fallback pour la validation manuelle
const effectuerValidationManuelle = (formsData: any[], formulaireStructure: FormField[]) => {
  const champsManquants: string[] = [];
  const declarationsInvalides: number[] = [];
  
  formsData.forEach((formData, index) => {
    let declarationValide = true;
    
    formulaireStructure.forEach((field) => {
      const isRequired = field.required || field.requis;
      const isExcluded = field.champ.includes('E-mail') || 
                        field.champ.includes('email') || 
                        field.champ.includes('Numéro telephone 2') || 
                        field.champ.includes('Téléphone 2');
      
      if (isRequired && !isExcluded) {
        const valeur = formData[field.champ];
        const estVide = !valeur && valeur !== 0 && valeur !== false;
        const estStringVide = typeof valeur === 'string' && valeur.trim() === '';
        
        if (estVide || estStringVide) {
          champsManquants.push(`${field.champ} (déclaration ${index + 1})`);
          declarationValide = false;
        }
      }
    });
    
    if (!declarationValide) {
      declarationsInvalides.push(index + 1);
    }
  });
  
  return {
    formulaire_valide: champsManquants.length === 0,
    champs_manquants: champsManquants,
    declarations_invalides: declarationsInvalides,
    message: champsManquants.length > 0 
      ? `${champsManquants.length} champ(s) obligatoire(s) manquant(s) dans les déclarations ${declarationsInvalides.join(', ')}`
      : "Tous les champs obligatoires sont remplis"
  };
};

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

export const verifierChampsObligatoiresAvecIA = async (
  formsData: any[],
  formulaireStructure: FormField[]
): Promise<ApiResponse> => {
  try {
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

    const prompt = `
      Vous êtes un assistant expert en validation de formulaires. Vérifiez que tous les champs obligatoires sont remplis dans les données de formulaire.

      STRUCTURE DU FORMULAIRE:
      ${JSON.stringify(formulaireStructure, null, 2)}

      DONNÉES DES FORMULAIRES (${formsData.length} déclaration(s)):
      ${JSON.stringify(formsData, null, 2)}

      RÈGLES DE VALIDATION:
      1. Tous les champs sont obligatoires SAUF:
         - Les champs contenant "E-mail" ou "email" dans leur nom
         - Les champs contenant "Numéro telephone 2" ou "Téléphone 2" dans leur nom
         - Les champs avec "required": false ou "requis": false explicitement
      2. Un champ est considéré comme rempli si:
         - Pour les champs texte: non vide, non null, non undefined
         - Pour les champs nombre: valeur numérique valide (0 est accepté)
         - Pour les listes: une option sélectionnée
         - Pour les checkbox: true ou false sont acceptés
         - Pour les fichiers: un nom de fichier présent

      INSTRUCTIONS:
      - Analysez chaque formulaire dans formsData (il y a ${formsData.length} déclaration(s))
      - Identifiez les champs manquants pour chaque formulaire
      - Retournez un objet JSON avec cette structure exacte:
        {
          "formulaire_valide": boolean,
          "champs_manquants": string[],
          "declarations_invalides": number[],
          "message": string
        }

      IMPORTANT: Retournez UNIQUEMENT du JSON valide, sans texte autour, sans commentaires.
    `;

    const res = await model.generateContent(prompt);
    const output = res.response.text();

    console.log("Réponse IA brute pour validation:", output);

    try {
      const validationResult = parseAIJsonResponse(output);
      
      // Validation de la structure de réponse
      if (!validationResult.hasOwnProperty('formulaire_valide') || 
          !validationResult.hasOwnProperty('champs_manquants')) {
        throw new Error("Structure de réponse invalide");
      }
      
      return {
        status: "success",
        data: validationResult,
      };
    } catch (parseError) {
      console.warn("Erreur de parsing, fallback vers validation manuelle:", parseError);
      const validationManuelle = effectuerValidationManuelle(formsData, formulaireStructure);
      return {
        status: "success",
        data: validationManuelle,
      };
    }
  } catch (error: any) {
    console.error("VerifierChampsObligatoiresAvecIA error:", error);
    // Fallback vers la validation manuelle en cas d'erreur
    const validationManuelle = effectuerValidationManuelle(formsData, formulaireStructure);
    return {
      status: "success",
      data: validationManuelle,
    };
  }
};

export const analyzeTaxDataWithGemini = async (
  userQuery: string,
  taxData: any
): Promise<ApiResponse> => {
  try {
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

    const prompt = `
      Vous êtes un assistant expert en fiscalité. Analysez les données fiscales suivantes et répondez à la question de l'utilisateur de manière précise et concise.
      
      DONNÉES FISCALES:
      ${JSON.stringify(taxData, null, 2)}
      
      QUESTION DE L'UTILISATEUR: ${userQuery}
      
      RÉPONSE (en français, soyez direct et technique):
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
        maxOutputTokens: options?.maxOutputTokens ?? 1024,
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
      6. Les champs "E-mail" et "Numéro telephone 2" sont facultatifs - ne les pré-remplissez que si les données sont disponibles

      RÉPONSE (uniquement le JSON valide, sans texte autour):
    `;

    const res = await model.generateContent(prompt);
    const output = res.response.text();

    const donneesPreRemplies = parseAIJsonResponse(output);
    
    return {
      status: "success",
      data: donneesPreRemplies,
    };
  } catch (error: any) {
    console.error("PreRemplirFormulaireAvecIA error:", error);
    return {
      status: "error",
      message: error.message || "Erreur lors du pré-remplissage avec l'IA",
    };
  }
};

export const calculerMontantAvecIA = async (
  formuleCalcul: string,
  donneesFormulaire: any[],
  nombreDeclarations: number = 1
): Promise<ApiResponse> => {
  try {
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

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
      7. Ne retournez QUE le nombre, sans texte, sans devise, sans explication

      EXEMPLE:
      - Si formule: "base * taux"
      - Déclaration 1: base=1000, taux=0.1 → montant=100
      - Déclaration 2: base=2000, taux=0.1 → montant=200
      - TOTAL = 100 + 200 = 300
      - RÉPONSE: 300

      RÉPONSE (uniquement le nombre final):
    `;

    const res = await model.generateContent(prompt);
    const output = res.response.text().trim();

    console.log("Réponse IA brute pour calcul:", output);

    // Extraction robuste du montant
    const montantMatch = output.match(/(\d+[.,]?\d*)/);
    if (montantMatch) {
      const montantString = montantMatch[1].replace(",", ".");
      const montant = parseFloat(montantString);

      if (!isNaN(montant)) {
        return {
          status: "success",
          data: montant,
        };
      }
    }

    // Si pas de match direct, essayer d'extraire le dernier nombre
    const numbers = output.match(/\d+[.,]?\d*/g);
    if (numbers && numbers.length > 0) {
      const lastNumber = numbers[numbers.length - 1].replace(",", ".");
      const montant = parseFloat(lastNumber);
      
      if (!isNaN(montant)) {
        return {
          status: "success",
          data: montant,
        };
      }
    }
    
    throw new Error("Impossible d'extraire le montant de la réponse de l'IA");
  } catch (error: any) {
    console.error("CalculerMontantAvecIA error:", error);
    return {
      status: "error",
      message: error.message || "Erreur lors du calcul avec l'IA",
    };
  }
};

export const calculerMontantAvecFormuleUtilisateur = async (
  formuleUtilisateur: string,
  donneesFormulaire: any[],
  nombreDeclarations: number = 1
): Promise<ApiResponse> => {
  try {
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

    const donneesStructurees = donneesFormulaire.map((declaration, index) => ({
      declaration: index + 1,
      donnees: declaration,
    }));

    const prompt = `
      Vous êtes un expert-comptable. Calculez le montant total pour ${nombreDeclarations} déclaration(s) en utilisant EXCLUSIVEMENT la formule fournie par l'utilisateur.

      FORMULE DE CALCUL (OBLIGATOIRE): ${formuleUtilisateur}

      DONNÉES DES DÉCLARATIONS:
      ${JSON.stringify(donneesStructurees, null, 2)}

      INSTRUCTIONS TRÈS IMPORTANTES:
      1. UTILISEZ UNIQUEMENT ET EXCLUSIVEMENT LA FORMULE: "${formuleUtilisateur}"
      2. Calculez d'abord le montant pour CHAQUE déclaration individuellement en appliquant strictement cette formule
      3. Ensuite, SOMMEZ les montants de toutes les déclarations pour obtenir le TOTAL
      4. Retournez UNIQUEMENT le montant total final (nombre uniquement)
      5. Ne retournez pas les calculs intermédiaires
      6. Si certaines données manquent, utilisez des valeurs par défaut raisonnables (0)
      7. Le résultat final doit être en dollars (USD)
      8. Ne retournez QUE le nombre, sans texte, sans devise

      RÉPONSE (uniquement le nombre final):
    `;

    const res = await model.generateContent(prompt);
    const output = res.response.text().trim();

    console.log("Réponse IA avec formule utilisateur:", output);

    // Extraction robuste du montant
    const montantMatch = output.match(/(\d+[.,]?\d*)/);
    if (montantMatch) {
      const montantString = montantMatch[1].replace(",", ".");
      const montant = parseFloat(montantString);

      if (!isNaN(montant)) {
        return {
          status: "success",
          data: montant,
        };
      }
    }

    // Si pas de match direct, essayer d'extraire le dernier nombre
    const numbers = output.match(/\d+[.,]?\d*/g);
    if (numbers && numbers.length > 0) {
      const lastNumber = numbers[numbers.length - 1].replace(",", ".");
      const montant = parseFloat(lastNumber);
      
      if (!isNaN(montant)) {
        return {
          status: "success",
          data: montant,
        };
      }
    }
    
    throw new Error("Impossible d'extraire le montant de la réponse de l'IA");
  } catch (error: any) {
    console.error("CalculerMontantAvecFormuleUtilisateur error:", error);
    return {
      status: "error",
      message: error.message || "Erreur lors du calcul avec la formule utilisateur",
    };
  }
};

export const calculerPenalitesAvecIA = async (
  dateCreation: string,
  montantInitial: number,
  parametresImpot: any
): Promise<ApiResponse> => {
  try {
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

    const dateCreationObj = new Date(dateCreation);
    const aujourdHui = new Date();
    const diffTemps = aujourdHui.getTime() - dateCreationObj.getTime();
    const joursEcoules = Math.ceil(diffTemps / (1000 * 3600 * 24));
    const delaiAccorde = parametresImpot.delai_accord || 30;
    const nombreDelaisEcoules = Math.floor(joursEcoules / delaiAccorde);

    let montantPenalites = 0;
    let detailsCalcul = `Aucun délai complet écoulé - ${joursEcoules} jours sur ${delaiAccorde} jours accordés`;

    if (nombreDelaisEcoules > 0) {
      const penalitesConfig = parametresImpot.penalites || {
        type: "pourcentage",
        valeur: 10,
      };

      if (penalitesConfig.type === "pourcentage") {
        const tauxPenalite = penalitesConfig.valeur / 100;
        montantPenalites = montantInitial * tauxPenalite * nombreDelaisEcoules;
        detailsCalcul = `${joursEcoules} jours écoulés = ${nombreDelaisEcoules} délai(s) de ${delaiAccorde} jours COMPLÈTEMENT écoulé(s) - Pénalités: ${
          penalitesConfig.valeur
        }% par délai = ${montantPenalites.toFixed(2)} USD`;
      } else if (penalitesConfig.type === "fixe") {
        montantPenalites = penalitesConfig.valeur * nombreDelaisEcoules;
        detailsCalcul = `${joursEcoules} jours écoulés = ${nombreDelaisEcoules} délai(s) de ${delaiAccorde} jours COMPLÈTEMENT écoulé(s) - Pénalités: ${
          penalitesConfig.valeur
        } USD fixe par délai = ${montantPenalites.toFixed(2)} USD`;
      }
    }

    const montantTotal = montantInitial + montantPenalites;

    const prompt = `
      Vous êtes un expert-comptable spécialisé en fiscalité. Validez ce calcul de pénalités:

      RÉSULTAT DU CALCUL AUTOMATIQUE:
      {
        "jours_ecoules": ${joursEcoules},
        "delai_accorde": ${delaiAccorde},
        "nombre_delais_ecoules": ${nombreDelaisEcoules},
        "montant_penalites": ${montantPenalites},
        "montant_total": ${montantTotal},
        "details_calcul": "${detailsCalcul}",
        "calcul_automatique": true
      }

      RÉPONSE (retournez le même JSON validé, sans modification):
    `;

    const res = await model.generateContent(prompt);
    const output = res.response.text();

    const penalites = parseAIJsonResponse(output);
    
    return {
      status: "success",
      data: penalites,
    };
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
  const nombreDelaisEcoules = Math.floor(joursEcoules / delaiAccorde);

  let montantPenalites = 0;
  const penalitesConfig = parametresImpot.penalites || {
    type: "pourcentage",
    valeur: 10,
  };

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
    montant_penalites: parseFloat(montantPenalites.toFixed(2)),
    montant_total: parseFloat(montantTotal.toFixed(2)),
    details_calcul: `${joursEcoules} jours écoulés = ${nombreDelaisEcoules} délai(s) de ${delaiAccorde} jours écoulé(s)`,
    calcul_automatique: true,
  };
};

export const calculerRepartitionBeneficiaires = async (
  montantTotal: number,
  beneficiaires: any[],
  reglesRepartition: any
): Promise<ApiResponse> => {
  try {
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

    const prompt = `
      Vous êtes un expert en répartition financière. Calculez la répartition d'un montant total entre plusieurs bénéficiaires selon les règles spécifiées.

      MONTANT TOTAL: ${montantTotal} USD
      
      BÉNÉFICIAIRES:
      ${JSON.stringify(beneficiaires, null, 2)}
      
      RÈGLES DE RÉPARTITION:
      ${JSON.stringify(reglesRepartition, null, 2)}

      INSTRUCTIONS:
      1. Respectez les types de part (pourcentage ou montant_fixe) pour chaque bénéficiaire
      2. Pour les parts en pourcentage, calculez le montant exact
      3. Pour les parts fixes, utilisez le montant spécifié
      4. Assurez-vous que la somme totale correspond exactement au montant total
      5. Si ajustement nécessaire, répartissez équitablement les différences
      6. Retournez un tableau avec pour chaque bénéficiaire: montant_attribue et valeur_part_calculee

      RÉPONSE (uniquement le JSON valide):
    `;

    const res = await model.generateContent(prompt);
    const output = res.response.text();

    const repartition = parseAIJsonResponse(output);
    
    return {
      status: "success",
      data: repartition,
    };
  } catch (error: any) {
    console.error("CalculerRepartitionBeneficiaires error:", error);
    return {
      status: "error",
      message: error.message || "Erreur lors du calcul de la répartition",
    };
  }
};

export const rechercherDeclarationParPlaque = async (
  numeroPlaque: string,
  declarationsData: any[],
  formulaireStructure: FormField[]
): Promise<ApiResponse> => {
  try {
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

    const prompt = `
      Vous êtes un assistant expert en analyse de données fiscales. Recherchez la déclaration correspondant au numéro de plaque spécifié.

      NUMÉRO DE PLAQUE RECHERCHÉ: ${numeroPlaque}

      DONNÉES DES DÉCLARATIONS EXISTANTES:
      ${JSON.stringify(declarationsData, null, 2)}

      STRUCTURE DU FORMULAIRE ATTENDU:
      ${JSON.stringify(formulaireStructure, null, 2)}

      INSTRUCTIONS:
      1. Parcourez chaque déclaration dans "declarationsData"
      2. Pour chaque déclaration, analysez son objet "donnees_json"
      3. Recherchez la déclaration où la propriété "Numéro plaque" correspond exactement au numéro recherché
      4. Si trouvé, retournez UNIQUEMENT les données de cette déclaration
      5. Si non trouvé, retournez un objet vide
      6. Ne retournez que les champs qui correspondent à la structure du formulaire

      RÉPONSE (uniquement le JSON valide):
    `;

    const res = await model.generateContent(prompt);
    const output = res.response.text();

    const resultatRecherche = parseAIJsonResponse(output);
    
    return {
      status: "success",
      data: resultatRecherche,
    };
  } catch (error: any) {
    console.error("RechercherDeclarationParPlaque error:", error);
    return {
      status: "error",
      message: error.message || "Erreur lors de la recherche par plaque avec l'IA",
    };
  }
};

export const getDeclarationsByNif = async (nif: string): Promise<ApiResponse> => {
  try {
    const response = await fetch(`/api/declarations/${nif}`);
    
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des déclarations");
    }
    
    const data = await response.json();
    return {
      status: "success",
      data: data,
    };
  } catch (error: any) {
    console.error("GetDeclarationsByNif error:", error);
    return {
      status: "error",
      message: error.message || "Erreur lors de la récupération des déclarations",
    };
  }
};

// Nouvelle fonction pour la génération de code fiscal
export const genererCodeFiscalAvecIA = async (
  descriptionImpot: string,
  parametres: any
): Promise<ApiResponse> => {
  try {
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

    const prompt = `
      Vous êtes un expert en développement fiscal. Générez du code JavaScript/Typescript pour calculer un impôt basé sur la description.

      DESCRIPTION DE L'IMPÔT: ${descriptionImpot}

      PARAMÈTRES:
      ${JSON.stringify(parametres, null, 2)}

      INSTRUCTIONS:
      1. Générez une fonction qui calcule le montant de l'impôt
      2. Incluez la validation des données d'entrée
      3. Gérez les cas d'erreur
      4. Retournez le code complet avec documentation
      5. Utilisez TypeScript si possible

      RÉPONSE (code seulement):
    `;

    const res = await model.generateContent(prompt);
    const output = res.response.text();

    return {
      status: "success",
      data: output,
    };
  } catch (error: any) {
    console.error("GenererCodeFiscalAvecIA error:", error);
    return {
      status: "error",
      message: error.message || "Erreur lors de la génération de code fiscal",
    };
  }
};

// Fonction pour l'analyse de tendances fiscales
export const analyserTendancesFiscales = async (
  donneesHistoriques: any[],
  periode: string
): Promise<ApiResponse> => {
  try {
    const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

    const prompt = `
      Vous êtes un analyste fiscal expert. Analysez les tendances dans les données historiques fournies.

      DONNÉES HISTORIQUES:
      ${JSON.stringify(donneesHistoriques, null, 2)}

      PÉRIODE D'ANALYSE: ${periode}

      INSTRUCTIONS:
      1. Identifiez les tendances principales
      2. Détectez les anomalies ou patterns inhabituels
      3. Fournissez des insights actionnables
      4. Proposez des recommandations
      5. Structurez votre réponse de manière claire

      RÉPONSE (en français):
    `;

    const res = await model.generateContent(prompt);
    const output = res.response.text();

    return {
      status: "success",
      data: output,
    };
  } catch (error: any) {
    console.error("AnalyserTendancesFiscales error:", error);
    return {
      status: "error",
      message: error.message || "Erreur lors de l'analyse des tendances fiscales",
    };
  }
};

export default {
  askGemini,
  verifierChampsObligatoiresAvecIA,
  analyzeTaxDataWithGemini,
  askGeminiAdvanced,
  preRemplirFormulaireAvecIA,
  calculerMontantAvecIA,
  calculerMontantAvecFormuleUtilisateur,
  calculerPenalitesAvecIA,
  calculerRepartitionBeneficiaires,
  rechercherDeclarationParPlaque,
  getDeclarationsByNif,
  genererCodeFiscalAvecIA,
  analyserTendancesFiscales,
};