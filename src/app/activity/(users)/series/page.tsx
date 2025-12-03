import { getSeries, Serie } from '@/services/plaques/plaqueService';
import PlaqueClient from './components/PlaqueClient';

export default async function PlaquesPage() {
  try {
    const seriesResult = await getSeries();

    // Vérification et nettoyage des données des séries
    const series: Serie[] =
      seriesResult.status === 'success'
        ? (seriesResult.data || []).filter(
            (serie: Serie | null | undefined): serie is Serie =>
              serie !== null && serie !== undefined
          )
        : [];

    // Gestion des erreurs
    const error: string | null =
      seriesResult.status === 'error' 
        ? seriesResult.message ?? 'Erreur inconnue lors du chargement des séries'
        : null;

    return (
      <PlaqueClient 
        initialSeries={series}
        initialError={error}
      />
    );
  } catch (error) {
    console.error('Error loading series:', error);
    return (
      <PlaqueClient 
        initialSeries={[]}
        initialError="Erreur lors du chargement des données"
      />
    );
  }
}