// app/energies/components/modals/StatusEnergieModal.tsx
import { X, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Energie as EnergieType } from '@/services/energies/energieService';

interface StatusEnergieModalProps {
  energie: EnergieType;
  processing: boolean;
  onClose: () => void;
  onToggleStatus: () => Promise<void>;
}

export default function StatusEnergieModal({
  energie,
  processing,
  onClose,
  onToggleStatus
}: StatusEnergieModalProps) {
  const newStatus = !energie.actif;
  const statusText = newStatus ? 'activer' : 'désactiver';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${newStatus ? 'bg-green-100' : 'bg-red-100'}`}>
              {newStatus ? (
                <Eye className="w-5 h-5 text-green-600" />
              ) : (
                <EyeOff className="w-5 h-5 text-red-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              {newStatus ? 'Activer' : 'Désactiver'} l'Énergie
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={processing}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start space-x-4 p-4 bg-yellow-50 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-800 font-medium text-sm">Information</p>
              <p className="text-yellow-700 text-sm mt-1">
                {newStatus 
                  ? 'Les engins pourront à nouveau utiliser cette énergie.'
                  : 'Les engins ne pourront plus utiliser cette énergie.'
                }
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: energie.couleur }}
              ></div>
              <div>
                <p className="font-medium text-gray-900">{energie.nom}</p>
                <p className="text-gray-600 text-sm mt-1">
                  Statut actuel: <span className={`font-medium ${energie.actif ? 'text-green-600' : 'text-red-600'}`}>
                    {energie.actif ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              disabled={processing}
            >
              Annuler
            </button>
            <button
              onClick={onToggleStatus}
              disabled={processing}
              className={`px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium ${
                newStatus 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {processing ? 'Changement...' : `${newStatus ? 'Activer' : 'Désactiver'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}