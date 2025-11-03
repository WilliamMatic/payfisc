// src/app/system/(admin)/particuliers/components/ParticulierTable.tsx
import { User, Loader2, Edit, Trash2, Eye, EyeOff, ExternalLink, Percent, DollarSign } from 'lucide-react';
import { Particulier as ParticulierType } from '@/services/particuliers/particulierService';

interface ParticuliersTableProps {
  particuliers: ParticulierType[];
  loading: boolean;
  onEdit: (particulier: ParticulierType) => void;
  onDelete: (particulier: ParticulierType) => void;
  onToggleStatus: (particulier: ParticulierType) => void;
  onView: (particulier: ParticulierType) => void;
}

export default function ParticuliersTable({ 
  particuliers, 
  loading, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  onView
}: ParticuliersTableProps) {
  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-[#153258] animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des particuliers...</span>
        </div>
      </div>
    );
  }

  const formatReduction = (particulier: ParticulierType) => {
    if (!particulier.reduction_type || particulier.reduction_valeur === 0) {
      return 'Aucune';
    }
    
    if (particulier.reduction_type === 'pourcentage') {
      return `${particulier.reduction_valeur}%`;
    } else {
      return `${particulier.reduction_valeur} $`;
    }
  };

  return (
    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto h-full">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Prénom</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">NIF</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Téléphone</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Réduction</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {particuliers.map((particulier) => (
              particulier && (
                <tr key={particulier.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 text-sm">{particulier.nom || 'N/A'}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-gray-600 text-sm">
                    {particulier.prenom || 'N/A'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {particulier.nif || 'N/A'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-gray-600 text-sm">
                    {particulier.telephone || 'N/A'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                      {particulier.reduction_type === 'pourcentage' ? (
                        <Percent className="w-3 h-3 mr-1" />
                      ) : particulier.reduction_type === 'fixe' ? (
                        <DollarSign className="w-3 h-3 mr-1" />
                      ) : null}
                      {formatReduction(particulier)}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      particulier.actif 
                        ? 'bg-green-50 text-green-700 border border-green-100' 
                        : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      {particulier.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onView(particulier)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Voir les détails"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onToggleStatus(particulier)}
                        className={`p-2 rounded-lg transition-colors ${
                          particulier.actif 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={particulier.actif ? 'Désactiver' : 'Activer'}
                      >
                        {particulier.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onEdit(particulier)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(particulier)}
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
        
        {particuliers.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucun particulier trouvé</p>
            <p className="text-gray-400 text-sm mt-1">Les particuliers apparaîtront ici une fois ajoutés</p>
          </div>
        )}
      </div>
    </div>
  );
}