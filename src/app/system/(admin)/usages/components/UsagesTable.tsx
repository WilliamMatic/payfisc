import { Car, Loader2, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { UsageEngin as UsageEnginType } from '@/services/usages/usageService';

interface UsagesTableProps {
  usages: UsageEnginType[];
  loading: boolean;
  onEdit: (usage: UsageEnginType) => void;
  onDelete: (usage: UsageEnginType) => void;
  onToggleStatus: (usage: UsageEnginType) => void;
}

export default function UsagesTable({ 
  usages, 
  loading, 
  onEdit, 
  onDelete, 
  onToggleStatus
}: UsagesTableProps) {
  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-[#153258] animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des usages...</span>
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
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Libellé</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {usages.map((usage) => (
              usage && (
                <tr key={usage.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 text-sm">{usage.code}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-gray-700 text-sm">{usage.libelle}</td>
                  <td className="px-5 py-4 text-gray-700 text-sm">
                    {usage.description || <span className="text-gray-400">Aucune description</span>}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      usage.actif 
                        ? 'bg-green-50 text-green-700 border border-green-100' 
                        : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      {usage.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onToggleStatus(usage)}
                        className={`p-2 rounded-lg transition-colors ${
                          usage.actif 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={usage.actif ? 'Désactiver' : 'Activer'}
                      >
                        {usage.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onEdit(usage)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(usage)}
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
        
        {usages.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Car className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucun usage trouvé</p>
            <p className="text-gray-400 text-sm mt-1">Les usages apparaîtront ici une fois ajoutés</p>
          </div>
        )}
      </div>
    </div>
  );
}