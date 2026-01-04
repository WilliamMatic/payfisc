// app/energies/components/modals/DeleteEnergieModal.tsx
import { X, Zap, AlertTriangle } from 'lucide-react';
import { Energie as EnergieType } from '@/services/energies/energieService';

interface DeleteEnergieModalProps {
  energie: EnergieType;
  processing: boolean;
  onClose: () => void;
  onDeleteEnergie: () => Promise<void>;
}

export default function DeleteEnergieModal({
  energie,
  processing,
  onClose,
  onDeleteEnergie
}: DeleteEnergieModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Supprimer l'Énergie</h3>
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
          <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg mb-6">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium text-sm">Attention</p>
              <p className="text-red-700 text-sm mt-1">
                Cette action est irréversible. L'énergie sera définitivement supprimée.
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
                {energie.description && (
                  <p className="text-gray-600 text-sm mt-1">{energie.description}</p>
                )}
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
              onClick={onDeleteEnergie}
              disabled={processing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {processing ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}