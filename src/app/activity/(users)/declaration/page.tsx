"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  FileText,
  CreditCard,
  Smartphone,
  DollarSign,
  Building,
  FileCheck,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
  Download,
  Printer,
  Home,
  User,
  MapPin,
  Phone,
  Mail,
  Car,
  BadgeDollarSign,
  Sparkles,
  Calendar,
  Clock,
  Brain,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// Import des services
import {
  rechercherDeclaration,
  traiterPaiement,
} from "@/services/paiement/paiementService";
import { calculerPenalitesAvecIA } from "@/services/ia/geminiService";

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
}

// Options de paiement
const paymentMethods: PaymentMethod[] = [
  { id: 1, name: "Mobile Money", icon: Smartphone },
  { id: 2, name: "Dépôt bancaire", icon: Building },
  { id: 3, name: "Carte bancaire", icon: CreditCard },
  { id: 4, name: "Chèque", icon: FileCheck },
  { id: 5, name: "Cash", icon: DollarSign },
];

const RechercheDeclarationPage: React.FC = () => {
  const [numeroDeclaration, setNumeroDeclaration] = useState<string>("");
  const [declaration, setDeclaration] = useState<Declaration | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    number | null
  >(null);
  const [paymentReference, setPaymentReference] = useState<string>("");

  // États pour les pénalités IA
  const [penalites, setPenalites] = useState<any>(null);
  const [calculPenalitesEnCours, setCalculPenalitesEnCours] =
    useState<boolean>(false);
  const [utilisationIA, setUtilisationIA] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({});

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
  const calculerPenalitesAvecIASiNecessaire = async (
    declarationData: Declaration
  ): Promise<void> => {
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
        montantPenalites =
          declarationData.montant * tauxPenalite * nombreDelaisEcoules;
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

  // Afficher les données JSON de la déclaration de manière lisible
  const afficherDonneesJSON = (donnees: any): React.ReactElement => {
    if (!donnees || Object.keys(donnees).length === 0) {
      return (
        <div className="text-gray-500 text-center py-4">
          Aucune donnée supplémentaire
        </div>
      );
    }

    const renderValue = (
      value: any,
      depth: number = 0,
      parentKey: string = ""
    ): React.ReactElement => {
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
              {isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
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
              {isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
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
                      {renderValue(
                        value[key],
                        depth + 1,
                        `${parentKey}-${key}`
                      )}
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
          {donnees.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="font-semibold text-gray-700 mb-2 flex items-center">
                <FileText size={16} className="mr-2" />
                Déclaration #{index + 1}
              </div>
              <div className="space-y-3">
                {Object.entries(item).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start">
                    <span className="text-gray-600 capitalize flex-1">
                      {key.replace(/_/g, " ")}:
                    </span>
                    <div className="font-semibold text-right flex-1 max-w-[60%]">
                      {renderValue(value, 0, key)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Si c'est un objet simple
    return (
      <div className="space-y-3">
        {Object.entries(donnees).map(([key, value]) => (
          <div
            key={key}
            className="flex justify-between items-start py-2 border-b border-gray-100"
          >
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

  // Simuler le traitement du paiement
  const handlePayment = async (): Promise<void> => {
    if (!selectedPaymentMethod) {
      setError("Veuillez sélectionner un mode de paiement");
      return;
    }

    if (!declaration) {
      setError("Aucune déclaration sélectionnée");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Récupérer le montant des pénalités
      const montantPenalites = getMontantPenalites();

      const result = await traiterPaiement(
        declaration.id,
        selectedPaymentMethod,
        montantPenalites
      );

      if (result.status === "success") {
        setPaymentReference(result.data.reference_paiement);
        setShowPaymentModal(false);
        setShowReceiptModal(true);
      } else {
        setError(result.message || "Erreur lors du traitement du paiement");
      }
    } catch (error) {
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
    setSelectedPaymentMethod(null);
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
                          {new Date(
                            declaration.date_creation
                          ).toLocaleDateString("fr-FR", {
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
                    <BadgeDollarSign
                      className="mr-2 text-purple-500"
                      size={18}
                    />
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
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
              <button
                onClick={resetApplication}
                className="flex items-center text-gray-600 font-medium hover:text-gray-800 transition duration-200"
              >
                <ArrowLeft className="mr-2" size={18} /> Nouvelle recherche
              </button>

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
    );
  };

  // Modal de paiement
  const renderPaymentModal = (): React.ReactElement => {
    const selectedMethod = paymentMethods.find(
      (m) => m.id === selectedPaymentMethod
    );

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
                    onClick={() => setSelectedPaymentMethod(method.id)}
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
                onClick={() => setShowPaymentModal(false)}
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

  // Modal de reçu
  const renderReceiptModal = (): React.ReactElement => {
    const selectedMethod = paymentMethods.find(
      (m) => m.id === selectedPaymentMethod
    );
    const montantTotal = declaration ? calculerMontantTotal() : 0;
    const montantPenalites = getMontantPenalites();
    const montantInitial = declaration?.montant || 0;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div
          className="bg-white rounded-2xl shadow-xl max-w-4xl w-full my-8"
          id="receipt-content"
        >
          {/* En-tête du reçu */}
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
                <div className="text-xs opacity-90 mt-2">
                  Reçu électronique de paiement d'impôt
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm opacity-90">REÇU DE PAIEMENT</div>
                <div className="text-lg font-bold mt-1 bg-white/20 px-3 py-1 rounded-lg">
                  {paymentReference}
                </div>
                <div className="text-xs opacity-90 mt-2">
                  {new Date().toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Corps du reçu */}
          <div className="p-8">
            {/* Grille d'informations */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Colonne gauche - Informations du contribuable */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center">
                  <User className="mr-2 text-blue-500" size={20} />
                  INFORMATIONS DU CONTRIBUABLE
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">NIF:</span>
                    <span className="font-semibold">
                      {declaration?.nif_contribuable}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">
                      Nom complet:
                    </span>
                    <span className="font-semibold text-right">
                      {declaration?.prenom_contribuable
                        ? `${declaration.prenom_contribuable} ${declaration.nom_contribuable}`
                        : declaration?.nom_contribuable}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Type:</span>
                    <span className="font-semibold capitalize">
                      {declaration?.type_contribuable}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">
                      Référence déclaration:
                    </span>
                    <span className="font-bold text-blue-600">
                      {declaration?.reference}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">
                      Type d'impôt:
                    </span>
                    <span className="font-semibold text-right">
                      {declaration?.nom_impot}
                    </span>
                  </div>
                  {declaration?.periode && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">
                        Période:
                      </span>
                      <span className="font-semibold capitalize">
                        {declaration.periode}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Colonne droite - Détails de paiement */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center">
                  <CreditCard className="mr-2 text-green-500" size={20} />
                  DÉTAILS DE PAIEMENT
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">
                      Référence paiement:
                    </span>
                    <span className="font-mono font-bold text-blue-600">
                      {paymentReference}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">
                      Mode de paiement:
                    </span>
                    <span className="font-semibold flex items-center">
                      {selectedMethod && (
                        <>
                          {React.createElement(selectedMethod.icon, {
                            size: 16,
                            className: "mr-1",
                          })}
                          {selectedMethod.name}
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-medium text-gray-700">
                      Montant initial:
                    </span>
                    <span className="font-semibold">
                      {montantInitial.toLocaleString()} USD
                    </span>
                  </div>

                  {/* Section pénalités */}
                  {montantPenalites > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700 flex items-center">
                          <Clock size={14} className="mr-1 text-orange-500" />
                          Jours de retard:
                        </span>
                        <span className="font-semibold text-orange-600">
                          {penalites?.jours_retard || 0} jours
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">
                          Pénalités appliquées:
                        </span>
                        <span className="font-semibold text-red-600">
                          + {montantPenalites.toLocaleString()} USD
                        </span>
                      </div>
                      {penalites?.details_calcul && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
                          <div className="flex items-center text-orange-700 mb-1">
                            <Brain size={14} className="mr-2" />
                            <span className="text-sm font-medium">
                              Détails du calcul des pénalités:
                            </span>
                          </div>
                          <p className="text-orange-600 text-xs">
                            {penalites.details_calcul}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex justify-between pt-3 border-t border-gray-300 bg-gradient-to-r from-green-50 to-green-100 -mx-3 px-3 py-2 rounded-lg">
                    <span className="font-bold text-green-700 text-lg">
                      MONTANT TOTAL PAYÉ:
                    </span>
                    <span className="font-bold text-green-700 text-lg">
                      {montantTotal.toLocaleString()} USD
                    </span>
                  </div>

                  <div className="flex justify-between mt-2">
                    <span className="font-medium text-gray-700">Statut:</span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold flex items-center">
                      <CheckCircle size={14} className="mr-1" />
                      Payé ✓
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section calcul intelligent IA */}
            {utilisationIA && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-center text-green-700 mb-2">
                  <Sparkles size={18} className="mr-2" />
                  <span className="font-semibold">
                    Calcul Intelligent des Pénalités
                  </span>
                </div>
                <p className="text-green-600 text-sm">
                  Les pénalités ont été calculées automatiquement par
                  intelligence artificielle en fonction des délais légaux, des
                  paramètres fiscaux et des conditions spécifiques de votre
                  déclaration.
                </p>
                {penalites?.calcul_automatique && (
                  <p className="text-green-500 text-xs mt-1 italic">
                    ✓ Calcul validé et appliqué automatiquement
                  </p>
                )}
              </div>
            )}

            {/* Section confirmation de paiement */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center text-green-700 mb-2">
                <CheckCircle size={18} className="mr-2" />
                <span className="font-semibold">
                  Paiement Confirmé et Traité
                </span>
              </div>
              <p className="text-green-600 text-sm">
                Votre paiement a été traité avec succès.
                {montantPenalites > 0
                  ? ` Les pénalités de retard ont été appliquées conformément à la réglementation fiscale.`
                  : ` Aucune pénalité n'a été appliquée.`}
                Un email de confirmation détaillé vous sera envoyé sous peu.
              </p>
              <div className="flex items-center text-green-500 text-xs mt-2">
                <Calendar size={12} className="mr-1" />
                Date de traitement: {new Date().toLocaleDateString("fr-FR")}
              </div>
            </div>

            {/* Informations légales */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-gray-600 text-xs">
                Ce reçu électronique a valeur légale. Conservez-le précieusement
                avec vos documents fiscaux.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Pour toute question, contactez le service client au +243 XX XXX
                XXXX ou par email à support@dgrk.cd
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-center space-x-4 mt-8 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex items-center bg-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-600 transition duration-200 shadow-md hover:shadow-lg"
              >
                <Printer className="mr-2" size={18} />
                Imprimer le reçu
              </button>

              <button
                onClick={() => {
                  // Télécharger le reçu en PDF (fonctionnalité à implémenter)
                  const receiptElement =
                    document.getElementById("receipt-content");
                  if (receiptElement) {
                    // Ici vous pouvez ajouter la logique de téléchargement PDF
                    console.log("Téléchargement PDF du reçu");
                  }
                }}
                className="flex items-center bg-purple-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-600 transition duration-200 shadow-md hover:shadow-lg"
              >
                <Download className="mr-2" size={18} />
                Télécharger PDF
              </button>

              <button
                onClick={resetApplication}
                className="flex items-center bg-green-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-600 transition duration-200 shadow-md hover:shadow-lg"
              >
                <Home className="mr-2" size={18} />
                Nouvelle recherche
              </button>
            </div>

            {/* Instructions d'impression */}
            <div className="text-center mt-6 print:hidden">
              <p className="text-gray-500 text-sm">
                💡 <strong>Conseil:</strong> Imprimez ce reçu pour vos archives
                fiscales
              </p>
            </div>
          </div>

          {/* Pied de page du reçu */}
          <div className="bg-gray-800 text-white p-4 rounded-b-2xl text-center">
            <div className="text-xs opacity-80">
              © {new Date().getFullYear()} Direction Générale des Recettes du
              Kongo Central - Tous droits réservés | Reçu généré
              électroniquement
            </div>
            <div className="text-xs opacity-60 mt-1">
              Code de vérification: {paymentReference}-{declaration?.reference}
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

        {/* Modal de reçu */}
        {showReceiptModal && renderReceiptModal()}
      </div>
    </div>
  );
};

export default RechercheDeclarationPage;
