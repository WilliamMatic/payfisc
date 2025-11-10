import { User, Loader2, Edit, Trash2, Eye, EyeOff, Key } from 'lucide-react';
import { Admin as AdminType } from '@/services/admins/adminService';

interface AdminTableProps {
  admins: AdminType[];
  loading: boolean;
  onEdit: (admin: AdminType) => void;
  onDelete: (admin: AdminType) => void;
  onToggleStatus: (admin: AdminType) => void;
  onResetPassword: (admin: AdminType) => void;
}

export default function AdminTable({ 
  admins, 
  loading, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  onResetPassword
}: AdminTableProps) {
  if (loading) {
    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-[#153258] animate-spin" />
          <span className="ml-3 text-gray-600">Chargement des administrateurs...</span>
        </div>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super':
        return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 'partenaire':
        return 'bg-blue-50 text-blue-700 border border-blue-100';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-100';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super':
        return 'Super Admin';
      case 'partenaire':
        return 'Partenaire';
      default:
        return role;
    }
  };

  return (
    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto h-full">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Administrateur</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Province</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Création</th>
              <th className="px-5 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {admins.map((admin) => (
              admin && (
                <tr key={admin.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 text-sm">{admin.nom_complet || 'N/A'}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-gray-600 text-sm">
                      <div className="font-medium">{admin.email || 'N/A'}</div>
                      {admin.telephone && (
                        <div className="text-gray-500 text-xs">{admin.telephone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadge(admin.role)}`}>
                      {getRoleLabel(admin.role)}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-gray-600 text-sm">
                    {admin.province_nom || admin.role === 'super' ? 'Toutes' : 'N/A'}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      admin.actif 
                        ? 'bg-green-50 text-green-700 border border-green-100' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      {admin.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-gray-500 text-sm">
                    {admin.date_creation}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onToggleStatus(admin)}
                        className={`p-2 rounded-lg transition-colors ${
                          admin.actif 
                            ? 'text-gray-500 hover:bg-gray-100' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={admin.actif ? 'Désactiver' : 'Activer'}
                      >
                        {admin.actif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onResetPassword(admin)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Réinitialiser mot de passe"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(admin)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(admin)}
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
        
        {admins.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucun administrateur trouvé</p>
            <p className="text-gray-400 text-sm mt-1">Les administrateurs apparaîtront ici une fois ajoutés</p>
          </div>
        )}
      </div>
    </div>
  );
}