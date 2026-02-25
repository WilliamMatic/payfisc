"use client";

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import {
  User,
  Bike,
  Phone,
  Trash2,
  Eye,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  getVentesNonGrossistes,
  supprimerVenteNonGrossiste,
  type VenteNonGrossiste,
  type RechercheParams,
} from "@/services/ventes/ventesService";
import DeleteConfirmationModal from "./modals/DeleteConfirmationModal";
import DetailModal from "./modals/DetailModal";
import type { FilterState, Site } from "../types";

// Composant de chargement pour la table
function TableLoading() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Chargement des ventes...
        </h3>
        <p className="text-gray-500">
          Veuillez patienter pendant le chargement des données.
        </p>
      </div>
    </div>
  );
}

// Composant d'erreur pour la table
function TableError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <Search className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Erreur de chargement
        </h3>
        <p className="text-gray-500 max-w-md mx-auto mb-4">
          {error}
        </p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

// Composant de table vide
function EmptyTable({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucune vente trouvée
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          {hasFilters
            ? "Aucune vente ne correspond à votre recherche. Essayez d'autres critères."
            : "Aucune vente non-grossiste n'a été enregistrée."}
        </p>
      </div>
    </div>
  );
}

// Formatage du montant
const formatMontant = (montant: number): string => {
  return `${montant.toFixed(2).replace(".", ",")} $`;
};

interface VentesTableProps {
  searchTerm: string;
  filters: FilterState;
  sites: Site[];
  getSiteName: (siteId: number) => string;
  showMessage: (type: "success" | "error" | "info" | "warning", title: string, message: string) => void;
  onError: (error: string | null) => void;
}

export interface VentesTableRef {
  refresh: () => Promise<void>;
}

const VentesTable = forwardRef<VentesTableRef, VentesTableProps>(({ 
  searchTerm, 
  filters, 
  sites,
  getSiteName,
  showMessage,
  onError 
}, ref) => {
  // États
  const [ventes, setVentes] = useState<VenteNonGrossiste[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [selectedVente, setSelectedVente] = useState<VenteNonGrossiste | null>(null);
  const [venteToDelete, setVenteToDelete] = useState<VenteNonGrossiste | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setLocalError] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Charger les ventes
  const loadVentes = useCallback(async (page = 1) => {
    setIsLoading(true);
    setLocalError(null);
    onError(null);
    
    try {
      const params: RechercheParams = {
        page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters,
      };

      const result = await getVentesNonGrossistes(params);

      if (result.status === "success" && result.data) {
        const ventesArray = Array.isArray(result.data.ventes) ? result.data.ventes : [];
        setVentes(ventesArray);

        const paginationData = result.data.pagination || {
          total: ventesArray.length,
          page: page,
          limit: pagination.limit,
          totalPages: Math.max(1, Math.ceil(ventesArray.length / pagination.limit)),
        };

        setPagination(paginationData);

        if (ventesArray.length === 0 && page === 1) {
          const hasFilters = !!(searchTerm || filters.date_debut || filters.date_fin || filters.site_id > 0);
          if (hasFilters) {
            setLocalError("Aucune vente trouvée avec les critères sélectionnés");
          }
        }
      } else {
        const errorMessage = result.message || "Erreur inconnue lors du chargement";
        setLocalError(errorMessage);
        onError(errorMessage);
        setVentes([]);
        setPagination(prev => ({
          ...prev,
          total: 0,
          totalPages: 1,
        }));
      }
    } catch (error) {
      const errorMessage = "Erreur réseau. Vérifiez votre connexion.";
      setLocalError(errorMessage);
      onError(errorMessage);
      setVentes([]);
      setPagination(prev => ({
        ...prev,
        total: 0,
        totalPages: 1,
      }));
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filters, pagination.limit, onError]);

  // Exposer la méthode refresh au parent via ref
  useImperativeHandle(ref, () => ({
    refresh: async () => {
      await loadVentes(pagination.page);
    }
  }));

  // Chargement initial et quand les filtres changent
  useEffect(() => {
    loadVentes(1);
  }, [loadVentes]);

  // Gérer le changement de page
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadVentes(page);
    }
  };

  // Gérer l'ouverture du détail
  const handleViewDetail = (vente: VenteNonGrossiste) => {
    setSelectedVente(vente);
    setShowDetailModal(true);
  };

  // Gérer la suppression
  const handleDeleteClick = (vente: VenteNonGrossiste, e: React.MouseEvent) => {
    e.stopPropagation();
    setVenteToDelete(vente);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!venteToDelete) return;

    setIsDeleting(true);
    try {
      const result = await supprimerVenteNonGrossiste(
        venteToDelete.paiement_id,
        1,
        "Suppression via interface admin"
      );

      if (result.status === "success") {
        await loadVentes(pagination.page);
        setShowDeleteModal(false);
        setVenteToDelete(null);
        showMessage("success", "Succès", "Vente supprimée avec succès");
      } else {
        showMessage("error", "Erreur", result.message || "Erreur lors de la suppression");
      }
    } catch (error) {
      showMessage("error", "Erreur", "Erreur réseau lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  // Obtenir le nom complet
  const getFullName = (vente: VenteNonGrossiste) => {
    return `${vente.nom} ${vente.prenom}`;
  };

  // Pagination UI
  const renderPagination = () => {
    if (pagination.totalPages <= 1 || pagination.total === 0) return null;

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          Affichage de{" "}
          <span className="font-medium">
            {(pagination.page - 1) * pagination.limit + 1}
          </span>{" "}
          à{" "}
          <span className="font-medium">
            {Math.min(pagination.page * pagination.limit, pagination.total)}
          </span>{" "}
          sur <span className="font-medium">{pagination.total}</span> résultats
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={pagination.page === 1 || isLoading}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || isLoading}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-1">
            {Array.from(
              { length: Math.min(5, pagination.totalPages) },
              (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isLoading}
                    className={`w-8 h-8 rounded-lg ${
                      pagination.page === pageNum
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
            )}
          </div>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages || isLoading}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => handlePageChange(pagination.totalPages)}
            disabled={pagination.page === pagination.totalPages || isLoading}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (isLoading && ventes.length === 0) {
    return <TableLoading />;
  }

  if (error && ventes.length === 0) {
    return <TableError error={error} onRetry={() => loadVentes(1)} />;
  }

  if (ventes.length === 0) {
    const hasFilters = !!(searchTerm || filters.date_debut || filters.date_fin || filters.site_id > 0);
    return <EmptyTable hasFilters={hasFilters} />;
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Numéro de plaque
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Téléphone
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Site
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ventes.map((vente) => (
                <tr
                  key={vente.paiement_id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleViewDetail(vente)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {vente.date_paiement}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getFullName(vente)}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {vente.particulier_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-50 text-red-700 border border-red-200">
                      <Bike className="w-4 h-4 mr-2" />
                      {vente.numero_plaque}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`text-lg font-bold ${
                        parseFloat(vente.montant.toString()) > 0
                          ? "text-green-600"
                          : "text-gray-600"
                      }`}
                    >
                      {formatMontant(
                        parseFloat(vente.montant.toString())
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {vente.mode_paiement}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {vente.telephone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getSiteName(vente.site_id)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {vente.utilisateur_nom}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div
                      className="flex space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleViewDetail(vente)}
                        className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Détail
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(vente, e)}
                        className="inline-flex items-center px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* Modals */}
      <DetailModal
        isOpen={showDetailModal}
        vente={selectedVente}
        onClose={() => setShowDetailModal(false)}
        getSiteName={getSiteName}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        vente={venteToDelete}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setVenteToDelete(null);
        }}
        isLoading={isDeleting}
        formatMontant={formatMontant}
      />
    </>
  );
});

VentesTable.displayName = "VentesTable";

export default VentesTable;