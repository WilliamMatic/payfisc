"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Car,
  Ticket,
  CheckCircle,
  AlertCircle,
  Search,
  Bike,
  ArrowLeft,
  User,
  Phone,
  MapPin,
  CreditCard,
  Smartphone,
  Banknote,
  Loader2,
  X,
  Check,
  QrCode,
  Send,
  Printer,
  Database,
  BadgeCheck,
  ChevronDown,
  Shield,
  Calendar,
  Hash,
  Building,
  DollarSign,
  Smartphone as Mobile,
  CalendarDays,
  Building2,
  UserPlus,
  Fuel,
  Gauge,
  CarTaxiFront,
  FileText,
  Clock,
} from "lucide-react";

import { getTauxActif, type Taux } from "@/services/taux/tauxService";
import { getImpotById, Impot } from "@/services/impots/impotService";
import {
  rechercherPlaqueAction,
  enregistrerPaiementAction,
  verifierVignetteExistanteAction,
  getSiteInfo,
  genererNumeroTransaction,
} from "@/actions/vente-vignette";

interface VenteVignetteProps {
  params: {
    id: string;
  };
}

// Interfaces pour les données
interface AssujettiInfo {
  id: number;
  nom_complet: string;
  telephone: string;
  adresse: string;
  nif?: string;
  email?: string;
  particulier_id?: number;
}

interface EnginInfo {
  id: number;
  engin_id?: number;
  numero_plaque: string;
  marque: string;
  modele: string;
  numero_chassis: string;
  numero_moteur: string;
  couleur: string;
  annee_fabrication: string;
  annee_circulation: string;
  energie: string;
  puissance_fiscal: string;
  usage: string;
  date_enregistrement: string;
  site_enregistrement: string;
  utilisateur_enregistrement: string;
  type_engin: string;
}

type ModePaiement = "espece" | "mobile_money" | "carte";

interface ModePaiementOption {
  id: ModePaiement;
  nom: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "error" | "success" | "info";
  title: string;
  message: string;
  buttonText?: string;
  onConfirm?: () => void;
}

// Informations de paiement par carte
interface CarteInfo {
  numero: string;
  nom: string;
  expiration: string;
  cvv: string;
}

interface SiteInfo {
  site_id: number;
  site_nom: string;
  site_code: string;
}

const Modal = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  buttonText = "OK",
  onConfirm,
}: ModalProps) => {
  if (!isOpen) return null;

  const typeConfig = {
    error: {
      icon: AlertCircle,
      bgColor: "bg-gradient-to-r from-rose-500 to-pink-500",
      textColor: "text-rose-600",
      buttonClass:
        "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-rose-200 hover:shadow-rose-300",
    },
    success: {
      icon: CheckCircle,
      bgColor: "bg-gradient-to-r from-emerald-500 to-teal-500",
      textColor: "text-emerald-600",
      buttonClass:
        "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-200 hover:shadow-emerald-300",
    },
    info: {
      icon: BadgeCheck,
      bgColor: "bg-gradient-to-r from-blue-500 to-indigo-500",
      textColor: "text-blue-600",
      buttonClass:
        "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-blue-200 hover:shadow-blue-300",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md">
        <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
          <div className={`h-1.5 ${config.bgColor}`} />
          <div className="p-8">
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mb-6 shadow-lg ring-4 ring-white/50`}
              >
                <Icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3 font-sans">
                {title}
              </h3>

              <p className="text-gray-600 mb-8 leading-relaxed text-[15px]">
                {message}
              </p>

              <div className="flex gap-3 w-full">
                {type === "error" && (
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-semibold hover:shadow-sm border border-gray-200 hover:border-gray-300 active:scale-[0.98]"
                  >
                    Retour
                  </button>
                )}
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-6 py-3.5 rounded-xl transition-all font-semibold shadow-sm hover:shadow-md active:scale-[0.98] ${config.buttonClass}`}
                >
                  {buttonText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function VenteVignettePage({ params }: VenteVignetteProps) {
  const router = useRouter();
  const impotId = useParams();

  // États principaux
  const [etape, setEtape] = useState(1);
  const [numeroPlaque, setNumeroPlaque] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Données réelles
  const [assujetti, setAssujetti] = useState<AssujettiInfo | null>(null);
  const [engin, setEngin] = useState<EnginInfo | null>(null);
  const [modePaiement, setModePaiement] = useState<ModePaiement>("espece");
  const [transactionId, setTransactionId] = useState("");
  const [numeroMobile, setNumeroMobile] = useState("");
  const [carteInfo, setCarteInfo] = useState<CarteInfo>({
    numero: "",
    nom: "",
    expiration: "",
    cvv: "",
  });
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  // États pour le taux
  const [tauxActif, setTauxActif] = useState<Taux | null>(null);
  const [loadingTaux, setLoadingTaux] = useState(false);
  const [impot, setImpot] = useState<Impot | null>(null);

  const { utilisateur, isLoading: authLoading } = useAuth();

  // Modal state
  const [modal, setModal] = useState<
    Omit<ModalProps, "onClose" | "isOpen"> & { isOpen: boolean }
  >({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  // Chargement initial en parallèle
  useEffect(() => {
    const chargerDonneesInitiales = async () => {
      setLoadingTaux(true);

      try {
        // ✅ PARALLÈLE - Tous les fetch démarrent en même temps
        const [tauxResponse, siteResponse, impotResponse] = await Promise.all([
          // 1. Charger le taux actif
          getTauxActif({
            province_id: utilisateur?.province_id || null,
            impot_id: Number(impotId.id),
          }).catch((error) => {
            console.error("Erreur lors du chargement du taux:", error);
            return { status: "error", data: null };
          }),

          // 2. Charger les infos du site
          getSiteInfo().catch((error) => {
            console.error("Erreur lors du chargement du site:", error);
            return { success: false, data: null };
          }),

          // 3. Charger l'impôt seulement si ID existe
          impotId.id
            ? getImpotById(impotId.id as string).catch((error) => {
                console.error("Erreur lors du chargement de l'impôt:", error);
                return { status: "error", data: null };
              })
            : Promise.resolve({ status: "error", data: null }),
        ]);

        // Traiter les résultats

        // Taux
        if (tauxResponse.status === "success" && tauxResponse.data) {
          setTauxActif(tauxResponse.data);
        }

        // Site
        if (siteResponse.success && siteResponse.data) {
          setSiteInfo(siteResponse.data);
        }

        // Impôt
        if (impotResponse.status === "success" && impotResponse.data) {
          setImpot(impotResponse.data);
        }
      } catch (error) {
        console.error("Erreur générale lors du chargement initial:", error);
        setModal({
          isOpen: true,
          type: "error",
          title: "Erreur de chargement",
          message:
            "Impossible de charger les données initiales. Veuillez réessayer.",
        });
      } finally {
        setLoadingTaux(false);
      }
    };

    chargerDonneesInitiales();
  }, [impotId.id]); // Dépendance unique

  // Prix
  const prixVignette = impot?.prix;
  const tauxCDF = tauxActif?.valeur || 2500;
  const prixTotalCDF = prixVignette ? prixVignette * tauxCDF : 0;

  // Modes de paiement
  const modesPaiement: ModePaiementOption[] = [
    {
      id: "espece",
      nom: "Espèces",
      description: "Paiement en espèces",
      icon: Banknote,
      color: "emerald",
      bgColor: "from-emerald-400 to-emerald-600",
    },
    {
      id: "mobile_money",
      nom: "Mobile Money",
      description: "Vodacom, Airtel, Orange",
      icon: Mobile,
      color: "purple",
      bgColor: "from-purple-400 to-purple-600",
    },
    {
      id: "carte",
      nom: "Carte Bancaire",
      description: "Visa / Mastercard",
      icon: CreditCard,
      color: "blue",
      bgColor: "from-blue-400 to-blue-600",
    },
  ];

  // Vérifier si la plaque existe
  const verifierPlaque = async () => {
    if (!numeroPlaque.trim()) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Champ requis",
        message: "Veuillez saisir un numéro de plaque",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Vérifier d'abord si une vignette existe déjà
      const verificationResult =
        await verifierVignetteExistanteAction(numeroPlaque);

      if (verificationResult.success && verificationResult.existe) {
        setModal({
          isOpen: true,
          type: "error",
          title: "Vignette existante",
          message: `Une vignette valide existe déjà pour la plaque "${numeroPlaque.toUpperCase()}"`,
        });
        setIsLoading(false);
        return;
      }

      // Rechercher la plaque dans les bases externes (TSC/HAOJUE/TVS)
      const formData = new FormData();
      formData.append("plaque", numeroPlaque.toUpperCase());
      formData.append(
        "extension",
        utilisateur?.extension_site == null
          ? "0"
          : utilisateur.extension_site.toString(),
      );

      const result = await rechercherPlaqueAction(formData);

      if (!result.success || !result.data) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/refactor/verifier_dgrk.php`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                id_dgrk: numeroPlaque.toUpperCase(),
                site_code: utilisateur?.site_code || "default",
              }),
            },
          );

          const localResult = await response.json();

          if (localResult.status === "success" && localResult.data) {
            const localData = localResult.data;

            setAssujetti({
              id: localData.particulier_id || Date.now(),
              nom_complet:
                `${localData.prenom || ""} ${localData.nom || ""}`.trim(),
              telephone: localData.telephone || "",
              adresse: localData.adresse || "",
              nif: localData.nif || "",
              email: localData.email || "",
              particulier_id: localData.particulier_id,
            });

            setEngin({
              id: localData.engin_id || Date.now(),
              engin_id: localData.engin_id,
              numero_plaque:
                localData.numero_plaque || numeroPlaque.toUpperCase(),
              marque: localData.marque || "",
              modele: localData.modele || "",
              numero_chassis: localData.numero_chassis || "",
              numero_moteur: localData.numero_moteur || "",
              couleur: localData.couleur || "",
              annee_fabrication: localData.annee_fabrication || "",
              annee_circulation: localData.annee_circulation || "",
              energie: localData.energie || "",
              puissance_fiscal: localData.puissance_fiscal || "",
              usage: localData.usage_engin || "",
              date_enregistrement:
                localData.date_paiement ||
                new Date().toISOString().split("T")[0],
              site_enregistrement:
                localData.site_nom || siteInfo?.site_nom || "Base Locale",
              utilisateur_enregistrement: localData.caissier || "Système",
              type_engin: localData.type_engin || "Véhicule",
            });

            setEtape(2);
            setIsLoading(false);
            return;
          }
        } catch (localError) {
          console.error("Erreur recherche base locale:", localError);
        }

        setModal({
          isOpen: true,
          type: "error",
          title: "Plaque non trouvée",
          message: `La plaque "${numeroPlaque.toUpperCase()}" n'existe dans aucune base de données.`,
        });
        return;
      }

      // Stocker les données récupérées des bases externes
      setAssujetti({
        ...result.data.assujetti,
        id: Date.now(),
      });
      setEngin({
        ...result.data.engin,
        id: Date.now(),
      });
      setEtape(2);
    } catch (err) {
      console.error("Erreur vérification plaque:", err);
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur",
        message: "Une erreur est survenue. Veuillez réessayer.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Valider les informations de paiement
  const validerPaiement = () => {
    if (modePaiement === "mobile_money") {
      if (!numeroMobile.trim()) {
        setModal({
          isOpen: true,
          type: "error",
          title: "Numéro requis",
          message: "Veuillez saisir le numéro mobile money",
        });
        return false;
      }
      if (!transactionId.trim()) {
        setModal({
          isOpen: true,
          type: "error",
          title: "Transaction requise",
          message: "Veuillez saisir le numéro de transaction mobile money",
        });
        return false;
      }
    }

    if (modePaiement === "carte") {
      if (!carteInfo.numero.trim() || carteInfo.numero.length < 16) {
        setModal({
          isOpen: true,
          type: "error",
          title: "Carte invalide",
          message: "Veuillez saisir un numéro de carte valide (16 chiffres)",
        });
        return false;
      }
      if (!carteInfo.nom.trim()) {
        setModal({
          isOpen: true,
          type: "error",
          title: "Nom requis",
          message: "Veuillez saisir le nom sur la carte",
        });
        return false;
      }
      if (
        !carteInfo.expiration.trim() ||
        !/^\d{2}\/\d{2}$/.test(carteInfo.expiration)
      ) {
        setModal({
          isOpen: true,
          type: "error",
          title: "Date invalide",
          message: "Veuillez saisir une date d'expiration valide (MM/AA)",
        });
        return false;
      }
      if (!carteInfo.cvv.trim() || carteInfo.cvv.length !== 3) {
        setModal({
          isOpen: true,
          type: "error",
          title: "CVV invalide",
          message: "Veuillez saisir le code CVV (3 chiffres)",
        });
        return false;
      }
    }

    return true;
  };

  // Procéder au paiement
  const procederPaiement = async () => {
    // Vérifier d'abord que le prix est disponible
    if (!prixVignette) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Prix non disponible",
        message:
          "Le prix de la vignette n'est pas disponible. Veuillez réessayer.",
      });
      return;
    }

    if (!validerPaiement()) {
      return;
    }

    if (!utilisateur || !assujetti || !engin || !siteInfo) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Données manquantes",
        message: "Veuillez réessayer la recherche",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Convertir modePaiement pour correspondre au type attendu
      const modePaiementBackend =
        modePaiement === "carte"
          ? ("banque" as const)
          : modePaiement === "mobile_money"
            ? ("mobile_money" as const)
            : ("espece" as const);

      // Préparer les données de paiement - maintenant prixVignette est garanti d'être un number
      const paiementData = {
        engin_id: engin.engin_id || engin.id,
        particulier_id: assujetti.particulier_id || assujetti.id,
        montant: prixVignette, // Maintenant c'est un number, pas undefined
        montant_initial: prixVignette, // Maintenant c'est un number, pas undefined
        impot_id: String(impotId.id),
        mode_paiement: modePaiementBackend,
        operateur:
          modePaiement === "mobile_money"
            ? detecterOperateur(numeroMobile)
            : undefined,
        numero_transaction:
          modePaiement === "mobile_money"
            ? transactionId
            : await genererNumeroTransaction(),
        numero_cheque: undefined,
        banque: modePaiement === "carte" ? "Carte Bancaire" : undefined,
        statut: "completed" as const,
        utilisateur_id: utilisateur.id,
        utilisateur_name: utilisateur.nom_complet,
        site_id: siteInfo.site_id,
        nombre_plaques: 1,
        taux_cdf: tauxCDF,
      };

      // Enregistrer le paiement via Server Action
      const result = await enregistrerPaiementAction(paiementData);

      if (!result.success) {
        throw new Error(result.message);
      }

      // Stocker les informations de transaction pour l'affichage
      setTransactionId(paiementData.numero_transaction || "");
      setEtape(3);

      // Afficher les détails de la transaction
      if (result.data) {
        console.log("Transaction réussie:", result.data);
      }
    } catch (error) {
      console.error("Erreur paiement:", error);
      setModal({
        isOpen: true,
        type: "error",
        title: "Erreur de paiement",
        message:
          error instanceof Error
            ? error.message
            : "Échec du traitement du paiement",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Détecter l'opérateur mobile money
  const detecterOperateur = (numero: string): string => {
    const num = numero.replace(/\D/g, "");
    if (
      num.startsWith("24381") ||
      num.startsWith("24382") ||
      num.startsWith("082") ||
      num.startsWith("081")
    )
      return "Vodacom";
    if (
      num.startsWith("24384") ||
      num.startsWith("24385") ||
      num.startsWith("085") ||
      num.startsWith("084") ||
      num.startsWith("24389") ||
      num.startsWith("089")
    )
      return "Orange";
    if (
      num.startsWith("24389") ||
      num.startsWith("24388") ||
      num.startsWith("24397") ||
      num.startsWith("24398") ||
      num.startsWith("24399") ||
      num.startsWith("088") ||
      num.startsWith("097") ||
      num.startsWith("098") ||
      num.startsWith("099")
    )
      return "Airtel";
    return "Africell";
  };

  // Finaliser la transaction
  const finaliserTransaction = () => {
    setModal({
      isOpen: true,
      type: "success",
      title: "Transaction confirmée !",
      message:
        "Les informations de la transaction ont été transmises à AUTAUJUSTE pour la confirmation et impression de la vignette.",
      buttonText: "Continuer",
      onConfirm: () => {
        // Réinitialiser tous les états
        setEtape(1);
        setNumeroPlaque("");
        setAssujetti(null);
        setEngin(null);
        setModePaiement("espece");
        setTransactionId("");
        setNumeroMobile("");
        setCarteInfo({
          numero: "",
          nom: "",
          expiration: "",
          cvv: "",
        });
      },
    });
  };

  // Formater le montant
  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR").format(montant);
  };

  // Formater le numéro de carte
  const formatNumeroCarte = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})$/);
    if (!match) return value;

    const parts = match.slice(1).filter(Boolean);
    return parts.join(" ");
  };

  // Formater la date d'expiration
  const formatDateExpiration = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  // Rendu étape 1 : Saisie plaque
  const renderEtape1 = () => (
    <div className="space-y-8">
      {/* En-tête élégant */}
      <div className="text-center">
        <div className="relative inline-flex">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 blur-xl opacity-50 rounded-2xl" />
          <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl mb-6 shadow-lg shadow-blue-500/25">
            <Bike className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-sans">
          Vente de Vignette
        </h1>
        <p className="text-gray-500 max-w-sm mx-auto">
          Saisissez le numéro de plaque pour vérifier l'éligibilité
        </p>
      </div>

      {/* Indicateur d'étape moderne */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`
                w-14 h-14 rounded-full flex items-center justify-center relative
                transition-all duration-500 ease-out
                ${
                  etape >= step
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30"
                    : "bg-white border-2 border-gray-200 shadow-sm"
                }
              `}
              >
                {etape > step ? (
                  <Check className="w-5 h-5 text-white animate-scaleIn" />
                ) : (
                  <span
                    className={`font-bold ${etape >= step ? "text-white" : "text-gray-400"}`}
                  >
                    {step}
                  </span>
                )}
                {step < 3 && (
                  <div
                    className={`absolute top-1/2 -right-8 w-8 h-0.5 transform -translate-y-1/2 transition-all duration-500
                    ${etape > step ? "bg-gradient-to-r from-indigo-500 to-blue-500" : "bg-gray-200"}`}
                  />
                )}
              </div>
              <span
                className={`mt-3 text-xs font-semibold tracking-wide ${etape >= step ? "text-blue-600" : "text-gray-400"}`}
              >
                {step === 1
                  ? "Recherche"
                  : step === 2
                    ? "Paiement"
                    : "Confirmation"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Card de recherche */}
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm bg-white/80">
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3 tracking-wide">
              Numéro de Plaque
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 z-10">
                <Hash className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={numeroPlaque}
                onChange={(e) => setNumeroPlaque(e.target.value.toUpperCase())}
                placeholder="Ex: AB123CD"
                className="w-full pl-12 pr-4 py-4 text-base border-2 border-gray-100 rounded-xl
                  focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-400
                  transition-all duration-300 placeholder-gray-400 bg-white
                  group-hover:border-blue-300 shadow-sm"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && verifierPlaque()}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 ml-1">
              Saisissez le numéro exact de la plaque
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="flex-1 px-5 py-4 text-gray-700 bg-gray-50 hover:bg-gray-100 
                rounded-xl transition-all font-semibold flex items-center justify-center gap-2
                hover:shadow-sm border-2 border-gray-100 active:scale-[0.98] hover:border-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <button
              onClick={verifierPlaque}
              disabled={isLoading || !numeroPlaque.trim()}
              className="flex-1 px-5 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 
                text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 
                transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed 
                flex items-center justify-center gap-2 shadow-lg hover:shadow-xl
                active:scale-[0.98] shadow-blue-500/25 hover:shadow-blue-500/40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Recherche...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Vérifier
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info supplémentaire */}
        <div className="mt-6 p-5 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 rounded-xl border border-blue-100/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <Database className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 tracking-wide">
                Base de données TSC-NPS
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Vérification en temps réel des plaques
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Rendu étape 2 : Informations et paiement
  const renderEtape2 = () => (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="text-center">
        <div className="relative inline-flex">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 blur-xl opacity-50 rounded-2xl" />
          <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl mb-6 shadow-lg shadow-emerald-500/25">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3 font-sans">
          Véhicule Trouvé
        </h1>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold border border-emerald-100 shadow-sm">
          <Check className="w-4 h-4" />
          Plaque valide • Prêt pour le paiement
        </div>
      </div>

      {/* Grille d'informations élégante */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card Propriétaire */}
        <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm bg-white/80">
          <div className="flex items-center gap-4 mb-7">
            <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl shadow-sm">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 font-sans">
                Propriétaire
              </h3>
              <p className="text-sm text-gray-500 tracking-wide">
                Informations du titulaire
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50/50 to-gray-50/30 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shadow-sm">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 tracking-wide">
                  Nom complet
                </p>
                <p className="font-semibold text-gray-900">
                  {assujetti?.nom_complet}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50/50 to-gray-50/30 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center shadow-sm">
                <Phone className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 tracking-wide">Téléphone</p>
                <p className="font-semibold text-gray-900">
                  {assujetti?.telephone}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-gray-50/50 to-gray-50/30 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
              <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <MapPin className="w-4 h-4 text-purple-600 mt-1" />
              </div>
              <div>
                <p className="text-xs text-gray-500 tracking-wide">Adresse</p>
                <p className="font-semibold text-gray-900">
                  {assujetti?.adresse}
                </p>
              </div>
            </div>

            {assujetti?.nif && (
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50/50 to-blue-50/30 rounded-xl border border-blue-100 hover:border-blue-200 transition-colors">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shadow-sm">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 tracking-wide">NIF</p>
                  <p className="font-semibold text-gray-900 font-mono tracking-wider">
                    {assujetti.nif}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card Véhicule */}
        <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm bg-white/80">
          <div className="flex items-center gap-4 mb-7">
            <div className="p-3 bg-gradient-to-r from-emerald-100 to-green-100 rounded-xl shadow-sm">
              <Bike className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 font-sans">
                Véhicule
              </h3>
              <p className="text-sm text-gray-500 tracking-wide">
                Caractéristiques techniques
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Plaque et Type */}
            <div className="relative overflow-hidden p-5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl text-white shadow-lg">
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-white/10 rounded-full"></div>
              <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-white/10 rounded-full"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-90 tracking-wide">
                      Plaque d'immatriculation
                    </p>
                    <p className="text-2xl font-bold tracking-wider mt-1 font-sans">
                      {engin?.numero_plaque}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-90 tracking-wide">Type</p>
                    <p className="font-bold text-lg">{engin?.type_engin}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Marque, Modèle, Couleur */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-gradient-to-r from-gray-50/50 to-gray-50/30 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <p className="text-xs text-gray-500 tracking-wide mb-2">
                  Marque - Modèle
                </p>
                <p className="font-semibold text-gray-900 text-sm">
                  {engin?.marque}
                </p>
              </div>

              <div className="p-4 bg-gradient-to-r from-gray-50/50 to-gray-50/30 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <p className="text-xs text-gray-500 tracking-wide mb-2">
                  Couleur
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{
                      backgroundColor:
                        engin?.couleur.toLowerCase() === "blanc"
                          ? "#f8fafc"
                          : engin?.couleur.toLowerCase() === "noir"
                            ? "#1e293b"
                            : engin?.couleur.toLowerCase() === "gris"
                              ? "#64748b"
                              : "#fff",
                    }}
                  />
                  <span className="font-semibold text-gray-900 text-sm">
                    {engin?.couleur}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-gray-50/50 to-gray-50/30 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <p className="text-xs text-gray-500 tracking-wide mb-2">
                  Énergie
                </p>
                <div className="flex items-center gap-2">
                  <Fuel className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-semibold text-gray-900">
                    {engin?.energie}
                  </span>
                </div>
              </div>
            </div>

            {/* Années et Energie */}
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-6 p-4 bg-gradient-to-r from-gray-50/50 to-gray-50/30 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <p className="text-xs text-gray-500 tracking-wide mb-2">
                  Année Fabrication
                </p>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-semibold text-gray-900">
                    {engin?.annee_fabrication}
                  </span>
                </div>
              </div>

              <div className="col-span-6 p-4 bg-gradient-to-r from-gray-50/50 to-gray-50/30 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <p className="text-xs text-gray-500 tracking-wide mb-2">
                  Année Circulation
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-semibold text-gray-900">
                    {engin?.annee_circulation}
                  </span>
                </div>
              </div>
            </div>

            {/* Puissance et Usage */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-gradient-to-r from-gray-50/50 to-gray-50/30 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <p className="text-xs text-gray-500 tracking-wide mb-2">
                  Puissance fiscale
                </p>
                <div className="flex items-center gap-2">
                  <Gauge className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-semibold text-gray-900">
                    {engin?.puissance_fiscal}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-gray-50/50 to-gray-50/30 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <p className="text-xs text-gray-500 tracking-wide mb-2">
                  Usage
                </p>
                <div className="flex items-center gap-2">
                  <CarTaxiFront className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-semibold text-gray-900">
                    {engin?.usage}
                  </span>
                </div>
              </div>
            </div>

            {/* Numéros */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-gradient-to-r from-gray-50/50 to-gray-50/30 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <p className="text-xs text-gray-500 tracking-wide mb-2">
                  Numéro Châssis
                </p>
                <p className="font-semibold text-gray-900 font-mono text-sm truncate">
                  {engin?.numero_chassis}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-gray-50/50 to-gray-50/30 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <p className="text-xs text-gray-500 tracking-wide mb-2">
                  Numéro Moteur
                </p>
                <p className="font-semibold text-gray-900 font-mono text-sm truncate">
                  {engin?.numero_moteur}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Paiement */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-xl backdrop-blur-sm bg-white/80">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl shadow-sm">
            <Ticket className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 font-sans">
              Paiement de la Vignette
            </h3>
            <p className="text-sm text-gray-500 tracking-wide">
              Sélectionnez votre mode de paiement
            </p>
          </div>
        </div>

        {/* Montant */}
        <div className="mb-10">
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl p-8 text-white shadow-xl">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full"></div>

            <div className="relative z-10">
              <div className="text-center">
                <div className="text-sm opacity-90 mb-2 tracking-wider">
                  Montant de la vignette
                </div>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <DollarSign className="w-7 h-7 opacity-90" />
                  <span className="text-5xl font-bold font-sans tracking-tight">
                    {prixVignette}
                  </span>
                  <span className="text-2xl opacity-90">USD</span>
                </div>
                <div className="text-2xl font-semibold opacity-90 tracking-wide">
                  {formatMontant(prixTotalCDF)} CDF
                </div>
                <div className="text-xs opacity-75 mt-4 tracking-wide">
                  Taux de change: 1 USD = {formatMontant(tauxCDF)} CDF
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modes de paiement */}
        <div className="mb-10">
          <h4 className="font-bold text-gray-900 mb-6 text-lg font-sans">
            Mode de paiement
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {modesPaiement.map((mode) => {
              const Icon = mode.icon;
              const isSelected = modePaiement === mode.id;

              return (
                <button
                  key={mode.id}
                  onClick={() => setModePaiement(mode.id)}
                  className={`
                    group relative p-5 rounded-xl border-2 transition-all duration-300
                    ${
                      isSelected
                        ? `border-${mode.color}-400 bg-gradient-to-br ${mode.bgColor}/5 shadow-lg shadow-${mode.color}-500/20`
                        : "border-gray-100 hover:border-gray-200 hover:shadow-lg"
                    }
                    overflow-hidden active:scale-[0.98]
                  `}
                >
                  {/* Effet de fond */}
                  {isSelected && (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${mode.bgColor}/5`}
                    />
                  )}

                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <div
                      className={`p-3.5 rounded-xl transition-all duration-300 shadow-sm
                      ${
                        isSelected
                          ? `bg-gradient-to-br ${mode.bgColor} shadow-md`
                          : "bg-gray-100 group-hover:bg-gray-200"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${isSelected ? "text-white" : `text-${mode.color}-600`}`}
                      />
                    </div>
                    <div className="text-center">
                      <div
                        className={`font-bold text-sm transition-colors tracking-wide
                        ${isSelected ? `text-${mode.color}-700` : "text-gray-800"}`}
                      >
                        {mode.nom}
                      </div>
                      <div className="text-xs text-gray-500 mt-2 leading-tight">
                        {mode.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Champ Mobile Money */}
        {modePaiement === "mobile_money" && (
          <div className="space-y-6 mb-10">
            <div>
              <label className="block font-bold text-gray-900 mb-3 text-sm tracking-wide">
                Numéro Mobile Money
              </label>
              <input
                type="text"
                value={numeroMobile}
                onChange={(e) => setNumeroMobile(e.target.value)}
                placeholder="Ex: +243 81 234 5678"
                className="w-full px-5 py-4 text-base border-2 border-gray-100 rounded-xl
                  focus:outline-none focus:ring-4 focus:ring-purple-500/15 focus:border-purple-400
                  transition-all duration-300 bg-white hover:border-purple-300 shadow-sm"
              />
              <p className="text-xs text-gray-500 mt-2 ml-1">
                Saisissez le numéro utilisé pour le paiement
              </p>
            </div>

            <div>
              <label className="block font-bold text-gray-900 mb-3 text-sm tracking-wide">
                Numéro de transaction
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Ex: VOD123456789, AIRT987654321"
                className="w-full px-5 py-4 text-base border-2 border-gray-100 rounded-xl
                  focus:outline-none focus:ring-4 focus:ring-purple-500/15 focus:border-purple-400
                  transition-all duration-300 bg-white hover:border-purple-300 shadow-sm"
              />
              <p className="text-xs text-gray-500 mt-2 ml-1">
                Saisissez le numéro de confirmation reçu par SMS
              </p>
            </div>
          </div>
        )}

        {/* Champs Carte Bancaire */}
        {modePaiement === "carte" && (
          <div className="space-y-6 mb-10">
            <div>
              <label className="block font-bold text-gray-900 mb-3 text-sm tracking-wide">
                Numéro de carte
              </label>
              <input
                type="text"
                value={carteInfo.numero}
                onChange={(e) =>
                  setCarteInfo({
                    ...carteInfo,
                    numero: formatNumeroCarte(e.target.value),
                  })
                }
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="w-full px-5 py-4 text-base border-2 border-gray-100 rounded-xl
                  focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-400
                  transition-all duration-300 bg-white hover:border-blue-300 shadow-sm font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block font-bold text-gray-900 mb-3 text-sm tracking-wide">
                  Nom sur la carte
                </label>
                <input
                  type="text"
                  value={carteInfo.nom}
                  onChange={(e) =>
                    setCarteInfo({
                      ...carteInfo,
                      nom: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="JEAN KABASELE"
                  className="w-full px-5 py-4 text-base border-2 border-gray-100 rounded-xl
                    focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-400
                    transition-all duration-300 bg-white hover:border-blue-300 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-900 mb-3 text-sm tracking-wide">
                    Expiration
                  </label>
                  <input
                    type="text"
                    value={carteInfo.expiration}
                    onChange={(e) =>
                      setCarteInfo({
                        ...carteInfo,
                        expiration: formatDateExpiration(e.target.value),
                      })
                    }
                    placeholder="MM/AA"
                    maxLength={5}
                    className="w-full px-5 py-4 text-base border-2 border-gray-100 rounded-xl
                      focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-400
                      transition-all duration-300 bg-white hover:border-blue-300 shadow-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-900 mb-3 text-sm tracking-wide">
                    CVV
                  </label>
                  <input
                    type="password"
                    value={carteInfo.cvv}
                    onChange={(e) =>
                      setCarteInfo({
                        ...carteInfo,
                        cvv: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="123"
                    maxLength={3}
                    className="w-full px-5 py-4 text-base border-2 border-gray-100 rounded-xl
                      focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-400
                      transition-all duration-300 bg-white hover:border-blue-300 shadow-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 bg-gradient-to-r from-blue-50/60 to-blue-50/40 rounded-xl border-2 border-blue-100">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-blue-100 rounded-lg shadow-sm">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-800 mb-1 tracking-wide">
                    Paiement sécurisé
                  </p>
                  <p className="text-xs text-blue-600/90">
                    Vos informations de carte sont chiffrées et ne sont jamais
                    stockées sur nos serveurs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Boutons navigation */}
        <div className="flex gap-5 pt-8 border-t border-gray-100">
          <button
            onClick={() => {
              setEtape(1);
              setNumeroPlaque("");
            }}
            className="flex-1 px-6 py-4 text-gray-700 bg-gray-50 hover:bg-gray-100 
              rounded-xl transition-all duration-300 font-semibold flex items-center justify-center gap-2
              hover:shadow-sm border-2 border-gray-100 hover:border-gray-200 active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            Nouvelle recherche
          </button>
          <button
            onClick={procederPaiement}
            disabled={isLoading}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-500 
              text-white rounded-xl hover:from-emerald-600 hover:to-green-600 
              transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed 
              flex items-center justify-center gap-2 shadow-lg hover:shadow-xl
              active:scale-[0.98] shadow-emerald-500/25 hover:shadow-emerald-500/40"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Payer {prixVignette} $
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Rendu étape 3 : Confirmation
  const renderEtape3 = () => {
    const currentMode = modesPaiement.find((m) => m.id === modePaiement);
    const IconComponent = currentMode?.icon || CreditCard;

    return (
      <div className="space-y-8">
        {/* En-tête */}
        <div className="text-center">
          <div className="relative inline-flex">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 blur-xl opacity-50 rounded-2xl" />
            <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl mb-6 shadow-lg shadow-emerald-500/25">
              <BadgeCheck className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3 font-sans">
            Paiement Réussi !
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            La transaction a été validée avec succès
          </p>
        </div>

        {/* Card de confirmation */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-xl backdrop-blur-sm bg-white/80">
            {/* Indicateur de succès */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg ring-4 ring-white">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3 font-sans">
                Transaction Validée
              </h2>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold border border-emerald-100 shadow-sm">
                <Check className="w-3.5 h-3.5" />
                Paiement confirmé
              </div>
            </div>

            {/* Résumé */}
            <div className="space-y-6 mb-10">
              <div className="grid grid-cols-2 gap-5">
                <div className="p-5 bg-gradient-to-r from-gray-50/60 to-gray-50/40 rounded-xl border-2 border-gray-100">
                  <p className="text-xs text-gray-500 tracking-wide mb-2">
                    Véhicule
                  </p>
                  <p className="text-xl font-bold text-gray-900 font-sans">
                    {engin?.numero_plaque}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {engin?.marque} {engin?.modele}
                  </p>
                </div>
                <div className="p-5 bg-gradient-to-r from-gray-50/60 to-gray-50/40 rounded-xl border-2 border-gray-100">
                  <p className="text-xs text-gray-500 tracking-wide mb-2">
                    Montant payé
                  </p>
                  <p className="text-xl font-bold text-gray-900 font-sans">
                    {prixVignette} $
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatMontant(prixTotalCDF)} CDF
                  </p>
                </div>
              </div>

              <div className="p-5 bg-gradient-to-r from-blue-50/60 to-indigo-50/40 rounded-xl border-2 border-blue-100">
                <p className="text-xs text-gray-500 tracking-wide mb-3">
                  Mode de paiement
                </p>
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-lg bg-gradient-to-br ${currentMode?.bgColor}/20 shadow-sm`}
                  >
                    <IconComponent
                      className={`w-6 h-6 text-${currentMode?.color}-600`}
                    />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      {currentMode?.nom}
                    </p>
                    {modePaiement === "mobile_money" && transactionId && (
                      <p className="text-sm text-gray-600 mt-1.5 font-mono">
                        Ref: {transactionId}
                      </p>
                    )}
                    {modePaiement === "carte" && carteInfo.numero && (
                      <p className="text-sm text-gray-600 mt-1.5 font-mono">
                        Carte: •••• {carteInfo.numero.slice(-4)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Message AUTAUJUSTE */}
              <div className="p-5 bg-gradient-to-r from-emerald-50/60 to-green-50/40 rounded-xl border-2 border-emerald-100">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-emerald-100 rounded-lg shadow-sm">
                    <Send className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-800 mb-2 text-lg">
                      Transmission à AUTAUJUSTE
                    </p>
                    <p className="text-sm text-emerald-700/90">
                      Les informations globales de la transaction sont
                      transmises au système AUTAUJUSTE pour confirmation et
                      impression de la vignette.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-5 pt-8 border-t border-gray-100">
              <button
                onClick={() => {
                  setEtape(1);
                  setNumeroPlaque("");
                  setAssujetti(null);
                  setEngin(null);
                  setTransactionId("");
                  setNumeroMobile("");
                  setCarteInfo({
                    numero: "",
                    nom: "",
                    expiration: "",
                    cvv: "",
                  });
                }}
                className="flex-1 px-6 py-4 text-gray-700 bg-gray-50 hover:bg-gray-100 
                  rounded-xl transition-all duration-300 font-semibold hover:shadow-sm border-2 border-gray-100 hover:border-gray-200 active:scale-[0.98]"
              >
                Nouvelle transaction
              </button>
            </div>
          </div>
        </div>

        {/* Processus AUTAUJUSTE */}
        <div className="max-w-2xl mx-auto">
          <div className="p-7 bg-gradient-to-r from-indigo-50/60 to-blue-50/40 rounded-2xl border-2 border-indigo-100 backdrop-blur-sm">
            <h3 className="font-bold text-gray-900 mb-7 text-lg flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl shadow-sm">
                <Database className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="font-sans">
                Processus d'intégration AUTAUJUSTE
              </span>
            </h3>

            <div className="space-y-5">
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white">
                    <span className="text-indigo-600 font-bold text-sm">1</span>
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-semibold text-gray-900 mb-1.5">
                    Transmission des données
                  </p>
                  <p className="text-sm text-gray-600">
                    Envoi sécurisé des informations de transaction au système
                    AUTAUJUSTE
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white">
                    <span className="text-indigo-600 font-bold text-sm">2</span>
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-semibold text-gray-900 mb-1.5">
                    Validation et confirmation
                  </p>
                  <p className="text-sm text-gray-600">
                    Vérification et approbation par le module AUTAUJUSTE
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white">
                    <span className="text-indigo-600 font-bold text-sm">3</span>
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-semibold text-gray-900 mb-1.5">
                    Impression de la vignette
                  </p>
                  <p className="text-sm text-gray-600">
                    Génération et impression de la vignette sécurisée
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost/SOCOFIAPP/Impot/backend/calls";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/50 via-white to-gray-50/30 py-8 px-4 sm:px-6 relative">
      {/* Effets de fond */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-tr from-emerald-500/5 to-green-500/5 blur-3xl -z-10" />

      <div className="max-w-6xl mx-auto relative">
        {/* Header avec retour */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors duration-300"
          >
            <div className="p-2.5 bg-white rounded-xl shadow-sm border-2 border-gray-100 group-hover:shadow-md group-hover:border-gray-200 transition-all duration-300 active:scale-95">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm tracking-wide">Retour</span>
          </button>

          <div className="text-right">
            <div className="text-sm font-semibold text-gray-500 tracking-wide">
              Transaction
            </div>
            <div className="text-xs text-gray-400 font-mono">
              #{impotId.id || "N/A"}
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl blur-xl -z-10" />
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100/50 overflow-hidden">
            <div className="p-8">
              {etape === 1 && renderEtape1()}
              {etape === 2 && renderEtape2()}
              {etape === 3 && renderEtape3()}
            </div>
          </div>
        </div>

        {/* Footer léger */}
        <div className="mt-10 pt-6 border-t border-gray-100/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-blue-50 rounded-xl shadow-sm border border-blue-100">
                <Shield className="w-4.5 h-4.5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 tracking-wide">
                  Transaction sécurisée
                </p>
                <p className="text-xs text-gray-500">Chiffrement SSL 256-bit</p>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <p className="text-xs text-gray-400 tracking-wide">
                © {new Date().getFullYear()} Système de Vente de Vignettes
              </p>
              <p className="text-xs text-gray-400 mt-1.5">
                Intégration AUTAUJUSTE • Version 1.2
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        buttonText={modal.buttonText}
        onConfirm={modal.onConfirm}
      />

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }

        /* Effets de hover améliorés */
        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Scrollbar personnalisée */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
