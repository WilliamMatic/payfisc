import { 
  getDashboardStats, 
  getUniqueTaxNames,
  DashboardStats 
} from '@/services/dashboard/dashboardService';
import DashboardClient from './components/DashboardClient';

export default async function DashboardPage() {
  try {
    const [statsResult, taxNamesResult] = await Promise.all([
      getDashboardStats(),
      getUniqueTaxNames()
    ]);

    // Vérification et nettoyage des données
    const stats: DashboardStats | null = 
      statsResult.status === 'success' ? statsResult.data : null;

    const uniqueTaxNames: string[] = 
      taxNamesResult.status === 'success' ? (taxNamesResult.data || []) : [];

    // Gestion des erreurs
    const error: string | null = 
      statsResult.status === 'error' ? statsResult.message ?? 'Erreur inconnue' : 
      taxNamesResult.status === 'error' ? taxNamesResult.message ?? 'Erreur inconnue' : null;

    return (
      <DashboardClient 
        initialStats={stats}
        initialTaxNames={uniqueTaxNames}
        initialError={error}
      />
    );
  } catch (error) {
    console.error('Error loading dashboard:', error);
    return (
      <DashboardClient 
        initialStats={null}
        initialTaxNames={[]}
        initialError="Erreur lors du chargement du tableau de bord"
      />
    );
  }
}