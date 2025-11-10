// app/type-engins/components/TypeEnginsTable.tsx
import { Settings, Loader2, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { TypeEngin as TypeEnginType } from '@/services/type-engins/typeEnginService';

interface TypeEnginsTableProps {
  typeEngins: TypeEnginType[];
  loading: boolean;
  onEdit: (typeEngin: TypeEnginType) => void;
  onDelete: (typeEngin: TypeEnginType) => void;
  onToggleStatus: (typeEngin: TypeEnginType) => void;
}

export default function TypeEnginsTable({ 
  typeEngins, 
  loading, 
  onEdit, 
  onDelete, 
  onToggleStatus
}: TypeEnginsTableProps) {
  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-[#153258] animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des types d'engins...</span>
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
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Libellé</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {typeEngins.map((typeEngin) => (
              typeEngin && (
                <tr key={typeEngin.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 text-sm">{typeEngin.libelle}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-gray-700 text-sm max-w-xs truncate" title={typeEngin.description}>
                      {typeEngin.description || 'Aucune description'}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      typeEngin.actif 
                        ? 'bg-green-50 text-green-700 border border-green-100' 
                        : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      {typeEngin.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onToggleStatus(typeEngin)}
                        className={`p-2 rounded-lg transition-colors ${
                          typeEngin.actif 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={typeEngin.actif ? 'Désactiver' : 'Activer'}
                      >
                        {typeEngin.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onEdit(typeEngin)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(typeEngin)}
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
        
        {typeEngins.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucun type d'engin trouvé</p>
            <p className="text-gray-400 text-sm mt-1">Les types d'engins apparaîtront ici une fois ajoutés</p>
          </div>
        )}
      </div>
    </div>
  );
}