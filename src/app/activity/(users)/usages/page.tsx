import { getUsages, UsageEngin as UsageEnginType } from '@/services/usages/usageService';
import UsagesClient from './components/UsagesClient';

export default async function UsagesPage() {
  try {
    const result = await getUsages();

    // Vérification et nettoyage des données
    const usages: UsageEnginType[] =
      result.status === 'success'
        ? (result.data || []).filter(
            (usage: UsageEnginType | null | undefined): usage is UsageEnginType =>
              usage !== null && usage !== undefined
          )
        : [];

    // Toujours forcer string | null
    const error: string | null =
      result.status === 'error' ? result.message ?? 'Erreur inconnue' : null;

    return (
      <UsagesClient 
        initialUsages={usages}
        initialError={error}
      />
    );
  } catch (error) {
    console.error('Error loading usages:', error);
    return (
      <UsagesClient 
        initialUsages={[]}
        initialError="Erreur lors du chargement des usages"
      />
    );
  }
}