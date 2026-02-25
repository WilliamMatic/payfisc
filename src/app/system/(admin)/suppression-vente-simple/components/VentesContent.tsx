"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react"; // Ajout de useRef
import {
  Search,
  Filter as FilterIcon,
  XCircle,
  RefreshCw,
  AlertCircle,
  Building,
  CalendarDays,
} from "lucide-react";
import { getSitesDisponibles } from "@/services/ventes/ventesService";
import StatsCards from "./StatsCards";
import VentesTable from "./VentesTable";
import FilterModal from "./modals/FilterModal";
import MessageModal from "./modals/MessageModal";
import type { FilterState, Site } from "../types";

export default function VentesContent() {
  // États principaux
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModalProps, setMessageModalProps] = useState<{
    type: "success" | "error" | "info" | "warning";
    title: string;
    message: string;
  }>({
    type: "info",
    title: "",
    message: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([
    { id: 8, nom: "LIMETE", code: "LMT" },
  ]);

  // Références pour contrôler les composants enfants
  const statsCardsRef = useRef<{ refresh: () => Promise<void> }>(null);
  const ventesTableRef = useRef<{ refresh: () => Promise<void> }>(null);

  // États filtres
  const [filters, setFilters] = useState<FilterState>({
    date_debut: "",
    date_fin: "",
    site_id: 0,
    order_by: "date_paiement",
    order_dir: "DESC",
  });

  // Fonction pour obtenir le nom du site
  const getSiteName = useCallback((siteId: number): string => {
    const site = sites.find(s => s.id === siteId);
    return site ? `${site.nom} (${site.code})` : `Site ${siteId}`;
  }, [sites]);

  // Fonction pour afficher les messages
  const showMessage = (type: "success" | "error" | "info" | "warning", title: string, message: string) => {
    setMessageModalProps({ type, title, message });
    setShowMessageModal(true);
  };

  // Fonction pour rafraîchir toutes les données
  const refreshAllData = useCallback(async () => {
    setError(null);
    
    // Rafraîchir les stats
    if (statsCardsRef.current) {
      await statsCardsRef.current.refresh();
    }
    
    // Rafraîchir la table
    if (ventesTableRef.current) {
      await ventesTableRef.current.refresh();
    }
  }, []);

  // Charger les sites
  useEffect(() => {
    const loadSites = async () => {
      try {
        const result = await getSitesDisponibles();
        
        if (result.status === "success" && result.data) {
          setSites(result.data);
        } else {
          setSites([{ id: 8, nom: "LIMETE", code: "LMT" }]);
        }
      } catch (error) {
        setSites([{ id: 8, nom: "LIMETE", code: "LMT" }]);
      }
    };

    loadSites();
  }, []);

  // Gérer la recherche
  const handleSearch = useCallback(() => {
    // Cette fonction sera passée au composant VentesTable
    // qui gère sa propre logique de rechargement
  }, []);

  // Gérer les filtres
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setShowFilterModal(false);
  };

  const handleResetFilters = () => {
    const resetFilters: FilterState = {
      date_debut: "",
      date_fin: "",
      site_id: 0,
      order_by: "date_paiement",
      order_dir: "DESC",
    };
    setFilters(resetFilters);
    setSearchTerm("");
    setError(null);
    showMessage("info", "Filtres réinitialisés", "Tous les filtres ont été réinitialisés");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* En-tête */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Ventes Non-Grossistes
              </h1>
              <p className="text-gray-600 mt-2">
                Gestion des ventes aux particuliers
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
                onClick={refreshAllData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
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

          {/* Statistiques avec Suspense */}
          <StatsCards 
            ref={statsCardsRef}
            searchTerm={searchTerm}
            filters={filters}
            onError={setError}
          />

          {/* Barre de recherche */}
          <div className="mt-6">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Rechercher par nom, plaque, téléphone..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Filtres actifs */}
            <div className="mt-3 flex flex-wrap gap-2">
              {(filters.date_debut ||
                filters.date_fin ||
                filters.site_id > 0) && (
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
                      Site: {getSiteName(filters.site_id)}
                    </span>
                  )}
                </>
              )}
              {searchTerm && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800">
                  <Search className="w-3 h-3 mr-1" />
                  Recherche: {searchTerm}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Table des ventes avec Suspense */}
        <VentesTable 
          ref={ventesTableRef}
          searchTerm={searchTerm}
          filters={filters}
          sites={sites}
          getSiteName={getSiteName}
          showMessage={showMessage}
          onError={setError}
        />
      </div>

      {/* Modals */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        sites={sites}
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