// app/couleurs/components/modals/DeleteCouleurModal.tsx
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { EnginCouleur as EnginCouleurType } from '@/services/couleurs/couleurService';

interface DeleteCouleurModalProps {
  couleur: EnginCouleurType;
  processing: boolean;
  onClose: () => void;
  onDeleteCouleur: () => Promise<void>;
}

export default function DeleteCouleurModal({
  couleur,
  processing,
  onClose,
  onDeleteCouleur
}: DeleteCouleurModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDeleteCouleur();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Supprimer la couleur</h2>
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
          <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg mb-6">
            <div 
              className="w-10 h-10 rounded-full border border-red-200 shadow-sm"
              style={{ backgroundColor: couleur.code_hex }}
            />
            <div className="flex-1">
              <p className="font-medium text-red-800">Confirmer la suppression</p>
              <p className="text-sm text-red-700 mt-1">
                Êtes-vous sûr de vouloir supprimer la couleur <strong>"{couleur.nom}"</strong> ? 
                Cette action est irréversible.
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
              className="flex items-center space-x-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {processing && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{processing ? 'Suppression...' : 'Supprimer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}