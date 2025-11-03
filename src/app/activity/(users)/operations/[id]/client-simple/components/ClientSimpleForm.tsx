"use client";
import { useState } from "react";
import { Save, User, Car, Calculator, CheckCircle2, X } from "lucide-react";
import {
  soumettreImmatriculation,
  getNumeroPlaqueDisponible,
  verifierNumeroChassis,
  type ParticulierData,
  type EnginData,
  type PaiementData,
} from "@/services/immatriculation/immatriculationService";
import ImmatriculationPrint from "./ImmatriculationPrint";

interface FormData {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  nif: string;
  typeEngin: string;
  anneeFabrication: string;
  anneeCirculation: string;
  couleur: string;
  puissanceFiscal: string;
  usage: string;
  marque: string;
  energie: string;
  numeroChassis: string;
  numeroMoteur: string;
}

interface Utilisateur {
  id: number;
  nom_complet: string;
  telephone: string;
  adresse: string;
  site_nom: string;
  site_code: string;
  site_id?: number;
  formule?: string;
}

interface ClientSimpleFormProps {
  impotId: string;
  utilisateur: Utilisateur | null;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formData: FormData;
  montantAPayer: string;
  numeroPlaque: string | null;
  isLoading: boolean;
}

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

const PaiementModal: React.FC<PaiementModalProps> = ({
  isOpen,
  onClose,
  onPaiement,
  montant,
  isLoading,
}) => {
  const [modePaiement, setModePaiement] = useState<
    "mobile_money" | "cheque" | "banque" | "espece"
  >("mobile_money");
  const [operateur, setOperateur] = useState("");
  const [numeroTransaction, setNumeroTransaction] = useState("");
  const [numeroCheque, setNumeroCheque] = useState("");
  const [banque, setBanque] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPaiement({
      modePaiement,
      operateur: modePaiement === "mobile_money" ? operateur : undefined,
      numeroTransaction:
        modePaiement === "mobile_money" ? numeroTransaction : undefined,
      numeroCheque: modePaiement === "cheque" ? numeroCheque : undefined,
      banque: modePaiement === "banque" ? banque : undefined,
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
              {isLoading ? "Traitement..." : "Confirmer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  formData,
  montantAPayer,
  numeroPlaque,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">
              Récapitulatif de la Demande
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                <User className="w-4 h-4 text-blue-600 mr-2" />
                Informations de l'Assujetti
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500 text-xs">Nom:</span>
                    <p className="font-semibold text-gray-800">{formData.nom}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Téléphone:</span>
                    <p className="font-semibold text-gray-800">{formData.telephone}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500 text-xs">Prénom:</span>
                    <p className="font-semibold text-gray-800">{formData.prenom}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Adresse:</span>
                    <p className="font-semibold text-gray-800">{formData.adresse}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                <Car className="w-4 h-4 text-green-600 mr-2" />
                Informations de l'Engin
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500 text-xs">Type d'engin:</span>
                    <p className="font-semibold text-gray-800">{formData.typeEngin}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Marque:</span>
                    <p className="font-semibold text-gray-800">{formData.marque}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500 text-xs">Énergie:</span>
                    <p className="font-semibold text-gray-800">
                      {formData.energie || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Couleur:</span>
                    <p className="font-semibold text-gray-800">
                      {formData.couleur || "Non renseigné"}
                    </p>
                  </div>
                </div>
              </div>
              {numeroPlaque && (
                <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <span className="text-gray-500 text-xs font-medium">
                    Numéro de plaque attribué:
                  </span>
                  <p className="font-bold text-green-600 text-lg mt-1">
                    {numeroPlaque}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-5 text-white">
              <div className="text-center">
                <div className="text-blue-100 text-sm font-medium">
                  Montant total à payer
                </div>
                <div className="text-3xl font-bold mt-1">
                  {montantAPayer}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 hover:border-gray-400 rounded-xl transition-all font-semibold"
              disabled={isLoading}
            >
              Retour
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Traitement...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Procéder au Paiement</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
              Immatriculation Réussie!
            </h3>
            <p className="text-gray-600 text-sm">
              La demande d'immatriculation a été traitée avec succès.
            </p>
          </div>

          <div className="space-y-4 mb-4">
            <div className="text-center bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
              <div className="text-sm text-green-600 font-medium">
                Numéro de plaque attribué
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
              Imprimer la Carte Rose
            </button>
            {/* <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold"
            >
              Terminer
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
};

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
    nif: "",
    typeEngin: "",
    anneeFabrication: "",
    anneeCirculation: "",
    couleur: "",
    puissanceFiscal: "",
    usage: "",
    marque: "",
    energie: "",
    numeroChassis: "",
    numeroMoteur: "",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPaiement, setShowPaiement] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [numeroPlaque, setNumeroPlaque] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);
  const [printData, setPrintData] = useState<any>(null);
  const [serieItemId, setSerieItemId] = useState<number | null>(null);

  const montantAPayer = utilisateur?.formule ? `${utilisateur.formule} $` : "32 $";
  const montantNumerique = utilisateur?.formule || "32";

  const genererNIF = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `NIF_${timestamp}_${random}`;
  };

  const resetForm = () => {
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
      numeroChassis: "",
      numeroMoteur: "",
    });
    setErrors({});
    setNumeroPlaque(null);
    setSerieItemId(null);
    setShowPrint(false);
    setShowSuccess(false);
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

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.nom.trim()) newErrors.nom = "Le nom est obligatoire";
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est obligatoire";
    if (!formData.telephone.trim()) newErrors.telephone = "Le téléphone est obligatoire";
    if (!formData.adresse.trim()) newErrors.adresse = "L'adresse est obligatoire";
    if (!formData.typeEngin) newErrors.typeEngin = "Le type d'engin est obligatoire";
    if (!formData.marque) newErrors.marque = "La marque est obligatoire";

    const phoneRegex = /^[0-9+\-\s()]{8,}$/;
    if (formData.telephone && !phoneRegex.test(formData.telephone.replace(/\s/g, ''))) {
      newErrors.telephone = "Format de téléphone invalide";
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Générer le NIF automatiquement
      const nif = genererNIF();
      setFormData(prev => ({ ...prev, nif }));

      // Récupérer un numéro de plaque disponible (sans changer le statut)
      const plaqueResponse = await getNumeroPlaqueDisponible();

      if (plaqueResponse.status === "error") {
        alert("Erreur: " + plaqueResponse.message);
        setIsSubmitting(false);
        return;
      }

      // Stocker les données de la plaque (sans encore marquer comme utilisé)
      setNumeroPlaque(plaqueResponse.data?.numeroPlaque || null);
      setSerieItemId(plaqueResponse.data?.serie_item_id || null);
      setShowConfirmation(true);
    } catch (error) {
      console.error("Erreur lors de la récupération du numéro de plaque:", error);
      alert("Une erreur est survenue lors de la préparation de la demande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmation = () => {
    setShowConfirmation(false);
    setShowPaiement(true);
  };

  const handlePaiement = async (paiementData: PaiementData) => {
    if (!utilisateur || !serieItemId) {
      alert("Erreur: Données manquantes pour le traitement");
      return;
    }

    setIsSubmitting(true);

    try {
      // Préparer les données pour l'API
      const particulierData: ParticulierData = {
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone,
        email: formData.email,
        adresse: formData.adresse,
      };

      const enginData: EnginData = {
        typeEngin: formData.typeEngin,
        marque: formData.marque,
        energie: formData.energie,
        anneeFabrication: formData.anneeFabrication,
        anneeCirculation: formData.anneeCirculation,
        couleur: formData.couleur,
        puissanceFiscal: formData.puissanceFiscal,
        usage: formData.usage,
        numeroChassis: formData.numeroChassis,
        numeroMoteur: formData.numeroMoteur,
      };

      // Inclure le serie_item_id dans les données pour le backend
      const dataWithSerieItem = {
        ...paiementData,
        serie_item_id: serieItemId
      };

      // Soumettre l'immatriculation (le statut sera changé dans le backend)
      const response = await soumettreImmatriculation(
        impotId,
        particulierData,
        enginData,
        dataWithSerieItem,
        utilisateur
      );

      if (response.status === "success") {
        // Préparer les données complètes pour l'impression
        const completeData = {
          ...response.data,
          nif: formData.nif,
          annee_circulation: formData.anneeCirculation,
          annee_fabrication: formData.anneeFabrication,
          couleur: formData.couleur,
          puissance_fiscal: formData.puissanceFiscal,
          energie: formData.energie,
          usage: formData.usage,
          numero_chassis: formData.numeroChassis,
          numero_moteur: formData.numeroMoteur,
          type_engin: formData.typeEngin,
          marque: formData.marque,
          nom: formData.nom,
          prenom: formData.prenom,
          adresse: formData.adresse,
          telephone: formData.telephone
        };

        setSuccessData(completeData);
        setPrintData(completeData);
        setShowPaiement(false);
        setShowSuccess(true);
      } else {
        alert("Erreur: " + response.message);
      }
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      alert("Une erreur est survenue lors de la soumission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    setShowSuccess(false);
    setShowPrint(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    resetForm();
  };

  const handlePrintClose = () => {
    setShowPrint(false);
    resetForm();
  };

  const typeEnginOptions = ["Moto", "Voiture", "Camion", "Bus", "Autocar"];
  const anneeOptions = Array.from({ length: 30 }, (_, i) => (2025 - i).toString());
  const couleurOptions = ["Beige", "Blanc", "Bleu", "Gris", "Jaune", "Marron", "Noir", "Orange", "Rose", "Rouge", "Vert", "Violet"];
  const puissanceOptions = ["3CV", "5CV", "7CV", "10CV", "12CV", "15CV", "20CV"];
  const usageOptions = ["TAXI", "PRIVE", "SOCIETE", "TRANSPORT", "LOCATION"];
  const marqueOptions = ["TVS", "HAOUJUE", "HAOJIN", "BOXER", "YAMAHA", "ZONG SHEN", "HONDA", "AG", "DT", "MAX 125", "TOYOTA", "NISSAN", "RENAULT", "PEUGEOT", "MERCEDES", "BMW", "AUDI", "VOLKSWAGEN", "HYUNDAI", "KIA"];
  const energieOptions = ["Essence", "Diesel", "Électrique", "Hybride", "GPL"];

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION ASSUJETTI */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-xl">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Informations de l'Assujetti
              </h2>
              <p className="text-gray-600">
                Renseignez les informations personnelles du propriétaire
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => handleInputChange("nom", e.target.value)}
                placeholder="Entrez votre nom"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.nom ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                }`}
              />
              {errors.nom && (
                <p className="text-red-600 text-sm mt-2 font-medium">{errors.nom}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.prenom}
                onChange={(e) => handleInputChange("prenom", e.target.value)}
                placeholder="Entrez votre prénom"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.prenom ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                }`}
              />
              {errors.prenom && (
                <p className="text-red-600 text-sm mt-2 font-medium">{errors.prenom}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Numéro de téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => handleInputChange("telephone", e.target.value)}
                placeholder="Ex: +243 00 00 00 000"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.telephone ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                }`}
              />
              {errors.telephone && (
                <p className="text-red-600 text-sm mt-2 font-medium">{errors.telephone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="exemple@email.com"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.email ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                }`}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-2 font-medium">{errors.email}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Adresse physique <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.adresse}
                onChange={(e) => handleInputChange("adresse", e.target.value)}
                placeholder="Entrez votre adresse complète"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.adresse ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                }`}
              />
              {errors.adresse && (
                <p className="text-red-600 text-sm mt-2 font-medium">{errors.adresse}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Numéro d'Identification Fiscale (NIF)
              </label>
              <input
                type="text"
                value={formData.nif || "Généré automatiquement après validation"}
                readOnly
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500"
              />
              <p className="text-sm text-gray-500 mt-2">
                Le NIF sera généré automatiquement lors de la validation du formulaire
              </p>
            </div>
          </div>
        </div>

        {/* SECTION ENGIN */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-green-100 p-3 rounded-xl">
              <Car className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Informations de l'Engin
              </h2>
              <p className="text-gray-600">
                Renseignez les caractéristiques techniques du véhicule
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Type d'engin <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.typeEngin}
                onChange={(e) => handleInputChange("typeEngin", e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.typeEngin ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                }`}
              >
                <option value="">Sélectionner le type d'engin</option>
                {typeEnginOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.typeEngin && (
                <p className="text-red-600 text-sm mt-2 font-medium">{errors.typeEngin}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Marque <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.marque}
                onChange={(e) => handleInputChange("marque", e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.marque ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                }`}
              >
                <option value="">Sélectionner la marque</option>
                {marqueOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.marque && (
                <p className="text-red-600 text-sm mt-2 font-medium">{errors.marque}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Énergie
              </label>
              <select
                value={formData.energie}
                onChange={(e) => handleInputChange("energie", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Sélectionner l'énergie</option>
                {energieOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Année de fabrication
              </label>
              <select
                value={formData.anneeFabrication}
                onChange={(e) => handleInputChange("anneeFabrication", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Année de circulation
              </label>
              <select
                value={formData.anneeCirculation}
                onChange={(e) => handleInputChange("anneeCirculation", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Couleur
              </label>
              <select
                value={formData.couleur}
                onChange={(e) => handleInputChange("couleur", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Sélectionner la couleur</option>
                {couleurOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Puissance Fiscal
              </label>
              <select
                value={formData.puissanceFiscal}
                onChange={(e) => handleInputChange("puissanceFiscal", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Sélectionner la puissance</option>
                {puissanceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Usage
              </label>
              <select
                value={formData.usage}
                onChange={(e) => handleInputChange("usage", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">Sélectionner l'usage</option>
                {usageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Numéro de châssis
              </label>
              <input
                type="text"
                value={formData.numeroChassis}
                onChange={(e) => handleInputChange("numeroChassis", e.target.value)}
                placeholder="Entrez le numéro de châssis"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Numéro de moteur
              </label>
              <input
                type="text"
                value={formData.numeroMoteur}
                onChange={(e) => handleInputChange("numeroMoteur", e.target.value)}
                placeholder="Entrez le numéro de moteur"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* CALCUL ET SOUMISSION */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-orange-100 p-3 rounded-xl">
              <Calculator className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Calcul et Validation
              </h2>
              <p className="text-gray-600">
                Montant à payer et soumission de la demande
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 mb-6">
            <div>
              <div className="text-sm text-blue-600 font-medium">Montant à payer</div>
              <div className="text-3xl font-bold text-blue-800">
                {montantAPayer}
              </div>
              <div className="text-sm text-blue-500 mt-2">
                {utilisateur?.formule ? `Montant = ${utilisateur.formule}` : "Montant = 32"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-600 font-medium">Délai d'accord</div>
              <div className="text-xl font-bold text-green-600">
                Immédiat
              </div>
              {utilisateur && (
                <div className="text-sm text-blue-500 mt-2">
                  Site: {utilisateur.site_nom}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-8 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 font-semibold border-2 border-transparent hover:border-gray-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Traitement...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Valider le Paiement</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Modals */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmation}
        formData={formData}
        montantAPayer={montantAPayer}
        numeroPlaque={numeroPlaque}
        isLoading={isSubmitting}
      />

      <PaiementModal
        isOpen={showPaiement}
        onClose={() => setShowPaiement(false)}
        onPaiement={handlePaiement}
        montant={montantAPayer}
        isLoading={isSubmitting}
      />

      <SuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        onPrint={handlePrint}
        data={successData}
      />

      <ImmatriculationPrint
        data={printData}
        isOpen={showPrint}
        onClose={handlePrintClose}
      />
    </>
  );
}