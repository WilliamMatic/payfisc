import { Link, X, Save, Loader2, Building, Percent } from 'lucide-react';
import { Taux as TauxType, Impot as ImpotType, Province as ProvinceType } from '@/services/taux/tauxService';

interface AttributionTauxModalProps {
  taux: TauxType;
  formData: { province_id: string; impot_id: string; actif: boolean };
  impots: ImpotType[];
  provinces: ProvinceType[];
  processing: boolean;
  loadingImpotsProvinces: boolean;
  onClose: () => void;
  onFormDataChange: (data: { province_id: string; impot_id: string; actif: boolean }) => void;
  onAttribuerTaux: () => Promise<void>;
}

export default function AttributionTauxModal({
  taux,
  formData,
  impots,
  provinces,
  processing,
  loadingImpotsProvinces,
  onClose,
  onFormDataChange,
  onAttribuerTaux
}: AttributionTauxModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-[#153258] to-[#23A974] p-2 rounded-lg mr-3">
              <Link className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Attribuer le Taux</h3>
              <p className="text-sm text-gray-500">Associer à une province et un impôt</p>
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
              <span className="text-blue-800 font-medium">Taux à attribuer :</span>
            </div>
            <p className="text-blue-700 font-semibold">{taux.nom}</p>
            <p className="text-blue-600 text-sm">{taux.valeur.toLocaleString('fr-FR')} CDF</p>
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
                {impots.map((impot) => (
                  <option key={impot.id} value={impot.id}>
                    {impot.nom}
                  </option>
                ))}
              </select>
              {loadingImpotsProvinces && (
                <p className="text-gray-500 text-xs mt-1">Chargement des impôts...</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Province
              </label>
              <select
                value={formData.province_id}
                onChange={(e) => onFormDataChange({...formData, province_id: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153258]/30 focus:border-[#153258] transition-colors bg-white"
                disabled={processing || loadingImpotsProvinces}
              >
                <option value="">Toutes les provinces (par défaut)</option>
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.nom} ({province.code})
                  </option>
                ))}
              </select>
              <p className="text-gray-500 text-xs mt-1">
                Laisser vide pour appliquer à toutes les provinces
              </p>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="actif"
                checked={formData.actif}
                onChange={(e) => onFormDataChange({...formData, actif: e.target.checked})}
                className="h-4 w-4 text-[#153258] focus:ring-[#153258] border-gray-300 rounded"
                disabled={processing}
              />
              <label htmlFor="actif" className="ml-2 block text-sm text-gray-700">
                Rendre ce taux actif pour cette combinaison
              </label>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm">
                <span className="font-medium">Note :</span> Un seul taux peut être actif 
                pour chaque combinaison province/impôt. Activer ce taux désactivera 
                automatiquement le précédent taux actif.
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
              onClick={onAttribuerTaux}
              disabled={!formData.impot_id.trim() || processing || loadingImpotsProvinces}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#153258] to-[#23A974] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link className="w-4 h-4" />
              )}
              <span>{processing ? 'Attribution...' : 'Attribuer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}