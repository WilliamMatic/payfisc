// app/paiement/page.tsx
"use client";
import { useAuth } from "@/contexts/AuthContext";
import {
  calculerMontantAvecFormuleUtilisateur,
  calculerMontantAvecIA,
  preRemplirFormulaireAvecIA,
  rechercherDeclarationParPlaque,
  verifierChampsObligatoiresAvecIA,
} from "@/services/ia/geminiService";
import {
  Contribuable,
  enregistrerDeclaration,
  getDeclarationsByNif,
  getImpots,
  Impot,
  supprimerDeclaration,
  traiterPaiement,
  verifierNif,
} from "@/services/paiement/paiementService";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Brain,
  Building,
  CheckCircle,
  CreditCard,
  CreditCardIcon,
  DollarSign,
  Download,
  FileCheck,
  FileText,
  Home,
  LucideIcon,
  Printer,
  Smartphone,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import React, { useEffect, useState } from "react";
import Portal from "../components/Portal";

type FieldType =
  | "texte"
  | "nombre"
  | "liste"
  | "fichier"
  | "email"
  | "telephone";

interface FormField {
  type: FieldType;
  champ: string;
  options?: string[] | { valeur: string; sousRubriques?: FormField[] }[];
  sousRubriques?: FormField[];
  requis?: boolean;
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
  fields?: PaymentField[];
}

interface PaymentField {
  type: "text" | "number" | "tel" | "email";
  name: string;
  label: string;
  required: boolean;
  placeholder?: string;
}

interface FormData {
  [key: string]: string | number;
}

interface ValidationErrors {
  [formIndex: number]: {
    [fieldKey: string]: string;
  };
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 1,
    name: "Cash",
    icon: DollarSign,
  },
  {
    id: 2,
    name: "Mobile Money",
    icon: Smartphone,
    fields: [
      {
        type: "tel",
        name: "numero_telephone",
        label: "Numéro de téléphone",
        required: true,
        placeholder: "+243 XX XXX XX XX",
      },
      {
        type: "text",
        name: "operateur",
        label: "Opérateur",
        required: true,
        placeholder: "Orange, Vodacom, Airtel, etc.",
      },
    ],
  },
  {
    id: 3,
    name: "Dépôt bancaire",
    icon: Building,
    fields: [
      {
        type: "text",
        name: "nom_banque",
        label: "Nom de la banque",
        required: true,
        placeholder: "Nom de l'institution bancaire",
      },
      {
        type: "text",
        name: "numero_compte",
        label: "Numéro de compte",
        required: true,
        placeholder: "Numéro de compte bancaire",
      },
      {
        type: "text",
        name: "reference_depot",
        label: "Référence du dépôt",
        required: true,
        placeholder: "Référence du dépôt bancaire",
      },
    ],
  },
  {
    id: 4,
    name: "Chèque",
    icon: FileCheck,
    fields: [
      {
        type: "text",
        name: "numero_cheque",
        label: "Numéro du chèque",
        required: true,
        placeholder: "Numéro du chèque",
      },
      {
        type: "text",
        name: "banque_emetteur",
        label: "Banque émettrice",
        required: true,
        placeholder: "Banque émettrice du chèque",
      },
      {
        type: "text",
        name: "date_cheque",
        label: "Date du chèque",
        required: true,
        placeholder: "JJ/MM/AAAA",
      },
    ],
  },
  {
    id: 5,
    name: "Carte bancaire",
    icon: CreditCard,
    fields: [
      {
        type: "text",
        name: "numero_carte",
        label: "Numéro de carte",
        required: true,
        placeholder: "1234 5678 9012 3456",
      },
      {
        type: "text",
        name: "nom_titulaire",
        label: "Nom du titulaire",
        required: true,
        placeholder: "Nom sur la carte",
      },
      {
        type: "text",
        name: "date_expiration",
        label: "Date d'expiration",
        required: true,
        placeholder: "MM/AA",
      },
      {
        type: "text",
        name: "code_cvv",
        label: "Code CVV",
        required: true,
        placeholder: "123",
      },
    ],
  },
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
  const [paymentFields, setPaymentFields] = useState<{ [key: string]: string }>({});
  const [taxOptions, setTaxOptions] = useState<Impot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [contribuable, setContribuable] = useState<Contribuable | null>(null);
  const [declarationReference, setDeclarationReference] = useState<string>("");
  const [idDeclaration, setIdDeclaration] = useState<number | null>(null);
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [preRemplissageEffectue, setPreRemplissageEffectue] = useState<boolean>(false);
  const [montantCalcule, setMontantCalcule] = useState<number>(0);
  const [utilisationIA, setUtilisationIA] = useState<boolean>(false);
  const [preRemplissageLoading, setPreRemplissageLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showPlaqueModal, setShowPlaqueModal] = useState<boolean>(false);
  const [numeroPlaque, setNumeroPlaque] = useState<string>("");
  const [recherchePlaqueLoading, setRecherchePlaqueLoading] = useState<boolean>(false);
  const [declarationsExistantes, setDeclarationsExistantes] = useState<any[]>([]);

  // CORRECTION : Toujours utiliser la formule de l'utilisateur depuis le contexte
  const { agent, utilisateur, userType } = useAuth();
  console.log(utilisateur)
  const formuleUtilisateur = utilisateur?.formule || "";

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

  useEffect(() => {
    if (selectedTax?.nom === "REPRODUCTION DES CARTES ROSE") {
      setDeclarationCount(1);
      setTimeout(() => {
        setShowPlaqueModal(true);
      }, 500);
    }
  }, [selectedTax]);

  useEffect(() => {
    if (step === 3 && selectedTax && contribuable && !preRemplissageEffectue) {
      handlePreRemplissageAutomatique();
    }
  }, [step, selectedTax, contribuable, preRemplissageEffectue]);

  const rechercherDeclarationsExistantes = async (): Promise<void> => {
    if (!nif) return;

    setLoading(true);
    const result = await getDeclarationsByNif(nif);

    if (result.status === "success") {
      setDeclarationsExistantes(result.data || []);
    } else {
      console.warn("Aucune déclaration existante trouvée ou erreur:", result.message);
      setDeclarationsExistantes([]);
    }
    setLoading(false);
  };

  const handleRecherchePlaque = async (): Promise<void> => {
    if (!numeroPlaque.trim()) {
      setError("Veuillez saisir un numéro de plaque");
      return;
    }

    if (!selectedTax?.formulaire_json?.formulaire) {
      setError("Structure de formulaire invalide");
      return;
    }

    setRecherchePlaqueLoading(true);
    setError("");

    try {
      if (declarationsExistantes.length === 0) {
        await rechercherDeclarationsExistantes();
      }

      if (declarationsExistantes.length === 0) {
        setError("Aucune déclaration existante trouvée pour ce NIF");
        setRecherchePlaqueLoading(false);
        return;
      }

      const result = await rechercherDeclarationParPlaque(
        numeroPlaque,
        declarationsExistantes,
        selectedTax.formulaire_json.formulaire
      );

      if (result.status === "success" && result.data?.declaration_trouvee) {
        const donneesTrouvees = result.data.donnees_correspondantes;
        const nouvellesDonnees = [...formsData];
        if (!nouvellesDonnees[0]) nouvellesDonnees[0] = {};

        Object.keys(donneesTrouvees).forEach((champ) => {
          nouvellesDonnees[0][champ] = donneesTrouvees[champ];
        });

        setFormsData(nouvellesDonnees);
        setPreRemplissageEffectue(true);
        setUtilisationIA(true);
        setSuccess(`Données trouvées pour la plaque ${numeroPlaque} ✓`);
        setShowPlaqueModal(false);
      } else {
        setError(`Aucune déclaration trouvée pour le numéro de plaque: ${numeroPlaque}`);
      }
    } catch (error) {
      console.error("Erreur recherche plaque:", error);
      setError("Erreur lors de la recherche par numéro de plaque");
    }

    setRecherchePlaqueLoading(false);
  };

  const validateField = (
    field: FormField,
    value: string | number,
    fieldKey: string
  ): string | null => {
    const stringValue = value?.toString().trim() || "";
    const estFacultatif =
      field.champ.toLowerCase().includes("e-mail") ||
      field.champ.toLowerCase().includes("email") ||
      field.champ.toLowerCase().includes("numéro telephone 2") ||
      field.champ.toLowerCase().includes("téléphone 2");

    if (field.requis && !estFacultatif && (!value || stringValue === "")) {
      return "Ce champ est obligatoire";
    }

    if (field.type === "nombre" && value && stringValue !== "") {
      const numValue = parseFloat(stringValue);
      if (isNaN(numValue) || numValue < 0) {
        return "Veuillez saisir un nombre valide";
      }
    }

    if (field.type === "email" && stringValue !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(stringValue)) {
        return "Veuillez saisir une adresse email valide";
      }
    }

    if (field.type === "telephone" && stringValue !== "") {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
      if (!phoneRegex.test(stringValue.replace(/\s/g, ""))) {
        return "Veuillez saisir un numéro de téléphone valide";
      }
    }

    if (field.type === "liste" && field.requis && !estFacultatif && value === "") {
      return "Veuillez sélectionner une option";
    }

    return null;
  };

  const validateForm = (formIndex: number): boolean => {
    if (!selectedTax?.formulaire_json?.formulaire) return false;

    const errors: { [fieldKey: string]: string } = {};
    let isValid = true;

    const validateFields = (fields: FormField[], parentField = "") => {
      fields.forEach((field) => {
        const fieldKey = parentField ? `${parentField}_${field.champ}` : field.champ;
        const value = formsData[formIndex]?.[fieldKey];

        const error = validateField(field, value, fieldKey);
        if (error) {
          errors[fieldKey] = error;
          isValid = false;
        }

        if (field.sousRubriques && field.sousRubriques.length > 0) {
          validateFields(field.sousRubriques, fieldKey);
        }
      });
    };

    validateFields(selectedTax.formulaire_json.formulaire);

    setValidationErrors((prev) => ({
      ...prev,
      [formIndex]: errors,
    }));

    return isValid;
  };

  const validateAllForms = (): boolean => {
    let allValid = true;

    for (let i = 0; i < declarationCount; i++) {
      if (!validateForm(i)) {
        allValid = false;
      }
    }

    return allValid;
  };

  const validerChampsObligatoiresAvecIA = async (): Promise<boolean> => {
    if (!selectedTax?.formulaire_json?.formulaire) return false;

    setLoading(true);

    try {
      const result = await verifierChampsObligatoiresAvecIA(
        formsData,
        selectedTax.formulaire_json.formulaire
      );

      if (result.status === "success" && result.data) {
        const validationResult = result.data;

        if (!validationResult.formulaire_valide) {
          setError(`Champs obligatoires manquants: ${validationResult.champs_manquants?.join(", ")}`);
          return false;
        }

        return true;
      } else {
        console.warn("Validation IA échouée, utilisation de la validation manuelle");
        return validateAllForms();
      }
    } catch (error) {
      console.error("Erreur lors de la validation IA:", error);
      return validateAllForms();
    } finally {
      setLoading(false);
    }
  };

  const resetApplication = (): void => {
    setStep(1);
    setNif("");
    setSelectedTax(null);
    setDeclarationCount(1);
    setFormsData([]);
    setShowPaymentModal(false);
    setShowReceiptModal(false);
    setSelectedPaymentMethod(null);
    setPaymentFields({});
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
    setPreRemplissageLoading(false);
    setShowPlaqueModal(false);
    setNumeroPlaque("");
    setDeclarationsExistantes([]);
  };

  const handlePreRemplissageAutomatique = async (): Promise<void> => {
    if (!selectedTax?.formulaire_json?.formulaire || !contribuable) return;

    setPreRemplissageLoading(true);
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

    setPreRemplissageLoading(false);
  };

  const calculateAmount = (): number => {
    if (montantCalcule > 0) {
      return montantCalcule;
    }
    return declarationCount * 15000;
  };

  const nextStep = (): void => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = (): void => {
    if (step > 1) setStep(step - 1);
  };

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

  const handleFormSubmit = (formIndex: number, field: string, value: string): void => {
    const newFormsData = [...formsData];
    if (!newFormsData[formIndex]) newFormsData[formIndex] = {};
    newFormsData[formIndex][field] = value;
    setFormsData(newFormsData);

    if (validationErrors[formIndex]?.[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        if (newErrors[formIndex]) {
          delete newErrors[formIndex][field];
        }
        return newErrors;
      });
    }
  };

  const handlePaymentFieldChange = (fieldName: string, value: string): void => {
    setPaymentFields((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // CORRECTION : Logique de calcul améliorée avec gestion d'erreur
  const handleDeclarationSubmit = async (): Promise<void> => {
    if (!selectedTax) {
      setError("Veuillez sélectionner un impôt");
      return;
    }

    const validationReussie = await validerChampsObligatoiresAvecIA();
    if (!validationReussie) {
      return;
    }

    setLoading(true);
    setError("");

    let montantFinal = declarationCount * 15000;
    let calculAvecFormuleUtilisateur = false;
    let calculAvecFormuleIA = false;

    // CORRECTION : Logique de calcul avec priorité absolue pour IMMATRICULATION PLAQUES
    if (selectedTax.nom === "IMMATRICULATION PLAQUES") {
      if (formuleUtilisateur) {
        // PRIORITÉ ABSOLUE : Formule utilisateur pour IMMATRICULATION PLAQUES
        const resultCalcul = await calculerMontantAvecFormuleUtilisateur(
          formuleUtilisateur,
          formsData,
          declarationCount
        );

        if (resultCalcul.status === "success") {
          montantFinal = resultCalcul.data;
          setMontantCalcule(montantFinal);
          calculAvecFormuleUtilisateur = true;
          setUtilisationIA(true);
          setSuccess(`Montant calculé avec votre formule: ${montantFinal.toLocaleString()} USD`);
        } else {
          setError("Erreur lors du calcul avec votre formule personnalisée: " + (resultCalcul.message || "Calcul impossible"));
          setLoading(false);
          return;
        }
      } else {
        setError("Aucune formule personnalisée trouvée pour l'immatriculation des plaques");
        setLoading(false);
        return;
      }
    } else if (selectedTax.formulaire_json?.calcul?.formule) {
      // CALCUL AVEC FORMULE IA pour les autres taxes
      const resultCalculIA = await calculerMontantAvecIA(
        selectedTax.formulaire_json.calcul.formule,
        formsData,
        declarationCount
      );

      if (resultCalculIA.status === "success") {
        montantFinal = resultCalculIA.data;
        setMontantCalcule(montantFinal);
        calculAvecFormuleIA = true;
        setUtilisationIA(true);
        setSuccess(`Montant calculé avec l'IA: ${montantFinal.toLocaleString()} USD`);
      } else {
        console.warn("Calcul IA échoué, utilisation du calcul par défaut");
        setSuccess("Calcul par défaut appliqué");
      }
    } else {
      setSuccess("Calcul standard appliqué");
    }

    const utilisateurId = userType === "utilisateur" ? utilisateur?.id : undefined;
    const siteCode = userType === "utilisateur" ? utilisateur?.site_code : undefined;

    const result = await enregistrerDeclaration(
      selectedTax.id,
      montantFinal,
      formsData,
      utilisateurId,
      siteCode
    );

    if (result.status === "success") {
      setDeclarationReference(result.data.reference);
      setIdDeclaration(result.data.id_declaration);
      nextStep();
    } else {
      setError(result.message || "Erreur lors de l'enregistrement de la déclaration");
    }

    setLoading(false);
  };

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
      setError(result.message || "Erreur lors de la suppression de la déclaration");
    }

    setLoading(false);
  };

  const handlePayment = async (): Promise<void> => {
    if (!idDeclaration || !selectedPaymentMethod) {
      setError("Veuillez sélectionner un mode de paiement");
      return;
    }

    const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentMethod);
    if (selectedMethod?.fields) {
      for (const field of selectedMethod.fields) {
        if (field.required && !paymentFields[field.name]) {
          setError(`Veuillez remplir le champ: ${field.label}`);
          return;
        }
      }
    }

    setLoading(true);
    setError("");

    const result = await traiterPaiement(
      idDeclaration,
      selectedPaymentMethod,
      0,
      paymentFields
    );

    if (result.status === "success") {
      setPaymentReference(result.data.reference_paiement);
      setSuccess("Paiement effectué avec succès");
      setShowPaymentModal(false);
      setShowReceiptModal(true);
    } else {
      setError(result.message || "Erreur lors du traitement du paiement");
    }

    setLoading(false);
  };

  const handlePrintRecto = (): void => {
    const rectoContent = document.getElementById("carte-recto");
    if (rectoContent) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Carte Rose - Recto</title>
              <meta charset="UTF-8">
              <style>
                @page { size: 85.6mm 53.98mm; margin: 2mm; }
                @media print {
                  body { margin: 0; padding: 0; background: white; font-family: Arial, sans-serif; font-size: 8px; line-height: 1.2; width: 85.6mm; height: 53.98mm; }
                  .no-print { display: none !important; }
                }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: white; font-size: 8px; line-height: 1.2; }
                .carte-recto { width: 85.6mm; height: 53.98mm; border: 1px solid #000; padding: 3mm; position: relative; }
                .header-carte { text-align: center; margin-bottom: 2mm; border-bottom: 1px solid #000; padding-bottom: 1mm; }
                .institution-name { font-size: 9px; font-weight: bold; }
                .titre-carte { font-size: 8px; font-weight: bold; }
                .table-info { width: 100%; border-collapse: collapse; font-size: 7px; }
                .table-info td { padding: 1px 2px; vertical-align: top; }
                .table-info .label { font-weight: bold; width: 25mm; }
                .qr-code { position: absolute; bottom: 3mm; right: 3mm; width: 15mm; height: 15mm; }
              </style>
            </head>
            <body>${rectoContent.innerHTML}</body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const handlePrintVerso = (): void => {
    const versoContent = document.getElementById("carte-verso");
    if (versoContent) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Carte Rose - Verso</title>
              <meta charset="UTF-8">
              <style>
                @page { size: 85.6mm 53.98mm; margin: 2mm; }
                @media print {
                  body { margin: 0; padding: 0; background: white; font-family: Arial, sans-serif; font-size: 8px; line-height: 1.2; width: 85.6mm; height: 53.98mm; }
                  .no-print { display: none !important; }
                }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: white; font-size: 8px; line-height: 1.2; }
                .carte-verso { width: 85.6mm; height: 53.98mm; border: 1px solid #000; padding: 3mm; position: relative; }
                .header-carte { text-align: center; margin-bottom: 2mm; border-bottom: 1px solid #000; padding-bottom: 1mm; }
                .institution-name { font-size: 9px; font-weight: bold; }
                .table-info { width: 100%; border-collapse: collapse; font-size: 7px; }
                .table-info td { padding: 1px 2px; vertical-align: top; }
                .table-info .label { font-weight: bold; width: 25mm; }
                .signature { position: absolute; bottom: 3mm; right: 3mm; font-size: 6px; text-align: center; }
                .separator { border-top: 1px dashed #000; margin: 2mm 0; }
              </style>
            </head>
            <body>${versoContent.innerHTML}</body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const handlePrintComplete = (): void => {
    handlePrintRecto();
    setTimeout(() => {
      if (confirm("Veuillez retourner la carte dans l'imprimante puis cliquez sur OK pour imprimer le verso.")) {
        handlePrintVerso();
      }
    }, 2000);
  };

  const SkeletonFormField = ({ hasSubFields = false }: { hasSubFields?: boolean }) => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
      </div>
      <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
      {hasSubFields && (
        <div className="ml-6 mt-4 pl-6 border-l-2 border-blue-200 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      )}
    </div>
  );

  const renderFormFields = (fields: FormField[], formIndex: number, parentField = "") => {
    return fields.map((field, fieldIndex) => {
      const fieldKey = parentField ? `${parentField}_${field.champ}` : field.champ;
      const fieldId = `form-${formIndex}-${fieldKey}`;
      const valeurActuelle = formsData[formIndex]?.[fieldKey] || "";
      const estPreRempliParIA = preRemplissageEffectue && valeurActuelle && formsData[formIndex]?.[fieldKey] !== undefined;
      const estFacultatif =
        field.champ.toLowerCase().includes("e-mail") ||
        field.champ.toLowerCase().includes("email") ||
        field.champ.toLowerCase().includes("numéro telephone 2") ||
        field.champ.toLowerCase().includes("téléphone 2");
      const erreurValidation = validationErrors[formIndex]?.[fieldKey];
      const estRequis = field.requis !== false && !estFacultatif;

      return (
        <div key={fieldIndex} className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor={fieldId} className="block text-sm font-semibold text-gray-700">
              {field.champ} {estRequis && <span className="text-red-500">*</span>}
              {estFacultatif && <span className="text-blue-500 text-xs ml-1">(facultatif)</span>}
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFormSubmit(formIndex, fieldKey, e.target.value)}
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFormSubmit(formIndex, fieldKey, e.target.value)}
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

          {field.type === "email" && (
            <>
              <input
                type="email"
                id={fieldId}
                value={valeurActuelle as string}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFormSubmit(formIndex, fieldKey, e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${
                  erreurValidation ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                placeholder="exemple@email.com"
              />
              {erreurValidation && (
                <div className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {erreurValidation}
                </div>
              )}
            </>
          )}

          {field.type === "telephone" && (
            <>
              <input
                type="tel"
                id={fieldId}
                value={valeurActuelle as string}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFormSubmit(formIndex, fieldKey, e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${
                  erreurValidation ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                placeholder="+243 XX XXX XX XX"
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
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFormSubmit(formIndex, fieldKey, e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${
                  erreurValidation ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
              >
                <option value="">Sélectionnez une option</option>
                {field.options.map((option, optIndex) => (
                  <option key={optIndex} value={typeof option === "string" ? option : option.valeur}>
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

  const renderPlaqueModal = (): React.ReactElement => (
    <Portal>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-2xl">
            <h3 className="text-xl font-bold text-white">Recherche de plaque</h3>
            <p className="text-blue-100 mt-1">Entrez le numéro de plaque à reproduire</p>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Numéro de plaque <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={numeroPlaque}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumeroPlaque(e.target.value)}
                placeholder="Ex: ABC123"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                disabled={recherchePlaqueLoading}
              />
              <p className="text-sm text-gray-500 mt-2">Le système recherchera cette plaque dans vos déclarations existantes</p>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
            <div className="flex justify-between pt-4">
              <button
                onClick={() => { setShowPlaqueModal(false); setNumeroPlaque(""); setError(""); }}
                className="px-6 py-2 text-gray-600 font-medium hover:text-gray-800 transition duration-200"
                disabled={recherchePlaqueLoading}
              >Annuler</button>
              <button
                onClick={handleRecherchePlaque}
                disabled={!numeroPlaque.trim() || recherchePlaqueLoading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {recherchePlaqueLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : null}
                {recherchePlaqueLoading ? "Recherche..." : "Rechercher"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );

  const renderStep1 = (): React.ReactElement => (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <User className="text-white" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Identification du contribuable</h2>
        <p className="text-gray-600">Entrez votre numéro d'identification fiscale pour commencer</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Numéro NIF / Telephone<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nif}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNif(e.target.value)}
              placeholder=""
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
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div> : null}
            {loading ? "Vérification..." : "Vérifier le NIF"}
            <ArrowRight className="ml-2" size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep2 = (): React.ReactElement => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="text-white" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Sélection de l'impôt</h2>
        <p className="text-gray-600">Choisissez le type d'impôt et le nombre de déclarations</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* CORRECTION : Afficher la formule utilisateur seulement si elle existe */}
        {formuleUtilisateur && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-center text-blue-700 mb-2">
              <User className="mr-2" size={20} />
              <span className="font-semibold">Votre formule personnalisée</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-300">
              <code className="text-sm text-blue-800 font-mono break-all">{formuleUtilisateur}</code>
            </div>
            <p className="text-blue-600 text-sm mt-2">
              {selectedTax?.nom === "IMMATRICULATION PLAQUES" 
                ? "Cette formule sera utilisée OBLIGATOIREMENT pour l'immatriculation des plaques"
                : "Cette formule est disponible pour les calculs personnalisés"}
            </p>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type d'impôt <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedTax?.id || ""}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const tax = taxOptions.find((tax) => tax.id === parseInt(e.target.value)) || null;
                setSelectedTax(tax);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            >
              <option value="">Sélectionnez un impôt</option>
              {taxOptions.map((tax) => (
                <option key={tax.id} value={tax.id}>{tax.nom}</option>
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeclarationCount(parseInt(e.target.value) || 1)}
              disabled={selectedTax?.nom === "REPRODUCTION DES CARTES ROSE"}
              className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${
                selectedTax?.nom === "REPRODUCTION DES CARTES ROSE" ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
            />
            {selectedTax?.nom === "REPRODUCTION DES CARTES ROSE" && (
              <p className="text-sm text-blue-600 mt-2">ⓘ Figé à 1 pour la reproduction de carte</p>
            )}
          </div>
        </div>
        {selectedTax?.nom === "REPRODUCTION DES CARTES ROSE" && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center text-blue-700">
              <AlertCircle className="mr-2" size={18} />
              <span className="font-semibold">Reproduction de carte</span>
            </div>
            <p className="text-blue-600 text-sm mt-1">
              Pour reproduire une carte, le système recherchera automatiquement vos déclarations existantes. Entrez le numéro de plaque lorsque demandé.
            </p>
          </div>
        )}
        {/* CORRECTION : Affichage conditionnel selon le type de taxe */}
        <div className="mt-6 space-y-3">
          {selectedTax?.nom === "IMMATRICULATION PLAQUES" ? (
            formuleUtilisateur ? (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center text-green-700">
                  <CheckCircle className="mr-2" size={18} />
                  <span className="font-semibold">Calcul personnalisé OBLIGATOIRE</span>
                </div>
                <p className="text-green-600 text-sm mt-1">
                  Le montant sera calculé OBLIGATOIREMENT avec votre formule personnalisée pour l'immatriculation
                </p>
              </div>
            ) : (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center text-red-700">
                  <AlertCircle className="mr-2" size={18} />
                  <span className="font-semibold">Formule personnalisée requise</span>
                </div>
                <p className="text-red-600 text-sm mt-1">
                  L'immatriculation des plaques nécessite une formule personnalisée. Contactez l'administrateur.
                </p>
              </div>
            )
          ) : selectedTax?.formulaire_json?.calcul ? (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center text-blue-700">
                <Brain className="mr-2" size={18} />
                <span className="font-semibold">Calcul intelligent disponible</span>
              </div>
              <p className="text-blue-600 text-sm mt-1">
                L'IA calculera automatiquement le montant basé sur la formule de l'impôt
              </p>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center text-gray-700">
                <AlertCircle className="mr-2" size={18} />
                <span className="font-semibold">Calcul standard</span>
              </div>
              <p className="text-gray-600 text-sm mt-1">Montant calculé selon le tarif standard</p>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-100">
          <button onClick={prevStep} className="flex items-center text-gray-600 font-medium hover:text-gray-800 transition duration-200">
            <ArrowLeft className="mr-2" size={18} /> Retour
          </button>
          <button
            onClick={nextStep}
            disabled={!selectedTax || (selectedTax.nom === "IMMATRICULATION PLAQUES" && !formuleUtilisateur)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-8 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            Continuer
            <ArrowRight className="ml-2" size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep3 = (): React.ReactElement => {
    if (!selectedTax || !selectedTax.formulaire_json || !selectedTax.formulaire_json.formulaire) {
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Déclaration - {selectedTax.nom}</h2>
          <p className="text-gray-600">
            {preRemplissageEffectue
              ? "Formulaire pré-rempli automatiquement par l'IA ✓"
              : preRemplissageLoading
              ? "L'IA pré-remplit automatiquement vos formulaires..."
              : "Remplissez les informations requises pour chaque déclaration"}
          </p>
        </div>
        {preRemplissageLoading && (
          <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center text-purple-700">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mr-3"></div>
              <span className="font-semibold">L'IA travaille pour vous...</span>
            </div>
            <p className="text-purple-600 text-sm mt-1">Analyse des données et pré-remplissage intelligent en cours</p>
          </div>
        )}
        {!preRemplissageLoading && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center text-blue-700">
              <AlertCircle size={16} className="mr-2" />
              <span className="font-semibold">Champs obligatoires</span>
            </div>
            <p className="text-blue-600 text-sm mt-1">
              Tous les champs marqués d'un astérisque (*) sont obligatoires. Les champs "E-mail" et "Numéro telephone 2" sont facultatifs. Veuillez remplir complètement chaque déclaration avant de continuer.
            </p>
          </div>
        )}
        {utilisationIA && !preRemplissageLoading && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center text-green-700">
              <Sparkles className="mr-2" size={20} />
              <span className="font-semibold">Assistance IA active</span>
            </div>
            <p className="text-green-600 text-sm mt-1">L'intelligence artificielle vous assiste dans le remplissage et le calcul</p>
          </div>
        )}
        <div className="space-y-6">
          {Array.from({ length: declarationCount }).map((_, formIndex) => (
            <div key={formIndex} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm mr-3">
                    {formIndex + 1}
                  </div>
                  Déclaration #{formIndex + 1}
                  {preRemplissageEffectue && !preRemplissageLoading && (
                    <span className="ml-2 flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      <Sparkles size={12} className="mr-1" />
                      Pré-remplissage IA
                    </span>
                  )}
                </h3>
              </div>
              <div className="p-6">
                {preRemplissageLoading ? (
                  <div className="space-y-4 animate-pulse">
                    {selectedTax.formulaire_json.formulaire.map((field: FormField, index: number) => (
                      <SkeletonFormField key={index} hasSubFields={!!field.sousRubriques && field.sousRubriques.length > 0} />
                    ))}
                    <div className="flex justify-center py-4">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">L'IA pré-remplit vos formulaires...</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">{renderFormFields(selectedTax.formulaire_json.formulaire, formIndex)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-6 mt-6">
          <button onClick={prevStep} className="flex items-center text-gray-600 font-medium hover:text-gray-800 transition duration-200">
            <ArrowLeft className="mr-2" size={18} /> Retour
          </button>
          <button
            onClick={handleDeclarationSubmit}
            disabled={loading || preRemplissageLoading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-8 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div> : null}
            {loading ? "Validation..." : "Valider et continuer"}
            <ArrowRight className="ml-2" size={18} />
          </button>
        </div>
      </div>
    );
  };

  const renderStep4 = (): React.ReactElement => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-white" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Récapitulatif de la transaction</h2>
        <p className="text-gray-600">Vérifiez les informations avant de procéder au paiement</p>
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
                    {contribuable?.prenom ? `${contribuable.prenom} ${contribuable.nom}` : contribuable?.nom}
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
                  <span className="font-medium text-blue-600">{declarationReference}</span>
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
                    {selectedTax?.nom === "IMMATRICULATION PLAQUES" && formuleUtilisateur
                      ? "Calculé avec votre formule"
                      : "Calculé par IA"}
                  </span>
                )}
              </h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{calculateAmount().toLocaleString()} USD</div>
                <p className="text-gray-600 text-sm">
                  Total pour {declarationCount} déclaration(s)
                  {montantCalcule > 0 &&
                    (selectedTax?.nom === "IMMATRICULATION PLAQUES" && formuleUtilisateur
                      ? " • Calcul avec votre formule personnalisée"
                      : " • Calcul intelligent avec IA")}
                </p>
                {/* CORRECTION : Afficher la formule utilisateur seulement pour IMMATRICULATION PLAQUES */}
                {selectedTax?.nom === "IMMATRICULATION PLAQUES" && formuleUtilisateur && (
                  <div className="mt-3 p-2 bg-white rounded-lg border border-blue-200">
                    <code className="text-xs text-blue-700 font-mono break-all">{formuleUtilisateur}</code>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Aperçu des données</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                <pre className="text-sm text-gray-600">{JSON.stringify(formsData, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <button onClick={prevStep} className="flex items-center text-gray-600 font-medium hover:text-gray-800 transition duration-200">
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
                <Download className="mr-2" size={18} /> Carte
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

  const renderPaymentModal = (): React.ReactElement => {
    const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentMethod);

    return (
      <Portal>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <h3 className="text-xl font-bold text-white">Mode de paiement</h3>
              <p className="text-blue-100 mt-1">Choisissez votre méthode de paiement préférée</p>
            </div>
            <div className="p-6">
              <div className="space-y-3 mb-6">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <div
                      key={method.id}
                      onClick={() => { setSelectedPaymentMethod(method.id); setPaymentFields({}); }}
                      className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition duration-200 ${
                        selectedPaymentMethod === method.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`p-2 rounded-lg mr-4 ${selectedPaymentMethod === method.id ? "bg-blue-500" : "bg-gray-100"}`}>
                        <Icon className={selectedPaymentMethod === method.id ? "text-white" : "text-gray-600"} size={20} />
                      </div>
                      <span className="font-semibold">{method.name}</span>
                    </div>
                  );
                })}
              </div>
              {selectedMethod?.fields && selectedMethod.fields.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3">Informations {selectedMethod.name}</h4>
                  <div className="space-y-3">
                    {selectedMethod.fields.map((field) => (
                      <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <input
                          type={field.type}
                          value={paymentFields[field.name] || ""}
                          onChange={(e) => handlePaymentFieldChange(field.name, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                          required={field.required}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => { setShowPaymentModal(false); setSelectedPaymentMethod(null); setPaymentFields({}); }}
                  className="px-6 py-2 text-gray-600 font-medium hover:text-gray-800 transition duration-200"
                >Annuler</button>
                <button
                  onClick={handlePayment}
                  disabled={!selectedPaymentMethod || loading}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : null}
                  {loading ? "Traitement..." : "Confirmer le paiement"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Portal>
    );
  };

  const renderReceiptModal = (): React.ReactElement => {
    return (
      <Portal>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Carte Rose - Format CR-80</h3>
                <p className="text-blue-100 text-sm">
                  Référence: {paymentReference} | {formsData.length} carte(s) à imprimer
                </p>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-white hover:text-blue-200 transition duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid md:grid-cols-2 gap-8 mb-6">
                <div className="text-center">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center justify-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                    Recto de la Carte
                  </h4>
                  <div className="border-2 border-blue-300 rounded-lg p-6 bg-white inline-block">
                    <div id="carte-recto">
                      {formsData.map((declarationData, index) => {
                        const nom = declarationData["Nom"] || declarationData["nom"] || "-";
                        const prenom = declarationData["Prénom"] || declarationData["prenom"] || "-";
                        const adresse = declarationData["Adresse physique"] || declarationData["adresse_physique"] || "-";
                        const nifContribuable = nif || "-";
                        const anneeCirculation = declarationData["Année de circulation"] || declarationData["annee_circulation"] || "-";
                        const numeroPlaque = declarationData["Numéro de plaque"] || declarationData["numero_plaque"] || "-";

                        return (
                          <div
                            key={index}
                            className="carte-recto mx-auto"
                            style={{
                              width: "85.6mm",
                              height: "53.98mm",
                              border: "1px solid #000",
                              padding: "3mm",
                              position: "relative",
                              background: "white",
                              transform: "scale(0.7)",
                              transformOrigin: "top center",
                              marginBottom: "20px",
                            }}
                          >
                            <div className="header-carte" style={{ textAlign: "center", marginBottom: "2mm", borderBottom: "1px solid #000", paddingBottom: "1mm" }}>
                              <div className="institution-name" style={{ fontSize: "9px", fontWeight: "bold" }}>
                                RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                              </div>
                              <div className="titre-carte" style={{ fontSize: "8px", fontWeight: "bold" }}>
                                CARTE ROSE - DIRECTION GÉNÉRALE DES RECETTES DU KINSHASA
                              </div>
                            </div>
                            <table className="table-info" style={{ width: "100%", borderCollapse: "collapse", fontSize: "7px" }}>
                              <tbody>
                                <tr>
                                  <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>Nom:</td>
                                  <td>{nom}</td>
                                </tr>
                                <tr>
                                  <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>Prénom:</td>
                                  <td>{prenom}</td>
                                </tr>
                                <tr>
                                  <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>Adresse:</td>
                                  <td>{adresse}</td>
                                </tr>
                                <tr>
                                  <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>N. Impôt:</td>
                                  <td>{nifContribuable}</td>
                                </tr>
                                <tr>
                                  <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>Année circulation:</td>
                                  <td>{anneeCirculation}</td>
                                </tr>
                                <tr>
                                  <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>N. Plaque:</td>
                                  <td><strong>{numeroPlaque}</strong></td>
                                </tr>
                              </tbody>
                            </table>
                            <div className="qr-code" style={{ position: "absolute", bottom: "3mm", right: "3mm", width: "15mm", height: "15mm" }}>
                              <QRCodeSVG value={numeroPlaque.toString()} size={60} level="M" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center justify-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                    Verso de la Carte
                  </h4>
                  <div className="border-2 border-green-300 rounded-lg p-6 bg-white inline-block">
                    <div id="carte-verso">
                      {formsData.map((declarationData, index) => {
                        const marque = declarationData["Marque"] || declarationData["marque"] || "-";
                        const usage = declarationData["Usage"] || declarationData["usage"] || "-";
                        const numeroChassis = declarationData["Numéro de châssis"] || declarationData["numero_chassis"] || "-";
                        const numeroMoteur = declarationData["Numéro de moteur"] || declarationData["numero_moteur"] || "-";
                        const anneeFabrication = declarationData["Année de fabrication"] || declarationData["annee_fabrication"] || "-";
                        const couleur = declarationData["Couleur"] || declarationData["couleur"] || "-";
                        const puissanceFiscal = declarationData["Puissance Fiscal"] || declarationData["puissance_fiscal"] || "-";

                        return (
                          <div
                            key={index}
                            className="carte-verso mx-auto"
                            style={{
                              width: "85.6mm",
                              height: "53.98mm",
                              border: "1px solid #000",
                              padding: "3mm",
                              position: "relative",
                              background: "white",
                              transform: "scale(0.7)",
                              transformOrigin: "top center",
                              marginBottom: "20px",
                            }}
                          >
                            <div className="header-carte" style={{ textAlign: "center", marginBottom: "2mm", borderBottom: "1px solid #000", paddingBottom: "1mm" }}>
                              <div className="institution-name" style={{ fontSize: "9px", fontWeight: "bold" }}>
                                INFORMATIONS DU VÉHICULE
                              </div>
                            </div>
                            <table className="table-info" style={{ width: "100%", borderCollapse: "collapse", fontSize: "7px" }}>
                              <tbody>
                                <tr>
                                  <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>Marque:</td>
                                  <td>{marque}</td>
                                </tr>
                                <tr>
                                  <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>Usage:</td>
                                  <td>{usage}</td>
                                </tr>
                                <tr>
                                  <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>N. Châssis:</td>
                                  <td>{numeroChassis}</td>
                                </tr>
                                <tr>
                                  <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>N. Moteur:</td>
                                  <td>{numeroMoteur}</td>
                                </tr>
                                <tr>
                                  <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>Année fabrication:</td>
                                  <td>{anneeFabrication}</td>
                                </tr>
                                <tr>
                                  <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>Couleur:</td>
                                  <td>{couleur}</td>
                                </tr>
                                <tr>
                                  <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>Puissance fiscal:</td>
                                  <td>{puissanceFiscal}</td>
                                </tr>
                              </tbody>
                            </table>
                            <div className="signature" style={{ position: "absolute", bottom: "3mm", right: "3mm", fontSize: "6px", textAlign: "center" }}>
                              <div>Signature</div>
                              <div className="separator" style={{ borderTop: "1px dashed #000", margin: "2mm 0" }}></div>
                              <div>Directeur DGRK</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                  <AlertCircle className="mr-2" size={18} />
                  Instructions d'impression
                </h4>
                <div className="text-yellow-700 text-sm space-y-2">
                  <p><strong>Option 1 (Recommandée):</strong> Utilisez "Imprimer Recto" puis "Imprimer Verso" séparément.</p>
                  <p><strong>Option 2:</strong> Utilisez "Imprimer Complet" et suivez les instructions pour retourner la carte.</p>
                  <p><strong>Format:</strong> Carte CR-80 (85.6mm × 53.98mm) - Format carte bancaire</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-center space-x-3 no-print">
              <button onClick={handlePrintRecto} className="flex items-center bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 transition duration-200 text-sm">
                <Printer className="mr-2" size={16} /> Imprimer Recto
              </button>
              <button onClick={handlePrintVerso} className="flex items-center bg-green-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-600 transition duration-200 text-sm">
                <Printer className="mr-2" size={16} /> Imprimer Verso
              </button>
              <button onClick={handlePrintComplete} className="flex items-center bg-purple-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-600 transition duration-200 text-sm">
                <Printer className="mr-2" size={16} /> Imprimer Complet
              </button>
              <button onClick={resetApplication} className="flex items-center bg-gray-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-600 transition duration-200 text-sm">
                <Home className="mr-2" size={16} /> Nouvelle
              </button>
              <button onClick={() => setShowReceiptModal(false)} className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition duration-200 text-sm">
                Fermer
              </button>
            </div>
          </div>
        </div>
      </Portal>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Déclaration et Paiement des Impôts</h1>
          <p className="text-gray-600 text-lg">Processus simplifié de déclaration et paiement en ligne avec assistance IA</p>
        </div>
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
                  {i < 4 && <div className={`w-16 h-1 transition duration-200 ${i < step ? "bg-green-500" : "bg-gray-200"}`} />}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-sm text-gray-600">
              <span className={step >= 1 ? "text-blue-600 font-semibold" : ""}>Identification</span>
              <span className={step >= 2 ? "text-blue-600 font-semibold" : ""}>Impôt</span>
              <span className={step >= 3 ? "text-blue-600 font-semibold" : ""}>Déclaration</span>
              <span className={step >= 4 ? "text-blue-600 font-semibold" : ""}>Paiement</span>
            </div>
          </div>
        </div>
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
        {showPlaqueModal && renderPlaqueModal()}
        {showPaymentModal && renderPaymentModal()}
        {showReceiptModal && renderReceiptModal()}
      </div>
    </div>
  );
};

export default PaiementPage;