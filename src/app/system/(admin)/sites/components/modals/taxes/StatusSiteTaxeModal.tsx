"use client";

import { Eye, EyeOff, X, Loader2 } from "lucide-react";
import { SiteTaxe } from "@/services/sites/siteTaxeService";
import { useState } from "react";

interface StatusSiteTaxeModalProps {
  siteTaxe: SiteTaxe;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StatusSiteTaxeModal({
  siteTaxe,
  onClose,
  onSuccess,
}: StatusSiteTaxeModalProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setProcessing(true);
    setError(null);

    try {
      const { toggleSiteTaxeStatus } =
        await import("@/services/sites/siteTaxeService");
      const result = await toggleSiteTaxeStatus(
        siteTaxe.id, // ID de l'association
        !siteTaxe.status, // Nouveau statut (inversé)
        siteTaxe.site_id, // ID du site (pour invalidation cache)
        siteTaxe.taxe_id, // ID de la taxe (pour invalidation cache)
      );

      if (result.status === "success") {
        onSuccess();
      } else {
        setError(result.message || "Erreur lors du changement de statut");
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
        className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center">
            <div
              className={`p-2 rounded-lg mr-3 ${
                siteTaxe.status ? "bg-red-100" : "bg-green-100"
              }`}
            >
              {siteTaxe.status ? (
                <EyeOff className="w-5 h-5 text-red-600" />
              ) : (
                <Eye className="w-5 h-5 text-green-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {siteTaxe.status ? "Désactiver" : "Activer"} la taxe
              </h3>
              <p className="text-sm text-gray-500">Changer le statut</p>
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

        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="text-center mb-6">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
                siteTaxe.status ? "bg-red-50" : "bg-green-50"
              }`}
            >
              {siteTaxe.status ? (
                <EyeOff className="w-6 h-6 text-red-500" />
              ) : (
                <Eye className="w-6 h-6 text-green-500" />
              )}
            </div>
            <p className="text-gray-600 mb-2">
              Êtes-vous sûr de vouloir{" "}
              {siteTaxe.status ? "désactiver" : "activer"} cette taxe ?
            </p>
            <p className="text-gray-800 font-medium">{siteTaxe.taxe_nom}</p>
            <p className="text-sm text-gray-500 mt-1">
              Site: {siteTaxe.site_nom} • Prix: {formatPrice(siteTaxe.prix)}
            </p>
          </div>

          <div className="flex items-center justify-center space-x-3 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium flex-1"
              disabled={processing}
            >
              Annuler
            </button>
            <button
              onClick={handleToggle}
              disabled={processing}
              className={`flex items-center justify-center space-x-2 px-4 py-2.5 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex-1 ${
                siteTaxe.status
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : siteTaxe.status ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span>
                {processing
                  ? "Traitement..."
                  : siteTaxe.status
                    ? "Désactiver"
                    : "Activer"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
