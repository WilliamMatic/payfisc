import { FileText, Search } from 'lucide-react';

interface ImpotHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  impotsCount: number;
}

export default function ImpotHeader({ searchTerm, onSearchChange, impotsCount }: ImpotHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      {/* TITRE */}
      <div className="flex items-center">
        <div className="bg-[#2D5B7A] p-2.5 rounded-lg mr-3">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Gestion des Impôts</h2>
          <p className="text-sm text-gray-500">
            {impotsCount} {impotsCount <= 1 ? 'impôt trouvé' : 'impôts trouvés'}
          </p>
        </div>
      </div>
      
      {/* BARRE DE RECHERCHE */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un impôt par nom, description ou période..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] bg-white w-full"
          />
        </div>
      </div>
    </div>
  );
}