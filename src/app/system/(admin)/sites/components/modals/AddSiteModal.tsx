import { Plus, X, Save, Loader2 } from 'lucide-react';
import { Province as ProvinceType } from '@/services/sites/siteService';

interface AddSiteModalProps {
  formData: { nom: string; code: string; description: string; formule: string; province_id: number };
  provinces: ProvinceType[];
  processing: boolean;
  onClose: () => void;
  onFormDataChange: (data: { nom: string; code: string; description: string; formule: string; province_id: number }) => void;
  onAddSite: () => Promise<void>;
}

export default function AddSiteModal({
  formData,
  provinces,
  processing,
  onClose,
  onFormDataChange,
  onAddSite
}: AddSiteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* EN-TÊTE MODALE */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center">
            <div className="bg-[#2D5B7A] p-2 rounded-lg mr-3">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Nouveau Site</h3>
              <p className="text-sm text-gray-500">Ajouter un nouveau site</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* CORPS DE LA MODALE */}
        <div className="p-5">
          <div className="space-y-4">
            {/* LIGNE NOM ET CODE EN 6-6 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CHAMP NOM */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du site <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => onFormDataChange({...formData, nom: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                  placeholder="Ex: Site A"
                />
              </div>
              
              {/* CHAMP CODE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => onFormDataChange({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                  placeholder="Ex: SA"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">Maximum 10 caractères</p>
              </div>
            </div>
            
            {/* CHAMP PROVINCE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Province <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.province_id}
                onChange={(e) => onFormDataChange({...formData, province_id: parseInt(e.target.value)})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
              >
                <option value={0}>Sélectionner une province</option>
                {provinces.map(p => (
                  <option key={p.id} value={p.id}>{p.nom}</option>
                ))}
              </select>
            </div>
            
            {/* CHAMP DESCRIPTION */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => onFormDataChange({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors resize-none"
                placeholder="Description du site (optionnel)"
              />
            </div>

            {/* CHAMP FORMULE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formule
              </label>
              <input
                type="text"
                value={formData.formule}
                onChange={(e) => onFormDataChange({...formData, formule: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                placeholder="Ex: Formule de calcul (optionnel)"
              />
            </div>
          </div>
          
          {/* PIED DE PAGE */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
              disabled={processing}
            >
              Annuler
            </button>
            <button
              onClick={onAddSite}
              disabled={!formData.nom.trim() || !formData.code.trim() || !formData.province_id || processing}
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#2D5B7A] text-white rounded-lg hover:bg-[#234761] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{processing ? 'Traitement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}