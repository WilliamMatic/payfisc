"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  Car,
  CreditCard,
  FileText,
  CheckCircle,
  Printer,
  Search,
  AlertCircle,
  X,
  CheckCircle2,
  Hash,
  Lock,
  RefreshCw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getImpotById } from "@/services/impots/impotService";
import { Impot } from "@/services/impots/impotService";
import {
  verifierIdDGRK,
  traiterRefactor,
  type DonneesRefactor,
} from "@/services/refactor/refactorService";
import { getTauxActif, type Taux } from "@/services/taux/tauxService";
import RefactorPrint from "./RefactorPrint";
import { useAuth } from "@/contexts/AuthContext";

// Import des services pour les données dynamiques
import {
  getTypeEnginsActifs,
  type TypeEngin,
} from "@/services/type-engins/typeEnginService";
import { getEnergies, type Energie } from "@/services/energies/energieService";
import {
  getCouleurs,
  type EnginCouleur,
} from "@/services/couleurs/couleurService";
import { getUsages, type UsageEngin } from "@/services/usages/usageService";
import {
  getPuissancesFiscalesActives,
  type PuissanceFiscale,
} from "@/services/puissances-fiscales/puissanceFiscaleService";

// Interfaces pour les modals
interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  data: any;
}

// Composant Modal de Succès
const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  onPrint,
  data,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100">
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Refactorisation Réussie!
            </h3>
            <p className="text-gray-600 text-sm">
              Les données ont été corrigées avec succès.
            </p>
          </div>

          <div className="space-y-4 mb-4">
            <div className="text-center bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
              <div className="text-sm text-green-600 font-medium">
                Numéro de plaque
              </div>
              <div className="text-2xl font-bold text-green-700 mt-1">
                {data?.numero_plaque}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 text-xs">Assujetti:</span>
                <p className="font-semibold text-gray-800">
                  {data?.nom} {data?.prenom}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">ID DGRK:</span>
                <p className="font-semibold text-gray-800">{data?.id}</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onPrint}
              className="flex-1 px-4 py-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all font-semibold"
            >
              Imprimer la Carte
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold"
            >
              Terminer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function RefactorServicesClient() {
  const router = useRouter();
  const params = useParams();
  const [impot, setImpot] = useState<Impot | null>(null);
  const [etapeActuelle, setEtapeActuelle] = useState<"verification" | "confirmation" | "recapitulatif">("verification");
  const [idDGRK, setIdDGRK] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [donneesRefactor, setDonneesRefactor] = useState<DonneesRefactor | null>(null);
  const [erreurVerification, setErreurVerification] = useState("");
  const [successData, setSuccessData] = useState<any>(null);
  const [printData, setPrintData] = useState<any>(null);

  // États pour le taux
  const [tauxActif, setTauxActif] = useState<Taux | null>(null);
  const [loadingTaux, setLoadingTaux] = useState(false);

  // États pour les données dynamiques
  const [typeEngins, setTypeEngins] = useState<TypeEngin[]>([]);
  const [energies, setEnergies] = useState<Energie[]>([]);
  const [couleurs, setCouleurs] = useState<EnginCouleur[]>([]);
  const [usages, setUsages] = useState<UsageEngin[]>([]);
  const [puissancesFiscales, setPuissancesFiscales] = useState<PuissanceFiscale[]>([]);
  const [filteredPuissances, setFilteredPuissances] = useState<PuissanceFiscale[]>([]);

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    adresse: "",
    nif: "",
    typeEngin: "",
    anneeFabrication: "",
    anneeCirculation: "",
    couleur: "",
    puissanceFiscal: "",
    usage: "",
    marque: "",
    energie: "",
    numeroPlaque: "",
    numeroChassis: "",
    numeroMoteur: "",
  });

  const { utilisateur, isLoading: authLoading } = useAuth();
  const [parsedPrivileges, setParsedPrivileges] = useState<any>(null);

  // Parser les privilèges quand utilisateur change
  useEffect(() => {
    if (utilisateur?.privileges_include) {
      try {
        const parsed = JSON.parse(utilisateur.privileges_include);
        setParsedPrivileges(parsed);
      } catch (error) {
        console.error('Erreur parsing privileges:', error);
        setParsedPrivileges({});
      }
    } else if (utilisateur) {
      setParsedPrivileges({});
    }
  }, [utilisateur]);

  // Charger l'impôt au montage du composant
  useEffect(() => {
    const chargerImpot = async () => {
      if (params.id) {
        try {
          const impotResponse = await getImpotById(params.id as string);
          if (impotResponse.status === "success" && impotResponse.data) {
            setImpot(impotResponse.data);
          }
        } catch (error) {
          console.error("Erreur lors du chargement de l'impôt:", error);
        }
      }
    };

    chargerImpot();
  }, [params.id]);

  // Calcul des montants avec taux - avec vérification de l'impôt
  const montantDollars = impot ? impot.prix.toString() : "0";
  const montantFrancs = tauxActif && impot
    ? (impot.prix * tauxActif.valeur).toLocaleString("fr-FR")
    : "Calcul en cours...";

  const prixFormate = `${montantDollars} $`;
  const montantEnFrancs = `${montantFrancs} CDF`;

  // Chargement du taux actif
  useEffect(() => {
    const chargerTaux = async () => {
      setLoadingTaux(true);
      try {
        const tauxResponse = await getTauxActif();
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

  // Chargement des données dynamiques au montage du composant
  useEffect(() => {
    const loadDynamicData = async () => {
      try {
        // Charger les types d'engins
        const typeEnginsResponse = await getTypeEnginsActifs();
        if (typeEnginsResponse.status === "success") {
          setTypeEngins(typeEnginsResponse.data || []);
        }

        // Charger les énergies
        const energiesResponse = await getEnergies();
        if (energiesResponse.status === "success") {
          setEnergies(energiesResponse.data || []);
        }

        // Charger les couleurs
        const couleursResponse = await getCouleurs();
        if (couleursResponse.status === "success") {
          setCouleurs(couleursResponse.data || []);
        }

        // Charger les usages
        const usagesResponse = await getUsages();
        if (usagesResponse.status === "success") {
          setUsages(usagesResponse.data || []);
        }

        // Charger les puissances fiscales
        const puissancesResponse = await getPuissancesFiscalesActives();
        if (puissancesResponse.status === "success") {
          setPuissancesFiscales(puissancesResponse.data || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données dynamiques:", error);
      }
    };

    loadDynamicData();
  }, []);

  // Filtrer les puissances quand le type d'engin change
  useEffect(() => {
    if (formData.typeEngin) {
      const puissancesFiltrees = puissancesFiscales.filter(
        (puissance) => puissance.type_engin_libelle === formData.typeEngin
      );
      setFilteredPuissances(puissancesFiltrees);
    } else {
      setFilteredPuissances([]);
    }
  }, [formData.typeEngin, puissancesFiscales]);

  // Récupération des données depuis la base via ID DGRK
  const recupererDonneesDGRK = async (idDGRK: string) => {
    setIsLoading(true);
    setErreurVerification("");

    try {
      const result = await verifierIdDGRK(idDGRK);

      if (result.status === "error") {
        setErreurVerification(result.message || "Erreur lors de la vérification");
        return;
      }

      const donnees = result.data as DonneesRefactor;
      setDonneesRefactor(donnees);

      // Mise à jour du formulaire avec les données récupérées
      setFormData({
        nom: donnees.nom || "",
        prenom: donnees.prenom || "",
        telephone: donnees.telephone || "",
        email: donnees.email || "",
        adresse: donnees.adresse || "",
        nif: donnees.nif || "",
        typeEngin: donnees.type_engin || "",
        anneeFabrication: donnees.annee_fabrication || "",
        anneeCirculation: donnees.annee_circulation || "",
        couleur: donnees.couleur || "",
        puissanceFiscal: donnees.puissance_fiscal || "",
        usage: donnees.usage_engin || "",
        marque: donnees.marque || "",
        energie: donnees.energie || "",
        numeroPlaque: donnees.numero_plaque || "",
        numeroChassis: donnees.numero_chassis || "",
        numeroMoteur: donnees.numero_moteur || "",
      });

      setEtapeActuelle("confirmation");
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      setErreurVerification("Erreur lors de la récupération des informations DGRK.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = () => {
    if (!idDGRK.trim()) {
      setErreurVerification("Veuillez saisir l'identifiant DGRK");
      return;
    }

    recupererDonneesDGRK(idDGRK);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const traiterRefactorisation = async () => {
    if (!impot) {
      alert("Impossible de traiter le refactor: impôt non chargé");
      return;
    }

    setIsLoading(true);

    try {
      const result = await traiterRefactor(
        idDGRK,
        {
          type_engin: formData.typeEngin,
          marque: formData.marque,
          energie: formData.energie,
          annee_fabrication: formData.anneeFabrication,
          annee_circulation: formData.anneeCirculation,
          couleur: formData.couleur,
          puissance_fiscal: formData.puissanceFiscal,
          usage_engin: formData.usage,
          numero_chassis: formData.numeroChassis,
          numero_moteur: formData.numeroMoteur,
        },
        {
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone,
          email: formData.email,
          adresse: formData.adresse,
          nif: formData.nif,
        }
      );

      if (result.status === "success") {
        // Préparer les données pour l'impression
        const completeData = {
          ...result.data,
          nom: formData.nom,
          prenom: formData.prenom,
          adresse: formData.adresse,
          nif: formData.nif,
          type_engin: formData.typeEngin,
          marque: formData.marque,
          energie: formData.energie,
          couleur: formData.couleur,
          usage: formData.usage,
          numero_plaque: formData.numeroPlaque,
          numero_chassis: formData.numeroChassis,
          numero_moteur: formData.numeroMoteur,
          annee_fabrication: formData.anneeFabrication,
          annee_circulation: formData.anneeCirculation,
          puissance_fiscal: formData.puissanceFiscal,
          montant: donneesRefactor?.montant?.toString() || "0",
          date_jour: new Date().toLocaleDateString('fr-FR')
        };

        setSuccessData(completeData);
        setPrintData(completeData);
        setShowSuccess(true);
      } else {
        alert(result.message || "Erreur lors du traitement du refactor");
      }
    } catch (error) {
      console.error("Erreur lors du refactor:", error);
      alert("Erreur lors du traitement du refactor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    setShowSuccess(false);
    setShowPrint(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    // Réinitialiser pour un nouveau refactor
    setEtapeActuelle("verification");
    setIdDGRK("");
    setFormData({
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
      adresse: "",
      nif: "",
      typeEngin: "",
      anneeFabrication: "",
      anneeCirculation: "",
      couleur: "",
      puissanceFiscal: "",
      usage: "",
      marque: "",
      energie: "",
      numeroPlaque: "",
      numeroChassis: "",
      numeroMoteur: "",
    });
  };

  const handlePrintClose = () => {
    setShowPrint(false);
    // Réinitialiser complètement
    setEtapeActuelle("verification");
    setIdDGRK("");
    setFormData({
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
      adresse: "",
      nif: "",
      typeEngin: "",
      anneeFabrication: "",
      anneeCirculation: "",
      couleur: "",
      puissanceFiscal: "",
      usage: "",
      marque: "",
      energie: "",
      numeroPlaque: "",
      numeroChassis: "",
      numeroMoteur: "",
    });
  };

  // Générer les options d'années
  const anneeOptions = Array.from({ length: 30 }, (_, i) =>
    (new Date().getFullYear() - i).toString()
  );

  // Afficher un écran de chargement pendant le chargement de l'impôt
  if (!impot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Chargement du service...
          </h2>
          <p className="text-gray-600">
            Veuillez patienter pendant le chargement des données.
          </p>
        </div>
      </div>
    );
  }

  // Afficher un écran de chargement pendant la vérification d'authentification et parsing
  if (authLoading || parsedPrivileges === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Chargement...
          </h2>
          <p className="text-gray-600">
            Veuillez patienter pendant que nous vérifions vos accès.
          </p>
        </div>
      </div>
    );
  }

  // Si pas d'utilisateur connecté
  if (!utilisateur) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Session expirée
          </h2>
          <p className="text-gray-600 mb-6">
            Veuillez vous reconnecter pour accéder à cette page.
          </p>
          <button
            onClick={() => router.push('/system/login')}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur a le privilège "reproduction"
  if (!parsedPrivileges.reproduction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Accès Refusé
            </h2>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas les privilèges nécessaires pour accéder à cette
              fonctionnalité.
            </p>
            <div className="text-sm text-gray-500 mb-4">
              <div className="text-left bg-gray-50 p-3 rounded-lg">
                <div className="font-medium mb-2">Vos privilèges:</div>
                {Object.entries(parsedPrivileges).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="font-medium">{key}:</span>
                    <span className={value ? 'text-green-600' : 'text-red-600'}>
                      {value ? 'Activé' : 'Désactivé'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Retour</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Rendu de l'étape de vérification
  const renderEtapeVerification = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-red-100 p-2 rounded-lg">
          <Search className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Étape 1: Vérification de l'ID DGRK
          </h2>
          <p className="text-gray-600 text-sm">
            Saisissez l'identifiant DGRK pour récupérer les informations du véhicule à corriger
          </p>
        </div>
      </div>

      <div className="max-w-md">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Identifiant DGRK <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={idDGRK}
            onChange={(e) => {
              setIdDGRK(e.target.value);
              setErreurVerification("");
            }}
            placeholder="Ex: 12345"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <p className="text-gray-500 text-sm mt-2">
            Le système récupérera automatiquement les informations depuis la base DGI
          </p>
        </div>

        {erreurVerification && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-800 text-sm">
                Erreur de vérification
              </h4>
              <p className="text-red-700 text-sm mt-1">{erreurVerification}</p>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-start space-x-3">
            <RefreshCw className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800 text-sm">
                Service de Correction
              </h4>
              <div className="text-lg font-bold text-red-800">
                Correction des données
              </div>
              <div className="text-md font-semibold text-red-700 mt-1">
                Aucun frais supplémentaire
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={handleVerification}
            disabled={isLoading || !idDGRK.trim()}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Vérification en cours...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Vérifier et Continuer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Rendu de l'étape confirmation
  const renderEtapeConfirmation = () => (
    <div className="space-y-8">
      {/* EN-TÊTE AVEC DONNÉES RÉCUPÉRÉES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            Informations Récupérées - ID DGRK: {idDGRK}
          </h3>
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            ✓ Données DGI
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Numéro de Plaque:</span>
            <div className="text-gray-700 font-medium">
              {formData.numeroPlaque}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Propriétaire:</span>
            <div className="text-gray-700 font-medium">
              {formData.prenom} {formData.nom}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Montant payé:</span>
            <div className="text-gray-700 font-medium">
              {donneesRefactor?.montant} $
            </div>
          </div>
        </div>
      </div>

      {/* INFORMATIONS ASSUJETTI */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-red-100 p-2 rounded-lg">
            <User className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Informations de l'Assujetti
            </h2>
            <p className="text-gray-600 text-sm">
              Corrigez les informations personnelles du propriétaire
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => handleInputChange("nom", e.target.value)}
              placeholder="Entrez le nom"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.prenom}
              onChange={(e) => handleInputChange("prenom", e.target.value)}
              placeholder="Entrez le prénom"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de téléphone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.telephone}
              onChange={(e) => handleInputChange("telephone", e.target.value)}
              placeholder="Ex: +243 00 00 00 000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="exemple@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse physique <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.adresse}
              onChange={(e) => handleInputChange("adresse", e.target.value)}
              placeholder="Entrez l'adresse complète"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro d'Identification Fiscale (NIF)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={formData.nif}
                onChange={(e) => handleInputChange("nif", e.target.value)}
                placeholder="NIF"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="bg-red-100 p-2 rounded-lg">
                <Hash className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INFORMATIONS VÉHICULE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-red-100 p-2 rounded-lg">
            <Car className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Informations de l'Engin
            </h2>
            <p className="text-gray-600 text-sm">
              Corrigez les caractéristiques techniques du véhicule
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'engin <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.typeEngin}
              onChange={(e) => handleInputChange("typeEngin", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Sélectionner le type d'engin</option>
              {typeEngins.map((option) => (
                <option key={option.id} value={option.libelle}>
                  {option.libelle}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marque <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.marque}
              onChange={(e) => handleInputChange("marque", e.target.value)}
              placeholder="Entrez la marque du véhicule"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Énergie
            </label>
            <select
              value={formData.energie}
              onChange={(e) => handleInputChange("energie", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Sélectionner l'énergie</option>
              {energies.map((option) => (
                <option key={option.id} value={option.nom}>
                  {option.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année de fabrication
            </label>
            <select
              value={formData.anneeFabrication}
              onChange={(e) => handleInputChange("anneeFabrication", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Sélectionner l'année</option>
              {anneeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année de circulation
            </label>
            <select
              value={formData.anneeCirculation}
              onChange={(e) => handleInputChange("anneeCirculation", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Sélectionner l'année</option>
              {anneeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur
            </label>
            <select
              value={formData.couleur}
              onChange={(e) => handleInputChange("couleur", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Sélectionner la couleur</option>
              {couleurs.map((option) => (
                <option key={option.id} value={option.nom}>
                  {option.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Puissance Fiscal
            </label>
            <select
              value={formData.puissanceFiscal}
              onChange={(e) => handleInputChange("puissanceFiscal", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Sélectionner la puissance</option>
              {filteredPuissances.map((option) => (
                <option key={option.id} value={option.libelle}>
                  {option.libelle}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usage <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.usage}
              onChange={(e) => handleInputChange("usage", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Sélectionner l'usage</option>
              {usages.map((option) => (
                <option key={option.id} value={option.libelle}>
                  {option.libelle}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de châssis
            </label>
            <input
              type="text"
              value={formData.numeroChassis}
              onChange={(e) => handleInputChange("numeroChassis", e.target.value)}
              placeholder="Entrez le numéro de châssis"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de moteur
            </label>
            <input
              type="text"
              value={formData.numeroMoteur}
              onChange={(e) => handleInputChange("numeroMoteur", e.target.value)}
              placeholder="Entrez le numéro de moteur"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {/* VALIDATION */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200 mb-6">
          <div>
            <h4 className="font-semibold text-red-800 text-sm">
              Service de Correction
            </h4>
            <div className="text-2xl font-bold text-red-800">
              Refactorisation des données
            </div>
            <div className="text-lg font-semibold text-red-700 mt-2">
              Aucun frais supplémentaire
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-red-600 font-medium">Statut</div>
            <div className="text-xl font-bold text-green-600">Correction</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setEtapeActuelle("verification");
              setErreurVerification("");
            }}
            className="flex items-center space-x-2 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium border-2 border-transparent hover:border-gray-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>

          <button
            onClick={traiterRefactorisation}
            disabled={isLoading}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isLoading ? "Traitement..." : "Corriger les données"}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* HEADER */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Retour aux services</span>
            </button>
            <div className="text-sm text-gray-500">ID: #{impot.id}</div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <RefreshCw className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestion des Erreurs - Refactorisation
              </h1>
              <p className="text-gray-600 mt-1">
                Correction des informations mal saisies sur les cartes roses
              </p>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-800 text-sm">
              Ce service permet de corriger les informations mal saisies sur les cartes roses existantes. 
              Saisissez l'identifiant DGRK pour récupérer automatiquement les informations du véhicule.
            </p>
          </div>

          {/* INDICATEUR D'ÉTAPE */}
          <div className="mt-6">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {["verification", "confirmation", "recapitulatif"].map((etape, index) => (
                <div key={etape} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      etapeActuelle === etape
                        ? "bg-red-600 text-white"
                        : index < ["verification", "confirmation", "recapitulatif"].indexOf(etapeActuelle)
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {index < ["verification", "confirmation", "recapitulatif"].indexOf(etapeActuelle) ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 2 && (
                    <div className="w-16 h-1 bg-gray-300 mx-2"></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between max-w-2xl mx-auto mt-2 text-xs text-gray-600">
              <span>Vérification</span>
              <span>Correction</span>
              <span>Terminé</span>
            </div>
          </div>
        </div>

        {/* CONTENU PRINCIPAL */}
        {etapeActuelle === "verification" && renderEtapeVerification()}
        {etapeActuelle === "confirmation" && renderEtapeConfirmation()}

        {/* MODALS */}
        <SuccessModal
          isOpen={showSuccess}
          onClose={handleSuccessClose}
          onPrint={handlePrint}
          data={successData}
        />

        <RefactorPrint
          data={printData}
          isOpen={showPrint}
          onClose={handlePrintClose}
        />
      </div>
    </div>
  );
}