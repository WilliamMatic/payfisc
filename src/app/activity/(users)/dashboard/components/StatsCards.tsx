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
      gradient: "from-blue-500 to-blue-600",
      bgLight: "bg-blue-50",
      textColor: "text-blue-600",
      borderColor: "border-blue-100",
      trend: stats?.trends.retail || "+12%",
      transactions: stats?.retail.transactions || 0,
      extraInfo: null,
    },
    {
      title: "Ventes grossistes",
      amount: stats?.wholesale.amount || 0,
      icon: Users,
      gradient: "from-emerald-500 to-emerald-600",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-600",
      borderColor: "border-emerald-100",
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
      gradient: "from-amber-500 to-orange-500",
      bgLight: "bg-amber-50",
      textColor: "text-amber-600",
      borderColor: "border-amber-100",
      trend: stats?.trends.reproduction || "+5%",
      transactions: stats?.reproduction.transactions || 0,
      extraInfo: null,
    },
    {
      title: "Total général",
      amount: stats?.total.amount || 0,
      icon: DollarSign,
      gradient: "from-[#153258] to-[#1e4a7a]",
      bgLight: "bg-purple-50",
      textColor: "text-[#153258]",
      borderColor: "border-purple-100",
      trend: stats?.trends.total || "+9.5%",
      transactions: stats?.total.transactions || 0,
      extraInfo: null,
    },
  ];

  if (authLoading || loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 bg-gray-200 rounded-xl" />
                <div className="h-4 bg-gray-200 rounded-lg w-24" />
              </div>
              <div className="h-8 bg-gray-200 rounded-lg mb-3 w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100">
        <div className="text-center text-red-600">
          <p className="font-medium">Erreur de chargement des statistiques</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.trend?.startsWith('+');
        const isNegative = stat.trend?.startsWith('-');
        return (
          <div
            key={index}
            className={`group relative bg-white rounded-2xl p-6 shadow-sm border ${stat.borderColor} hover:shadow-lg transition-all duration-300 overflow-hidden`}
          >
            {/* Decorative gradient bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
            
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm text-gray-500 font-medium">
                {stat.title}
              </p>
            </div>

            <p className="text-2xl font-bold text-gray-900 mb-3">
              {formatAmount(stat.amount)}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                  isPositive 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : isNegative
                    ? 'bg-red-50 text-red-600'
                    : 'bg-gray-50 text-gray-600'
                }`}>
                  {isPositive && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                  )}
                  {isNegative && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  )}
                  {stat.trend}
                </span>
              </div>
              <span className="text-xs text-gray-400 font-medium">
                {stat.transactions} txn{stat.transactions !== 1 ? 's' : ''}
              </span>
            </div>

            {stat.extraInfo && (
              <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">
                {stat.extraInfo}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;