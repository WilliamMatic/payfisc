// app/type-engins/components/modals/DeleteTypeEnginModal.tsx
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { TypeEngin as TypeEnginType } from '@/services/type-engins/typeEnginService';

interface DeleteTypeEnginModalProps {
  typeEngin: TypeEnginType;
  processing: boolean;
  onClose: () => void;
  onDeleteTypeEngin: () => Promise<void>;
}

export default function DeleteTypeEnginModal({
  typeEngin,
  processing,
  onClose,
  onDeleteTypeEngin
}: DeleteTypeEnginModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Supprimer le Type d'Engin</h3>
          <button
            onClick={onClose}
            disabled={processing}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-3 text-amber-600 bg-amber-50 p-4 rounded-lg mb-4">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">Attention : Cette action est irréversible</p>
          </div>
          
          <p className="text-gray-700">
            Êtes-vous sûr de vouloir supprimer le type d'engin <strong>"{typeEngin.libelle}"</strong> ?
          </p>
          
          {typeEngin.description && (
            <p className="text-gray-600 text-sm mt-2">
              Description : {typeEngin.description}
            </p>
          )}
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
            onClick={onDeleteTypeEngin}
            disabled={processing}
            className="flex items-center space-x-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span>{processing ? 'Suppression...' : 'Supprimer'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}