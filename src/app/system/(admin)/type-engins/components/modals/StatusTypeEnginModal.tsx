// app/type-engins/components/modals/StatusTypeEnginModal.tsx
import { X, Eye, EyeOff } from 'lucide-react';
import { TypeEngin as TypeEnginType } from '@/services/type-engins/typeEnginService';

interface StatusTypeEnginModalProps {
  typeEngin: TypeEnginType;
  processing: boolean;
  onClose: () => void;
  onToggleStatus: () => Promise<void>;
}

export default function StatusTypeEnginModal({
  typeEngin,
  processing,
  onClose,
  onToggleStatus
}: StatusTypeEnginModalProps) {
  const newStatus = !typeEngin.actif;
  const statusText = newStatus ? 'activer' : 'désactiver';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">
            {newStatus ? 'Activer' : 'Désactiver'} le Type d'Engin
          </h3>
          <button
            onClick={onClose}
            disabled={processing}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
            {newStatus ? (
              <Eye className="w-8 h-8 text-green-600" />
            ) : (
              <EyeOff className="w-8 h-8 text-red-600" />
            )}
          </div>
          
          <p className="text-center text-gray-700">
            Êtes-vous sûr de vouloir <strong>{statusText}</strong> le type d'engin <strong>"{typeEngin.libelle}"</strong> ?
          </p>
          
          <p className="text-center text-gray-600 text-sm mt-2">
            {newStatus 
              ? 'Il sera à nouveau disponible dans le système.' 
              : 'Il ne sera plus disponible dans les listes déroulantes.'
            }
          </p>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onToggleStatus}
            disabled={processing}
            className={`flex items-center space-x-2 px-4 py-2.5 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              newStatus 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {newStatus ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>{processing ? 'Changement...' : (newStatus ? 'Activer' : 'Désactiver')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}