import { AlertTriangle, X, Trash2, Loader2 } from 'lucide-react';
import { Partenaire as PartenaireType } from '@/services/banques/partenaireService';

interface DeletePartenaireModalProps {
  partenaire: PartenaireType;
  processing: boolean;
  onClose: () => void;
  onDeletePartenaire: () => Promise<void>;
}

export default function DeletePartenaireModal({
  partenaire,
  processing,
  onClose,
  onDeletePartenaire,
}: DeletePartenaireModalProps) {
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
              <h3 className="text-lg font-semibold text-gray-800">Supprimer le partenaire</h3>
              <p className="text-sm text-gray-500">Action irréversible</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" disabled={processing}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-gray-600 mb-3">
              Êtes-vous sûr de vouloir supprimer définitivement ce partenaire ?
            </p>
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
              <p className="text-red-800 font-medium text-sm">
                {partenaire.nom}
                {partenaire.code_banque && (
                  <span className="text-red-600"> ({partenaire.code_banque})</span>
                )}
              </p>
              {partenaire.bank_id && (
                <p className="text-red-700 text-xs mt-1">Bank ID: {partenaire.bank_id}</p>
              )}
            </div>
            <p className="text-red-600 text-xs font-medium">
              Cette action supprimera aussi toutes les clés API associées.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
              disabled={processing}
            >
              Annuler
            </button>
            <button
              onClick={onDeletePartenaire}
              disabled={processing}
              className="flex items-center space-x-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>{processing ? 'Suppression...' : 'Supprimer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
