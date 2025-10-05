"use client";
import React, { useState, useEffect } from "react";
import {
  Home,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Smartphone,
  DollarSign,
  Building,
  FileCheck,
  LucideIcon,
  Printer,
  Trash2,
  Download,
  CheckCircle,
  User,
  FileText,
  CreditCardIcon,
  Brain,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import Portal from "../components/Portal";
import {
  verifierNif,
  getImpots,
  enregistrerDeclaration,
  traiterPaiement,
  supprimerDeclaration,
  Contribuable,
  Impot,
  FormulaireData,
} from "@/services/paiement/paiementService";
import {
  preRemplirFormulaireAvecIA,
  calculerMontantAvecIA,
} from "@/services/ia/geminiService";

// Types TypeScript
type FieldType = "texte" | "nombre" | "liste" | "fichier";

interface FormField {
  type: FieldType;
  champ: string;
  options?: string[] | { valeur: string; sousRubriques?: FormField[] }[];
  sousRubriques?: FormField[];
}

interface TaxOption {
  id: number;
  name: string;
  formula: FormField[];
}

interface PaymentMethod {
  id: number;
  name: string;
  icon: LucideIcon;
}

interface FormData {
  [key: string]: string | number;
}

interface ValidationErrors {
  [formIndex: number]: {
    [fieldKey: string]: string;
  };
}

// Options de paiement
const paymentMethods: PaymentMethod[] = [
  { id: 1, name: "Cash", icon: DollarSign },
  { id: 2, name: "Mobile Money", icon: Smartphone },
  { id: 3, name: "Dépôt bancaire", icon: Building },
  { id: 4, name: "Chèque", icon: FileCheck },
  { id: 5, name: "Carte bancaire", icon: CreditCard },
];

const PaiementPage: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [nif, setNif] = useState<string>("");
  const [selectedTax, setSelectedTax] = useState<Impot | null>(null);
  const [declarationCount, setDeclarationCount] = useState<number>(1);
  const [formsData, setFormsData] = useState<FormData[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | null>(null);
  const [taxOptions, setTaxOptions] = useState<Impot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [contribuable, setContribuable] = useState<Contribuable | null>(null);
  const [declarationReference, setDeclarationReference] = useState<string>("");
  const [idDeclaration, setIdDeclaration] = useState<number | null>(null);
  const [paymentReference, setPaymentReference] = useState<string>("");
  
  // États pour l'IA
  const [preRemplissageEffectue, setPreRemplissageEffectue] = useState<boolean>(false);
  const [montantCalcule, setMontantCalcule] = useState<number>(0);
  const [utilisationIA, setUtilisationIA] = useState<boolean>(false);

  // État pour la validation des champs
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Charger les impôts au montage du composant
  useEffect(() => {
    const loadImpots = async () => {
      setLoading(true);
      const result = await getImpots();
      if (result.status === "success") {
        setTaxOptions(result.data);
      } else {
        setError(result.message || "Erreur lors du chargement des impôts");
      }
      setLoading(false);
    };

    loadImpots();
  }, []);

  // Pré-remplissage automatique avec IA quand on arrive à l'étape 3
  useEffect(() => {
    if (step === 3 && selectedTax && contribuable && !preRemplissageEffectue) {
      handlePreRemplissageAutomatique();
    }
  }, [step, selectedTax, contribuable, preRemplissageEffectue]);

  // Fonction pour valider un formulaire
  const validateForm = (formIndex: number): boolean => {
    if (!selectedTax?.formulaire_json?.formulaire) return false;

    const errors: { [fieldKey: string]: string } = {};
    let isValid = true;

    const validateFields = (fields: FormField[], parentField = "") => {
      fields.forEach((field) => {
        const fieldKey = parentField ? `${parentField}_${field.champ}` : field.champ;
        const value = formsData[formIndex]?.[fieldKey];

        // Validation de base - champ requis
        if (!value || value.toString().trim() === "") {
          errors[fieldKey] = "Ce champ est obligatoire";
          isValid = false;
        }

        // Validation spécifique pour les nombres
        if (field.type === "nombre" && value) {
          const numValue = parseFloat(value.toString());
          if (isNaN(numValue) || numValue < 0) {
            errors[fieldKey] = "Veuillez saisir un nombre valide";
            isValid = false;
          }
        }

        // Validation pour les listes
        if (field.type === "liste" && value === "") {
          errors[fieldKey] = "Veuillez sélectionner une option";
          isValid = false;
        }

        // Validation récursive pour les sous-rubriques
        if (field.sousRubriques && field.sousRubriques.length > 0) {
          validateFields(field.sousRubriques, fieldKey);
        }
      });
    };

    validateFields(selectedTax.formulaire_json.formulaire);
    
    setValidationErrors(prev => ({
      ...prev,
      [formIndex]: errors
    }));

    return isValid;
  };

  // Fonction pour valider tous les formulaires
  const validateAllForms = (): boolean => {
    let allValid = true;
    
    for (let i = 0; i < declarationCount; i++) {
      if (!validateForm(i)) {
        allValid = false;
      }
    }
    
    return allValid;
  };

  // Fonction pour réinitialiser complètement l'application
  const resetApplication = (): void => {
    setStep(1);
    setNif("");
    setSelectedTax(null);
    setDeclarationCount(1);
    setFormsData([]);
    setShowPaymentModal(false);
    setShowReceiptModal(false);
    setSelectedPaymentMethod(null);
    setError("");
    setSuccess("");
    setContribuable(null);
    setDeclarationReference("");
    setIdDeclaration(null);
    setPaymentReference("");
    setPreRemplissageEffectue(false);
    setMontantCalcule(0);
    setUtilisationIA(false);
    setValidationErrors({});
  };

  // Fonction pour le pré-remplissage automatique avec IA
  const handlePreRemplissageAutomatique = async (): Promise<void> => {
    if (!selectedTax?.formulaire_json?.formulaire || !contribuable) return;

    setLoading(true);
    setUtilisationIA(true);
    
    const result = await preRemplirFormulaireAvecIA(
      contribuable,
      selectedTax.formulaire_json.formulaire
    );

    if (result.status === "success" && result.data) {
      const nouvellesDonnees = [...formsData];
      
      Object.keys(result.data).forEach((champ) => {
        for (let i = 0; i < declarationCount; i++) {
          if (!nouvellesDonnees[i]) nouvellesDonnees[i] = {};
          nouvellesDonnees[i][champ] = result.data[champ];
        }
      });
      
      setFormsData(nouvellesDonnees);
      setPreRemplissageEffectue(true);
      setSuccess("Pré-remplissage automatique effectué avec l'IA ✓");
    } else {
      console.warn("Pré-remplissage IA non disponible, continuation normale");
    }
    
    setLoading(false);
  };

  // Calculer le montant (avec IA si disponible)
  const calculateAmount = (): number => {
    if (montantCalcule > 0) {
      return montantCalcule;
    }
    
    return declarationCount * 15000;
  };

  // Passer à l'étape suivante
  const nextStep = (): void => {
    if (step < 4) setStep(step + 1);
  };

  // Revenir à l'étape précédente
  const prevStep = (): void => {
    if (step > 1) setStep(step - 1);
  };

  // Vérifier le NIF
  const handleNifVerification = async (): Promise<void> => {
    if (!nif.trim()) {
      setError("Veuillez saisir un NIF");
      return;
    }

    setLoading(true);
    setError("");

    const result = await verifierNif(nif);

    if (result.status === "success") {
      setContribuable(result.data);
      nextStep();
    } else {
      setError(result.message || "Erreur lors de la vérification du NIF");
    }

    setLoading(false);
  };

  // Gérer la soumission du formulaire
  const handleFormSubmit = (
    formIndex: number,
    field: string,
    value: string
  ): void => {
    const newFormsData = [...formsData];
    if (!newFormsData[formIndex]) newFormsData[formIndex] = {};
    newFormsData[formIndex][field] = value;
    setFormsData(newFormsData);

    // Effacer l'erreur de validation quand l'utilisateur commence à taper
    if (validationErrors[formIndex]?.[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[formIndex]) {
          delete newErrors[formIndex][field];
        }
        return newErrors;
      });
    }
  };

  // Enregistrer la déclaration avec calcul IA
  const handleDeclarationSubmit = async (): Promise<void> => {
    if (!selectedTax) {
      setError("Veuillez sélectionner un impôt");
      return;
    }

    // Valider tous les formulaires avant de soumettre
    if (!validateAllForms()) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    setError("");

    let montantFinal = declarationCount * 15000;
    let calculAvecIA = false;

    if (selectedTax.formulaire_json?.calcul?.formule) {
      const resultCalcul = await calculerMontantAvecIA(
        selectedTax.formulaire_json.calcul.formule,
        formsData,
        declarationCount
      );

      if (resultCalcul.status === "success") {
        montantFinal = resultCalcul.data;
        setMontantCalcule(montantFinal);
        calculAvecIA = true;
        setUtilisationIA(true);
        setSuccess(`Montant calculé intelligemment avec l'IA: ${montantFinal.toLocaleString()} USD`);
      } else {
        console.warn("Calcul IA échoué, utilisation du calcul par défaut");
      }
    }

    const result = await enregistrerDeclaration(
      selectedTax.id,
      montantFinal,
      formsData
    );

    if (result.status === "success") {
      setDeclarationReference(result.data.reference);
      setIdDeclaration(result.data.id_declaration);
      nextStep();
    } else {
      setError(
        result.message || "Erreur lors de l'enregistrement de la déclaration"
      );
    }

    setLoading(false);
  };

  // Supprimer la déclaration
  const handleDeleteDeclaration = async (): Promise<void> => {
    if (!idDeclaration) {
      setError("Aucune déclaration à supprimer");
      return;
    }

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette déclaration ?")) {
      return;
    }

    setLoading(true);
    setError("");

    const result = await supprimerDeclaration(idDeclaration);

    if (result.status === "success") {
      resetApplication();
      setSuccess("Déclaration supprimée avec succès");
    } else {
      setError(
        result.message || "Erreur lors de la suppression de la déclaration"
      );
    }

    setLoading(false);
  };

  // Traiter le paiement
  const handlePayment = async (): Promise<void> => {
    if (!idDeclaration || !selectedPaymentMethod) {
      setError("Veuillez sélectionner un mode de paiement");
      return;
    }

    setLoading(true);
    setError("");

    const result = await traiterPaiement(idDeclaration, selectedPaymentMethod);

    if (result.status === "success") {
      setPaymentReference(result.data.reference_paiement);
      setSuccess("Paiement effectué avec succès");
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      
      // Réinitialiser après 5 secondes pour permettre la visualisation du reçu
      setTimeout(() => {
        resetApplication();
      }, 5000);
    } else {
      setError(result.message || "Erreur lors du traitement du paiement");
    }

    setLoading(false);
  };

  // Imprimer le reçu
  const handlePrintReceipt = (): void => {
    window.print();
  };

  // Rendu dynamique des champs de formulaire
  const renderFormFields = (
    fields: FormField[],
    formIndex: number,
    parentField = ""
  ) => {
    return fields.map((field, fieldIndex) => {
      const fieldKey = parentField
        ? `${parentField}_${field.champ}`
        : field.champ;
      const fieldId = `form-${formIndex}-${fieldKey}`;
      
      const valeurActuelle = formsData[formIndex]?.[fieldKey] || "";
      const estPreRempliParIA = preRemplissageEffectue && valeurActuelle && 
                                formsData[formIndex]?.[fieldKey] !== undefined;
      const erreurValidation = validationErrors[formIndex]?.[fieldKey];

      return (
        <div key={fieldIndex} className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor={fieldId}
              className="block text-sm font-semibold text-gray-700"
            >
              {field.champ} {!erreurValidation && <span className="text-red-500">*</span>}
            </label>
            {estPreRempliParIA && (
              <span className="flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                <Sparkles size={12} className="mr-1" />
                Pré-rempli par IA
              </span>
            )}
          </div>

          {field.type === "texte" && (
            <>
              <input
                type="text"
                id={fieldId}
                value={valeurActuelle as string}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFormSubmit(formIndex, fieldKey, e.target.value)
                }
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${
                  erreurValidation ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                placeholder={`Saisir ${field.champ.toLowerCase()}`}
              />
              {erreurValidation && (
                <div className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {erreurValidation}
                </div>
              )}
            </>
          )}

          {field.type === "nombre" && (
            <>
              <input
                type="number"
                id={fieldId}
                value={valeurActuelle as number}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFormSubmit(formIndex, fieldKey, e.target.value)
                }
                min="0"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${
                  erreurValidation ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                placeholder="0"
              />
              {erreurValidation && (
                <div className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {erreurValidation}
                </div>
              )}
            </>
          )}

          {field.type === "liste" && field.options && (
            <>
              <select
                id={fieldId}
                value={valeurActuelle as string}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  handleFormSubmit(formIndex, fieldKey, e.target.value)
                }
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${
                  erreurValidation ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
              >
                <option value="">Sélectionnez une option</option>
                {field.options.map((option, optIndex) => (
                  <option
                    key={optIndex}
                    value={typeof option === "string" ? option : option.valeur}
                  >
                    {typeof option === "string" ? option : option.valeur}
                  </option>
                ))}
              </select>
              {erreurValidation && (
                <div className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {erreurValidation}
                </div>
              )}
            </>
          )}

          {field.type === "fichier" && (
            <>
              <input
                type="file"
                id={fieldId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFormSubmit(formIndex, fieldKey, e.target.files[0].name);
                  }
                }}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${
                  erreurValidation ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
              />
              {erreurValidation && (
                <div className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {erreurValidation}
                </div>
              )}
            </>
          )}

          {field.sousRubriques && field.sousRubriques.length > 0 && (
            <div className="ml-6 mt-4 pl-6 border-l-2 border-blue-200">
              {renderFormFields(field.sousRubriques, formIndex, fieldKey)}
            </div>
          )}
        </div>
      );
    });
  };

  // Étape 1 - Identification du contribuable
  const renderStep1 = (): React.ReactElement => (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <User className="text-white" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Identification du contribuable
        </h2>
        <p className="text-gray-600">
          Entrez votre numéro d'identification fiscale pour commencer
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Numéro NIF <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nif}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNif(e.target.value)
              }
              placeholder="Ex: 1234567890"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
          )}

          <button
            onClick={handleNifVerification}
            disabled={!nif.trim() || loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : null}
            {loading ? "Vérification..." : "Vérifier le NIF"}
            <ArrowRight className="ml-2" size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  // Étape 2 - Sélection de l'impôt
  const renderStep2 = (): React.ReactElement => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="text-white" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Sélection de l'impôt
        </h2>
        <p className="text-gray-600">
          Choisissez le type d'impôt et le nombre de déclarations
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type d'impôt <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedTax?.id || ""}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSelectedTax(
                  taxOptions.find(
                    (tax) => tax.id === parseInt(e.target.value)
                  ) || null
                )
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            >
              <option value="">Sélectionnez un impôt</option>
              {taxOptions.map((tax) => (
                <option key={tax.id} value={tax.id}>
                  {tax.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre de déclarations <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={declarationCount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDeclarationCount(parseInt(e.target.value) || 1)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
          </div>
        </div>

        {selectedTax?.formulaire_json?.calcul && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center text-blue-700">
              <Brain className="mr-2" size={18} />
              <span className="font-semibold">Calcul intelligent disponible</span>
            </div>
            <p className="text-blue-600 text-sm mt-1">
              L'IA calculera automatiquement le montant basé sur la formule:{" "}
              <code className="bg-blue-100 px-2 py-1 rounded">{selectedTax.formulaire_json.calcul.formule}</code>
            </p>
          </div>
        )}

        <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-100">
          <button
            onClick={prevStep}
            className="flex items-center text-gray-600 font-medium hover:text-gray-800 transition duration-200"
          >
            <ArrowLeft className="mr-2" size={18} /> Retour
          </button>

          <button
            onClick={nextStep}
            disabled={!selectedTax}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-8 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            Continuer
            <ArrowRight className="ml-2" size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  // Étape 3 - Déclaration avec pré-remplissage IA
  const renderStep3 = (): React.ReactElement => {
    if (
      !selectedTax ||
      !selectedTax.formulaire_json ||
      !selectedTax.formulaire_json.formulaire
    ) {
      return (
        <div className="text-center py-10">
          <div className="text-red-500 flex items-center justify-center">
            <AlertCircle className="mr-2" size={20} />
            Erreur: Structure de formulaire invalide
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Déclaration - {selectedTax.nom}
          </h2>
          <p className="text-gray-600">
            {preRemplissageEffectue 
              ? "Formulaire pré-rempli automatiquement par l'IA ✓" 
              : "Remplissez les informations requises pour chaque déclaration"}
          </p>
        </div>

        {/* Message d'information sur les champs obligatoires */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center text-blue-700">
            <AlertCircle size={16} className="mr-2" />
            <span className="font-semibold">Champs obligatoires</span>
          </div>
          <p className="text-blue-600 text-sm mt-1">
            Tous les champs marqués d'un astérisque (*) sont obligatoires. 
            Veuillez remplir complètement chaque déclaration avant de continuer.
          </p>
        </div>

        {utilisationIA && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center text-green-700">
              <Sparkles className="mr-2" size={20} />
              <span className="font-semibold">Assistance IA active</span>
            </div>
            <p className="text-green-600 text-sm mt-1">
              L'intelligence artificielle vous assiste dans le remplissage et le calcul
            </p>
          </div>
        )}

        <div className="space-y-6">
          {Array.from({ length: declarationCount }).map((_, formIndex) => (
            <div
              key={formIndex}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm mr-3">
                    {formIndex + 1}
                  </div>
                  Déclaration #{formIndex + 1}
                  {preRemplissageEffectue && (
                    <span className="ml-2 flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      <Sparkles size={12} className="mr-1" />
                      Pré-remplissage IA
                    </span>
                  )}
                </h3>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {renderFormFields(
                    selectedTax.formulaire_json.formulaire,
                    formIndex
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-6 mt-6">
          <button
            onClick={prevStep}
            className="flex items-center text-gray-600 font-medium hover:text-gray-800 transition duration-200"
          >
            <ArrowLeft className="mr-2" size={18} /> Retour
          </button>

          <button
            onClick={handleDeclarationSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-8 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : null}
            {loading ? "Calcul avec IA..." : "Calculer et continuer"}
            <Brain className="ml-2" size={18} />
          </button>
        </div>
      </div>
    );
  };

  // Étape 4 - Récapitulatif avec calcul IA
  const renderStep4 = (): React.ReactElement => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-white" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Récapitulatif de la transaction
        </h2>
        <p className="text-gray-600">
          Vérifiez les informations avant de procéder au paiement
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User className="mr-2 text-blue-500" size={20} />
                Informations du contribuable
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">NIF:</span>
                  <span className="font-medium">{nif}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contribuable:</span>
                  <span className="font-medium">
                    {contribuable?.prenom
                      ? `${contribuable.prenom} ${contribuable.nom}`
                      : contribuable?.nom}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FileText className="mr-2 text-green-500" size={20} />
                Détails de la déclaration
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type d'impôt:</span>
                  <span className="font-medium">{selectedTax?.nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nombre de déclarations:</span>
                  <span className="font-medium">{declarationCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Référence:</span>
                  <span className="font-medium text-blue-600">
                    {declarationReference}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <CreditCardIcon className="mr-2 text-blue-500" size={20} />
                Montant à payer
                {montantCalcule > 0 && (
                  <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                    <Sparkles size={10} className="mr-1" />
                    Calculé par IA
                  </span>
                )}
              </h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {calculateAmount().toLocaleString()} USD
                </div>
                <p className="text-gray-600 text-sm">
                  Total pour {declarationCount} déclaration(s)
                  {montantCalcule > 0 && " • Calcul intelligent avec IA"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Aperçu des données
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                <pre className="text-sm text-gray-600">
                  {JSON.stringify(formsData, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <button
              onClick={prevStep}
              className="flex items-center text-gray-600 font-medium hover:text-gray-800 transition duration-200"
            >
              <ArrowLeft className="mr-2" size={18} /> Retour
            </button>

            <div className="flex space-x-3">
              <button
                onClick={handleDeleteDeclaration}
                disabled={loading}
                className="flex items-center bg-red-50 text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-100 transition duration-200 disabled:opacity-50"
              >
                <Trash2 className="mr-2" size={18} /> Supprimer
              </button>

              <button
                onClick={() => setShowReceiptModal(true)}
                className="flex items-center bg-blue-50 text-blue-600 py-2 px-4 rounded-lg font-medium hover:bg-blue-100 transition duration-200"
              >
                <Download className="mr-2" size={18} /> Reçu
              </button>

              <button
                onClick={() => setShowPaymentModal(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition duration-200"
              >
                Payer maintenant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Modal de paiement
  const renderPaymentModal = (): React.ReactElement => {
    const selectedMethod = paymentMethods.find(
      (m) => m.id === selectedPaymentMethod
    );

    return (
      <Portal>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <h3 className="text-xl font-bold text-white">Mode de paiement</h3>
              <p className="text-blue-100 mt-1">
                Choisissez votre méthode de paiement préférée
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-3 mb-6">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition duration-200 ${
                        selectedPaymentMethod === method.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg mr-4 ${
                          selectedPaymentMethod === method.id
                            ? "bg-blue-500"
                            : "bg-gray-100"
                        }`}
                      >
                        <Icon
                          className={
                            selectedPaymentMethod === method.id
                              ? "text-white"
                              : "text-gray-600"
                          }
                          size={20}
                        />
                      </div>
                      <span className="font-semibold">{method.name}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-6 py-2 text-gray-600 font-medium hover:text-gray-800 transition duration-200"
                >
                  Annuler
                </button>

                <button
                  onClick={handlePayment}
                  disabled={!selectedPaymentMethod || loading}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : null}
                  {loading ? "Traitement..." : "Confirmer le paiement"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Portal>
    );
  };

  // Modal de reçu
  const renderReceiptModal = (): React.ReactElement => {
    const selectedMethod = paymentMethods.find(
      (m) => m.id === selectedPaymentMethod
    );

    return (
      <Portal>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div
            className="bg-white rounded-2xl shadow-xl max-w-4xl w-full my-8"
            id="receipt-content"
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm opacity-90">
                    RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                  </div>
                  <div className="text-2xl font-bold mt-1">DGRK</div>
                  <div className="text-xs opacity-90 mt-1">
                    Direction Générale des Recettes du Kongo Central
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm opacity-90">NOTE DE PERCEPTION</div>
                  <div className="text-lg font-bold mt-1">
                    {paymentReference}
                  </div>
                  <div className="text-xs opacity-90 mt-1">
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                    INFORMATIONS DU CONTRIBUABLE
                  </h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium text-gray-700">NIF:</span>{" "}
                      {nif}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">Nom:</span>{" "}
                      {contribuable?.prenom
                        ? `${contribuable.prenom} ${contribuable.nom}`
                        : contribuable?.nom}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                    DÉTAILS DE PAIEMENT
                  </h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium text-gray-700">
                        Référence:
                      </span>{" "}
                      {declarationReference}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">
                        Type d'impôt:
                      </span>{" "}
                      {selectedTax?.nom}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">
                        Mode de paiement:
                      </span>{" "}
                      {selectedMethod?.name}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">
                        Montant:
                      </span>
                      <span className="text-green-600 font-bold ml-2">
                        {calculateAmount().toLocaleString()} USD
                      </span>
                    </p>
                    {montantCalcule > 0 && (
                      <p>
                        <span className="font-medium text-gray-700">
                          Calcul:
                        </span>
                        <span className="text-blue-600 ml-2 text-sm">
                          Intelligent avec IA
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center text-yellow-700">
                  <AlertCircle size={16} className="mr-2" />
                  <span className="font-semibold">Information importante</span>
                </div>
                <p className="text-yellow-600 text-sm mt-1">
                  Cette application se réinitialisera automatiquement dans 5 secondes pour une nouvelle déclaration.
                </p>
              </div>

              <div className="flex justify-center space-x-4 mt-8 print:hidden">
                <button
                  onClick={handlePrintReceipt}
                  className="flex items-center bg-blue-500 text-white py-2 px-6 rounded-lg font-semibold hover:bg-blue-600 transition duration-200"
                >
                  <Printer className="mr-2" size={18} /> Imprimer
                </button>

                <button
                  onClick={resetApplication}
                  className="flex items-center bg-green-500 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-600 transition duration-200"
                >
                  <Home className="mr-2" size={18} /> Nouvelle déclaration
                </button>

                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="bg-gray-300 text-gray-700 py-2 px-6 rounded-lg font-semibold hover:bg-gray-400 transition duration-200"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      </Portal>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Déclaration et Paiement des Impôts
          </h1>
          <p className="text-gray-600 text-lg">
            Processus simplifié de déclaration et paiement en ligne avec assistance IA
          </p>
        </div>

        {/* Indicateur de progression */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition duration-200 ${
                      i === step
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                        : i < step
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {i < step ? <CheckCircle size={20} /> : i}
                  </div>
                  {i < 4 && (
                    <div
                      className={`w-16 h-1 transition duration-200 ${
                        i < step ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-4 text-sm text-gray-600">
              <span className={step >= 1 ? "text-blue-600 font-semibold" : ""}>
                Identification
              </span>
              <span className={step >= 2 ? "text-blue-600 font-semibold" : ""}>
                Impôt
              </span>
              <span className={step >= 3 ? "text-blue-600 font-semibold" : ""}>
                Déclaration
              </span>
              <span className={step >= 4 ? "text-blue-600 font-semibold" : ""}>
                Paiement
              </span>
            </div>
          </div>
        </div>

        {/* Messages d'alerte */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl">
            <div className="flex items-center">
              <AlertCircle size={20} className="mr-3" />
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="max-w-2xl mx-auto mb-6 bg-green-50 border border-green-200 text-green-600 px-6 py-4 rounded-xl">
            <div className="flex items-center">
              <CheckCircle className="mr-3 text-green-500" size={20} />
              {success}
            </div>
          </div>
        )}

        {/* Contenu de l'étape actuelle */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        {/* Modal de paiement */}
        {showPaymentModal && renderPaymentModal()}

        {/* Modal de reçu */}
        {showReceiptModal && renderReceiptModal()}
      </div>
    </div>
  );
};

export default PaiementPage;