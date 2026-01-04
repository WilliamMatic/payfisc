"use client";

import { useEffect } from "react";
import { User, Calendar, Car as CarIcon, Gauge, X } from "lucide-react";
import type { CarteRose } from "../types/carteRoseTypes";

interface DetailModalProps {
  isOpen: boolean;
  carteRose: CarteRose | null;
  onClose: () => void;
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export function DetailModal({ isOpen, carteRose, onClose }: DetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !carteRose) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Détails de la carte rose
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Paiement #{carteRose.paiement_id} • Plaque {carteRose.numero_plaque}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section Propriétaire */}
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
              <h4 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informations du propriétaire
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Nom complet:</span>
                  <span className="text-gray-900 font-bold">
                    {carteRose.nom} {carteRose.prenom}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Téléphone:</span>
                  <span className="text-gray-900">
                    {carteRose.telephone || "Non renseigné"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Email:</span>
                  <span className="text-gray-900">
                    {carteRose.email || "Non renseigné"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">Adresse:</span>
                  <span className="text-gray-900">
                    {carteRose.adresse || "Non renseignée"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">NIF:</span>
                  <span className="text-gray-900">
                    {carteRose.nif || "Non renseigné"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">ID Propriétaire:</span>
                  <span className="text-gray-900">{carteRose.particulier_id}</span>
                </div>
              </div>
            </div>

            {/* Section Véhicule */}
            <div className="bg-green-50 rounded-xl p-5 border border-green-200">
              <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                <CarIcon className="w-5 h-5 mr-2" />
                Informations du véhicule
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">Numéro plaque:</span>
                  <span className="text-gray-900 font-bold">{carteRose.numero_plaque}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">Type:</span>
                  <span className="text-gray-900">{carteRose.type_engin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">Marque:</span>
                  <span className="text-gray-900">{carteRose.marque}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">Énergie:</span>
                  <span className="text-gray-900">{carteRose.energie || "Non renseignée"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">Année fabrication:</span>
                  <span className="text-gray-900">{carteRose.annee_fabrication || "Non renseignée"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">Année circulation:</span>
                  <span className="text-gray-900">{carteRose.annee_circulation || "Non renseignée"}</span>
                </div>
              </div>
            </div>

            {/* Section Caractéristiques */}
            <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
              <h4 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                <Gauge className="w-5 h-5 mr-2" />
                Caractéristiques techniques
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">Couleur:</span>
                  <span className="text-gray-900">{carteRose.couleur || "Non renseignée"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">Puissance fiscale:</span>
                  <span className="text-gray-900">{carteRose.puissance_fiscal || "Non renseignée"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">Usage:</span>
                  <span className="text-gray-900">{carteRose.usage_engin || "Non renseigné"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">Numéro chassis:</span>
                  <span className="text-gray-900">{carteRose.numero_chassis || "Non renseigné"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">Numéro moteur:</span>
                  <span className="text-gray-900">{carteRose.numero_moteur || "Non renseigné"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">ID Engin:</span>
                  <span className="text-gray-900">{carteRose.engin_id}</span>
                </div>
              </div>
            </div>

            {/* Section Administration */}
            <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
              <h4 className="text-lg font-bold text-amber-800 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Informations administratives
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">Date attribution:</span>
                  <span className="text-gray-900">{formatDate(carteRose.date_attribution)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">Site:</span>
                  <span className="text-gray-900">{carteRose.site_nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">Caissier:</span>
                  <span className="text-gray-900">{carteRose.caissier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">ID Paiement:</span>
                  <span className="text-gray-900">{carteRose.paiement_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">ID Impôt:</span>
                  <span className="text-gray-900">{carteRose.impot_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">ID Plaque attribuée:</span>
                  <span className="text-gray-900">{carteRose.plaque_attribuee_id || "Non renseigné"}</span>
                </div>
                {carteRose.reprint_id && (
                  <div className="flex justify-between">
                    <span className="text-amber-700 font-medium">ID Carte reprint:</span>
                    <span className="text-gray-900">{carteRose.reprint_id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}