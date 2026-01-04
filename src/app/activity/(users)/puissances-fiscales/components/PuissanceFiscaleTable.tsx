import { Gauge, Loader2, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { PuissanceFiscale as PuissanceFiscaleType } from '@/services/puissances-fiscales/puissanceFiscaleService';

interface PuissanceFiscaleTableProps {
  puissances: PuissanceFiscaleType[];
  loading: boolean;
  onEdit: (puissance: PuissanceFiscaleType) => void;
  onDelete: (puissance: PuissanceFiscaleType) => void;
  onToggleStatus: (puissance: PuissanceFiscaleType) => void;
}

export default function PuissanceFiscaleTable({ 
  puissances, 
  loading, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}: PuissanceFiscaleTableProps) {
  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-[#153258] animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des puissances fiscales...</span>
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
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Puissance</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Valeur (CV)</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type d'Engin</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Création</th>
              <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {puissances.map((puissance) => (
              puissance && (
                <tr key={puissance.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 text-sm">{puissance.libelle || 'N/A'}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {puissance.valeur || 'N/A'} CV
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-gray-600 text-sm">
                    {puissance.type_engin_libelle || 'N/A'}
                  </td>
                  <td className="px-5 py-4 text-gray-600 text-sm max-w-xs truncate" title={puissance.description}>
                    {puissance.description || 'Aucune description'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      puissance.actif 
                        ? 'bg-green-50 text-green-700 border border-green-100' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      {puissance.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-gray-500 text-sm">
                    {puissance.date_creation}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1">
                      -
                    </div>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
        
        {puissances.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Gauge className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucune puissance fiscale trouvée</p>
            <p className="text-gray-400 text-sm mt-1">Les puissances fiscales apparaîtront ici une fois ajoutées</p>
          </div>
        )}
      </div>
    </div>
  );
}