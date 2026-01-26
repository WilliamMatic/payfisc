import { Star, X, Save, Loader2, Percent } from 'lucide-react';
import { Taux as TauxType, Impot as ImpotType } from '@/services/taux/tauxService';

interface DefautTauxModalProps {
  taux: TauxType;
  formData: { impot_id: string };
  impots: ImpotType[];
  processing: boolean;
  loadingImpotsProvinces: boolean;
  onClose: () => void;
  onFormDataChange: (data: { impot_id: string }) => void;
  onDefinirTauxDefaut: () => Promise<void>;
}

export default function DefautTauxModal({
  taux,
  formData,
  impots,
  processing,
  loadingImpotsProvinces,
  onClose,
  onFormDataChange,
  onDefinirTauxDefaut
}: DefautTauxModalProps) {
  // Filtrer les impôts qui n'ont pas déjà ce taux comme par défaut
  const impotsDisponibles = impots.filter(impot => {
    if (!taux.taux_defaut) return true;
    return !taux.taux_defaut.some(td => td.impot_id === impot.id);
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-[#153258] to-[#23A974] p-2 rounded-lg mr-3">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Taux par défaut</h3>
              <p className="text-sm text-gray-500">Définir comme taux par défaut</p>
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
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
            <div className="flex items-center mb-2">
              <Percent className="w-4 h-4 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-medium">Taux :</span>
            </div>
            <p className="text-yellow-700 font-semibold">{taux.nom}</p>
            <p className="text-yellow-600 text-sm">{taux.valeur.toLocaleString('fr-FR')} CDF</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Impôt <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.impot_id}
                onChange={(e) => onFormDataChange({...formData, impot_id: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors bg-white"
                disabled={processing || loadingImpotsProvinces}
              >
                <option value="">Sélectionner un impôt</option>
                {impotsDisponibles.map((impot) => (
                  <option key={impot.id} value={impot.id}>
                    {impot.nom}
                  </option>
                ))}
              </select>
              
              {/* Afficher les impôts où ce taux est déjà par défaut */}
              {taux.taux_defaut && taux.taux_defaut.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-700 text-sm font-medium mb-1">
                    Ce taux est déjà par défaut pour :
                  </p>
                  <ul className="text-blue-600 text-xs space-y-1">
                    {taux.taux_defaut.map((td) => (
                      <li key={td.id} className="flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        {td.impot_nom}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm">
                <span className="font-medium">Note :</span> Le taux par défaut sera utilisé 
                lorsqu'aucun taux spécifique n'est attribué à une province pour cet impôt.
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
              disabled={processing}
            >
              Annuler
            </button>
            <button
              onClick={onDefinirTauxDefaut}
              disabled={!formData.impot_id.trim() || processing || loadingImpotsProvinces}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Star className="w-4 h-4" />
              )}
              <span>{processing ? 'Définition...' : 'Définir comme par défaut'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}