// app/dashboard/components/StatsOverview.tsx
import { DashboardStats as DashboardStatsType } from '@/services/dashboard/dashboardService';
import { TrendingUp, FileText, Users, DollarSign, Calendar } from 'lucide-react';

interface StatsOverviewProps {
  stats: DashboardStatsType | null;
  loading: boolean;
}

export default function StatsOverview({ stats, loading }: StatsOverviewProps) {
  const statCards = [
    {
      label: 'Revenu Total',
      value: stats?.totalRevenue ? `€${(stats.totalRevenue / 1000).toFixed(1)}K` : '--',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Déclarations',
      value: stats?.totalDeclarations?.toString() || '--',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Contribuables',
      value: stats?.totalTaxpayers?.toString() || '--',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Taux Croissance',
      value: stats?.growthRate ? `${stats.growthRate}%` : '--',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aperçu des Statistiques</h3>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-gray-600" />
        Aperçu des Statistiques
      </h3>
      <div className="space-y-4">
        {statCards.map((stat, index) => (
          <div key={index} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
            <div className={`p-2 rounded-xl ${stat.bgColor}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Dernière mise à jour */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>Mis à jour à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}