import { Building2, Loader2, Edit, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { Entreprise as EntrepriseType } from '@/services/entreprises/entrepriseService';

interface EntreprisesTableProps {
  entreprises: EntrepriseType[];
  loading: boolean;
  onEdit: (entreprise: EntrepriseType) => void;
  onDelete: (entreprise: EntrepriseType) => void;
  onToggleStatus: (entreprise: EntrepriseType) => void;
  onView: (entreprise: EntrepriseType) => void;
}

export default function EntreprisesTable({ 
  entreprises, 
  loading, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  onView
}: EntreprisesTableProps) {
  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-[#153258] animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des entreprises...</span>
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
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Raison Sociale</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Forme Juridique</th>
              {/* <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">NIF</th> */}
              {/* <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">RC</th> */}
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Téléphone</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {entreprises.map((entreprise) => (
              entreprise && (
                <tr key={entreprise.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 text-sm">{entreprise.raison_sociale || 'N/A'}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-gray-600 text-sm">
                    {entreprise.forme_juridique || 'N/A'}
                  </td>
                  {/* <td className="px-5 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {entreprise.nif || 'N/A'}
                    </span>
                  </td> */}
                  {/* <td className="px-5 py-4 whitespace-nowrap text-gray-600 text-sm">
                    {entreprise.registre_commerce || 'N/A'}
                  </td> */}
                  <td className="px-5 py-4 whitespace-nowrap text-gray-600 text-sm">
                    {entreprise.telephone || 'N/A'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      entreprise.actif 
                        ? 'bg-green-50 text-green-700 border border-green-100' 
                        : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      {entreprise.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onView(entreprise)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Voir les détails"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onToggleStatus(entreprise)}
                        className={`p-2 rounded-lg transition-colors ${
                          entreprise.actif 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={entreprise.actif ? 'Désactiver' : 'Activer'}
                      >
                        {entreprise.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onEdit(entreprise)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(entreprise)}
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
        
        {entreprises.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucune entreprise trouvée</p>
            <p className="text-gray-400 text-sm mt-1">Les entreprises apparaîtront ici une fois ajoutées</p>
          </div>
        )}
      </div>
    </div>
  );
}