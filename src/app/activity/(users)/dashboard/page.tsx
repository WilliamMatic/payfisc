import { Suspense } from 'react';
import StatistiquesClient from './components/StatistiquesClient';
import { getStatistiquesBase } from '@/services/immatriculation/statistiquesService';
import { getTauxActif } from '@/services/taux/tauxService';

// Déclare explicitement que cette page est dynamique
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getInitialData() {
  try {
    // Utilisez l'URL absolue avec le bon port
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    
    // Pour cette page, nous allons charger les données côté client
    // car nous avons besoin de l'utilisateur authentifié
    return {
      taux: null,
      stats: null
    };

  } catch (error) {
    console.error('Erreur fetch:', error);
    return {
      taux: null,
      stats: null
    };
  }
}

export default async function StatistiquesPage() {
  // Cette fonction s'exécutera à chaque requête grâce à force-dynamic
  const initialData = await getInitialData();
  
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64">Chargement des statistiques...</div>}>
      <StatistiquesClient initialData={initialData} />
    </Suspense>
  );
}