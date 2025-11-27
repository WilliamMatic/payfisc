import { 
  CreditCard, 
  FileText, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  User,
  Loader2 
} from 'lucide-react';
import { DashboardStats as DashboardStatsType } from '@/services/dashboard/dashboardService';

interface DashboardStatsProps {
  stats: DashboardStatsType | null;
  loading: boolean;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onApplyDateFilter: () => void;
}

export default function DashboardStats({
  stats,
  loading,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApplyDateFilter
}: DashboardStatsProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#23A974] animate-spin mx-auto" />
          <p className="text-gray-600 mt-3">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <div className="bg-white/80 rounded-2xl p-8 max-w-md mx-auto">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée disponible</h3>
          <p className="text-gray-500">Les données statistiques ne sont pas disponibles pour le moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec titre */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tableau de bord fiscal</h2>
          <p className="text-gray-600 mt-1">Vue d'ensemble de votre activité fiscale</p>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl shadow-sm border border-gray-200/60 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recettes</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-2">{stats.total_taxes_payees?.toLocaleString() || 0} $</p>
          <p className="text-sm text-gray-500">Montant total des taxes payées</p>
          <div className="mt-3 w-full bg-blue-100 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{width: '100%'}}></div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-green-50/50 rounded-2xl shadow-sm border border-gray-200/60 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Déclarations</h3>
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600 mb-2">{stats.total_declarations || 0}</p>
          <p className="text-sm text-gray-500">Total des déclarations effectuées</p>
          <div className="mt-3 w-full bg-green-100 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full" style={{width: '85%'}}></div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-orange-50/50 rounded-2xl shadow-sm border border-gray-200/60 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Échéances</h3>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="text-orange-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-600 mb-2">{stats.echeances_proches || 0}</p>
          <p className="text-sm text-gray-500">Déclarations en attente de paiement</p>
          <div className="mt-3 w-full bg-orange-100 rounded-full h-2">
            <div className="bg-orange-600 h-2 rounded-full" style={{width: '60%'}}></div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-purple-50/50 rounded-2xl shadow-sm border border-gray-200/60 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Taxes payées</h3>
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-600 mb-2">{stats.declarations_payees || 0}</p>
          <p className="text-sm text-gray-500">Nombre de déclarations payées</p>
          <div className="mt-3 w-full bg-purple-100 rounded-full h-2">
            <div className="bg-purple-600 h-2 rounded-full" style={{width: '75%'}}></div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-red-50/50 rounded-2xl shadow-sm border border-gray-200/60 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Entreprises</h3>
            <div className="p-2 bg-red-100 rounded-lg">
              <BarChart3 className="text-red-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-red-600 mb-2">{stats.total_entreprises || 0}</p>
          <p className="text-sm text-gray-500">Nombre total d'entreprises</p>
          <div className="mt-3 w-full bg-red-100 rounded-full h-2">
            <div className="bg-red-600 h-2 rounded-full" style={{width: '70%'}}></div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-teal-50/50 rounded-2xl shadow-sm border border-gray-200/60 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Particuliers</h3>
            <div className="p-2 bg-teal-100 rounded-lg">
              <User className="text-teal-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-teal-600 mb-2">{stats.total_particuliers || 0}</p>
          <p className="text-sm text-gray-500">Nombre total de particuliers</p>
          <div className="mt-3 w-full bg-teal-100 rounded-full h-2">
            <div className="bg-teal-600 h-2 rounded-full" style={{width: '65%'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
}