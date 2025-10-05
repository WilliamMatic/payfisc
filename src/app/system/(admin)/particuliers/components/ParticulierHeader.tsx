import { User, Search, Plus } from 'lucide-react';

interface ParticuliersHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onAddClick: () => void;
}

export default function ParticuliersHeader({ searchTerm, onSearchChange, onSearch, onAddClick }: ParticuliersHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center">
        <div className="bg-[#153258] p-2.5 rounded-lg mr-3">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Contribuables Particuliers</h2>
          <p className="text-sm text-gray-500">Gérez les particuliers contribuables</p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un contribuable..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] bg-white w-full"
          />
        </div>
        
        <button
          onClick={onAddClick}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium text-sm">Ajouter</span>
        </button>
      </div>
    </div>
  );
}