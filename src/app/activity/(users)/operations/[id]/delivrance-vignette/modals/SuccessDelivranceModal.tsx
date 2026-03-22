"use client";

import { CheckCircle, Printer, X, Copy, Ticket } from "lucide-react";

interface SuccessDelivranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export default function SuccessDelivranceModal({
  isOpen,
  onClose,
  data,
}: SuccessDelivranceModalProps) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyReference = () => {
    navigator.clipboard.writeText(data.delivrance.numero_vignette);
    alert("Numéro de vignette copié !");
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
            {/* Icône de succès animée */}
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-purple-100 mb-4 animate-bounce">
              <Ticket className="h-12 w-12 text-purple-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Vignette délivrée avec succès !
            </h3>

            <p className="text-sm text-gray-500 mb-6">
              La vignette a été marquée comme délivrée dans le système.
            </p>

            {/* Détails de la délivrance */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs text-gray-500 mb-2">
                Détails de la délivrance
              </p>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">N° Vignette</span>
                  <span className="text-sm font-mono font-bold text-gray-900">
                    {data.delivrance.numero_vignette}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Véhicule</span>
                  <span className="text-sm font-bold">
                    {data.engin?.numero_plaque}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Assujetti</span>
                  <span className="text-sm">{data.assujetti?.nom_complet}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Date</span>
                  <span className="text-sm">
                    {data.delivrance.date_delivrance}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Opérateur</span>
                  <span className="text-sm">
                    {data.delivrance.utilisateur.nom}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                onClick={handleCopyReference}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Copy className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                <span className="text-xs text-gray-600">Copier</span>
              </button>

              <button
                onClick={handlePrint}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Printer className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                <span className="text-xs text-gray-600">Imprimer</span>
              </button>
            </div>

            {/* Bouton de fermeture */}
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl hover:from-purple-700 hover:to-purple-600 transition-all font-semibold"
            >
              Nouvelle délivrance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
