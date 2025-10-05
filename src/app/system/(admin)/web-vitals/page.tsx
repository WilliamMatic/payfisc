import { Suspense } from 'react';
import AnalyticsClient from './components/AnalyticsClient';

interface SearchParams {
  start_date?: string;
  end_date?: string;
  [key: string]: string | undefined;
}

interface GlobalStats {
  total_metrics: number;
  total_sessions: number;
  total_pages: number;
  total_problems: number;
  average_performance: number;
  worst_performance: number;
}

interface MetricDetail {
  metric_name: string;
  occurrences: number;
  average_value: number;
  max_value: number;
  min_value: number;
  problems_count: number;
}

interface RecurrentProblem {
  metric_name: string;
  description: string;
  problem_count: number;
  average_value: number;
}

interface AnalyticsStats {
  global_stats: GlobalStats;
  metrics_details: MetricDetail[];
  recurrent_problems: RecurrentProblem[];
  performance_score: number;
  performance_status: string;
}

async function getAnalyticsStats(startDate: string | null = null, endDate: string | null = null): Promise<AnalyticsStats> {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    let apiUrl = `${API_BASE_URL}/analytics/route.php?action=stats`;
    
    // Ajouter les paramètres de date si fournis
    if (startDate && endDate) {
      apiUrl += `&start_date=${startDate}&end_date=${endDate}`;
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('Response not OK:', response.status, response.statusText);
      return getDefaultStats();
    }

    const result = await response.json();
    
    if (result.status === 'success') {
      return result.data;
    } else {
      console.error('API returned error:', result.message);
      return getDefaultStats();
    }
  } catch (error) {
    console.error('Erreur fetch analytics:', error);
    return getDefaultStats();
  }
}

// Données par défaut en cas d'erreur
function getDefaultStats(): AnalyticsStats {
  return {
    global_stats: {
      total_metrics: 0,
      total_sessions: 0,
      total_pages: 0,
      total_problems: 0,
      average_performance: 0,
      worst_performance: 0
    },
    metrics_details: [],
    recurrent_problems: [],
    performance_score: 0,
    performance_status: 'Non disponible'
  };
}

interface AnalyticsPageProps {
  searchParams: SearchParams;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const startDate = searchParams.start_date || null;
  const endDate = searchParams.end_date || null;
  
  const statsData = await getAnalyticsStats(startDate, endDate);
  
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3">Chargement des analytics...</span>
      </div>
    }>
      <AnalyticsClient statsData={statsData} />
    </Suspense>
  );
}