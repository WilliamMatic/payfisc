"use client";

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import {
  User,
  Car,
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
  getCommandesPlaques,
  annulerCommandePlaques,
  type CommandePlaque,
  type RechercheParams,
} from "@/services/commande/commandesService";
import DeleteConfirmationModal from "./modals/DeleteConfirmationModal";
import DetailModal from "./modals/DetailModal";
import type { FilterState, Site } from "../types"; // Retiré formatDate de l'import

// Composant de chargement pour la table
function TableLoading() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Chargement des commandes...
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
          Aucune commande trouvée
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          {hasFilters
            ? "Aucune commande ne correspond à votre recherche. Essayez d'autres critères."
            : "Aucune commande de plaques n'a été enregistrée."}
        </p>
      </div>
    </div>
  );
}

// Formatage du montant
const formatMontant = (montant: number): string => {
  return `${montant} $`;
};

// Formatage de la date (fonction locale)
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
};

interface CommandesTableProps {
  searchTerm: string;
  filters: FilterState;
  sites: Site[];
  getSiteName: (siteId: number) => string;
  showMessage: (type: "success" | "error" | "info" | "warning", title: string, message: string) => void;
  onError: (error: string | null) => void;
}

export interface CommandesTableRef {
  refresh: () => Promise<void>;
}

const CommandesTable = forwardRef<CommandesTableRef, CommandesTableProps>(({ 
  searchTerm, 
  filters, 
  sites,
  getSiteName,
  showMessage,
  onError 
}, ref) => {
  // États
  const [commandes, setCommandes] = useState<CommandePlaque[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [selectedCommande, setSelectedCommande] = useState<CommandePlaque | null>(null);
  const [commandeToDelete, setCommandeToDelete] = useState<CommandePlaque | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setLocalError] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Charger les commandes
  const loadCommandes = useCallback(async (page = 1) => {
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

      const result = await getCommandesPlaques(params);

      if (result.status === "success" && result.data) {
        const commandesArray = Array.isArray(result.data.commandes) ? result.data.commandes : [];
        setCommandes(commandesArray);

        const paginationData = result.data.pagination || {
          total: commandesArray.length,
          page: page,
          limit: pagination.limit,
          totalPages: Math.max(1, Math.ceil(commandesArray.length / pagination.limit)),
        };

        setPagination(paginationData);

        if (commandesArray.length === 0 && page === 1) {
          const hasFilters = !!(searchTerm || filters.date_debut || filters.date_fin || filters.site_id > 0);
          if (hasFilters) {
            setLocalError("Aucune commande trouvée avec les critères sélectionnés");
          }
        }
      } else {
        const errorMessage = result.message || "Erreur inconnue lors du chargement";
        setLocalError(errorMessage);
        onError(errorMessage);
        setCommandes([]);
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
      setCommandes([]);
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
      await loadCommandes(pagination.page);
    }
  }));

  // Chargement initial et quand les filtres changent
  useEffect(() => {
    loadCommandes(1);
  }, [loadCommandes]);

  // Gérer le changement de page
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadCommandes(page);
    }
  };

  // Gérer l'ouverture du détail
  const handleViewDetail = (commande: CommandePlaque) => {
    setSelectedCommande(commande);
    setShowDetailModal(true);
  };

  // Gérer l'annulation
  const handleDeleteClick = (commande: CommandePlaque, e: React.MouseEvent) => {
    e.stopPropagation();
    setCommandeToDelete(commande);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!commandeToDelete) return;

    setIsDeleting(true);
    try {
      const result = await annulerCommandePlaques(
        commandeToDelete.id,
        1, // ID utilisateur - à remplacer par l'ID réel de l'utilisateur connecté
        "Annulation via interface admin"
      );

      if (result.status === "success") {
        await loadCommandes(pagination.page);
        setShowDeleteModal(false);
        setCommandeToDelete(null);
        showMessage("success", "Succès", "Commande annulée avec succès");
      } else {
        showMessage("error", "Erreur", result.message || "Erreur lors de l'annulation");
      }
    } catch (error) {
      showMessage("error", "Erreur", "Erreur réseau lors de l'annulation");
    } finally {
      setIsDeleting(false);
    }
  };

  // Obtenir le nom complet
  const getFullName = (commande: CommandePlaque) => {
    return `${commande.nom} ${commande.prenom}`;
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

  if (isLoading && commandes.length === 0) {
    return <TableLoading />;
  }

  if (error && commandes.length === 0) {
    return <TableError error={error} onRetry={() => loadCommandes(1)} />;
  }

  if (commandes.length === 0) {
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
                  Téléphone
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  N° Plaques
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Montant
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
              {commandes.map((commande) => (
                <tr
                  key={commande.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleViewDetail(commande)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(commande.date_paiement)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getFullName(commande)}
                        </div>
                        <div className="text-sm text-gray-500">
                          NIF: {commande.nif || "Non renseigné"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {commande.telephone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-50 text-red-700 border border-red-200">
                      <Car className="w-4 h-4 mr-2" />
                      {commande.nombre_plaques} plaque(s)
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-bold text-green-600">
                      {formatMontant(commande.montant)}
                    </div>
                    {commande.montant_initial > commande.montant && (
                      <div className="text-xs text-gray-500 line-through">
                        {formatMontant(commande.montant_initial)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getSiteName(commande.site_id)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {commande.caissier}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div
                      className="flex space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleViewDetail(commande)}
                        className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Détail
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(commande, e)}
                        className="inline-flex items-center px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Annuler
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
        commande={selectedCommande}
        onClose={() => setShowDetailModal(false)}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        commande={commandeToDelete}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setCommandeToDelete(null);
        }}
        isLoading={isDeleting}
        formatMontant={formatMontant}
        formatDate={formatDate}
      />
    </>
  );
});

CommandesTable.displayName = "CommandesTable";

export default CommandesTable;