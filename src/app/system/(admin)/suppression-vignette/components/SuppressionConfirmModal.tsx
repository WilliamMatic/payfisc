"use client";

import { useState } from "react";
import {
  X,
  Trash2,
  Loader2,
  AlertTriangle,
  User,
  Bike,
  Hash,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Vignette, SuppressionData } from "./types";

interface SuppressionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: SuppressionData) => void;
  vignette: Vignette | null;
}

export default function SuppressionConfirmModal({
  isOpen,
  onClose,
  onSuccess,
  vignette,
}: SuppressionConfirmModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  if (!isOpen || !vignette) return null;

  const handleSuppression = () => {
    if (confirmationText !== "SUPPRIMER") return;

    setIsProcessing(true);

    const suppressionData: SuppressionData = {
      site: {
        id: 0,
        nom_site: vignette.site_achat,
      },
      vignette_supprimee: {
        id: vignette.id,
        numero_plaque: vignette.engin.numero_plaque,
        type: vignette.type,
        date_achat: vignette.date_achat,
        date_expiration: vignette.date_expiration,
        montant: vignette.montant_paye,
      },
      assujetti: vignette.assujetti,
      engin: vignette.engin,
      suppression: {
        id: 0,
        date_suppression: new Date()
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),
        operateur: "Admin",
        motif: "Suppression manuelle",
      },
      utilisateur: {
        id: 0,
        nom: "Admin",
      },
    };

    setIsProcessing(false);
    onSuccess(suppressionData);
  };

  const isConfirmEnabled = confirmationText === "SUPPRIMER";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay avec opacité */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 backdrop-blur-sm transition-opacity" />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
          &#8203;
        </span>

        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          {/* En-tête - Rouge pour la suppression */}
          <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Confirmation de suppression
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Corps */}
          <div className="px-6 py-6">
            {/* Message d'avertissement */}
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                Êtes-vous absolument sûr ?
              </p>
              <p className="text-sm text-gray-500">
                Cette action est irréversible. La vignette et toutes ses données
                associées seront définitivement supprimées.
              </p>
            </div>

            {/* Résumé des informations à supprimer */}
            <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-200">
              <p className="text-xs font-medium text-red-800 mb-3 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Éléments qui seront supprimés
              </p>

              <div className="space-y-3">
                {/* Assujetti */}
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-white rounded-lg">
                    <User className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-red-700">Assujetti</p>
                    <p className="text-sm font-medium text-red-900">
                      {vignette.assujetti.nom_complet}
                    </p>
                  </div>
                </div>

                {/* Véhicule */}
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Bike className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-red-700">Véhicule</p>
                    <p className="text-sm font-medium text-red-900">
                      {vignette.engin.marque} {vignette.engin.modele}
                    </p>
                  </div>
                </div>

                {/* Plaque et type */}
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Hash className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-red-700">Plaque / Type</p>
                    <p className="text-sm font-medium text-red-900">
                      {vignette.engin.numero_plaque} - {vignette.type}
                    </p>
                  </div>
                </div>

                {/* Date et montant */}
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Calendar className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-red-700">Date / Montant</p>
                    <p className="text-sm font-medium text-red-900">
                      {new Date(vignette.date_achat).toLocaleDateString(
                        "fr-FR",
                      )}{" "}
                      - {vignette.montant_paye}$
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirmation par texte */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tapez <span className="font-bold text-red-600">SUPPRIMER</span>{" "}
                pour confirmer
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="SUPPRIMER"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-center font-bold"
                disabled={isProcessing}
              />
            </div>

            {/* Note finale */}
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
              <p>
                En confirmant, vous acceptez que toutes les données associées à
                cette vignette soient définitivement effacées du système. Cette
                action ne peut pas être annulée.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSuppression}
              disabled={isProcessing || !isConfirmEnabled}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition-all disabled:opacity-50 flex items-center"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Confirmer la suppression
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
