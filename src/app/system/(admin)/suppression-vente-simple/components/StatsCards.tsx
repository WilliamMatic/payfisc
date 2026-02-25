"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { FileText, DollarSign, Users, BarChart3, Loader2 } from "lucide-react";
import { getStatsVentes } from "@/services/ventes/ventesService";
import type { Stats, FilterState } from "../types";

// Composant de chargement pour les stats
function StatsLoading() {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-100 rounded-xl p-4 h-24 animate-pulse">
          <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
          <div className="h-8 w-32 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
}

// Composant d'erreur pour les stats
function StatsError() {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-red-50 rounded-xl p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Erreur</p>
              <p className="text-lg font-bold text-red-800">---</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Formatage du montant
const formatMontant = (montant: number): string => {
  return `${montant.toFixed(2).replace(".", ",")} $`;
};

interface StatsCardsProps {
  searchTerm: string;
  filters: FilterState;
  onError: (error: string | null) => void;
}

export interface StatsCardsRef {
  refresh: () => Promise<void>;
}

const StatsCards = forwardRef<StatsCardsRef, StatsCardsProps>(({ searchTerm, filters, onError }, ref) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setLocalError] = useState<string | null>(null);

  const loadStats = async () => {
    setIsLoading(true);
    setLocalError(null);
    onError(null);
    
    try {
      const params = {
        search: searchTerm,
        date_debut: filters.date_debut,
        date_fin: filters.date_fin,
        site_id: filters.site_id,
      };

      const result = await getStatsVentes(params);

      if (result.status === "success" && result.data) {
        setStats(result.data);
      } else {
        setStats(null);
        setLocalError(result.message || "Erreur lors du chargement des statistiques");
        onError(result.message || "Erreur lors du chargement des statistiques");
      }
    } catch (error) {
      setStats(null);
      setLocalError("Erreur réseau");
      onError("Erreur réseau");
    } finally {
      setIsLoading(false);
    }
  };

  // Exposer la méthode refresh au parent via ref
  useImperativeHandle(ref, () => ({
    refresh: async () => {
      await loadStats();
    }
  }));

  useEffect(() => {
    let isMounted = true;

    const loadStatsMounted = async () => {
      setIsLoading(true);
      setLocalError(null);
      onError(null);
      
      try {
        const params = {
          search: searchTerm,
          date_debut: filters.date_debut,
          date_fin: filters.date_fin,
          site_id: filters.site_id,
        };

        const result = await getStatsVentes(params);

        if (isMounted) {
          if (result.status === "success" && result.data) {
            setStats(result.data);
          } else {
            setStats(null);
            setLocalError(result.message || "Erreur lors du chargement des statistiques");
            onError(result.message || "Erreur lors du chargement des statistiques");
          }
        }
      } catch (error) {
        if (isMounted) {
          setStats(null);
          setLocalError("Erreur réseau");
          onError("Erreur réseau");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStatsMounted();

    return () => {
      isMounted = false;
    };
  }, [searchTerm, filters, onError]);

  if (isLoading) {
    return <StatsLoading />;
  }

  if (error || !stats) {
    return <StatsError />;
  }

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-700 font-medium">
              Total Ventes
            </p>
            <p className="text-2xl font-bold text-blue-800">
              {stats.total}
            </p>
          </div>
          <FileText className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-700 font-medium">
              Montant Total
            </p>
            <p className="text-2xl font-bold text-green-800">
              {formatMontant(stats.montantTotal)}
            </p>
          </div>
          <DollarSign className="w-8 h-8 text-green-600" />
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-purple-700 font-medium">
              Clients Uniques
            </p>
            <p className="text-2xl font-bold text-purple-800">
              {stats.clientsUniques}
            </p>
          </div>
          <Users className="w-8 h-8 text-purple-600" />
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-amber-700 font-medium">
              Montant Moyen
            </p>
            <p className="text-2xl font-bold text-amber-800">
              {formatMontant(stats.montantMoyen)}
            </p>
          </div>
          <BarChart3 className="w-8 h-8 text-amber-600" />
        </div>
      </div>
    </div>
  );
});

StatsCards.displayName = "StatsCards";

export default StatsCards;