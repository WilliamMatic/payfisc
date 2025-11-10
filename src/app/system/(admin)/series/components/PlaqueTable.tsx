import { Car, Loader2, Edit, Trash2, Eye, EyeOff, List } from 'lucide-react';
import { Serie as SerieType } from '@/services/plaques/plaqueService';

interface PlaqueTableProps {
  series: SerieType[];
  loading: boolean;
  onEdit: (serie: SerieType) => void;
  onDelete: (serie: SerieType) => void;
  onToggleStatus: (serie: SerieType) => void;
  onViewItems: (serie: SerieType) => void;
}

export default function PlaqueTable({ 
  series, 
  loading, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  onViewItems
}: PlaqueTableProps) {
  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-[#153258] animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des séries...</span>
        </div>
      </div>
    );
  }

  const getStatusBadge = (actif: boolean) => {
    return actif 
      ? 'bg-green-50 text-green-700 border border-green-100' 
      : 'bg-gray-100 text-gray-600 border border-gray-200';
  };

  const getAvailabilityBadge = (disponibles: number, total: number) => {
    const percentage = (disponibles / total) * 100;
    if (percentage === 0) {
      return 'bg-red-50 text-red-700 border border-red-100';
    } else if (percentage < 30) {
      return 'bg-orange-50 text-orange-700 border border-orange-100';
    } else {
      return 'bg-green-50 text-green-700 border border-green-100';
    }
  };

  return (
    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto h-full">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Série & Province</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plage Numérique</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Disponibilité</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Création</th>
              <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {series.map((serie) => (
              serie && (
                <tr key={serie.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-blue-50 p-2 rounded-lg mr-3">
                        <Car className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg">{serie.nom_serie || 'N/A'}</div>
                        <div className="text-gray-500 text-sm">{serie.province_nom} ({serie.province_code})</div>
                        <div className="text-gray-500 text-xs">ID: {serie.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-gray-600 text-sm max-w-xs">
                      {serie.description || 'Aucune description'}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-gray-600 text-sm font-medium">
                      {serie.debut_numeros} - {serie.fin_numeros}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {serie.fin_numeros - serie.debut_numeros + 1} numéros
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getAvailabilityBadge(serie.items_disponibles, serie.total_items)}`}>
                        {serie.items_disponibles}/{serie.total_items} disponibles
                      </span>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-green-500 h-1.5 rounded-full" 
                          style={{ width: `${(serie.items_disponibles / serie.total_items) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(serie.actif)}`}>
                      {serie.actif ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-gray-500 text-sm">
                    {serie.date_creation_formatted || new Date(serie.date_creation).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onViewItems(serie)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir les plaques"
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onToggleStatus(serie)}
                        className={`p-2 rounded-lg transition-colors ${
                          serie.actif 
                            ? 'text-gray-500 hover:bg-gray-100' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={serie.actif ? 'Désactiver' : 'Activer'}
                      >
                        {serie.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onEdit(serie)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(serie)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
        
        {series.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Car className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucune série trouvée</p>
            <p className="text-gray-400 text-sm mt-1">Les séries de plaques apparaîtront ici une fois ajoutées</p>
          </div>
        )}
      </div>
    </div>
  );
}