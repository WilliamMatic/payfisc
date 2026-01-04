"use client";

import { useState, useEffect, useCallback } from "react";
import StatsCards from "./StatsCards";
import Filters from "./Filters";
import DetailTable from "./DetailTable";
import WholesaleTable from "./WholesaleTable";
import ReproductionTable from "./ReproductionTable";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardData } from "@/services/dashboards/dashboard";
import { FilterState } from "../page";

interface DashboardClientContentProps {
  defaultFilters: FilterState;
}

export default function DashboardClientContent({ 
  defaultFilters 
}: DashboardClientContentProps) {
  const { utilisateur, isLoading: authLoading } = useAuth();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [counts, setCounts] = useState({
    retail: 0,
    wholesale: 0,
    reproduction: 0,
  });
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Charger les données au chargement initial
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!utilisateur?.id) return;

      try {
        setLoading(true);
        const response = await getDashboardData(utilisateur.id, filters);

        if (response.status === "success" && response.data?.counts) {
          setCounts(response.data.counts);
        }
      } catch (error) {
        console.error("Erreur initialisation dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [utilisateur, refreshTrigger, filters]);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Chargement des données utilisateur...
          </p>
        </div>
      </div>
    );
  }

  if (!utilisateur) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-red-100 max-w-md mx-auto mt-10">
          <h2 className="text-xl font-semibold text-red-600 text-center">
            Non authentifié
          </h2>
          <p className="text-gray-600 mt-2 text-center">
            Veuillez vous connecter pour accéder au tableau de bord.
          </p>
        </div>
      </div>
    );
  }

  // Préparer les filtres pour les tables
  const tableFilters = {
    startDate: filters.startDate,
    endDate: filters.endDate,
    plateNumber: filters.plateNumber,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Tableau de bord - Ventes de plaques motos
            </h1>
            <p className="text-gray-600 mt-2">
              Gestion et suivi des ventes détail, grossiste et reproduction
            </p>
          </div>
        </div>
      </header>

      <StatsCards refreshTrigger={refreshTrigger} />

      <div className="mt-8">
        <Filters onFilterChange={handleFilterChange} loading={loading} />
      </div>

      <div className="mt-10 space-y-10">
        {/* Ventes au détail */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Ventes au détail
            </h2>
            <span className="text-sm text-blue-600 font-medium">
              {counts.retail} transaction{counts.retail !== 1 ? "s" : ""}
            </span>
          </div>
          <DetailTable filters={tableFilters} refreshTrigger={refreshTrigger} />
        </section>

        {/* Ventes grossistes */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Ventes grossistes
            </h2>
            <span className="text-sm text-green-600 font-medium">
              {counts.wholesale} transaction{counts.wholesale !== 1 ? "s" : ""}
            </span>
          </div>
          <WholesaleTable
            filters={tableFilters}
            refreshTrigger={refreshTrigger}
          />
        </section>

        {/* Reproduction de plaques */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Reproduction de plaques
            </h2>
            <span className="text-sm text-amber-600 font-medium">
              {counts.reproduction} transaction
              {counts.reproduction !== 1 ? "s" : ""}
            </span>
          </div>
          <ReproductionTable
            filters={tableFilters}
            refreshTrigger={refreshTrigger}
          />
        </section>
      </div>

      {/* Bouton de rafraîchissement manuel */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => setRefreshTrigger((prev) => prev + 1)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="Rafraîchir les données"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}