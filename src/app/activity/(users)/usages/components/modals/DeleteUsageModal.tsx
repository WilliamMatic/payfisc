import { X, AlertTriangle } from 'lucide-react';
import { UsageEngin as UsageEnginType } from '@/services/usages/usageService';

interface DeleteUsageModalProps {
  usage: UsageEnginType;
  processing: boolean;
  onClose: () => void;
  onDeleteUsage: () => Promise<void>;
}

export default function DeleteUsageModal({
  usage,
  processing,
  onClose,
  onDeleteUsage
}: DeleteUsageModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDeleteUsage();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Supprimer l'Usage</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium text-sm">Attention</p>
                <p className="text-red-700 text-sm mt-1">
                  Cette action est irréversible. L'usage sera définitivement supprimé du système.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 text-sm">
                Êtes-vous sûr de vouloir supprimer l'usage <strong>"{usage.libelle}"</strong> (Code: <strong>{usage.code}</strong>) ?
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Suppression en cours...' : 'Supprimer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}