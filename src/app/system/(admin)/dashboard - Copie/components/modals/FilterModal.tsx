import { X, SlidersHorizontal } from 'lucide-react';

interface FilterModalProps {
  filters: {
    status: string;
    taxType: string;
    taxpayerType: string;
    paymentMethod: string;
    paymentPlace: string;
    declaration: string;
    startDate: string;
    endDate: string;
  };
  uniqueTaxNames: string[];
  onClose: () => void;
  onFilterChange: (filters: any) => void;
  onResetFilters: () => void;
  onApplyFilters: () => void;
}

export default function FilterModal({
  filters,
  uniqueTaxNames,
  onClose,
  onFilterChange,
  onResetFilters,
  onApplyFilters
}: FilterModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-[#23A974] p-2 rounded-lg mr-3">
              <SlidersHorizontal className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Filtres avancés</h3>
              <p className="text-sm text-gray-500">Filtrer les déclarations fiscales</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de taxe</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#23A974] focus:border-transparent"
                value={filters.taxType}
                onChange={(e) => onFilterChange({...filters, taxType: e.target.value})}
              >
                <option value="all">Toutes les taxes</option>
                {uniqueTaxNames.map((taxName, index) => (
                  <option key={index} value={taxName}>{taxName}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut déclaration</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#23A974] focus:border-transparent"
                value={filters.declaration}
                onChange={(e) => onFilterChange({...filters, declaration: e.target.value})}
              >
                <option value="all">Tous les statuts</option>
                <option value="payé">Payée</option>
                <option value="en_attente">En attente</option>
                <option value="rejeté">Rejetée</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut paiement</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#23A974] focus:border-transparent"
                value={filters.status}
                onChange={(e) => onFilterChange({...filters, status: e.target.value})}
              >
                <option value="all">Tous les statuts</option>
                <option value="en_attente">À déclarer</option>
                <option value="partiellement_payé">Partiellement payé</option>
                <option value="payé">Payé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type de contribuable</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#23A974] focus:border-transparent"
                value={filters.taxpayerType}
                onChange={(e) => onFilterChange({...filters, taxpayerType: e.target.value})}
              >
                <option value="all">Tous les types</option>
                <option value="particulier">Particulier</option>
                <option value="entreprise">Entreprise</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#23A974] focus:border-transparent"
                value={filters.startDate}
                onChange={(e) => onFilterChange({...filters, startDate: e.target.value})}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#23A974] focus:border-transparent"
                value={filters.endDate}
                onChange={(e) => onFilterChange({...filters, endDate: e.target.value})}
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button 
            onClick={onResetFilters}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Réinitialiser
          </button>
          <div className="flex space-x-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button 
              onClick={onApplyFilters}
              className="px-6 py-2 bg-gradient-to-r from-[#23A974] to-[#1c875d] text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}