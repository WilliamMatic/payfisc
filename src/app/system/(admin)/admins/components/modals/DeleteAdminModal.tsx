import { AlertTriangle, X, Trash2, Loader2 } from 'lucide-react';
import { Admin as AdminType } from '@/services/admins/adminService';

interface DeleteAdminModalProps {
  admin: AdminType;
  processing: boolean;
  onClose: () => void;
  onDeleteAdmin: () => Promise<void>;
}

export default function DeleteAdminModal({
  admin,
  processing,
  onClose,
  onDeleteAdmin
}: DeleteAdminModalProps) {
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 rounded-lg mr-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Supprimer l'administrateur</h3>
              <p className="text-sm text-gray-500">Action irréversible</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={processing}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-5">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-gray-600 mb-3">
              Êtes-vous sûr de vouloir supprimer définitivement cet administrateur ?
            </p>
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
              <p className="text-red-800 font-medium text-sm">
                {admin.nom_complet}
              </p>
              <p className="text-red-700 text-xs mt-1">
                {admin.email} • {getRoleLabel(admin.role)}
              </p>
              {admin.province_nom && (
                <p className="text-red-600 text-xs mt-1">
                  Province: {admin.province_nom}
                </p>
              )}
            </div>
            <p className="text-red-600 text-xs font-medium">
              ⚠️ Cette action ne peut pas être annulée
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-3 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium flex-1"
              disabled={processing}
            >
              Annuler
            </button>
            <button
              onClick={onDeleteAdmin}
              disabled={processing}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex-1"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>{processing ? 'Suppression...' : 'Supprimer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}