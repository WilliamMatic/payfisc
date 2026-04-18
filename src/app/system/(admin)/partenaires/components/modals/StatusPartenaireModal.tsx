import { Eye, EyeOff, X, Loader2 } from 'lucide-react';
import { Partenaire as PartenaireType } from '@/services/banques/partenaireService';

interface StatusPartenaireModalProps {
  partenaire: PartenaireType;
  processing: boolean;
  onClose: () => void;
  onToggleStatus: () => Promise<void>;
}

export default function StatusPartenaireModal({
  partenaire,
  processing,
  onClose,
  onToggleStatus,
}: StatusPartenaireModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg mr-3 ${partenaire.actif ? 'bg-red-100' : 'bg-green-100'}`}>
              {partenaire.actif ? (
                <EyeOff className="w-5 h-5 text-red-600" />
              ) : (
                <Eye className="w-5 h-5 text-green-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {partenaire.actif ? 'Désactiver' : 'Activer'} le partenaire
              </h3>
              <p className="text-sm text-gray-500">Changer le statut</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" disabled={processing}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          <div className="text-center mb-6">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
              partenaire.actif ? 'bg-red-50' : 'bg-green-50'
            }`}>
              {partenaire.actif ? (
                <EyeOff className="w-6 h-6 text-red-500" />
              ) : (
                <Eye className="w-6 h-6 text-green-500" />
              )}
            </div>
            <p className="text-gray-600 mb-3">
              {partenaire.actif
                ? 'La désactivation empêchera ce partenaire de traiter des transactions.'
                : 'L\'activation permettra à ce partenaire de traiter des transactions.'}
            </p>
            <div className={`border rounded-lg p-3 ${
              partenaire.actif ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'
            }`}>
              <p className={`font-medium text-sm ${partenaire.actif ? 'text-red-800' : 'text-green-800'}`}>
                {partenaire.nom}
              </p>
            </div>
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
              onClick={onToggleStatus}
              disabled={processing}
              className={`flex items-center space-x-2 px-4 py-2.5 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium ${
                partenaire.actif
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : partenaire.actif ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span>
                {processing
                  ? 'Traitement...'
                  : partenaire.actif
                  ? 'Désactiver'
                  : 'Activer'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
