"use client";
import { useState, useEffect, useRef } from "react";
import {
  Save,
  User,
  Car,
  Calculator,
  ArrowRight,
  ArrowLeft,
  Printer,
  CheckCircle,
  X,
  Search,
  Plus,
  Loader,
  FileText, // AJOUT: Icône pour la fiche
} from "lucide-react";
import {
  verifierPlaqueTelephone,
  soumettreCarteRose,
  verifierTelephoneExistant,
  rechercherModeles,
  creerModele,
  rechercherPuissancesFiscales,
  creerPuissanceFiscale,
  type VerificationData,
  type ParticulierData,
  type EnginData,
  type CarteRoseResponse,
} from "@/services/carte-rose/carteRoseService";
import {
  rechercherCouleur,
  ajouterCouleur,
} from "@/services/immatriculation/immatriculationService";
import CarteRosePrint from "./CarteRosePrint";
import FicheIdentificationPrint from "./FicheIdentificationPrint"; // AJOUT: Import du nouveau composant

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
  rechercherMarques,
  type MarqueEngin,
} from "@/services/marques-engins/marqueEnginService";
import {
  getPuissancesFiscalesActives,
  type PuissanceFiscale,
} from "@/services/puissances-fiscales/puissanceFiscaleService";

interface FormData {
  // Étape vérification
  telephone: string;
  numeroPlaque: string;

  // Informations de l'assujetti
  nom: string;
  prenom: string;
  telephoneAssujetti: string;
  email: string;
  adresse: string;
  ville: string;
  code_postal: string;
  province: string;
  nif: string;

  // Informations de l'engin
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

interface Utilisateur {
  id: number;
  nom_complet: string;
  telephone: string;
  adresse: string;
  site_nom: string;
  site_code: string;
  site_id?: number;
  formule?: string;
  province_code?: string; // AJOUT: Pour la fiche
}

interface ClientSimpleFormProps {
  impotId: string;
  utilisateur: Utilisateur | null;
}

type Etape = "verification" | "formulaire" | "previsualisation";

interface PlaqueInfo {
  id: number;
  numero_plaque: string;
  serie_id: number;
  serie_item_id: number;
  statut: number;
}

interface ParticulierInfo {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  adresse: string;
  ville?: string;
  province?: string;
  nif?: string;
}

// AJOUT: Interface pour les données de la fiche supplémentaire
interface FicheSupplementaire {
  sexe: string;
  date_naissance: string;
  lieu_naissance: string;
  adresse_complete: string;
  types_document: {
    carte_identite: boolean;
    passeport: boolean;
    permis_conduire: boolean;
    carte_electeur: boolean;
  };
  niup_moto: string;
}

// AJOUT: Props pour le modal supplémentaire
interface ModalSupplementaireProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FicheSupplementaire) => void;
  defaultAdresse?: string;
}

// AJOUT: Modal pour compléter les informations supplémentaires
const ModalSupplementaire: React.FC<ModalSupplementaireProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultAdresse = "",
}) => {
  const [formData, setFormData] = useState<FicheSupplementaire>({
    sexe: "",
    date_naissance: "",
    lieu_naissance: "",
    adresse_complete: defaultAdresse,
    types_document: {
      carte_identite: false,
      passeport: false,
      permis_conduire: false,
      carte_electeur: false,
    },
    niup_moto: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const toggleDocumentType = (type: keyof typeof formData.types_document) => {
    setFormData((prev) => ({
      ...prev,
      types_document: {
        ...prev.types_document,
        [type]: !prev.types_document[type],
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Informations supplémentaires pour la fiche d'identification
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sexe */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Sexe <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sexe"
                  value="Masculin"
                  checked={formData.sexe === "Masculin"}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sexe: e.target.value }))
                  }
                  className="mr-2"
                  required
                />
                Masculin
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sexe"
                  value="Féminin"
                  checked={formData.sexe === "Féminin"}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sexe: e.target.value }))
                  }
                  className="mr-2"
                />
                Féminin
              </label>
            </div>
          </div>

          {/* Date de naissance */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Date de naissance <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date_naissance}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  date_naissance: e.target.value,
                }))
              }
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Lieu de naissance */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Lieu de naissance <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.lieu_naissance}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  lieu_naissance: e.target.value,
                }))
              }
              placeholder="Ex: Kinshasa/Gombe"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Adresse complète */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Adresse complète <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.adresse_complete}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  adresse_complete: e.target.value,
                }))
              }
              placeholder="Ex: Avenue de la Justice N°123, Quartier, Commune, Ville"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
              required
            />
          </div>

          {/* Type de document d'identité */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Type de document d'identité{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.types_document.carte_identite}
                  onChange={() => toggleDocumentType("carte_identite")}
                  className="mr-2"
                />
                Carte d'identité
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.types_document.passeport}
                  onChange={() => toggleDocumentType("passeport")}
                  className="mr-2"
                />
                Passeport
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.types_document.permis_conduire}
                  onChange={() => toggleDocumentType("permis_conduire")}
                  className="mr-2"
                />
                Permis de conduire
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.types_document.carte_electeur}
                  onChange={() => toggleDocumentType("carte_electeur")}
                  className="mr-2"
                />
                Carte d'électeur
              </label>
            </div>
          </div>

          {/* NIUP Moto */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              NIUP Moto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.niup_moto}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, niup_moto: e.target.value }))
              }
              placeholder="Ex: CD-KN-2024-123456"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-200 font-semibold"
            >
              Générer la fiche
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
  const [etapeActuelle, setEtapeActuelle] = useState<Etape>("verification");
  const [formData, setFormData] = useState<FormData>({
    telephone: "",
    numeroPlaque: "",
    nom: "",
    prenom: "",
    telephoneAssujetti: "",
    email: "",
    adresse: "",
    ville: "",
    code_postal: "",
    province: "",
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

  // États pour les données dynamiques
  const [typeEngins, setTypeEngins] = useState<TypeEngin[]>([]);
  const [energies, setEnergies] = useState<Energie[]>([]);
  const [couleurs, setCouleurs] = useState<EnginCouleur[]>([]);
  const [usages, setUsages] = useState<UsageEngin[]>([]);
  const [puissancesFiscales, setPuissancesFiscales] = useState<
    PuissanceFiscale[]
  >([]);
  
  // AJOUT: États pour les suggestions de marques (adapté du premier écran)
  const [marquesSuggestions, setMarquesSuggestions] = useState<MarqueEngin[]>([]);
  const [showMarquesSuggestions, setShowMarquesSuggestions] = useState(false);
  const [isSearchingMarques, setIsSearchingMarques] = useState(false);

  // États pour la gestion des couleurs
  const [couleursSuggestions, setCouleursSuggestions] = useState<
    EnginCouleur[]
  >([]);
  const [showCouleursSuggestions, setShowCouleursSuggestions] = useState(false);
  const [isSearchingCouleurs, setIsSearchingCouleurs] = useState(false);
  const [couleurInputMode, setCouleurInputMode] = useState<"select" | "input">(
    "select"
  );
  const [nouvelleCouleurNom, setNouvelleCouleurNom] = useState("");
  const [nouvelleCouleurCode, setNouvelleCouleurCode] = useState("#000000");
  const [isAddingCouleur, setIsAddingCouleur] = useState(false);

  // AJOUT: États pour la fiche d'identification
  const [showModalSupplementaire, setShowModalSupplementaire] = useState(false);
  const [ficheSupplementaire, setFicheSupplementaire] =
    useState<FicheSupplementaire | null>(null);
  const [showFicheIdentification, setShowFicheIdentification] = useState(false);

  // États de chargement
  const [loading, setLoading] = useState({
    typeEngins: false,
    energies: false,
    couleurs: false,
    usages: false,
    puissances: false,
    verificationTelephone: false,
    rechercheModeles: false,
    recherchePuissances: false,
    rechercheCouleurs: false,
    ajoutCouleur: false,
    rechercheMarques: false, // AJOUT: Pour la recherche des marques
  });

  const [plaqueInfo, setPlaqueInfo] = useState<PlaqueInfo | null>(null);
  const [particulierInfo, setParticulierInfo] =
    useState<ParticulierInfo | null>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showModalVerification, setShowModalVerification] = useState(false);
  const [showModalCarteExistante, setShowModalCarteExistante] = useState(false);
  const [showModalRecap, setShowModalRecap] = useState(false);
  const [messageErreur, setMessageErreur] = useState("");
  const [showPrint, setShowPrint] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  // États pour l'auto-complétion
  const [suggestionsModeles, setSuggestionsModeles] = useState<any[]>([]);
  const [suggestionsPuissances, setSuggestionsPuissances] = useState<any[]>([]);
  const [showSuggestionsModeles, setShowSuggestionsModeles] = useState(false);
  const [showSuggestionsPuissances, setShowSuggestionsPuissances] =
    useState(false);

  // Références pour les timeouts
  const rechercheModeleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recherchePuissanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const verificationTelephoneTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const couleurTimerRef = useRef<NodeJS.Timeout | null>(null);
  const marqueTimerRef = useRef<NodeJS.Timeout | null>(null); // AJOUT: Pour la recherche des marques

  // Générer les options d'années
  const anneeOptions = Array.from({ length: 30 }, (_, i) =>
    (2026 - i).toString()
  );

  // Chargement des données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Charger les types d'engins
        setLoading((prev) => ({ ...prev, typeEngins: true }));
        const typeEnginsResponse = await getTypeEnginsActifs();
        if (typeEnginsResponse.status === "success") {
          setTypeEngins(typeEnginsResponse.data || []);
        }

        // Charger les énergies
        setLoading((prev) => ({ ...prev, energies: true }));
        const energiesResponse = await getEnergies();
        if (energiesResponse.status === "success") {
          setEnergies(energiesResponse.data || []);
        }

        // Charger les couleurs
        setLoading((prev) => ({ ...prev, couleurs: true }));
        const couleursResponse = await getCouleurs();
        if (couleursResponse.status === "success") {
          setCouleurs(couleursResponse.data || []);
        }

        // Charger les usages
        setLoading((prev) => ({ ...prev, usages: true }));
        const usagesResponse = await getUsages();
        if (usagesResponse.status === "success") {
          setUsages(usagesResponse.data || []);
        }

        // Charger toutes les puissances fiscales
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
          verificationTelephone: false,
          rechercheModeles: false,
          recherchePuissances: false,
          rechercheCouleurs: false,
          ajoutCouleur: false,
          rechercheMarques: false,
        });
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

  // AJOUT: Recherche automatique des marques (adapté du premier écran)
  useEffect(() => {
    if (marqueTimerRef.current) {
      clearTimeout(marqueTimerRef.current);
    }

    if (formData.marque.length >= 2 && formData.typeEngin) {
      marqueTimerRef.current = setTimeout(async () => {
        setIsSearchingMarques(true);
        setLoading((prev) => ({ ...prev, rechercheMarques: true }));
        try {
          const response = await rechercherMarques(
            formData.typeEngin,
            formData.marque
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
      if (marqueTimerRef.current) {
        clearTimeout(marqueTimerRef.current);
      }
    };
  }, [formData.marque, formData.typeEngin]);

  // Recherche automatique des couleurs
  useEffect(() => {
    if (couleurTimerRef.current) {
      clearTimeout(couleurTimerRef.current);
    }

    if (formData.couleur.length >= 2 && couleurInputMode === "input") {
      couleurTimerRef.current = setTimeout(async () => {
        setIsSearchingCouleurs(true);
        setLoading((prev) => ({ ...prev, rechercheCouleurs: true }));
        try {
          const response = await rechercherCouleur(formData.couleur);
          if (response.status === "success") {
            setCouleursSuggestions(response.data || []);
            setShowCouleursSuggestions(true);
          }
        } catch (error) {
          console.error("Erreur lors de la recherche des couleurs:", error);
          setCouleursSuggestions([]);
        } finally {
          setIsSearchingCouleurs(false);
          setLoading((prev) => ({ ...prev, rechercheCouleurs: false }));
        }
      }, 300);
    } else {
      setCouleursSuggestions([]);
      setShowCouleursSuggestions(false);
    }

    return () => {
      if (couleurTimerRef.current) {
        clearTimeout(couleurTimerRef.current);
      }
    };
  }, [formData.couleur, couleurInputMode]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Réinitialiser le modèle si la marque change
    if (field === "marque") {
      setFormData((prev) => ({
        ...prev,
        modele: "",
        modeleId: "",
      }));
      setSuggestionsModeles([]);
      setShowSuggestionsModeles(false);
    }

    // Réinitialiser la marque et le modèle si le type d'engin change (adapté du premier écran)
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

    // Vérifier si la couleur existe déjà dans la liste (mode saisie)
    if (field === "couleur" && value && couleurInputMode === "input") {
      const couleurExistante = couleurs.find(
        (c) => c.nom.toLowerCase() === value.toLowerCase()
      );
      if (!couleurExistante && value.length >= 2) {
        setNouvelleCouleurNom(value);
      }
    }

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // AJOUT: Gestion de la sélection de marque (adapté du premier écran)
  const handleMarqueSelect = (marque: MarqueEngin) => {
    setFormData((prev) => ({ 
      ...prev, 
      marque: marque.libelle,
      marqueId: marque.id.toString()
    }));
    setShowMarquesSuggestions(false);
    
    // Réinitialiser le modèle quand on change de marque
    setFormData((prev) => ({ ...prev, modele: "", modeleId: "" }));
    setSuggestionsModeles([]);
    setShowSuggestionsModeles(false);
  };

  // Gestion de la sélection de couleur
  const handleCouleurSelect = (couleur: EnginCouleur) => {
    setFormData((prev) => ({ ...prev, couleur: couleur.nom }));
    setShowCouleursSuggestions(false);
    setCouleurInputMode("select");
  };

  // Gestion de l'ajout d'une nouvelle couleur
  const handleAjouterCouleur = async () => {
    if (!nouvelleCouleurNom.trim()) {
      alert("Veuillez saisir un nom pour la couleur");
      return;
    }

    setLoading((prev) => ({ ...prev, ajoutCouleur: true }));
    try {
      const response = await ajouterCouleur(
        nouvelleCouleurNom,
        nouvelleCouleurCode
      );
      if (response.status === "success") {
        // Recharger la liste des couleurs
        const couleursResponse = await getCouleurs();
        if (couleursResponse.status === "success") {
          setCouleurs(couleursResponse.data || []);
        }

        // Sélectionner la nouvelle couleur
        setFormData((prev) => ({ ...prev, couleur: nouvelleCouleurNom }));
        setCouleurInputMode("select");
        setNouvelleCouleurNom("");
        setNouvelleCouleurCode("#000000");
        setShowCouleursSuggestions(false);

        setMessageErreur("✅ Couleur ajoutée avec succès !");
        setTimeout(() => setMessageErreur(""), 3000);
      } else {
        setMessageErreur(
          response.message || "Erreur lors de l'ajout de la couleur"
        );
        setTimeout(() => setMessageErreur(""), 3000);
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de la couleur:", error);
      setMessageErreur("Erreur réseau lors de l'ajout de la couleur");
      setTimeout(() => setMessageErreur(""), 3000);
    } finally {
      setLoading((prev) => ({ ...prev, ajoutCouleur: false }));
    }
  };

  // Vérification du téléphone en temps réel
  const handleTelephoneChange = async (telephone: string) => {
    setFormData((prev) => ({ ...prev, telephoneAssujetti: telephone }));

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
            const particulier = result.data.particulier;

            // Pré-remplir les champs avec les informations du particulier
            setFormData((prev) => ({
              ...prev,
              nom: particulier.nom || "",
              prenom: particulier.prenom || "",
              email: particulier.email || "",
              adresse: particulier.adresse || "",
              ville: particulier.ville || "",
              province: particulier.province || "",
              nif: particulier.nif || "",
            }));

            setMessageErreur(
              "✅ Informations du particulier chargées avec succès"
            );
            setTimeout(() => setMessageErreur(""), 3000);
          } else {
            // Réinitialiser les champs si aucun particulier trouvé
            setFormData((prev) => ({
              ...prev,
              nom: "",
              prenom: "",
              email: "",
              adresse: "",
              ville: "",
              province: "",
              nif: "",
            }));
          }
        } catch (error) {
          console.error("Erreur lors de la vérification du téléphone:", error);
        } finally {
          setLoading((prev) => ({ ...prev, verificationTelephone: false }));
        }
      }, 800);
    }
  };

  // Recherche des modèles en temps réel
  const handleModeleSearch = async (searchTerm: string) => {
    if (!formData.marqueId || formData.marqueId === "") {
      return;
    }

    if (rechercheModeleTimeoutRef.current) {
      clearTimeout(rechercheModeleTimeoutRef.current);
    }

    if (searchTerm.length >= 2) {
      rechercheModeleTimeoutRef.current = setTimeout(async () => {
        setLoading((prev) => ({ ...prev, rechercheModeles: true }));

        try {
          const result = await rechercherModeles(
            parseInt(formData.marqueId),
            searchTerm
          );

          if (result.status === "success" && result.data) {
            const suggestions = result.data.map((modele: any) => ({
              id: modele.id,
              libelle: modele.libelle,
              description: modele.description,
            }));

            setSuggestionsModeles(suggestions);
            setShowSuggestionsModeles(true);
          } else {
            setSuggestionsModeles([]);
            setShowSuggestionsModeles(false);
          }
        } catch (error) {
          console.error("Erreur lors de la recherche des modèles:", error);
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

  // Sélection d'un modèle
  const handleSelectModele = (modele: any) => {
    setFormData((prev) => ({
      ...prev,
      modele: modele.libelle,
      modeleId: modele.id.toString(),
    }));
    setShowSuggestionsModeles(false);
  };

  // Création d'un nouveau modèle
  const handleCreateModele = async () => {
    if (!formData.modele || !formData.marqueId || formData.marqueId === "") {
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, rechercheModeles: true }));

      const result = await creerModele(
        formData.modele,
        parseInt(formData.marqueId)
      );

      if (result.status === "success" && result.data) {
        const newModele = {
          id: result.data[0]?.id || Date.now(),
          libelle: formData.modele,
          description: "Nouveau modèle créé",
        };

        setFormData((prev) => ({
          ...prev,
          modeleId: newModele.id.toString(),
        }));

        setSuggestionsModeles([newModele, ...suggestionsModeles]);

        setMessageErreur("✅ Modèle créé avec succès");
        setTimeout(() => setMessageErreur(""), 3000);
      }
    } catch (error) {
      console.error("Erreur lors de la création du modèle:", error);
      setMessageErreur("❌ Erreur lors de la création du modèle");
      setTimeout(() => setMessageErreur(""), 3000);
    } finally {
      setLoading((prev) => ({ ...prev, rechercheModeles: false }));
    }
  };

  // Recherche des puissances fiscales en temps réel
  const handlePuissanceSearch = async (searchTerm: string) => {
    if (!formData.typeEngin) {
      return;
    }

    if (recherchePuissanceTimeoutRef.current) {
      clearTimeout(recherchePuissanceTimeoutRef.current);
    }

    if (searchTerm.length >= 1) {
      recherchePuissanceTimeoutRef.current = setTimeout(async () => {
        setLoading((prev) => ({ ...prev, recherchePuissances: true }));

        try {
          const result = await rechercherPuissancesFiscales(
            formData.typeEngin,
            searchTerm
          );

          if (result.status === "success" && result.data) {
            const suggestions = result.data.map((puissance: any) => ({
              id: puissance.id,
              libelle: puissance.libelle,
              valeur: puissance.valeur,
              description: puissance.description,
            }));

            setSuggestionsPuissances(suggestions);
            setShowSuggestionsPuissances(true);
          } else {
            setSuggestionsPuissances([]);
            setShowSuggestionsPuissances(false);
          }
        } catch (error) {
          console.error("Erreur lors de la recherche des puissances:", error);
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

  // Sélection d'une puissance fiscale
  const handleSelectPuissance = (puissance: any) => {
    setFormData((prev) => ({
      ...prev,
      puissanceFiscal: puissance.libelle,
      puissanceFiscalValeur: puissance.valeur?.toString() || "",
    }));
    setShowSuggestionsPuissances(false);
  };

  // Création d'une nouvelle puissance fiscale
  const handleCreatePuissance = async () => {
    if (!formData.puissanceFiscal || !formData.typeEngin) {
      return;
    }

    const valeurMatch = formData.puissanceFiscal.match(/(\d+)/);
    const valeur = valeurMatch ? parseFloat(valeurMatch[1]) : 0;

    if (valeur === 0) {
      setMessageErreur(
        "❌ Veuillez spécifier une valeur numérique pour la puissance"
      );
      setTimeout(() => setMessageErreur(""), 3000);
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, recherchePuissances: true }));

      const result = await creerPuissanceFiscale(
        formData.puissanceFiscal,
        valeur,
        formData.typeEngin,
        `Puissance ${formData.puissanceFiscal}`
      );

      if (result.status === "success" && result.data) {
        const newPuissance = {
          id: result.data[0]?.id || Date.now(),
          libelle: formData.puissanceFiscal,
          valeur: valeur,
          description: "Nouvelle puissance créée",
        };

        setSuggestionsPuissances([newPuissance, ...suggestionsPuissances]);

        setMessageErreur("✅ Puissance fiscale créée avec succès");
        setTimeout(() => setMessageErreur(""), 3000);
      }
    } catch (error) {
      console.error("Erreur lors de la création de la puissance:", error);
      setMessageErreur("❌ Erreur lors de la création de la puissance fiscale");
      setTimeout(() => setMessageErreur(""), 3000);
    } finally {
      setLoading((prev) => ({ ...prev, recherchePuissances: false }));
    }
  };

  // Obtenir les années disponibles pour la circulation
  const getAnneesCirculationDisponibles = () => {
    if (!formData.anneeFabrication) {
      return anneeOptions;
    }
    const anneeFab = parseInt(formData.anneeFabrication);
    return anneeOptions.filter((year) => parseInt(year) >= anneeFab);
  };

  // Dans la fonction handleVerification
  const handleVerification = async () => {
    if (!formData.numeroPlaque.trim()) {
      setErrors({
        numeroPlaque: "Le numéro de plaque est obligatoire",
      });
      return;
    }

    setIsVerifying(true);
    setMessageErreur("");

    try {
      const verificationData: VerificationData = {
        telephone: formData.telephone.trim() || "",
        numeroPlaque: formData.numeroPlaque.trim(),
        utilisateur: utilisateur ? utilisateur.id : 0,
      };

      const result: CarteRoseResponse = await verifierPlaqueTelephone(
        verificationData
      );

      // ANALYSE DES RÉSULTATS
      if (result.status === "success" && result.data) {
        // SUCCÈS : Pas de carte rose existante
        setParticulierInfo(result.data.particulier || null);
        setPlaqueInfo(result.data.plaque || null);

        if (formData.telephone.trim() && result.data.particulier) {
          setShowModalVerification(true);
        } else {
          setEtapeActuelle("formulaire");

          if (result.data.particulier) {
            const particulier = result.data.particulier;
            setFormData((prev) => ({
              ...prev,
              nom: "",
              prenom: "",
              email: "",
              adresse: "",
              ville: "",
              province: "",
              nif: "",
              telephoneAssujetti: "",
            }));

            setMessageErreur("✅ Plaque vérifiée avec succès");
            setTimeout(() => setMessageErreur(""), 3000);
          } else {
            setMessageErreur(
              "✅ Plaque vérifiée. Veuillez compléter les informations."
            );
            setTimeout(() => setMessageErreur(""), 3000);
          }
        }
      }
      // ERREURS BLOQUANTES (on s'arrête là)
      else if (result.status === "error") {
        setEtapeActuelle("verification");

        // Gestion des différents types d'erreurs
        switch (result.type) {
          // Cas 1 : Carte rose déjà existante
          case "carte_existante":
            setShowModalCarteExistante(true);
            setMessageErreur("");
            break;

          // Cas 2 : Conflit avec un autre particulier
          case "conflit_particulier":
            setMessageErreur(
              result.message ||
                "Cette plaque est déjà associée à un autre particulier."
            );
            break;

          // Cas 3 : Erreurs système ou validation
          case "erreur_systeme":
          case "erreur_inattendue":
          case "utilisateur_inexistant":
          case "site_non_affecte":
          case "site_inexistant":
          case "province_manquante":
          case "province_indeterminee":
            setMessageErreur(
              result.message || "Erreur système lors de la vérification."
            );
            break;

          // Cas 4 : Pas trouvé (non bloquant, on peut continuer)
          case "non_trouve":
          case "carte_rose_non_trouvee":
            setEtapeActuelle("formulaire");
            setMessageErreur(
              "⚠️ Aucune carte rose active trouvée. Vous pouvez créer une nouvelle carte."
            );
            setTimeout(() => setMessageErreur(""), 5000);
            break;

          // Erreur par défaut
          default:
            setMessageErreur(
              result.message ||
                "Erreur lors de la vérification des informations."
            );
            break;
        }
      }
      // Cas où result n'a pas de status (format inattendu)
      else {
        console.error("Format de réponse inattendu:", result);
        setMessageErreur("Erreur inattendue du système.");
      }
    } catch (error) {
      console.error("Erreur lors de la vérification:", error);
      setMessageErreur("Erreur lors de la connexion au serveur.");
    } finally {
      setIsVerifying(false);
    }
  };

  const passerAuFormulaire = () => {
    setEtapeActuelle("formulaire");
    setShowModalVerification(false);
  };

  const reinitialiserChampsVerification = () => {
    setFormData((prev) => ({
      ...prev,
      telephone: "",
      numeroPlaque: "",
    }));
    setShowModalCarteExistante(false);
    setMessageErreur("");
  };

  // ÉTAPE 2: Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.nom.trim()) newErrors.nom = "Le nom est obligatoire";
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est obligatoire";
    if (!formData.adresse.trim())
      newErrors.adresse = "L'adresse est obligatoire";
    if (!formData.typeEngin)
      newErrors.typeEngin = "Le type d'engin est obligatoire";
    if (!formData.marque) newErrors.marque = "La marque est obligatoire";
    if (!formData.modele) newErrors.modele = "Le modèle est obligatoire";

    if (
      formData.telephoneAssujetti &&
      formData.telephoneAssujetti.trim() !== ""
    ) {
      const phoneRegex = /^[0-9+\-\s()]{8,}$/;
      const telephoneNettoye = formData.telephoneAssujetti.replace(/\s/g, "");

      if (telephoneNettoye !== "-" && !phoneRegex.test(telephoneNettoye)) {
        newErrors.telephoneAssujetti = "Format de téléphone invalide";
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setShowModalRecap(true);
  };

  // AJOUT: Gestion de la soumission des informations supplémentaires pour la fiche
  const handleSubmitSupplementaire = (suppData: FicheSupplementaire) => {
    setFicheSupplementaire(suppData);
    setShowModalSupplementaire(false);
    setShowFicheIdentification(true);
  };

  // AJOUT: Gestion de l'ouverture de la fiche d'identification
  const handleOpenFicheIdentification = () => {
    setShowModalSupplementaire(true);
  };

  // ÉTAPE 3: Confirmation et soumission finale
  const handleConfirmerSoumission = async () => {
    setIsSubmitting(true);

    try {
      // Vérifier et créer le modèle si nécessaire
      if (formData.modele && formData.marqueId && !formData.modeleId) {
        const modeleResult = await creerModele(
          formData.modele,
          parseInt(formData.marqueId)
        );
        if (modeleResult.status === "success" && modeleResult.data?.[0]?.id) {
          formData.modeleId = modeleResult.data[0].id.toString();
        }
      }

      // Vérifier et créer la puissance fiscale si nécessaire
      if (
        formData.puissanceFiscal &&
        formData.typeEngin &&
        !formData.puissanceFiscalValeur
      ) {
        const valeurMatch = formData.puissanceFiscal.match(/(\d+)/);
        const valeur = valeurMatch ? parseFloat(valeurMatch[1]) : 0;

        if (valeur > 0) {
          const puissanceResult = await creerPuissanceFiscale(
            formData.puissanceFiscal,
            valeur,
            formData.typeEngin
          );
          if (puissanceResult.status === "success") {
            formData.puissanceFiscalValeur = valeur.toString();
          }
        }
      }

      const particulierData: ParticulierData = {
        nom: formData.nom,
        prenom: formData.prenom,
        telephone:
          formData.telephoneAssujetti.trim() !== "" &&
          formData.telephoneAssujetti !== "-"
            ? formData.telephoneAssujetti
            : "",
        email: formData.email,
        adresse: formData.adresse,
        ville: formData.ville,
        code_postal: formData.code_postal,
        province: formData.province,
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

      const result = await soumettreCarteRose(
        impotId,
        particulierData,
        enginData,
        formData.numeroPlaque,
        plaqueInfo?.serie_id || 0,
        plaqueInfo?.serie_item_id || 0,
        plaqueInfo?.id || null,
        utilisateur
      );

      if (result.status === "success" && result.data) {
        const completeData = {
          ...result.data,
          nom: formData.nom,
          prenom: formData.prenom,
          adresse: formData.adresse,
          telephone: formData.telephoneAssujetti,
          type_engin: formData.typeEngin,
          marque: `${formData.marque} ${formData.modele}`,
          energie: formData.energie,
          annee_fabrication: formData.anneeFabrication,
          annee_circulation: formData.anneeCirculation,
          couleur: formData.couleur,
          puissance_fiscal: formData.puissanceFiscal,
          usage_engin: formData.usage,
          numero_chassis: formData.numeroChassis,
          numero_moteur: formData.numeroMoteur,
          numero_plaque: formData.numeroPlaque,
          paiement_id: result.data.paiement_id?.toString() || "000000",
          email: formData.email,
          nif: formData.nif,
        };

        setPrintData(completeData);
        setShowModalRecap(false);
        setEtapeActuelle("previsualisation");
      } else {
        alert(result.message || "Erreur lors de la soumission");
      }
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      alert("Une erreur est survenue lors de la soumission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ÉTAPE 4: Impression
  const handleImprimer = () => {
    setShowPrint(true);
  };

  const handlePrintClose = () => {
    setShowPrint(false);
    // Réinitialiser complètement et retourner à l'étape 1
    setFormData({
      telephone: "",
      numeroPlaque: "",
      nom: "",
      prenom: "",
      telephoneAssujetti: "",
      email: "",
      adresse: "",
      ville: "",
      code_postal: "",
      province: "",
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
    setPlaqueInfo(null);
    setParticulierInfo(null);
    setEtapeActuelle("verification");
    setSuggestionsModeles([]);
    setSuggestionsPuissances([]);
    setShowSuggestionsModeles(false);
    setShowSuggestionsPuissances(false);
    setMarquesSuggestions([]);
    setShowMarquesSuggestions(false);
    setCouleurInputMode("select");
    setNouvelleCouleurNom("");
    setNouvelleCouleurCode("#000000");
    setFicheSupplementaire(null);
  };

  const handleRetourFormulaire = () => {
    setEtapeActuelle("formulaire");
  };

  // Rendu de l'étape de vérification
  const renderEtapeVerification = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <CheckCircle className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Étape 1: Vérification Téléphone & Plaque
          </h2>
          <p className="text-gray-600 text-sm">
            Renseignez le numéro de plaque (le téléphone est facultatif)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        {/* TÉLÉPHONE PARTICULIER - FACULTATIF */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Téléphone Particulier (Facultatif)
          </label>
          <input
            type="tel"
            value={formData.telephone}
            onChange={(e) => handleInputChange("telephone", e.target.value)}
            placeholder="Ex: +243 81 234 5678"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-gray-500 text-xs mt-1">
            Facultatif - Permet de pré-remplir les informations si le
            particulier existe déjà
          </p>
        </div>

        {/* NUMÉRO PLAQUE - OBLIGATOIRE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Numéro de Plaque <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.numeroPlaque}
            onChange={(e) => handleInputChange("numeroPlaque", e.target.value)}
            placeholder="Ex: AB-123-CD"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.numeroPlaque ? "border-red-300" : "border-gray-300"
            }`}
          />
          {errors.numeroPlaque && (
            <p className="text-red-600 text-sm mt-1">{errors.numeroPlaque}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            Obligatoire - Le système vérifie si la plaque est disponible
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <div className="flex items-start">
          <div className="bg-blue-100 p-1 rounded-full mr-3 mt-0.5">
            <CheckCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-blue-700 text-sm font-medium mb-1">
              Comment ça marche :
            </p>
            <ul className="text-blue-600 text-xs list-disc pl-4 space-y-1">
              <li>
                Si vous saisissez un téléphone existant, le système pré-remplit
                automatiquement le formulaire
              </li>
              <li>
                Si vous ne saisissez pas de téléphone, vous pourrez compléter
                toutes les informations manuellement
              </li>
              <li>
                Dans tous les cas, le système vérifie que la plaque est
                disponible
              </li>
            </ul>
          </div>
        </div>
      </div>

      {messageErreur && (
        <div
          className={`mt-4 p-3 rounded-lg border ${
            messageErreur.includes("✅")
              ? "bg-green-50 border-green-200 text-green-700"
              : messageErreur.includes("⚠️")
              ? "bg-yellow-50 border-yellow-200 text-yellow-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <p className="text-sm">{messageErreur}</p>
        </div>
      )}

      <div className="flex justify-end mt-8">
        <button
          type="button"
          onClick={handleVerification}
          disabled={isVerifying}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isVerifying ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Vérification...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Vérifier la plaque et Continuer</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  // AJOUT: Section pour le champ Marque avec auto-complétion
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
            errors.marque
              ? "border-red-300 focus:border-red-500"
              : "border-gray-300 focus:border-blue-500"
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
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm text-gray-600">
            Aucune marque trouvée. La marque sera créée automatiquement
            lors de la soumission.
          </div>
        )}
      
      {errors.marque && (
        <p className="text-red-600 text-sm mt-1 font-medium">
          {errors.marque}
        </p>
      )}
      
      {!formData.typeEngin && (
        <p className="text-blue-600 text-xs mt-1">
          Veuillez d'abord sélectionner le type d'engin
        </p>
      )}
    </div>
  );

  // Section pour le champ Couleur avec auto-complétion
  const renderSectionCouleur = () => (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Couleur
      </label>

      <div className="flex space-x-2 mb-2">
        <button
          type="button"
          onClick={() => setCouleurInputMode("select")}
          className={`px-3 py-1 text-sm rounded-lg transition-all ${
            couleurInputMode === "select"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Liste
        </button>
        <button
          type="button"
          onClick={() => setCouleurInputMode("input")}
          className={`px-3 py-1 text-sm rounded-lg transition-all ${
            couleurInputMode === "input"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Saisir
        </button>
      </div>

      {couleurInputMode === "select" ? (
        <div className="relative">
          <select
            value={formData.couleur}
            onChange={(e) => handleInputChange("couleur", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            disabled={loading.couleurs}
          >
            <option value="">Sélectionner la couleur</option>
            {couleurs.map((couleur) => (
              <option key={couleur.id} value={couleur.nom}>
                {couleur.nom}
              </option>
            ))}
          </select>
          {loading.couleurs && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={formData.couleur}
            onChange={(e) => handleInputChange("couleur", e.target.value)}
            placeholder="Saisissez la couleur (auto-complétion)"
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all pr-10"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isSearchingCouleurs ? (
              <Loader className="w-4 h-4 animate-spin text-gray-400" />
            ) : (
              <Search className="w-4 h-4 text-gray-400" />
            )}
          </div>

          {showCouleursSuggestions && couleursSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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

          {showCouleursSuggestions &&
            couleursSuggestions.length === 0 &&
            formData.couleur.length >= 2 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
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
                  <button
                    type="button"
                    onClick={handleAjouterCouleur}
                    disabled={
                      loading.ajoutCouleur || !nouvelleCouleurNom.trim()
                    }
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {loading.ajoutCouleur ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>Ajouter cette couleur</span>
                  </button>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );

  // Rendu de l'étape formulaire
  const renderEtapeFormulaire = () => (
    <form onSubmit={handleSubmitForm} className="space-y-8">
      {/* AFFICHAGE DES INFOS VÉRIFIÉES */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            Informations Vérifiées
          </h3>
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            Validé
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Téléphone vérifié:</span>
            <div className="text-gray-700 font-medium">
              {formData.telephone || "Non fourni"}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Numéro Plaque vérifié:</span>
            <div className="text-gray-700 font-medium">
              {formData.numeroPlaque}
            </div>
          </div>
          {particulierInfo && (
            <div className="md:col-span-2">
              <span className="text-gray-500">
                Particulier existant trouvé:
              </span>
              <div className="text-gray-700 font-medium">
                {particulierInfo.nom} {particulierInfo.prenom}
              </div>
            </div>
          )}
        </div>
      </div>

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
          {/* TÉLÉPHONE - FACULTATIF */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de téléphone
            </label>
            <div className="relative">
              <input
                type="tel"
                value={formData.telephoneAssujetti}
                onChange={(e) => handleTelephoneChange(e.target.value)}
                onBlur={() => setMessageErreur("")}
                placeholder="Ex: +243 81 234 5678 (Facultatif)"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.telephoneAssujetti
                    ? "border-red-300"
                    : "border-gray-300"
                }`}
              />
              {loading.verificationTelephone && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {errors.telephoneAssujetti && (
              <p className="text-red-600 text-sm mt-1">
                {errors.telephoneAssujetti}
              </p>
            )}
            <p className="text-blue-600 text-xs mt-1">
              Facultatif - Le système vérifie automatiquement si ce téléphone
              existe déjà
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ADRESSE */}
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
              placeholder="NIF du particulier"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* VILLE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ville
            </label>
            <input
              type="text"
              value={formData.ville}
              onChange={(e) => handleInputChange("ville", e.target.value)}
              placeholder="Entrez votre ville"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* CODE POSTAL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code Postal
            </label>
            <input
              type="text"
              value={formData.code_postal}
              onChange={(e) => handleInputChange("code_postal", e.target.value)}
              placeholder="Entrez votre code postal"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* PROVINCE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Province
            </label>
            <input
              type="text"
              value={formData.province}
              onChange={(e) => handleInputChange("province", e.target.value)}
              placeholder="Entrez votre province"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION ENGIN */}
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
          {/* Type d'engin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'engin <span className="text-red-500">*</span>
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
                <option value="">Sélectionner le type d'engin</option>
                {typeEngins.map((typeEngin) => (
                  <option key={typeEngin.id} value={typeEngin.libelle}>
                    {typeEngin.libelle}
                  </option>
                ))}
              </select>
              {loading.typeEngins && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {errors.typeEngin && (
              <p className="text-red-600 text-sm mt-1">{errors.typeEngin}</p>
            )}
          </div>

          {/* Marque - AJOUT: Auto-complétion adaptée du premier écran */}
          {renderSectionMarque()}

          {/* Modèle - Auto-complétion */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modèle <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.modele}
                onChange={(e) => {
                  handleInputChange("modele", e.target.value);
                  handleModeleSearch(e.target.value);
                }}
                onFocus={() => {
                  if (formData.modele && formData.marqueId) {
                    handleModeleSearch(formData.modele);
                  }
                }}
                placeholder="Saisissez le modèle"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.modele ? "border-red-300" : "border-gray-300"
                }`}
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
            {errors.modele && (
              <p className="text-red-600 text-sm mt-1">{errors.modele}</p>
            )}

            {/* Suggestions de modèles */}
            {showSuggestionsModeles && suggestionsModeles.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {suggestionsModeles.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleSelectModele(suggestion)}
                  >
                    <div className="font-medium">{suggestion.libelle}</div>
                    {suggestion.description && (
                      <div className="text-xs text-gray-500">
                        {suggestion.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {formData.marqueId && !formData.modeleId && (
              <p className="text-amber-600 text-xs mt-1">
                Saisissez le modèle. S'il n'existe pas, cliquez sur{" "}
                <Plus className="w-3 h-3 inline" /> pour le créer.
              </p>
            )}
          </div>

          {/* Énergie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Énergie
            </label>
            <div className="relative">
              <select
                value={formData.energie}
                onChange={(e) => handleInputChange("energie", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Année de fabrication */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année de fabrication
            </label>
            <select
              value={formData.anneeFabrication}
              onChange={(e) =>
                handleInputChange("anneeFabrication", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année de circulation
            </label>
            <select
              value={formData.anneeCirculation}
              onChange={(e) =>
                handleInputChange("anneeCirculation", e.target.value)
              }
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
              {getAnneesCirculationDisponibles().map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.anneeCirculation && (
              <p className="text-red-600 text-sm mt-1">
                {errors.anneeCirculation}
              </p>
            )}
            {formData.anneeFabrication && (
              <p className="text-blue-600 text-xs mt-1">
                Années disponibles à partir de {formData.anneeFabrication}
              </p>
            )}
          </div>

          {/* Couleur */}
          {renderSectionCouleur()}

          {/* Puissance Fiscal - Auto-complétion */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Puissance Fiscal
            </label>
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

            {/* Suggestions de puissances */}
            {showSuggestionsPuissances && suggestionsPuissances.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {suggestionsPuissances.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleSelectPuissance(suggestion)}
                  >
                    <div className="font-medium">{suggestion.libelle}</div>
                    {suggestion.valeur && (
                      <div className="text-xs text-gray-500">
                        {suggestion.valeur} CV
                      </div>
                    )}
                    {suggestion.description && (
                      <div className="text-xs text-gray-500">
                        {suggestion.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {formData.typeEngin && (
              <p className="text-blue-600 text-xs mt-1">
                Saisissez la puissance (ex: 10 CV). Système intelligent de
                recherche.
              </p>
            )}
          </div>

          {/* Usage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usage
            </label>
            <div className="relative">
              <select
                value={formData.usage}
                onChange={(e) => handleInputChange("usage", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Numéro de châssis */}
          <div>
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

          {/* Numéro de moteur */}
          <div>
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

      {/* MESSAGE D'ERREUR GLOBAL */}
      {messageErreur && (
        <div
          className={`p-3 rounded-lg border ${
            messageErreur.includes("✅")
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <p className="text-sm">{messageErreur}</p>
        </div>
      )}

      {/* BOUTONS NAVIGATION */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setEtapeActuelle("verification")}
          className="flex items-center space-x-2 px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la vérification</span>
        </button>

        <button
          type="submit"
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Save className="w-4 h-4" />
          <span>Valider et Continuer</span>
        </button>
      </div>
    </form>
  );

  // AJOUT: Rendu de l'étape prévisualisation avec bouton pour la fiche
  const renderEtapePrevisualisation = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-green-100 p-2 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Carte Rose Prête à Être Imprimée
          </h2>
          <p className="text-gray-600 text-sm">
            La carte rose a été enregistrée avec succès dans le système
          </p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-800 mb-2">
            Carte Rose Validée
          </h3>
          <p className="text-green-700">
            La carte rose pour le véhicule{" "}
            <strong>{formData.numeroPlaque}</strong> a été délivrée avec succès.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-3">
            Options d'impression
          </h4>
          <p className="text-blue-700 text-sm mb-4">
            Choisissez le type de document que vous souhaitez imprimer :
          </p>
          <ul className="space-y-2 text-blue-600">
            <li className="flex items-center">
              <Printer className="w-4 h-4 mr-2" />
              <span>Carte rose officielle (format carte)</span>
            </li>
            <li className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              <span>Fiche d'identification complète (format A4)</span>
            </li>
          </ul>
        </div>

        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <h4 className="font-semibold text-amber-800 mb-3">
            À propos de la fiche d'identification
          </h4>
          <ul className="space-y-2 text-amber-700 text-sm">
            <li>• Document A4 sécurisé avec QR Code</li>
            <li>• Validité de 45 jours non renouvelable</li>
            <li>• Informations complètes du propriétaire</li>
            <li>• Caractéristiques techniques du véhicule</li>
            <li>• Tenant lieu de carte rose provisoire</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={handleRetourFormulaire}
          className="flex items-center space-x-2 px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au Formulaire</span>
        </button>

        <button
          onClick={handleOpenFicheIdentification}
          className="flex items-center space-x-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
        >
          <FileText className="w-4 h-4" />
          <span>Générer la Fiche d'Identification</span>
        </button>

        <button
          onClick={handleImprimer}
          className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimer la Carte Rose</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* MODAL VÉRIFICATION RÉUSSIE */}
      {showModalVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6">
              <h3 className="font-bold text-lg mb-4 text-green-600">
                ✅ Vérification Réussie
              </h3>

              <div className="space-y-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">
                    Particulier Trouvé
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-600">Nom:</span>
                      <span className="font-medium">
                        {particulierInfo?.nom} {particulierInfo?.prenom}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Téléphone:</span>
                      <span className="font-medium">
                        {particulierInfo?.telephone}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Adresse:</span>
                      <span className="font-medium">
                        {particulierInfo?.adresse}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-400 text-center">
                  <div className="text-blue-800 text-sm mb-2">
                    Plaque vérifiée et disponible
                  </div>
                  <div className="text-3xl font-bold text-blue-700 bg-white py-3 px-6 rounded-lg border-2 border-blue-500">
                    {formData.numeroPlaque}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowModalVerification(false)}
                  className="px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={passerAuFormulaire}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Passer au Formulaire</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CARTE ROSE EXISTANTE */}
      {showModalCarteExistante && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <X className="w-6 h-6 text-red-500" />
                <h3 className="font-bold text-lg text-red-600">
                  Carte Rose Déjà Délivrée
                </h3>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-red-700">
                    Une carte rose a déjà été délivrée pour cette plaque.
                    Impossible de procéder à une nouvelle délivrance.
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">
                    Informations de la carte rose existante:
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-yellow-600">Propriétaire:</span>
                      <span className="font-medium">
                        Nom du propriétaire existant
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-600">Téléphone:</span>
                      <span className="font-medium">Téléphone existant</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-600">Plaque:</span>
                      <span className="font-medium">
                        {formData.numeroPlaque}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={reinitialiserChampsVerification}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Compris
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RÉCAPITULATIF AVANT SOUMISSION */}
      {showModalRecap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="font-bold text-lg mb-6">Confirmation Finale</h3>

              <div className="space-y-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3">
                    Récapitulatif de la Carte Rose
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600">Plaque:</span>
                      <div className="font-medium text-lg text-blue-800">
                        {formData.numeroPlaque}
                      </div>
                    </div>
                    <div>
                      <span className="text-blue-600">Propriétaire:</span>
                      <div className="font-medium">
                        {formData.nom} {formData.prenom}
                      </div>
                    </div>
                    <div>
                      <span className="text-blue-600">Marque:</span>
                      <div className="font-medium">{formData.marque}</div>
                    </div>
                    <div>
                      <span className="text-blue-600">Modèle:</span>
                      <div className="font-medium">{formData.modele}</div>
                    </div>
                    <div>
                      <span className="text-blue-600">Couleur:</span>
                      <div className="font-medium">{formData.couleur}</div>
                    </div>
                    <div>
                      <span className="text-blue-600">Puissance:</span>
                      <div className="font-medium">
                        {formData.puissanceFiscal}
                      </div>
                    </div>
                    <div>
                      <span className="text-blue-600">Téléphone:</span>
                      <div className="font-medium">
                        {formData.telephoneAssujetti || "Non fourni"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">
                    ⚠️ Confirmation Requise
                  </h4>
                  <p className="text-yellow-700 text-sm">
                    Voulez-vous confirmer la délivrance de cette carte rose ?
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
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Traitement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirmer la Délivrance</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POUR COMPLÉTER LES INFORMATIONS SUPPLÉMENTAIRES */}
      <ModalSupplementaire
        isOpen={showModalSupplementaire}
        onClose={() => setShowModalSupplementaire(false)}
        onSubmit={handleSubmitSupplementaire}
        defaultAdresse={formData.adresse}
      />

      {/* COMPOSANT D'IMPRESSION DE LA CARTE ROSE */}
      {showPrint && printData && (
        <CarteRosePrint
          data={printData}
          isOpen={showPrint}
          onClose={handlePrintClose}
        />
      )}

      {/* COMPOSANT D'IMPRESSION DE LA FICHE D'IDENTIFICATION */}
      {showFicheIdentification && printData && (
        <FicheIdentificationPrint
          data={{
            ...printData,
            date_immatriculation: new Date().toISOString().split("T")[0],
          }}
          supplementaire={ficheSupplementaire || undefined}
          isOpen={showFicheIdentification}
          onClose={() => setShowFicheIdentification(false)}
        />
      )}

      {/* RENDU PRINCIPAL SELON L'ÉTAPE */}
      {etapeActuelle === "verification" && renderEtapeVerification()}
      {etapeActuelle === "formulaire" && renderEtapeFormulaire()}
      {etapeActuelle === "previsualisation" && renderEtapePrevisualisation()}
    </>
  );
}