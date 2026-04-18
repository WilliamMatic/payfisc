import { getPartenaires, Partenaire } from '@/services/banques/partenaireService';
import PartenaireClient from './components/PartenaireClient';

export default async function PartenairesPage() {
  try {
    const result = await getPartenaires();

    const partenaires: Partenaire[] =
      result.status === 'success'
        ? (result.data || []).filter(
            (p: Partenaire | null | undefined): p is Partenaire =>
              p !== null && p !== undefined
          )
        : [];

    const error: string | null =
      result.status === 'error' ? result.message ?? 'Erreur inconnue' : null;

    return (
      <PartenaireClient
        initialPartenaires={partenaires}
        initialError={error}
      />
    );
  } catch (error) {
    console.error('Error loading partenaires:', error);
    return (
      <PartenaireClient
        initialPartenaires={[]}
        initialError="Erreur lors du chargement des partenaires"
      />
    );
  }
}
