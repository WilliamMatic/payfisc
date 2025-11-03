import { Edit, X, Save, Loader2 } from 'lucide-react';
import { Serie as SerieType } from '@/services/plaques/plaqueService';

interface EditSerieModalProps {
  serie: SerieType;
  formData: { 
    nom_serie: string; 
    description: string;
  };
  processing: boolean;
  onClose: () => void;
  onFormDataChange: (data: { 
    nom_serie: string; 
    description: string;
  }) => void;
  onEditSerie: () => Promise<void>;
}

export default function EditSerieModal({
  serie,
  formData,
  processing,
  onClose,
  onFormDataChange,
  onEditSerie
}: EditSerieModalProps) {
  const handleNomSerieChange = (value: string) => {
    const uppercaseValue = value.toUpperCase().slice(0, 2);
    onFormDataChange({ ...formData, nom_serie: uppercaseValue });
  };

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
              <h3 className="text-lg font-semibold text-gray-800">Modifier la Série</h3>
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
            {/* CHAMP NOM SÉRIE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la série <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nom_serie}
                onChange={(e) => handleNomSerieChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors text-center text-lg font-bold uppercase"
                placeholder="AA"
                maxLength={2}
                disabled={processing}
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
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5B7A]/30 focus:border-[#2D5B7A] transition-colors resize-none"
                placeholder="Description optionnelle de la série..."
                rows={3}
                disabled={processing}
              />
            </div>

            {/* STATISTIQUES */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-gray-700 text-sm font-medium mb-2">Statistiques de la série :</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{serie.total_items}</div>
                  <div className="text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-green-600">{serie.items_disponibles}</div>
                  <div className="text-gray-500">Disponibles</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-red-600">{serie.items_utilises}</div>
                  <div className="text-gray-500">Utilisés</div>
                </div>
              </div>
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
              onClick={onEditSerie}
              disabled={!formData.nom_serie.trim() || formData.nom_serie.length !== 2 || processing}
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