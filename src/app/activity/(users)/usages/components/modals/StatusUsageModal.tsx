import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import { UsageEngin as UsageEnginType } from '@/services/usages/usageService';

interface StatusUsageModalProps {
  usage: UsageEnginType;
  processing: boolean;
  onClose: () => void;
  onToggleStatus: () => Promise<void>;
}

export default function StatusUsageModal({
  usage,
  processing,
  onClose,
  onToggleStatus
}: StatusUsageModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onToggleStatus();
  };

  const newStatus = !usage.actif;
  const actionText = newStatus ? 'Activer' : 'Désactiver';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">{actionText} l'Usage</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className={`flex items-center space-x-3 p-4 rounded-lg mb-4 ${
              newStatus 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-orange-50 border border-orange-200'
            }`}>
              {newStatus ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
              )}
              <div>
                <p className={`font-medium text-sm ${
                  newStatus ? 'text-green-800' : 'text-orange-800'
                }`}>
                  {actionText} l'usage
                </p>
                <p className={`text-sm mt-1 ${
                  newStatus ? 'text-green-700' : 'text-orange-700'
                }`}>
                  {newStatus 
                    ? 'Cet usage sera à nouveau disponible dans le système.' 
                    : 'Cet usage ne sera plus disponible dans le système.'}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 text-sm">
                Êtes-vous sûr de vouloir {actionText.toLowerCase()} l'usage <strong>"{usage.libelle}"</strong> (Code: <strong>{usage.code}</strong>) ?
              </p>
              <p className="text-gray-600 text-xs mt-2">
                Statut actuel: <span className={`font-medium ${
                  usage.actif ? 'text-green-600' : 'text-red-600'
                }`}>
                  {usage.actif ? 'Actif' : 'Inactif'}
                </span>
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
              className={`px-4 py-2.5 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                newStatus 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {processing ? 'Traitement en cours...' : actionText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}