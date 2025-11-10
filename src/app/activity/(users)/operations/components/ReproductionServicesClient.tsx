'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, User, Car, CreditCard, Smartphone, Building, FileText, DollarSign, CheckCircle, Printer, Search, AlertCircle, X, CheckCircle2, Hash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Impot } from '@/services/impots/impotService';
import { verifierPlaque, traiterReproduction, DonneesPlaque, PaiementReproductionData } from '@/services/reproduction/reproductionService';
import ReproductionPrint from './ReproductionPrint';

// Import des services pour les données dynamiques
import { getTypeEnginsActifs, type TypeEngin } from '@/services/type-engins/typeEnginService';
import { getEnergies, type Energie } from '@/services/energies/energieService';
import { getCouleurs, type EnginCouleur } from '@/services/couleurs/couleurService';
import { getUsages, type UsageEngin } from '@/services/usages/usageService';
import { getMarquesEngins, type MarqueEngin } from '@/services/marques-engins/marqueEnginService';
import { getPuissancesFiscalesActives, type PuissanceFiscale } from '@/services/puissances-fiscales/puissanceFiscaleService';

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
  modePaiement: 'mobile_money' | 'cheque' | 'banque' | 'espece' | '';
  operateur?: string;
  numeroTransaction?: string;
  numeroCheque?: string;
  banque?: string;
  montant: string;
}

type Etape = 'verification' | 'confirmation' | 'paiement' | 'recapitulatif';

// Interfaces pour les modals
interface PaiementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaiement: (paiementData: PaiementData) => void;
  montant: string;
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
  isLoading,
}) => {
  const [modePaiement, setModePaiement] = useState<'mobile_money' | 'cheque' | 'banque' | 'espece'>('mobile_money');
  const [operateur, setOperateur] = useState('');
  const [numeroTransaction, setNumeroTransaction] = useState('');
  const [numeroCheque, setNumeroCheque] = useState('');
  const [banque, setBanque] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPaiement({
      modePaiement,
      operateur: modePaiement === 'mobile_money' ? operateur : undefined,
      numeroTransaction: modePaiement === 'mobile_money' ? numeroTransaction : undefined,
      numeroCheque: modePaiement === 'cheque' ? numeroCheque : undefined,
      banque: modePaiement === 'banque' ? banque : undefined,
      montant: montant.replace(' $', '')
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

          {modePaiement === 'mobile_money' && (
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

          {modePaiement === 'cheque' && (
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

          {modePaiement === 'banque' && (
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

          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Montant à payer</div>
            <div className="text-2xl font-bold text-blue-800">{montant}</div>
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
              {isLoading ? 'Traitement...' : 'Confirmer'}
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

export default function ReproductionServicesClient({ impot }: ReproductionServicesClientProps) {
  const router = useRouter();
  const [etapeActuelle, setEtapeActuelle] = useState<Etape>('verification');
  const [numeroPlaque, setNumeroPlaque] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPaiement, setShowPaiement] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [paiementData, setPaiementData] = useState<PaiementData>({
    modePaiement: '',
    montant: impot.prix.toString()
  });
  const [isPaiementProcessing, setIsPaiementProcessing] = useState(false);
  const [donneesPlaque, setDonneesPlaque] = useState<DonneesPlaque | null>(null);
  const [erreurVerification, setErreurVerification] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  const [printData, setPrintData] = useState<any>(null);

  // États pour les données dynamiques
  const [typeEngins, setTypeEngins] = useState<TypeEngin[]>([]);
  const [energies, setEnergies] = useState<Energie[]>([]);
  const [couleurs, setCouleurs] = useState<EnginCouleur[]>([]);
  const [usages, setUsages] = useState<UsageEngin[]>([]);
  const [marques, setMarques] = useState<MarqueEngin[]>([]);
  const [puissancesFiscales, setPuissancesFiscales] = useState<PuissanceFiscale[]>([]);
  const [filteredMarques, setFilteredMarques] = useState<MarqueEngin[]>([]);
  const [filteredPuissances, setFilteredPuissances] = useState<PuissanceFiscale[]>([]);

  const [formData, setFormData] = useState<FormData>({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    adresse: '',
    nif: '',
    typeEngin: '',
    anneeFabrication: '',
    anneeCirculation: '',
    couleur: '',
    puissanceFiscal: '',
    usage: '',
    marque: '',
    energie: '',
    numeroPlaque: '',
    numeroChassis: '',
    numeroMoteur: ''
  });

  // Formatage du prix - CORRIGÉ : Utilise le prix de la table impot
  const prixFormate = `${impot.prix} $`;

  // Chargement des données dynamiques au montage du composant
  useEffect(() => {
    const loadDynamicData = async () => {
      try {
        // Charger les types d'engins
        const typeEnginsResponse = await getTypeEnginsActifs();
        if (typeEnginsResponse.status === 'success') {
          setTypeEngins(typeEnginsResponse.data || []);
        }

        // Charger les énergies
        const energiesResponse = await getEnergies();
        if (energiesResponse.status === 'success') {
          setEnergies(energiesResponse.data || []);
        }

        // Charger les couleurs
        const couleursResponse = await getCouleurs();
        if (couleursResponse.status === 'success') {
          setCouleurs(couleursResponse.data || []);
        }

        // Charger les usages
        const usagesResponse = await getUsages();
        if (usagesResponse.status === 'success') {
          setUsages(usagesResponse.data || []);
        }

        // Charger les marques
        const marquesResponse = await getMarquesEngins();
        if (marquesResponse.status === 'success') {
          setMarques(marquesResponse.data || []);
        }

        // Charger les puissances fiscales
        const puissancesResponse = await getPuissancesFiscalesActives();
        if (puissancesResponse.status === 'success') {
          setPuissancesFiscales(puissancesResponse.data || []);
        }

      } catch (error) {
        console.error('Erreur lors du chargement des données dynamiques:', error);
      }
    };

    loadDynamicData();
  }, []);

  // Filtrer les marques et puissances quand le type d'engin change
  useEffect(() => {
    if (formData.typeEngin) {
      const marquesFiltrees = marques.filter(marque => 
        marque.type_engin_libelle === formData.typeEngin
      );
      setFilteredMarques(marquesFiltrees);
      
      const puissancesFiltrees = puissancesFiscales.filter(puissance =>
        puissance.type_engin_libelle === formData.typeEngin
      );
      setFilteredPuissances(puissancesFiltrees);
    } else {
      setFilteredMarques([]);
      setFilteredPuissances([]);
    }
  }, [formData.typeEngin, marques, puissancesFiscales]);

  // Récupération des données depuis la base DGI - CORRIGÉ
  const recupererDonneesPlaque = async (plaque: string) => {
    setIsLoading(true);
    setErreurVerification('');
    
    try {
      const result = await verifierPlaque(plaque);
      
      if (result.status === 'error') {
        setErreurVerification(result.message || 'Erreur lors de la vérification');
        return;
      }

      const donnees = result.data as DonneesPlaque;
      setDonneesPlaque(donnees);
      
      // Mise à jour du formulaire avec les données récupérées - CORRIGÉ
      setFormData({
        nom: donnees.nom || '',
        prenom: donnees.prenom || '',
        telephone: donnees.telephone || '',
        email: donnees.email || '',
        adresse: donnees.adresse || '',
        nif: '', // Le NIF n'est pas fourni par l'API, on le laisse vide
        typeEngin: donnees.type_engin || '',
        anneeFabrication: donnees.annee_fabrication || '',
        anneeCirculation: donnees.annee_circulation || '',
        couleur: donnees.couleur || '',
        puissanceFiscal: donnees.puissance_fiscal || '',
        usage: donnees.usage_engin || '',  // ← CORRIGÉ: usage_engin
        marque: donnees.marque || '',      // ← CORRIGÉ: marque
        energie: donnees.energie || '',
        numeroPlaque: donnees.numero_plaque || '',
        numeroChassis: donnees.numero_chassis || '',
        numeroMoteur: donnees.numero_moteur || ''
      });
      
      setEtapeActuelle('confirmation');
      
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      setErreurVerification('Erreur lors de la récupération des informations de la plaque.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = () => {
    if (!numeroPlaque.trim()) {
      setErreurVerification('Veuillez saisir le numéro de plaque');
      return;
    }
    
    recupererDonneesPlaque(numeroPlaque);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const procederAuPaiement = () => {
    setShowPaiement(true);
  };

  const traiterPaiement = async (paiementDataForm: PaiementData) => {
    setIsPaiementProcessing(true);

    try {
      // Simulation des données utilisateur (à remplacer par les vraies données)
      const utilisateur = {
        id: 1,
        site_id: 1
      };

      const paiementReproductionData: PaiementReproductionData = {
        modePaiement: paiementDataForm.modePaiement as 'mobile_money' | 'cheque' | 'banque' | 'espece',
        operateur: paiementDataForm.operateur,
        numeroTransaction: paiementDataForm.numeroTransaction,
        numeroCheque: paiementDataForm.numeroCheque,
        banque: paiementDataForm.banque
      };

      const result = await traiterReproduction(
        impot.id.toString(),
        formData.numeroPlaque,
        paiementReproductionData,
        utilisateur
      );

      if (result.status === 'success') {
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
          montant: impot.prix.toString() // ← CORRIGÉ: Utilise le prix de l'impôt
        };

        setSuccessData(completeData);
        setPrintData(completeData);
        setShowSuccess(true);
      } else {
        alert(result.message || 'Erreur lors du traitement du paiement');
      }
      
    } catch (error) {
      console.error('Erreur lors du paiement:', error);
      alert('Erreur lors du traitement du paiement.');
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
    setEtapeActuelle('verification');
    setNumeroPlaque('');
    setFormData({
      nom: '', prenom: '', telephone: '', email: '', adresse: '', nif: '',
      typeEngin: '', anneeFabrication: '', anneeCirculation: '', couleur: '', 
      puissanceFiscal: '', usage: '', marque: '', energie: '',
      numeroPlaque: '', numeroChassis: '', numeroMoteur: ''
    });
  };

  const handlePrintClose = () => {
    setShowPrint(false);
    // Réinitialiser complètement
    setEtapeActuelle('verification');
    setNumeroPlaque('');
    setFormData({
      nom: '', prenom: '', telephone: '', email: '', adresse: '', nif: '',
      typeEngin: '', anneeFabrication: '', anneeCirculation: '', couleur: '', 
      puissanceFiscal: '', usage: '', marque: '', energie: '',
      numeroPlaque: '', numeroChassis: '', numeroMoteur: ''
    });
  };

  // Générer les options d'années
  const anneeOptions = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString());

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
            Saisissez le numéro de plaque pour récupérer les informations du véhicule
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
              setErreurVerification('');
            }}
            placeholder="Ex: AB-123-CD"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-gray-500 text-sm mt-2">
            Le système récupérera automatiquement les informations depuis la base DGI
          </p>
        </div>

        {erreurVerification && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-800 text-sm">Erreur de vérification</h4>
              <p className="text-red-700 text-sm mt-1">{erreurVerification}</p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start space-x-3">
            <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800 text-sm">Coût du Service</h4>
              <p className="text-blue-700 text-sm mt-1">
                Frais de reproduction de carte : <strong>{prixFormate}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={handleVerification}
            disabled={isLoading || !numeroPlaque.trim()}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
          <h3 className="text-lg font-semibold text-gray-700">Informations Récupérées</h3>
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            ✓ Données DGI
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Numéro de Plaque:</span>
            <div className="text-gray-700 font-medium">{formData.numeroPlaque}</div>
          </div>
          <div>
            <span className="text-gray-500">Propriétaire:</span>
            <div className="text-gray-700 font-medium">{formData.prenom} {formData.nom}</div>
          </div>
          <div>
            <span className="text-gray-500">Téléphone:</span>
            <div className="text-gray-700 font-medium">{formData.telephone}</div>
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
              Renseignez les informations personnelles du propriétaire
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
              onChange={(e) => handleInputChange('nom', e.target.value)}
              placeholder="Entrez votre nom"
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
              onChange={(e) => handleInputChange('prenom', e.target.value)}
              placeholder="Entrez votre prénom"
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
              onChange={(e) => handleInputChange('telephone', e.target.value)}
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
              onChange={(e) => handleInputChange('email', e.target.value)}
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
              onChange={(e) => handleInputChange('adresse', e.target.value)}
              placeholder="Entrez votre adresse complète"
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
                onChange={(e) => handleInputChange('nif', e.target.value)}
                placeholder="Généré automatiquement après validation"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                readOnly
              />
              <div className="bg-blue-100 p-2 rounded-lg">
                <Hash className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-2">
              Le NIF sera généré automatiquement lors de la validation du formulaire
            </p>
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
              Renseignez les caractéristiques techniques du véhicule
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
              onChange={(e) => handleInputChange('typeEngin', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner le type d'engin</option>
              {typeEngins.map((option) => (
                <option key={option.id} value={option.libelle}>{option.libelle}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marque <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.marque}
              onChange={(e) => handleInputChange('marque', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner la marque</option>
              {filteredMarques.map((option) => (
                <option key={option.id} value={option.libelle}>{option.libelle}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Énergie
            </label>
            <select
              value={formData.energie}
              onChange={(e) => handleInputChange('energie', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner l'énergie</option>
              {energies.map((option) => (
                <option key={option.id} value={option.nom}>{option.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année de fabrication
            </label>
            <select
              value={formData.anneeFabrication}
              onChange={(e) => handleInputChange('anneeFabrication', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner l'année</option>
              {anneeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année de circulation
            </label>
            <select
              value={formData.anneeCirculation}
              onChange={(e) => handleInputChange('anneeCirculation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner l'année</option>
              {anneeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur
            </label>
            <select
              value={formData.couleur}
              onChange={(e) => handleInputChange('couleur', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner la couleur</option>
              {couleurs.map((option) => (
                <option key={option.id} value={option.nom}>{option.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Puissance Fiscal
            </label>
            <select
              value={formData.puissanceFiscal}
              onChange={(e) => handleInputChange('puissanceFiscal', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner la puissance</option>
              {filteredPuissances.map((option) => (
                <option key={option.id} value={option.libelle}>{option.libelle}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usage <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.usage}
              onChange={(e) => handleInputChange('usage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner l'usage</option>
              {usages.map((option) => (
                <option key={option.id} value={option.libelle}>{option.libelle}</option>
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
              onChange={(e) => handleInputChange('numeroChassis', e.target.value)}
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
              onChange={(e) => handleInputChange('numeroMoteur', e.target.value)}
              placeholder="Entrez le numéro de moteur"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* RÉSUMÉ ET PAIEMENT */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200 mb-6">
          <div>
            <div className="text-sm text-orange-600">Frais de Reproduction</div>
            <div className="text-2xl font-bold text-orange-800">{prixFormate}</div>
            <div className="text-xs text-orange-600 mt-1">
              Pour l'impression de la nouvelle carte
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-orange-600">Délai</div>
            <div className="text-lg font-semibold text-green-600">Immédiat</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setEtapeActuelle('verification');
              setErreurVerification('');
            }}
            className="flex items-center space-x-2 px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>

          <button
            onClick={procederAuPaiement}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
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
            <div className="text-sm text-gray-500">
              ID: #{impot.id}
            </div>
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
              Ce service permet de reproduire une carte d'immatriculation perdue ou endommagée. 
              Saisissez le numéro de plaque pour récupérer automatiquement les informations du véhicule.
            </p>
          </div>

          {/* INDICATEUR D'ÉTAPE */}
          <div className="mt-6">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {['verification', 'confirmation', 'paiement', 'recapitulatif'].map((etape, index) => (
                <div key={etape} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    etapeActuelle === etape ? 'bg-blue-600 text-white' :
                    index < ['verification', 'confirmation', 'paiement', 'recapitulatif'].indexOf(etapeActuelle) ? 
                    'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {index < ['verification', 'confirmation', 'paiement', 'recapitulatif'].indexOf(etapeActuelle) ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 3 && <div className="w-16 h-1 bg-gray-300 mx-2"></div>}
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
        {etapeActuelle === 'verification' && renderEtapeVerification()}
        {etapeActuelle === 'confirmation' && renderEtapeConfirmation()}

        {/* MODALS */}
        <PaiementModal
          isOpen={showPaiement}
          onClose={() => setShowPaiement(false)}
          onPaiement={traiterPaiement}
          montant={prixFormate}
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