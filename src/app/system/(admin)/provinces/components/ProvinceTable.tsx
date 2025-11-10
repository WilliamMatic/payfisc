import { MapPin, Loader2, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Province as ProvinceType } from '@/services/provinces/provinceService';

interface ProvinceTableProps {
  provinces: ProvinceType[];
  loading: boolean;
  onEdit: (province: ProvinceType) => void;
  onDelete: (province: ProvinceType) => void;
  onToggleStatus: (province: ProvinceType) => void;
}

export default function ProvinceTable({ 
  provinces, 
  loading, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}: ProvinceTableProps) {
  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-[#2D5B7A] animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des provinces...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto h-full">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Province</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Création</th>
              <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {provinces.map((province) => (
              province && (
                <tr key={province.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 text-sm">{province.nom || 'N/A'}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {province.code || 'N/A'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600 text-sm max-w-xs truncate" title={province.description}>
                    {province.description || 'Aucune description'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      province.actif 
                        ? 'bg-green-50 text-green-700 border border-green-100' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      {province.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-gray-500 text-sm">
                    {province.date_creation}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onToggleStatus(province)}
                        className={`p-2 rounded-lg transition-colors ${
                          province.actif 
                            ? 'text-gray-500 hover:bg-gray-100' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={province.actif ? 'Désactiver' : 'Activer'}
                      >
                        {province.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onEdit(province)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(province)}
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
        
        {provinces.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucune province trouvée</p>
            <p className="text-gray-400 text-sm mt-1">Les provinces apparaîtront ici une fois ajoutées</p>
          </div>
        )}
      </div>
    </div>
  );
}