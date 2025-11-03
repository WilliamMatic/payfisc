// src/app/system/(admin)/entreprises/page.tsx
import { getEntreprises, Entreprise as EntrepriseType } from '@/services/entreprises/entrepriseService';
import EntreprisesClient from './components/EntreprisesClient';

export default async function EntreprisesPage() {
  try {
    const result = await getEntreprises();

    // Vérification et nettoyage des données
    const entreprises: EntrepriseType[] =
      result.status === 'success'
        ? (result.data || []).filter(
            (entreprise: EntrepriseType | null | undefined): entreprise is EntrepriseType =>
              entreprise !== null && entreprise !== undefined
          )
        : [];

    // Toujours forcer string | null
    const error: string | null =
      result.status === 'error' ? result.message ?? 'Erreur inconnue' : null;

    return (
      <EntreprisesClient 
        initialEntreprises={entreprises}
        initialError={error}
      />
    );
  } catch (error) {
    console.error('Error loading entreprises:', error);
    return (
      <EntreprisesClient 
        initialEntreprises={[]}
        initialError="Erreur lors du chargement des entreprises"
      />
    );
  }
}