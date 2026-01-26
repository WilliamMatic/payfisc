import { Eye, EyeOff, X, Loader2, Building, Percent } from 'lucide-react';
import { Taux as TauxType, AttributionTaux } from '@/services/taux/tauxService';

interface StatusTauxModalProps {
  taux: TauxType;
  attribution: AttributionTaux;
  processing: boolean;
  onClose: () => void;
  onToggleStatus: () => Promise<void>;
}

export default function StatusTauxModal({
  taux,
  attribution,
  processing,
  onClose,
  onToggleStatus
}: StatusTauxModalProps) {
  const getAttributionText = () => {
    if (attribution.province_nom) {
      return `${attribution.province_nom} - ${attribution.impot_nom}`;
    }
    return `Toutes provinces - ${attribution.impot_nom}`;
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg mr-3 ${
              attribution.actif ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {attribution.actif ? (
                <EyeOff className="w-5 h-5 text-red-600" />
              ) : (
                <Eye className="w-5 h-5 text-green-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {attribution.actif ? 'Désactiver' : 'Activer'} le taux
              </h3>
              <p className="text-sm text-gray-500">Changer le statut pour cette attribution</p>
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
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-center mb-2">
              <Percent className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-blue-800 font-medium">Taux :</span>
            </div>
            <p className="text-blue-700 font-semibold">{taux.nom}</p>
            <p className="text-blue-600 text-sm">{taux.valeur.toLocaleString('fr-FR')} CDF</p>
          </div>
          
          <div className="text-center mb-6">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
              attribution.actif ? 'bg-red-50' : 'bg-green-50'
            }`}>
              {attribution.actif ? (
                <EyeOff className="w-6 h-6 text-red-500" />
              ) : (
                <Eye className="w-6 h-6 text-green-500" />
              )}
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Building className="w-4 h-4 text-gray-500 mr-2" />
                <p className="text-gray-700 font-medium">Attribution :</p>
              </div>
              <p className="text-gray-800 font-semibold">
                {getAttributionText()}
              </p>
            </div>
            
            <p className="text-gray-600 mb-2">
              Êtes-vous sûr de vouloir {attribution.actif ? 'désactiver' : 'activer'} ce taux pour cette attribution ?
            </p>
            
            {attribution.actif && (
              <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg mt-3">
                <p className="text-yellow-700 text-sm">
                  ⚠️ Si vous désactivez ce taux, il ne sera plus utilisé pour cette combinaison.
                  Un autre taux pourra être activé à la place.
                </p>
              </div>
            )}
            
            {!attribution.actif && (
              <div className="p-3 bg-green-50 border border-green-100 rounded-lg mt-3">
                <p className="text-green-700 text-sm">
                  ✅ Activer ce taux désactivera automatiquement tout autre taux actif pour cette même combinaison.
                </p>
              </div>
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
                attribution.actif 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : attribution.actif ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span>{processing ? 'Traitement...' : attribution.actif ? 'Désactiver' : 'Activer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}