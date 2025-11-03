import { Eye, EyeOff, X, Loader2 } from 'lucide-react';
import { Serie as SerieType } from '@/services/plaques/plaqueService';

interface StatusSerieModalProps {
  serie: SerieType;
  processing: boolean;
  onClose: () => void;
  onToggleStatus: () => Promise<void>;
}

export default function StatusSerieModal({
  serie,
  processing,
  onClose,
  onToggleStatus
}: StatusSerieModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg mr-3 ${
              serie.actif ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {serie.actif ? (
                <EyeOff className="w-5 h-5 text-red-600" />
              ) : (
                <Eye className="w-5 h-5 text-green-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {serie.actif ? 'Désactiver' : 'Activer'} la série
              </h3>
              <p className="text-sm text-gray-500">Changer le statut d'accès</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={processing}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-5">
          <div className="text-center mb-6">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
              serie.actif ? 'bg-red-50' : 'bg-green-50'
            }`}>
              {serie.actif ? (
                <EyeOff className="w-6 h-6 text-red-500" />
              ) : (
                <Eye className="w-6 h-6 text-green-500" />
              )}
            </div>
            <p className="text-gray-600 mb-2">
              Êtes-vous sûr de vouloir {serie.actif ? 'désactiver' : 'activer'} cette série ?
            </p>
            <p className="text-gray-800 font-medium text-lg">
              {serie.nom_serie}
            </p>
            {serie.actif && (
              <p className="text-red-600 text-xs mt-2 font-medium">
                ⚠️ Les plaques de cette série ne pourront plus être utilisées
              </p>
            )}
            {!serie.actif && (
              <p className="text-green-600 text-xs mt-2 font-medium">
                ✅ Les plaques de cette série pourront à nouveau être utilisées
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-center space-x-3 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium flex-1"
              disabled={processing}
            >
              Annuler
            </button>
            <button
              onClick={onToggleStatus}
              disabled={processing}
              className={`flex items-center justify-center space-x-2 px-4 py-2.5 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex-1 ${
                serie.actif 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : serie.actif ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span>{processing ? 'Traitement...' : serie.actif ? 'Désactiver' : 'Activer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}