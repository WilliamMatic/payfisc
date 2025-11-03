import { Key, X, Loader2 } from 'lucide-react';
import { Admin as AdminType } from '@/services/admins/adminService';

interface PasswordAdminModalProps {
  admin: AdminType;
  processing: boolean;
  onClose: () => void;
  onResetPassword: () => Promise<void>;
}

export default function PasswordAdminModal({
  admin,
  processing,
  onClose,
  onResetPassword
}: PasswordAdminModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center">
            <div className="bg-orange-100 p-2 rounded-lg mr-3">
              <Key className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Réinitialiser le mot de passe</h3>
              <p className="text-sm text-gray-500">Générer un nouveau mot de passe</p>
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
            <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-6 h-6 text-orange-500" />
            </div>
            <p className="text-gray-600 mb-2">
              Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet administrateur ?
            </p>
            <p className="text-gray-800 font-medium">
              {admin.nom_complet} <span className="text-gray-400">({admin.email})</span>
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
              <p className="text-orange-800 text-sm font-medium">
                ⚠️ Information importante
              </p>
              <p className="text-orange-700 text-xs mt-1">
                Un nouveau mot de passe à 4 chiffres sera généré et affiché après confirmation.
              </p>
            </div>
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
              onClick={onResetPassword}
              disabled={processing}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex-1"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Key className="w-4 h-4" />
              )}
              <span>{processing ? 'Traitement...' : 'Réinitialiser'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}