"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Receipt,
  Loader2,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { SiteTaxe, Taxe } from "@/services/sites/siteTaxeService";
import AddSiteTaxeModal from "./modals/taxes/AddSiteTaxeModal";
import EditSiteTaxeModal from "./modals/taxes/EditSiteTaxeModal";
import DeleteSiteTaxeModal from "./modals/taxes/DeleteSiteTaxeModal";
import StatusSiteTaxeModal from "./modals/taxes/StatusSiteTaxeModal";

interface SiteTaxesModalProps {
  siteId: number;
  siteNom: string;
  onClose: () => void;
}

export default function SiteTaxesModal({
  siteId,
  siteNom,
  onClose,
}: SiteTaxesModalProps) {
  const [taxes, setTaxes] = useState<SiteTaxe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // États pour les modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTaxe, setSelectedTaxe] = useState<SiteTaxe | null>(null);
  const [processing, setProcessing] = useState(false);

  // Charger les taxes du site
  const loadTaxes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { getTaxesBySite } =
        await import("@/services/sites/siteTaxeService");
      const result = await getTaxesBySite(siteId);

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

  useEffect(() => {
    loadTaxes();
  }, [siteId]);

  // Effacer les messages après un délai
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const openEditModal = (taxe: SiteTaxe) => {
    setSelectedTaxe(taxe);
    setShowEditModal(true);
  };

  const openDeleteModal = (taxe: SiteTaxe) => {
    setSelectedTaxe(taxe);
    setShowDeleteModal(true);
  };

  const openStatusModal = (taxe: SiteTaxe) => {
    setSelectedTaxe(taxe);
    setShowStatusModal(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
        <div
          className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in-90 zoom-in-90 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* EN-TÊTE */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center">
              <div className="bg-[#2D5B7A] p-2 rounded-lg mr-3">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Taxes du site
                </h3>
                <p className="text-sm text-gray-500">
                  {siteNom} • Gérez les taxes applicables à ce site
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* CORPS */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm">{successMessage}</p>
              </div>
            )}

            {/* Barre d'actions */}
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-700">
                Liste des taxes ({taxes.length})
              </h4>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-[#2D5B7A] text-white rounded-lg hover:bg-[#234761] transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter une taxe</span>
              </button>
            </div>

            {/* Tableau des taxes */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-[#2D5B7A] animate-spin" />
                <span className="ml-3 text-gray-600">
                  Chargement des taxes...
                </span>
              </div>
            ) : taxes.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  Aucune taxe associée
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Cliquez sur "Ajouter une taxe" pour commencer
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Taxe
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Période
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Prix
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {taxes.map((taxe) => (
                      <tr
                        key={taxe.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 text-sm">
                            {taxe.taxe_nom}
                          </div>
                          {taxe.taxe_description && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {taxe.taxe_description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 capitalize">
                            {taxe.taxe_periode}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">
                            {formatPrice(taxe.prix)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              taxe.status
                                ? "bg-green-50 text-green-700 border border-green-100"
                                : "bg-gray-100 text-gray-600 border border-gray-200"
                            }`}
                          >
                            {taxe.status ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {taxe.date_create}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => openStatusModal(taxe)}
                              className={`p-2 rounded-lg transition-colors ${
                                taxe.status
                                  ? "text-gray-500 hover:bg-gray-100"
                                  : "text-green-600 hover:bg-green-50"
                              }`}
                              title={taxe.status ? "Désactiver" : "Activer"}
                            >
                              {taxe.status ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => openEditModal(taxe)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(taxe)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* PIED DE PAGE */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* Modales pour les actions */}
      {showAddModal && (
        <AddSiteTaxeModal
          siteId={siteId}
          siteNom={siteNom}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadTaxes();
            setSuccessMessage("Taxe ajoutée avec succès");
          }}
        />
      )}

      {showEditModal && selectedTaxe && (
        <EditSiteTaxeModal
          siteTaxe={selectedTaxe}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTaxe(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedTaxe(null);
            loadTaxes();
            setSuccessMessage("Taxe modifiée avec succès");
          }}
        />
      )}

      {showDeleteModal && selectedTaxe && (
        <DeleteSiteTaxeModal
          siteTaxe={selectedTaxe}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedTaxe(null);
          }}
          onSuccess={() => {
            setShowDeleteModal(false);
            setSelectedTaxe(null);
            loadTaxes();
            setSuccessMessage("Taxe supprimée avec succès");
          }}
        />
      )}

      {showStatusModal && selectedTaxe && (
        <StatusSiteTaxeModal
          siteTaxe={selectedTaxe}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedTaxe(null);
          }}
          onSuccess={() => {
            setShowStatusModal(false);
            setSelectedTaxe(null);
            loadTaxes();
            setSuccessMessage(
              `Taxe ${selectedTaxe.status ? "désactivée" : "activée"} avec succès`,
            );
          }}
        />
      )}
    </>
  );
}
