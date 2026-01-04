// app/energies/page.tsx
import { getEnergies, Energie as EnergieType } from '@/services/energies/energieService';
import EnergiesClient from './components/EnergiesClient';

export default async function EnergiesPage() {
  try {
    const result = await getEnergies();

    const energies: EnergieType[] =
      result.status === 'success'
        ? (result.data || []).filter(
            (energie: EnergieType | null | undefined): energie is EnergieType =>
              energie !== null && energie !== undefined
          )
        : [];

    const error: string | null =
      result.status === 'error' ? result.message ?? 'Erreur inconnue' : null;

    return (
      <EnergiesClient 
        initialEnergies={energies}
        initialError={error}
      />
    );
  } catch (error) {
    console.error('Error loading energies:', error);
    return (
      <EnergiesClient 
        initialEnergies={[]}
        initialError="Erreur lors du chargement des énergies"
      />
    );
  }
}