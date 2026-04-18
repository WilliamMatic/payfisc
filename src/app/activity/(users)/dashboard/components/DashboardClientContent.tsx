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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#153258] to-[#1e4a7a] rounded-2xl p-6 md:p-8 shadow-xl">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-10 -top-10 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-[#23A974] rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Tableau de bord
                </h1>
              </div>
              <p className="text-blue-100/80 ml-[52px]">
                Ventes de plaques motos — Suivi en temps réel
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl text-sm text-white/90 border border-white/10">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span>{utilisateur?.site_nom || "—"}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl text-sm text-white/90 border border-white/10">
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <StatsCards refreshTrigger={refreshTrigger} />

      {/* Filters */}
      <div className="mt-8">
        <Filters onFilterChange={handleFilterChange} loading={loading} />
      </div>

      {/* Tables */}
      <div className="mt-10 space-y-8">
        {/* Ventes au détail */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-blue-500 rounded-full" />
              <h2 className="text-lg font-semibold text-gray-800">
                Ventes au détail
              </h2>
            </div>
            <span className="text-sm bg-blue-50 text-blue-700 font-medium px-3 py-1 rounded-full">
              {counts.retail} transaction{counts.retail !== 1 ? "s" : ""}
            </span>
          </div>
          <DetailTable filters={tableFilters} refreshTrigger={refreshTrigger} />
        </section>

        {/* Ventes grossistes */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-emerald-500 rounded-full" />
              <h2 className="text-lg font-semibold text-gray-800">
                Ventes grossistes
              </h2>
            </div>
            <span className="text-sm bg-emerald-50 text-emerald-700 font-medium px-3 py-1 rounded-full">
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
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-amber-500 rounded-full" />
              <h2 className="text-lg font-semibold text-gray-800">
                Reproduction de plaques
              </h2>
            </div>
            <span className="text-sm bg-amber-50 text-amber-700 font-medium px-3 py-1 rounded-full">
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

      {/* Bouton de rafraîchissement */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setRefreshTrigger((prev) => prev + 1)}
          className="group bg-gradient-to-r from-[#153258] to-[#1e4a7a] text-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          title="Rafraîchir les données"
        >
          <svg
            className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500"
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