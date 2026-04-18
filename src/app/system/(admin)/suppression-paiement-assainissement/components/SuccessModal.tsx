"use client";

import { CheckCircle, X } from "lucide-react";
import { SuppressionData } from "./types";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SuppressionData | null;
}

export default function SuccessModal({ isOpen, onClose, data }: SuccessModalProps) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

        <div className="relative inline-block w-full max-w-md bg-white rounded-2xl shadow-xl text-left overflow-hidden transform transition-all">
          <div className="p-8 text-center">
            {/* Success Icon */}
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">Paiement supprimé</h3>
            <p className="text-gray-500 mb-6">Le paiement a été supprimé avec succès</p>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Référence</span>
                <span className="font-mono font-bold text-gray-900">{data.paiement.reference}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Montant</span>
                <span className="font-bold text-red-600">{Number(data.paiement.montant).toLocaleString("fr-FR")} FC</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Contribuable</span>
                <span className="text-sm font-medium text-gray-900">{data.contribuable.nom}</span>
              </div>
              {data.contribuable.etablissement && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Établissement</span>
                  <span className="text-sm font-medium text-gray-900">{data.contribuable.etablissement}</span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm text-gray-500">Supprimé le</span>
                <span className="text-sm text-gray-900">
                  {new Date(data.suppression.date_suppression).toLocaleString("fr-FR")}
                </span>
              </div>
            </div>

            <button onClick={onClose}
              className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
              <X className="w-4 h-4" />
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
