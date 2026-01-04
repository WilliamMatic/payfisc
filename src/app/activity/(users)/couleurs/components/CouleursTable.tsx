// app/couleurs/components/CouleursTable.tsx
import { Palette, Loader2, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { EnginCouleur as EnginCouleurType } from '@/services/couleurs/couleurService';

interface CouleursTableProps {
  couleurs: EnginCouleurType[];
  loading: boolean;
  onEdit: (couleur: EnginCouleurType) => void;
  onDelete: (couleur: EnginCouleurType) => void;
  onToggleStatus: (couleur: EnginCouleurType) => void;
}

export default function CouleursTable({ 
  couleurs, 
  loading, 
  onEdit, 
  onDelete, 
  onToggleStatus
}: CouleursTableProps) {
  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-[#153258] animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des couleurs...</span>
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
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Couleur</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {couleurs.map((couleur) => (
              couleur && (
                <tr key={couleur.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div 
                      className="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
                      style={{ backgroundColor: couleur.code_hex }}
                    />
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 text-sm">{couleur.nom}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-gray-700 text-sm font-mono">
                    {couleur.code_hex}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      couleur.actif 
                        ? 'bg-green-50 text-green-700 border border-green-100' 
                        : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      {couleur.actif ? 'Actif' : 'Inactif'}
                    </span>
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
        
        {couleurs.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Palette className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucune couleur trouvée</p>
            <p className="text-gray-400 text-sm mt-1">Les couleurs apparaîtront ici une fois ajoutées</p>
          </div>
        )}
      </div>
    </div>
  );
}