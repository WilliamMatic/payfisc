"use client";

import { useState, useEffect } from "react";
import {
  Taxe,
  AdminTaxe,
  getTaxesActives,
  getTaxesByAdmin,
  addTaxeToAdmin,
  removeTaxeFromAdmin,
} from "@/services/admins/taxeAdminService";
import { Loader2, Plus, X, Check, AlertCircle } from "lucide-react";

interface TaxesSectionProps {
  adminId: number;
  adminName: string;
}

export default function TaxesSection({
  adminId,
  adminName,
}: TaxesSectionProps) {
  const [taxes, setTaxes] = useState<Taxe[]>([]);
  const [adminTaxes, setAdminTaxes] = useState<AdminTaxe[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTaxeId, setSelectedTaxeId] = useState<number>(0);

  // Charger les données
  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Charger les taxes actives
      const taxesResult = await getTaxesActives();
      if (taxesResult.status === "success") {
        setTaxes(taxesResult.data || []);
      } else {
        setError(taxesResult.message || "Erreur lors du chargement des taxes");
      }

      // Charger les taxes de l'admin
      const adminTaxesResult = await getTaxesByAdmin(adminId);
      if (adminTaxesResult.status === "success") {
        setAdminTaxes(adminTaxesResult.data || []);
      } else {
        setError(
          adminTaxesResult.message ||
            "Erreur lors du chargement des taxes de l'administrateur",
        );
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  // Charger au montage
  useEffect(() => {
    loadData();
  }, [adminId]);

  // Ajouter une taxe
  const handleAddTaxe = async () => {
    if (!selectedTaxeId) {
      setError("Veuillez sélectionner une taxe");
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await addTaxeToAdmin(adminId, selectedTaxeId);

      if (result.status === "success") {
        setSuccessMessage("Taxe ajoutée avec succès");
        setSelectedTaxeId(0);
        setShowAddModal(false);
        await loadData(); // Recharger les données
      } else {
        setError(result.message || "Erreur lors de l'ajout de la taxe");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setProcessing(false);
    }
  };

  // Supprimer une taxe
  const handleRemoveTaxe = async (taxeId: number) => {
    setProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await removeTaxeFromAdmin(adminId, taxeId);

      if (result.status === "success") {
        setSuccessMessage("Taxe retirée avec succès");
        await loadData(); // Recharger les données
      } else {
        setError(result.message || "Erreur lors du retrait de la taxe");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setProcessing(false);
    }
  };

  // Taxes disponibles (non déjà liées)
  const availableTaxes = taxes.filter(
    (taxe) => !adminTaxes.some((at) => at.taxe_id === taxe.id),
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-6 h-6 text-[#2D5B7A] animate-spin" />
        <span className="ml-2 text-gray-600">Chargement des taxes...</span>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-gray-200 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-semibold text-gray-800">
          Taxes associées à {adminName}
        </h4>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={availableTaxes.length === 0 || processing}
          className="flex items-center space-x-1 px-3 py-1.5 bg-[#2D5B7A] text-white text-sm rounded-lg hover:bg-[#234761] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une taxe</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start">
          <Check className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Liste des taxes associées */}
      <div className="bg-gray-50 rounded-lg p-4">
        {adminTaxes.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            Aucune taxe associée à cet administrateur
          </p>
        ) : (
          <div className="space-y-2">
            {adminTaxes.map((adminTaxe) => (
              <div
                key={adminTaxe.id}
                className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
              >
                <div>
                  <span className="font-medium text-gray-800">
                    {adminTaxe.taxe_nom}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveTaxe(adminTaxe.taxe_id)}
                  disabled={processing}
                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="Retirer cette taxe"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modale d'ajout de taxe */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                Ajouter une taxe
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={processing}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionnez une taxe
                </label>
                <select
                  value={selectedTaxeId}
                  onChange={(e) => setSelectedTaxeId(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A]"
                  disabled={processing}
                >
                  <option value={0}>Choisir une taxe...</option>
                  {availableTaxes.map((taxe) => (
                    <option key={taxe.id} value={taxe.id}>
                      {taxe.nom}
                    </option>
                  ))}
                </select>
              </div>

              {availableTaxes.length === 0 && (
                <p className="text-amber-600 text-sm bg-amber-50 p-3 rounded-lg">
                  Toutes les taxes disponibles sont déjà associées à cet
                  administrateur.
                </p>
              )}

              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
                  disabled={processing}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddTaxe}
                  disabled={!selectedTaxeId || processing}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-[#2D5B7A] text-white rounded-lg hover:bg-[#234761] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{processing ? "Ajout..." : "Ajouter"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
