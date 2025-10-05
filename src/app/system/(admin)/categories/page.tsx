import { getImpots, Impot as ImpotType } from '@/services/impots/impotService';
import ImpotsClient from './components/ImpotsClient';

export default async function ImpotsPage() {
  try {
    const result = await getImpots();

    // Vérification et nettoyage des données
    const impots: ImpotType[] =
      result.status === 'success'
        ? (result.data || []).filter(
            (impot: ImpotType | null | undefined): impot is ImpotType =>
              impot !== null && impot !== undefined
          )
        : [];

    // Toujours forcer string | null
    const error: string | null =
      result.status === 'error' ? result.message ?? 'Erreur inconnue' : null;

    return (
      <ImpotsClient 
        initialImpots={impots}
        initialError={error}
      />
    );
  } catch (error) {
    console.error('Error loading impots:', error);
    return (
      <ImpotsClient 
        initialImpots={[]}
        initialError="Erreur lors du chargement des impôts"
      />
    );
  }
}