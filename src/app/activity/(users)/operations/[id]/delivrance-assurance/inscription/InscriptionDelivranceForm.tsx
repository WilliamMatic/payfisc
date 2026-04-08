"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  User,
  Car,
  Loader,
  CheckCircle,
  X,
  Search,
  Plus,
  AlertCircle,
  Info,
  ArrowLeft,
  DollarSign,
  Ticket,
  Copy,
  Printer,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  inscrireAssujetti,
  enregistrerPaiementAssurance,
} from "@/services/assurance-moto/assuranceMotoService";
import { getImpotById } from "@/services/impots/impotService";
import { getTauxActif } from "@/services/taux/tauxService";
import {
  rechercherModeles,
  creerModele,
  rechercherPuissancesFiscales,
  creerPuissanceFiscale,
  verifierTelephoneExistant,
} from "@/services/carte-rose/carteRoseService";
import { ajouterCouleur } from "@/services/immatriculation/immatriculationService";
import {
  getTypeEnginsActifs,
  type TypeEngin,
} from "@/services/type-engins/typeEnginService";
import { getEnergies, type Energie } from "@/services/energies/energieService";
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

// ─── Interfaces ───

interface FormData {
  telephone: string;
  nom: string;
  prenom: string;
  email: string;
  adresse: string;
  ville: string;
  nif: string;
  typeEngin: string;
  anneeFabrication: string;
  anneeCirculation: string;
  couleur: string;
  puissanceFiscal: string;
  puissanceFiscalValeur: string;
  usage: string;
  marque: string;
  marqueId: string;
  modele: string;
  modeleId: string;
  energie: string;
  numeroChassis: string;
  numeroMoteur: string;
}

interface InscriptionDelivranceFormProps {
  plaque: string;
  reference: string;
  operationId: string;
}

// ─── Modal Ajout Couleur ───

interface AddCouleurModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (nom: string, codeHex: string) => Promise<void>;
  defaultNom?: string;
}

const AddCouleurModal: React.FC<AddCouleurModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  defaultNom = "",
}) => {
  const [nom, setNom] = useState("");
  const [codeHex, setCodeHex] = useState("#000000");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNom(defaultNom);
      setCodeHex("#000000");
    }
  }, [isOpen, defaultNom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;
    setIsSubmitting(true);
    try {
      await onAdd(nom, codeHex);
      setNom("");
      setCodeHex("#000000");
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'ajout de la couleur:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Ajouter une nouvelle couleur
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Nom de la couleur <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Rouge vif, Bleu nuit..."
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Code couleur <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="color"
                value={codeHex}
                onChange={(e) => setCodeHex(e.target.value)}
                className="w-12 h-12 cursor-pointer rounded-lg border border-gray-300"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={codeHex}
                  onChange={(e) => setCodeHex(e.target.value)}
                  placeholder="#000000"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  title="Code hexadécimal (ex: #FF0000)"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Code hexadécimal (ex: #FF0000 pour rouge)
                </p>
              </div>
            </div>
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 font-semibold"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !nom.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Ajout...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter la couleur
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Modal Messages ───

interface MessageModalProps {
  isOpen: boolean;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  onClose: () => void;
  onAction?: () => void;
  actionText?: string;
  showAction?: boolean;
}

const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  type,
  title,
  message,
  onClose,
  onAction,
  actionText = "OK",
  showAction = true,
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    success: {
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-800",
      iconColor: "text-green-600",
      icon: CheckCircle,
    },
    error: {
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-800",
      iconColor: "text-red-600",
      icon: AlertCircle,
    },
    warning: {
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-800",
      iconColor: "text-yellow-600",
      icon: AlertCircle,
    },
    info: {
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
      iconColor: "text-blue-600",
      icon: Info,
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
        <div className="flex items-start space-x-4 mb-6">
          <div className={`p-2 rounded-full ${config.bgColor}`}>
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${config.textColor} mb-2`}>
              {title}
            </h3>
            <div className={`text-sm ${config.textColor}`}>
              {message.split("\n").map((line, idx) => (
                <p key={idx} className="mb-1">
                  {line}
                </p>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex justify-end space-x-3">
          {showAction && onAction && (
            <button
              onClick={onAction}
              className={`px-6 py-2 rounded-lg font-medium ${
                type === "success"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : type === "error"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : type === "warning"
                      ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
              } transition-colors`}
            >
              {actionText}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Composant principal ───

export default function InscriptionDelivranceForm({
  plaque,
  reference,
  operationId,
}: InscriptionDelivranceFormProps) {
  const router = useRouter();
  const { utilisateur } = useAuth();

  // ─── Form data ───
  const [formData, setFormData] = useState<FormData>({
    telephone: "",
    nom: "",
    prenom: "",
    email: "",
    adresse: "",
    ville: "",
    nif: "",
    typeEngin: "",
    anneeFabrication: "",
    anneeCirculation: "",
    couleur: "",
    puissanceFiscal: "",
    puissanceFiscalValeur: "",
    usage: "",
    marque: "",
    marqueId: "",
    modele: "",
    modeleId: "",
    energie: "",
    numeroChassis: "",
    numeroMoteur: "",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  // ─── Données de référence ───
  const [typeEngins, setTypeEngins] = useState<TypeEngin[]>([]);
  const [energies, setEnergies] = useState<Energie[]>([]);
  const [couleurs, setCouleurs] = useState<EnginCouleur[]>([]);
  const [usages, setUsages] = useState<UsageEngin[]>([]);
  const [marquesSuggestions, setMarquesSuggestions] = useState<MarqueEngin[]>([]);
  const [showMarquesSuggestions, setShowMarquesSuggestions] = useState(false);
  const [isSearchingMarques, setIsSearchingMarques] = useState(false);

  // ─── Auto-complétion modèle/puissance ───
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [suggestionsModeles, setSuggestionsModeles] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [suggestionsPuissances, setSuggestionsPuissances] = useState<any[]>([]);
  const [showSuggestionsModeles, setShowSuggestionsModeles] = useState(false);
  const [showSuggestionsPuissances, setShowSuggestionsPuissances] = useState(false);

  // ─── Loading states ───
  const [loading, setLoading] = useState({
    typeEngins: false,
    energies: false,
    couleurs: false,
    usages: false,
    verificationTelephone: false,
    rechercheModeles: false,
    recherchePuissances: false,
    ajoutCouleur: false,
    rechercheMarques: false,
  });

  // ─── Impôt & paiement ───
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [impot, setImpot] = useState<any>(null);
  const [tauxCdf, setTauxCdf] = useState(0);
  const [numeroAssurance, setNumeroAssurance] = useState("");
  const [assuranceError, setAssuranceError] = useState("");

  // ─── UI states ───
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddCouleurModal, setShowAddCouleurModal] = useState(false);
  const [showModalRecap, setShowModalRecap] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [successData, setSuccessData] = useState<any>(null);
  const [modalMessage, setModalMessage] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
    onAction?: () => void;
    actionText?: string;
    showAction?: boolean;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    showAction: true,
  });

  // ─── Refs pour timeouts ───
  const marqueTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rechercheModeleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recherchePuissanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const verificationTelephoneTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Helpers ───

  const showMessage = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message: string,
    onAction?: () => void,
    actionText?: string,
    showAction?: boolean,
  ) => {
    setModalMessage({ isOpen: true, type, title, message, onAction, actionText, showAction });
  };

  const closeMessage = () => {
    setModalMessage((prev) => ({ ...prev, isOpen: false }));
  };

  const anneeOptions = Array.from({ length: 30 }, (_, i) =>
    (2026 - i).toString(),
  );

  const getAnneesCirculationDisponibles = () => {
    if (!formData.anneeFabrication) return anneeOptions;
    const anneeFab = parseInt(formData.anneeFabrication);
    return anneeOptions.filter((year) => parseInt(year) >= anneeFab);
  };

  // ─── Chargement initial ───

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [impotRes, typeEnginsRes, energiesRes, couleursRes, usagesRes] =
          await Promise.all([
            getImpotById(operationId),
            getTypeEnginsActifs(),
            getEnergies(),
            getCouleursActives(),
            getUsagesActifs(),
          ]);

        if (impotRes.status === "success" && impotRes.data) {
          setImpot(impotRes.data);
          const [tauxRes] = await Promise.all([
            getTauxActif({ impot_id: impotRes.data.id }),
          ]);
          if (tauxRes.status === "success" && tauxRes.data) {
            setTauxCdf(Number(tauxRes.data.valeur) || 0);
          }
        }

        if (typeEnginsRes.status === "success") setTypeEngins(typeEnginsRes.data || []);
        if (energiesRes.status === "success") setEnergies(energiesRes.data || []);
        if (couleursRes.status === "success") setCouleurs(couleursRes.data || []);
        if (usagesRes.status === "success") setUsages(usagesRes.data || []);
      } catch (error) {
        console.error("Erreur chargement données:", error);
        showMessage("error", "Erreur de chargement", "Impossible de charger les données initiales.");
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, [operationId]);

  // ─── Réinitialiser année circulation si année fabrication change ───

  useEffect(() => {
    if (formData.anneeFabrication && formData.anneeCirculation) {
      const anneeCirc = parseInt(formData.anneeCirculation);
      const anneeFab = parseInt(formData.anneeFabrication);
      if (anneeCirc < anneeFab) {
        setFormData((prev) => ({ ...prev, anneeCirculation: "" }));
      }
    }
  }, [formData.anneeFabrication]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Recherche automatique des marques ───

  useEffect(() => {
    if (marqueTimerRef.current) clearTimeout(marqueTimerRef.current);

    if (formData.marque.length >= 2 && formData.typeEngin) {
      marqueTimerRef.current = setTimeout(async () => {
        setIsSearchingMarques(true);
        setLoading((prev) => ({ ...prev, rechercheMarques: true }));
        try {
          const response = await rechercherMarques(formData.typeEngin, formData.marque);
          if (response.status === "success") {
            const data = response.data;
            setMarquesSuggestions(Array.isArray(data) ? data : []);
            setShowMarquesSuggestions(true);
          }
        } catch (error) {
          console.error("Erreur recherche marques:", error);
          setMarquesSuggestions([]);
        } finally {
          setIsSearchingMarques(false);
          setLoading((prev) => ({ ...prev, rechercheMarques: false }));
        }
      }, 300);
    } else {
      setMarquesSuggestions([]);
      setShowMarquesSuggestions(false);
      if (formData.marqueId) {
        setFormData((prev) => ({ ...prev, marqueId: "" }));
      }
    }

    return () => {
      if (marqueTimerRef.current) clearTimeout(marqueTimerRef.current);
    };
  }, [formData.marque, formData.typeEngin]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Gestion des inputs ───

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "marque") {
      setFormData((prev) => ({ ...prev, modele: "", modeleId: "" }));
      setSuggestionsModeles([]);
      setShowSuggestionsModeles(false);
    }

    if (field === "typeEngin") {
      setFormData((prev) => ({
        ...prev,
        marque: "",
        marqueId: "",
        modele: "",
        modeleId: "",
        puissanceFiscal: "",
        puissanceFiscalValeur: "",
      }));
      setMarquesSuggestions([]);
      setShowMarquesSuggestions(false);
      setSuggestionsModeles([]);
      setShowSuggestionsModeles(false);
      setSuggestionsPuissances([]);
      setShowSuggestionsPuissances(false);
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // ─── Sélection marque ───

  const handleMarqueSelect = (marque: MarqueEngin) => {
    setFormData((prev) => ({
      ...prev,
      marque: marque.libelle,
      marqueId: marque.id.toString(),
      modele: "",
      modeleId: "",
    }));
    setShowMarquesSuggestions(false);
    setSuggestionsModeles([]);
    setShowSuggestionsModeles(false);
  };

  // ─── Couleur : ajout modal ───

  const handleAddCouleur = async (nom: string, codeHex: string) => {
    setLoading((prev) => ({ ...prev, ajoutCouleur: true }));
    try {
      const response = await ajouterCouleur(nom, codeHex);
      if (response.status === "success") {
        const nouvelleCouleur: EnginCouleur = response.data ?? {
          id: Date.now(),
          nom: nom,
          code_hex: codeHex,
          statut: 1,
        };
        setCouleurs((prev) => [...prev, nouvelleCouleur]);
        setFormData((prev) => ({ ...prev, couleur: nouvelleCouleur.nom }));
        showMessage("success", "Couleur ajoutée", `La couleur "${nom}" a été ajoutée et sélectionnée.`);
      } else {
        showMessage("error", "Erreur d'ajout", response.message || "Erreur lors de l'ajout de la couleur");
      }
    } catch (error) {
      console.error("Erreur ajout couleur:", error);
      showMessage("error", "Erreur réseau", "Erreur réseau lors de l'ajout de la couleur");
    } finally {
      setLoading((prev) => ({ ...prev, ajoutCouleur: false }));
    }
  };

  // ─── Vérification téléphone temps réel ───

  const handleTelephoneChange = async (telephone: string) => {
    setFormData((prev) => ({ ...prev, telephone }));

    if (verificationTelephoneTimeoutRef.current) {
      clearTimeout(verificationTelephoneTimeoutRef.current);
    }

    const telephoneNettoye = telephone.trim();
    if (telephoneNettoye.length >= 8 && telephoneNettoye !== "-") {
      verificationTelephoneTimeoutRef.current = setTimeout(async () => {
        setLoading((prev) => ({ ...prev, verificationTelephone: true }));
        try {
          const result = await verifierTelephoneExistant(telephoneNettoye);
          if (result.status === "success" && result.data?.particulier) {
            const p = result.data.particulier;
            setFormData((prev) => ({
              ...prev,
              nom: p.nom || "",
              prenom: p.prenom || "",
              email: p.email || "",
              adresse: p.adresse || "",
              ville: p.ville || "",
              nif: p.nif || "",
            }));
            showMessage("success", "Chargement réussi", "Informations du particulier chargées avec succès");
          }
        } catch (error) {
          console.error("Erreur vérification téléphone:", error);
        } finally {
          setLoading((prev) => ({ ...prev, verificationTelephone: false }));
        }
      }, 800);
    }
  };

  // ─── Recherche modèles ───

  const handleModeleSearch = async (searchTerm: string) => {
    if (!formData.marqueId) return;
    if (rechercheModeleTimeoutRef.current) clearTimeout(rechercheModeleTimeoutRef.current);

    if (searchTerm.length >= 2) {
      rechercheModeleTimeoutRef.current = setTimeout(async () => {
        setLoading((prev) => ({ ...prev, rechercheModeles: true }));
        try {
          const result = await rechercherModeles(parseInt(formData.marqueId), searchTerm);
          if (result.status === "success" && result.data) {
            setSuggestionsModeles(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              result.data.map((m: any) => ({ id: m.id, libelle: m.libelle, description: m.description })),
            );
            setShowSuggestionsModeles(true);
          } else {
            setSuggestionsModeles([]);
            setShowSuggestionsModeles(false);
          }
        } catch (error) {
          console.error("Erreur recherche modèles:", error);
          setSuggestionsModeles([]);
        } finally {
          setLoading((prev) => ({ ...prev, rechercheModeles: false }));
        }
      }, 500);
    } else {
      setSuggestionsModeles([]);
      setShowSuggestionsModeles(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectModele = (modele: any) => {
    setFormData((prev) => ({ ...prev, modele: modele.libelle, modeleId: modele.id.toString() }));
    setShowSuggestionsModeles(false);
  };

  const handleCreateModele = async () => {
    if (!formData.modele || !formData.marqueId) return;
    try {
      setLoading((prev) => ({ ...prev, rechercheModeles: true }));
      const result = await creerModele(formData.modele, parseInt(formData.marqueId));
      if (result.status === "success" && result.data) {
        const newModele = { id: result.data[0]?.id || Date.now(), libelle: formData.modele };
        setFormData((prev) => ({ ...prev, modeleId: newModele.id.toString() }));
        setSuggestionsModeles([newModele, ...suggestionsModeles]);
        showMessage("success", "Modèle créé", "Le modèle a été créé avec succès");
      } else {
        showMessage("error", "Erreur de création", result.message || "Erreur lors de la création du modèle");
      }
    } catch (error) {
      console.error("Erreur création modèle:", error);
      showMessage("error", "Erreur réseau", "Erreur réseau lors de la création du modèle");
    } finally {
      setLoading((prev) => ({ ...prev, rechercheModeles: false }));
    }
  };

  // ─── Recherche puissance fiscale ───

  const handlePuissanceSearch = async (searchTerm: string) => {
    if (!formData.typeEngin) return;
    if (recherchePuissanceTimeoutRef.current) clearTimeout(recherchePuissanceTimeoutRef.current);

    if (searchTerm.length >= 1) {
      recherchePuissanceTimeoutRef.current = setTimeout(async () => {
        setLoading((prev) => ({ ...prev, recherchePuissances: true }));
        try {
          const result = await rechercherPuissancesFiscales(formData.typeEngin, searchTerm);
          if (result.status === "success" && result.data) {
            setSuggestionsPuissances(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              result.data.map((p: any) => ({ id: p.id, libelle: p.libelle, valeur: p.valeur, description: p.description })),
            );
            setShowSuggestionsPuissances(true);
          } else {
            setSuggestionsPuissances([]);
            setShowSuggestionsPuissances(false);
          }
        } catch (error) {
          console.error("Erreur recherche puissances:", error);
          setSuggestionsPuissances([]);
        } finally {
          setLoading((prev) => ({ ...prev, recherchePuissances: false }));
        }
      }, 500);
    } else {
      setSuggestionsPuissances([]);
      setShowSuggestionsPuissances(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectPuissance = (puissance: any) => {
    setFormData((prev) => ({
      ...prev,
      puissanceFiscal: puissance.libelle,
      puissanceFiscalValeur: puissance.valeur?.toString() || "",
    }));
    setShowSuggestionsPuissances(false);
  };

  const handleCreatePuissance = async () => {
    if (!formData.puissanceFiscal || !formData.typeEngin) return;
    const valeurMatch = formData.puissanceFiscal.match(/(\d+)/);
    const valeur = valeurMatch ? parseFloat(valeurMatch[1]) : 0;
    if (valeur === 0) {
      showMessage("warning", "Valeur invalide", "Veuillez spécifier une valeur numérique pour la puissance");
      return;
    }
    try {
      setLoading((prev) => ({ ...prev, recherchePuissances: true }));
      const result = await creerPuissanceFiscale(formData.puissanceFiscal, valeur, formData.typeEngin);
      if (result.status === "success" && result.data) {
        const newPuissance = { id: result.data[0]?.id || Date.now(), libelle: formData.puissanceFiscal, valeur };
        setSuggestionsPuissances([newPuissance, ...suggestionsPuissances]);
        showMessage("success", "Puissance créée", "La puissance fiscale a été créée avec succès");
      } else {
        showMessage("error", "Erreur", result.message || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Erreur création puissance:", error);
      showMessage("error", "Erreur réseau", "Erreur réseau lors de la création de la puissance fiscale");
    } finally {
      setLoading((prev) => ({ ...prev, recherchePuissances: false }));
    }
  };

  // ─── Validation ───

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!formData.nom.trim()) newErrors.nom = "Le nom est obligatoire";
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est obligatoire";
    if (!formData.adresse.trim()) newErrors.adresse = "L'adresse est obligatoire";
    if (!formData.typeEngin) newErrors.typeEngin = "Le type d'engin est obligatoire";
    if (!formData.marque) newErrors.marque = "La marque est obligatoire";

    if (formData.telephone && formData.telephone.trim() !== "") {
      const phoneRegex = /^[0-9+\-\s()]{8,}$/;
      const tel = formData.telephone.replace(/\s/g, "");
      if (tel !== "-" && !phoneRegex.test(tel)) {
        newErrors.telephone = "Format de téléphone invalide";
      }
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }
    if (formData.anneeFabrication && formData.anneeCirculation) {
      if (parseInt(formData.anneeCirculation) < parseInt(formData.anneeFabrication)) {
        newErrors.anneeCirculation = "L'année de circulation ne peut pas être antérieure à l'année de fabrication";
      }
    }

    if (!numeroAssurance.trim()) {
      setAssuranceError("Le numéro d'assurance physique est obligatoire");
    } else {
      setAssuranceError("");
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0 || !numeroAssurance.trim()) {
      showMessage("error", "Erreurs de validation", "Veuillez corriger les erreurs dans le formulaire avant de continuer.");
      return false;
    }
    return true;
  };

  // ─── Soumission : afficher le récap ───

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setShowModalRecap(true);
  };

  // ─── Confirmation finale : inscription + paiement assurance ───

  const handleConfirmerSoumission = async () => {
    setIsSubmitting(true);

    if (!utilisateur?.id) {
      showMessage("error", "Erreur", "Données utilisateur manquantes. Reconnectez-vous.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Créer modèle si nécessaire
      if (formData.modele && formData.marqueId && !formData.modeleId) {
        const modeleResult = await creerModele(formData.modele, parseInt(formData.marqueId));
        if (modeleResult.status === "success" && modeleResult.data?.[0]?.id) {
          formData.modeleId = modeleResult.data[0].id.toString();
        }
      }
      // Créer puissance si nécessaire
      if (formData.puissanceFiscal && formData.typeEngin && !formData.puissanceFiscalValeur) {
        const valeurMatch = formData.puissanceFiscal.match(/(\d+)/);
        const valeur = valeurMatch ? parseFloat(valeurMatch[1]) : 0;
        if (valeur > 0) {
          const puissanceResult = await creerPuissanceFiscale(
            formData.puissanceFiscal,
            valeur,
            formData.typeEngin,
          );
          if (puissanceResult.status === "success") {
            formData.puissanceFiscalValeur = valeur.toString();
          }
        }
      }

      const nomComplet = [formData.nom, formData.prenom].filter(Boolean).join(" ");

      const inscriptionResult = await inscrireAssujetti({
        nom_complet: nomComplet,
        telephone: formData.telephone.trim() !== "" && formData.telephone !== "-" ? formData.telephone : "",
        adresse: formData.adresse,
        nif: formData.nif,
        email: formData.email,
        numero_plaque: plaque,
        marque: formData.marque,
        modele: formData.modele,
        couleur: formData.couleur,
        energie: formData.energie,
        usage_engin: formData.usage,
        puissance_fiscal: formData.puissanceFiscal,
        annee_fabrication: formData.anneeFabrication,
        annee_circulation: formData.anneeCirculation,
        numero_chassis: formData.numeroChassis,
        numero_moteur: formData.numeroMoteur,
        type_engin: formData.typeEngin,
        utilisateur_id: utilisateur.id,
      });

      if (inscriptionResult.status !== "success" || !inscriptionResult.data) {
        showMessage("error", "Erreur d'inscription", inscriptionResult.message || "Erreur lors de l'inscription");
        setIsSubmitting(false);
        return;
      }

      const particulierId = inscriptionResult.data.assujetti.id;
      const enginId = inscriptionResult.data.engin.id;

      // Paiement à 0$ (le paiement réel a été fait via la banque)
      const paiementResult = await enregistrerPaiementAssurance({
        engin_id: enginId,
        particulier_id: particulierId,
        montant: 0,
        montant_initial: 0,
        impot_id: impot ? String(impot.id) : "0",
        mode_paiement: "banque",
        statut: "completed",
        utilisateur_id: utilisateur.id,
        site_id: utilisateur.site_id || 0,
        nombre_plaques: 1,
        taux_cdf: tauxCdf,
        numero_assurance: numeroAssurance.trim(),
        reference_bancaire: reference,
      });

      if (paiementResult.status !== "success") {
        showMessage("error", "Erreur de paiement", paiementResult.message || "Erreur lors de l'enregistrement du paiement");
        setIsSubmitting(false);
        return;
      }

      setSuccessData(paiementResult.data);
      setShowModalRecap(false);
      setShowSuccess(true);
    } catch (err) {
      console.error("Erreur soumission:", err);
      showMessage("error", "Erreur de soumission", "Une erreur est survenue lors de la soumission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Section Marque auto-complétion ───

  const renderSectionMarque = () => (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Marque <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type="text"
          value={formData.marque}
          onChange={(e) => handleInputChange("marque", e.target.value)}
          placeholder="Saisissez la marque (auto-complétion)"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-10 ${
            errors.marque ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-blue-500"
          }`}
          disabled={!formData.typeEngin}
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
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {marquesSuggestions.map((marque) => (
            <div
              key={marque.id}
              onClick={() => handleMarqueSelect(marque)}
              className="p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors text-gray-800"
            >
              <div className="font-medium">{marque.libelle}</div>
              {marque.description && (
                <p className="text-xs text-gray-500 mt-1 truncate">{marque.description}</p>
              )}
              <div className="text-xs text-gray-500 mt-1">
                Type: {marque.type_engin_libelle}
              </div>
            </div>
          ))}
        </div>
      )}

      {showMarquesSuggestions && marquesSuggestions.length === 0 && formData.marque.length >= 2 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm text-gray-600">
          Aucune marque trouvée. La marque sera créée automatiquement.
        </div>
      )}

      {errors.marque && <p className="text-red-600 text-sm mt-1 font-medium">{errors.marque}</p>}

      {!formData.typeEngin && (
        <p className="text-blue-600 text-xs mt-1">Veuillez d&apos;abord sélectionner le type d&apos;engin</p>
      )}
    </div>
  );

  // ─── Section Couleur select + bouton + ───

  const renderSectionCouleur = () => {
    const couleurSelectionnee = couleurs.find((c) => c.nom === formData.couleur);
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <select
              value={formData.couleur}
              onChange={(e) => handleInputChange("couleur", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8"
              disabled={loading.couleurs || loading.ajoutCouleur}
            >
              <option value="">Sélectionner une couleur</option>
              {couleurs.map((c) => (
                <option key={c.id} value={c.nom}>{c.nom}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
              {loading.couleurs || loading.ajoutCouleur ? (
                <Loader className="w-4 h-4 animate-spin text-gray-400" />
              ) : (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddCouleurModal(true)}
            title="Ajouter une nouvelle couleur"
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            disabled={loading.ajoutCouleur}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        {formData.couleur && couleurSelectionnee && (
          <div className="mt-1 flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
              style={{ backgroundColor: couleurSelectionnee.code_hex }}
            />
            <span className="text-xs text-green-700 font-medium">
              &#10003; {formData.couleur}
            </span>
          </div>
        )}
      </div>
    );
  };

  // ─── Écran de succès ───

  if (showSuccess && successData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-green-100 p-2 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Inscription & Délivrance réussies !
            </h2>
            <p className="text-gray-600 text-sm">
              L&apos;assurance a été enregistrée pour la plaque <strong>{plaque}</strong>.
            </p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-800 mb-2">Assurance Délivrée</h3>
            <p className="text-green-700">
              L&apos;assurance <strong>{numeroAssurance}</strong> pour le véhicule <strong>{plaque}</strong> a été délivrée.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-800 mb-3">Détails de la transaction</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {successData?.paiement?.numero_transaction && (
              <div>
                <span className="text-gray-500">Référence :</span>
                <div className="font-mono font-bold text-gray-900">
                  {successData.paiement.numero_transaction}
                </div>
              </div>
            )}
            <div>
              <span className="text-gray-500">Montant :</span>
              <div className="font-bold text-green-600">0$ (Paiement bancaire)</div>
            </div>
            <div>
              <span className="text-gray-500">Mode :</span>
              <div className="font-medium">Référence bancaire</div>
            </div>
            <div>
              <span className="text-gray-500">Plaque :</span>
              <div className="font-bold">{plaque}</div>
            </div>
            <div>
              <span className="text-gray-500">N° Assurance :</span>
              <div className="font-bold">{numeroAssurance}</div>
            </div>
            <div>
              <span className="text-gray-500">Réf. bancaire :</span>
              <div className="font-bold text-emerald-700">{reference}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          {successData?.paiement?.numero_transaction && (
            <button
              onClick={() => navigator.clipboard.writeText(successData.paiement.numero_transaction)}
              className="flex items-center space-x-2 px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              <Copy className="w-4 h-4" />
              <span>Copier Réf.</span>
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
          </button>
          <button
            onClick={() => router.push(`/activity/operations/${operationId}/delivrance-assurance?ref=${encodeURIComponent(reference)}`)}
            className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <Ticket className="w-4 h-4" />
            <span>Continuer la délivrance</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── Chargement ───

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Chargement des données...</p>
        </div>
      </div>
    );
  }

  // ─── Rendu principal ───

  return (
    <>
      {/* Modals */}
      <AddCouleurModal
        isOpen={showAddCouleurModal}
        onClose={() => setShowAddCouleurModal(false)}
        onAdd={handleAddCouleur}
        defaultNom=""
      />
      <MessageModal
        isOpen={modalMessage.isOpen}
        type={modalMessage.type}
        title={modalMessage.title}
        message={modalMessage.message}
        onClose={closeMessage}
        onAction={modalMessage.onAction}
        actionText={modalMessage.actionText}
        showAction={modalMessage.showAction}
      />

      {/* Modal Récapitulatif */}
      {showModalRecap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="font-bold text-lg mb-6">Confirmation de l&apos;inscription</h3>

              <div className="space-y-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3">Récapitulatif</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600">Plaque :</span>
                      <div className="font-medium text-lg text-blue-800">{plaque}</div>
                    </div>
                    <div>
                      <span className="text-blue-600">Propriétaire :</span>
                      <div className="font-medium">{formData.nom} {formData.prenom}</div>
                    </div>
                    <div>
                      <span className="text-blue-600">Marque :</span>
                      <div className="font-medium">{formData.marque}</div>
                    </div>
                    <div>
                      <span className="text-blue-600">Modèle :</span>
                      <div className="font-medium">{formData.modele || "-"}</div>
                    </div>
                    <div>
                      <span className="text-blue-600">Couleur :</span>
                      <div className="flex items-center space-x-2">
                        {couleurs.find((c) => c.nom === formData.couleur) && (
                          <div
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: couleurs.find((c) => c.nom === formData.couleur)?.code_hex }}
                          />
                        )}
                        <span className="font-medium">{formData.couleur || "-"}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-blue-600">Puissance :</span>
                      <div className="font-medium">{formData.puissanceFiscal || "-"}</div>
                    </div>
                    <div>
                      <span className="text-blue-600">Téléphone :</span>
                      <div className="font-medium">{formData.telephone || "Non fourni"}</div>
                    </div>
                    <div>
                      <span className="text-blue-600">N° Assurance :</span>
                      <div className="font-bold text-gray-900">{numeroAssurance}</div>
                    </div>
                    <div>
                      <span className="text-blue-600">Référence bancaire :</span>
                      <div className="font-medium text-emerald-700">{reference}</div>
                    </div>
                    <div>
                      <span className="text-blue-600">Montant :</span>
                      <div className="font-bold text-green-700">0$ (Paiement bancaire)</div>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <h4 className="font-semibold text-emerald-800 mb-2">&#9989; Inscription & Délivrance</h4>
                  <p className="text-emerald-700 text-sm">
                    Cette action inscrit le véhicule, enregistre le paiement à 0$ (déjà payé via banque) et délivre l&apos;assurance.
                    Cette action est irréversible.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowModalRecap(false)}
                  disabled={isSubmitting}
                  className="px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmerSoumission}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Inscription en cours...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirmer l&apos;inscription & Délivrer (0$)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── FORMULAIRE PRINCIPAL ─── */}

      {/* Bandeau plaque + référence */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => router.push(`/activity/operations/${operationId}/delivrance-assurance`)}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>
            <div>
              <span className="text-gray-500 text-sm">Plaque non trouvée :</span>
              <div className="text-2xl font-bold text-blue-800 bg-white py-2 px-4 rounded-lg border-2 border-blue-300 mt-1 tracking-wider">
                {plaque}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-gray-500 text-sm">Référence bancaire</span>
            <div className="text-lg font-bold text-emerald-700 bg-emerald-50 py-2 px-4 rounded-lg border border-emerald-200 mt-1">
              {reference}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmitForm} className="space-y-8">
        {/* ═══════ SECTION ASSUJETTI ═══════ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-100 p-2 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Informations de l&apos;Assujetti</h2>
              <p className="text-gray-600 text-sm">Renseignez les informations personnelles du propriétaire</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Téléphone avec vérification auto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de téléphone</label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => handleTelephoneChange(e.target.value)}
                  placeholder="Ex: +243 81 234 5678 (Facultatif)"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.telephone ? "border-red-300" : "border-gray-300"
                  }`}
                />
                {loading.verificationTelephone && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {errors.telephone && <p className="text-red-600 text-sm mt-1">{errors.telephone}</p>}
              <p className="text-blue-600 text-xs mt-1">
                Facultatif - Le système vérifie automatiquement si ce téléphone existe déjà
              </p>
            </div>

            {/* Nom */}
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
              {errors.nom && <p className="text-red-600 text-sm mt-1">{errors.nom}</p>}
            </div>

            {/* Prénom */}
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
              {errors.prenom && <p className="text-red-600 text-sm mt-1">{errors.prenom}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Entrez votre adresse email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Adresse */}
            <div className="md:col-span-2">
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
              {errors.adresse && <p className="text-red-600 text-sm mt-1">{errors.adresse}</p>}
            </div>

            {/* NIF */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">NIF</label>
              <input
                type="text"
                value={formData.nif}
                onChange={(e) => handleInputChange("nif", e.target.value)}
                placeholder="NIF du particulier"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Ville */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
              <input
                type="text"
                value={formData.ville}
                onChange={(e) => handleInputChange("ville", e.target.value)}
                placeholder="Entrez votre ville"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ═══════ SECTION ENGIN ═══════ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-green-100 p-2 rounded-lg">
              <Car className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Informations de l&apos;Engin</h2>
              <p className="text-gray-600 text-sm">Renseignez les caractéristiques techniques du véhicule</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Type d'engin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d&apos;engin <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.typeEngin}
                  onChange={(e) => handleInputChange("typeEngin", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.typeEngin ? "border-red-300" : "border-gray-300"
                  }`}
                  disabled={loading.typeEngins}
                >
                  <option value="">Sélectionner le type d&apos;engin</option>
                  {typeEngins.map((t) => (
                    <option key={t.id} value={t.libelle}>{t.libelle}</option>
                  ))}
                </select>
                {loading.typeEngins && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {errors.typeEngin && <p className="text-red-600 text-sm mt-1">{errors.typeEngin}</p>}
            </div>

            {/* Marque auto-complétion */}
            {renderSectionMarque()}

            {/* Modèle auto-complétion */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Modèle</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.modele}
                  onChange={(e) => {
                    handleInputChange("modele", e.target.value);
                    handleModeleSearch(e.target.value);
                  }}
                  onFocus={() => {
                    if (formData.modele && formData.marqueId) handleModeleSearch(formData.modele);
                  }}
                  placeholder="Saisissez le modèle"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.marqueId}
                />
                {loading.rechercheModeles && (
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {formData.modele && !formData.modeleId && (
                  <button
                    type="button"
                    onClick={handleCreateModele}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600 hover:text-green-700"
                    title="Créer ce modèle"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {showSuggestionsModeles && suggestionsModeles.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {suggestionsModeles.map((s) => (
                    <div
                      key={s.id}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => handleSelectModele(s)}
                    >
                      <div className="font-medium">{s.libelle}</div>
                      {s.description && <div className="text-xs text-gray-500">{s.description}</div>}
                    </div>
                  ))}
                </div>
              )}

              {formData.marqueId && !formData.modeleId && (
                <p className="text-amber-600 text-xs mt-1">
                  Saisissez le modèle. S&apos;il n&apos;existe pas, cliquez sur <Plus className="w-3 h-3 inline" /> pour le créer.
                </p>
              )}
            </div>

            {/* Énergie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Énergie</label>
              <div className="relative">
                <select
                  value={formData.energie}
                  onChange={(e) => handleInputChange("energie", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading.energies}
                >
                  <option value="">Sélectionner l&apos;énergie</option>
                  {energies.map((e) => (
                    <option key={e.id} value={e.nom}>{e.nom}</option>
                  ))}
                </select>
                {loading.energies && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Année fabrication */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Année de fabrication</label>
              <select
                value={formData.anneeFabrication}
                onChange={(e) => handleInputChange("anneeFabrication", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner l&apos;année</option>
                {anneeOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Année circulation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Année de circulation</label>
              <select
                value={formData.anneeCirculation}
                onChange={(e) => handleInputChange("anneeCirculation", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.anneeCirculation ? "border-red-300" : "border-gray-300"
                }`}
                disabled={!formData.anneeFabrication}
              >
                <option value="">
                  {!formData.anneeFabrication
                    ? "Sélectionnez d'abord l'année de fabrication"
                    : "Sélectionner l'année"}
                </option>
                {getAnneesCirculationDisponibles().map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              {errors.anneeCirculation && (
                <p className="text-red-600 text-sm mt-1">{errors.anneeCirculation}</p>
              )}
              {formData.anneeFabrication && (
                <p className="text-blue-600 text-xs mt-1">
                  Années disponibles à partir de {formData.anneeFabrication}
                </p>
              )}
            </div>

            {/* Couleur select + bouton + */}
            {renderSectionCouleur()}

            {/* Puissance Fiscal auto-complétion */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Puissance Fiscal</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.puissanceFiscal}
                  onChange={(e) => {
                    handleInputChange("puissanceFiscal", e.target.value);
                    handlePuissanceSearch(e.target.value);
                  }}
                  onFocus={() => {
                    if (formData.puissanceFiscal && formData.typeEngin) {
                      handlePuissanceSearch(formData.puissanceFiscal);
                    }
                  }}
                  placeholder="Ex: 10 CV, 12 CV..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.typeEngin}
                />
                {loading.recherchePuissances && (
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {formData.puissanceFiscal && !formData.puissanceFiscalValeur && (
                  <button
                    type="button"
                    onClick={handleCreatePuissance}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600 hover:text-green-700"
                    title="Créer cette puissance"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {showSuggestionsPuissances && suggestionsPuissances.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {suggestionsPuissances.map((s) => (
                    <div
                      key={s.id}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => handleSelectPuissance(s)}
                    >
                      <div className="font-medium">{s.libelle}</div>
                      {s.valeur && <div className="text-xs text-gray-500">{s.valeur} CV</div>}
                    </div>
                  ))}
                </div>
              )}

              {formData.typeEngin && (
                <p className="text-blue-600 text-xs mt-1">
                  Saisissez la puissance (ex: 10 CV). Système intelligent de recherche.
                </p>
              )}
            </div>

            {/* Usage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Usage</label>
              <div className="relative">
                <select
                  value={formData.usage}
                  onChange={(e) => handleInputChange("usage", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading.usages}
                >
                  <option value="">Sélectionner l&apos;usage</option>
                  {usages.map((u) => (
                    <option key={u.id} value={u.libelle}>{u.libelle}</option>
                  ))}
                </select>
                {loading.usages && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Numéro châssis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de châssis</label>
              <input
                type="text"
                value={formData.numeroChassis}
                onChange={(e) => handleInputChange("numeroChassis", e.target.value)}
                placeholder="Entrez le numéro de châssis"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Numéro moteur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de moteur</label>
              <input
                type="text"
                value={formData.numeroMoteur}
                onChange={(e) => handleInputChange("numeroMoteur", e.target.value)}
                placeholder="Entrez le numéro de moteur"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ═══════ SECTION PAIEMENT & ASSURANCE ═══════ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-green-100 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Paiement & Assurance</h2>
              <p className="text-gray-600 text-sm">Détails du paiement et numéro d&apos;assurance physique</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Montant */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm text-green-700 mb-1">Montant</p>
              <p className="text-3xl font-bold text-green-700">0$</p>
              <p className="text-xs text-green-600 mt-1">Paiement déjà effectué via banque</p>
            </div>

            {/* Mode paiement */}
            <div className="bg-gray-50 border-2 border-emerald-500 rounded-lg p-4 flex items-center">
              <DollarSign className="w-8 h-8 text-emerald-600 mr-3" />
              <div>
                <span className="font-bold text-emerald-700 text-lg">Référence bancaire</span>
                <p className="text-xs text-emerald-600 mt-0.5">{reference}</p>
              </div>
            </div>

            {/* Numéro assurance physique (obligatoire) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                N° Assurance physique <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={numeroAssurance}
                onChange={(e) => { setNumeroAssurance(e.target.value); setAssuranceError(""); }}
                placeholder="Numéro physique de l'assurance"
                required
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${assuranceError ? 'border-red-300' : 'border-gray-300'}`}
              />
              {assuranceError && (
                <p className="mt-1 text-xs text-red-500">{assuranceError}</p>
              )}
            </div>
          </div>
        </div>

        {/* ═══════ BOUTON DE SOUMISSION ═══════ */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push(`/activity/operations/${operationId}/delivrance-assurance`)}
            className="flex items-center space-x-2 px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la délivrance</span>
          </button>

          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            <span>Inscrire & Délivrer (0$)</span>
          </button>
        </div>
      </form>
    </>
  );
}
