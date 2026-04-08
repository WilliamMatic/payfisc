"use client";

import {
  CheckCircle,
  Printer,
  X,
  Copy,
  RefreshCw,
} from "lucide-react";

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
    navigator.clipboard.writeText(
      data.paiement?.numero_transaction ||
        data.renouvellement?.id.toString() ||
        "",
    );
    alert("Référence copiée !");
  };

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
            {/* Icône de succès animée */}
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-amber-100 mb-4 animate-bounce">
              <RefreshCw className="h-12 w-12 text-amber-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Renouvellement effectué avec succès !
            </h3>

            <p className="text-sm text-gray-500 mb-6">
              L&apos;assurance a été renouvelée pour 12 mois supplémentaires.
            </p>

            {/* Détails du renouvellement */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs text-gray-500 mb-2">
                Détails du renouvellement
              </p>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Référence</span>
                  <span className="text-sm font-mono font-bold text-gray-900">
                    {data.paiement?.numero_transaction ||
                      `REN-${data.renouvellement.id}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Date renouvellement
                  </span>
                  <span className="text-sm">
                    {formatDate(data.renouvellement.date_renouvellement)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Montant</span>
                  <span className="text-sm font-bold text-amber-600">
                    {data.renouvellement.montant}$
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Nouvelle expiration
                  </span>
                  <span className="text-sm">
                    {new Date(
                      data.renouvellement.nouvelle_date_expiration,
                    ).toLocaleDateString("fr-FR")}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Plaque</span>
                  <span className="text-sm font-bold">
                    {data.engin?.numero_plaque}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Propriétaire</span>
                  <span className="text-sm">{data.assujetti?.nom_complet}</span>
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
                <span className="text-xs text-gray-600">Copier référence</span>
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
              className="w-full px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-xl hover:from-amber-700 hover:to-amber-600 transition-all font-semibold"
            >
              Terminé
            </button>

            <p className="text-xs text-gray-400 mt-4">
              Les informations ont été transmises à AutoJuste
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
