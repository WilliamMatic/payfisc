// src/app/system/(admin)/plaques/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  getSeries,
  Serie,
  PaginationResponse,
} from "@/services/plaques/plaqueService";
import PlaqueClient from "./components/PlaqueClient";
import { useAuth } from "@/contexts/AuthContext";

export default function PlaquesPage() {
  const { utilisateur, isLoading: authLoading } = useAuth();
  const [initialData, setInitialData] = useState<{
    series: Serie[];
    error: string | null;
    pagination: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Passer l'ID utilisateur si disponible
        const utilisateurId = utilisateur?.id;
        const seriesResult: PaginationResponse = await getSeries(1, 5, utilisateurId);

        let series: Serie[] = [];
        let pagination = {
          total: 0,
          page: 1,
          limit: 5,
          totalPages: 1,
        };

        if (seriesResult.status === "success" && seriesResult.data) {
          series = (seriesResult.data.series || []).filter(
            (serie: Serie | null | undefined): serie is Serie =>
              serie !== null && serie !== undefined
          );
          pagination = seriesResult.data.pagination || pagination;
        }

        const error: string | null =
          seriesResult.status === "error"
            ? seriesResult.message ??
              "Erreur inconnue lors du chargement des séries"
            : null;

        setInitialData({
          series,
          error,
          pagination,
        });
      } catch (error) {
        console.error("Error loading series:", error);
        setInitialData({
          series: [],
          error: "Erreur lors du chargement des données",
          pagination: {
            total: 0,
            page: 1,
            limit: 5,
            totalPages: 1,
          },
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [utilisateur, authLoading]);

  if (isLoading || !initialData) {
    return <div>Chargement...</div>;
  }

  return (
    <PlaqueClient
      initialSeries={initialData.series}
      initialError={initialData.error}
      initialPagination={initialData.pagination}
    />
  );
}