'use client';
import { useState, useEffect } from 'react';
import { getSeries, Serie } from '@/services/plaques/plaqueServiceSite';
import PlaqueClient from './components/PlaqueClient';
import { useAuth } from "@/contexts/AuthContext";

export default function PlaquesPage() {
  const [series, setSeries] = useState<Serie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { utilisateur } = useAuth();

  useEffect(() => {
    const loadSeries = async () => {
      if (!utilisateur) return;

      try {
        setLoading(true);
        const seriesResult = await getSeries(utilisateur.id);

        if (seriesResult.status === 'success') {
          const filteredSeries = (seriesResult.data || []).filter(
            (serie: Serie | null | undefined): serie is Serie =>
              serie !== null && serie !== undefined
          );
          setSeries(filteredSeries);
          setError(null);
        } else {
          setError(seriesResult.message || 'Erreur lors du chargement des séries');
        }
      } catch (err) {
        console.error('Error loading series:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadSeries();
  }, [utilisateur]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des séries...</p>
        </div>
      </div>
    );
  }

  return (
    <PlaqueClient 
      initialSeries={series}
      initialError={error}
    />
  );
}