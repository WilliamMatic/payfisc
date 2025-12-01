import { Plus, X, Save, Loader2 } from 'lucide-react';
import { MarqueEngin as MarqueEnginType } from '@/services/marques-engins/marqueEnginService';

interface AddModeleModalProps {
  marque: MarqueEnginType;
  formData: { libelle: string; description: string; marque_engin_id: number };
  processing: boolean;
  onClose: () => void;
  onFormDataChange: (data: { libelle: string; description: string; marque_engin_id: number }) => void;
  onAddModele: () => Promise<void>;
}

export default function AddModeleModal({
  marque,
  formData,
  processing,
  onClose,
  onFormDataChange,
  onAddModele
}: AddModeleModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in-90 zoom-in-90 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* EN-TÊTE MODALE */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center">
            <div className="bg-purple-500 p-2 rounded-lg mr-3">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Nouveau Modèle</h3>
              <p className="text-sm text-gray-500">Ajouter un modèle pour {marque.libelle}</p>
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
            {/* INFO MARQUE */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Marque</p>
              <p className="font-medium text-gray-800">{marque.libelle}</p>
              <p className="text-xs text-gray-500">Type: {marque.type_engin_libelle}</p>
            </div>
            
            {/* CHAMP LIBELLÉ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Libellé du modèle <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.libelle}
                onChange={(e) => onFormDataChange({...formData, libelle: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-colors"
                placeholder="Ex: TVS100, Apache RTR 160, etc."
              />
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
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-colors resize-none"
                placeholder="Description du modèle (optionnel)"
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
              onClick={onAddModele}
              disabled={!formData.libelle.trim() || processing}
              className="flex items-center space-x-2 px-4 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
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