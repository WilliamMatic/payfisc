import { Car, Search, Plus, FileText } from 'lucide-react';

interface PlaqueHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
  onRapportClick: () => void;
}

export default function PlaqueHeader({ 
  searchTerm, 
  onSearchChange, 
  onAddClick, 
  onRapportClick 
}: PlaqueHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      {/* TITRE */}
      <div className="flex items-center">
        <div className="bg-[#2D5B7A] p-2.5 rounded-lg mr-3">
          <Car className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Gestion des Plaques</h2>
          <p className="text-sm text-gray-500">Gérez les séries de plaques d'immatriculation</p>
        </div>
      </div>
      
      {/* BARRE DE RECHERCHE ET BOUTONS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-56">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher une série..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] bg-white w-full"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onRapportClick}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <FileText className="w-4 h-4" />
            <span className="font-medium text-sm">Rapport</span>
          </button>
          
          {/* <button
            onClick={onAddClick}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#2D5B7A] text-white rounded-lg hover:bg-[#234761] transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium text-sm">Nouvelle Série</span>
          </button> */}
        </div>
      </div>
    </div>
  );
}