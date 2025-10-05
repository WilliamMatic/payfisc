import { getTaux, Taux as TauxType } from '@/services/taux/tauxService';
import TauxClient from './components/TauxClient';

export default async function TauxPage() {
  try {
    const result = await getTaux();

    // Vérification et nettoyage des données
    const taux: TauxType[] =
      result.status === 'success'
        ? (result.data || []).filter(
            (taux: TauxType | null | undefined): taux is TauxType =>
              taux !== null && taux !== undefined
          )
        : [];

    // Toujours forcer string | null
    const error: string | null =
      result.status === 'error' ? result.message ?? 'Erreur inconnue' : null;

    return (
      <TauxClient 
        initialTaux={taux}
        initialError={error}
      />
    );
  } catch (error) {
    console.error('Error loading taux:', error);
    return (
      <TauxClient 
        initialTaux={[]}
        initialError="Erreur lors du chargement des taux"
      />
    );
  }
}