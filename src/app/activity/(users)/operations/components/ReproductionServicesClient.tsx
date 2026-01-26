"use client";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  User,
  Car,
  CreditCard,
  Smartphone,
  Building,
  FileText,
  DollarSign,
  CheckCircle,
  Printer,
  Search,
  AlertCircle,
  X,
  CheckCircle2,
  Hash,
  Lock,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Impot } from "@/services/impots/impotService";
import {
  verifierPlaque,
  traiterReproduction,
  type DonneesPlaque,
  type PaiementReproductionData,
  type ReproductionResponse,
} from "@/services/reproduction/reproductionService";
import { getTauxActif, type Taux } from "@/services/taux/tauxService";
import ReproductionPrint from "./ReproductionPrint";
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

interface ReproductionServicesClientProps {
  impot: Impot;
}

interface FormData {
  // Informations de l'assujetti
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  nif: string;

  // Informations de l'engin
  typeEngin: string;
  anneeFabrication: string;
  anneeCirculation: string;
  couleur: string;
  puissanceFiscal: string;
  usage: string;
  marque: string;
  energie: string;
  numeroPlaque: string;
  numeroChassis: string;
  numeroMoteur: string;
}

interface PaiementData {
  modePaiement: "mobile_money" | "cheque" | "banque" | "espece" | "";
  operateur?: string;
  numeroTransaction?: string;
  numeroCheque?: string;
  banque?: string;
  montant: string;
  codePromo?: string;
}

type Etape = "verification" | "confirmation" | "paiement" | "recapitulatif";

// Interfaces pour les modals
interface PaiementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaiement: (paiementData: PaiementData) => void;
  montant: string;
  montantEnFrancs: string;
  isLoading: boolean;
}

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  data: any;
}

// Composant Modal de Paiement
const PaiementModal: React.FC<PaiementModalProps> = ({
  isOpen,
  onClose,
  onPaiement,
  montant,
  montantEnFrancs,
  isLoading,
}) => {
  const [modePaiement, setModePaiement] = useState<
    "mobile_money" | "cheque" | "banque" | "espece"
  >("mobile_money");
  const [operateur, setOperateur] = useState("");
  const [numeroTransaction, setNumeroTransaction] = useState("");
  const [numeroCheque, setNumeroCheque] = useState("");
  const [banque, setBanque] = useState("");
  const [codePromo, setCodePromo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPaiement({
      modePaiement,
      operateur: modePaiement === "mobile_money" ? operateur : undefined,
      numeroTransaction:
        modePaiement === "mobile_money" ? numeroTransaction : undefined,
      numeroCheque: modePaiement === "cheque" ? numeroCheque : undefined,
      banque: modePaiement === "banque" ? banque : undefined,
      montant: montant.replace(" $", ""),
      codePromo: codePromo || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Mode de Paiement</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Mode de paiement *
            </label>
            <select
              value={modePaiement}
              onChange={(e) => setModePaiement(e.target.value as any)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            >
              <option value="mobile_money">Mobile Money</option>
              <option value="cheque">Chèque</option>
              <option value="banque">Banque</option>
              <option value="espece">Espèce</option>
            </select>
          </div>

          {modePaiement === "mobile_money" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Opérateur *
                </label>
                <select
                  value={operateur}
                  onChange={(e) => setOperateur(e.target.value)}
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
                  value={numeroTransaction}
                  onChange={(e) => setNumeroTransaction(e.target.value)}
                  placeholder="Entrez le numéro de transaction"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </>
          )}

          {modePaiement === "cheque" && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Numéro de chèque *
              </label>
              <input
                type="text"
                value={numeroCheque}
                onChange={(e) => setNumeroCheque(e.target.value)}
                placeholder="Entrez le numéro de chèque"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              />
            </div>
          )}

          {modePaiement === "banque" && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Banque *
              </label>
              <input
                type="text"
                value={banque}
                onChange={(e) => setBanque(e.target.value)}
                placeholder="Entrez le nom de la banque"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              />
            </div>
          )}

          {/* Section Code Promo */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center space-x-2 mb-3">
              <Tag className="w-4 h-4 text-green-600" />
              <label className="block text-sm font-semibold text-gray-800">
                Code Promo (Facultatif)
              </label>
            </div>
            <input
              type="text"
              value={codePromo}
              onChange={(e) => setCodePromo(e.target.value.toUpperCase())}
              placeholder="Entrez votre code promo à 4 chiffres"
              maxLength={4}
              pattern="[0-9]{4}"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            />
            <p className="text-gray-500 text-xs mt-2">
              Saisissez un code promo à 4 chiffres si vous en avez un
            </p>
          </div>

          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">
              Montant à payer
            </div>
            <div className="text-2xl font-bold text-blue-800">{montant}</div>
            <div className="text-lg font-semibold text-blue-700 mt-2">
              {montantEnFrancs}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 font-semibold"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold disabled:opacity-50"
            >
              {isLoading ? "Traitement..." : "Confirmer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
              Reproduction Réussie!
            </h3>
            <p className="text-gray-600 text-sm">
              La demande de reproduction a été traitée avec succès.
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
                <span className="text-gray-500 text-xs">Montant payé:</span>
                <p className="font-semibold text-gray-800">{data?.montant} $</p>
                <p className="text-xs text-gray-600">{data?.montant_francs}</p>
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

export default function ReproductionServicesClient({
  impot,
}: ReproductionServicesClientProps) {
  const router = useRouter();
  const [etapeActuelle, setEtapeActuelle] = useState<Etape>("verification");
  const [numeroPlaque, setNumeroPlaque] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPaiement, setShowPaiement] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [paiementData, setPaiementData] = useState<PaiementData>({
    modePaiement: "",
    montant: impot.prix.toString(),
  });
  const [isPaiementProcessing, setIsPaiementProcessing] = useState(false);
  const [donneesPlaque, setDonneesPlaque] = useState<DonneesPlaque | null>(
    null
  );
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
  const [puissancesFiscales, setPuissancesFiscales] = useState<
    PuissanceFiscale[]
  >([]);
  const [filteredPuissances, setFilteredPuissances] = useState<
    PuissanceFiscale[]
  >([]);

  const [formData, setFormData] = useState<FormData>({
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
        console.error("Erreur parsing privileges:", error);
        setParsedPrivileges({});
      }
    } else if (utilisateur) {
      setParsedPrivileges({});
    }
  }, [utilisateur]);

  // Calcul des montants avec taux
  const montantDollars = impot.prix.toString();
  const montantFrancs = tauxActif
    ? (impot.prix * tauxActif.valeur).toLocaleString("fr-FR")
    : "Calcul en cours...";

  const prixFormate = `${montantDollars} $`;
  const montantEnFrancs = `${montantFrancs} CDF`;

  // Chargement du taux actif
  useEffect(() => {
    const chargerTaux = async () => {
      setLoadingTaux(true);
      try {
        const tauxResponse = await getTauxActif({
          province_id: null,
          impot_id: Number(impot.id),
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
        console.error(
          "Erreur lors du chargement des données dynamiques:",
          error
        );
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

  // Récupération des données depuis la base DGI OU externe
  const recupererDonneesPlaque = async (plaque: string) => {
    setIsLoading(true);
    setErreurVerification("");

    try {
      // Utiliser site_code au lieu de site_nom pour la recherche
      const result = await verifierPlaque(
        plaque,
        utilisateur?.site_code || "",
        utilisateur?.extension_site ?? 0
      );

      console.log("Résultat de la vérification plaque:", result);

      if (result.status === "error") {
        setErreurVerification(
          result.message || "Erreur lors de la vérification"
        );
        return;
      }

      const donnees = result.data as DonneesPlaque;
      setDonneesPlaque(donnees);

      // Vérifier si la source est externe
      const source = result.source; // 'locale' ou 'externe'

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

      // Stocker aussi la source pour affichage
      if (result.source) {
        setDonneesPlaque((prev) =>
          prev
            ? { ...prev, source: result.source }
            : { ...donnees, source: result.source }
        );
      }

      setEtapeActuelle("confirmation");
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      setErreurVerification(
        "Erreur lors de la récupération des informations de la plaque."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = () => {
    if (!numeroPlaque.trim()) {
      setErreurVerification("Veuillez saisir le numéro de plaque");
      return;
    }

    recupererDonneesPlaque(numeroPlaque);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const procederAuPaiement = () => {
    setShowPaiement(true);
  };

  const traiterPaiement = async (paiementDataForm: PaiementData) => {
    setIsPaiementProcessing(true);

    try {
      const paiementReproductionData: PaiementReproductionData = {
        modePaiement: paiementDataForm.modePaiement as
          | "mobile_money"
          | "cheque"
          | "banque"
          | "espece",
        operateur: paiementDataForm.operateur,
        numeroTransaction: paiementDataForm.numeroTransaction,
        numeroCheque: paiementDataForm.numeroCheque,
        banque: paiementDataForm.banque,
        codePromo: paiementDataForm.codePromo,
      };

      const result = await traiterReproduction(
        impot.id.toString(),
        formData.numeroPlaque,
        paiementReproductionData,
        donneesPlaque?.source, // Passer la source
        utilisateur
      );

      if (result.status === "success") {
        setShowPaiement(false);

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
          montant: impot.prix.toString(),
          montant_francs: montantEnFrancs,
          paiement_id: result.data.paiement_id,
          date_jour: new Date().toLocaleDateString("fr-FR"),
        };

        setSuccessData(completeData);
        setPrintData(completeData);
        setShowSuccess(true);
      } else {
        alert(result.message || "Erreur lors du traitement du paiement");
      }
    } catch (error) {
      console.error("Erreur lors du paiement:", error);
      alert("Erreur lors du traitement du paiement.");
    } finally {
      setIsPaiementProcessing(false);
    }
  };

  const handlePrint = () => {
    setShowSuccess(false);
    setShowPrint(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    // Réinitialiser pour une nouvelle reproduction
    setEtapeActuelle("verification");
    setNumeroPlaque("");
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
    setNumeroPlaque("");
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
            onClick={() => router.push("/system/login")}
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
                {Object.entries(parsedPrivileges).map(
                  ([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          value ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></span>
                      <span className="font-medium">{key}:</span>
                      <span
                        className={value ? "text-green-600" : "text-red-600"}
                      >
                        {value ? "Activé" : "Désactivé"}
                      </span>
                    </div>
                  )
                )}
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
        <div className="bg-blue-100 p-2 rounded-lg">
          <Search className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Étape 1: Vérification de la Plaque
          </h2>
          <p className="text-gray-600 text-sm">
            Saisissez le numéro de plaque pour récupérer les informations du
            véhicule
          </p>
        </div>
      </div>

      <div className="max-w-md">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Numéro de Plaque <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={numeroPlaque}
            onChange={(e) => {
              setNumeroPlaque(e.target.value.toUpperCase());
              setErreurVerification("");
            }}
            placeholder="Ex: AB-123-CD"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-gray-500 text-sm mt-2">
            Le système récupérera automatiquement les informations depuis la
            base DGI ou externe
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

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start space-x-3">
            <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800 text-sm">
                Coût du Service
              </h4>
              <div className="text-lg font-bold text-blue-800">
                {prixFormate}
              </div>
              <div className="text-md font-semibold text-blue-700 mt-1">
                {montantEnFrancs}
              </div>
              {tauxActif && (
                <div className="text-xs text-blue-600 mt-1">
                  Taux: 1$ = {tauxActif.valeur.toLocaleString("fr-FR")} CDF
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={handleVerification}
            disabled={isLoading || !numeroPlaque.trim()}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
            {donneesPlaque?.source === "externe"
              ? `Données récupérées depuis base externe - Plaque: ${formData.numeroPlaque}`
              : `Informations Récupérées - Plaque: ${formData.numeroPlaque}`}
          </h3>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              donneesPlaque?.source === "externe"
                ? "bg-blue-100 text-blue-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {donneesPlaque?.source === "externe"
              ? "✓ Données externes"
              : "✓ Données DGI"}
          </span>
        </div>

        {/* Message d'information pour les données externes */}
        {donneesPlaque?.source === "externe" && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              <strong>Note:</strong> Ces données proviennent de la base externe.
              Un nouvel enregistrement sera créé avec un montant de{" "}
              <strong>10$</strong>.
            </p>
          </div>
        )}

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
            <span className="text-gray-500">Montant:</span>
            <div className="text-gray-700 font-medium">
              {donneesPlaque?.source === "externe"
                ? "10 $ (Nouvel enregistrement)"
                : `${impot.prix} $`}
            </div>
          </div>
        </div>
      </div>

      {/* INFORMATIONS ASSUJETTI */}
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
              {donneesPlaque?.source === "externe"
                ? "Vérifiez et complétez les informations personnelles du propriétaire"
                : "Corrigez les informations personnelles du propriétaire"}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="bg-blue-100 p-2 rounded-lg">
                <Hash className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INFORMATIONS VÉHICULE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-green-100 p-2 rounded-lg">
            <Car className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Informations de l'Engin
            </h2>
            <p className="text-gray-600 text-sm">
              {donneesPlaque?.source === "externe"
                ? "Vérifiez et complétez les caractéristiques techniques du véhicule"
                : "Corrigez les caractéristiques techniques du véhicule"}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Énergie
            </label>
            <input
              type="text"
              value={formData.energie}
              onChange={(e) => handleInputChange("energie", e.target.value)}
              placeholder="Entrez le type d'énergie"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année de fabrication
            </label>
            <input
              type="text"
              value={formData.anneeFabrication}
              onChange={(e) =>
                handleInputChange("anneeFabrication", e.target.value)
              }
              placeholder="Ex: 2020"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année de circulation
            </label>
            <input
              type="text"
              value={formData.anneeCirculation}
              onChange={(e) =>
                handleInputChange("anneeCirculation", e.target.value)
              }
              placeholder="Ex: 2021"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur
            </label>
            <input
              type="text"
              value={formData.couleur}
              onChange={(e) => handleInputChange("couleur", e.target.value)}
              placeholder="Ex: Rouge"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Puissance Fiscal
            </label>
            <input
              type="text"
              value={formData.puissanceFiscal}
              onChange={(e) =>
                handleInputChange("puissanceFiscal", e.target.value)
              }
              placeholder="Ex: 10 CV"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usage <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.usage}
              onChange={(e) => handleInputChange("usage", e.target.value)}
              placeholder="Ex: Transport de personnes"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de châssis
            </label>
            <input
              type="text"
              value={formData.numeroChassis}
              onChange={(e) =>
                handleInputChange("numeroChassis", e.target.value)
              }
              placeholder="Entrez le numéro de châssis"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de moteur
            </label>
            <input
              type="text"
              value={formData.numeroMoteur}
              onChange={(e) =>
                handleInputChange("numeroMoteur", e.target.value)
              }
              placeholder="Entrez le numéro de moteur"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* RÉSUMÉ ET PAIEMENT */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 mb-6">
          <div>
            <h4 className="font-semibold text-blue-800 text-sm">
              Frais de Reproduction
            </h4>
            <div className="text-2xl font-bold text-blue-800">
              {donneesPlaque?.source === "externe" ? "10 $" : prixFormate}
            </div>
            <div className="text-lg font-semibold text-blue-700 mt-2">
              {donneesPlaque?.source === "externe"
                ? `${(10 * (tauxActif?.valeur || 1)).toLocaleString(
                    "fr-FR"
                  )} CDF`
                : montantEnFrancs}
            </div>
            {tauxActif && (
              <div className="text-sm text-blue-500 mt-2">
                Taux: 1$ = {tauxActif.valeur.toLocaleString("fr-FR")} CDF
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-600 font-medium">Délai</div>
            <div className="text-xl font-bold text-green-600">Immédiat</div>
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
            onClick={procederAuPaiement}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            <CreditCard className="w-4 h-4" />
            <span>Procéder au Paiement</span>
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
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Reproduction de Carte
              </h1>
              <p className="text-gray-600 mt-1">
                Service de reproduction de carte d'immatriculation
              </p>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-800 text-sm">
              Ce service permet de reproduire une carte d'immatriculation perdue
              ou endommagée. Saisissez le numéro de plaque pour récupérer
              automatiquement les informations du véhicule.
              {donneesPlaque?.source === "externe" &&
                " (Données provenant de la base externe)"}
            </p>
          </div>

          {/* INDICATEUR D'ÉTAPE */}
          <div className="mt-6">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {[
                "verification",
                "confirmation",
                "paiement",
                "recapitulatif",
              ].map((etape, index) => (
                <div key={etape} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      etapeActuelle === etape
                        ? "bg-blue-600 text-white"
                        : index <
                          [
                            "verification",
                            "confirmation",
                            "paiement",
                            "recapitulatif",
                          ].indexOf(etapeActuelle)
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {index <
                    [
                      "verification",
                      "confirmation",
                      "paiement",
                      "recapitulatif",
                    ].indexOf(etapeActuelle) ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 3 && (
                    <div className="w-16 h-1 bg-gray-300 mx-2"></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between max-w-2xl mx-auto mt-2 text-xs text-gray-600">
              <span>Vérification</span>
              <span>Confirmation</span>
              <span>Paiement</span>
              <span>Terminé</span>
            </div>
          </div>
        </div>

        {/* CONTENU PRINCIPAL */}
        {etapeActuelle === "verification" && renderEtapeVerification()}
        {etapeActuelle === "confirmation" && renderEtapeConfirmation()}

        {/* MODALS */}
        <PaiementModal
          isOpen={showPaiement}
          onClose={() => setShowPaiement(false)}
          onPaiement={traiterPaiement}
          montant={donneesPlaque?.source === "externe" ? "10 $" : prixFormate}
          montantEnFrancs={
            donneesPlaque?.source === "externe"
              ? `${(10 * (tauxActif?.valeur || 1)).toLocaleString("fr-FR")} CDF`
              : montantEnFrancs
          }
          isLoading={isPaiementProcessing}
        />

        <SuccessModal
          isOpen={showSuccess}
          onClose={handleSuccessClose}
          onPrint={handlePrint}
          data={successData}
        />

        <ReproductionPrint
          data={printData}
          isOpen={showPrint}
          onClose={handlePrintClose}
        />
      </div>
    </div>
  );
}
