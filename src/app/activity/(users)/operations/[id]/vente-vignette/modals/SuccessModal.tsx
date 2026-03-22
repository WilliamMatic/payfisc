// modals/SuccessModal.tsx
"use client";

import { CheckCircle, Printer, X, Copy } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

export default function SuccessModal({
  isOpen,
  onClose,
  data,
}: SuccessModalProps) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyReference = () => {
    navigator.clipboard.writeText(data.paiement.numero_transaction);
    alert("Référence copiée !");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Overlay avec opacité - NE FERME PAS LE MODAL */}
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
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 mb-4 animate-bounce">
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Paiement effectué avec succès !
            </h3>

            <p className="text-sm text-gray-500 mb-6">
              Les informations ont été envoyées à AutoJuste pour impression de
              la vignette.
            </p>

            {/* Détails de la transaction */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs text-gray-500 mb-2">
                Détails de la transaction
              </p>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Référence</span>
                  <span className="text-sm font-mono font-bold text-gray-900">
                    {data.paiement.numero_transaction}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Montant</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {data.paiement.montant}$
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Mode</span>
                  <span className="text-sm capitalize">
                    {data.paiement.mode_paiement}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Date</span>
                  <span className="text-sm">{data.paiement.date_paiement}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Plaque</span>
                  <span className="text-sm font-bold">
                    {data.engin.numero_plaque}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions - Sans le bouton Télécharger */}
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
              className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all font-semibold"
            >
              Nouvelle vente
            </button>

            <p className="text-xs text-gray-400 mt-4">
              La vignette sera disponible à l'impression dans quelques instants
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
