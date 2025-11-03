"use client";
import {
  AlertCircle,
  ArrowLeft,
  BadgeDollarSign,
  Brain,
  Building,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  FileCheck,
  FileText,
  Home,
  Printer,
  Search,
  Smartphone,
  Sparkles,
  User
} from "lucide-react";
import React, { useState } from "react";

// Import des services
import { calculerPenalitesAvecIA } from "@/services/ia/geminiService";
import {
  rechercherDeclaration,
  traiterPaiementAvecRepartition
} from "@/services/paiement/paiementService";
import { QRCodeSVG } from "qrcode.react";

// Types TypeScript
interface Declaration {
  id: number;
  reference: string;
  nif_contribuable: string;
  type_contribuable: string;
  id_impot: number;
  montant: number;
  statut: string;
  donnees_json: any;
  date_creation: string;
  date_modification: string;
  nom_impot: string;
  description_impot: string;
  formulaire_json: any;
  periode: string;
  delai_accord: number;
  penalites: any;
  nom_contribuable: string;
  prenom_contribuable: string;
  adresse?: string;
  telephone?: string;
  email?: string;
}

interface PaymentMethod {
  id: number;
  name: string;
  icon: React.ComponentType<any>;
  fields?: PaymentField[];
}

interface PaymentField {
  type: "text" | "number" | "tel" | "email";
  name: string;
  label: string;
  required: boolean;
  placeholder?: string;
}

// Options de paiement avec champs supplémentaires
const paymentMethods: PaymentMethod[] = [
  { 
    id: 1, 
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
    ]
  },
  { 
    id: 2, 
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
    ]
  },
  { 
    id: 3, 
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
    ]
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
    ]
  },
  { 
    id: 5, 
    name: "Cash", 
    icon: DollarSign 
  },
];

const RechercheDeclarationPage: React.FC = () => {
  const [numeroDeclaration, setNumeroDeclaration] = useState<string>("");
  const [declaration, setDeclaration] = useState<Declaration | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [showCarteModal, setShowCarteModal] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | null>(null);
  const [paymentFields, setPaymentFields] = useState<{ [key: string]: string }>({});
  const [paymentReference, setPaymentReference] = useState<string>("");

  // États pour les pénalités IA
  const [penalites, setPenalites] = useState<any>(null);
  const [calculPenalitesEnCours, setCalculPenalitesEnCours] = useState<boolean>(false);
  const [utilisationIA, setUtilisationIA] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  // Vérifier si la déclaration contient des données d'immatriculation
  const hasImmatriculationData = (): boolean => {
    if (!declaration?.donnees_json) return false;
    
    const data = Array.isArray(declaration.donnees_json) 
      ? declaration.donnees_json[0] 
      : declaration.donnees_json;
    
    return !!(data?.["Numéro de plaque"] || data?.["numero_plaque"] || 
              data?.["Marque"] || data?.["marque"] ||
              data?.["Numéro de châssis"] || data?.["numero_chassis"]);
  };

  // Simuler la recherche d'une déclaration
  const handleRechercheDeclaration = async (): Promise<void> => {
    if (!numeroDeclaration.trim()) {
      setError("Veuillez saisir un numéro de déclaration");
      return;
    }

    setLoading(true);
    setError("");
    setDeclaration(null);
    setPenalites(null);
    setUtilisationIA(false);
    setExpandedSections({});

    try {
      const result = await rechercherDeclaration(numeroDeclaration);

      if (result.status === "success") {
        setDeclaration(result.data);
        setError("");
        setUtilisationIA(true);

        // Calculer les pénalités avec IA si la déclaration existe
        await calculerPenalitesAvecIASiNecessaire(result.data);
      } else {
        setError(result.message || "Aucune déclaration trouvée avec ce numéro");
      }
    } catch (error) {
      setError("Erreur lors de la recherche de déclaration");
    }

    setLoading(false);
  };

  // Calculer les pénalités avec IA si nécessaire
  const calculerPenalitesAvecIASiNecessaire = async (declarationData: Declaration): Promise<void> => {
    setCalculPenalitesEnCours(true);

    try {
      const result = await calculerPenalitesAvecIA(
        declarationData.date_creation,
        declarationData.montant,
        {
          periode: declarationData.periode,
          delai_accord: declarationData.delai_accord,
          penalites: declarationData.penalites,
        }
      );

      if (result.status === "success") {
        setPenalites(result.data);
      } else {
        console.warn("Calcul des pénalités IA échoué:", result.message);
        // Calcul manuel de base si l'IA échoue
        setPenalites(calculerPenalitesManuelles(declarationData));
      }
    } catch (error) {
      console.error("Erreur calcul pénalités IA:", error);
      setPenalites(calculerPenalitesManuelles(declarationData));
    }

    setCalculPenalitesEnCours(false);
  };

  // Calcul manuel de base des pénalités (fallback)
  const calculerPenalitesManuelles = (declarationData: Declaration): any => {
    const dateCreation = new Date(declarationData.date_creation);
    const maintenant = new Date();
    const diffTemps = maintenant.getTime() - dateCreation.getTime();
    const joursEcoules = Math.ceil(diffTemps / (1000 * 3600 * 24));
    const delaiAccorde = declarationData.delai_accord || 30;

    // Nombre de délais accordés COMPLÈTEMENT écoulés
    const nombreDelaisEcoules = Math.floor(joursEcoules / delaiAccorde);

    let montantPenalites = 0;
    const penalitesConfig = declarationData.penalites || {
      type: "pourcentage",
      valeur: 10,
    };

    if (nombreDelaisEcoules > 0) {
      if (penalitesConfig.type === "pourcentage") {
        const tauxPenalite = penalitesConfig.valeur / 100;
        montantPenalites = declarationData.montant * tauxPenalite * nombreDelaisEcoules;
      } else if (penalitesConfig.type === "fixe") {
        montantPenalites = penalitesConfig.valeur * nombreDelaisEcoules;
      }
    }

    const montantTotal = declarationData.montant + montantPenalites;

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

  // Calculer le montant total à payer (avec pénalités si applicable)
  const calculerMontantTotal = (): number => {
    if (!declaration) return 0;

    if (penalites && penalites.montant_total) {
      return penalites.montant_total;
    }

    return declaration.montant;
  };

  // Obtenir le montant des pénalités
  const getMontantPenalites = (): number => {
    if (!penalites) return 0;
    return penalites.montant_penalites || 0;
  };

  // Toggle l'expansion des sections
  const toggleSection = (key: string): void => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Gestion des champs de paiement
  const handlePaymentFieldChange = (fieldName: string, value: string): void => {
    setPaymentFields((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Fonctions d'impression de carte
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
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
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
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    }
  };

  const handlePrintComplete = (): void => {
    handlePrintRecto();
    setTimeout(() => {
      if (confirm("Veuillez retourner la carte dans l'imprimante puis cliquez sur OK pour imprimer le verso.")) {
        handlePrintVerso();
      }
    }, 1000);
  };

  // Afficher les données JSON de la déclaration de manière lisible
  const afficherDonneesJSON = (donnees: any): React.ReactElement => {
    if (!donnees || Object.keys(donnees).length === 0) {
      return (
        <div className="text-gray-500 text-center py-4">
          Aucune donnée supplémentaire
        </div>
      );
    }

    const renderValue = (value: any, depth: number = 0, parentKey: string = ""): React.ReactElement => {
      if (value === null || value === undefined) {
        return <span className="text-gray-400 italic">null</span>;
      }

      if (Array.isArray(value)) {
        if (value.length === 0) {
          return <span className="text-gray-400 italic">[]</span>;
        }

        const sectionKey = `${parentKey}-array`;
        const isExpanded = expandedSections[sectionKey];

        return (
          <div>
            <button
              onClick={() => toggleSection(sectionKey)}
              className="flex items-center text-blue-600 hover:text-blue-800 transition duration-200 mb-1"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="ml-1 text-sm">
                Tableau ({value.length} élément{value.length > 1 ? "s" : ""})
              </span>
            </button>

            {isExpanded && (
              <div className="ml-4 border-l-2 border-gray-200 pl-2">
                {value.map((item, index) => (
                  <div key={index} className="mb-2">
                    <div className="text-gray-500 text-sm">[{index}]:</div>
                    <div className="ml-2">
                      {renderValue(item, depth + 1, `${parentKey}-${index}`)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      if (typeof value === "object") {
        const keys = Object.keys(value);
        if (keys.length === 0) {
          return <span className="text-gray-400 italic">{"{}"}</span>;
        }

        const sectionKey = `${parentKey}-object`;
        const isExpanded = expandedSections[sectionKey];

        return (
          <div>
            <button
              onClick={() => toggleSection(sectionKey)}
              className="flex items-center text-blue-600 hover:text-blue-800 transition duration-200 mb-1"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="ml-1 text-sm">
                Objet ({keys.length} propriété{keys.length > 1 ? "s" : ""})
              </span>
            </button>

            {isExpanded && (
              <div className="ml-4 border-l-2 border-gray-200 pl-2">
                {keys.map((key) => (
                  <div key={key} className="mb-2">
                    <div className="font-medium text-gray-700 capitalize">
                      {key.replace(/_/g, " ")}:
                    </div>
                    <div className="ml-2">
                      {renderValue(value[key], depth + 1, `${parentKey}-${key}`)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      // Pour les valeurs simples
      return (
        <span
          className={`${
            typeof value === "number"
              ? "text-green-600 font-medium"
              : typeof value === "boolean"
              ? "text-purple-600 font-medium"
              : "text-gray-800"
          } break-words`}
        >
          {String(value)}
        </span>
      );
    };

    // Si c'est un tableau (cas des déclarations multiples)
    if (Array.isArray(donnees)) {
      return (
        <div className="space-y-4">
          {donnees.map((item, index) => {
            const qrDataDeclaration = JSON.stringify({
              type: "declaration_recherche",
              numero: index + 1,
              reference: `${declaration?.reference}-${index + 1}`,
              nif: declaration?.nif_contribuable,
              data: item,
            });

            return (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* QR Code Mini */}
                  <div className="flex-shrink-0">
                    <div className="bg-white p-2 border border-gray-200 rounded-lg">
                      <QRCodeSVG
                        value={qrDataDeclaration}
                        size={60}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                    <div className="text-xs text-center text-gray-500 mt-1">
                      Déclaration #{index + 1}
                    </div>
                  </div>

                  {/* Détails de la déclaration */}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-700 mb-2 flex items-center">
                      <FileText size={16} className="mr-2" />
                      Déclaration #{index + 1}
                    </div>
                    <div className="space-y-2">
                      {Object.entries(item).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-start text-sm">
                          <span className="text-gray-600 capitalize">
                            {key.replace(/_/g, " ")}:
                          </span>
                          <div className="font-semibold text-right max-w-[60%]">
                            {renderValue(value, 0, key)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Si c'est un objet simple
    return (
      <div className="space-y-3">
        {Object.entries(donnees).map(([key, value]) => (
          <div key={key} className="flex justify-between items-start py-2 border-b border-gray-100">
            <span className="text-gray-600 capitalize flex-1">
              {key.replace(/_/g, " ")}:
            </span>
            <div className="font-semibold text-right flex-1 max-w-[60%]">
              {renderValue(value, 0, key)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Imprimer le reçu
  const handlePrintReceipt = (): void => {
    const receiptContent = document.getElementById("receipt-content");
    if (receiptContent) {
      const printWindow = window.open("", "_blank");

      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Facture DGRK - ${paymentReference}</title>
              <style>
                @media print {
                  body { margin: 0; padding: 0; }
                  .print-break-before { page-break-before: always; }
                  .print-break-after { page-break-after: always; }
                  .print-break-inside { page-break-inside: avoid; }
                  .no-print { display: none !important; }
                }
                * { box-sizing: border-box; }
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 0; 
                  padding: 20px; 
                  color: #333;
                  background: white;
                }
                .receipt-container { 
                  max-width: 100%; 
                  margin: 0 auto;
                }
                .header { 
                  background: linear-gradient(135deg, #1e40af, #1e3a8a);
                  color: white; 
                  padding: 30px; 
                  border-radius: 16px 16px 0 0;
                }
                .content { 
                  padding: 30px; 
                  border: 1px solid #e5e7eb;
                  border-top: none;
                  border-radius: 0 0 16px 16px;
                }
                .grid-2 { 
                  display: grid; 
                  grid-template-columns: 1fr 1fr; 
                  gap: 30px; 
                  margin-bottom: 30px;
                }
                .info-box { 
                  border: 1px solid #e5e7eb; 
                  border-radius: 12px; 
                  padding: 20px;
                }
                .declaration-item { 
                  border: 1px solid #e5e7eb; 
                  border-radius: 12px; 
                  padding: 20px; 
                  margin-bottom: 20px;
                }
                .qr-section { 
                  display: flex; 
                  justify-content: space-between; 
                  align-items: center; 
                  margin-top: 30px; 
                  padding-top: 30px; 
                  border-top: 1px solid #e5e7eb;
                }
                .total-amount { 
                  font-size: 2.5rem; 
                  font-weight: bold; 
                  color: #059669; 
                  text-align: right;
                }
                .footer { 
                  text-align: center; 
                  margin-top: 30px; 
                  padding-top: 20px; 
                  border-top: 1px solid #e5e7eb; 
                  color: #6b7280;
                }
                @media print {
                  .declaration-item { 
                    page-break-inside: avoid;
                    break-inside: avoid;
                  }
                  .qr-section { 
                    page-break-inside: avoid;
                    break-inside: avoid;
                  }
                }
                @page {
                  size: A4;
                  margin: 20mm;
                }
              </style>
            </head>
            <body>
              ${receiptContent.innerHTML}
            </body>
          </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };

  // Simuler le traitement du paiement AVEC RÉPARTITION
  const handlePayment = async (): Promise<void> => {
    if (!selectedPaymentMethod) {
      setError("Veuillez sélectionner un mode de paiement");
      return;
    }

    if (!declaration) {
      setError("Aucune déclaration sélectionnée");
      return;
    }

    const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentMethod);
    
    // Validation des champs de paiement si nécessaire
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

    try {
      // Récupérer le montant des pénalités
      const montantPenalites = getMontantPenalites();
      const montantTotal = calculerMontantTotal();

      console.log("💰 Données paiement:", {
        idDeclaration: declaration.id,
        montantTotal,
        montantPenalites,
        selectedPaymentMethod,
        paymentFields
      });

      // Utiliser la nouvelle fonction avec répartition
      // Note: Pour la recherche, on considère 1 déclaration (puisqu'on recherche une déclaration spécifique)
      const result = await traiterPaiementAvecRepartition(
        declaration.id,
        selectedPaymentMethod,
        montantTotal,
        1, // nombreDeclarations = 1 pour une recherche
        montantPenalites
      );

      if (result.status === "success") {
        setPaymentReference(result.data.reference_paiement);

        // Afficher les détails de répartition dans les logs
        if (result.data.repartition) {
          console.log("📊 Détails répartition:", result.data.repartition);
        }

        setShowPaymentModal(false);
        setShowReceiptModal(true);
      } else {
        setError(result.message || "Erreur lors du traitement du paiement");
      }
    } catch (error) {
      console.error("❌ Erreur paiement:", error);
      setError("Erreur lors du traitement du paiement");
    }

    setLoading(false);
  };

  // Réinitialiser l'application
  const resetApplication = (): void => {
    setNumeroDeclaration("");
    setDeclaration(null);
    setError("");
    setShowPaymentModal(false);
    setShowReceiptModal(false);
    setShowCarteModal(false);
    setSelectedPaymentMethod(null);
    setPaymentFields({});
    setPaymentReference("");
    setPenalites(null);
    setUtilisationIA(false);
    setExpandedSections({});
  };

  // Étape 1 - Recherche de déclaration
  const renderRechercheStep = (): React.ReactElement => (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Search className="text-white" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Recherche de déclaration
        </h2>
        <p className="text-gray-600">
          Entrez le numéro de déclaration pour retrouver et payer votre impôt
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Numéro de déclaration <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={numeroDeclaration}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNumeroDeclaration(e.target.value.toUpperCase())
              }
              placeholder="Ex: DEC20241225123456"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 uppercase"
            />
          </div>

          {error && !declaration && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
          )}

          <button
            onClick={handleRechercheDeclaration}
            disabled={!numeroDeclaration.trim() || loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : null}
            {loading ? "Recherche en cours..." : "Rechercher la déclaration"}
            <Search className="ml-2" size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  // Étape 2 - Affichage de la déclaration trouvée
  const renderDeclarationStep = (): React.ReactElement => {
    if (!declaration) return renderRechercheStep();

    const montantTotal = calculerMontantTotal();
    const montantPenalites = getMontantPenalites();
    const hasPenalites = montantPenalites > 0;
    const canPrintCarte = hasImmatriculationData();

    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Déclaration trouvée - {declaration.reference}
          </h2>
          <p className="text-gray-600">
            Vérifiez les détails de votre déclaration avant de procéder au
            paiement
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 flex items-center">
              <FileText className="mr-2" size={20} />
              Détails de la déclaration - {declaration.nom_impot}
            </h3>
          </div>

          <div className="p-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Colonne gauche - Informations générales */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                    <User className="mr-2 text-blue-500" size={18} />
                    Informations du contribuable
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <User size={16} className="text-gray-400 mt-1 mr-3" />
                      <div>
                        <div className="text-sm text-gray-500">NIF</div>
                        <div className="font-medium">
                          {declaration.nif_contribuable}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <User size={16} className="text-gray-400 mt-1 mr-3" />
                      <div>
                        <div className="text-sm text-gray-500">Nom complet</div>
                        <div className="font-medium">
                          {declaration.prenom_contribuable
                            ? `${declaration.prenom_contribuable} ${declaration.nom_contribuable}`
                            : declaration.nom_contribuable}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Calendar size={16} className="text-gray-400 mt-1 mr-3" />
                      <div>
                        <div className="text-sm text-gray-500">
                          Date de déclaration
                        </div>
                        <div className="font-medium">
                          {new Date(declaration.date_creation).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Clock size={16} className="text-gray-400 mt-1 mr-3" />
                      <div>
                        <div className="text-sm text-gray-500">
                          Délai d'accord
                        </div>
                        <div className="font-medium">
                          {declaration.delai_accord} jours
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                    <FileText className="mr-2 text-green-500" size={18} />
                    Données de la déclaration
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                    {afficherDonneesJSON(declaration.donnees_json)}
                  </div>
                </div>
              </div>

              {/* Colonne droite - Montants et pénalités */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                    <BadgeDollarSign className="mr-2 text-purple-500" size={18} />
                    Détails des montants
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Montant initial</span>
                      <span className="font-semibold">
                        {declaration.montant.toLocaleString()} USD
                      </span>
                    </div>

                    {/* Affichage des pénalités si calculées */}
                    {penalites && penalites.jours_retard > 0 && (
                      <>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 flex items-center">
                            <Clock size={14} className="mr-1 text-orange-500" />
                            Jours de retard
                          </span>
                          <span className="font-semibold text-orange-600">
                            {penalites.jours_retard} jours
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600">
                            Pénalités appliquées
                          </span>
                          <span className="font-semibold text-red-600">
                            + {penalites.montant_penalites.toLocaleString()} USD
                          </span>
                        </div>
                        {penalites.details_calcul && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="flex items-center text-orange-700">
                              <Brain size={14} className="mr-2" />
                              <span className="text-sm font-medium">
                                Détails du calcul:
                              </span>
                            </div>
                            <p className="text-orange-600 text-xs mt-1">
                              {penalites.details_calcul}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {calculPenalitesEnCours && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center text-blue-700">
                          <Sparkles size={14} className="mr-2" />
                          <span className="text-sm">
                            Calcul intelligent des pénalités en cours...
                          </span>
                        </div>
                      </div>
                    )}

                    {!hasPenalites && !calculPenalitesEnCours && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center text-green-700">
                          <CheckCircle size={14} className="mr-2" />
                          <span className="text-sm">
                            Aucun retard - Pas de pénalités applicables
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-3 bg-gradient-to-r from-blue-50 to-blue-100 -mx-3 px-3 rounded-lg">
                      <span className="text-blue-700 font-bold">
                        Total à payer
                      </span>
                      <span className="text-blue-700 font-bold text-lg">
                        {montantTotal.toLocaleString()} USD
                        {hasPenalites && (
                          <span className="text-sm font-normal ml-2 block mt-1">
                            (dont {montantPenalites.toLocaleString()} USD de
                            pénalités)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {utilisationIA && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center text-green-700 mb-2">
                      <Sparkles size={16} className="mr-2" />
                      <span className="font-semibold">
                        {calculPenalitesEnCours
                          ? "Calcul IA en cours..."
                          : "Calcul intelligent activé"}
                      </span>
                    </div>
                    <p className="text-green-600 text-sm">
                      {calculPenalitesEnCours
                        ? "L'IA analyse les délais et calcule les pénalités applicables selon les règles fiscales..."
                        : "Les pénalités ont été calculées automatiquement en fonction du retard et des paramètres de l'impôt"}
                    </p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-700 mb-2">
                    Informations sur l'impôt
                  </h5>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      Période:{" "}
                      <span className="font-medium capitalize">
                        {declaration.periode}
                      </span>
                    </div>
                    <div>
                      Description:{" "}
                      <span className="font-medium">
                        {declaration.description_impot}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section Impression Carte */}
                {canPrintCarte && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center text-blue-700 mb-2">
                      <Printer size={16} className="mr-2" />
                      <span className="font-semibold">Impression de Carte</span>
                    </div>
                    <p className="text-blue-600 text-sm mb-3">
                      Cette déclaration contient des données d'immatriculation. 
                      Vous pouvez imprimer la carte rose au format CR-80.
                    </p>
                    <button
                      onClick={() => setShowCarteModal(true)}
                      className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 transition duration-200 flex items-center justify-center"
                    >
                      <Printer className="mr-2" size={16} />
                      Ouvrir l'impression de carte
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
              <button
                onClick={resetApplication}
                className="flex items-center text-gray-600 font-medium hover:text-gray-800 transition duration-200"
              >
                <ArrowLeft className="mr-2" size={18} /> Nouvelle recherche
              </button>

              <div className="flex space-x-3">
                {/* Bouton pour afficher la carte - TOUJOURS VISIBLE MAINTENANT */}
                {canPrintCarte && (
                  <button
                    onClick={() => setShowCarteModal(true)}
                    className="flex items-center bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition duration-200"
                  >
                    <Printer className="mr-2" size={18} /> Carte
                  </button>
                )}

                <button
                  onClick={() => setShowPaymentModal(true)}
                  disabled={calculPenalitesEnCours}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-8 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg shadow-green-500/25"
                >
                  {calculPenalitesEnCours ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Calcul des pénalités...
                    </>
                  ) : (
                    <>
                      Payer maintenant
                      <CreditCard className="ml-2" size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal de paiement
  const renderPaymentModal = (): React.ReactElement => {
    const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentMethod);
    const montantTotal = calculerMontantTotal();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-2xl">
            <h3 className="text-xl font-bold text-white">Mode de paiement</h3>
            <p className="text-blue-100 mt-1">
              Choisissez votre méthode de paiement préférée
            </p>
          </div>

          <div className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-blue-700">
                  Montant à payer:
                </span>
                <span className="text-blue-700 font-bold text-lg">
                  {montantTotal.toLocaleString()} USD
                </span>
              </div>
              {penalites && penalites.jours_retard > 0 && (
                <div className="text-blue-600 text-sm mt-1">
                  Inclut {penalites.montant_penalites.toLocaleString()} USD de
                  pénalités
                </div>
              )}
            </div>

            <div className="space-y-3 mb-6">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <div
                    key={method.id}
                    onClick={() => { setSelectedPaymentMethod(method.id); setPaymentFields({}); }}
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition duration-200 ${
                      selectedPaymentMethod === method.id
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg mr-4 transition duration-200 ${
                        selectedPaymentMethod === method.id
                          ? "bg-blue-500 shadow-md"
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

            {selectedMethod && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center text-blue-700">
                  <CheckCircle size={16} className="mr-2" />
                  <span className="font-medium">
                    {selectedMethod.name} sélectionné
                  </span>
                </div>
                <p className="text-blue-600 text-sm mt-1">
                  Vous serez redirigé vers le processus de paiement sécurisé
                  après confirmation.
                </p>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-gray-200">
              <button
                onClick={() => { setShowPaymentModal(false); setSelectedPaymentMethod(null); setPaymentFields({}); }}
                className="px-6 py-2 text-gray-600 font-medium hover:text-gray-800 transition duration-200"
              >
                Annuler
              </button>

              <button
                onClick={handlePayment}
                disabled={!selectedPaymentMethod || loading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-md"
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
    );
  };

  // Modal d'impression de carte
  const renderCarteModal = (): React.ReactElement => {
    if (!declaration?.donnees_json) return <></>;

    const declarationData = Array.isArray(declaration.donnees_json) 
      ? declaration.donnees_json[0] 
      : declaration.donnees_json;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold">Carte Rose - Format CR-80</h3>
              <p className="text-blue-100 text-sm">
                Référence: {declaration.reference} | Carte à imprimer
              </p>
            </div>
            <button
              onClick={() => setShowCarteModal(false)}
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
                    <div
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
                            <td>{declarationData["Nom"] || declarationData["nom"] || declaration.nom_contribuable}</td>
                          </tr>
                          <tr>
                            <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>Prénom:</td>
                            <td>{declarationData["Prénom"] || declarationData["prenom"] || declaration.prenom_contribuable || "-"}</td>
                          </tr>
                          <tr>
                            <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>Adresse:</td>
                            <td>{declarationData["Adresse physique"] || declarationData["adresse_physique"] || declaration.adresse || "-"}</td>
                          </tr>
                          <tr>
                            <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>N. Impôt:</td>
                            <td>{declaration.nif_contribuable}</td>
                          </tr>
                          <tr>
                            <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>Année circulation:</td>
                            <td>{declarationData["Année de circulation"] || declarationData["annee_circulation"] || "-"}</td>
                          </tr>
                          <tr>
                            <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>N. Plaque:</td>
                            <td><strong>{declarationData["Numéro de plaque"] || declarationData["numero_plaque"] || "-"}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="qr-code" style={{ position: "absolute", bottom: "3mm", right: "3mm", width: "15mm", height: "15mm" }}>
                        <QRCodeSVG 
                          value={declarationData["Numéro de plaque"] || declarationData["numero_plaque"] || declaration.reference} 
                          size={60} 
                          level="M" 
                        />
                      </div>
                    </div>
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
                    <div
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
                            <td>{declarationData["Marque"] || declarationData["marque"] || "-"}</td>
                          </tr>
                          <tr>
                            <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>Usage:</td>
                            <td>{declarationData["Usage"] || declarationData["usage"] || "-"}</td>
                          </tr>
                          <tr>
                            <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>N. Châssis:</td>
                            <td>{declarationData["Numéro de châssis"] || declarationData["numero_chassis"] || "-"}</td>
                          </tr>
                          <tr>
                            <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>N. Moteur:</td>
                            <td>{declarationData["Numéro de moteur"] || declarationData["numero_moteur"] || "-"}</td>
                          </tr>
                          <tr>
                            <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>Année fabrication:</td>
                            <td>{declarationData["Année de fabrication"] || declarationData["annee_fabrication"] || "-"}</td>
                          </tr>
                          <tr>
                            <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>Couleur:</td>
                            <td>{declarationData["Couleur"] || declarationData["couleur"] || "-"}</td>
                          </tr>
                          <tr>
                            <td className="label" style={{ fontWeight: "bold", width: "25mm" }}>Puissance fiscal:</td>
                            <td>{declarationData["Puissance Fiscal"] || declarationData["puissance_fiscal"] || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="signature" style={{ position: "absolute", bottom: "3mm", right: "3mm", fontSize: "6px", textAlign: "center" }}>
                        <div>Signature</div>
                        <div className="separator" style={{ borderTop: "1px dashed #000", margin: "2mm 0" }}></div>
                        <div>Directeur DGRK</div>
                      </div>
                    </div>
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
            <button onClick={() => setShowCarteModal(false)} className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition duration-200 text-sm">
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };

  // MODAL DE FACTURE CORRIGÉ - Scrollable et impression optimisée
  const renderReceiptModal = (): React.ReactElement => {
    const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentMethod);
    const montantTotal = declaration ? calculerMontantTotal() : 0;
    const montantPenalites = getMontantPenalites();
    const montantInitial = declaration?.montant || 0;

    // Données pour le QR code principal
    const qrDataPrincipal = JSON.stringify({
      type: "facture_recherche_dgrk",
      reference: paymentReference,
      declaration: declaration?.reference,
      nif: declaration?.nif_contribuable,
      montant: montantTotal,
      date: new Date().toISOString(),
      impot: declaration?.nom_impot,
      penalites: montantPenalites,
    });

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* En-tête du modal */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Facture de Paiement</h3>
              <p className="text-blue-100">Référence: {paymentReference}</p>
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

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div id="receipt-content">
              {/* En-tête officielle */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-2xl print:bg-blue-800 mb-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm opacity-90 font-light">
                      RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                    </div>
                    <div className="text-3xl font-bold mt-2 tracking-wide">
                      DGRK
                    </div>
                    <div className="text-lg opacity-90 mt-1 font-medium">
                      Direction Générale des Recettes du Kinshasa
                    </div>
                    <div className="text-sm opacity-80 mt-2">
                      Facture de Paiement par Recherche
                    </div>
                  </div>

                  <div className="text-right flex-1">
                    <div className="text-lg font-bold mb-2">
                      FACTURE #{paymentReference}
                    </div>
                    <div className="text-sm opacity-90">
                      Date: {new Date().toLocaleDateString("fr-FR")}
                    </div>
                    <div className="text-sm opacity-90">
                      Heure: {new Date().toLocaleTimeString("fr-FR")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Corps de la facture */}
              <div className="space-y-6">
                {/* Section Informations */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Informations du Contribuable */}
                  <div className="border border-gray-200 rounded-xl p-6 print-break-inside">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                      <User className="inline mr-2 text-blue-600" size={20} />
                      INFORMATIONS DU CONTRIBUABLE
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">NIF:</span>
                        <span className="font-mono text-blue-600">
                          {declaration?.nif_contribuable}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">Nom:</span>
                        <span className="font-medium text-right">
                          {declaration?.prenom_contribuable
                            ? `${declaration.prenom_contribuable} ${declaration.nom_contribuable}`
                            : declaration?.nom_contribuable}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">Type:</span>
                        <span className="font-medium capitalize">
                          {declaration?.type_contribuable}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">
                          Référence Déclaration:
                        </span>
                        <span className="font-mono text-blue-600">
                          {declaration?.reference}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Détails du Paiement */}
                  <div className="border border-gray-200 rounded-xl p-6 print-break-inside">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                      <CreditCard className="inline mr-2 text-green-600" size={20} />
                      DÉTAILS DU PAIEMENT
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">
                          Référence Paiement:
                        </span>
                        <span className="font-mono text-blue-600">
                          {paymentReference}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">
                          Type d'impôt:
                        </span>
                        <span className="font-medium">
                          {declaration?.nom_impot}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">
                          Mode de paiement:
                        </span>
                        <span className="font-medium text-green-600 flex items-center">
                          {selectedMethod &&
                            React.createElement(selectedMethod.icon, {
                              size: 16,
                              className: "mr-1",
                            })}
                          {selectedMethod?.name}
                        </span>
                      </div>
                      {declaration?.periode && (
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-700">
                            Période:
                          </span>
                          <span className="font-medium capitalize">
                            {declaration.periode}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section Détail des Montants */}
                <div className="print-break-inside">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-300">
                    DÉTAIL DES MONTANTS
                  </h3>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Colonne Montants */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-gray-200">
                        <span className="text-gray-700 font-semibold">
                          Montant initial:
                        </span>
                        <span className="font-bold text-blue-600">
                          {montantInitial.toLocaleString()} USD
                        </span>
                      </div>

                      {/* Section Pénalités */}
                      {montantPenalites > 0 && (
                        <>
                          <div className="flex justify-between items-center py-3 border-b border-gray-200">
                            <span className="text-gray-700 font-semibold flex items-center">
                              <Clock className="mr-2 text-orange-500" size={16} />
                              Jours de retard:
                            </span>
                            <span className="font-bold text-orange-600">
                              {penalites?.jours_retard || 0} jours
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-3 border-b border-gray-200">
                            <span className="text-gray-700 font-semibold">
                              Pénalités appliquées:
                            </span>
                            <span className="font-bold text-red-600">
                              + {montantPenalites.toLocaleString()} USD
                            </span>
                          </div>
                          {penalites?.details_calcul && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                              <div className="flex items-center text-orange-700 mb-2">
                                <Brain size={16} className="mr-2" />
                                <span className="font-semibold">
                                  Détails du calcul des pénalités:
                                </span>
                              </div>
                              <p className="text-orange-600 text-sm">
                                {penalites.details_calcul}
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      <div className="flex justify-between items-center py-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl px-4 mt-4">
                        <span className="text-green-700 font-bold text-lg">
                          MONTANT TOTAL:
                        </span>
                        <span className="text-green-700 font-bold text-2xl">
                          {montantTotal.toLocaleString()} USD
                        </span>
                      </div>
                    </div>

                    {/* Colonne QR Code et IA */}
                    <div className="space-y-4">
                      {/* QR Code Principal */}
                      <div className="bg-white p-4 border-2 border-blue-200 rounded-xl text-center">
                        <QRCodeSVG
                          value={qrDataPrincipal}
                          size={120}
                          level="H"
                          includeMargin={true}
                        />
                        <div className="text-xs text-gray-600 mt-2 max-w-[120px] mx-auto">
                          Scanner pour vérifier la facture
                        </div>
                      </div>

                      {/* Section IA */}
                      {utilisationIA && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                          <div className="flex items-center text-green-700 mb-2">
                            <Sparkles size={16} className="mr-2" />
                            <span className="font-semibold">
                              Calcul Intelligent
                            </span>
                          </div>
                          <p className="text-green-600 text-sm">
                            Les pénalités ont été calculées automatiquement par
                            intelligence artificielle
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section Détail de la Déclaration */}
                <div className="print-break-inside">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-300">
                    DÉTAIL DE LA DÉCLARATION
                  </h3>

                  <div className="bg-gray-50 rounded-xl p-6">
                    {declaration?.donnees_json && (
                      <div className="space-y-4">
                        {Array.isArray(declaration.donnees_json) ? (
                          // Cas des déclarations multiples
                          declaration.donnees_json.map((declarationData: any, index: number) => {
                            const qrDataDeclaration = JSON.stringify({
                              type: "declaration_recherche",
                              numero: index + 1,
                              reference: `${declaration.reference}-${index + 1}`,
                              nif: declaration.nif_contribuable,
                              data: declarationData,
                            });

                            return (
                              <div
                                key={index}
                                className="border border-gray-200 rounded-lg p-4 bg-white print-break-inside"
                              >
                                <div className="flex flex-col md:flex-row gap-4">
                                  {/* QR Code Mini */}
                                  <div className="flex-shrink-0">
                                    <div className="bg-white p-2 border border-gray-200 rounded-lg">
                                      <QRCodeSVG
                                        value={qrDataDeclaration}
                                        size={60}
                                        level="M"
                                        includeMargin={false}
                                      />
                                    </div>
                                    <div className="text-xs text-center text-gray-500 mt-1">
                                      Déclaration #{index + 1}
                                    </div>
                                  </div>

                                  {/* Détails de la déclaration */}
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                      <FileText size={16} className="mr-2" />
                                      Déclaration #{index + 1}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                      {Object.entries(declarationData).map(([key, value]) => (
                                        <div
                                          key={key}
                                          className="flex justify-between border-b border-gray-100 pb-2"
                                        >
                                          <span className="font-medium text-gray-700 capitalize">
                                            {key.replace(/_/g, " ")}:
                                          </span>
                                          <span className="text-gray-600 text-right">
                                            {value?.toString() || "Non renseigné"}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          // Cas d'une déclaration simple
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(declaration.donnees_json).map(([key, value]) => (
                              <div
                                key={key}
                                className="flex justify-between border-b border-gray-200 pb-2"
                              >
                                <span className="font-medium text-gray-700 capitalize">
                                  {key.replace(/_/g, " ")}:
                                </span>
                                <span className="text-gray-600 text-right">
                                  {value?.toString() || "Non renseigné"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Section Confirmation */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 print-break-inside">
                  <div className="flex items-center text-green-700 mb-3">
                    <CheckCircle size={20} className="mr-2" />
                    <span className="font-bold text-lg">
                      PAIEMENT CONFIRMÉ ET TRAITÉ
                    </span>
                  </div>
                  <p className="text-green-600">
                    Votre paiement a été traité avec succès.{" "}
                    {montantPenalites > 0
                      ? `Les pénalités de retard ont été appliquées conformément à la réglementation fiscale.`
                      : `Aucune pénalité n'a été appliquée.`}
                    Un email de confirmation détaillé vous sera envoyé sous peu.
                  </p>
                  <div className="flex items-center text-green-500 text-sm mt-2">
                    <Calendar size={14} className="mr-1" />
                    Date de traitement: {new Date().toLocaleDateString("fr-FR")}
                  </div>
                </div>

                {/* Informations légales */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center print-break-inside">
                  <p className="text-gray-600 text-sm">
                    Ce reçu électronique a valeur légale. Conservez-le
                    précieusement avec vos documents fiscaux.
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Pour toute question, contactez le service client au +243 XX
                    XXX XXXX ou par email à support@dgrk.cd
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-center space-x-4 no-print">
            <button
              onClick={handlePrintReceipt}
              className="flex items-center bg-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-600 transition duration-200 shadow-md"
            >
              <Printer className="mr-2" size={18} />
              Imprimer la Facture
            </button>

            <button
              onClick={resetApplication}
              className="flex items-center bg-green-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-600 transition duration-200 shadow-md"
            >
              <Home className="mr-2" size={18} />
              Nouvelle Recherche
            </button>
          </div>

          {/* Pied de page */}
          <div className="bg-gray-800 text-white p-4 text-center no-print">
            <div className="text-xs opacity-80">
              © {new Date().getFullYear()} Direction Générale des Recettes du
              Kinshasa - Tous droits réservés
            </div>
            <div className="text-xs opacity-60 mt-1">
              Facture générée électroniquement | Code: {paymentReference}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Recherche et Paiement de Déclaration
          </h1>
          <p className="text-gray-600 text-lg">
            Retrouvez votre déclaration et effectuez votre paiement en ligne
            avec calcul intelligent des pénalités
          </p>
        </div>

        {/* Messages d'alerte */}
        {error && declaration && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl">
            <div className="flex items-center">
              <AlertCircle size={20} className="mr-3" />
              {error}
            </div>
          </div>
        )}

        {/* Contenu principal */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {!declaration ? renderRechercheStep() : renderDeclarationStep()}
        </div>

        {/* Modal de paiement */}
        {showPaymentModal && renderPaymentModal()}

        {/* Modal de carte */}
        {showCarteModal && renderCarteModal()}

        {/* Modal de reçu */}
        {showReceiptModal && renderReceiptModal()}
      </div>
    </div>
  );
};

export default RechercheDeclarationPage;