// modals/InscriptionModal.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  User,
  Bike,
  Phone,
  MapPin,
  FileText,
  Calendar,
  Fuel,
  Gauge,
  Palette,
  Cpu,
  Component,
  AlertCircle,
  Save,
  ChevronDown,
} from "lucide-react";
import { Assujetti, Engin } from "../components/types";
import { marquesData, modelesData, couleursData, Marque, Modele } from "../data/vehiculeData";
import { inscrireAssujetti } from "@/services/assurance-moto/assuranceMotoService";

interface InscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { assujetti: Assujetti; engin: Engin }) => void;
  plaque: string;
  utilisateur?: any;
}

// État initial pour réinitialisation
const initialAssujettiState: Partial<Assujetti> = {
  nom_complet: "",
  telephone: "",
  adresse: "",
  nif: "",
  email: "",
};

const initialEnginState = (plaque: string): Partial<Engin> => ({
  numero_plaque: plaque,
  marque: "",
  modele: "",
  couleur: "",
  energie: "Essence",
  usage_engin: "Particulier",
  puissance_fiscal: "",
  annee_fabrication: new Date().getFullYear().toString(),
  annee_circulation: new Date().getFullYear().toString(),
  numero_chassis: "",
  numero_moteur: "",
  type_engin: "Moto",
});

export default function InscriptionModal({
  isOpen,
  onClose,
  onSuccess,
  plaque,
  utilisateur,
}: InscriptionModalProps) {
  const [step, setStep] = useState<"confirmation" | "formulaire">(
    "confirmation",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // États du formulaire assujetti
  const [assujetti, setAssujetti] = useState<Partial<Assujetti>>(
    initialAssujettiState,
  );

  // États du formulaire engin
  const [engin, setEngin] = useState<Partial<Engin>>(initialEnginState(plaque));

  // États pour les suggestions
  const [showMarqueSuggestions, setShowMarqueSuggestions] = useState(false);
  const [showModeleSuggestions, setShowModeleSuggestions] = useState(false);
  const [showCouleurSuggestions, setShowCouleurSuggestions] = useState(false);
  const [marqueSearch, setMarqueSearch] = useState("");
  const [modeleSearch, setModeleSearch] = useState("");
  const [couleurSearch, setCouleurSearch] = useState("");

  // Mapping type_engin string → number pour filtrage vehiculeData
  const typeEnginMap: Record<string, number> = {
    "Voiture": 1, "Camion": 2, "Bus": 3, "Utilitaire": 4, "Moto": 5,
  };

  // Filtrer les marques en fonction du type d'engin
  const marquesFiltrees = useMemo((): Marque[] => {
    let marques: Marque[] = marquesData;
    if (engin.type_engin) {
      const typeNum = typeEnginMap[engin.type_engin];
      if (typeNum) marques = marquesData.filter((m: Marque) => m.type_engin === typeNum);
    }

    if (marqueSearch) {
      marques = marques.filter((m: Marque) =>
        m.nom.toLowerCase().includes(marqueSearch.toLowerCase()),
      );
    }
    return marques;
  }, [engin.type_engin, marqueSearch]);

  // Filtrer les modèles en fonction de la marque et du type
  const modelesFiltres = useMemo((): Modele[] => {
    let modeles: Modele[] = modelesData;

    if (engin.type_engin) {
      const typeNum = typeEnginMap[engin.type_engin];
      if (typeNum) modeles = modeles.filter((m: Modele) => m.type_engin === typeNum);
    }

    if (engin.marque) {
      const marqueInfo: Marque | undefined = marquesData.find((m: Marque) => m.nom === engin.marque);
      if (marqueInfo) {
        modeles = modeles.filter((m: Modele) => m.marque_id === marqueInfo.id);
      }
    }

    if (modeleSearch) {
      modeles = modeles.filter((m: Modele) =>
        m.nom.toLowerCase().includes(modeleSearch.toLowerCase()),
      );
    }
    return modeles;
  }, [engin.type_engin, engin.marque, modeleSearch]);

  // Filtrer les couleurs
  const couleursFiltrees = useMemo((): string[] => {
    if (couleurSearch) {
      return couleursData.filter((c: string) =>
        c.toLowerCase().includes(couleurSearch.toLowerCase()),
      );
    }
    return couleursData;
  }, [couleurSearch]);

  // Réinitialiser la marque si le type change
  useEffect(() => {
    if (engin.type_engin) {
      setEngin((prev: Partial<Engin>) => ({ ...prev, marque: "", modele: "" }));
      setMarqueSearch("");
      setModeleSearch("");
    }
  }, [engin.type_engin]);

  // Réinitialiser le modèle si la marque change
  useEffect(() => {
    setEngin((prev: Partial<Engin>) => ({ ...prev, modele: "" }));
    setModeleSearch("");
  }, [engin.marque]);

  if (!isOpen) return null;

  const handleConfirmationOui = (): void => {
    setStep("formulaire");
  };

  const handleConfirmationNon = (): void => {
    onClose();
  };

  const resetForm = (): void => {
    setAssujetti(initialAssujettiState);
    setEngin(initialEnginState(plaque));
    setStep("confirmation");
    setMarqueSearch("");
    setModeleSearch("");
    setCouleurSearch("");
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await inscrireAssujetti({
        nom_complet: assujetti.nom_complet || "",
        telephone: assujetti.telephone || "",
        adresse: assujetti.adresse || "",
        nif: assujetti.nif || "",
        email: assujetti.email || "",
        numero_plaque: engin.numero_plaque || plaque,
        marque: engin.marque || "",
        modele: engin.modele || "",
        couleur: engin.couleur || "",
        energie: String(engin.energie || ""),
        usage_engin: String(engin.usage_engin || ""),
        puissance_fiscal: engin.puissance_fiscal || "",
        annee_fabrication: engin.annee_fabrication || new Date().getFullYear().toString(),
        annee_circulation: engin.annee_circulation || new Date().getFullYear().toString(),
        numero_chassis: engin.numero_chassis || "",
        numero_moteur: engin.numero_moteur || "",
        type_engin: String(engin.type_engin || ""),
        utilisateur_id: utilisateur?.id || 0,
      });

      if (result.status === 'success' && result.data) {
        const newAssujetti: Assujetti = {
          id: result.data.assujetti.id,
          nom_complet: result.data.assujetti.nom_complet,
          telephone: result.data.assujetti.telephone,
          adresse: result.data.assujetti.adresse,
          nif: result.data.assujetti.nif,
          email: result.data.assujetti.email,
        };

        const newEngin: Engin = {
          id: result.data.engin.id,
          numero_plaque: result.data.engin.numero_plaque,
          marque: result.data.engin.marque,
          modele: result.data.engin.modele,
          couleur: result.data.engin.couleur,
          energie: result.data.engin.energie,
          usage_engin: result.data.engin.usage_engin,
          puissance_fiscal: result.data.engin.puissance_fiscal,
          annee_fabrication: result.data.engin.annee_fabrication,
          annee_circulation: result.data.engin.annee_circulation,
          numero_chassis: result.data.engin.numero_chassis,
          numero_moteur: result.data.engin.numero_moteur,
          type_engin: result.data.engin.type_engin,
        };

        resetForm();
        onSuccess({ assujetti: newAssujetti, engin: newEngin });
      } else {
        setSubmitError(result.message || "Erreur lors de l'inscription");
      }
    } catch (err) {
      console.error("Erreur inscription:", err);
      setSubmitError("Erreur réseau lors de l'inscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = (): void => {
    resetForm();
    onClose();
  };

  if (step === "confirmation") {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          {/* Overlay avec opacité - NE FERME PAS LE MODAL */}
          <div className="fixed inset-0 bg-gray-500 bg-opacity-50 backdrop-blur-sm" />

          <div className="relative bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
                <AlertCircle className="h-8 w-8 text-amber-600" />
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Plaque non trouvée
              </h3>

              <p className="text-sm text-gray-500 mb-6">
                La plaque{" "}
                <span className="font-bold text-amber-600">{plaque}</span>{" "}
                n&apos;existe pas dans notre système. Ce client peut provenir d&apos;un
                autre partenaire de plaque minéralogique.
              </p>

              <p className="text-sm text-gray-700 mb-6 bg-gray-50 p-3 rounded-lg">
                Souhaitez-vous enregistrer ce nouveau véhicule ?
              </p>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleConfirmationNon}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Non
                </button>
                <button
                  onClick={handleConfirmationOui}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-600 transition-colors"
                >
                  Oui, enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay avec opacité - NE FERME PAS LE MODAL */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 backdrop-blur-sm transition-opacity" />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
          &#8203;
        </span>

        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Save className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Nouvel enregistrement
              </h3>
            </div>
            <button
              onClick={handleModalClose}
              className="text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Formulaire */}
          <form
            onSubmit={handleSubmit}
            className="p-6 max-h-[70vh] overflow-y-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Section Assujetti */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">
                    Informations Assujetti
                  </h4>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={assujetti.nom_complet}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setAssujetti({
                          ...assujetti,
                          nom_complet: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nom et prénoms"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={assujetti.telephone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setAssujetti({
                          ...assujetti,
                          telephone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+243 XXX XXX XXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={assujetti.adresse}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setAssujetti({ ...assujetti, adresse: e.target.value })
                      }
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Adresse complète"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NIF
                    </label>
                    <input
                      type="text"
                      value={assujetti.nif}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setAssujetti({ ...assujetti, nif: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Numéro d'identification fiscale"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={assujetti.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setAssujetti({ ...assujetti, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="email@exemple.com"
                    />
                  </div>
                </div>
              </div>

              {/* Section Engin */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Bike className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">
                    Informations Véhicule
                  </h4>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro Plaque <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={engin.numero_plaque}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50"
                      placeholder="AA256"
                      maxLength={5}
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type d&apos;engin <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={engin.type_engin}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setEngin({
                          ...engin,
                          type_engin: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="Moto">Moto</option>
                      <option value="Voiture">Voiture</option>
                      <option value="Camion">Camion</option>
                      <option value="Bus">Bus</option>
                      <option value="Utilitaire">Utilitaire</option>
                    </select>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marque <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={marqueSearch}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setMarqueSearch(e.target.value);
                          setShowMarqueSuggestions(true);
                        }}
                        onFocus={() => setShowMarqueSuggestions(true)}
                        placeholder="Rechercher une marque..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

                      {showMarqueSuggestions && marquesFiltrees.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {marquesFiltrees.map((marque: Marque) => (
                            <div
                              key={marque.id}
                              className="px-4 py-2 hover:bg-emerald-50 cursor-pointer"
                              onClick={() => {
                                setEngin({ ...engin, marque: marque.nom });
                                setMarqueSearch(marque.nom);
                                setShowMarqueSuggestions(false);
                              }}
                            >
                              {marque.nom}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modèle <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={modeleSearch}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setModeleSearch(e.target.value);
                          setShowModeleSuggestions(true);
                        }}
                        onFocus={() => setShowModeleSuggestions(true)}
                        placeholder="Rechercher un modèle..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

                      {showModeleSuggestions && modelesFiltres.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {modelesFiltres.map((modele: Modele) => (
                            <div
                              key={modele.id}
                              className="px-4 py-2 hover:bg-emerald-50 cursor-pointer"
                              onClick={() => {
                                setEngin({ ...engin, modele: modele.nom });
                                setModeleSearch(modele.nom);
                                setShowModeleSuggestions(false);
                              }}
                            >
                              {modele.nom}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Couleur
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={couleurSearch}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setCouleurSearch(e.target.value);
                          setShowCouleurSuggestions(true);
                        }}
                        onFocus={() => setShowCouleurSuggestions(true)}
                        placeholder="Rechercher une couleur..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

                      {showCouleurSuggestions &&
                        couleursFiltrees.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {couleursFiltrees.map((couleur: string) => (
                              <div
                                key={couleur}
                                className="px-4 py-2 hover:bg-emerald-50 cursor-pointer"
                                onClick={() => {
                                  setEngin({ ...engin, couleur });
                                  setCouleurSearch(couleur);
                                  setShowCouleurSuggestions(false);
                                }}
                              >
                                {couleur}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Puissance Fiscale
                    </label>
                    <input
                      type="text"
                      value={engin.puissance_fiscal}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEngin({
                          ...engin,
                          puissance_fiscal: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="2.5 CV"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Année Fabrication{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={engin.annee_fabrication}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEngin({
                            ...engin,
                            annee_fabrication: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="2024"
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Année Circulation{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={engin.annee_circulation}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEngin({
                            ...engin,
                            annee_circulation: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="2024"
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Énergie <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={engin.energie}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setEngin({
                            ...engin,
                            energie: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="Essence">Essence</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Électrique">Électrique</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Usage <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={engin.usage_engin}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setEngin({
                            ...engin,
                            usage_engin: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="Particulier">Particulier</option>
                        <option value="Professionnel">Professionnel</option>
                        <option value="Transport">Transport</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro Châssis <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={engin.numero_chassis}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEngin({ ...engin, numero_chassis: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="LHJTCJPLXR0997101"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro Moteur <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={engin.numero_moteur}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEngin({ ...engin, numero_moteur: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="HL1E-123456"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Message d'erreur */}
            {submitError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex justify-end space-x-3 border-t pt-4">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-600 transition-all disabled:opacity-50 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">&#9203;</span>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer et continuer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
