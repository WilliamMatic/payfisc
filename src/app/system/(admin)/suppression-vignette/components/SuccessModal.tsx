"use client";

import {
  CheckCircle,
  X,
  Trash2,
  Calendar,
  User,
  Bike,
  Hash,
} from "lucide-react";
import { SuppressionData } from "./types";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SuppressionData | null;
}

export default function SuccessModal({
  isOpen,
  onClose,
  data,
}: SuccessModalProps) {
  if (!isOpen || !data) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Overlay avec opacité */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 backdrop-blur-sm transition-opacity" />

        <div className="relative bg-white rounded-2xl max-w-md w-full p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            {/* Icône de succès */}
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-4">
              <Trash2 className="h-10 w-10 text-red-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Suppression effectuée avec succès !
            </h3>

            <p className="text-sm text-gray-500 mb-6">
              La vignette et toutes ses données associées ont été définitivement
              supprimées.
            </p>

            {/* Détails de la suppression */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs text-gray-500 mb-2">
                Détails de la suppression
              </p>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ID suppression</span>
                  <span className="text-sm font-mono font-bold text-gray-900">
                    {data.suppression.id}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Date suppression
                  </span>
                  <span className="text-sm">
                    {formatDate(data.suppression.date_suppression)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Opérateur</span>
                  <span className="text-sm">{data.suppression.operateur}</span>
                </div>

                <div className="border-t border-gray-200 my-2 pt-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Plaque</span>
                    <span className="text-sm font-bold text-red-600">
                      {data.vignette_supprimee.numero_plaque}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Type</span>
                  <span className="text-sm capitalize">
                    {data.vignette_supprimee.type}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Montant</span>
                  <span className="text-sm font-bold">
                    {data.vignette_supprimee.montant}$
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Propriétaire</span>
                  <span className="text-sm">{data.assujetti.nom_complet}</span>
                </div>
              </div>
            </div>

            {/* Message de confirmation */}
            <div className="bg-red-50 rounded-lg p-3 mb-6 text-xs text-red-700 flex items-start">
              <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-red-600" />
              <p>
                Toutes les données ont été supprimées du système. Cette action
                est irréversible.
              </p>
            </div>

            {/* Bouton de fermeture */}
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 transition-all font-semibold"
            >
              Terminé
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
