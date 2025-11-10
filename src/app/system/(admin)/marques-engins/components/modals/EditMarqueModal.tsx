import { Edit, X, Save, Loader2 } from 'lucide-react';
import { MarqueEngin as MarqueEnginType } from '@/services/marques-engins/marqueEnginService';
import { TypeEngin as TypeEnginType } from '@/services/type-engins/typeEnginService'; // Correction ici

interface EditMarqueModalProps {
  marque: MarqueEnginType;
  formData: { libelle: string; description: string; type_engin_id: number };
  typeEngins: TypeEnginType[];
  processing: boolean;
  onClose: () => void;
  onFormDataChange: (data: { libelle: string; description: string; type_engin_id: number }) => void;
  onEditMarque: () => Promise<void>;
}

export default function EditMarqueModal({
  marque,
  formData,
  typeEngins,
  processing,
  onClose,
  onFormDataChange,
  onEditMarque
}: EditMarqueModalProps) {
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
              <Edit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Modifier la Marque</h3>
              <p className="text-sm text-gray-500">Mettre à jour les informations</p>
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
        
        {/* CORPS DE LA MODALE */}
        <div className="p-5">
          <div className="space-y-4">
            {/* CHAMP LIBELLÉ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Libellé de la marque <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.libelle}
                onChange={(e) => onFormDataChange({...formData, libelle: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                placeholder="Ex: Yamaha, Toyota, Caterpillar"
                disabled={processing}
              />
            </div>
            
            {/* CHAMP TYPE D'ENGIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'engin <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type_engin_id}
                onChange={(e) => onFormDataChange({...formData, type_engin_id: parseInt(e.target.value)})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors"
                disabled={processing}
              >
                <option value={0}>Sélectionner un type d'engin</option>
                {typeEngins.map(type => (
                  <option key={type.id} value={type.id}>{type.libelle}</option>
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
                placeholder="Description de la marque (optionnel)"
                disabled={processing}
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
              onClick={onEditMarque}
              disabled={!formData.libelle.trim() || !formData.type_engin_id || processing}
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#2D5B7A] text-white rounded-lg hover:bg-[#234761] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{processing ? 'Enregistrement...' : 'Modifier'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}