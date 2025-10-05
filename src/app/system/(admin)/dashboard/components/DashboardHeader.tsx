import { 
  PieChart, 
  Search, 
  Sparkles, 
  Calendar,
  SlidersHorizontal,
  ChevronDown 
} from 'lucide-react';

interface DashboardHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFilterClick: () => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onApplyDateFilter: () => void;
}

export default function DashboardHeader({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  onFilterClick,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApplyDateFilter
}: DashboardHeaderProps) {
  return (
    <>
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              className={`py-4 font-semibold text-sm border-b-2 transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? 'border-[#23A974] text-[#153258]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => onTabChange('dashboard')}
            >
              <div className="flex items-center space-x-2">
                <PieChart size={18} />
                <span>Tableau de bord</span>
              </div>
            </button>
            <button
              className={`py-4 font-semibold text-sm border-b-2 transition-all duration-200 ${
                activeTab === 'checking'
                  ? 'border-[#23A974] text-[#153258]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => onTabChange('checking')}
            >
              <div className="flex items-center space-x-2">
                <Search size={18} />
                <span>Vérification</span>
              </div>
            </button>
            <button
              className={`py-4 font-semibold text-sm border-b-2 transition-all duration-200 ${
                activeTab === 'ai-search'
                  ? 'border-[#23A974] text-[#153258]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => onTabChange('ai-search')}
            >
              <div className="flex items-center space-x-2">
                <Sparkles size={18} />
                <span>IA fiscale</span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Filtres par date pour le dashboard */}
      {activeTab === 'dashboard' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/60 p-4">
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-3">
                <Calendar className="text-gray-400" size={20} />
                <div className="flex space-x-2">
                  <input
                    type="date"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#23A974] focus:border-transparent"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                  />
                  <span className="text-gray-400 self-center">à</span>
                  <input
                    type="date"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#23A974] focus:border-transparent"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                  />
                </div>
              </div>
              <button 
                className="bg-gradient-to-r from-[#23A974] to-[#1c875d] text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                onClick={onApplyDateFilter}
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header pour la vérification */}
      {activeTab === 'checking' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Vérification des déclarations</h2>
              <p className="text-gray-600 mt-1">Gérez et vérifiez vos déclarations fiscales</p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#23A974] focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
              
              {/* Bouton filtre */}
              <button 
                className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:shadow-md transition-all duration-200"
                onClick={onFilterClick}
              >
                <SlidersHorizontal size={18} />
                <span>Filtres</span>
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}