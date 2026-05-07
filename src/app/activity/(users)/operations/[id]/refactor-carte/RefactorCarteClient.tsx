"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, User, Car, Hash, Lock, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { getImpotById, Impot } from "@/services/impots/impotService";

import {
  verifierIdDGRK,
  traiterRefactor,
  type DonneesRefactor,
} from "@/services/refactor/refactorService";
import {
  verifierChassis,
  type ChassisVerificationResponse,
} from "@/services/carte-rose/carteRoseService";
import ModalChassisExistant from "@/app/_components/shared/ModalChassisExistant";
import { getTauxActif, type Taux } from "@/services/taux/tauxService";
import RefactorPrint from "./RefactorPrint";
import { useAuth } from "@/contexts/AuthContext";
import { parseAndNormalizePrivileges } from '@/utils/normalizePrivileges';

// Import des services pour les types d'engins seulement
import {
  getTypeEnginsActifs,
  type TypeEngin,
} from "@/services/type-engins/typeEnginService";

import { type Etape, type RefactorFormData } from "./components/types";
import SuccessModal from "./components/modals/SuccessModal";
import PageHeader from "./components/PageHeader";
import EtapeVerification from "./components/EtapeVerification";
import EtapeConfirmation from "./components/EtapeConfirmation";

const EMPTY_FORM: RefactorFormData = {
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
};

export default function RefactorCarteClient() {
  const router = useRouter();
  const params = useParams();
  const [impot, setImpot] = useState<Impot | null>(null);
  const [etapeActuelle, setEtapeActuelle] = useState<Etape>("verification");
  const [idDGRK, setIdDGRK] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [donneesRefactor, setDonneesRefactor] =
    useState<DonneesRefactor | null>(null);
  const [erreurVerification, setErreurVerification] = useState("");
  const [successData, setSuccessData] = useState<any>(null);
  const [printData, setPrintData] = useState<any>(null);

  // États pour le taux
  const [tauxActif, setTauxActif] = useState<Taux | null>(null);
  const [loadingTaux, setLoadingTaux] = useState(false);

  // États pour les types d'engins seulement
  const [typeEngins, setTypeEngins] = useState<TypeEngin[]>([]);

  const [formData, setFormData] = useState<RefactorFormData>(EMPTY_FORM);

  // Vérification du numéro de châssis
  const [showModalChassisExistant, setShowModalChassisExistant] = useState(false);
  const [chassisExistantData, setChassisExistantData] =
    useState<ChassisVerificationResponse["data"]>(null);
  const [chassisConfirme, setChassisConfirme] = useState(false);
  const [verificationChassisLoading, setVerificationChassisLoading] = useState(false);

  const { utilisateur, isLoading: authLoading } = useAuth();
  const [parsedPrivileges, setParsedPrivileges] = useState<any>(null);

  // Parser les privilèges quand utilisateur change
  useEffect(() => {
    if (utilisateur?.privileges_include) {
      try {
        const parsed = parseAndNormalizePrivileges(utilisateur.privileges_include);
        setParsedPrivileges(parsed);
      } catch (error) {
        console.error("Erreur parsing privileges:", error);
        setParsedPrivileges({});
      }
    } else if (utilisateur) {
      setParsedPrivileges({});
    }
  }, [utilisateur]);

  // Charger l'impôt au montage du composant
  // Problème : params.id pourrait être undefined ou mal formaté
  useEffect(() => {
    const chargerImpot = async () => {
      if (params.id) {
        console.log("Tentative de chargement de l'impôt avec ID:", params.id); // AJOUTER CE LOG
        try {
          const impotResponse = await getImpotById(params.id as string);
          console.log("Réponse reçue:", impotResponse); // AJOUTER CE LOG
          if (impotResponse.status === "success" && impotResponse.data) {
            setImpot(impotResponse.data);
          } else {
            console.error("Réponse non réussie:", impotResponse);
          }
        } catch (error) {
          console.error("Erreur lors du chargement de l'impôt:", error);
        }
      } else {
        console.log("params.id est undefined"); // AJOUTER CE LOG
      }
    };

    chargerImpot();
  }, [params.id]);

  // Calcul des montants avec taux - avec vérification de l'impôt
  const montantDollars = impot ? impot.prix.toString() : "0";
  const montantFrancs =
    tauxActif && impot
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
          impot_id: Number(params.id),
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

  // Chargement des types d'engins seulement
  useEffect(() => {
    const loadTypeEngins = async () => {
      try {
        const typeEnginsResponse = await getTypeEnginsActifs();
        if (typeEnginsResponse.status === "success") {
          setTypeEngins(typeEnginsResponse.data || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des types d'engins:", error);
      }
    };

    loadTypeEngins();
  }, []);

  // Récupération des données depuis la base via ID DGRK
  const recupererDonneesDGRK = async (idDGRK: string, user: string) => {
    setIsLoading(true);
    setErreurVerification("");

    try {
      // Utiliser site_code au lieu de site_nom
      const result = await verifierIdDGRK(
        idDGRK,
        utilisateur?.site_code || "",
      );

      if (result.status === "error") {
        setErreurVerification(
          result.message || "Erreur lors de la vérification",
        );
        return;
      }

      const donnees = result.data as DonneesRefactor;
      setDonneesRefactor(donnees);

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
        setDonneesRefactor((prev) =>
          prev
            ? { ...prev, source: result.source }
            : { ...donnees, source: result.source },
        );
      }

      setEtapeActuelle("confirmation");
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      setErreurVerification(
        "Erreur lors de la récupération des informations DGRK.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = () => {
    if (!idDGRK.trim()) {
      setErreurVerification("Veuillez saisir l'identifiant DGRK");
      return;
    }

    recupererDonneesDGRK(
      idDGRK,
      utilisateur ? utilisateur.site_nom.toString() : "",
    );
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (field === "numeroChassis" && chassisConfirme) {
      setChassisConfirme(false);
    }
  };

  // Vérification du numéro de châssis au blur
  const handleChassisBlur = async () => {
    const chassis = formData.numeroChassis.trim();
    if (!chassis || chassis.length < 3) return;
    if (chassisConfirme) return;

    // Pour la source 'locale' (refactor MPAKO), on exclut l'engin courant
    const enginIdExclu =
      donneesRefactor?.source === "locale" ? donneesRefactor?.engin_id : null;

    setVerificationChassisLoading(true);
    try {
      const result = await verifierChassis(
        chassis,
        utilisateur?.id,
        enginIdExclu,
      );
      if (result.status === "success" && result.data) {
        setChassisExistantData(result.data);
        setShowModalChassisExistant(true);
      }
    } catch (error) {
      console.error("Erreur vérification châssis:", error);
    } finally {
      setVerificationChassisLoading(false);
    }
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
        },
        donneesRefactor?.source, // Passer la source
        utilisateur?.site_code, // Ajouter le site_code ici
        donneesRefactor?.carte_reprint_id, // Identifiant carte_reprint si source = carte_reprint
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
          montant:
            donneesRefactor?.source === "externe" ||
            donneesRefactor?.source === "carte_reprint"
              ? "0"
              : donneesRefactor?.montant?.toString() || "0",
          date_jour: new Date().toLocaleDateString("fr-FR"),
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

  const resetForm = () => {
    setEtapeActuelle("verification");
    setIdDGRK("");
    setFormData(EMPTY_FORM);
    setChassisConfirme(false);
    setChassisExistantData(null);
    setShowModalChassisExistant(false);
  };

  // Afficher un écran de chargement pendant le chargement de l'impôt
  if (!impot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-[15px] font-semibold text-gray-900 mb-2">
            Chargement du service...
          </h2>
          <p className="text-[13px] text-gray-600">
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
          <h2 className="text-[15px] font-semibold text-gray-900 mb-2">
            Chargement...
          </h2>
          <p className="text-[13px] text-gray-600">
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
          <h2 className="text-[15px] font-semibold text-gray-900 mb-2">
            Session expirée
          </h2>
          <p className="text-[13px] text-gray-600 mb-6">
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

  // Vérifier si l'utilisateur a le privilège "correctionErreur"
  if (!parsedPrivileges?.ventePlaque?.correctionErreur) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-[15px] font-semibold text-gray-900 mb-2">
              Accès Refusé
            </h2>
            <p className="text-[13px] text-gray-600 mb-6">
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
                  ),
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

  // Récupération des données via ID DGRK maintenant dans renderEtapeVerification (composant EtapeVerification)
  // Rendu de l'étape confirmation
  const renderEtapeConfirmation = () => (
    <div className="space-y-8">
      {/* EN-TÊTE AVEC DONNÉES RÉCUPÉRÉES */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-gray-700">
            {donneesRefactor?.source === "externe"
              ? `Données récupérées depuis base externe - Plaque: ${formData.numeroPlaque}`
              : `Informations Récupérées - ID DGRK: ${idDGRK}`}
          </h3>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full ${
              donneesRefactor?.source === "externe"
                ? "bg-blue-100 text-blue-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {donneesRefactor?.source === "externe"
              ? "✓ Données externes"
              : "✓ Données MPAKO"}
          </span>
        </div>

        {/* Message d'information pour les données externes */}
        {donneesRefactor?.source === "externe" && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-[13px]">
              <strong>Note:</strong> Ces données proviennent de la base externe.
              Un nouvel enregistrement sera créé avec un montant de{" "}
              <strong>0$</strong>.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
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
              {donneesRefactor?.source === "externe"
                ? "0 $ (Nouvel enregistrement)"
                : `${donneesRefactor?.montant || 0} $`}
            </div>
          </div>
        </div>
      </div>

      {/* INFORMATIONS ASSUJETTI */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-[#2D5B7A]/10 p-2 rounded-lg">
            <User className="w-5 h-5 text-[#2D5B7A]" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900">
              Informations de l'Assujetti
            </h2>
            <p className="text-[13px] text-gray-600">
              {donneesRefactor?.source === "externe"
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="bg-[#2D5B7A]/10 p-2 rounded-lg">
                <Hash className="w-5 h-5 text-[#2D5B7A]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INFORMATIONS VÉHICULE */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-[#2D5B7A]/10 p-2 rounded-lg">
            <Car className="w-5 h-5 text-[#2D5B7A]" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900">
              Informations de l'Engin
            </h2>
            <p className="text-[13px] text-gray-600">
              {donneesRefactor?.source === "externe"
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              placeholder="Ex: Essence, Diesel, Electrique"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              placeholder="Ex: 2023"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              placeholder="Ex: 2023"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              placeholder="Ex: Rouge, Noir, Blanc"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              placeholder="Ex: 10 CV, 15 CV"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              placeholder="Ex: Personnel, Transport, Commerce"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* VALIDATION */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between p-6 bg-[#2D5B7A]/5 rounded-xl border border-[#2D5B7A]/15 mb-6">
          <div>
            <h4 className="font-semibold text-[#2D5B7A] text-[13px]">
              Service de Correction
            </h4>
            <div className="text-[18px] font-semibold text-[#2D5B7A]">
              {donneesRefactor?.source === "externe"
                ? "Création d'un nouvel enregistrement"
                : "Refactorisation des données"}
            </div>
            <div className="text-[13px] font-medium text-[#2D5B7A]/80 mt-2">
              {donneesRefactor?.source === "externe"
                ? "Montant: 0$ (Nouvelle création)"
                : "Aucun frais supplémentaire"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[13px] text-[#2D5B7A] font-medium">Statut</div>
            <div className="text-[15px] font-semibold text-green-600">
              {donneesRefactor?.source === "externe"
                ? "Nouvelle création"
                : "Correction"}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setEtapeActuelle("verification");
              setErreurVerification("");
            }}
            className="flex items-center space-x-2 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm font-medium border-2 border-transparent hover:border-gray-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>

          <button
            onClick={traiterRefactorisation}
            disabled={isLoading}
            className="flex items-center space-x-2 px-6 py-3 bg-[#2D5B7A] text-white rounded-xl hover:bg-[#244D68] transition-all duration-200 text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>
              {isLoading
                ? "Traitement..."
                : donneesRefactor?.source === "externe"
                  ? "Créer l'enregistrement"
                  : "Corriger les données"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <PageHeader
          impot={impot}
          etapeActuelle={etapeActuelle}
          onBack={() => router.back()}
        />

        {etapeActuelle === "verification" && (
          <EtapeVerification
            idDGRK={idDGRK}
            setIdDGRK={setIdDGRK}
            isLoading={isLoading}
            erreurVerification={erreurVerification}
            setErreurVerification={setErreurVerification}
            handleVerification={handleVerification}
          />
        )}

        {etapeActuelle === "confirmation" && (
          <EtapeConfirmation
            formData={formData}
            handleInputChange={handleInputChange}
            donneesRefactor={donneesRefactor}
            typeEngins={typeEngins}
            isLoading={isLoading}
            traiterRefactorisation={traiterRefactorisation}
            setEtapeActuelle={setEtapeActuelle}
            setErreurVerification={setErreurVerification}
            onChassisBlur={handleChassisBlur}
            verificationChassisLoading={verificationChassisLoading}
          />
        )}

        <ModalChassisExistant
          isOpen={showModalChassisExistant && !!chassisExistantData}
          chassisData={chassisExistantData}
          onAnnuler={() => {
            setShowModalChassisExistant(false);
            setChassisExistantData(null);
            setChassisConfirme(false);
            setFormData((prev) => ({ ...prev, numeroChassis: "" }));
          }}
          onContinuer={() => {
            setShowModalChassisExistant(false);
            setChassisConfirme(true);
          }}
        />

        <SuccessModal
          isOpen={showSuccess}
          onClose={resetForm}
          onPrint={handlePrint}
          data={successData}
        />

        <RefactorPrint
          data={printData}
          isOpen={showPrint}
          onClose={() => {
            setShowPrint(false);
            resetForm();
          }}
        />
      </div>
    </div>
  );
}
