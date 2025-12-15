'use client';

import { 
  ShoppingCart, 
  Users, 
  Copy, 
  DollarSign 
} from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardStats } from "@/services/dashboards/dashboard";
import { useEffect, useState } from "react";

interface StatsData {
  retail: {
    amount: number;
    transactions: number;
  };
  wholesale: {
    amount: number;
    transactions: number;
    total_plates: number;
  };
  reproduction: {
    amount: number;
    transactions: number;
  };
  total: {
    amount: number;
    transactions: number;
  };
  trends: {
    retail: string;
    wholesale: string;
    reproduction: string;
    total: string;
  };
}

const StatsCards = ({ refreshTrigger = 0 }) => {
  const { utilisateur, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!utilisateur?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await getDashboardStats(utilisateur.id);
        
        if (response.status === 'success' && response.data) {
          setStats(response.data);
        } else {
          setError(response.message || 'Erreur lors de la récupération des statistiques');
          console.error('Erreur API StatsCards:', response.message);
        }
      } catch (err) {
        setError('Erreur de connexion au serveur');
        console.error('Erreur fetch StatsCards:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [utilisateur, refreshTrigger]); // Ajout de refreshTrigger comme dépendance

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statsCards = [
    {
      title: "Ventes au détail",
      amount: stats?.retail.amount || 0,
      icon: ShoppingCart,
      color: "bg-blue-50 text-blue-600",
      trend: stats?.trends.retail || "+12%",
      transactions: stats?.retail.transactions || 0,
      extraInfo: null,
    },
    {
      title: "Ventes grossistes",
      amount: stats?.wholesale.amount || 0,
      icon: Users,
      color: "bg-green-50 text-green-600",
      trend: stats?.trends.wholesale || "+8%",
      transactions: stats?.wholesale.transactions || 0,
      extraInfo: stats?.wholesale.total_plates 
        ? `${stats.wholesale.total_plates} plaques` 
        : null,
    },
    {
      title: "Reproductions",
      amount: stats?.reproduction.amount || 0,
      icon: Copy,
      color: "bg-amber-50 text-amber-600",
      trend: stats?.trends.reproduction || "+5%",
      transactions: stats?.reproduction.transactions || 0,
      extraInfo: null,
    },
    {
      title: "Total général",
      amount: stats?.total.amount || 0,
      icon: DollarSign,
      color: "bg-purple-50 text-purple-600",
      trend: stats?.trends.total || "+9.5%",
      transactions: stats?.total.transactions || 0,
      extraInfo: null,
    },
  ];

  if (authLoading || loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-red-100">
        <div className="text-center text-red-600">
          <p className="font-medium">Erreur de chargement des statistiques</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm text-gray-500 font-medium mb-2">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatAmount(stat.amount)}
                </p>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      stat.trend?.startsWith('+') 
                        ? 'bg-green-50 text-green-600' 
                        : stat.trend?.startsWith('-')
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-50 text-gray-600'
                    }`}>
                      {stat.trend} ce mois
                    </span>
                    <span className="text-xs text-gray-500">
                      {stat.transactions} transaction{stat.transactions !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {stat.extraInfo && (
                    <p className="text-xs text-gray-500">
                      {stat.extraInfo}
                    </p>
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;