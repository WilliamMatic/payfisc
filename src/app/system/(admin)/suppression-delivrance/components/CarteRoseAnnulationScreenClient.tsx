"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterIcon, XCircle, RefreshCw, AlertCircle, CalendarDays, Building, Search as SearchIcon, Car as CarIcon } from "lucide-react";
import { CarteRoseTable } from "./CarteRoseTable";
import { StatsCards } from "./StatsCards";
import { SearchBar } from "./SearchBar";
import { FilterModal } from "./FilterModal";
import { DetailModal } from "./DetailModal";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { MessageModal } from "./MessageModal";
import type { 
  CarteRose, 
  StatsCartesRoses, 
  Site, 
  TypeVehicule, 
  FilterState 
} from "../types/carteRoseTypes";
import { handleAnnulerCarteRose } from "../actions/carteRoseActions";

interface CarteRoseAnnulationScreenClientProps {
  initialCartesRoses: CarteRose[];
  initialPagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  initialStats: StatsCartesRoses | null;
  initialSites: Site[];
  initialTypesVehicules: TypeVehicule[];
  initialFilters: FilterState;
  initialSearchTerm: string;
}

export default function CarteRoseAnnulationScreenClient({
  initialCartesRoses,
  initialPagination,
  initialStats,
  initialSites,
  initialTypesVehicules,
  initialFilters,
  initialSearchTerm,
}: CarteRoseAnnulationScreenClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // États
  const [cartesRoses, setCartesRoses] = useState(initialCartesRoses);
  const [pagination, setPagination] = useState(initialPagination);
  const [stats, setStats] = useState(initialStats);
  const [sites] = useState(initialSites);
  const [typesVehicules] = useState(initialTypesVehicules);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  
  const [selectedCarteRose, setSelectedCarteRose] = useState<CarteRose | null>(null);
  const [carteRoseToDelete, setCarteRoseToDelete] = useState<CarteRose | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModalProps, setMessageModalProps] = useState({
    type: "info" as "success" | "error" | "info" | "warning",
    title: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mise à jour des URL params
  const updateUrlParams = useCallback((newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  // Gérer la recherche
  const handleSearch = useCallback(() => {
    updateUrlParams({
      search: searchTerm,
      page: "1",
    });
  }, [searchTerm, updateUrlParams]);

  // Gérer le changement de page
  const handlePageChange = useCallback((page: number) => {
    updateUrlParams({ page: page.toString() });
  }, [updateUrlParams]);

  // Gérer les filtres
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    updateUrlParams({
      date_debut: newFilters.date_debut,
      date_fin: newFilters.date_fin,
      site_id: newFilters.site_id.toString(),
      type_engin: newFilters.type_engin,
      order_by: newFilters.order_by,
      order_dir: newFilters.order_dir,
      page: "1",
    });
  }, [updateUrlParams]);

  const handleApplyFilters = () => {
    setShowFilterModal(false);
  };

  const handleResetFilters = useCallback(() => {
    const resetFilters: FilterState = {
      date_debut: "",
      date_fin: "",
      site_id: 0,
      type_engin: "",
      order_by: "date_attribution",
      order_dir: "DESC",
    };
    
    setFilters(resetFilters);
    setSearchTerm("");
    setError(null);
    
    updateUrlParams({
      date_debut: "",
      date_fin: "",
      site_id: "0",
      type_engin: "",
      order_by: "date_attribution",
      order_dir: "DESC",
      search: "",
      page: "1",
    });
    
    showMessage("info", "Filtres réinitialisés", "Tous les filtres ont été réinitialisés");
  }, [updateUrlParams]);

  // Gérer les modales
  const handleViewDetail = (carteRose: CarteRose) => {
    setSelectedCarteRose(carteRose);
    setShowDetailModal(true);
  };

  const handleDeleteClick = (carteRose: CarteRose, e: React.MouseEvent) => {
    e.stopPropagation();
    setCarteRoseToDelete(carteRose);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!carteRoseToDelete) return;

    setIsDeleting(true);
    try {
      const result = await handleAnnulerCarteRose(
        carteRoseToDelete.paiement_id,
        1, // ID utilisateur - à remplacer par l'ID réel de l'utilisateur connecté
        "Annulation via interface admin"
      );

      if (result.success) {
        // Rafraîchir la page pour voir les changements
        router.refresh();
        setShowDeleteModal(false);
        setCarteRoseToDelete(null);
        showMessage("success", "Succès", result.message);
      } else {
        showMessage("error", "Erreur", result.message);
      }
    } catch (error) {
      showMessage("error", "Erreur", "Erreur réseau lors de l'annulation");
    } finally {
      setIsDeleting(false);
    }
  };

  // Afficher les messages
  const showMessage = (type: "success" | "error" | "info" | "warning", title: string, message: string) => {
    setMessageModalProps({ type, title, message });
    setShowMessageModal(true);
  };

  // Calculer les statistiques des types de véhicules
  const getTopTypesVehicules = () => {
    if (!stats?.typesVehicules) return [];
    
    return Object.entries(stats.typesVehicules)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* En-tête */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Annulation des Cartes Roses
              </h1>
              <p className="text-gray-600 mt-2">
                Gestion des annulations de cartes roses délivrées
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilterModal(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <FilterIcon className="w-4 h-4" />
                <span>Filtres</span>
              </button>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center space-x-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Effacer</span>
              </button>
              <button
                onClick={() => router.refresh()}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Actualiser</span>
              </button>
            </div>
          </div>

          {/* Affichage des erreurs */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Statistiques */}
          <div className="mt-6">
            <StatsCards stats={stats} />
          </div>

          {/* Types de véhicules (top 5) */}
          {stats?.typesVehicules && Object.keys(stats.typesVehicules).length > 0 && (
            <div className="mt-6 bg-white rounded-xl p-4 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Répartition par type de véhicule</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {getTopTypesVehicules().map(({ type, count }) => (
                  <div key={type} className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">{type}</div>
                    <div className="text-xl font-bold text-gray-900">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Barre de recherche */}
          <div className="mt-6">
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onSearch={handleSearch}
              isLoading={isLoading}
            />

            {/* Filtres actifs */}
            <div className="mt-3 flex flex-wrap gap-2">
              {(filters.date_debut ||
                filters.date_fin ||
                filters.site_id > 0 ||
                filters.type_engin) && (
                <>
                  {filters.date_debut && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                      <CalendarDays className="w-3 h-3 mr-1" />
                      Début: {filters.date_debut}
                    </span>
                  )}
                  {filters.date_fin && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                      <CalendarDays className="w-3 h-3 mr-1" />
                      Fin: {filters.date_fin}
                    </span>
                  )}
                  {filters.site_id > 0 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                      <Building className="w-3 h-3 mr-1" />
                      Site:{" "}
                      {sites.find((s) => s.id === filters.site_id)?.nom ||
                        filters.site_id}
                    </span>
                  )}
                  {filters.type_engin && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800">
                      <CarIcon className="w-3 h-3 mr-1" />
                      Type: {filters.type_engin}
                    </span>
                  )}
                </>
              )}
              {searchTerm && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800">
                  <SearchIcon className="w-3 h-3 mr-1" />
                  Recherche: {searchTerm}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Liste des cartes roses */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <CarteRoseTable
            cartesRoses={cartesRoses}
            pagination={pagination}
            filters={filters}
            isLoading={isLoading}
            error={error}
            onPageChange={handlePageChange}
            onViewDetail={handleViewDetail}
            onDeleteClick={handleDeleteClick}
          />
        </div>
      </div>

      {/* Modals */}
      <DetailModal
        isOpen={showDetailModal}
        carteRose={selectedCarteRose}
        onClose={() => setShowDetailModal(false)}
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
      />

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        sites={sites}
        typesVehicules={typesVehicules}
      />

      <MessageModal
        isOpen={showMessageModal}
        type={messageModalProps.type}
        title={messageModalProps.title}
        message={messageModalProps.message}
        onClose={() => setShowMessageModal(false)}
      />
    </div>
  );
}