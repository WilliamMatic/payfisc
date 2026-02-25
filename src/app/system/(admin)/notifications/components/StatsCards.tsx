"use client";

interface StatsData {
  total: number;
  unread: number;
  success: number;
  alerts: number;
}

interface StatsCardsProps {
  stats: StatsData | null;
  isLoading?: boolean; // Ajout de la prop isLoading
}

// Composant de skeleton pour les stats
function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
        </div>
      ))}
    </div>
  );
}

export default function StatsCards({ stats, isLoading = false }: StatsCardsProps) {
  // Afficher le skeleton pendant le chargement
  if (isLoading) {
    return <StatsCardsSkeleton />;
  }

  // Ne rien afficher si pas de stats et pas en chargement
  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
        <div className="text-2xl font-bold text-gray-800">
          {stats.total}
        </div>
        <div className="text-sm text-gray-600">Total</div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
        <div className="text-2xl font-bold text-blue-600">
          {stats.unread}
        </div>
        <div className="text-sm text-gray-600">Non lues</div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
        <div className="text-2xl font-bold text-green-600">
          {stats.success}
        </div>
        <div className="text-sm text-gray-600">Succès</div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
        <div className="text-2xl font-bold text-yellow-600">
          {stats.alerts}
        </div>
        <div className="text-sm text-gray-600">Alertes</div>
      </div>
    </div>
  );
}