"use client";

import { useState } from "react";
import {
  X,
  CheckCircle,
  Loader2,
  Ticket,
  User,
  Bike,
  Calendar,
  Hash,
} from "lucide-react";
import { Assujetti, Engin } from "../components/types";

interface ReferenceInfo {
  reference_bancaire: string;
  nombre_declarations: number;
  livres: number;
  restant: number;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assujetti?: Assujetti;
  engin?: Engin;
  numeroVignette?: string;
  referenceInfo?: ReferenceInfo | null;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onSuccess,
  assujetti,
  engin,
  numeroVignette,
  referenceInfo,
}: ConfirmationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirmation = () => {
    setIsProcessing(true);
    onSuccess();
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay avec opacité */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 backdrop-blur-sm transition-opacity" />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
          &#8203;
        </span>

        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Confirmation de délivrance
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
            {/* Message de confirmation */}
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                Confirmez-vous la délivrance ?
              </p>
              <p className="text-sm text-gray-500">
                La vignette sera marquée comme délivrée pour ce véhicule
              </p>
            </div>

            {/* Résumé des informations */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-500 mb-3">Récapitulatif</p>

              <div className="space-y-3">
                {/* Assujetti */}
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-white rounded-lg">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Assujetti</p>
                    <p className="text-sm font-medium">
                      {assujetti?.nom_complet}
                    </p>
                  </div>
                </div>

                {/* Véhicule */}
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Bike className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Véhicule</p>
                    <p className="text-sm font-medium">
                      {engin?.marque} {engin?.modele} - {engin?.numero_plaque}
                    </p>
                  </div>
                </div>

                {/* Paiement */}
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Hash className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Référence bancaire</p>
                    <p className="text-sm font-mono font-medium">
                      {referenceInfo?.reference_bancaire}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      N° vignette: {numeroVignette} &middot; Délivrance {(referenceInfo?.livres ?? 0) + 1}/{referenceInfo?.nombre_declarations}
                    </p>
                  </div>
                </div>

                {/* Date de délivrance */}
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Calendar className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Date de délivrance</p>
                    <p className="text-sm font-medium">
                      {new Date().toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Note d'information */}
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
              <p>
                Cette action est irréversible. Une fois confirmée, la vignette
                sera marquée comme délivrée dans le système.
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
              onClick={handleConfirmation}
              disabled={isProcessing}
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-600 transition-all disabled:opacity-50 flex items-center"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmer la délivrance
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
