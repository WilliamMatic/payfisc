"use client";

import { useState, useEffect } from "react";
import { Plus, X, Save, Loader2, AlertCircle } from "lucide-react";
import { Taxe } from "@/services/sites/siteTaxeService";

interface AddSiteTaxeModalProps {
  siteId: number;
  siteNom: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddSiteTaxeModal({
  siteId,
  siteNom,
  onClose,
  onSuccess,
}: AddSiteTaxeModalProps) {
  const [taxes, setTaxes] = useState<Taxe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const [formData, setFormData] = useState({
    taxe_id: 0,
    prix: 0,
  });

  // Charger les taxes disponibles
  useEffect(() => {
    const loadTaxesDisponibles = async () => {
      try {
        setLoading(true);
        const { getTaxesDisponibles } =
          await import("@/services/sites/siteTaxeService");
        const result = await getTaxesDisponibles(siteId);

        if (result.status === "success") {
          setTaxes(result.data || []);
        } else {
          setError(result.message || "Erreur lors du chargement des taxes");
        }
      } catch (err) {
        setError("Erreur de connexion au serveur");
      } finally {
        setLoading(false);
      }
    };

    loadTaxesDisponibles();
  }, [siteId]);

  const handleSubmit = async () => {
    if (!formData.taxe_id) {
      setError("Veuillez sélectionner une taxe");
      return;
    }

    if (formData.prix < 0) {
      setError("Le prix doit être un nombre positif");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { addTaxeToSite } =
        await import("@/services/sites/siteTaxeService");
      const result = await addTaxeToSite(
        siteId,
        formData.taxe_id,
        formData.prix,
      );

      if (result.status === "success") {
        onSuccess();
      } else {
        setError(result.message || "Erreur lors de l'ajout de la taxe");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setProcessing(false);
    }
  };

  const selectedTaxe = taxes.find((t) => t.id === formData.taxe_id);

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
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Ajouter une taxe
              </h3>
              <p className="text-sm text-gray-500">Site: {siteNom}</p>
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

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 text-[#2D5B7A] animate-spin" />
              <span className="ml-2 text-gray-600">
                Chargement des taxes...
              </span>
            </div>
          ) : taxes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucune taxe disponible</p>
              <p className="text-gray-400 text-sm mt-1">
                Toutes les taxes sont déjà associées à ce site
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sélection de la taxe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taxe <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.taxe_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      taxe_id: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                  disabled={processing}
                >
                  <option value={0}>Sélectionner une taxe</option>
                  {taxes.map((taxe) => (
                    <option key={taxe.id} value={taxe.id}>
                      {taxe.nom} ({taxe.periode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Informations de la taxe sélectionnée */}
              {selectedTaxe && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium">
                    {selectedTaxe.nom}
                  </p>
                  {selectedTaxe.description && (
                    <p className="text-xs text-blue-600 mt-1">
                      {selectedTaxe.description}
                    </p>
                  )}
                  <div className="flex items-center mt-2 text-xs text-blue-700">
                    <span className="capitalize">{selectedTaxe.periode}</span>
                    <span className="mx-2">•</span>
                    <span>
                      Prix de base:{" "}
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      }).format(selectedTaxe.prix)}
                    </span>
                  </div>
                </div>
              )}

              {/* Champ Prix */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix pour ce site <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={formData.prix}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prix: parseFloat(e.target.value) || 0,
                      })
                    }
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                    placeholder="0.00"
                    disabled={processing}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Prix minimum applicable pour ce site
                </p>
              </div>
            </div>
          )}
        </div>

        {/* PIED DE PAGE */}
        {!loading && taxes.length > 0 && (
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
              disabled={!formData.taxe_id || formData.prix < 0 || processing}
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#2D5B7A] text-white rounded-lg hover:bg-[#234761] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{processing ? "Ajout..." : "Ajouter"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
