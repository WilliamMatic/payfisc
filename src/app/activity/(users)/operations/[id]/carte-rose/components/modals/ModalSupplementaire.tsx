"use client";
import { useState } from "react";
import { X } from "lucide-react";

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

interface ModalSupplementaireProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FicheSupplementaire) => void;
  defaultAdresse?: string;
}

export default function ModalSupplementaire({
  isOpen,
  onClose,
  onSubmit,
  defaultAdresse = "",
}: ModalSupplementaireProps) {
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
}
