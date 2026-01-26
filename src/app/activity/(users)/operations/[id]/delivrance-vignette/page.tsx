'use client';

// https://chat.deepseek.com/a/chat/s/e04a687f-0c92-4ebf-a7c0-6ca00c9b670d

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Car,
  Ticket,
  CheckCircle,
  AlertCircle,
  Search,
  ArrowRight,
  ArrowLeft,
  User,
  Phone,
  MapPin,
  CreditCard,
  Smartphone,
  Banknote,
  Loader2,
  Check,
  Shield,
  Calendar,
  Hash,
  Building,
  DollarSign,
  CalendarDays,
  UserPlus,
  Fuel,
  Gauge,
  CarTaxiFront,
  FileText,
  Key,
  FileSearch,
  ShieldCheck,
  History,
  ClipboardCheck,
  ReceiptText,
  Zap,
  Battery,
  Cog,
} from 'lucide-react';

interface DelivranceVignetteProps {
  params: {
    id: string;
  };
}

// Types d'interface
interface TransactionInfo {
  id: number;
  reference: string;
  montant: number;
  mode_paiement: 'mobile_money' | 'espece' | 'carte';
  date_paiement: string;
  status: 'paid' | 'pending' | 'cancelled';
  operateur?: string;
  numero_transaction?: string;
  engin_id?: number;
}

interface AssujettiInfo {
  id: number;
  nom_complet: string;
  telephone: string;
  adresse: string;
  nif?: string;
  email?: string;
}

interface EnginInfo {
  id: number;
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
  status_vignette: 'pending' | 'delivered' | 'expired';
  date_derniere_vignette?: string;
  assujetti_id?: number;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'error' | 'success' | 'info' | 'warning';
  title: string;
  message: string;
  buttonText?: string;
  onConfirm?: () => void;
}

// Données temporaires mockées - Utilisation de constantes pour éviter les recréations
const TEMPORARY_TRANSACTIONS: TransactionInfo[] = [
  {
    id: 1001,
    reference: "VGN-2024-001234",
    montant: 20,
    mode_paiement: 'mobile_money',
    date_paiement: '15/01/2024 14:30',
    status: 'paid',
    operateur: 'Vodacom',
    numero_transaction: 'VOD123456789',
    engin_id: 1
  },
  {
    id: 1002,
    reference: "VGN-2024-001235",
    montant: 20,
    mode_paiement: 'espece',
    date_paiement: '16/01/2024 10:15',
    status: 'paid',
    engin_id: 2
  },
  {
    id: 1003,
    reference: "VGN-2024-001236",
    montant: 20,
    mode_paiement: 'mobile_money',
    date_paiement: '17/01/2024 16:45',
    status: 'paid',
    operateur: 'Airtel',
    numero_transaction: 'AIRT987654321',
    engin_id: 3
  }
];

const TEMPORARY_ASSUJETTI_DATA: AssujettiInfo[] = [
  {
    id: 1,
    nom_complet: "Jean Kabasele",
    telephone: "+243 81 234 5678",
    adresse: "Avenue de la Justice, N°45, Kinshasa/Gombe",
    nif: "NIF-2024-001234",
    email: "jean.kabasele@email.com"
  },
  {
    id: 2,
    nom_complet: "Marie Lukusa",
    telephone: "+243 89 876 5432",
    adresse: "Quartier Matonge, Kinshasa/Kalamu",
    nif: "NIF-2024-005678",
    email: "marie.lukusa@email.com"
  },
  {
    id: 3,
    nom_complet: "Paul Mbayo",
    telephone: "+243 97 654 3210",
    adresse: "Avenue des Aviateurs, Kinshasa/Gombe",
    nif: "NIF-2024-003456",
    email: "paul.mbayo@email.com"
  }
];

const TEMPORARY_ENGIN_DATA: EnginInfo[] = [
  {
    id: 1,
    numero_plaque: "AB123CD",
    marque: "Toyota",
    modele: "Rav4",
    numero_chassis: "JTEZU5JR5K5123456",
    numero_moteur: "2TR1234567",
    couleur: "Blanc",
    annee_fabrication: "2022",
    annee_circulation: "2023",
    energie: "Essence",
    puissance_fiscal: "12 CV",
    usage: "Personnel",
    date_enregistrement: "15/03/2023",
    site_enregistrement: "Centre de Kinshasa",
    utilisateur_enregistrement: "Admin TSC",
    type_engin: "Voiture",
    status_vignette: 'pending',
    assujetti_id: 1
  },
  {
    id: 2,
    numero_plaque: "EF456GH",
    marque: "Mercedes",
    modele: "Classe C",
    numero_chassis: "WDD2050471A123456",
    numero_moteur: "274920123456",
    couleur: "Noir",
    annee_fabrication: "2021",
    annee_circulation: "2021",
    energie: "Diesel",
    puissance_fiscal: "15 CV",
    usage: "Commercial",
    date_enregistrement: "10/06/2021",
    site_enregistrement: "Centre de Kinshasa",
    utilisateur_enregistrement: "Agent TSC",
    type_engin: "Voiture",
    status_vignette: 'pending',
    date_derniere_vignette: "10/01/2023",
    assujetti_id: 2
  },
  {
    id: 3,
    numero_plaque: "IJ789KL",
    marque: "BMW",
    modele: "X5",
    numero_chassis: "5UXKR6C58L0123456",
    numero_moteur: "N55B30M012345",
    couleur: "Bleu",
    annee_fabrication: "2023",
    annee_circulation: "2023",
    energie: "Essence",
    puissance_fiscal: "18 CV",
    usage: "Personnel",
    date_enregistrement: "20/02/2023",
    site_enregistrement: "Centre de Kinshasa",
    utilisateur_enregistrement: "Admin TSC",
    type_engin: "SUV",
    status_vignette: 'pending',
    assujetti_id: 3
  }
];

// Composant Modal optimisé avec React.memo
const Modal = ({ isOpen, onClose, type, title, message, buttonText = "OK", onConfirm }: ModalProps) => {
  if (!isOpen) return null;

  const typeConfig = {
    error: {
      icon: AlertCircle,
      bgColor: 'bg-gradient-to-r from-red-500 to-rose-500',
      buttonClass: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white',
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-gradient-to-r from-emerald-500 to-green-500',
      buttonClass: 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white',
    },
    info: {
      icon: CheckCircle,
      bgColor: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      buttonClass: 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
      buttonClass: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  const handleConfirm = useCallback(() => {
    onConfirm?.();
    onClose();
  }, [onConfirm, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md">
        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className={`h-2 ${config.bgColor}`} />
          <div className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mb-4 shadow-lg`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {title}
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed whitespace-pre-line">
                {message}
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-semibold"
                >
                  Retour
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-6 py-3 rounded-xl transition-colors font-semibold ${config.buttonClass}`}
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

export default function DelivranceVignettePage({ params }: DelivranceVignetteProps) {
  const router = useRouter();
  const impotId = useParams();

  // États principaux
  const [etape, setEtape] = useState(1);
  const [numeroPlaque, setNumeroPlaque] = useState('');
  const [referenceTransaction, setReferenceTransaction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Données récupérées
  const [assujetti, setAssujetti] = useState<AssujettiInfo | null>(null);
  const [engin, setEngin] = useState<EnginInfo | null>(null);
  const [transaction, setTransaction] = useState<TransactionInfo | null>(null);
  
  // Modal state
  const [modal, setModal] = useState<Omit<ModalProps, 'onClose' | 'isOpen'> & { isOpen: boolean }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const { utilisateur, isLoading: authLoading } = useAuth();

  // Liste des combinaisons valides
  const combinaisonsValides = useMemo(() => {
    return TEMPORARY_TRANSACTIONS.map(transaction => {
      const engin = TEMPORARY_ENGIN_DATA.find(e => e.id === transaction.engin_id);
      const assujetti = TEMPORARY_ASSUJETTI_DATA.find(a => a.id === engin?.assujetti_id);
      
      return {
        plaque: engin?.numero_plaque || '',
        reference: transaction.reference,
        assujetti: assujetti?.nom_complet || ''
      };
    }).filter(comb => comb.plaque && comb.assujetti);
  }, []);

  // Vérifier la plaque et la référence
  const verifierTransaction = useCallback(async () => {
    if (!numeroPlaque.trim()) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Plaque requise',
        message: 'Veuillez saisir le numéro de plaque du véhicule',
      });
      return;
    }

    if (!referenceTransaction.trim()) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Référence requise',
        message: 'Veuillez saisir la référence de transaction',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulation délai API
      await new Promise(resolve => setTimeout(resolve, 800));

      // Recherche de l'engin
      const plaqueRecherchee = numeroPlaque.toUpperCase();
      const enginTrouve = TEMPORARY_ENGIN_DATA.find(
        engin => engin.numero_plaque === plaqueRecherchee
      );

      if (!enginTrouve) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Véhicule non trouvé',
          message: `Le véhicule avec la plaque "${plaqueRecherchee}" n'existe pas dans notre système.`,
        });
        return;
      }

      // Recherche de la transaction
      const referenceRecherchee = referenceTransaction.toUpperCase();
      const transactionTrouvee = TEMPORARY_TRANSACTIONS.find(
        t => t.reference === referenceRecherchee
      );

      if (!transactionTrouvee) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Transaction non trouvée',
          message: `Aucune transaction trouvée avec la référence "${referenceRecherchee}".`,
        });
        return;
      }

      // Vérifier si la transaction correspond au véhicule
      if (transactionTrouvee.engin_id !== enginTrouve.id) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Incompatibilité',
          message: `Cette transaction (${transactionTrouvee.reference}) ne correspond pas au véhicule ${enginTrouve.numero_plaque}.`,
        });
        return;
      }

      // Vérifier si la transaction est déjà traitée
      if (enginTrouve.status_vignette === 'delivered') {
        setModal({
          isOpen: true,
          type: 'warning',
          title: 'Vignette déjà délivrée',
          message: `Une vignette a déjà été délivrée pour ce véhicule le ${enginTrouve.date_derniere_vignette}.`,
        });
        return;
      }

      // Récupérer l'assujetti
      const assujettiTrouve = TEMPORARY_ASSUJETTI_DATA.find(
        a => a.id === enginTrouve.assujetti_id
      ) || TEMPORARY_ASSUJETTI_DATA[0];

      // Stocker les données
      setAssujetti(assujettiTrouve);
      setEngin(enginTrouve);
      setTransaction(transactionTrouvee);
      setEtape(2);
      
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Transaction vérifiée',
        message: `La transaction ${transactionTrouvee.reference} correspond bien au véhicule ${enginTrouve.numero_plaque}.`,
        buttonText: 'Continuer',
        onConfirm: () => {
          setModal(prev => ({ ...prev, isOpen: false }));
        }
      });
      
    } catch (err) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue lors de la vérification.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [numeroPlaque, referenceTransaction]);

  // Procéder à la délivrance
  const procederDelivrance = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setEtape(3);
    }, 1000);
  }, []);

  // Finaliser la délivrance
  const finaliserDelivrance = useCallback(() => {
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Vignette délivrée avec succès !',
        message: `La vignette pour le véhicule ${engin?.numero_plaque} a été délivrée. 
                  \n\nLes informations ont été envoyées à Autojuste pour impression de la vignette physique.
                  \n\n• Référence: ${transaction?.reference}
                  \n• Plaque: ${engin?.numero_plaque}
                  \n• Propriétaire: ${assujetti?.nom_complet}
                  \n• Date de validité: 31/12/${new Date().getFullYear()}`,
        buttonText: 'OK',
        onConfirm: () => {
          // Réinitialisation complète
          setNumeroPlaque('');
          setReferenceTransaction('');
          setTransaction(null);
          setAssujetti(null);
          setEngin(null);
          setEtape(1);
        }
      });
    }, 1500);
  }, [engin, transaction, assujetti]);

  // Remplir automatiquement les combinaisons valides
  const remplirCombinaison = useCallback((plaque: string, reference: string) => {
    setNumeroPlaque(plaque);
    setReferenceTransaction(reference);
  }, []);

  // Formater le montant
  const formatMontant = useCallback((montant: number) => {
    return new Intl.NumberFormat('fr-FR').format(montant);
  }, []);

  // Obtenir la couleur du statut
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'paid':
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled':
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  // Rendu étape 1 : Vérification
  const renderEtape1 = () => (
    <div className="space-y-8">
      {/* En-tête élégant */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl mb-6 shadow-lg shadow-blue-500/25">
          <Ticket className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Délivrance de Vignette
        </h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          Saisissez la plaque du véhicule et la référence de transaction pour récupérer la vignette
        </p>
      </div>

      {/* Indicateur d'étape */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center
                border-2 transition-colors relative
                ${etape >= step 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 border-transparent shadow-lg' 
                  : 'border-gray-200 bg-white'
                }
              `}>
                {etape > step ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <span className={`font-semibold ${etape >= step ? 'text-white' : 'text-gray-400'}`}>
                    {step}
                  </span>
                )}
                {step < 3 && (
                  <div className={`absolute top-1/2 -right-7 w-6 h-0.5 transform -translate-y-1/2 
                    ${etape > step ? 'bg-gradient-to-r from-indigo-500 to-blue-500' : 'bg-gray-200'}`} 
                  />
                )}
              </div>
              <span className={`mt-3 text-xs font-medium ${etape >= step ? 'text-blue-600' : 'text-gray-400'}`}>
                {step === 1 ? 'Vérification' : step === 2 ? 'Confirmation' : 'Délivrance'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Card de vérification */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-lg">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardCheck className="w-5 h-5 text-blue-600" />
              </div>
              <span>Vérification de la transaction</span>
            </h3>
            
            {/* Plaque */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Car className="w-4 h-4" />
                Numéro de Plaque du Véhicule
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500">
                  <Hash className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={numeroPlaque}
                  onChange={(e) => setNumeroPlaque(e.target.value.toUpperCase())}
                  placeholder="Ex: AB123CD"
                  className="w-full pl-12 pr-4 py-3.5 text-base border border-gray-200 rounded-xl
                    focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500
                    transition-colors placeholder-gray-400 bg-gray-50/50"
                  autoFocus
                />
              </div>
            </div>

            {/* Référence transaction */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Référence de Transaction
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500">
                  <Key className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={referenceTransaction}
                  onChange={(e) => setReferenceTransaction(e.target.value.toUpperCase())}
                  placeholder="Ex: VGN-2024-001234"
                  className="w-full pl-12 pr-4 py-3.5 text-base border border-gray-200 rounded-xl
                    focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500
                    transition-colors placeholder-gray-400 bg-gray-50/50"
                  onKeyDown={(e) => e.key === 'Enter' && verifierTransaction()}
                />
              </div>
            </div>

            {/* Exemples de combinaisons valides */}
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <History className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">Combinaisons valides (Démonstration)</p>
                  <p className="text-xs text-blue-600">Cliquez pour remplir automatiquement</p>
                </div>
              </div>
              <div className="space-y-2">
                {combinaisonsValides.map((combinaison, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => remplirCombinaison(combinaison.plaque, combinaison.reference)}
                    className="w-full text-left p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 
                      hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Plaque: <span className="font-bold text-blue-600">{combinaison.plaque}</span>
                        </p>
                        <p className="text-xs text-gray-600">Transaction: {combinaison.reference}</p>
                        <p className="text-xs text-gray-500 mt-1">Propriétaire: {combinaison.assujetti}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Conseils */}
            <div className="p-4 bg-gradient-to-r from-emerald-50/50 to-green-50/50 rounded-xl border border-emerald-100">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-emerald-800 mb-2">Conseils de vérification</h4>
                  <ul className="space-y-1 text-sm text-emerald-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>La plaque doit correspondre exactement au format enregistré</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>La référence doit correspondre au véhicule concerné</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>La transaction doit être marquée comme "payée"</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 px-5 py-3.5 text-gray-700 bg-gray-100 hover:bg-gray-200 
                rounded-xl transition-colors font-semibold flex items-center justify-center gap-2
                border border-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <button
              onClick={verifierTransaction}
              disabled={isLoading || !numeroPlaque.trim() || !referenceTransaction.trim()}
              className="flex-1 px-5 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 
                text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 
                transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed 
                flex items-center justify-center gap-2 shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Vérifier la transaction
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Rendu étape 2 : Confirmation
  const renderEtape2 = () => (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl mb-6 shadow-lg shadow-emerald-500/25">
          <ClipboardCheck className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Transaction Confirmée
        </h1>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
          <Check className="w-4 h-4" />
          Transaction valide • Prêt pour la délivrance
        </div>
      </div>

      {/* Grille d'informations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Details */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Transaction</h3>
              <p className="text-sm text-gray-500">Détails du paiement</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Référence et Statut */}
            <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-90">Référence transaction</p>
                  <p className="text-xl font-bold tracking-wide font-mono">{transaction?.reference}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(transaction?.status || 'paid')}`}>
                  PAYÉ
                </div>
              </div>
            </div>

            {/* Détails transaction */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50/50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Montant payé</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-lg font-bold text-gray-900">{transaction?.montant} $</span>
                </div>
                <p className="text-sm text-gray-600">{formatMontant((transaction?.montant || 0) * 2200)} CDF</p>
              </div>
              <div className="p-3 bg-gray-50/50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Date de paiement</p>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-gray-900">{transaction?.date_paiement}</span>
                </div>
              </div>
            </div>

            {/* Mode de paiement */}
            <div className="p-3 bg-gray-50/50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Mode de paiement</p>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  transaction?.mode_paiement === 'mobile_money' ? 'bg-purple-100' :
                  transaction?.mode_paiement === 'espece' ? 'bg-emerald-100' :
                  'bg-blue-100'
                }`}>
                  {transaction?.mode_paiement === 'mobile_money' ? (
                    <Smartphone className="w-5 h-5 text-purple-600" />
                  ) : transaction?.mode_paiement === 'espece' ? (
                    <Banknote className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {transaction?.mode_paiement === 'mobile_money' ? 'Mobile Money' :
                     transaction?.mode_paiement === 'espece' ? 'Espèces' : 'Carte bancaire'}
                  </p>
                  {transaction?.operateur && (
                    <p className="text-sm text-gray-600">Opérateur: {transaction.operateur}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Véhicule et Propriétaire Details */}
        <div className="space-y-6">
          {/* Propriétaire */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Propriétaire</h3>
                <p className="text-sm text-gray-500">Informations de l'assujetti</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Nom complet */}
              <div className="p-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-lg border border-blue-100">
                <p className="text-xs text-gray-500 mb-1">Nom complet</p>
                <p className="text-lg font-bold text-gray-900">{assujetti?.nom_complet}</p>
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="w-4 h-4 text-blue-500" />
                    <p className="text-xs text-gray-500">Téléphone</p>
                  </div>
                  <p className="font-medium text-gray-900">{assujetti?.telephone}</p>
                </div>
                <div className="p-3 bg-gray-50/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <p className="text-xs text-gray-500">Adresse</p>
                  </div>
                  <p className="font-medium text-gray-900 text-sm">{assujetti?.adresse}</p>
                </div>
              </div>

              {/* Informations supplémentaires */}
              {assujetti?.nif && (
                <div className="p-3 bg-gray-50/50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Numéro d'Identification Fiscale</p>
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-purple-500" />
                    <span className="font-mono font-medium text-gray-900">{assujetti.nif}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Véhicule Details */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-r from-emerald-100 to-green-100 rounded-xl">
                <Car className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Véhicule</h3>
                <p className="text-sm text-gray-500">Destinataire de la vignette</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Plaque */}
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl text-white shadow-md">
                <p className="text-xs opacity-90 mb-1">Véhicule concerné</p>
                <p className="text-2xl font-bold tracking-wider">{engin?.numero_plaque}</p>
                <p className="text-sm opacity-90 mt-1">{engin?.marque} {engin?.modele} • {engin?.couleur}</p>
              </div>

              {/* Informations techniques - Optimisées avec les champs demandés */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50/50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Usage</p>
                  <div className="flex items-center gap-2">
                    <CarTaxiFront className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-gray-900">{engin?.usage}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50/50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Énergie</p>
                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-gray-900">{engin?.energie}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50/50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Année fabrication</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="font-medium text-gray-900">{engin?.annee_fabrication}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50/50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Année circulation</p>
                  <div className="flex items-center gap-2">
                    <CarTaxiFront className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-gray-900">{engin?.annee_circulation}</span>
                  </div>
                </div>
              </div>

              {/* Autres informations techniques */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50/50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Puissance fiscale</p>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium text-gray-900">{engin?.puissance_fiscal}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50/50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Châssis</p>
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900 text-xs font-mono truncate">{engin?.numero_chassis}</span>
                  </div>
                </div>
              </div>

              {/* Informations d'enregistrement */}
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <p className="text-xs text-gray-500 mb-2">Enregistrement</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-600">Site</p>
                    <div className="flex items-center gap-1">
                      <Building className="w-3 h-3 text-blue-500" />
                      <p className="text-sm font-medium text-gray-900 truncate">{engin?.site_enregistrement}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Opérateur</p>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-green-500" />
                      <p className="text-sm font-medium text-gray-900 truncate">{engin?.utilisateur_enregistrement}</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Date: {engin?.date_enregistrement}</p>
              </div>

              {/* Statut vignette */}
              <div className={`p-3 rounded-lg border ${
                engin?.status_vignette === 'pending' ? 'bg-amber-50/50 border-amber-200' :
                engin?.status_vignette === 'delivered' ? 'bg-emerald-50/50 border-emerald-200' :
                'bg-red-50/50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Statut de la vignette</p>
                    <p className={`font-semibold ${
                      engin?.status_vignette === 'pending' ? 'text-amber-700' :
                      engin?.status_vignette === 'delivered' ? 'text-emerald-700' :
                      'text-red-700'
                    }`}>
                      {engin?.status_vignette === 'pending' ? 'En attente de délivrance' :
                      engin?.status_vignette === 'delivered' ? 'Délivrée' : 'Expirée'}
                    </p>
                  </div>
                  {engin?.date_derniere_vignette && (
                    <p className="text-xs text-gray-500">
                      Dernière: {engin.date_derniere_vignette}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Boutons navigation */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-lg">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setEtape(1);
                setNumeroPlaque('');
                setReferenceTransaction('');
              }}
              className="flex-1 px-5 py-3.5 text-gray-700 bg-gray-100 hover:bg-gray-200 
                rounded-xl transition-colors font-semibold flex items-center justify-center gap-2
                border border-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Nouvelle vérification
            </button>
            <button
              onClick={procederDelivrance}
              disabled={isLoading}
              className="flex-1 px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 
                text-white rounded-xl hover:from-emerald-600 hover:to-green-600 
                transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed 
                flex items-center justify-center gap-2 shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Préparation...
                </>
              ) : (
                <>
                  <Ticket className="w-5 h-5" />
                  Procéder à la délivrance
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Rendu étape 3 : Délivrance
  const renderEtape3 = () => (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl mb-6 shadow-lg shadow-emerald-500/25">
          <Ticket className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Délivrance de Vignette
        </h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          Confirmez la délivrance de la vignette au client
        </p>
      </div>

      {/* Card de délivrance */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-lg">
          {/* Indicateur de succès */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Prêt pour la délivrance</h2>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
              <Check className="w-3 h-3" />
              Vignette générée avec succès
            </div>
          </div>

          {/* Résumé */}
          <div className="space-y-6 mb-8">
            {/* Informations générées */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl border border-blue-100">
                <p className="text-xs text-gray-500 mb-1">Code Vignette</p>
                <p className="text-xl font-bold text-gray-900 font-mono tracking-wider">
                  VGN-{new Date().getFullYear()}-{Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-emerald-50/50 to-green-50/50 rounded-xl border border-emerald-100">
                <p className="text-xs text-gray-500 mb-1">Validité</p>
                <p className="text-lg font-bold text-gray-900">31/12/{new Date().getFullYear()}</p>
                <p className="text-xs text-emerald-600">1 an à partir d'aujourd'hui</p>
              </div>
            </div>

            {/* Récapitulatif */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-blue-500" />
                Récapitulatif de la transaction
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Véhicule</span>
                  <span className="font-medium text-gray-900">{engin?.numero_plaque}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Propriétaire</span>
                  <span className="font-medium text-gray-900">{assujetti?.nom_complet}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Montant payé</span>
                  <span className="font-bold text-gray-900">{transaction?.montant} $</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Référence</span>
                  <span className="font-mono font-medium text-gray-900">{transaction?.reference}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Type de véhicule</span>
                  <span className="font-medium text-gray-900">{engin?.type_engin}</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-xl border border-amber-100">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800 mb-2">Processus de délivrance</p>
                  <ol className="space-y-2 text-sm text-amber-700">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 text-xs font-bold">1</span>
                      <span>Confirmez la délivrance pour enregistrer la transaction</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 text-xs font-bold">2</span>
                      <span>Les informations seront automatiquement envoyées à Autojuste</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 text-xs font-bold">3</span>
                      <span>Autojuste imprimera la vignette physique pour le client</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <button
              onClick={() => setEtape(2)}
              className="flex-1 px-5 py-3.5 text-gray-700 bg-gray-100 hover:bg-gray-200 
                rounded-xl transition-colors font-semibold border border-gray-200"
            >
              Retour
            </button>
            <button
              onClick={finaliserDelivrance}
              disabled={isLoading}
              className="flex-1 px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 
                text-white rounded-xl hover:from-emerald-600 hover:to-green-600 
                transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed 
                flex items-center justify-center gap-2 shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Délivrance...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Confirmer la délivrance
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Information Autojuste */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl border border-indigo-100 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Transmission Autojuste</h3>
              <p className="text-sm text-gray-500">Processus automatique d'impression</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-white/50 rounded-lg border border-indigo-100">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-indigo-800 mb-1">Processus sécurisé</p>
                  <p className="text-xs text-indigo-700">
                    Après confirmation, toutes les informations nécessaires seront automatiquement 
                    transmises à Autojuste pour l'impression sécurisée de la vignette physique.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-white/50 rounded-lg border border-emerald-100">
              <div className="flex items-start gap-3">
                <Cog className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-800 mb-1">Informations transmises</p>
                  <ul className="text-xs text-emerald-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Données du véhicule et du propriétaire</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Code unique de la vignette</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Période de validité</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Numéro de transaction</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50/50 to-white py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header avec retour */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 group-hover:shadow group-hover:border-gray-300 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-semibold">Retour aux services</span>
          </button>
          
          <div className="text-right">
            <div className="text-sm font-medium text-gray-500">Délivrance vignette</div>
            <div className="text-xs text-gray-400">Transaction #{transaction?.id || 'En attente'}</div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            {etape === 1 && renderEtape1()}
            {etape === 2 && renderEtape2()}
            {etape === 3 && renderEtape3()}
          </div>
        </div>

        {/* Footer léger */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Délivrance sécurisée</p>
                <p className="text-xs text-gray-500">Traçabilité complète</p>
              </div>
            </div>
            
            <div className="text-center sm:text-right">
              <p className="text-xs text-gray-400">
                © {new Date().getFullYear()} Système de Délivrance Vignettes
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Intégration TSC-NPS • Version 1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        buttonText={modal.buttonText}
        onConfirm={modal.onConfirm}
      />
    </div>
  );
}