"use client";
import { useState, useEffect, useRef } from "react";
import {
  Save,
  User,
  Car,
  Calculator,
  X,
  Search,
  Percent,
  DollarSign,
} from "lucide-react";
import {
  soumettreCommandePlaques,
  verifierStockDisponible,
  rechercherPlaquesDisponibles,
  verifierSequencePlaques,
  rechercherAssujettiParTelephone, // Nouvelle méthode à créer
} from "@/services/client-simple/clientSimpleService";
import { getTauxActif, type Taux } from "@/services/taux/tauxService";
import FactureA4 from "./FactureA4";

interface FormData {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  nombrePlaques: string;
  numeroPlaqueDebut: string;
  reductionType: "pourcentage" | "montant_fixe" | "";
  reductionValeur: string;
  nif: string;
  dateMouvement: string;
}

interface Utilisateur {
  id: number;
  nom_complet: string;
  telephone: string;
  adresse: string;
  site_nom: string;
  site_code: string;
  formule?: string;
}

interface ClientSimpleFormProps {
  impotId: string;
  utilisateur: Utilisateur | null;
}

interface PaiementData {
  modePaiement: "mobile_money" | "cheque" | "banque" | "espece";
  operateur?: string;
  numeroTransaction?: string;
  numeroCheque?: string;
  banque?: string;
}

interface PlaqueSuggestion {
  numero_plaque: string;
  disponible: boolean;
}

interface FactureData {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  montant: number;
  montant_initial: number;
  mode_paiement: string;
  operateur: string;
  numero_transaction: string;
  date_paiement: string;
  nombre_plaques: number;
  site_nom: string;
  caissier: string;
  numeros_plaques: string[];
  reduction_type?: string;
  reduction_valeur?: number;
  montant_francs?: string;
  nif?: string;
  date_mouvement?: string;
}

interface AssujettiInfo {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  nif: string;
  reduction_type: "pourcentage" | "montant_fixe" | null;
  reduction_valeur: number;
}

export default function ClientSimpleForm({
  impotId,
  utilisateur,
}: ClientSimpleFormProps) {
  const [formData, setFormData] = useState<FormData>({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    adresse: "",
    nombrePlaques: "1",
    numeroPlaqueDebut: "",
    reductionType: "",
    reductionValeur: "",
    nif: "",
    dateMouvement: new Date().toISOString().split("T")[0],
  });

  // État pour le taux
  const [tauxActif, setTauxActif] = useState<Taux | null>(null);
  const [loadingTaux, setLoadingTaux] = useState(false);

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPaiement, setShowPaiement] = useState(false);
  const [showFacture, setShowFacture] = useState(false);
  const [factureData, setFactureData] = useState<FactureData | null>(null);
  const [paiementData, setPaiementData] = useState<PaiementData>({
    modePaiement: "mobile_money",
  });

  // États pour la recherche de plaques
  const [suggestionsPlaques, setSuggestionsPlaques] = useState<
    PlaqueSuggestion[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [sequenceValide, setSequenceValide] = useState(false);
  const [messageSequence, setMessageSequence] = useState("");
  const [sequencePlaques, setSequencePlaques] = useState<string[]>([]);
  const [rechercheAssujettiEnCours, setRechercheAssujettiEnCours] =
    useState(false);
  const rechercheTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rechercheAssujettiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculs avec taux
  const montantUnitaire = utilisateur?.formule
    ? parseFloat(utilisateur.formule)
    : 32;
  const nombrePlaques = parseInt(formData.nombrePlaques) || 1;

  // Calcul de la réduction
  const reductionValeur = parseFloat(formData.reductionValeur) || 0;
  const montantInitial = montantUnitaire * nombrePlaques;
  let montantReduit = montantInitial;
  let reductionMontant = 0;

  if (formData.reductionType === "pourcentage" && reductionValeur > 0) {
    reductionMontant = (montantInitial * reductionValeur) / 100;
    montantReduit = montantInitial - reductionMontant;
  } else if (formData.reductionType === "montant_fixe" && reductionValeur > 0) {
    reductionMontant = reductionValeur * nombrePlaques;
    montantReduit = Math.max(0, montantInitial - reductionMontant);
  }

  // Calcul des montants en francs
  const montantFrancs = tauxActif
    ? (montantReduit * tauxActif.valeur).toLocaleString("fr-FR")
    : "Calcul en cours...";
  const montantInitialFrancs = tauxActif
    ? (montantInitial * tauxActif.valeur).toLocaleString("fr-FR")
    : "Calcul en cours...";

  const montantAPayer = `${montantReduit.toFixed(2)} $`;
  const montantEnFrancs = `${montantFrancs} CDF`;
  const formuleCalcul = utilisateur?.formule
    ? `Montant = ${utilisateur.formule} × ${nombrePlaques} plaque(s)`
    : `Montant = 32 × ${nombrePlaques} plaque(s)`;

  // Chargement du taux actif
  useEffect(() => {
    const chargerTaux = async () => {
      setLoadingTaux(true);
      try {
        const tauxResponse = await getTauxActif({
          province_id: null,
          impot_id: Number(impotId),
        });
        if (tauxResponse.status === "success" && tauxResponse.data) {
          setTauxActif(tauxResponse.data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du taux:", error);
      } finally {
        setLoadingTaux(false);
      }
    };

    chargerTaux();
  }, []);

  // Recherche des plaques en temps réel
  useEffect(() => {
    if (rechercheTimeoutRef.current) {
      clearTimeout(rechercheTimeoutRef.current);
    }

    if (formData.numeroPlaqueDebut.length >= 2) {
      setRechercheEnCours(true);
      rechercheTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await rechercherPlaquesDisponibles(
            formData.numeroPlaqueDebut,
            utilisateur
          );

          if (result.status === "success" && result.data?.suggestions) {
            setSuggestionsPlaques(result.data.suggestions);
            setShowSuggestions(true);
          } else {
            setSuggestionsPlaques([]);
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error("Erreur recherche plaques:", error);
          setSuggestionsPlaques([]);
        } finally {
          setRechercheEnCours(false);
        }
      }, 300);
    } else {
      setSuggestionsPlaques([]);
      setShowSuggestions(false);
      setSequenceValide(false);
      setMessageSequence("");
      setSequencePlaques([]);
    }

    return () => {
      if (rechercheTimeoutRef.current) {
        clearTimeout(rechercheTimeoutRef.current);
      }
    };
  }, [formData.numeroPlaqueDebut, utilisateur]);

  // Vérification de la séquence quand la plaque de début ou la quantité change
  useEffect(() => {
    if (formData.numeroPlaqueDebut && nombrePlaques > 0) {
      verifierSequenceDisponible();
    } else {
      setSequenceValide(false);
      setMessageSequence("");
      setSequencePlaques([]);
    }
  }, [formData.numeroPlaqueDebut, formData.nombrePlaques]);

  // Recherche de l'assujetti par téléphone
  useEffect(() => {
    if (rechercheAssujettiTimeoutRef.current) {
      clearTimeout(rechercheAssujettiTimeoutRef.current);
    }

    if (formData.telephone.length >= 8) {
      setRechercheAssujettiEnCours(true);
      rechercheAssujettiTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await rechercherAssujettiParTelephone(
            formData.telephone,
            utilisateur
          );

          if (result.status === "success" && result.data?.assujetti) {
            const assujetti = result.data.assujetti;
            setFormData((prev) => ({
              ...prev,
              nom: assujetti.nom || "",
              prenom: assujetti.prenom || "",
              email: assujetti.email || "",
              adresse: assujetti.rue || "",
              nif: assujetti.nif || "",
              reductionType: assujetti.reduction_type || "",
              reductionValeur: assujetti.reduction_valeur?.toString() || "",
            }));
          }
        } catch (error) {
          console.error("Erreur recherche assujetti:", error);
        } finally {
          setRechercheAssujettiEnCours(false);
        }
      }, 500);
    }

    return () => {
      if (rechercheAssujettiTimeoutRef.current) {
        clearTimeout(rechercheAssujettiTimeoutRef.current);
      }
    };
  }, [formData.telephone, utilisateur]);

  const verifierSequenceDisponible = async () => {
    if (!formData.numeroPlaqueDebut || !nombrePlaques) return;

    try {
      const result = await verifierSequencePlaques(
        formData.numeroPlaqueDebut,
        nombrePlaques,
        utilisateur
      );

      if (result.status === "success" && result.data?.sequence_valide) {
        setSequenceValide(true);
        setMessageSequence(
          `Séquence valide: ${result.data.sequence_plaques?.join(", ")}`
        );
        setSequencePlaques(result.data.sequence_plaques || []);
      } else {
        setSequenceValide(false);
        setMessageSequence(result.message || "Séquence non disponible");
        setSequencePlaques([]);
      }
    } catch (error) {
      setSequenceValide(false);
      setMessageSequence("Erreur de vérification");
      setSequencePlaques([]);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const selectPlaque = (plaque: string) => {
    setFormData((prev) => ({
      ...prev,
      numeroPlaqueDebut: plaque,
    }));
    setShowSuggestions(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.nom.trim()) newErrors.nom = "Le nom est obligatoire";
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est obligatoire";
    if (!formData.telephone.trim())
      newErrors.telephone = "Le téléphone est obligatoire";
    if (!formData.adresse.trim())
      newErrors.adresse = "L'adresse est obligatoire";
    if (!formData.numeroPlaqueDebut.trim())
      newErrors.numeroPlaqueDebut =
        "Le numéro de plaque de début est obligatoire";

    const nbPlaques = parseInt(formData.nombrePlaques);
    if (isNaN(nbPlaques) || nbPlaques < 1) {
      newErrors.nombrePlaques = "Le nombre de plaques doit être au moins 1";
    }

    // Validation de la réduction
    if (formData.reductionType && formData.reductionValeur) {
      const valeur = parseFloat(formData.reductionValeur);
      if (isNaN(valeur) || valeur < 0) {
        newErrors.reductionValeur = "Valeur de réduction invalide";
      }
      if (formData.reductionType === "pourcentage" && valeur > 100) {
        newErrors.reductionValeur = "Le pourcentage ne peut dépasser 100%";
      }
    }

    // Validation de la date de mouvement
    if (!formData.dateMouvement.trim()) {
      newErrors.dateMouvement = "La date du mouvement est obligatoire";
    } else {
      const dateMvt = new Date(formData.dateMouvement);
      const today = new Date();
      if (dateMvt > today) {
        newErrors.dateMouvement = "La date ne peut être dans le futur";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && sequenceValide;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      if (!sequenceValide) {
        alert("Veuillez sélectionner une séquence de plaques valide");
      }
      return;
    }

    // Vérifier le stock avant de continuer
    const stockResult = await verifierStockDisponible(
      nombrePlaques,
      utilisateur
    );
    if (stockResult.status === "error" || !stockResult.data?.suffisant) {
      alert(
        `Stock insuffisant! Disponible: ${
          stockResult.data?.stock_disponible || 0
        }, Demandé: ${nombrePlaques}`
      );
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmation = () => {
    setShowConfirmation(false);
    setShowPaiement(true);
  };

  const handlePaiementSubmit = async () => {
    if (!utilisateur) {
      alert("Utilisateur non connecté");
      return;
    }

    setIsSubmitting(true);

    try {
      // Préparer les données de réduction
      const reductionData =
        formData.reductionType && formData.reductionValeur
          ? {
              reduction_type: formData.reductionType,
              reduction_valeur: parseFloat(formData.reductionValeur),
            }
          : {};

      const result = await soumettreCommandePlaques(
        impotId,
        {
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone,
          email: formData.email,
          adresse: formData.adresse,
          nif: formData.nif,
          ...reductionData,
          date_mouvement: formData.dateMouvement, // Ajouter la date
        },
        {
          nombrePlaques: nombrePlaques,
          numeroPlaqueDebut: formData.numeroPlaqueDebut,
        },
        paiementData,
        utilisateur
      );

      if (result.status === "success") {
        setShowPaiement(false);

        // Préparer les données pour la facture A4
        const facture: FactureData = {
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone,
          email: formData.email,
          adresse: formData.adresse,
          montant: montantReduit,
          montant_initial: montantInitial,
          mode_paiement: paiementData.modePaiement,
          operateur: paiementData.operateur || "",
          numero_transaction: paiementData.numeroTransaction || "",
          date_paiement:
            formData.dateMouvement +
            " " +
            new Date().toTimeString().split(" ")[0], // Utiliser la date mouvement
          nombre_plaques: nombrePlaques,
          site_nom: utilisateur.site_nom,
          caissier: utilisateur.nom_complet,
          numeros_plaques: result.data?.numeroPlaques || [],
          reduction_type: formData.reductionType || undefined,
          reduction_valeur: reductionValeur || undefined,
          montant_francs: montantEnFrancs,
          nif: formData.nif || undefined,
          date_mouvement: formData.dateMouvement,
        };

        setFactureData(facture);
        setShowFacture(true);
      } else {
        alert(`Erreur: ${result.message}`);
      }
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      alert("Une erreur est survenue lors de la soumission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseFacture = () => {
    setShowFacture(false);
    setFactureData(null);
    // Réinitialiser le formulaire après fermeture de la facture
    setFormData({
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
      adresse: "",
      nombrePlaques: "1",
      numeroPlaqueDebut: "",
      reductionType: "",
      reductionValeur: "",
      nif: "",
      dateMouvement: new Date().toISOString().split("T")[0],
    });
    setSequenceValide(false);
    setMessageSequence("");
    setSequencePlaques([]);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION ASSUJETTI */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-100 p-2 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Informations de l'Assujetti
              </h2>
              <p className="text-gray-600 text-sm">
                Renseignez les informations personnelles du propriétaire
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TÉLÉPHONE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de téléphone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) =>
                    handleInputChange("telephone", e.target.value)
                  }
                  placeholder="Entrez votre numéro de téléphone"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.telephone ? "border-red-300" : "border-gray-300"
                  }`}
                />
                {rechercheAssujettiEnCours && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {errors.telephone && (
                <p className="text-red-600 text-sm mt-1">{errors.telephone}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Saisir pour rechercher automatiquement les informations
              </p>
            </div>

            {/* NOM */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => handleInputChange("nom", e.target.value)}
                placeholder="Entrez votre nom"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nom ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.nom && (
                <p className="text-red-600 text-sm mt-1">{errors.nom}</p>
              )}
            </div>

            {/* PRÉNOM */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.prenom}
                onChange={(e) => handleInputChange("prenom", e.target.value)}
                placeholder="Entrez votre prénom"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.prenom ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.prenom && (
                <p className="text-red-600 text-sm mt-1">{errors.prenom}</p>
              )}
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Entrez votre adresse email"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* ADRESSE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse physique <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.adresse}
                onChange={(e) => handleInputChange("adresse", e.target.value)}
                placeholder="Entrez votre adresse complète"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.adresse ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.adresse && (
                <p className="text-red-600 text-sm mt-1">{errors.adresse}</p>
              )}
            </div>

            {/* NIF */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIF
              </label>
              <input
                type="text"
                value={formData.nif}
                onChange={(e) => handleInputChange("nif", e.target.value)}
                placeholder="NIF de l'assujetti"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nif ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.nif && (
                <p className="text-red-600 text-sm mt-1">{errors.nif}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date du mouvement <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dateMouvement}
                onChange={(e) =>
                  handleInputChange("dateMouvement", e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.dateMouvement ? "border-red-300" : "border-gray-300"
                }`}
                max={new Date().toISOString().split("T")[0]} // Pas de date future
              />
              {errors.dateMouvement && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.dateMouvement}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Date à laquelle le mouvement doit être enregistré
              </p>
            </div>

            {/* RÉDUCTION - TYPE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de réduction
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() =>
                    handleInputChange("reductionType", "pourcentage")
                  }
                  className={`flex-1 px-4 py-2 border rounded-lg flex items-center justify-center space-x-2 ${
                    formData.reductionType === "pourcentage"
                      ? "bg-blue-100 border-blue-500 text-blue-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Percent className="w-4 h-4" />
                  <span>Pourcentage</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleInputChange("reductionType", "montant_fixe")
                  }
                  className={`flex-1 px-4 py-2 border rounded-lg flex items-center justify-center space-x-2 ${
                    formData.reductionType === "montant_fixe"
                      ? "bg-green-100 border-green-500 text-green-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Montant fixe</span>
                </button>
              </div>
            </div>

            {/* RÉDUCTION - VALEUR */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valeur de réduction{" "}
                {formData.reductionType === "pourcentage" ? "(%)" : "($)"}
              </label>
              <input
                type="number"
                step={
                  formData.reductionType === "pourcentage" ? "0.0001" : "0.01"
                }
                min="0"
                max={
                  formData.reductionType === "pourcentage" ? "100" : undefined
                }
                value={formData.reductionValeur}
                onChange={(e) =>
                  handleInputChange("reductionValeur", e.target.value)
                }
                placeholder={
                  formData.reductionType === "pourcentage"
                    ? "Ex: 10.0000"
                    : "Ex: 5.00"
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.reductionValeur ? "border-red-300" : "border-gray-300"
                }`}
                disabled={!formData.reductionType}
              />
              {errors.reductionValeur && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.reductionValeur}
                </p>
              )}
              {formData.reductionType && (
                <p className="text-gray-500 text-xs mt-1">
                  {formData.reductionType === "pourcentage"
                    ? "4 chiffres après la virgule maximum"
                    : "Montant fixe par plaque"}
                </p>
              )}
            </div>
          </div>

          {/* Aperçu de la réduction */}
          {formData.reductionType &&
            formData.reductionValeur &&
            reductionMontant > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-blue-800">
                      Réduction appliquée:
                    </span>
                    <span className="ml-2 text-blue-600">
                      {formData.reductionType === "pourcentage"
                        ? `${reductionValeur}%`
                        : `${reductionValeur}$ par plaque`}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-blue-800">
                    -{reductionMontant.toFixed(2)} $
                  </div>
                </div>
                <div className="mt-1 text-sm text-blue-600">
                  Montant initial: {montantInitial.toFixed(2)} $ → Montant
                  final: {montantReduit.toFixed(2)} $
                </div>
              </div>
            )}
        </div>

        {/* SECTION PLAQUES (inchangée) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-green-100 p-2 rounded-lg">
              <Car className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Commande de Plaques
              </h2>
              <p className="text-gray-600 text-sm">
                Spécifiez le numéro de plaque de début et la quantité
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* NUMERO PLAQUE DEBUT */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de plaque de début{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.numeroPlaqueDebut}
                  onChange={(e) =>
                    handleInputChange("numeroPlaqueDebut", e.target.value)
                  }
                  placeholder="Ex: AC12, BD25, etc."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.numeroPlaqueDebut
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                />
                {rechercheEnCours && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {errors.numeroPlaqueDebut && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.numeroPlaqueDebut}
                </p>
              )}

              {/* Suggestions de plaques */}
              {showSuggestions && suggestionsPlaques.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {suggestionsPlaques.map((plaque, index) => (
                    <div
                      key={index}
                      onClick={() =>
                        plaque.disponible && selectPlaque(plaque.numero_plaque)
                      }
                      className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                        plaque.disponible
                          ? "hover:bg-blue-50 text-gray-800"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {plaque.numero_plaque}
                        </span>
                        {plaque.disponible ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Disponible
                          </span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            Occupé
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* NOMBRE DE PLAQUES */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de plaques à acheter{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.nombrePlaques}
                onChange={(e) =>
                  handleInputChange("nombrePlaques", e.target.value)
                }
                placeholder="Entrez le nombre de plaques"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nombrePlaques ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.nombrePlaques && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.nombrePlaques}
                </p>
              )}
              <p className="text-gray-500 text-sm mt-2">
                Prix unitaire: {montantUnitaire} $ par plaque
              </p>
            </div>
          </div>

          {/* Affichage de la séquence */}
          {formData.numeroPlaqueDebut && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center space-x-2 mb-2">
                <Search className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Séquence de plaques:
                </span>
              </div>
              {sequenceValide ? (
                <div className="text-green-600 text-sm">
                  <div className="font-semibold">✓ Séquence disponible</div>
                  <div className="mt-1">{sequencePlaques.join(" → ")}</div>
                </div>
              ) : messageSequence ? (
                <div className="text-red-600 text-sm">
                  <div className="font-semibold">✗ {messageSequence}</div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  Saisissez un numéro de plaque valide pour voir la séquence
                </div>
              )}
            </div>
          )}
        </div>

        {/* CALCUL ET SOUMISSION */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Calculator className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Calcul et Validation
              </h2>
              <p className="text-gray-600 text-sm">
                Montant à payer et soumission de la demande
              </p>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-blue-600 font-medium mb-2">
                  Détails du calcul
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Montant initial:</span>
                    <span className="font-medium">
                      {montantInitial.toFixed(2)} $
                    </span>
                  </div>
                  {reductionMontant > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Réduction:</span>
                      <span className="font-medium text-red-600">
                        -{reductionMontant.toFixed(2)} $
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-blue-800 border-t pt-2">
                    <span>Montant final:</span>
                    <span>{montantAPayer}</span>
                  </div>
                </div>
                {tauxActif && (
                  <div className="text-sm text-blue-500 mt-4">
                    Taux: 1$ = {tauxActif.valeur.toLocaleString("fr-FR")} CDF
                  </div>
                )}
                <div className="text-xs text-blue-500 mt-1">
                  {formuleCalcul}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-600 font-medium">
                  Montant en Francs
                </div>
                <div className="text-2xl font-bold text-blue-800 mt-2">
                  {montantEnFrancs}
                </div>
                <div className="text-sm text-gray-600 mt-4">
                  Délai d'accord:{" "}
                  <span className="font-bold text-green-600">Immédiat</span>
                </div>
                {utilisateur && (
                  <div className="text-sm text-blue-500 mt-2">
                    Site: {utilisateur.site_nom}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium border-2 border-transparent hover:border-gray-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !sequenceValide}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Traitement...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Soumettre la demande</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Modal de Confirmation */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Confirmation</h3>
              <button
                onClick={() => setShowConfirmation(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">
                  Récapitulatif de la commande
                </h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <div>
                    <strong>Client:</strong> {formData.prenom} {formData.nom}
                  </div>
                  <div>
                    <strong>Téléphone:</strong> {formData.telephone}
                  </div>
                  <div>
                    <strong>NIF:</strong> {formData.nif || "Non renseigné"}
                  </div>
                  <div>
                    <strong>Plaque de début:</strong>{" "}
                    {formData.numeroPlaqueDebut}
                  </div>
                  <div>
                    <strong>Nombre de plaques:</strong> {nombrePlaques}
                  </div>
                  <div>
                    <strong>Séquence:</strong>{" "}
                    {sequencePlaques.length > 0
                      ? `${sequencePlaques[0]} → ${
                          sequencePlaques[sequencePlaques.length - 1]
                        }`
                      : "Aucune séquence"}
                  </div>
                  {reductionMontant > 0 && (
                    <div>
                      <strong>Réduction:</strong> -{reductionMontant.toFixed(2)}{" "}
                      $
                    </div>
                  )}
                  <div>
                    <strong>Montant total:</strong> {montantAPayer}
                  </div>
                  <div>
                    <strong>Équivalent:</strong> {montantEnFrancs}
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm">
                Êtes-vous sûr de vouloir procéder au paiement de cette commande
                ?
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmation}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold"
              >
                Confirmer et Payer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Paiement */}
      {showPaiement && (
        <ModalPaiement
          montant={montantAPayer}
          montantEnFrancs={montantEnFrancs}
          onClose={() => setShowPaiement(false)}
          onSubmit={handlePaiementSubmit}
          isLoading={isSubmitting}
          paiementData={paiementData}
          setPaiementData={setPaiementData}
        />
      )}

      {/* Modal Facture A4 */}
      {showFacture && factureData && (
        <FactureA4 factureData={factureData} onClose={handleCloseFacture} />
      )}
    </>
  );
}

// Composant Modal de Paiement (inchangé)
interface ModalPaiementProps {
  montant: string;
  montantEnFrancs: string;
  onClose: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  paiementData: PaiementData;
  setPaiementData: (data: PaiementData) => void;
}

function ModalPaiement({
  montant,
  montantEnFrancs,
  onClose,
  onSubmit,
  isLoading,
  paiementData,
  setPaiementData,
}: ModalPaiementProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Mode de Paiement</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mode de paiement */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Mode de paiement *
            </label>
            <select
              value={paiementData.modePaiement}
              onChange={(e) =>
                setPaiementData({
                  ...paiementData,
                  modePaiement: e.target.value as any,
                })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            >
              <option value="mobile_money">Mobile Money</option>
              <option value="cheque">Chèque</option>
              <option value="banque">Banque</option>
              <option value="espece">Espèce</option>
            </select>
          </div>

          {/* Champs conditionnels */}
          {paiementData.modePaiement === "mobile_money" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Opérateur *
                </label>
                <select
                  value={paiementData.operateur || ""}
                  onChange={(e) =>
                    setPaiementData({
                      ...paiementData,
                      operateur: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                >
                  <option value="">Sélectionner un opérateur</option>
                  <option value="vodacom">Vodacom</option>
                  <option value="airtel">Airtel</option>
                  <option value="africel">Africel</option>
                  <option value="orange">Orange</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Numéro de transaction *
                </label>
                <input
                  type="text"
                  value={paiementData.numeroTransaction || ""}
                  onChange={(e) =>
                    setPaiementData({
                      ...paiementData,
                      numeroTransaction: e.target.value,
                    })
                  }
                  placeholder="Entrez le numéro de transaction"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </>
          )}

          {paiementData.modePaiement === "cheque" && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Numéro de chèque *
              </label>
              <input
                type="text"
                value={paiementData.numeroCheque || ""}
                onChange={(e) =>
                  setPaiementData({
                    ...paiementData,
                    numeroCheque: e.target.value,
                  })
                }
                placeholder="Entrez le numéro de chèque"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              />
            </div>
          )}

          {paiementData.modePaiement === "banque" && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Banque *
              </label>
              <input
                type="text"
                value={paiementData.banque || ""}
                onChange={(e) =>
                  setPaiementData({
                    ...paiementData,
                    banque: e.target.value,
                  })
                }
                placeholder="Entrez le nom de la banque"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              />
            </div>
          )}

          {/* Montant */}
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">
              Montant à payer
            </div>
            <div className="text-3xl font-bold text-blue-800">{montant}</div>
            <div className="text-lg font-semibold text-blue-700 mt-2">
              {montantEnFrancs}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 font-semibold border-2 border-transparent hover:border-gray-300"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Traitement..." : "Confirmer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
