"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
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
  getCartesRoses,
  annulerCarteRose,
  type CarteRose,
  type RechercheParamsCartesRoses,
} from "@/services/carteRose/carteRoseService";
import DeleteConfirmationModal from "./modal/DeleteConfirmationModal";
import DetailModal from "./modal/DetailModal";
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
          Chargement des cartes roses...
        </h3>
        <p className="text-gray-500">
          Veuillez patienter pendant le chargement des données.
        </p>
      </div>
    </div>
  );
}

// Composant d'erreur pour la table
function TableError({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <Search className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Erreur de chargement
        </h3>
        <p className="text-gray-500 max-w-md mx-auto mb-4">{error}</p>
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
          Aucune carte rose trouvée
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          {hasFilters
            ? "Aucune carte rose ne correspond à votre recherche. Essayez d'autres critères."
            : "Aucune carte rose n'a été délivrée."}
        </p>
      </div>
    </div>
  );
}

interface CartesRosesTableProps {
  searchTerm: string;
  filters: FilterState;
  sites: Site[];
  getSiteName: (siteId: number) => string;
  showMessage: (
    type: "success" | "error" | "info" | "warning",
    title: string,
    message: string,
  ) => void;
  onError: (error: string | null) => void;
  formatDate: (date: string) => string;
  adminId: number;
  onDeleteSuccess?: () => void;
}

export interface CartesRosesTableRef {
  refresh: () => Promise<void>;
}

const CartesRosesTable = forwardRef<CartesRosesTableRef, CartesRosesTableProps>(
  (
    {
      searchTerm,
      filters,
      sites,
      getSiteName,
      showMessage,
      onError,
      formatDate,
      adminId,
      onDeleteSuccess,
    },
    ref,
  ) => {
    // États
    const [cartesRoses, setCartesRoses] = useState<CarteRose[]>([]);
    const [perPage, setPerPage] = useState(20);
    const [pagination, setPagination] = useState({
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    const [selectedCarteRose, setSelectedCarteRose] =
      useState<CarteRose | null>(null);
    const [carteRoseToDelete, setCarteRoseToDelete] =
      useState<CarteRose | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setLocalError] = useState<string | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    // Charger les cartes roses
    const loadCartesRoses = useCallback(
      async (page = 1) => {
        setIsLoading(true);
        setLocalError(null);
        onErrorRef.current(null);

        try {
          const params: RechercheParamsCartesRoses = {
            page,
            limit: perPage,
            search: searchTerm,
            ...filters,
          };

          const result = await getCartesRoses(params);

          if (result.status === "success" && result.data) {
            const cartesRosesArray = Array.isArray(result.data.cartesRoses)
              ? result.data.cartesRoses
              : [];
            setCartesRoses(cartesRosesArray);

            const paginationData = result.data.pagination || {
              total: cartesRosesArray.length,
              page: page,
              limit: perPage,
              totalPages: Math.max(
                1,
                Math.ceil(cartesRosesArray.length / perPage),
              ),
            };

            setPagination(paginationData);

            if (cartesRosesArray.length === 0 && page === 1) {
              const hasFilters = !!(
                searchTerm ||
                filters.date_debut ||
                filters.date_fin ||
                filters.site_id > 0 ||
                filters.type_engin
              );
              if (hasFilters) {
                setLocalError(
                  "Aucune carte rose trouvée avec les critères sélectionnés",
                );
              }
            }
          } else {
            const errorMessage =
              result.message || "Erreur inconnue lors du chargement";
            setLocalError(errorMessage);
            onErrorRef.current(errorMessage);
            setCartesRoses([]);
            setPagination((prev) => ({
              ...prev,
              total: 0,
              totalPages: 1,
            }));
          }
        } catch (error) {
          const errorMessage = "Erreur réseau. Vérifiez votre connexion.";
          setLocalError(errorMessage);
          onErrorRef.current(errorMessage);
          setCartesRoses([]);
          setPagination((prev) => ({
            ...prev,
            total: 0,
            totalPages: 1,
          }));
        } finally {
          setIsLoading(false);
        }
      },
      [searchTerm, filters, perPage],
    );

    // Exposer la méthode refresh au parent via ref
    useImperativeHandle(ref, () => ({
      refresh: async () => {
        await loadCartesRoses(pagination.page);
      },
    }));

    // Chargement initial et quand les filtres changent
    useEffect(() => {
      loadCartesRoses(1);
    }, [loadCartesRoses]);

    // Changer le nombre de lignes par page
    const handlePerPageChange = (val: number) => {
      setPerPage(val);
      setPagination((prev) => ({ ...prev, page: 1, limit: val }));
    };

    // Gérer le changement de page
    const handlePageChange = (page: number) => {
      if (page >= 1 && page <= pagination.totalPages) {
        loadCartesRoses(page);
      }
    };

    // Gérer l'ouverture du détail
    const handleViewDetail = (carteRose: CarteRose) => {
      setSelectedCarteRose(carteRose);
      setShowDetailModal(true);
    };

    // Gérer l'annulation
    const handleDeleteClick = (carteRose: CarteRose, e: React.MouseEvent) => {
      e.stopPropagation();
      setCarteRoseToDelete(carteRose);
      setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
      if (!carteRoseToDelete) return;

      setIsDeleting(true);
      try {
        const result = await annulerCarteRose(
          carteRoseToDelete.paiement_id,
          adminId,
          "Annulation via interface admin",
        );

        if (result.status === "success") {
          await loadCartesRoses(pagination.page);
          setShowDeleteModal(false);
          setCarteRoseToDelete(null);
          showMessage("success", "Succès", "Carte rose annulée avec succès");
          onDeleteSuccess?.();
        } else {
          showMessage(
            "error",
            "Erreur",
            result.message || "Erreur lors de l'annulation",
          );
        }
      } catch (error) {
        showMessage("error", "Erreur", "Erreur réseau lors de l'annulation");
      } finally {
        setIsDeleting(false);
      }
    };

    // Obtenir le nom complet
    const getFullName = (carteRose: CarteRose) => {
      return `${carteRose.nom} ${carteRose.prenom}`;
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
            sur <span className="font-medium">{pagination.total}</span>{" "}
            résultats
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
                },
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

    if (isLoading && cartesRoses.length === 0) {
      return <TableLoading />;
    }

    if (error && cartesRoses.length === 0) {
      return <TableError error={error} onRetry={() => loadCartesRoses(1)} />;
    }

    if (cartesRoses.length === 0) {
      const hasFilters = !!(
        searchTerm ||
        filters.date_debut ||
        filters.date_fin ||
        filters.site_id > 0 ||
        filters.type_engin
      );
      return <EmptyTable hasFilters={hasFilters} />;
    }

    return (
      <>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header info bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50/60">
            <p className="text-sm text-gray-600">
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                  Chargement...
                </span>
              ) : (
                <span>
                  <span className="font-semibold text-gray-800">{pagination.total}</span> résultat{pagination.total > 1 ? "s" : ""}
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Lignes&nbsp;:</span>
              <select
                value={perPage}
                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative overflow-x-auto">
            {/* Loading overlay (quand des données sont déjà affichées) */}
            {isLoading && cartesRoses.length > 0 && (
              <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-700">Mise à jour...</span>
                </div>
              </div>
            )}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Propriétaire
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Téléphone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Plaque
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Véhicule
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
                {cartesRoses.map((carteRose, index) => (
                  <tr
                    key={`${carteRose.paiement_id}-${carteRose.engin_id}-${index}`}
                    className={`transition-colors cursor-pointer hover:bg-blue-50/40 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                    onClick={() => handleViewDetail(carteRose)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(carteRose.date_attribution)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getFullName(carteRose)}
                          </div>
                          <div className="text-sm text-gray-500">
                            NIF: {carteRose.nif || "Non renseigné"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {carteRose.telephone || "Non renseigné"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-50 text-red-700 border border-red-200">
                        <Car className="w-4 h-4 mr-2" />
                        {carteRose.numero_plaque}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {carteRose.type_engin}
                      </div>
                      <div className="text-xs text-gray-500">
                        {carteRose.marque}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getSiteName(carteRose.site_id)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {carteRose.caissier}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div
                        className="flex space-x-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleViewDetail(carteRose)}
                          className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Détail
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(carteRose, e)}
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
          carteRose={selectedCarteRose}
          onClose={() => setShowDetailModal(false)}
          formatDate={formatDate}
        />

        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          carteRose={carteRoseToDelete}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setCarteRoseToDelete(null);
          }}
          isLoading={isDeleting}
          formatDate={formatDate}
        />
      </>
    );
  },
);

CartesRosesTable.displayName = "CartesRosesTable";

export default CartesRosesTable;
