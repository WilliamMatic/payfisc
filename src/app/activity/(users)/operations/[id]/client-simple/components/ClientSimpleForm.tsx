"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  User,
  Car,
  Calculator,
  CheckCircle2,
  X,
  Loader,
  Search,
  Plus,
  Trash2,
} from "lucide-react";
import {
  soumettreImmatriculation,
  getNumeroPlaqueDisponible,
  verifierNumeroChassis,
  verifierParticulierParTelephone,
  rechercherModeles,
  rechercherPuissances,
  annulerImmatriculation,
  rechercherCouleur,
  ajouterCouleur,
  type ParticulierData,
  type EnginData,
  type PaiementData,
  type ImmatriculationResponse,
} from "@/services/immatriculation/immatriculationService";
import {
  getTypeEnginsActifs,
  type TypeEngin,
} from "@/services/type-engins/typeEnginService";
import {
  getEnergiesActives,
  type Energie,
} from "@/services/energies/energieService";
import {
  getCouleursActives,
  type EnginCouleur,
} from "@/services/couleurs/couleurService";
import {
  getUsagesActifs,
  type UsageEngin,
} from "@/services/usages/usageService";
import {
  rechercherMarques,
  type MarqueEngin,
} from "@/services/marques-engins/marqueEnginService";
import {
  getPuissancesFiscalesActives,
  type PuissanceFiscale,
} from "@/services/puissances-fiscales/puissanceFiscaleService";
import {
  rechercherPlaques,
  type PlaqueResult,
} from "@/services/immatriculation/plaqueService";
import { getTauxActif, type Taux } from "@/services/taux/tauxService";
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
  modele: string;
  energie: string;
  numeroChassis: string;
  numeroMoteur: string;
  numeroPlaque: string;
  reduction_type: "pourcentage" | "montant_fixe" | "";
  reduction_valeur: string;
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
  montantEnFrancs: string;
  numeroPlaque: string;
  isLoading: boolean;
}

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

interface AnnulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (raison: string) => void;
  isLoading: boolean;
  numeroPlaque: string;
  paiementId: number;
}

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
            <div className="text-sm text-blue-600 font-medium">
              Montant à payer
            </div>
            <div className="text-2xl font-bold text-blue-800">{montant}</div>
            <div className="text-lg font-semibold text-blue-700 mt-1">
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

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  formData,
  montantAPayer,
  montantEnFrancs,
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
                    <p className="font-semibold text-gray-800">
                      {formData.nom}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Téléphone:</span>
                    <p className="font-semibold text-gray-800">
                      {formData.telephone || "Non renseigné"}
                    </p>
                  </div>
                  {formData.reduction_type && (
                    <div>
                      <span className="text-gray-500 text-xs">Réduction:</span>
                      <p className="font-semibold text-gray-800">
                        {formData.reduction_type === "pourcentage"
                          ? `${formData.reduction_valeur}%`
                          : `${formData.reduction_valeur} $`}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500 text-xs">Prénom:</span>
                    <p className="font-semibold text-gray-800">
                      {formData.prenom}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Adresse:</span>
                    <p className="font-semibold text-gray-800">
                      {formData.adresse}
                    </p>
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
                    <p className="font-semibold text-gray-800">
                      {formData.typeEngin}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Marque:</span>
                    <p className="font-semibold text-gray-800">
                      {formData.marque}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Modèle:</span>
                    <p className="font-semibold text-gray-800">
                      {formData.modele || "Non spécifié"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">
                      Puissance fiscale:
                    </span>
                    <p className="font-semibold text-gray-800">
                      {formData.puissanceFiscal}
                    </p>
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
                  <div>
                    <span className="text-gray-500 text-xs">Usage:</span>
                    <p className="font-semibold text-gray-800">
                      {formData.usage || "Non renseigné"}
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
                <div className="text-3xl font-bold mt-1">{montantAPayer}</div>
                <div className="text-xl font-semibold mt-2">
                  {montantEnFrancs}
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
  const [showAnnulation, setShowAnnulation] = useState(false);

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
                <p className="text-xs text-gray-600">{data?.montant_francs}</p>
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
            <button
              onClick={() => setShowAnnulation(true)}
              className="px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all font-semibold"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnnulationModal: React.FC<AnnulationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  numeroPlaque,
  paiementId,
}) => {
  const [raison, setRaison] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(raison);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Annuler l'Immatriculation
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
          <div className="text-red-600 font-semibold mb-2">⚠️ Attention !</div>
          <p className="text-red-700 text-sm">
            Cette action est irréversible. Elle supprimera toutes les traces de
            cette immatriculation :
          </p>
          <ul className="text-red-600 text-sm mt-2 space-y-1">
            <li>• Données de paiement (ID: {paiementId})</li>
            <li>• Informations de l'engin</li>
            <li>• Données dans la table carte_reprint</li>
            <li>• Plaque {numeroPlaque} sera remise disponible</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Raison de l'annulation *
            </label>
            <textarea
              value={raison}
              onChange={(e) => setRaison(e.target.value)}
              placeholder="Veuillez spécifier la raison de l'annulation..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all min-h-[100px]"
              required
            />
          </div>

          <div className="flex space-x-3">
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
              disabled={isLoading || !raison.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold disabled:opacity-50"
            >
              {isLoading ? "Traitement..." : "Confirmer l'annulation"}
            </button>
          </div>
        </form>
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
    modele: "",
    energie: "",
    numeroChassis: "",
    numeroMoteur: "",
    numeroPlaque: "",
    reduction_type: "",
    reduction_valeur: "",
  });

  const router = useRouter();

  // États pour les données dynamiques
  const [typeEngins, setTypeEngins] = useState<TypeEngin[]>([]);
  const [energies, setEnergies] = useState<Energie[]>([]);
  const [couleurs, setCouleurs] = useState<EnginCouleur[]>([]);
  const [usages, setUsages] = useState<UsageEngin[]>([]);
  const [puissancesFiscales, setPuissancesFiscales] = useState<
    PuissanceFiscale[]
  >([]);

  // États pour les suggestions de marques
  const [marquesSuggestions, setMarquesSuggestions] = useState<MarqueEngin[]>(
    [],
  );
  const [showMarquesSuggestions, setShowMarquesSuggestions] = useState(false);
  const [isSearchingMarques, setIsSearchingMarques] = useState(false);
  const [selectedMarqueId, setSelectedMarqueId] = useState<number | null>(null);

  // États pour les suggestions de couleurs
  const [couleursSuggestions, setCouleursSuggestions] = useState<
    EnginCouleur[]
  >([]);
  const [showCouleursSuggestions, setShowCouleursSuggestions] = useState(false);
  const [isSearchingCouleurs, setIsSearchingCouleurs] = useState(false);
  const [selectedCouleur, setSelectedCouleur] = useState<EnginCouleur | null>(
    null,
  );
  const [isAddingCouleur, setIsAddingCouleur] = useState(false);
  const [showAddCouleurForm, setShowAddCouleurForm] = useState(false);
  const [nouvelleCouleurNom, setNouvelleCouleurNom] = useState("");
  const [nouvelleCouleurCode, setNouvelleCouleurCode] = useState("#000000");

  // États pour le taux
  const [tauxActif, setTauxActif] = useState<Taux | null>(null);
  const [loadingTaux, setLoadingTaux] = useState(false);

  // États pour la recherche de plaques
  const [plaquesSuggestions, setPlaquesSuggestions] = useState<PlaqueResult[]>(
    [],
  );
  const [showPlaquesSuggestions, setShowPlaquesSuggestions] = useState(false);
  const [isSearchingPlaques, setIsSearchingPlaques] = useState(false);
  const [plaqueDisponible, setPlaqueDisponible] = useState<boolean | null>(
    null,
  );

  // États pour la recherche de modèles
  const [modelesSuggestions, setModelesSuggestions] = useState<any[]>([]);
  const [showModelesSuggestions, setShowModelesSuggestions] = useState(false);
  const [isSearchingModeles, setIsSearchingModeles] = useState(false);

  // États pour la recherche de puissances
  const [puissancesSuggestions, setPuissancesSuggestions] = useState<any[]>([]);
  const [showPuissancesSuggestions, setShowPuissancesSuggestions] =
    useState(false);
  const [isSearchingPuissances, setIsSearchingPuissances] = useState(false);

  const [loading, setLoading] = useState({
    typeEngins: false,
    energies: false,
    couleurs: false,
    usages: false,
    puissances: false,
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPaiement, setShowPaiement] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAnnulation, setShowAnnulation] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [printData, setPrintData] = useState<any>(null);
  const [serieItemId, setSerieItemId] = useState<number | null>(null);

  const telephoneTimerRef = useRef<NodeJS.Timeout | null>(null);
  const modeleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const puissanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const couleurTimerRef = useRef<NodeJS.Timeout | null>(null);
  const marqueTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Calcul des montants avec le taux
  const montantDollars = utilisateur?.formule || "32";
  const montantFrancs = tauxActif
    ? (parseFloat(montantDollars) * tauxActif.valeur).toLocaleString("fr-FR")
    : "Calcul en cours...";

  const montantAPayer = `${montantDollars} $`;
  const montantEnFrancs = `${montantFrancs} CDF`;

  // Générer les options d'années
  const anneeOptions = Array.from({ length: 30 }, (_, i) =>
    (2026 - i).toString(),
  );

  // Chargement des données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingTaux(true);
        const tauxResponse = await getTauxActif({
          province_id: null,
          impot_id: Number(impotId),
        });
        if (tauxResponse.status === "success" && tauxResponse.data) {
          setTauxActif(tauxResponse.data);
        }

        setLoading((prev) => ({ ...prev, typeEngins: true }));
        const typeEnginsResponse = await getTypeEnginsActifs();
        if (typeEnginsResponse.status === "success") {
          setTypeEngins(typeEnginsResponse.data || []);
        }

        setLoading((prev) => ({ ...prev, energies: true }));
        const energiesResponse = await getEnergiesActives();
        if (energiesResponse.status === "success") {
          setEnergies(energiesResponse.data || []);
        }

        setLoading((prev) => ({ ...prev, couleurs: true }));
        const couleursResponse = await getCouleursActives();
        if (couleursResponse.status === "success") {
          setCouleurs(couleursResponse.data || []);
        }

        setLoading((prev) => ({ ...prev, usages: true }));
        const usagesResponse = await getUsagesActifs();
        if (usagesResponse.status === "success") {
          setUsages(usagesResponse.data || []);
        }

        setLoading((prev) => ({ ...prev, puissances: true }));
        const puissancesResponse = await getPuissancesFiscalesActives();
        if (puissancesResponse.status === "success") {
          setPuissancesFiscales(puissancesResponse.data || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading({
          typeEngins: false,
          energies: false,
          couleurs: false,
          usages: false,
          puissances: false,
        });
        setLoadingTaux(false);
      }
    };

    loadInitialData();
  }, []);

  // Réinitialiser l'année de circulation si l'année de fabrication change
  useEffect(() => {
    if (formData.anneeFabrication && formData.anneeCirculation) {
      const anneeFab = parseInt(formData.anneeFabrication);
      const anneeCirc = parseInt(formData.anneeCirculation);

      if (anneeCirc < anneeFab) {
        setFormData((prev) => ({ ...prev, anneeCirculation: "" }));
      }
    }
  }, [formData.anneeFabrication]);

  // Recherche automatique des plaques quand le numéro de plaque change
  useEffect(() => {
    const searchPlaques = async () => {
      if (formData.numeroPlaque.length >= 2) {
        setIsSearchingPlaques(true);
        try {
          const response = await rechercherPlaques(
            formData.numeroPlaque,
            utilisateur,
          );
          if (response.status === "success") {
            setPlaquesSuggestions(response.data || []);
            setShowPlaquesSuggestions(true);

            const plaqueExacte = response.data?.find(
              (plaque: PlaqueResult) =>
                plaque.numero_plaque === formData.numeroPlaque,
            );
            setPlaqueDisponible(
              plaqueExacte ? plaqueExacte.statut === "0" : false,
            );
          }
        } catch (error) {
          console.error("Erreur lors de la recherche des plaques:", error);
        } finally {
          setIsSearchingPlaques(false);
        }
      } else {
        setPlaquesSuggestions([]);
        setShowPlaquesSuggestions(false);
        setPlaqueDisponible(null);
      }
    };

    const timeoutId = setTimeout(searchPlaques, 300);
    return () => clearTimeout(timeoutId);
  }, [formData.numeroPlaque, utilisateur]);

  // Recherche automatique du particulier quand le téléphone change
  useEffect(() => {
    if (telephoneTimerRef.current) {
      clearTimeout(telephoneTimerRef.current);
    }

    if (
      formData.telephone &&
      formData.telephone.trim() !== "" &&
      formData.telephone.trim() !== "-"
    ) {
      telephoneTimerRef.current = setTimeout(async () => {
        try {
          const response = await verifierParticulierParTelephone(
            formData.telephone.trim(),
          );
          if (response.status === "success" && response.data) {
            const particulier = response.data;
            if (
              particulier &&
              typeof particulier === "object" &&
              !Array.isArray(particulier)
            ) {
              setFormData((prev) => ({
                ...prev,
                nom: (particulier as any).nom || prev.nom,
                prenom: (particulier as any).prenom || prev.prenom,
                email: (particulier as any).email || prev.email,
                adresse: (particulier as any).adresse || prev.adresse,
                nif: (particulier as any).nif || prev.nif,
                reduction_type:
                  (particulier as any).reduction_type || prev.reduction_type,
                reduction_valeur:
                  (particulier as any).reduction_valeur?.toString() ||
                  prev.reduction_valeur,
              }));
            }
          }
        } catch (error) {
          console.error("Erreur lors de la recherche du particulier:", error);
        }
      }, 500);
    }

    return () => {
      if (telephoneTimerRef.current) {
        clearTimeout(telephoneTimerRef.current);
      }
    };
  }, [formData.telephone]);

  // Recherche automatique des marques quand le champ marque change
  useEffect(() => {
    if (marqueTimerRef.current) {
      clearTimeout(marqueTimerRef.current);
    }

    if (formData.marque.length >= 2 && formData.typeEngin) {
      marqueTimerRef.current = setTimeout(async () => {
        setIsSearchingMarques(true);
        try {
          const response = await rechercherMarques(
            formData.typeEngin,
            formData.marque,
          );
          if (response.status === "success") {
            const data = response.data;
            if (Array.isArray(data)) {
              setMarquesSuggestions(data);
            } else {
              setMarquesSuggestions([]);
            }
            setShowMarquesSuggestions(true);
          }
        } catch (error) {
          console.error("Erreur lors de la recherche des marques:", error);
          setMarquesSuggestions([]);
        } finally {
          setIsSearchingMarques(false);
        }
      }, 300);
    } else {
      setMarquesSuggestions([]);
      setShowMarquesSuggestions(false);
      setSelectedMarqueId(null);
    }

    return () => {
      if (marqueTimerRef.current) {
        clearTimeout(marqueTimerRef.current);
      }
    };
  }, [formData.marque, formData.typeEngin]);

  // Recherche automatique des modèles quand le modèle change
  useEffect(() => {
    if (modeleTimerRef.current) {
      clearTimeout(modeleTimerRef.current);
    }

    if (formData.modele.length >= 2 && selectedMarqueId) {
      modeleTimerRef.current = setTimeout(async () => {
        setIsSearchingModeles(true);
        try {
          const response = await rechercherModeles(
            selectedMarqueId,
            formData.modele,
          );
          if (response.status === "success") {
            const data = response.data;
            if (Array.isArray(data)) {
              setModelesSuggestions(data);
            } else {
              setModelesSuggestions([]);
            }
            setShowModelesSuggestions(true);
          }
        } catch (error) {
          console.error("Erreur lors de la recherche des modèles:", error);
          setModelesSuggestions([]);
        } finally {
          setIsSearchingModeles(false);
        }
      }, 300);
    } else {
      setModelesSuggestions([]);
      setShowModelesSuggestions(false);
    }

    return () => {
      if (modeleTimerRef.current) {
        clearTimeout(modeleTimerRef.current);
      }
    };
  }, [formData.modele, selectedMarqueId]);

  // Recherche automatique des puissances quand la puissance change
  useEffect(() => {
    if (puissanceTimerRef.current) {
      clearTimeout(puissanceTimerRef.current);
    }

    if (formData.puissanceFiscal.length >= 1 && formData.typeEngin) {
      puissanceTimerRef.current = setTimeout(async () => {
        setIsSearchingPuissances(true);
        try {
          const response = await rechercherPuissances(
            formData.typeEngin,
            formData.puissanceFiscal,
          );
          if (response.status === "success") {
            const data = response.data;
            if (Array.isArray(data)) {
              setPuissancesSuggestions(data);
            } else {
              setPuissancesSuggestions([]);
            }
            setShowPuissancesSuggestions(true);
          }
        } catch (error) {
          console.error("Erreur lors de la recherche des puissances:", error);
          setPuissancesSuggestions([]);
        } finally {
          setIsSearchingPuissances(false);
        }
      }, 300);
    } else {
      setPuissancesSuggestions([]);
      setShowPuissancesSuggestions(false);
    }

    return () => {
      if (puissanceTimerRef.current) {
        clearTimeout(puissanceTimerRef.current);
      }
    };
  }, [formData.puissanceFiscal, formData.typeEngin]);

  // Recherche automatique des couleurs
  useEffect(() => {
    if (couleurTimerRef.current) {
      clearTimeout(couleurTimerRef.current);
    }

    if (formData.couleur.length >= 2 && !showAddCouleurForm) {
      couleurTimerRef.current = setTimeout(async () => {
        setIsSearchingCouleurs(true);
        try {
          const response = await rechercherCouleur(formData.couleur);
          if (response.status === "success") {
            const data = response.data;
            if (Array.isArray(data) && data.length > 0) {
              setCouleursSuggestions(data);
              setShowCouleursSuggestions(true);
              setShowAddCouleurForm(false);
            } else {
              setCouleursSuggestions([]);
              setShowCouleursSuggestions(false);
              // Si aucune couleur n'est trouvée et le texte est assez long, montrer le formulaire d'ajout
              if (formData.couleur.length >= 3) {
                setNouvelleCouleurNom(formData.couleur);
                setShowAddCouleurForm(true);
              }
            }
          }
        } catch (error) {
          console.error("Erreur lors de la recherche des couleurs:", error);
          setCouleursSuggestions([]);
          setShowCouleursSuggestions(false);
        } finally {
          setIsSearchingCouleurs(false);
        }
      }, 300);
    } else {
      setCouleursSuggestions([]);
      setShowCouleursSuggestions(false);
      if (formData.couleur.length < 2) {
        setShowAddCouleurForm(false);
      }
    }

    return () => {
      if (couleurTimerRef.current) {
        clearTimeout(couleurTimerRef.current);
      }
    };
  }, [formData.couleur, showAddCouleurForm]);

  // Récupérer automatiquement une plaque disponible au chargement
  useEffect(() => {
    const getPlaqueAutomatique = async () => {
      if (utilisateur && !formData.numeroPlaque) {
        try {
          const response = await getNumeroPlaqueDisponible(utilisateur);
          if (
            response.status === "success" &&
            response.data &&
            (response.data as any).numeroPlaque
          ) {
            setFormData((prev) => ({
              ...prev,
              numeroPlaque: (response.data as any).numeroPlaque,
            }));
            setSerieItemId((response.data as any).serie_item_id || null);
            setPlaqueDisponible(true);
          }
        } catch (error) {
          console.error(
            "Erreur lors de la récupération automatique de plaque:",
            error,
          );
        }
      }
    };

    getPlaqueAutomatique();
  }, [utilisateur]);

  const genererNIF = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return ``;
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
      modele: "",
      energie: "",
      numeroChassis: "",
      numeroMoteur: "",
      numeroPlaque: "",
      reduction_type: "",
      reduction_valeur: "",
    });
    setErrors({});
    setPlaqueDisponible(null);
    setSerieItemId(null);
    setShowPrint(false);
    setShowSuccess(false);
    setShowAnnulation(false);
    setSelectedMarqueId(null);
    setMarquesSuggestions([]);
    setModelesSuggestions([]);
    setPuissancesSuggestions([]);
    setCouleursSuggestions([]);
    setShowCouleursSuggestions(false);
    setSelectedCouleur(null);
    setShowAddCouleurForm(false);
    setNouvelleCouleurNom("");
    setNouvelleCouleurCode("#000000");
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "typeEngin") {
      // Réinitialiser les champs dépendants quand le type d'engin change
      setFormData((prev) => ({
        ...prev,
        marque: "",
        modele: "",
        puissanceFiscal: "",
      }));
      setSelectedMarqueId(null);
      setMarquesSuggestions([]);
      setShowMarquesSuggestions(false);
      setModelesSuggestions([]);
      setShowModelesSuggestions(false);
    }

    if (field === "couleur") {
      // Réinitialiser la couleur sélectionnée quand on change le texte
      setSelectedCouleur(null);
      if (value.length >= 3) {
        // Vérifier si la couleur existe déjà dans la liste initiale
        const couleurExistante = couleurs.find(
          (c) => c.nom.toLowerCase() === value.toLowerCase(),
        );
        if (couleurExistante) {
          setSelectedCouleur(couleurExistante);
          setShowAddCouleurForm(false);
        } else {
          setNouvelleCouleurNom(value);
        }
      } else {
        setShowAddCouleurForm(false);
      }
    }

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handlePlaqueSelect = (plaque: PlaqueResult) => {
    if (plaque.statut === "0") {
      setFormData((prev) => ({ ...prev, numeroPlaque: plaque.numero_plaque }));
      setSerieItemId(plaque.serie_item_id);
      setPlaqueDisponible(true);
    } else {
      setPlaqueDisponible(false);
    }
    setShowPlaquesSuggestions(false);
  };

  const handleMarqueSelect = (marque: MarqueEngin) => {
    setFormData((prev) => ({ ...prev, marque: marque.libelle }));
    setSelectedMarqueId(marque.id);
    setShowMarquesSuggestions(false);

    // Réinitialiser le modèle quand on change de marque
    setFormData((prev) => ({ ...prev, modele: "" }));
    setModelesSuggestions([]);
    setShowModelesSuggestions(false);
  };

  const handleModeleSelect = (modele: any) => {
    setFormData((prev) => ({ ...prev, modele: modele.libelle }));
    setShowModelesSuggestions(false);
  };

  const handlePuissanceSelect = (puissance: any) => {
    setFormData((prev) => ({ ...prev, puissanceFiscal: puissance.libelle }));
    setShowPuissancesSuggestions(false);
  };

  const handleCouleurSelect = (couleur: EnginCouleur) => {
    setFormData((prev) => ({ ...prev, couleur: couleur.nom }));
    setSelectedCouleur(couleur);
    setShowCouleursSuggestions(false);
    setShowAddCouleurForm(false);
  };

  const handleAjouterCouleur = async () => {
    if (!nouvelleCouleurNom.trim()) {
      alert("Veuillez saisir un nom pour la couleur");
      return;
    }

    setIsAddingCouleur(true);
    try {
      const response = await ajouterCouleur(
        nouvelleCouleurNom,
        nouvelleCouleurCode,
      );
      if (response.status === "success") {
        // Recharger la liste des couleurs
        const couleursResponse = await getCouleursActives();
        if (couleursResponse.status === "success") {
          setCouleurs(couleursResponse.data || []);
        }

        // Sélectionner la nouvelle couleur
        setFormData((prev) => ({ ...prev, couleur: nouvelleCouleurNom }));

        // Créer un objet couleur temporaire pour la sélection avec toutes les propriétés requises
        const nouvelleCouleur: EnginCouleur = {
          id: Date.now(), // ID temporaire
          nom: nouvelleCouleurNom,
          code_hex: nouvelleCouleurCode,
          actif: true, // Ajout de la propriété actif (probablement 1 pour actif, 0 pour inactif)
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          statut: "actif",
        };

        setSelectedCouleur(nouvelleCouleur);
        setShowAddCouleurForm(false);
        setNouvelleCouleurNom("");
        setNouvelleCouleurCode("#000000");

        alert("Couleur ajoutée avec succès !");
      } else {
        alert(response.message || "Erreur lors de l'ajout de la couleur");
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de la couleur:", error);
      alert("Erreur réseau lors de l'ajout de la couleur");
    } finally {
      setIsAddingCouleur(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.nom.trim()) newErrors.nom = "Le nom est obligatoire";
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est obligatoire";
    if (!formData.adresse.trim())
      newErrors.adresse = "L'adresse est obligatoire";
    if (!formData.typeEngin)
      newErrors.typeEngin = "Le type d'engin est obligatoire";
    if (!formData.marque) newErrors.marque = "La marque est obligatoire";
    if (!formData.numeroPlaque.trim())
      newErrors.numeroPlaque = "Le numéro de plaque est obligatoire";

    if (
      formData.telephone &&
      formData.telephone.trim() !== "" &&
      formData.telephone.trim() !== "-"
    ) {
      const phoneRegex = /^[0-9+\-\s()]{8,}$/;
      if (!phoneRegex.test(formData.telephone.replace(/\s/g, ""))) {
        newErrors.telephone = "Format de téléphone invalide";
      }
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    if (formData.anneeFabrication && formData.anneeCirculation) {
      const anneeFab = parseInt(formData.anneeFabrication);
      const anneeCirc = parseInt(formData.anneeCirculation);

      if (anneeCirc < anneeFab) {
        newErrors.anneeCirculation =
          "L'année de circulation ne peut pas être antérieure à l'année de fabrication";
      }
    }

    if (formData.reduction_type && formData.reduction_valeur) {
      const valeur = parseFloat(formData.reduction_valeur);
      if (isNaN(valeur) || valeur < 0) {
        newErrors.reduction_valeur =
          "La valeur de réduction doit être un nombre positif";
      }
      if (formData.reduction_type === "pourcentage" && valeur > 100) {
        newErrors.reduction_valeur = "Le pourcentage ne peut pas dépasser 100%";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (plaqueDisponible === false) {
      alert(
        "La plaque sélectionnée n'est pas disponible. Veuillez choisir une autre plaque.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const nif = formData.nif || genererNIF();
      setFormData((prev) => ({ ...prev, nif }));

      setShowConfirmation(true);
    } catch (error) {
      console.error("Erreur lors de la préparation de la demande:", error);
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
    if (!utilisateur) {
      alert("Erreur: Données manquantes pour le traitement");
      return;
    }

    setIsSubmitting(true);

    try {
      const particulierData: ParticulierData = {
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone || "-",
        email: formData.email,
        adresse: formData.adresse,
        nif: formData.nif,
        reduction_type: formData.reduction_type || undefined,
        reduction_valeur: formData.reduction_valeur
          ? parseFloat(formData.reduction_valeur)
          : undefined,
      };

      const enginData: EnginData = {
        typeEngin: formData.typeEngin,
        marque: formData.marque,
        modele: formData.modele,
        energie: formData.energie,
        anneeFabrication: formData.anneeFabrication,
        anneeCirculation: formData.anneeCirculation,
        couleur: formData.couleur,
        puissanceFiscal: formData.puissanceFiscal,
        usage: formData.usage,
        numeroChassis: formData.numeroChassis,
        numeroMoteur: formData.numeroMoteur,
      };

      const dataWithSerieItem = {
        ...paiementData,
        serie_item_id: serieItemId,
      };

      const response = await soumettreImmatriculation(
        impotId,
        particulierData,
        enginData,
        dataWithSerieItem,
        utilisateur,
      );

      if (response.status === "success" && response.data) {
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
          modele: formData.modele,
          nom: formData.nom,
          prenom: formData.prenom,
          adresse: formData.adresse,
          telephone: formData.telephone || "-",
          montant_francs: montantEnFrancs,
          paiement_id: (response.data as any).paiement_id.toString(),
          reduction_type: formData.reduction_type,
          reduction_valeur: formData.reduction_valeur,
        };

        setSuccessData(completeData);
        setPrintData(completeData);
        setShowPaiement(false);
        setShowSuccess(true);
      } else {
        alert(
          "Erreur: " + (response.message || "Données de réponse manquantes"),
        );
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
    router.back();
  };

  const handleAnnulation = async (raison: string) => {
    if (!successData?.paiement_id || !utilisateur?.id) {
      alert("Données manquantes pour l'annulation");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await annulerImmatriculation(
        parseInt(successData.paiement_id),
        utilisateur.id,
        raison,
      );

      if (response.status === "success") {
        alert("Immatriculation annulée avec succès !");
        setShowAnnulation(false);
        setShowSuccess(false);
        resetForm();
      } else {
        alert(response.message || "Erreur lors de l'annulation");
      }
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      alert("Erreur réseau lors de l'annulation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAnneesCirculationDisponibles = () => {
    if (!formData.anneeFabrication) {
      return anneeOptions;
    }
    const anneeFab = parseInt(formData.anneeFabrication);
    return anneeOptions.filter((year) => parseInt(year) >= anneeFab);
  };

  const isSubmitDisabled = isSubmitting || plaqueDisponible === false;

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
            {/* Téléphone */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => handleInputChange("telephone", e.target.value)}
                placeholder="Ex: +243 00 00 00 000 (facultatif)"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.telephone
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-blue-500"
                }`}
              />
              {errors.telephone && (
                <p className="text-red-600 text-sm mt-2 font-medium">
                  {errors.telephone}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Facultatif. Les informations seront automatiquement remplies si
                le client existe déjà
              </p>
            </div>

            {/* Nom */}
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
                  errors.nom
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-blue-500"
                }`}
              />
              {errors.nom && (
                <p className="text-red-600 text-sm mt-2 font-medium">
                  {errors.nom}
                </p>
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
                  errors.prenom
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-blue-500"
                }`}
              />
              {errors.prenom && (
                <p className="text-red-600 text-sm mt-2 font-medium">
                  {errors.prenom}
                </p>
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
                  errors.email
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-blue-500"
                }`}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-2 font-medium">
                  {errors.email}
                </p>
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
                  errors.adresse
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-blue-500"
                }`}
              />
              {errors.adresse && (
                <p className="text-red-600 text-sm mt-2 font-medium">
                  {errors.adresse}
                </p>
              )}
            </div>

            {/* Champ Réduction */}
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Type de réduction
                  </label>
                  <select
                    value={formData.reduction_type}
                    onChange={(e) =>
                      handleInputChange("reduction_type", e.target.value as any)
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Aucune réduction</option>
                    <option value="pourcentage">Pourcentage</option>
                    <option value="montant_fixe">Montant fixe</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Valeur de réduction
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    max={
                      formData.reduction_type === "pourcentage"
                        ? "100"
                        : undefined
                    }
                    value={formData.reduction_valeur}
                    onChange={(e) =>
                      handleInputChange("reduction_valeur", e.target.value)
                    }
                    placeholder={
                      formData.reduction_type === "pourcentage"
                        ? "Ex: 10.5000"
                        : "Ex: 5.0000"
                    }
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.reduction_valeur
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-blue-500"
                    }`}
                    disabled={!formData.reduction_type}
                  />
                  {errors.reduction_valeur && (
                    <p className="text-red-600 text-sm mt-2 font-medium">
                      {errors.reduction_valeur}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.reduction_type === "pourcentage"
                      ? "Maximum 4 chiffres après la virgule (ex: 15.7500)"
                      : "Montant fixe en dollars (ex: 5.0000)"}
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Numéro d'Identification Fiscale (NIF)
              </label>
              <input
                type="text"
                value={
                  formData.nif || "Généré automatiquement après validation"
                }
                readOnly
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500"
              />
              <p className="text-sm text-gray-500 mt-2">
                Le NIF sera généré automatiquement lors de la validation du
                formulaire
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
            {/* Type d'engin */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Type d'engin <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.typeEngin}
                  onChange={(e) =>
                    handleInputChange("typeEngin", e.target.value)
                  }
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.typeEngin
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-blue-500"
                  }`}
                  disabled={loading.typeEngins}
                >
                  <option value="">Sélectionner le type d'engin</option>
                  {typeEngins.map((typeEngin) => (
                    <option key={typeEngin.id} value={typeEngin.libelle}>
                      {typeEngin.libelle}
                    </option>
                  ))}
                </select>
                {loading.typeEngins && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              {errors.typeEngin && (
                <p className="text-red-600 text-sm mt-2 font-medium">
                  {errors.typeEngin}
                </p>
              )}
            </div>

            {/* Marque */}
            {formData.typeEngin && (
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Marque <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.marque}
                    onChange={(e) =>
                      handleInputChange("marque", e.target.value)
                    }
                    placeholder="Saisissez la marque (auto-complétion)"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-10 ${
                      errors.marque
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-blue-500"
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isSearchingMarques ? (
                      <Loader className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <Search className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {showMarquesSuggestions && marquesSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {marquesSuggestions.map((marque) => (
                      <div
                        key={marque.id}
                        onClick={() => handleMarqueSelect(marque)}
                        className="p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors text-gray-800"
                      >
                        <div className="font-medium">{marque.libelle}</div>
                        {marque.description && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {marque.description}
                          </p>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Type: {marque.type_engin_libelle}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showMarquesSuggestions &&
                  marquesSuggestions.length === 0 &&
                  formData.marque.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm text-gray-600">
                      Aucune marque trouvée. La marque sera créée
                      automatiquement lors de la soumission.
                    </div>
                  )}
                {errors.marque && (
                  <p className="text-red-600 text-sm mt-2 font-medium">
                    {errors.marque}
                  </p>
                )}
              </div>
            )}

            {/* Modèle */}
            {formData.marque && selectedMarqueId && (
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Modèle
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.modele}
                    onChange={(e) =>
                      handleInputChange("modele", e.target.value)
                    }
                    placeholder="Saisissez le modèle (auto-complétion)"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-10"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isSearchingModeles ? (
                      <Loader className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <Search className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {showModelesSuggestions && modelesSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {modelesSuggestions.map((modele) => (
                      <div
                        key={modele.id}
                        onClick={() => handleModeleSelect(modele)}
                        className="p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors text-gray-800"
                      >
                        <div className="font-medium">{modele.libelle}</div>
                        {modele.description && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {modele.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {showModelesSuggestions &&
                  modelesSuggestions.length === 0 &&
                  formData.modele.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm text-gray-600">
                      Aucun modèle trouvé. Le modèle sera créé automatiquement
                      lors de la soumission.
                    </div>
                  )}
              </div>
            )}

            {/* Puissance fiscale */}
            {formData.typeEngin && (
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Puissance fiscale
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.puissanceFiscal}
                    onChange={(e) =>
                      handleInputChange("puissanceFiscal", e.target.value)
                    }
                    placeholder="Ex: 8CV, 10CV (auto-complétion)"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-10"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isSearchingPuissances ? (
                      <Loader className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <Search className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {showPuissancesSuggestions &&
                  puissancesSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {puissancesSuggestions.map((puissance) => (
                        <div
                          key={puissance.id}
                          onClick={() => handlePuissanceSelect(puissance)}
                          className="p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors text-gray-800"
                        >
                          <div className="font-medium">{puissance.libelle}</div>
                          <div className="text-xs text-gray-500">
                            {puissance.valeur} CV -{" "}
                            {puissance.type_engin_libelle}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                {showPuissancesSuggestions &&
                  puissancesSuggestions.length === 0 &&
                  formData.puissanceFiscal.length >= 1 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm text-gray-600">
                      Aucune puissance trouvée. La puissance sera créée
                      automatiquement lors de la soumission.
                    </div>
                  )}
              </div>
            )}

            {/* Numéro de plaque */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Numéro de plaque <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.numeroPlaque}
                  onChange={(e) =>
                    handleInputChange("numeroPlaque", e.target.value)
                  }
                  placeholder="Rechercher ou saisir un numéro de plaque"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-10 ${
                    errors.numeroPlaque
                      ? "border-red-300 focus:border-red-500"
                      : plaqueDisponible === false
                        ? "border-red-300 focus:border-red-500"
                        : plaqueDisponible === true
                          ? "border-green-300 focus:border-green-500"
                          : "border-gray-200 focus:border-blue-500"
                  }`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isSearchingPlaques ? (
                    <Loader className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    <Search className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {formData.numeroPlaque && plaqueDisponible !== null && (
                <p
                  className={`text-sm mt-2 font-medium ${
                    plaqueDisponible ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {plaqueDisponible
                    ? "✓ Cette plaque est disponible"
                    : "✗ Cette plaque n'est pas disponible"}
                </p>
              )}

              {errors.numeroPlaque && (
                <p className="text-red-600 text-sm mt-2 font-medium">
                  {errors.numeroPlaque}
                </p>
              )}

              {showPlaquesSuggestions && plaquesSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {plaquesSuggestions.map((plaque) => (
                    <div
                      key={plaque.serie_item_id}
                      onClick={() => handlePlaqueSelect(plaque)}
                      className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                        plaque.statut === "1"
                          ? "text-gray-400 bg-gray-50"
                          : "text-gray-800"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span
                          className={`font-medium ${
                            plaque.statut === "1" ? "line-through" : ""
                          }`}
                        >
                          {plaque.numero_plaque}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            plaque.statut === "0"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {plaque.statut === "0" ? "Disponible" : "Utilisée"}
                        </span>
                      </div>
                      {plaque.statut === "1" && (
                        <p className="text-xs text-gray-500 mt-1">
                          Déjà attribuée
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Énergie */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Énergie
              </label>
              <div className="relative">
                <select
                  value={formData.energie}
                  onChange={(e) => handleInputChange("energie", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  disabled={loading.energies}
                >
                  <option value="">Sélectionner l'énergie</option>
                  {energies.map((energie) => (
                    <option key={energie.id} value={energie.nom}>
                      {energie.nom}
                    </option>
                  ))}
                </select>
                {loading.energies && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Année de fabrication */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Année de fabrication
              </label>
              <select
                value={formData.anneeFabrication}
                onChange={(e) =>
                  handleInputChange("anneeFabrication", e.target.value)
                }
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

            {/* Année de circulation */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Année de circulation
              </label>
              <select
                value={formData.anneeCirculation}
                onChange={(e) =>
                  handleInputChange("anneeCirculation", e.target.value)
                }
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.anneeCirculation
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-blue-500"
                }`}
                disabled={!formData.anneeFabrication}
              >
                <option value="">
                  {!formData.anneeFabrication
                    ? "Sélectionnez d'abord l'année de fabrication"
                    : "Sélectionner l'année"}
                </option>
                {getAnneesCirculationDisponibles().map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.anneeCirculation && (
                <p className="text-red-600 text-sm mt-2 font-medium">
                  {errors.anneeCirculation}
                </p>
              )}
              {formData.anneeFabrication && (
                <p className="text-blue-600 text-xs mt-2">
                  Années disponibles à partir de {formData.anneeFabrication}
                </p>
              )}
            </div>

            {/* Couleur - AUTOCOMPLÉTION */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Couleur
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.couleur}
                  onChange={(e) => handleInputChange("couleur", e.target.value)}
                  placeholder="Saisissez la couleur (auto-complétion)"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-10"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isSearchingCouleurs ? (
                    <Loader className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    <Search className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Suggestions de couleurs */}
              {showCouleursSuggestions && couleursSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {couleursSuggestions.map((couleur) => (
                    <div
                      key={couleur.id}
                      onClick={() => handleCouleurSelect(couleur)}
                      className="p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors text-gray-800"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: couleur.code_hex }}
                        />
                        <div>
                          <div className="font-medium">{couleur.nom}</div>
                          <div className="text-xs text-gray-500">
                            {couleur.code_hex}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulaire d'ajout de couleur */}
              {showAddCouleurForm && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
                  <div className="text-sm text-gray-600 mb-3">
                    Cette couleur n'existe pas encore. Voulez-vous l'ajouter ?
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={nouvelleCouleurNom}
                      onChange={(e) => setNouvelleCouleurNom(e.target.value)}
                      placeholder="Nom de la couleur"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={nouvelleCouleurCode}
                        onChange={(e) => setNouvelleCouleurCode(e.target.value)}
                        className="w-10 h-10 cursor-pointer"
                      />
                      <span className="text-sm text-gray-600">
                        {nouvelleCouleurCode}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCouleurForm(false);
                          setNouvelleCouleurNom("");
                          setNouvelleCouleurCode("#000000");
                        }}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleAjouterCouleur}
                        disabled={isAddingCouleur || !nouvelleCouleurNom.trim()}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
                      >
                        {isAddingCouleur ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        <span>Ajouter</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Aperçu de la couleur sélectionnée */}
              {selectedCouleur && (
                <div className="mt-2 flex items-center space-x-2 text-sm">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: selectedCouleur.code_hex }}
                  />
                  <span className="text-gray-600">
                    {selectedCouleur.nom} ({selectedCouleur.code_hex})
                  </span>
                </div>
              )}
            </div>

            {/* Usage */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Usage
              </label>
              <div className="relative">
                <select
                  value={formData.usage}
                  onChange={(e) => handleInputChange("usage", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  disabled={loading.usages}
                >
                  <option value="">Sélectionner l'usage</option>
                  {usages.map((usage) => (
                    <option key={usage.id} value={usage.libelle}>
                      {usage.libelle}
                    </option>
                  ))}
                </select>
                {loading.usages && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Numéro de châssis */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Numéro de châssis
              </label>
              <input
                type="text"
                value={formData.numeroChassis}
                onChange={(e) =>
                  handleInputChange("numeroChassis", e.target.value)
                }
                placeholder="Entrez le numéro de châssis"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Numéro de moteur */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Numéro de moteur
              </label>
              <input
                type="text"
                value={formData.numeroMoteur}
                onChange={(e) =>
                  handleInputChange("numeroMoteur", e.target.value)
                }
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
              <div className="text-sm text-blue-600 font-medium">
                Montant à payer
              </div>
              <div className="text-3xl font-bold text-blue-800">
                {montantAPayer}
              </div>
              <div className="text-lg font-semibold text-blue-700 mt-2">
                {montantEnFrancs}
              </div>
              {tauxActif && (
                <div className="text-sm text-blue-500 mt-2">
                  Taux: 1$ = {tauxActif.valeur.toLocaleString("fr-FR")} CDF
                </div>
              )}
              {formData.reduction_type && formData.reduction_valeur && (
                <div className="text-sm text-green-600 mt-2 font-medium">
                  Réduction appliquée:{" "}
                  {formData.reduction_type === "pourcentage"
                    ? `${formData.reduction_valeur}%`
                    : `${formData.reduction_valeur} $`}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-600 font-medium">
                Délai d'accord
              </div>
              <div className="text-xl font-bold text-green-600">Immédiat</div>
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
              disabled={isSubmitDisabled}
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
        montantEnFrancs={montantEnFrancs}
        numeroPlaque={formData.numeroPlaque}
        isLoading={isSubmitting}
      />

      <PaiementModal
        isOpen={showPaiement}
        onClose={() => setShowPaiement(false)}
        onPaiement={handlePaiement}
        montant={montantAPayer}
        montantEnFrancs={montantEnFrancs}
        isLoading={isSubmitting}
      />

      <SuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        onPrint={handlePrint}
        data={successData}
      />

      <AnnulationModal
        isOpen={showAnnulation}
        onClose={() => setShowAnnulation(false)}
        onConfirm={handleAnnulation}
        isLoading={isSubmitting}
        numeroPlaque={successData?.numero_plaque || ""}
        paiementId={parseInt(successData?.paiement_id) || 0}
      />

      <ImmatriculationPrint
        data={printData}
        isOpen={showPrint}
        onClose={handlePrintClose}
      />
    </>
  );
}
