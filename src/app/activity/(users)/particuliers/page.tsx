// src/app/system/(admin)/particuliers/page.tsx
import { getParticuliers, Particulier as ParticulierType } from '@/services/particuliers/particulierService';
import ParticuliersClient from './components/ParticulierClient';

export default async function ParticuliersPage() {
  try {
    const result = await getParticuliers();

    // Vérification et nettoyage des données
    const particuliers: ParticulierType[] =
      result.status === 'success'
        ? (result.data || []).filter(
            (particulier: ParticulierType | null | undefined): particulier is ParticulierType =>
              particulier !== null && particulier !== undefined
          )
        : [];

    // Toujours forcer string | null
    const error: string | null =
      result.status === 'error' ? result.message ?? 'Erreur inconnue' : null;

    return (
      <ParticuliersClient 
        initialParticuliers={particuliers}
        initialError={error}
      />
    );
  } catch (error) {
    console.error('Error loading particuliers:', error);
    return (
      <ParticuliersClient 
        initialParticuliers={[]}
        initialError="Erreur lors du chargement des particuliers"
      />
    );
  }
}