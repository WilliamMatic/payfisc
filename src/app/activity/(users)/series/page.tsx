// src/app/system/(admin)/plaques/page.tsx
import { getSeries, Serie, PaginationResponse } from '@/services/plaques/plaqueService';
import PlaqueClient from './components/PlaqueClient';

export default async function PlaquesPage() {
  try {
    // Récupère les 5 derniers enregistrements par défaut
    const seriesResult: PaginationResponse = await getSeries(1, 5);

    // Vérification et nettoyage des données des séries
    let series: Serie[] = [];
    let pagination = {
      total: 0,
      page: 1,
      limit: 5,
      totalPages: 1
    };

    if (seriesResult.status === 'success' && seriesResult.data) {
      series = (seriesResult.data.series || []).filter(
        (serie: Serie | null | undefined): serie is Serie =>
          serie !== null && serie !== undefined
      );
      pagination = seriesResult.data.pagination || pagination;
    }

    // Gestion des erreurs
    const error: string | null =
      seriesResult.status === 'error' 
        ? seriesResult.message ?? 'Erreur inconnue lors du chargement des séries'
        : null;

    return (
      <PlaqueClient 
        initialSeries={series}
        initialError={error}
        initialPagination={pagination}
      />
    );
  } catch (error) {
    console.error('Error loading series:', error);
    return (
      <PlaqueClient 
        initialSeries={[]}
        initialError="Erreur lors du chargement des données"
        initialPagination={{
          total: 0,
          page: 1,
          limit: 5,
          totalPages: 1
        }}
      />
    );
  }
}