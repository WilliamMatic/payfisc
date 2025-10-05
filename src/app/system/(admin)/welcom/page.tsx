import { Suspense } from 'react';
import DashboardClient from './components/DashboardClient';

async function getGlobalStats() {
  try {
    // Utilisez l'URL absolue avec le bon port
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    const apiUrl = `${API_BASE_URL}/global/route.php`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('Response not OK:', response.status, response.statusText);
      console.error('URL attempted:', apiUrl); // Debug
      // Retourner des données par défaut au lieu de throw une erreur
      return {
        total_contribuables: 0,
        total_provinces: 0,
        total_paiements: 0,
        total_sites: 0
      };
    }

    const result = await response.json();
    
    if (result.status === 'success') {
      return result.data;
    } else {
      console.error('API returned error:', result.message);
      return {
        total_contribuables: 0,
        total_provinces: 0,
        total_paiements: 0,
        total_sites: 0
      };
    }
  } catch (error) {
    console.error('Erreur fetch:', error);
    return {
      total_contribuables: 0,
      total_provinces: 0,
      total_paiements: 0,
      total_sites: 0
    };
  }
}

export default async function DashboardPage() {
  const statsData = await getGlobalStats();
  
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64">Chargement des statistiques...</div>}>
      <DashboardClient statsData={statsData} />
    </Suspense>
  );
}