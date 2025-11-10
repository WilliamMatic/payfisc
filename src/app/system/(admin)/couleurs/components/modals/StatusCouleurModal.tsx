// app/couleurs/components/modals/StatusCouleurModal.tsx
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { EnginCouleur as EnginCouleurType } from '@/services/couleurs/couleurService';

interface StatusCouleurModalProps {
  couleur: EnginCouleurType;
  processing: boolean;
  onClose: () => void;
  onToggleStatus: () => Promise<void>;
}

export default function StatusCouleurModal({
  couleur,
  processing,
  onClose,
  onToggleStatus
}: StatusCouleurModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onToggleStatus();
  };

  const newStatus = !couleur.actif;
  const statusText = newStatus ? 'activer' : 'désactiver';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${newStatus ? 'bg-green-50' : 'bg-yellow-50'}`}>
              {newStatus ? (
                <Eye className="w-5 h-5 text-green-600" />
              ) : (
                <EyeOff className="w-5 h-5 text-yellow-600" />
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              {newStatus ? 'Activer la couleur' : 'Désactiver la couleur'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={processing}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg mb-6">
            <div 
              className="w-12 h-12 rounded-full border border-gray-200 shadow-sm"
              style={{ backgroundColor: couleur.code_hex }}
            />
            <div className="flex-1">
              <p className="font-medium text-gray-800">Confirmer le changement de statut</p>
              <p className="text-sm text-gray-700 mt-1">
                Êtes-vous sûr de vouloir <strong>{statusText}</strong> la couleur 
                <strong> "{couleur.nom}"</strong> ?
                {!newStatus && ' Les engins utilisant cette couleur ne pourront plus être sélectionnés.'}
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              disabled={processing}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={processing}
              className={`flex items-center space-x-2 px-4 py-2.5 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium ${
                newStatus ? 'bg-green-600' : 'bg-yellow-600'
              }`}
            >
              {processing && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {processing ? 'Changement...' : newStatus ? 'Activer' : 'Désactiver'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}