import { Users, Search, Plus } from 'lucide-react';

interface UtilisateurHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
}

export default function UtilisateurHeader({ searchTerm, onSearchChange, onAddClick }: UtilisateurHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      {/* Bloc titre + icône */}
      <div className="flex items-center">
        <div className="bg-[#2D5B7A] p-2.5 rounded-lg mr-3">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Utilisateurs</h2>
          <p className="text-sm text-gray-500">Gérez les utilisateurs de votre application</p>
        </div>
      </div>
      
      {/* Bloc recherche + bouton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-56">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] bg-white w-full"
          />
        </div>
        
        <button
          onClick={onAddClick}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#2D5B7A] text-white rounded-lg hover:bg-[#234761] transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium text-sm">Nouvel Utilisateur</span>
        </button>
      </div>
    </div>
  );
}
