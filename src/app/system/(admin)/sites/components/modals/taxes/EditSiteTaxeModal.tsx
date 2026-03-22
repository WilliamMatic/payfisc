"use client";

import { useState } from "react";
import { Edit, X, Save, Loader2, AlertCircle } from "lucide-react";
import { SiteTaxe } from "@/services/sites/siteTaxeService";

interface EditSiteTaxeModalProps {
  siteTaxe: SiteTaxe;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditSiteTaxeModal({
  siteTaxe,
  onClose,
  onSuccess,
}: EditSiteTaxeModalProps) {
  const [prix, setPrix] = useState(siteTaxe.prix);
  const [status, setStatus] = useState(siteTaxe.status);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (prix < 0) {
      setError("Le prix doit être un nombre positif");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { updateSiteTaxe } =
        await import("@/services/sites/siteTaxeService");
      
      // CORRECTION : Passer les 5 arguments attendus
      const result = await updateSiteTaxe(
        siteTaxe.id,        // ID de l'association
        prix,               // Nouveau prix
        status,             // Nouveau statut
        siteTaxe.site_id,   // ID du site (pour invalidation cache)
        siteTaxe.taxe_id    // ID de la taxe (pour invalidation cache)
      );

      if (result.status === "success") {
        onSuccess();
      } else {
        setError(result.message || "Erreur lors de la modification");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1100] p-4">
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* EN-TÊTE */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center">
            <div className="bg-[#2D5B7A] p-2 rounded-lg mr-3">
              <Edit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Modifier la taxe
              </h3>
              <p className="text-sm text-gray-500">{siteTaxe.taxe_nom}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={processing}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* CORPS */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Informations actuelles */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                Site: <span className="font-medium">{siteTaxe.site_nom}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Taxe: <span className="font-medium">{siteTaxe.taxe_nom}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Prix actuel:{" "}
                <span className="font-medium">
                  {formatPrice(siteTaxe.prix)}
                </span>
              </p>
            </div>

            {/* Champ Prix */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau prix <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  value={prix}
                  onChange={(e) => setPrix(parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                  placeholder="0.00"
                  disabled={processing}
                />
              </div>
            </div>

            {/* Switch Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setStatus(true)}
                  className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
                    status
                      ? "bg-green-50 border-green-300 text-green-700"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Actif
                </button>
                <button
                  type="button"
                  onClick={() => setStatus(false)}
                  className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
                    !status
                      ? "bg-gray-100 border-gray-300 text-gray-700"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Inactif
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PIED DE PAGE */}
        <div className="flex items-center justify-end space-x-3 p-5 pt-0 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
            disabled={processing}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={prix < 0 || processing}
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#2D5B7A] text-white rounded-lg hover:bg-[#234761] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{processing ? "Modification..." : "Modifier"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}