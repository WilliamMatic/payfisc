"use client";

import { useEffect } from "react";
import { AlertCircle, X, Trash2, Loader2 } from "lucide-react";
import type { VenteNonGrossiste } from "@/services/ventes/ventesService";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  vente: VenteNonGrossiste | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  formatMontant: (montant: number) => string;
}

export default function DeleteConfirmationModal({
  isOpen,
  vente,
  onConfirm,
  onCancel,
  isLoading = false,
  formatMontant,
}: DeleteConfirmationModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
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
  }, [isOpen, onCancel]);

  if (!isOpen || !vente) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
              Confirmer la suppression
            </h3>
            <button
              onClick={onCancel}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 font-medium">
              Êtes-vous sûr de vouloir supprimer cette vente ?
            </p>
            <div className="mt-3 space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Client:</span> {vente.nom}{" "}
                {vente.prenom}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Plaque:</span>{" "}
                <span className="font-bold text-red-600">
                  {vente.numero_plaque}
                </span>
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Montant:</span>{" "}
                {formatMontant(parseFloat(vente.montant.toString()))}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Date:</span> {vente.date_paiement}
              </p>
            </div>
            <p className="text-red-600 text-sm mt-3">
              Cette action supprimera toutes les données associées à cette vente
              : paiement, engin, et entrée dans carte_reprint.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
