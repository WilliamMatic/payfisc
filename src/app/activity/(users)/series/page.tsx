// Version simplifiée
"use client";

import { useEffect, useState } from "react";
import {
  getSeries,
  Serie,
  PaginationResponse,
} from "@/services/plaques/plaqueService";
import PlaqueClient from "./components/PlaqueClient";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PlaquesPage() {
  const router = useRouter();
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

  // Vérifier si l'utilisateur a un extension_site
  if (utilisateur?.extension_site) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#dc2626', fontSize: '1.5rem', marginBottom: '1rem' }}>
          Impossible de voir la gestion de série globale.
        </h1>
        <p style={{ marginBottom: '2rem' }}>
          Vous avez un site d&apos;extension : <strong>{utilisateur.extension_site}</strong>
        </p>
        
        <button
          onClick={() => router.push("/activity/seriesInterne")}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
        >
          Cliquer pour voir les séries disponibles pour votre site
        </button>
        
        <div style={{ marginTop: '1rem' }}>
          <Link 
            href="/activity/dashboard"
            style={{ color: '#6b7280', textDecoration: 'underline' }}
          >
            ← Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

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