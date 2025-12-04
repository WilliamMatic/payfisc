// src/app/system/(admin)/particuliers/page.tsx
import { 
  getParticuliers, 
  Particulier as ParticulierType,
  PaginationResponse 
} from '@/services/particuliers/particulierService';
import ParticuliersClient from './components/ParticulierClient';

// AJOUTER CES DEUX LIGNES - C'EST LA SOLUTION
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ParticuliersPage() {
  try {
    const result = await getParticuliers(1, 10); // Récupère les 10 premiers par défaut

    // Vérification et nettoyage des données
    let particuliers: ParticulierType[] = [];
    let pagination = {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1
    };

    if (result.status === 'success' && result.data) {
      particuliers = (result.data.particuliers || []).filter(
        (particulier: ParticulierType | null | undefined): particulier is ParticulierType =>
          particulier !== null && particulier !== undefined
      );
      pagination = result.data.pagination || pagination;
    }

    // Toujours forcer string | null
    const error: string | null =
      result.status === 'error' ? result.message ?? 'Erreur inconnue' : null;

    return (
      <ParticuliersClient 
        initialParticuliers={particuliers}
        initialError={error}
        initialPagination={pagination}
      />
    );
  } catch (error) {
    console.error('Error loading particuliers:', error);
    return (
      <ParticuliersClient 
        initialParticuliers={[]}
        initialError="Erreur lors du chargement des particuliers"
        initialPagination={{
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1
        }}
      />
    );
  }
}