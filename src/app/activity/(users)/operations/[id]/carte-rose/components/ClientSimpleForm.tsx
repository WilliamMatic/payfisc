"use client";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  verifierPlaqueTelephone,
  soumettreCarteRose,
  type VerificationData,
  type ParticulierData,
  type EnginData,
  type CarteRoseResponse,
} from "@/services/carte-rose/carteRoseService";
import CarteRosePrint from "./CarteRosePrint";

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
  getMarquesEngins,
  getModelesEngins,
  type MarqueEngin,
  type ModeleEngin,
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

  // Informations de l'engin
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
}

interface MarqueAvecModeles {
  marque: MarqueEngin;
  modeles: ModeleEngin[];
}

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
  });

  // États pour les données dynamiques (comme dans le screen 2)
  const [typeEngins, setTypeEngins] = useState<TypeEngin[]>([]);
  const [energies, setEnergies] = useState<Energie[]>([]);
  const [couleurs, setCouleurs] = useState<EnginCouleur[]>([]);
  const [usages, setUsages] = useState<UsageEngin[]>([]);
  const [marques, setMarques] = useState<MarqueEngin[]>([]);
  const [modeles, setModeles] = useState<ModeleEngin[]>([]);
  const [marquesAvecModeles, setMarquesAvecModeles] = useState<
    MarqueAvecModeles[]
  >([]);
  const [puissancesFiscales, setPuissancesFiscales] = useState<
    PuissanceFiscale[]
  >([]);
  const [filteredPuissances, setFilteredPuissances] = useState<
    PuissanceFiscale[]
  >([]);

  // États de chargement
  const [loading, setLoading] = useState({
    typeEngins: false,
    energies: false,
    couleurs: false,
    usages: false,
    marques: false,
    modeles: false,
    puissances: false,
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

  // Générer les options d'années (comme dans le screen 2)
  const anneeOptions = Array.from({ length: 30 }, (_, i) =>
    (2025 - i).toString()
  );

  // Chargement des données initiales (comme dans le screen 2)
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

        // Charger toutes les marques
        setLoading((prev) => ({ ...prev, marques: true }));
        const marquesResponse = await getMarquesEngins();
        if (marquesResponse.status === "success") {
          setMarques(marquesResponse.data || []);
        }

        // Charger tous les modèles
        setLoading((prev) => ({ ...prev, modeles: true }));
        const modelesResponse = await getModelesEngins();
        if (modelesResponse.status === "success") {
          setModeles(modelesResponse.data || []);
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
          marques: false,
          modeles: false,
          puissances: false,
        });
      }
    };

    loadInitialData();
  }, []);

  // Organiser les marques avec leurs modèles
  useEffect(() => {
    if (marques.length > 0 && modeles.length > 0) {
      const marquesAvecModeles = marques
        .filter((marque) => marque.actif)
        .map((marque) => ({
          marque,
          modeles: modeles.filter(
            (modele) => modele.marque_engin_id === marque.id && modele.actif
          ),
        }))
        .filter((item) => item.modeles.length > 0); // Ne garder que les marques qui ont des modèles

      setMarquesAvecModeles(marquesAvecModeles);
    }
  }, [marques, modeles]);

  // Filtrer les puissances quand le type d'engin change (comme dans le screen 2)
  useEffect(() => {
    if (formData.typeEngin) {
      // Filtrer les puissances fiscales par libellé du type d'engin
      const puissancesFiltrees = puissancesFiscales.filter(
        (puissance) => puissance.type_engin_libelle === formData.typeEngin
      );
      setFilteredPuissances(puissancesFiltrees);

      // Réinitialiser les sélections dépendantes
      setFormData((prev) => ({
        ...prev,
        marque: "",
        modele: "",
        puissanceFiscal: "",
      }));
    } else {
      setFilteredPuissances([]);
      setFormData((prev) => ({
        ...prev,
        marque: "",
        modele: "",
        puissanceFiscal: "",
      }));
    }
  }, [formData.typeEngin, puissancesFiscales]);

  // Réinitialiser l'année de circulation si l'année de fabrication change (comme dans le screen 2)
  useEffect(() => {
    if (formData.anneeFabrication && formData.anneeCirculation) {
      const anneeFab = parseInt(formData.anneeFabrication);
      const anneeCirc = parseInt(formData.anneeCirculation);

      if (anneeCirc < anneeFab) {
        setFormData((prev) => ({ ...prev, anneeCirculation: "" }));
      }
    }
  }, [formData.anneeFabrication]);

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
      }));
    }

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Obtenir les années disponibles pour la circulation (comme dans le screen 2)
  const getAnneesCirculationDisponibles = () => {
    if (!formData.anneeFabrication) {
      return anneeOptions;
    }
    const anneeFab = parseInt(formData.anneeFabrication);
    return anneeOptions.filter((year) => parseInt(year) >= anneeFab);
  };

  // ÉTAPE 1: Vérification du téléphone et plaque
  const handleVerification = async () => {
    if (!formData.telephone.trim() || !formData.numeroPlaque.trim()) {
      setErrors({
        telephone: !formData.telephone.trim()
          ? "Le téléphone est obligatoire"
          : undefined,
        numeroPlaque: !formData.numeroPlaque.trim()
          ? "Le numéro de plaque est obligatoire"
          : undefined,
      });
      return;
    }

    setIsVerifying(true);
    setMessageErreur("");

    try {
      const verificationData: VerificationData = {
        telephone: formData.telephone,
        numeroPlaque: formData.numeroPlaque,
      };

      const result: CarteRoseResponse = await verifierPlaqueTelephone(
        verificationData
      );

      if (result.status === "success" && result.data) {
        // Cas 1: Vérification réussie - particulier existant
        setParticulierInfo(result.data.particulier || null);
        setPlaqueInfo(result.data.plaque || null);
        setShowModalVerification(true);
      } else if (result.type === "carte_existante" && result.data) {
        // Cas 2: Carte rose déjà délivrée
        setShowModalCarteExistante(true);
      } else {
        // Cas 3: Aucun enregistrement trouvé
        setMessageErreur(result.message || "Aucun enregistrement trouvé.");
      }
    } catch (error) {
      console.error("Erreur lors de la vérification:", error);
      setMessageErreur("Erreur lors de la vérification des informations.");
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
    if (!formData.telephoneAssujetti.trim())
      newErrors.telephoneAssujetti = "Le téléphone est obligatoire";
    if (!formData.adresse.trim())
      newErrors.adresse = "L'adresse est obligatoire";
    if (!formData.typeEngin)
      newErrors.typeEngin = "Le type d'engin est obligatoire";
    if (!formData.marque) newErrors.marque = "La marque est obligatoire";

    const phoneRegex = /^[0-9+\-\s()]{8,}$/;
    if (
      formData.telephoneAssujetti &&
      !phoneRegex.test(formData.telephoneAssujetti.replace(/\s/g, ""))
    ) {
      newErrors.telephoneAssujetti = "Format de téléphone invalide";
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    // Validation des années (comme dans le screen 2)
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

    // Afficher le modal récapitulatif
    setShowModalRecap(true);
  };

  // ÉTAPE 3: Confirmation et soumission finale
  const handleConfirmerSoumission = async () => {
    setIsSubmitting(true);

    try {
      // SÉPARER LA MARQUE ET LE MODÈLE
      const [marque, modele] = formData.marque.split("|");

      const particulierData: ParticulierData = {
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephoneAssujetti,
        email: formData.email,
        adresse: formData.adresse,
        ville: formData.ville,
        code_postal: formData.code_postal,
        province: formData.province,
      };

      const enginData: EnginData = {
        typeEngin: formData.typeEngin,
        marque: marque, // Juste la marque
        modele: modele, // Juste le modèle
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
        // Préparer les données pour l'impression - CORRECTION ICI
        const marqueComplete = `${marque} ${modele}`; // Marque + Modèle avec espace

        const completeData = {
          ...result.data,
          nom: formData.nom,
          prenom: formData.prenom,
          adresse: formData.adresse,
          telephone: formData.telephoneAssujetti,
          type_engin: formData.typeEngin,
          marque: marqueComplete, // Marque complète avec modèle
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
    });
    setPlaqueInfo(null);
    setParticulierInfo(null);
    setEtapeActuelle("verification");
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
            Renseignez le téléphone du particulier et le numéro de plaque
            attribué
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        {/* TÉLÉPHONE PARTICULIER */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Téléphone Particulier <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.telephone}
            onChange={(e) => handleInputChange("telephone", e.target.value)}
            placeholder="Ex: +243 81 234 5678"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.telephone ? "border-red-300" : "border-gray-300"
            }`}
          />
          {errors.telephone && (
            <p className="text-red-600 text-sm mt-1">{errors.telephone}</p>
          )}
        </div>

        {/* NUMÉRO PLAQUE */}
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
        </div>
      </div>

      {messageErreur && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{messageErreur}</p>
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
              <span>Vérifier et Continuer</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Rendu de l'étape formulaire - SECTION ENGIN ADAPTÉE DU SCREEN 2
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
              {formData.telephone}
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

          {/* TÉLÉPHONE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro de téléphone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.telephoneAssujetti}
              onChange={(e) =>
                handleInputChange("telephoneAssujetti", e.target.value)
              }
              placeholder="Entrez votre numéro de téléphone"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.telephoneAssujetti ? "border-red-300" : "border-gray-300"
              }`}
            />
            {errors.telephoneAssujetti && (
              <p className="text-red-600 text-sm mt-1">
                {errors.telephoneAssujetti}
              </p>
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

      {/* SECTION ENGIN - AVEC MARQUES ET MODÈLES GROUPÉS */}
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

          {/* Marque et Modèle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marque <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={formData.marque}
                onChange={(e) => handleInputChange("marque", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.marque ? "border-red-300" : "border-gray-300"
                }`}
                disabled={loading.marques || !formData.typeEngin}
              >
                <option value="">
                  {!formData.typeEngin
                    ? "Sélectionnez d'abord le type d'engin"
                    : "Sélectionner la marque"}
                </option>
                {marquesAvecModeles
                  .filter(
                    (item) =>
                      item.marque.type_engin_libelle === formData.typeEngin
                  )
                  .map((item) => (
                    <optgroup key={item.marque.id} label={item.marque.libelle}>
                      {item.modeles.map((modele) => (
                        <option
                          key={modele.id}
                          value={`${item.marque.libelle}|${modele.libelle}`}
                        >
                          {modele.libelle}
                        </option>
                      ))}
                    </optgroup>
                  ))}
              </select>
              {loading.marques && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {errors.marque && (
              <p className="text-red-600 text-sm mt-1">{errors.marque}</p>
            )}
            {formData.typeEngin &&
              marquesAvecModeles.filter(
                (item) => item.marque.type_engin_libelle === formData.typeEngin
              ).length === 0 &&
              !loading.marques && (
                <p className="text-amber-600 text-sm mt-1">
                  Aucune marque avec modèles disponible pour ce type d'engin
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur
            </label>
            <div className="relative">
              <select
                value={formData.couleur}
                onChange={(e) => handleInputChange("couleur", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Puissance Fiscal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Puissance Fiscal
            </label>
            <div className="relative">
              <select
                value={formData.puissanceFiscal}
                onChange={(e) =>
                  handleInputChange("puissanceFiscal", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading.puissances || !formData.typeEngin}
              >
                <option value="">
                  {!formData.typeEngin
                    ? "Sélectionnez d'abord le type d'engin"
                    : "Sélectionner la puissance"}
                </option>
                {filteredPuissances.map((puissance) => (
                  <option key={puissance.id} value={puissance.libelle}>
                    {puissance.libelle} ({puissance.valeur} CV)
                  </option>
                ))}
              </select>
              {loading.puissances && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {formData.typeEngin &&
              filteredPuissances.length === 0 &&
              !loading.puissances && (
                <p className="text-amber-600 text-sm mt-1">
                  Aucune puissance disponible pour ce type d'engin
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

  // Rendu de l'étape prévisualisation
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

      <div className="flex justify-center space-x-4">
        <button
          onClick={handleRetourFormulaire}
          className="flex items-center space-x-2 px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au Formulaire</span>
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
                      <div className="font-medium">
                        {formData.marque.split("|")[0]}
                      </div>
                    </div>
                    <div>
                      <span className="text-blue-600">Modèle:</span>
                      <div className="font-medium">
                        {formData.marque.split("|")[1] || "Non spécifié"}
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

      {/* COMPOSANT D'IMPRESSION */}
      {showPrint && printData && (
        <CarteRosePrint
          data={printData}
          isOpen={showPrint}
          onClose={handlePrintClose}
        />
      )}

      {/* RENDU PRINCIPAL SELON L'ÉTAPE */}
      {etapeActuelle === "verification" && renderEtapeVerification()}
      {etapeActuelle === "formulaire" && renderEtapeFormulaire()}
      {etapeActuelle === "previsualisation" && renderEtapePrevisualisation()}
    </>
  );
}
