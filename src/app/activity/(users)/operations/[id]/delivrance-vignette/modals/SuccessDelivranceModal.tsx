"use client";

import { CheckCircle, Printer, X, Copy, Package } from "lucide-react";

interface SuccessDelivranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(data.delivrance?.code_vignette || "");
    alert("Code vignette copié !");
  };

  const compteur = data.compteur;
  const toutLivre = data.tout_livre;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 backdrop-blur-sm transition-opacity" />

        <div className="relative bg-white rounded-2xl max-w-md w-full p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 mb-4 animate-bounce">
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Vignette délivrée avec succès !
            </h3>

            <p className="text-sm text-gray-500 mb-6">
              La vignette a été enregistrée dans le système.
            </p>

            {/* Compteur */}
            {compteur && (
              <div className="bg-emerald-50 rounded-xl p-3 mb-4 flex items-center justify-center gap-3">
                <Package className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-800">
                  {compteur.livres}/{compteur.total} vignettes livrées
                </span>
                {!toutLivre && (
                  <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
                    {compteur.restant} restante{compteur.restant > 1 ? "s" : ""}
                  </span>
                )}
                {toutLivre && (
                  <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
                    Terminé
                  </span>
                )}
              </div>
            )}

            {/* Détails */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs text-gray-500 mb-2">Détails</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Code vignette</span>
                  <span className="text-sm font-mono font-bold text-gray-900">
                    {data.delivrance?.code_vignette}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">N° vignette</span>
                  <span className="text-sm font-bold text-gray-900">
                    {data.delivrance?.numero_vignette}
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
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Validité</span>
                  <span className="text-sm">
                    {data.delivrance?.date_validite
                      ? new Date(data.delivrance.date_validite).toLocaleDateString("fr-FR")
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Référence</span>
                  <span className="text-sm font-mono">
                    {data.reference_bancaire}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                onClick={handleCopyCode}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Copy className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                <span className="text-xs text-gray-600">Copier code</span>
              </button>
              <button
                onClick={handlePrint}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Printer className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                <span className="text-xs text-gray-600">Imprimer</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all font-semibold"
            >
              {toutLivre ? "Terminé" : "Délivrer la suivante"}
            </button>

            <p className="text-xs text-gray-400 mt-4">
              Montant: 0$ (paiement déjà effectué)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
