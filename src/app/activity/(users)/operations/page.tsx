import { getImpots, Impot } from '@/services/impots/impotService';
import ImpotClient from './components/ImpotClient';

export default async function ImpotsPage() {
  try {
    const impotsResult = await getImpots();

    // Vérification et nettoyage des données des impôts
    const impots: Impot[] =
      impotsResult.status === 'success'
        ? (impotsResult.data || []).filter(
            (impot: Impot | null | undefined): impot is Impot =>
              impot !== null && impot !== undefined
          )
        : [];

    // Gestion des erreurs
    const error: string | null =
      impotsResult.status === 'error' 
        ? impotsResult.message ?? 'Erreur inconnue lors du chargement des impôts'
        : null;

    return (
      <ImpotClient 
        initialImpots={impots}
        initialError={error}
      />
    );
  } catch (error) {
    console.error('Error loading impots:', error);
    return (
      <ImpotClient 
        initialImpots={[]}
        initialError="Erreur lors du chargement des données"
      />
    );
  }
}