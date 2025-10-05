import { Users, Loader2, Edit, Trash2, Eye, EyeOff, Phone, MapPin } from 'lucide-react';
import { Utilisateur as UtilisateurType } from '@/services/utilisateurs/utilisateurService';

interface UtilisateurTableProps {
  utilisateurs: UtilisateurType[];
  loading: boolean;
  onEdit: (utilisateur: UtilisateurType) => void;
  onDelete: (utilisateur: UtilisateurType) => void;
  onToggleStatus: (utilisateur: UtilisateurType) => void;
}

export default function UtilisateurTable({ 
  utilisateurs, 
  loading, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}: UtilisateurTableProps) {
  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-[#2D5B7A] animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des utilisateurs...</span>
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
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nom Complet</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Téléphone</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Adresse</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Site Affecté</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Création</th>
              <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {utilisateurs.map((utilisateur) => (
              utilisateur && (
                <tr key={utilisateur.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 text-sm">{utilisateur.nom_complet || 'N/A'}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-gray-700 text-sm">
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-1 text-gray-400" />
                      {utilisateur.telephone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 text-sm max-w-xs truncate" title={utilisateur.adresse}>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {utilisateur.adresse || 'N/A'}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-gray-700 text-sm">
                    {utilisateur.site_nom || 'N/A'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      utilisateur.actif 
                        ? 'bg-green-50 text-green-700 border border-green-100' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      {utilisateur.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-gray-500 text-sm">
                    {utilisateur.date_creation 
                      ? new Date(utilisateur.date_creation).toLocaleDateString('fr-FR') 
                      : 'N/A'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onToggleStatus(utilisateur)}
                        className={`p-2 rounded-lg transition-colors ${
                          utilisateur.actif 
                            ? 'text-gray-500 hover:bg-gray-100' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={utilisateur.actif ? 'Désactiver' : 'Activer'}
                      >
                        {utilisateur.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onEdit(utilisateur)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(utilisateur)}
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

        {utilisateurs.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucun utilisateur trouvé</p>
            <p className="text-gray-400 text-sm mt-1">Les utilisateurs apparaîtront ici une fois ajoutés</p>
          </div>
        )}
      </div>
    </div>
  );
}
